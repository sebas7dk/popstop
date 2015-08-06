<?php
/**
 * PopStop is a PHP script that let's you stream your
 * movie collection to your browser.
 *
 * This software is distributed under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Visit http://www.popstop.io for more information
 *
 * @author Sebastian de Kok
 */
abstract class BaseController {
    /**
     * @var \TMDB
     */
    protected $tmdb;

    /**
     * @var string
     */
    protected $cookie_name = '_popstop';

    /**
     * @var int
     */
    protected $batch = 18;

    /**
     * @var int
     */
    protected $cost = 8;

    /**
     * @var int
     */
    protected $auto_update = 0;

    /**
     * @var int
     */
    protected $auto_clean = 0;


    public function __construct() {
        /** @var \Scan $scan */
        $this->scan = new Scan;
        /** @var \DBlite $scan */
        $this->db = new DBlite();
    }

    /**
     * Check if the database exist and if
     * it has to be updated.
     *
     * @return array
     */
    public function isInstalled() {
        $is_installed = false;
        $is_updated = true;
        $password = false;
        $is_clean = false;

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
            if($total_movies > $total_files &&  $settings['auto_clean']) {
                $is_clean = true;
            }
        }
        return [
            'is_installed' => $is_installed,
            'total_files' => $total_files,
            'is_updated' => $is_updated,
            'is_clean' => $is_clean,
            'password' => $password
        ];
    }


    /**
     * Check if the inserted key is valid
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
     * Store the key in the database
     *
     * @param array $params
     * @return array
     */
    public function saveApiKey($params) {

        $this->createTables();

        $settings = [
            'api_key' => $params['key'],
            'batch' => $this->batch,
            'auto_update' => $this->auto_update,
            'auto_clean' => $this->auto_clean,
        ];

        $this->db->insert('settings', $settings);

        return ['saved' =>  true];

    }


    /**
     * Count all the movie files in the content folder
     *
     * @return int
     */
    public function getTotalFiles() {
        return count($this->scan->getFiles());
    }

    /**
     * Count all the movies in the database
     *
     * @return array
     */
    public function getInserted() {
        $result = $this->db->fetch('SELECT COUNT(*) AS total FROM movies', true);

        return ['inserted' =>  $result['total']];

    }

    /**
     * Fetch the settings from the database
     *
     * @return array
     */
    public function getSettings() {
        return $this->db->fetch('SELECT * FROM settings', true);
    }

    /**
     * Update the settings in the database
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
     * Verify if the password is equal to the password in the database
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
     * Insert all the movie files in the content folder
     *
     * @return array
     */
    public function installFiles()
    {
        $this->resetTables();

        $not_found = [];
        foreach($this->scan->getFiles() as $file) {
            $movie = $this->getMovieByFileName($file);
            if ($movie) {
                $movie_exists = $this->checkIfFileExists($movie['id']);
                if(!$movie_exists) {
                    $this->insertMovieData($movie, $file);
                    sleep(1);
                }
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
     * Update the movies in the database
     *
     * @return array
     */
    public function updateFiles()
    {
        $path = $this->db->fetch("SELECT movie_id, target FROM files", false, true);

        $not_found = [];
        $count = 0;
        foreach($this->scan->getFiles() as $file) {
            if(!in_array($file['target'], array_values($path))) {
                $movie = $this->getMovieByFileName($file);
                if ($movie) {
                    $movie_exists = $this->checkIfFileExists($movie['id']);
                    if(!$movie_exists) {
                        $this->insertMovieData($movie, $file);
                        $count++;
                    } else {
//                        $this->db->bind([
//                            "target" => $file['target'],
//                            "path" => $file['path'],
//                            "movie_id" => $movie['id']
//                        ]);
//
//                        $this->db->update("UPDATE files SET target = :target, path = :path WHERE movie_id = :movie_id");
                    }
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
     * Fetch the movie information from the TMDB api
     *
     * @param array $file
     * @return array|boolean
     */
    protected function getMovieByFileName($file) {

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
     * Count all the movies in the database
     *
     * @return array
     */
    protected function checkIfFileExists($id) {
        $this->db->bind(["id" => $id]);
        $file = $this->db->fetch("SELECT * FROM files WHERE movie_id = :id", true);

        return $file;

    }

    /**
     * Prepare and insert the movie data
     *
     * @param array $info
     * @param array $file
     * @return array
     */
    protected function insertMovieData(array $info, array $file) {
        $casts = $this->tmdb->getCast($info['id']);

        $movie = [
            'movie_id' => $info['id'],
            'title' => $info['title'],
            'tagline' => $info['tagline'],
            'overview' => $info['overview'],
            'budget' => $info['budget'],
            'revenue' => $info['revenue'],
            'runtime' => $info['runtime'],
            'poster_path' => $this->tmdb->getImageUrl($info['poster_path'], 'w342'),
            'backdrop_path' => $this->tmdb->getImageUrl($info['backdrop_path'], 'original'),
            'cover_path' => $this->tmdb->getImageUrl($info['backdrop_path'], 'w1280'),
            'release_date' => $info['release_date'],
            'popularity' => $info['popularity'],
            'vote_average' => $info['vote_average'],
            'vote_count' => $info['vote_count'],
            'genres' => $this->getGenres($info['genres']),
            'casts'  => $this->getCastIds($casts),
            'stars' => $this->calculateStars($info['vote_average']),
        ];

        $file = [
            'movie_id' => $info['id'],
            'path' => $file['path'],
            'target' => $file['target'],
            'created_at' => $file['date']
        ];

        $this->db->insert('movies', $movie);
        $this->db->insert('files', $file);

        foreach ($casts as $cast) {
            $this->db->insert('casts',
                [
                    'cast_id' => $cast['id'],
                    'name' => $cast['name'],
                    'character' => $cast['character'],
                    'profile_path' => ($cast['profile_path']) ? $this->tmdb->getImageUrl($cast['profile_path'], 'w185') : '',
                    'cast_order' => $cast['order']
                ]
            );

        }

    }

    /**
     * Create the tables in the database
     *
     * @return void
     */
    private function createTables() {
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
                       casts,
                       stars,
                       resume_at
                 );

                CREATE TABLE IF NOT EXISTS casts (
                       cast_id INTEGER PRIMARY KEY,
                       name VARCHAR,
                       character VARCHAR,
                       profile_path VARCHAR,
                       cast_order INTEGER
                );

                CREATE TABLE IF NOT EXISTS files (
                       movie_id INTEGER PRIMARY KEY,
                       path VARCHAR,
                       target VARCHAR,
                       created_at DATETIME
                );

                CREATE TABLE IF NOT EXISTS settings (
                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                       api_key VARCHAR,
                       password VARCHAR,
                       auto_update INTEGER,
                       auto_clean INTEGER,
                       batch INTEGER
                );
            ");
    }

    /**
     * TRUNCATE the database tables
     *
     * @return void
     */
    protected function resetTables() {
        $this->db->query('DELETE FROM movies; DELETE FROM files; DELETE FROM casts');
    }

    /**
     * Create a string with all the movie genres
     *
     * @param array $genresArray
     * @return string
     */
    protected function getGenres($genresArray) {

        $genres = [];
        foreach($genresArray as $genre) {
            $genres[] = $genre["name"];
        }

        return implode(",", $genres);
    }

    /**
     * Create a string with all the movie cast
     *
     * @param array $castArray
     * @return string
     */
    protected function getCastIds($castArray) {

        $casts = [];
        foreach($castArray as $cast) {
            $casts[] = $cast["id"];
        }

        return implode(",", $casts);
    }

    /**
     * Calculate a five star rating from the vote average
     *
     * @param int $vote_average
     * @return string
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
     * Encrypt the password string
     *
     * @param string $password
     * @return string
     */
    protected function bCrypt($password)
    {
        $salt = substr(str_replace('+', '.', base64_encode(pack('N4', mt_rand(), mt_rand(), mt_rand(), mt_rand()))), 0, 22);
        $hash_format = '$2a$'. $this->cost.'$'.$salt;

        // return the hash
        return crypt($password, $hash_format);
    }

    /**
     * GET|SET|DELETE a cookie
     *
     * @param string $action
     * @return string|void
     */
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
