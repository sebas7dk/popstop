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
class TMDB {

    /**
     * @var string
     */
    protected $api_key;
    /**
     * @var string
     */
    protected $api_url = 'http://api.themoviedb.org';

    /**
     * @var string
     */
    protected $api_version = 3;

    /**
     * @var string
     */
    protected $session_id;

    /**
     * @var \Response
     */
    protected $response;

    /**
     * @param string $api_key
     */
    public function __construct($api_key = null)
    {
        /** @var \Response $response */
        $this->response = new Response;

        if($api_key) {
            $this->api_key = (string) $api_key;
        } else {
            throw new Exception('the API-KEY is missing');
        }
    }

    /**
     * Make an empty call to check if the key is valid
     *
     * @return TMDb result array
     */
    public function getStatusCode() {
        $call = $this->call('');

        return $call;
    }

    /**
     * Get the configuration from TMDb
     *
     * @return TMDb result array
     */
    public function getConfig() {
        $config = $this->call('configuration');

        return $config;
    }

    /**
     * Search a movie by name
     *
     * @param string $query
     * @param string $type
     * @param int $year
     * @param int $page
     * @return TMDb result array
     */
    public function search($query, $type, $year = null, $page = 1) {
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
    public function getById($id) {
        return $this->call("movie/$id");
    }

    /**
     * Get the Image URL of the movie
     *
     * @param string $path
     * @param string $size
     * @return string
     */
    public function getImageUrl($path, $size) {
        $config = $this->getConfig();

        if(isset($config['images'])) {
            $base_url = $config['images']['base_url'];
            $image_url = $base_url.$size.$path;
        } else {
            throw new Exception('No configuration available to create the image URL');
        }

        return $image_url;
    }

    /**
     * Fetch the movie genres
     *
     * @return array
     */
    public function getGenres()
    {
        $genres = $this->call('genre/list');
        return $genres['genres'];
    }

    /**
     * Fetch the movie cast
     *
     * @param int $id
     * @return TMDb result array
     */
    public function getCast($id)
    {
        $casts = $this->call("movie/$id/casts");
        return $casts['cast'];
    }


    /**
     * Makes the CURL call to the TDMB API
     *
     * @param string $url
     * @param array $params
     * @return TMDb result array
     */
    protected function call($url, $params = []) {
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

            if($error_number > 0) {
                $this->response->toJSON('Method failed: '.$error_message);
            }

            $response = curl_exec($curl);
            $result = json_decode($response, TRUE);

            curl_close($curl);
        } else {
            throw new Exception('CURL-extension not loaded');
        }

        if(!$result) {
            throw new Exception('Server error on: '.$response);
        }

        return $result;
    }

}
