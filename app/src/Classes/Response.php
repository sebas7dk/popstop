<?php
class Response {
    function toJSON($params) {
        if (is_array($params)) {
            $response = [
                    'success' => true,
                    'data'        =>  $params
                ];

        } else {
            $response = $this->error($params);
        }
        $this->output($response);
    }

    private function error($params) {
        return [
                   'success' => false,
                   'error' => ['message' => $params]
       ];
    }

    private function output($response) {
        header('Content-type: application/json');
        echo json_encode($response);
        exit;
    }
}
