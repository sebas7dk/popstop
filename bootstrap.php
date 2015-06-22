<?php
        //Autoload all the controllers and classes
        spl_autoload_register(function($class) 
        {
                $directory = (strpos($class, 'Controller') !== false) ? 'Controllers' : 'Classes';
                $location = getcwd() . "/app/src/{$directory}/{$class}.php";
                if(is_file($location)) {
                    require_once $location;
                } 
        });

        $request_method = getenv('REQUEST_METHOD');
         //Catch the post request and call the related function
        if($request_method === "POST" || $request_method === "GET")
        {

                $params = ($request_method === "POST") ? filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING) :
                                                         filter_input_array(INPUT_GET, FILTER_SANITIZE_STRING);

                $function = $params['function'];
                $controller = new MovieController;
                $response = new Response;

                if (method_exists($controller, $function)) {  
                        $response->toJSON($controller->$function($params));
                } else {
                        $response->toJSON("The Function does not exist: $function");
                }
        }
       
       



