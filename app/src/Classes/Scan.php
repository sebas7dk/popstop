<?php

class Scan {
    
        protected $directory;    
        
        protected $filter = ['mp4', 'mkv', 'avi', 'mov'];
        
        protected $response;
        
        public function __construct() {
            $this->directory = getcwd(). "/content/";
            $this->response = new Response;
        }
    
        /**
        * Index the all the files in the directory and sub directories
        * @return array
        */
       public function files() {
           
           $content = [];
           foreach ($this->getIterator() as $item) {
               
                 if (in_array($item->getExtension() , $this->filter) ) {


                           $content[] = [
                                    "target"      => strstr($item->getPathname(), 'content'),
                                    "search_name" => $item->getBasename('.' . $item->getExtension()),
                                    "name"        => $item->getBasename(),
                                    "size"        => $item->getSize(),
                                    "date"        => $item->getMTime(),
                                    "extension"   => $item->getExtension(),
                        ];
                 }
           }

           return  $content;
       }

        /**
        * Scan the current directory for files
        * @return RecursiveDirectoryIterator
        */
       private function getIterator () {

             // some flags to filter . and .. and follow symlinks
           $flags = \FilesystemIterator::SKIP_DOTS | \FilesystemIterator::FOLLOW_SYMLINKS;

           // create a simple recursive directory iterator
            $iterator = new \RecursiveDirectoryIterator($this->directory, $flags);

            $recursive = new \RecursiveIteratorIterator($iterator);
            
            if (iterator_count($recursive) == 0) {
                $this->response->toJSON("The content directory is empty.");
            }

            return $recursive;
       }
}
