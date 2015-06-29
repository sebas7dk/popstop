<?php
class Response {
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

