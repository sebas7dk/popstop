## v1.0.2 (24-11-2015)

Removed the slash before the paths to make it work in a sub directory with apache.


## v1.0.1 (22-11-2015)

Created a config file where you can change all the settings of the application. In this config file you can change the path to the content directory or add multiple paths. 
The TMDB API key is hardcoded in the config file so there is no need to sign up for your own key. 

Breaking changes:

You need to remove the sqlite file in app/database and restart the installation process to have the latest database changes.

Bugfixes:

  * fixed the click events on the player controls bubbling up.
  * fixed the installer not fetching the total files first.
  * refactored a lot of the code.

## v1.0.0 (15-11-205)

This is the first stable beta release and it has been tested to work with over 400 movies. 
The layout is fully responsive but has not been tested on all devices. 
If you find a bug or a problem please open a new issue. Any feedback is welcome on the [Google Group](https://groups.google.com/forum/#!forum/popstop).

