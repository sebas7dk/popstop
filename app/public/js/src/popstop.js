/*
 *  PopStop script to display the web application
 *
 *  Made by Sebastian de Kok
 *  Under MIT License
 */
;(function ( $, window, document, undefined ) {
    // default properties.
    var pluginName = "PopStop";

    // plugin constructor.
    function Plugin(element){
            this.element = element;
            this.plugin = this;
            this.loaded= "";
            this.loading="";
            this.response="";
            this.logo ="";
            this.menuBar ="";
            this.genre="";
            this.genres="";
            this.spinner ="";
            this.featured ="";
            this.lightBox="";
            this.lightBoxTarget ="";
            this.lightBoxClose ="";
            this.searchBox ="";
            this.includesPath="";
            this.totalFiles="";
            this.messageContainer="";
            this.messageContent="";
            this.progressBar="";
            this.movieHolder="";
            this.movieCard="";
            this.windowMargin="";

            this.init();


    }
    function _call(data, type) {
        var ajax = $.ajax({type: type, url: 'bootstrap.php', data: data, dataType: 'json'});

        ajax.fail(function(request){
            _error(request.responseText);
        });

        return ajax;
    }
    function _error(message) {
        var title = '<i class="fa fa-exclamation-triangle"></i> Error';
        var output = '<strong>Message:</strong> ' + message
            + '<div step-id="4" class="button step" id="installButton">Try Again</div>';
        _container(output, title);

        /*Stop the progress bar*/
        clearInterval(progressBar);
        return false;
    }
    function _container(content, title) {
        $(windowMargin).hide();
        $('body').load(includesPath +' '+ messageContainer,  function() {
            var $titleHolder =  $('.top').find(' h1');
            if (title) {
                $titleHolder.html(title);
            }
            $(messageContent).html(content);

        }).addClass('container');
    }
    function _reload() {
        location.reload();
    }
    Plugin.prototype = {
        init: function(){
                $movieContainer = $(this.element);
                loaded = 0; //total loaded movie(s)
                genres = 0;
                plugin = this;
                loading = false;
                includesPath = "/app/public/templates/includes.html";
                var $document = $(document);
                var $window = $(window);

                this.getIDs();
                this.isInstalled();

                $window.on('scroll', function() {
                    plugin.onScroll();
                });

                $(sideBar).find('.sort-by li').on('click', function() {
                    $this = $(this);
                    plugin.sortBy($this);
                });
                $document.on('click', '.movie, .featured-movie', function() {
                    var $this = $(this);
                    plugin.openLightBox($this);

                });
                $document.on('click', lightBoxClose, function(e) {
                     e.preventDefault();
                    plugin.closeLightBox();

                });
                $document.on('click', '.play-now', function() {
                    plugin.startMovie();

                });
                $document.on('click', '.tag, .genre', function(e) {
                    e.preventDefault();
                    var $this = $(this);
                    plugin.getGenre($this);

                });
                $('#side-menu-toggle').on('click', function() {
                    var $this = $(this);
                    $this.toggleClass('active');
                    $('body').toggleClass('side-bar-open');

                });

                $(searchBox).on('keyup', function(){
                    plugin.onSearch();
                });

                $(menuBar).find('.settings').on('click',function() {
                    plugin.showSettings();
                });

                $document.on('click', '#saveSettings', function() {
                    plugin.saveSettings();
                });

                $document.on('click', '#installButton', function() {
                    var $this = $(this);
                    var step = $this.attr('step-id');
                    plugin.installationProcess(step, false);

                });
                $document.on('click', '#updateAgain', function() {
                    plugin.updateMovies();

                });
                $document.on('click', '#confirmKey', function() {
                    var key = $(messageContent).find('input').val();
                    plugin.confirmApiKey(key);

                });

                $document.on('click', '#passwordField', function() {
                    var $this = $(this);
                    var enter_password = $('#enterPassword');
                    if ($this.is(':checked')) {
                        enter_password.fadeIn(1000);
                    } else {
                        enter_password.fadeOut(1000);
                    }
                });

                $document.on('click', '#loginConfirm', function() {
                    plugin.verifyPassword();
                });
        },
        isInstalled:function() {
            var data = {function : "isInstalled"};
             _call(data, 'GET', false).done(function(response) {
                 var $movieContainer = $(movieContainer);
                 $movieContainer.attr('data-total', response.total_files);

                 if (!response.is_installed) {
                     plugin.installationProcess();
                 } else if(response.password) {
                     plugin.showLogin();
                 } else if(!response.is_updated) {
                     plugin.updateMovies();
                 } else {
                     $(windowMargin).fadeIn(2000);
                     plugin.getFeatured();
                     plugin.getMovies();
                     plugin.showGenres();
                 }
             });

            /*Get the total files*/
            totalFiles = $movieContainer.attr('data-total');
        },
                //getting control variables for future usage.
        getIDs:function() {
            logo = '.logo';
            menuBar = '.menu-bar';
            sideBar = '.side-bar';
            spinner = '.spinner';
            featured = '.featured-movie';
            lightBox = '#lightBox';
            lightBoxTarget = '#lightboxTarget';
            lightBoxClose = '.lightbox-close';
            movieHolder = '#movieHolder';
            movieCard = '.movie-card';
            searchBox = '#searchBox';
            messageContainer = '#messageContainer';
            messageContent= '.content';
            windowMargin = '.window-margin';
        },
        showStars:function(stars) {
            var stars = stars.split('/');
            var output = '<div class="stars">';
            for(i = 0; i < stars[0]; i++){
                output += '<span class="fa fa-star"></span>';
            }
            if (stars[1] > 0) {
                output += '<span class="fa fa-star-half-o"></span>';
            }
            for(i = 0; i < stars[2]; i++){
                output += '<span class="fa fa-star-o"></span>';
            }
            output += '</div>';

            return output;
        },
        getFeatured:function() {
            var data = {function : "getFeaturedMovie", track : loaded, type: $(movieContainer).attr("data-type")};
            _call(data, 'GET', false).done(function(response) {
                 var year = response.release_date.split('-')[0];
                 var stars = plugin.showStars(response.stars);
                 var output ='<div class="bottom-bar">'
                            +'<div class="title-container"><b>'+ response.title +' ('+ year +')</b></div>'
                            +'<div class="right">'+ stars +'</div></div>';

                $(featured).css('background-image', 'url(' + response.backdrop_path + ')')
                            .attr('movie-id', response.movie_id)
                            .html(output);
            });
        },
        getMovies:function(scroll) {
            /*Show the spinner*/
            $(windowMargin).addClass('loading');

            var $movieContainer = $(movieContainer);
            var type = $movieContainer.attr("data-type");

            genre =  $movieContainer.attr("data-genre");
            genre = (genre != 'Categories') ? genre : '';

            $(windowMargin).addClass('loading');

            var data = {function : "getMovies", is_loaded : loaded, type: type, genre: genre};
            _call(data, 'GET', false).done(function(response) {

                var output = '';
                $.each(response.movies, function (key, val) {
                    output += '<li class="movie" movie-id="' + val.movie_id + '">'
                    + '<img src="' + val.poster_path + '" alt="' + val.title + '" />'
                    + '</li>';
                });
                if (scroll === true) {
                    $movieContainer.append(output);
                } else {
                    $movieContainer.html(output);
                }

                /*loaded group increment*/
                loaded = (loaded == 0) ? response.batch : parseFloat(loaded) + parseFloat(response.batch);
                $movieContainer.attr('data-loaded', loaded);
                $(windowMargin).removeClass('loading');
            });
            loaded = $movieContainer.attr('data-loaded');
            totalFiles = $movieContainer.attr('data-total');
        },
        sortBy: function($this) {
            type = $this.find('a').attr('data-type');
            loaded = 0;
            $movieContainer.attr('data-loaded', loaded);

            $(movieContainer).attr("data-type", type);
            $(sideBar).find('.sort-by li').removeClass('selected');
            $this.addClass('selected');
            this.getMovies();

        },
        getGenre:function($this) {
            var $movieContainer =  $(movieContainer);
            /* Change the total and loaded files*/
            loaded = 0;
            $movieContainer.attr('data-loaded', loaded);
            totalFiles = $this.attr("data-total");
            $movieContainer.attr('data-total', totalFiles);

            genre = $this.attr("data-genre");
            $(sideBar).find('#genresList li').removeClass('selected');
            $(sideBar).find('#genresList li a[data-genre="' + genre + '"]').closest('li').addClass('selected');

            $movieContainer.attr("data-genre", genre);
            this.getMovies();
            this.closeLightBox();
        },
        showGenres:function() {
            if ($('ul#genresList li').length == 0) {
                var data = {function : "getMovieGenres"};
                _call(data, 'GET', false).done(function(response) {
                    var output = '<li class="selected"><a class="genre" data-genre="" data-total="' + totalFiles + '">Show All (' + totalFiles + ')</a></li>';
                    $.each(response, function (key, val) {
                        output += '<li> <a class="genre" data-genre="' + key + '" data-total="' + val + '">' + key + ' (' + val + ')</a></li>';
                    });
                    $('#genresList').html(output);
                });
            }
        },
        onSearch:function() {
             var value = $(searchBox).val();
             if (value.length > 0)  {
                 var data = {function : "searchMovies", query : value};
                 _call(data, 'POST', false).done(function(response) {
                     loading = true;
                     if (response == undefined || response == null || response.length == 0) {
                         $(movieContainer).html('<div class="no-results"><i class="fa fa-search"></i> Oops there are no search results for ' + value + '..</div>');
                     } else {
                         var output = '';
                         $.each(response, function (key, val) {
                             output += '<li class="movie" movie-id="' + val.movie_id + '">'
                             + '<img src="' + val.poster_path + '" alt="' + val.title + '" />'
                             + '</li>';
                         });
                         $(movieContainer).html(output);
                     }
                 });
            } else if (value.length === 0){
                 loaded = 0;
                 loading = false;
                 this.getMovies();
             }
        },
        openLightBox:function($this) {
            var data = {function : "getMovieById", id :  $this.attr("movie-id")};
            _call(data, 'GET', false).done(function(response) {
                var stars = plugin.showStars(response.stars);
                var year = response.release_date.split('-')[0];
                var genres = response.genres.split(',');

                $(lightBox).load(includesPath + ' ' + lightBoxTarget, function () {
                    var $backdropImage = $('.hero');
                    var $coverImage = $('#cover');
                    var $movieInfo = $('.column-left');
                    var $overview = $('.column-right');
                    var $movieDetails = $('.details');

                    /*Left column with tags*/
                    var movieInfoOutput = '<span class="runtime"><b><span class="fa fa-clock-o"></span></b> ' + response.runtime + ' minutes<br>'
                                        + '</span><div class="tags">';
                    i = 0;
                    $.each(genres, function (index, genre) {
                        var total = $(sideBar).find('#genresList li a[data-genre="' + genre + '"]').attr('data-total');
                        movieInfoOutput += '<span class="tag" data-genre="' + genre + '" data-total="'+ total +'">' + genre + '</span>';
                        if (i % 2) {
                            movieInfoOutput += '<br>';
                        }
                        i++
                    });
                    movieInfoOutput += '</div>';
                    /*Right column with description*/
                    var movieDetailsOutput = '<div class="bottom-bar">'
                        + '<div class="title-container"><b>' + response.title + ' (' + year + ')</b></div>'
                        + '<div class="right">' + stars + '</div></div>';

                    $(movieHolder).attr('data-id', response.movie_id);
                    $backdropImage.css('background-image', 'url(' + response.cover_path + ')');
                    $coverImage.html('<img src="' + response.poster_path + '" alt="cover" class="cover" />');
                    $overview.html('<p>' + response.overview + '</p>');
                    /* show the output*/
                    $movieInfo.html(movieInfoOutput);
                    $movieDetails.html(movieDetailsOutput);
                    /* display the lightbox */
                    $(lightBoxTarget).css({
                        'opacity': '1',
                        'top': '0',
                        'bottom': '0',
                        'z-index': '10000'
                    });
                });
            });
        },
        closeLightBox:function() {
            $(lightBoxTarget).css({opacity: 0, 'z-index': -10000});
            $(lightBoxClose).css({top: -100});
        },
       startMovie:function() {
            var data = {function : "playMovie", id : $(movieHolder).attr("data-id")};
            _call(data, 'GET', false).done(function(response) {
                $(movieHolder).html('<video autoplay="autoplay"><source src="' + response.path + '"></video>');
                $('video').PopStopPlayer({
                    'posterPath': response.poster_path,
                    'title': response.title,
                    'autoPlay': true
                });
            });
        },
       onScroll:function() {
            var documentHeight = $(document).height();
            var windowHeight = $(window).height();
            var windowTop = $(window).scrollTop();
            var menuTop = $(featured).height();
            var sideBarHeight = $(sideBar).height();

            if (windowTop >= menuTop) {
                $(menuBar).addClass('menu-bar-sticky');
                $(sideBar).addClass('side-bar-sticky');
                $(logo).addClass('logo-sticky');
            } else if (windowTop < menuTop) {
                $(sideBar).removeClass('side-bar-sticky');
                $(menuBar).removeClass('menu-bar-sticky');
                $(logo).removeClass('logo-sticky');
            }

            if($(menuBar).is(':visible')) {
               $(movieContainer).css({'min-height':sideBarHeight});
            } else {
                $(movieContainer).css({'min-height':0});
            }

            if((windowTop + windowHeight) === documentHeight)  //user scrolled to bottom of the page?
            {
               if(loaded <= totalFiles) //there's more data to load
               {
                  loading = true;
                  plugin.getMovies(true);
               }
            }
       },
        confirmApiKey:function(key) {
            if(key.length > 0) {
                data = {function : "confirmApiKey", key: key};
                _call(data, "POST", false).done(function(response) {
                    if (!response.status) {
                        $(messageContent).find('input').css('border', '2px solid #F94F6A');
                        $(messageContent).find('.error').html('The API-KEY is not valid, make sure you insert a valid key and that the key is activated.')
                            .css({'color': '#F94F6A', 'font-weight': 'bold'});
                    } else {
                        var data = {function: "saveApiKey", key: key};
                        _call(data, "POST", false).done(function(response) {
                            if (response.saved) {
                                plugin.startInstallation(3);
                            }
                        });
                    }
                });
            }
            $('input').css('border', '2px solid #F94F6A');
        },
       installationProcess: function(step) {
           var output = '';
           switch (step) {
               case '1':
                   output ='<p>To fetch the movie information from the TMDB api you need to have a <strong>key</strong>, you can create a free account '
                       +'<a href="https://www.themoviedb.org/account/signup" target="_blank">here.</a> </p>'
                       +'<p><div class="api-key"> <span class="fa fa-key"></span> <input placeholder="API-KEY"></div></p>'
                       +'<p class="error"></p>'
                       +'<div step-id="2" class="button step" id="confirmKey">Confirm</div>';
                   break;
               case '2':
                   output ='<p>We have detected <strong>'+ totalFiles +'</strong> files in the content directory.'
                       +'The next step will fetch the movie information for each file, depending on the number of files this might take a while.'
                       +'<div step-id="3" class="button step" id="installButton">continue</div>';
                   break;
               case '3':
                   plugin.startInstallation();
                   break;
               case '4':
                  _reload();
                   break;
               case '5':
                   output ='<p>Are you sure you want to clear the database and do a rescan of the content directory?</p>'
                       +'<p>This action can\'t\ be undone.</p>'
                       +'<div step-id="4" class="button step" id="installButton" style="left:10px">Go Back</div>'
                       +'<div step-id="3" class="button step" id="installButton">Confirm</div>';
                   break;
               case '6':
                   output ='<p>Hooray the script has finished successfully! It\'s\ time to grab some popcorn and enjoy your movie collection.</p>'
                        +'<div step-id="4" class="button step" id="installButton">Finish</div>';
                   break;
               case '7':
                   plugin.updateMovies();
                   break;
               default:
                   console.log(step)
                   var title = '<i class="fa fa-cube"></i> Installation';
                   output ='<p>Before you can stream your movies we first have to locate them and fetch the movie information.'
                       +' If you have done everything on the list below you can go to the next step.</p>'
                       +'<ul><li>Add your movies to the content Directory. Copy them over or even better create a symlink.</li>'
                       +'<li>Make sure the <code>app/database</code> folder is writable.</li>'
                       +'<li>Rename your files with the title of the movie, for better results add the year of the movie. </li></ul>'
                       +'<div step-id="1" class="button step" id="installButton">Continue</div>';
                   _container(output, title);
           }
           $(messageContent).html(output);
       },
        startInstallation: function() {
            var title = '<i class="fa fa-cube"></i> Installation';
            var output ='<p>Fetching the movie information please wait..<p>'
                +'<div class="progress">'
                +'<span class="progress-val">0%</span>'
                +'<span class="progress-bar">'
                +'<span class="progress-in"></span>'
                +'</span></div>'
                +'<br><br><p>Don\'t\ close this window and wait until the script is finished.</p>';
            _container(output, title);

            var data = {function : "installFiles"};
            _call(data, 'GET', false).done(function(response) {
                if(response.not_found) {
                    /*Stop the progress bar*/
                    clearInterval(progressBar);
                    var files = response.files;
                    var output ='<p>The script was not able to fetch the movie information for the following files:</p>'
                        +'<ul>';
                    for(var i = 0; i < files.length; i++){
                        output += '<li>'+ files[i].file +'</li>';
                    }
                    output +='</ul>'
                    +'<p>Rename the file(s) or add the year of the movie to the file name and try again.</p>'
                    +'<div step-id="3" class="button step" id="installButton" style="left:10px">Try Again</div>'
                    +'<div step-id="6" class="button step" id="installButton">Skip</div>';
                    $(messageContent).html(output);
                }
            });
            progressBar = setInterval(function(){
                var percentage ='';
                /* query the completion percentage from the server */
                var data = {function : "getInserted"};
                _call(data, "GET", false).done(function(response) {

                    var total = $movieContainer.attr('data-total');
                    percentage = Math.round((response.inserted / total) * 100);

                    /* update the progress bar width */
                    $(messageContent).find(".progress-in").css('width', percentage +'%');
                    /* and display the numeric value */
                    $(messageContent).find(".progress-val").html(percentage + '%');

                    /* test to see if the job has completed */
                    if(percentage >= 100) {
                        clearInterval(progressBar);
                        plugin.installationProcess('6');
                    }
                });
            }, 1000);

        },
        updateMovies: function() {
             var output ='<p>Scanning for new content and fetching the information please wait...<p>'
                +'<div class="progress">'
                +'<span class="progress-bar">'
                +'<div class="loader"></div>'
                +'</span></div>'
                +'<br><br><p>Don\'t\ close this window and wait until the script is finished.</p>';
                var title = '<i class="fa fa-database"></i> Update';
                _container(output, title);

            var data = {function : "updateFiles"};
            _call(data, 'GET', false).done(function(response) {
                if(response.not_found) {
                    var files = response.files;
                    output ='<p>The script was not able to fetch information for the following file(s):</p>'
                    +'<ul>';
                    for(var i = 0; i < files.length; i++){
                        output += '<li>'+ files[i].file +'</li>';
                    }
                    output +='</ul>'
                    +'<p>Rename the file(s) or add the year of the movie to the file name and try again.</p>'
                    +'<div step-id="3" class="button step" id="installButton" style="left:10px">Try Again</div>'
                    +'<div step-id="6" class="button step" id="installButton">Skip</div>';
                }

                if(response.updated) {
                    output ='<p>Your movies have been added to the database successfully!</p>'
                        +'<p>You can turn the auto-update function on and off in the settings menu.</p>'
                        +'<div step-id="4" class="button step" id="installButton">Finish</div>';
                } else if (!response.not_found && !response.updated) {
                    output ='<p>The script hasn\'t\ found any new files in the content directory. Everything is up-to-date.</p>'
                        +'<div step-id="4" class="button step" id="installButton">Finish</div>';
                }
                $(messageContent).html(output);
            });
        },
        showSettings:function() {
            var data = {function : "getSettings"};
            _call(data, "GET", false).done(function(response) {
                var password_checked = response.password ? 'checked' : '';
                var auto_update_checked = response.auto_update != 0 ? 'checked' : '';
                var batch = response.batch;

                var title = '<i class="fa fa-cog"></i> Settings';
                var output = '<form>'
                    + '<label><span>Auto update </span><input id="autoUpdate" type="checkbox" ' + auto_update_checked + '/></label>'
                    + '<label><span>Password  </span><input id="passwordField" type="checkbox" ' + password_checked + '/></label>'
                    + '<label id="enterPassword"><span>Enter your password  </span><input id="passwordInput" type="password"/> <small class="error"></small></label>'
                    + '<label><span>Batch per page </span><input id="batchInput" type="text" value="' + batch + '"/></label>'
                    + '</form>'
                    + '<div step-id="5" class="button setting install" id="installButton"><i class="fa fa-cube"></i> Re-Install</div>'
                    + '<div step-id="7" class="button setting update" id="installButton"><i class="fa fa-database"></i> Update</div>'
                    + '<div class="button step" id="saveSettings">Save & Exit</div>';
                _container(output, title);
            });
        },
        saveSettings:function() {
            var settings = {};
            var $passwordInput = $('#passwordInput');
            var $passwordField = $('#passwordField');
            var $batchInput = $('#batchInput');
            var $autoUpdate = $('#autoUpdate');

            var passwordInputValue = $passwordInput.val();
            var batchInputValue = $batchInput.val();

            if ($passwordField.is(':checked') && $passwordInput.is(':visible')) {
                if (passwordInputValue.length > 4) {
                    settings['password'] = passwordInputValue;
                    $passwordInput.css('border', '0px');
                } else {
                    $passwordInput.css('border', '2px solid #F94F6A');
                    return false;
                }
            }

            if (batchInputValue.length != 0) {
                settings['batch'] = batchInputValue;
                $batchInput.css('border', '0px');
            } else {
                $batchInput.css('border', '2px solid #F94F6A');
                return false;
            }

            settings['auto_update'] = $autoUpdate.is(':checked') ? 1 : 0;

            var data = {function : "updateSettings", settings : settings};
            response = _call(data, "POST", false).done(function(response) {
                if (response.updated) {
                    _reload();
                }
            });
        },
        showLogin: function() {
            var output ='<p><div class="api-key"> <span class="fa fa-key"></span> '
                       +'<input id="passwordInput" type="password" placeholder="Enter your password"></div></p>'
                       +'<div class="button step" id="loginConfirm">Login</div>';
            var title = '<i class="fa fa-user"></i> Login';
            _container(output, title);

        },
        verifyPassword: function() {
            var password = $('#passwordInput').val();
            var correct = false;

            if (password) {
                var data = {function : "verifyPassword", password : password};
                _call(data, "POST", false).done(function(response) {
                    if (response.correct) {
                        _reload();
                        return false;
                    }
                });
            }
            if (!password || !correct) {
                $('#passwordInput').css('border', '2px solid #F94F6A');
                return false;
            }
        }
    };

    
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function ( options ) {
            return this.each(function() {
                if ( !$.data( this, "plugin_" + pluginName ) ) {
                                $.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
                }
            });
    };

})( jQuery, window, document );
