<?php

/**
 * Description of KinoController
 *
 * @author sebastian
 */
class BaseController {
    
        /**
        * The API-key
        *
        * @var string
        */
       protected $scan;

        /**
         * The API-key
         *
         * @var string
         */
       protected $response;

        /**
         * Stored Session Id
         *
         * @var string
         */
        protected $tmdb;
       
        /**
        * Stored Session Id
        *
        * @var string
        */
       protected $db;


        protected $cost = 6;

    protected $cookie_name = 'movit_cookie';

                 /**
        * Stored Session Id
        *
        * @var string
        */
       protected $batch = 18;
       
         /**
         * Constructs the new object. Requires a cache path to be given.
         */
        public function __construct()
        {
            $this->scan = new Scan;
            $this->response = new Response;
            $this->db = new DBlite();
        }


        public function isInstalled() {
            $is_installed = false;
            $is_updated = true;
            $password = false;

            $total_files = $this->getTotalFiles();

            if(filesize(getcwd() . "/" . $this->db->getPath()) > 0) {
                $settings = $this->getSettings();
                $total_movies = $this->getInserted()['inserted'];

                if(!empty($settings['password']) && !$this->cookies('get')) {
                    $password = true;
                }

                if($total_files > $total_movies && $settings['auto_update'] ) {
                    $is_updated = false;
                }

                if($total_movies > 0) {
                    $is_installed = true;
                }

            }

            return [
                        'is_installed' => $is_installed,
                        'total_files' => $total_files,
                        'is_updated' => $is_updated,
                        'password' => $password
                    ];
        }


        /**
         * Get all the movie files and count the total
         *
         * @param array $params
         * @return array
         */
        public function confirmApiKey($params) {
            $tmdb = new TMDB($params['key']);
            $confirm = $tmdb->getStatuscode();

            if(!empty($confirm['status_code']) && $confirm['status_code'] === 7) {
                $status = false;
            } else {
                $status = true;
            }

            return ['status' =>  $status];

        }

        /**
         * Get all the movie files and count the total
         *
         * @param array $params
         * @return array
         */
        public function saveApiKey($params) {

            $this->createTables();

            $settings = [
                'api_key' => $params['key'],
                'batch' => $this->batch,
                'auto_update' => 1,
            ];

            $this->db->insert('settings', $settings);

            return ['saved' =>  true];

        }


        /**
         * Get all the movie files and count the total
         *
         * @param array $params
         * @return array
         */
        public function getTotalFiles() {

            return count($this->scan->files());

        }

        /**
         * Get all the movie files and count the total
         *
         * @param array $params
         * @return array
         */
        public function getInserted() {
            $result = $this->db->fetch('SELECT COUNT(*) AS total FROM movies', true);

            return ['inserted' =>  $result['total']];

        }

        /**
         * Get all the movie files and count the total
         *
         * @param array $params
         * @return array
         */
        public function getSettings() {
            return $this->db->fetch('SELECT * FROM settings', true);
        }

        /**
         * Get all the movie files and count the total
         *
         * @param array $params
         * @return array
         */
        public function updateSettings($params) {

            foreach($params['settings'] as $column => $value) {
                if($column == 'password') {
                    $value = $this->bCrypt($value);
                    $this->cookies('delete');
                }

                $this->db->bind(["value" => $value]);
                $this->db->update("UPDATE settings SET $column = :value");
            }

            return ['updated' =>  true];
        }

    /**
     * Get all the movie files and count the total
     *
     * @param array $params
     * @return array
     */
    public function verifyPassword($params) {
        $correct = false;
        $password = $params['password'];
        $stored_password = $this->getSettings()['password'];

        if($this->bCrypt($password) == $stored_password) {
            $correct = true;
            $this->cookies('set');
        }

        return ['correct' => $correct];
    }

    /**
      * Insert all the listed movies in the directories
      *
      * @param array $params
      * @return array
      */
     public function installFiles()
     {
        $this->resetTables();

        $not_found = [];
        foreach($this->scan->files() as $file) {
              $movie = $this->getMovieByFileName($file);
              if ($movie) {
                  $data = $this->createArraysToInsert($movie, $file);
                  $this->db->insert('movies', $data['movie']);
                  $this->db->insert('files', $data['file']);
                  sleep(1);
              } else {
                  $not_found[] = ["file" => $file['name']];
              }
        }
        if ($not_found) {
            $not_found_response = ['not_found' => true, 'files' => $not_found];
        }

         return (isset($not_found_response)) ? $not_found_response : ['installed' => true];
     }

    /**
     * Insert all the listed movies in the directories
     *
     * @return array
     */
    public function updateFiles()
    {
        $path = $this->db->fetch("SELECT movie_id, path FROM files", false, true);

        $not_found = [];
        $count = 0;
        foreach($this->scan->files() as $file) {
            if(!in_array($file['target'], array_values($path))) {
                $movie = $this->getMovieByFileName($file);
                if ($movie) {
                    $data = $this->createArraysToInsert($movie, $file);
                    $this->db->insert('movies', $data['movie']);
                    $this->db->insert('files', $data['file']);
                    sleep(1);
                    $count++;
                } else {
                    $not_found[] = ["file" => $file['name']];
                }
            }
        }
        if ($not_found) {
            $response = ['not_found' => true, 'files' => $not_found];
        }

        if (!$not_found && $count == 0) {
            $response = ['updated' => false];
        }

        return (isset($response)) ? $response : ['updated' => true];
    }

