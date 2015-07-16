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
class Response {
    /**
     * Return a JSON response
     *
     * @params array|string
     * return void
     */
    function toJSON($params) {
        $error = (is_array($params) ? false : true);

        if ($error) {
            header('HTTP/1.1 400 Bad Request');
        }
        header('Content-type: application/json');
        echo json_encode($params);
        exit;
    }
}

