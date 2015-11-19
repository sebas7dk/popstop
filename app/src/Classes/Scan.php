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
    /** @var array  */
    protected $filter = [
        'mp4', 'mkv', 'avi',
        'mov', 'webm', 'vob',
        'ogv', 'ogg', 'wmv',
        'rm', 'mpeg', 'mpg',
        'm4v'
    ];

    /** @var Config */
    protected $config;

    public function __construct()
    {
        /** @var Config $config */
        $this->config = (new Config)->getConfiguration();
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
                    "target"      => strstr($item->getPathname(), $item->getPath()),
                    "search_name" => $item->getBasename('.' . $item->getExtension()),
                    "name"        => $item->getBasename(),
                    "size"        => $item->getSize(),
                    "mime"        => $this->getMimeTypes($item->getExtension()),
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
     * @param string|null $directory
     * @return RecursiveDirectoryIterator
     */
    protected function getIterator($directory = null) {
        $directories = $this->config['content_directories'];

        // some flags to filter . and .. and follow symlinks
        $flags = \FilesystemIterator::SKIP_DOTS | \FilesystemIterator::FOLLOW_SYMLINKS;

        if($directory) {
            //Iterate only this directory
            return new \RecursiveDirectoryIterator($directory, $flags);
        }

        if ($directories) {
            $directoryIterators = [];
            foreach($directories as $directory) {
                //Create an array of the paths
                $directoryIterators[] = new \RecursiveDirectoryIterator($directory, $flags);
            }

            $iterator = new \AppendIterator();
            foreach($directoryIterators as $directoryIterator) {
                //Append the directory iterator to the iterator
                $iterator->append(new \RecursiveIteratorIterator($directoryIterator));
            }
        } else {
            throw new Exception("Unable to read the content path, check the configuration file.");
        }

        if (iterator_count($iterator) == 0) {
            throw new Exception("The content directory is empty.");
        }

        return $iterator;
    }

    /**
     * Get mime type from extension
     *
     * @param string $extension
     * @return array
     */
    protected function getMimeTypes($extension)
    {
        $mimeTypes = [
            'rv'    => 'video/vnd.rn-realvideo',
            'mpeg'  => 'video/mpeg',
            'mpg'   => 'video/mpeg',
            'mpe'   => 'video/mpeg',
            'qt'    => 'video/quicktime',
            'mov'   => 'video/quicktime',
            'avi'   => 'video/x-msvideo',
            'movie' => 'video/x-sgi-movie',
            '3g2'   => 'video/3gpp2',
            '3gp'   => 'video/3gp',
            'mp4'   => 'video/mp4',
            'f4v'   => 'video/mp4',
            'm4v'   => 'video/mp4',
            'webm'  => 'video/webm',
            'mkv'   => 'video/webm',
            'wmv'   => 'video/x-ms-wmv',
        ];

        return $mimeTypes[$extension];
    }
}
