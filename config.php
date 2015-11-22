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

return [

    // PopStop Version
    'version' => '1.0.1',

    // Add here multiple paths with the alias reflecting the one in your apache or nginx configuration.
    // e.g. ['alias' => 'path/to/your/content/directory']
    'content_directories' => [
        ['content' => 'content'],
    ],

    // TMDB API key
    'api_key' => '70843004223195d51075e4cb61e396e1',

    // TMDB API url
    'api_url' => 'http://api.themoviedb.org',

    // TMDB API version
    'api_version' => 3,

    //The path to the sqlite database
    'sqlite_path' => 'app/database/popstop.sqlite',

    //he buffer size when streaming the movie
    'stream_buffer' => 102400,

    // The name of the cookie
    'cookie_name' => 'postop',

    // The cost of the password encryption
    'cost' => 8,

    // The batch of the movies loaded each time
    'batch' => 18,

    // Enable auto-update
    'auto_update' => 0,

    // Enable auto-clean
    'auto_clean' => 0

];