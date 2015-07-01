<?php

/**
 * Description of KinoController
 *
 * @author sebastian
 */
class MovieController extends BaseController {

       

          /**
          * Get the movie by ID
          *
          * @param array $params
          * @return array
          */
         public function getMovieById($params) {
                $this->db->bind(["id" => $params['id']]);
                $movie =  $this->db->fetch("select * from movies where movie_id = :id", true);
                
                return $movie;
         }
         
         /**
          * Get a random featured movie
          *	
          * @return array
          */
         public function getFeaturedMovie() {
             $featured = $this->db->fetch('select * from movies ORDER BY RANDOM()', true);

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
          * Search a movie by querystring
          *
          * @param string $text
          * @param int $page	
          * @param bool $adult
          * @param mixed $lang	
          * @return TMDb result array
          */
         public function playMovie($params) {
                $this->db->bind(["id" => $params['id']]);
                $result =  $this->db->fetch("select * from movies INNER JOIN files
                                             ON movies.movie_id = files.movie_id where movies.movie_id = :id",
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

             function sortAlphabetically($a, $b) {
                 return strcmp($a, $b);
             }

             usort($array, "sortAlphabetically");


             return array_count_values($array);
         }


}
