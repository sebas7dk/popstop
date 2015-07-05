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
class MovieController extends BaseController {

    /**
     * Get a movie from the database by ID
     *
     * @param array $params
     * @return array
     */
    public function getMovieById($params) {
        $this->db->bind(["id" => $params['id']]);
        $movie =  $this->db->fetch("SELECT * FROM movies WHERE movie_id = :id", true);

        return $movie;
    }

    /**
     * Get a random featured movie from the database
     *
     * @return array|string
     */
    public function getFeaturedMovie() {
        $featured = $this->db->fetch('SELECT * FROM movies ORDER BY RANDOM()', true);

        if (!$featured) {
            return 'The database is empty, delete the database to start the installation process.';
        }

        return $featured;
    }


    /**
     * Get all the movies and order them correctly
     *
     * @param array $params
     * @return array
     */
    public function getMovies($params) {

        /** @var int $batch */
        $batch = $this->getSettings()['batch'];

        switch($params['type']) {
            case "date":
                $query = "ORDER BY created_at desc";
                break;
            case "rating":
                $query = "ORDER BY vote_average desc";
                break;
            case "popular":
                $query = "ORDER BY popularity desc";
                break;
        }

        //get current starting point of records
        $position = ($params['is_loaded']);
        $genre = (!empty($params['genre'])) ? $params['genre'] : '';
        $this->db->bind(["position" => $position, "batch" => $batch, "genre" => "%$genre%"]);


        $movies =  $this->db->fetch("SELECT * FROM movies INNER JOIN files ON movies.movie_id = files.movie_id
                                             WHERE (',' || genres || ',') LIKE :genre $query LIMIT :position, :batch");

        return ['movies' => $movies, 'batch' => $batch];
    }

    /**
     * Get the movie file location to play in the browser
     *
     * @param array $params
     * @return array
     */
    public function playMovie($params) {
        $this->db->bind(["id" => $params['id']]);
        $result =  $this->db->fetch("SELECT * FROM movies INNER JOIN files
                                             ON movies.movie_id = files.movie_id WHERE movies.movie_id = :id",
            true);
        return $result;
    }

    /**
     * Search the database for the movie
     *
     * @param array $params
     * @return array
     */
    public function searchMovies($params) {
        $query = $params['query'];
        $this->db->bind(["query" => "$query*"]);
        $result = $this->db->fetch("SELECT * FROM movies WHERE movies MATCH :query");

        return $result;
    }

    /**
     * Get all the movie genres in the database
     *
     * @return array
     */
    public function getMovieGenres() {
        $genres = $this->db->fetch('SELECT genres FROM movies');

        foreach($genres as $genre) {
            $genres_explode = explode(',', $genre['genres']);
            foreach($genres_explode as $genre) {
                $array[] = $genre;
            }
        }
        /**
         * Sort the genres on alphabetical order
         */
        function sortAlphabetically($a, $b) {
            return strcmp($a, $b);
        }
        usort($array, "sortAlphabetically");

        return array_count_values($array);
    }
}
