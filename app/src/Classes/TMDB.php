<?php

class TMDB {
        /**
        * The API-key
        *
        * @var string
        */
       protected $api_key;
        /**
        * The API-url
        *
        * @var string
        */
       protected $api_url = 'http://api.themoviedb.org';
       
        /**
        * The version of the api
        *
        * @var string
        */
       protected $api_version = 3;
       
       /**
        * Stored Session Id
        *
        * @var string
        */
       protected $session_id;
       
        /**
        * Return as JSON
        *
        * @var Response
        */
       protected $response;
       
       
        /**
         * Default constructor
         *
         * @param string $apikey	
         * @param string $defaultLang
         * @param boolean $config
         * @return void
         */
        public function __construct($api_key = null)
        {
            $this->response = new Response;

            if($api_key) {
                   $this->api_key = (string) $api_key;
            } else {
                $this->response->toJSON('the API-KEY is missing');
            }


        }

        /**
         * Get configuration from TMDb
         *
         * @return TMDb result array
         */
        public function getStatusCode()
        {
            $call = $this->call('');

            return $call;
        }
        
        /**
        * Get configuration from TMDb
        *
        * @return TMDb result array
        */
        public function getConfig()
        {
           $config = $this->call('configuration');

           return $config;
        }
        
        /**
         * Search a movie by querystring
         *
         * @param string $query
         * @param string $type	
         * @param int $year
         * @param int $page	
         * @return TMDb result array
         */
        public function search($query, $type, $year = null, $page = 1)
        {

            $params = array(
                    'query' => $query,
                    'year' => $year,
                    'page' => (int) $page
            );

            return $this->call("search/$type", $params);
        }
        
        
        /**
        * Fetch a movie by id
        *
        * @param int $id					
        * @return TMDb result array
        */
       public function getById($id)
       {
            return $this->call("movie/$id");
       }
        
        
        /**
        * Get Image URL
        *
        * @param string $path
        * @param string $size
        * @return string
        */
       public function getImageUrl($path, $size)
       {
           $config = $this->getConfig();

           if(isset($config['images'])) {
                   $base_url = $config['images']['base_url'];
                   $image_url = $base_url.$size.$path;
           } else {
                   $this->response->toJSON('No configuration available to create the image URL');
           }

           return $image_url;
       }
       
        /**
         * Fetch the genres
         *
         * @return array
         */
        public function listGenres()
        {
            $genres = $this->call('genre/list');
            return $genres['genres'];
        }

        /**
         * Retrieve all of the movie cast information for a particular movie
         *
         * @param mixed $id					TMDb-id or IMDB-id
         * @return TMDb result array
         */
        public function getCast($id)
        {
            $casts = $this->call("movie/$id/casts");
            return $casts['cast'];
        }
        
        
        /**
         * Makes the call to the TMDb API
         *
         * @param string $url
         * @param array $params	
         * @return TMDb result array
         */
        private function call($url, $params = [])
        {
            $params = (!empty($params)) ? http_build_query($params, '', '&') : '';

            $url = $this->api_url.'/'.$this->api_version.'/'.$url.'?api_key='.$this->api_key. '&'.$params;

            if (extension_loaded('curl')) {
                    $curl = curl_init();

                     curl_setopt_array($curl, array(
                            CURLOPT_RETURNTRANSFER => 1,
                            CURLOPT_URL => $url,
                            CURLOPT_HTTPHEADER => [ 'Accept: application/json']
                     ));

                    $error_number = curl_errno($curl);
                    $error_message = curl_error($curl);

                    if($error_number > 0)
                    {
                            $this->response->toJSON('Method failed: '.$error_message);
                    }

                    $response = curl_exec($curl);
                    $result = json_decode($response, TRUE);

                    curl_close($curl);
            } else {
                    $this->response->toJSON('CURL-extension not loaded');
            }

            if(!$result) {
                    $this->response->toJSON('Server error on: '.$response);
            }


            return $result;
        }

}
