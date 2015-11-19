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
class Config {

    /**
     * Get the configuration from the file
     *
     * @return array
     */
    public function getConfiguration() {
        return require('config.php');
    }
}