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
    protected $filter = [
        'mp4', 'mkv', 'avi',
        'mov', 'webm', 'vob',
        'ogv', 'ogg', 'wmv',
        'rm', 'mpeg', 'mpg',
        'm4v'
    ];

    /** @var \Response */
    protected $response;

    public function __construct() {
        /** @var string $directory */
        $this->directory = getcwd(). "/content/";
    }

    /**
     * Filter the files with a movie extension
     *
     * @return array
     */
    public function getFiles() {
        $content = [];
        foreach ($this->getIterator() as $item) {
            if (in_array($item->getExtension() , $this->filter) ) {
                $content[] = [
                    "path"        => $item->getPath(),
                    "target"      => strstr($item->getPathname(), 'content'),
                    "search_name" => $item->getBasename('.' . $item->getExtension()),
                    "name"        => $item->getBasename(),
                    "size"        => $item->getSize(),
                    "date"        => $item->getMTime(),
                    "extension"   => $item->getExtension(),
                ];
            }
        }
        return $content;
    }

    /**
     * Filter the files with a .srt extension
     *
     * @var string $path
     * @return array
     */
    public function getSubtitles($path) {
        $subtitles = [];
        foreach ($this->getIterator($path) as $item) {
            if($item->getExtension() == 'srt') {
                $subtitles[] = [
                    'name' => $item->getBasename('.' . $item->getExtension()),
                    'path' => strstr($item->getPathname(), 'content')
                ];
            }
        }
        return $subtitles;
    }

    /**
     * Index the all the files in the directory and sub directories
     *
     * @return RecursiveDirectoryIterator
     */
    protected function getIterator($directory = null) {
        // some flags to filter . and .. and follow symlinks
        $flags = \FilesystemIterator::SKIP_DOTS | \FilesystemIterator::FOLLOW_SYMLINKS;

        //Iterate only this directory
        if($directory) {
            return new \RecursiveDirectoryIterator($directory, $flags);
        }
        // create a simple recursive directory iterator
        $iterator = new \RecursiveDirectoryIterator($this->directory, $flags);
        $recursive = new \RecursiveIteratorIterator($iterator);

        if (iterator_count($recursive) == 0) {
            throw new Exception("The content directory is empty.");
        }

        return $recursive;
    }
}
