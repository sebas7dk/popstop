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
class VideoStream
{
    /** @var string */
    protected $filePath;

    /** @var string */
    protected $stream;

    /** @var int */
    protected $buffer;

    /** @var int */
    protected $start = -1;

    /** @var int */
    protected $end  = -1;

    /** @var int */
    protected $fileSize;

    /** @var string */
    protected $mimeType;

    /** @var string */
    protected $userAgent;

    function __construct($path, $size, $mime)
    {
        /** @var Config $config */
        $config  = (new Config)->getConfiguration();

        /** @var string filePath */
        $this->filePath = $path;
        /** @var int fileSize */
        $this->fileSize = $size;
        /** @var string mimeType */
        $this->mimeType = $mime;
        /** @var string userAgent */
        $this->userAgent = $_SERVER['HTTP_USER_AGENT'];
        /** @var string httpRange */
        $this->httpRange = $_SERVER['HTTP_RANGE'];
        /** @var int buffer */
        $this->buffer = $config['stream_buffer'];
    }

    /**
     * Check if we can open the file for reading
     */
    protected function open()
    {
        if (!($this->stream = fopen($this->filePath, 'rb'))) {
            throw new Exception('Could not open stream for reading, check the file permissions');
        }

    }

    /**
     * Set the headers to stream the video content
     */
    protected function setHeader()
    {
        $this->cleanAll();

        header("Content-Type: $this->mimeType");
        header("Cache-Control: max-age=2592000, public");
        header("Expires: ".gmdate('D, d M Y H:i:s', time()+2592000) . ' GMT');
        header("Last-Modified: ".gmdate('D, d M Y H:i:s', @filemtime($this->filePath)) . ' GMT' );

        $this->start = 0;
        $this->end = $this->fileSize - 1;

        header("Accept-Ranges: 0-".$this->end);

        if (isset($this->httpRange)) {

            $streamStart = $this->start;
            $streamEnd = $this->end;

            list(, $range) = explode('=', $this->httpRange, 2);
            if (strpos($range, ',') !== false) {
                header('HTTP/1.1 416 Requested Range Not Satisfiable');
                header("Content-Range: bytes $this->start-$this->end/$this->fileSize");
                exit;
            }
            if ($range == '-') {
                $streamStart = $this->fileSize - substr($range, 1);
            }else{
                $range = explode('-', $range);
                $streamStart = $range[0];

                $streamEnd = (isset($range[1]) && is_numeric($range[1])) ? $range[1] : $streamEnd;
            }
            $streamEnd = ($streamEnd > $this->end) ? $this->end : $streamEnd;

            if ($streamStart > $streamEnd || $streamStart > $this->fileSize - 1 || $streamEnd >= $this->fileSize) {
                header('HTTP/1.1 416 Requested Range Not Satisfiable');
                header("Content-Range: bytes $this->start-$this->end/$this->fileSize");
                exit;
            }

            $this->start = $streamStart;
            $this->end = $streamEnd;
            $length = $this->end - $this->start + 1;

            fseek($this->stream, $this->start);
            header('HTTP/1.1 206 Partial Content');

            if (is_int(strpos($this->userAgent, 'Android')) && !is_int(strpos($this->userAgent, 'Android 2'))) {
                header('Transfer-Encoding: none');
                header('Connection: close');
            }
            else {
                header("Content-Length: " . $length);
            }

            header("Content-Range: bytes $this->start-$this->end/".$this->fileSize);
        }
        else
        {
            header("Content-Length: ".$this->fileSize);
        }

    }

    /**
     * Close the open stream
     */
    protected function end()
    {
        fclose($this->stream);
        exit;
    }

    /**
     * Clean all the buffers to reduce cpu load
     */
    protected function cleanAll() {
        while (ob_get_level()) {
            ob_end_clean();
        }
    }

    /**
     * Calculate the range and start streaming
     */
    protected function stream()
    {
        $i = $this->start;
        set_time_limit(0);
        while(!feof($this->stream) && $i <= $this->end && connection_aborted() == 0) {
            $bytesToRead = $this->buffer;

            if(($i+$bytesToRead) > $this->end) {
                $bytesToRead = $this->end - $i + 1;
            }

            $data = stream_get_contents($this->stream, $bytesToRead);

            echo $data;
            flush();
            $i += $bytesToRead;
        }
    }

    /**
     * Start the process to prepare the stream
     */
    public function start()
    {
        //ensure our session is written away before streaming, else we cannot use it elsewhere
        session_write_close();

        $this->open();
        $this->setHeader();
        $this->stream();
        $this->end();
    }
}
