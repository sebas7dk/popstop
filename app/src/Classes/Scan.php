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
class Scan {
    /** @var string  */
    protected $directory;

    /** @var array  */
    protected $filter = ['mp4', 'mkv', 'avi', 'mov'];

    /** @var \Response */
    protected $response;

    public function __construct() {
        /** @var string $directory */
        $this->directory = getcwd(). "/content/";
        /** @var \Response $response */
        $this->response = new Response;
    }

    /**
     * Filter the files with a movie extension
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
     * Index the all the files in the directory and sub directories
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