    /**
     * Insert all the listed movies in the directories
     *
     * @param array $params
     * @return array
     */
    private function getMovieByFileName($file) {

        $search = $file['search_name'];
        if(preg_match('/(19|20)[0-9][0-9]/', $search, $match)) {
            $year = $match[0];
            $search = str_replace($match[0], '', $search);
        }

        $this->tmdb = new TMDB($this->getSettings()['api_key']);
        $search = $this->tmdb->search($search, "movie", (isset($year)) ? $year : '');

        if (isset($search['results']) && $search['total_results'] > 0) {
            $result = $search['results'][0];
            $movie = $this->tmdb->getById($result['id']);
        }

        return (isset($movie)) ? $movie : false;
    }
    /**
     * Insert all the listed movies in the directories
     *
     * @param array $params
     * @return array
     */
    private function createArraysToInsert(array $info, array $file) {

        $movie = [
            'movie_id' => $info['id'],
            'title' => $info['title'],
            'tagline' => $info['tagline'],
            'overview' => $info['overview'],
            'budget' => $info['budget'],
            'revenue' => $info['revenue'],
            'runtime' => $info['runtime'],
            'poster_path' => $this->tmdb->getImageUrl($info['poster_path'], 'w185'),
            'backdrop_path' => $this->tmdb->getImageUrl($info['backdrop_path'], 'original'),
            'cover_path' => $this->tmdb->getImageUrl($info['backdrop_path'], 'w1280'),
            'release_date' => $info['release_date'],
            'popularity' => $info['popularity'],
            'vote_average' => $info['vote_average'],
            'vote_count' => $info['vote_count'],
            'genres' => $this->getGenres($info['genres']),
            'stars' => $this->calculateStars($info['vote_average']),
        ];

        $file = [
            'movie_id' => $info['id'],
            'path' => $file['target'],
            'created_at' => $file['date']
        ];

        return ['movie' => $movie, 'file' => $file];
    }

      /**
      * Create a new table in the database to store the movies
      *
      * @return void
      */
     private function createTables()
     {
            $this->db->query("
                 CREATE VIRTUAL TABLE IF NOT EXISTS movies USING fts4 (
                       movie_id,
                       title,
                       tagline,
                       overview,
                       budget,
                       revenue,
                       runtime,
                       poster_path,
                       backdrop_path,
                       cover_path,
                       release_date,
                       popularity,
                       vote_average,
                       vote_count,
                       genres,
                       stars
                 );

                CREATE TABLE IF NOT EXISTS files (
                       movie_id INTEGER,
                       path VARCHAR,
                       created_at DATETIME
                );

                CREATE TABLE IF NOT EXISTS settings (
                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                       api_key VARCHAR,
                       password VARCHAR,
                       auto_update INTEGER,
                       batch INTEGER
                );
            ");
     }

    /**
     * Get all the movie files and count the total
     *
     * @param array $params
     * @return array
     */
    protected function resetTables() {
        $this->db->query('DELETE FROM movies; DELETE FROM files');
    }

    /**
     * Get all the movie files and count the total
     *
     * @param array $params
     * @return array
     */
    protected function getGenres($genresArray) {

        $genres = [];
        foreach($genresArray as $genre) {
            $genres[] = $genre["name"];
        }

        return implode(",", $genres);
    }

    /**
     * Get all the movie files and count the total
     *
     * @param array $params
     * @return array
     */
    protected function getCasts($castArray) {

        $casts = [];
        foreach($castArray as $cast) {
            $casts[] = $casts["name"];
        }

        return implode(",", $casts);
    }

    /**
     * Get all the movie files and count the total
     *
     * @param array $params
     * @return array
     */
    protected function calculateStars($vote_average) {
        $rating = ($vote_average / 2);
        $round_rating =  round($rating * 2) / 2;

        $full_stars = floor($round_rating);
        $half_star =  (($round_rating - (int) $round_rating) == 0.5) ? 1 : 0;
        $empty_stars = 5 - ceil($round_rating);

        return "$full_stars/$half_star/$empty_stars";
    }


    /**
     * Get all the movie files and count the total
     *
     * @param array $params
     * @return array
     */
    protected function bCrypt($password)
    {
        $salt = substr(str_replace('+', '.', base64_encode(pack('N4', mt_rand(), mt_rand(), mt_rand(), mt_rand()))), 0, 22);
        $hash_format = '$2a$'. $this->cost.'$'.$salt;

        // return the hash
        return crypt($password, $hash_format);
    }

    protected function cookies($action) {
        switch($action) {
            case 'get':
                return isset($_COOKIE[$this->cookie_name]);
                break;
            case 'set':
                setcookie($this->cookie_name, time() ,time() + (86400 * 7)); // 86400 = 1 day
                break;
            case 'delete':
                unset($_COOKIE[$this->cookie_name]);
                setcookie($this->cookie_name, '', time() - 3600);
                break;
        }

    }


}
