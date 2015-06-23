;(function ( $, window, document, undefined ) {
    // default properties.
    var pluginName = "PopStop";

    // plugin constructor.
    function Plugin(element){
            this.element = element;
            this.loaded= "";
            this.loading="";
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
    function _call(data, type, async) {
        var response = $.ajax({type: type, url: 'bootstrap.php', data: data, dataType: 'json',  async: async}).responseJSON;
        if (!response.success) {
              _error(response.error.message);
        }
        return response.data;
    }
    function _error(message) {
        var title = '<i class="fa fa-exclamation-triangle"></i> Error';
        var output ='<strong>Message:</strong> '+ message
                   +'<div class="button step" id="updateAgain">Try Again</div>';
        _container(output, title);

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
            $(messageContainer).animate({
                'top': '250px'
            }, 1000);
        });
    }
    function _reload() {
        location.reload();
    }
    Plugin.prototype = {
        init: function(){
                $movieContainer = $(this.element);
                loaded = 0; //total loaded movie(s)
                genres = 0;
                loading = false;
                includesPath = "/app/public/templates/includes.html";
                var self = this;
                var $document = $(document);
                var $window = $(window);

                this.getIDs();
                this.isInstalled();

                $window.on('scroll', function() {
                    self.onScroll();
                });

                $(sideBar).find('.sort-by li').on('click', function() {
                    $this = $(this);
                    self.sortBy($this);
                });
                $document.on('click', '.movie, .featured-movie', function() {
                    var $this = $(this);
                    self.openLightBox($this);

                });
                $document.on('click', lightBoxClose, function(e) {
                     e.preventDefault();
                     self.closeLightBox();

                });
                $document.on('click', '.play-now', function() {
                     self.startMovie();

                });
                $document.on('click', '.tag, .genre', function(e) {
                    e.preventDefault();
                    var $this = $(this);
                    self.getGenre($this);

                });
                $('#side-menu-toggle').on('click', function() {
                    var $this = $(this);
                    $this.toggleClass('active');
                    self.showGenres();

                });

                $(searchBox).on('keyup', function(){
                        self.onSearch();
                });

                $(menuBar).find('.settings').on('click',function() {
                    self.showSettings();
                });

                $document.on('click', '#saveSettings', function() {
                    self.saveSettings();
                });

                $document.on('click', '#installButton', function() {
                    var $this = $(this);
                    var step = $this.attr('step-id');
                    self.installationProcess(step, false);

                });
                $document.on('click', '#updateAgain', function() {
                    self.updateMovies();

                });
                $document.on('click', '#confirmKey', function() {
                    var key = $(messageContent).find('input').val();
                    self.confirmApiKey(key);

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
                    self.verifyPassword();
                });
        },
        isInstalled:function() {
            var data = {function : "isInstalled"};
            var response = _call(data, 'GET', false);

            totalFiles = response.total_files;

            if (!response.is_installed) {
                this.installationProcess();
            } else if(response.password) {
                this.showLogin();
            } else if(!response.is_updated) {
                this.updateMovies();
            } else {
                $(windowMargin).fadeIn(2000);
                this.getFeatured();
                this.getMovies();
            }

        },
                //getting contorl variables for future usage.
        getIDs:function() {
            logo = '.logo';
            menuBar = '.menu-bar';
            sideBar = '.side-bar';
            spinner = '.spinner';
            featured = '.featured-movie'
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
            var response = _call(data, 'GET', false);

            if (response) {
                 var year = response.release_date.split('-')[0];
                 var stars = this.showStars(response.stars);

                 var output ='<div class="bottom-bar">'
                            +'<div class="title-container"><b>'+ response.title +' ('+ year +')</b></div>'
                            +'<div class="right">'+ stars +'</div></div>';

                $(featured).css('background-image', 'url(' + response.backdrop_path + ')')
                            .attr('movie-id', response.movie_id)
                            .html(output);
            }
        },
        getMovies:function(scroll) {
            var $movieContainer = $(movieContainer);
            var type = $movieContainer.attr("data-type");
            genre =  $movieContainer.attr("data-genre");
            genre = (genre != 'Categories') ? genre : '';
            var data = {function : "getMovies", is_loaded : loaded, type: type, genre: genre};
            var response = _call(data, 'GET', false);

            if (response) {
                var output = '';
                $.each(response.movies, function(key, val){
                    output +='<li class="movie" movie-id="'+ val.movie_id +'">'
                           +'<img src="' + val.poster_path + '" alt="'+ val.title +'" />'
                           +'</li>';
                });
                if(scroll === true) {
                    $movieContainer.append(output);
                    $(spinner).hide(); //hide loading image once data is received
                    loaded++; //loaded group increment
                    loading = false;
                } else {
                    $movieContainer.html(output);
                }
                loaded++;
            }
        },
        sortBy: function($this) {
            type = $this.find('a').attr('data-type');
            loaded = 0;

            $(movieContainer).attr("data-type", type);
            $(sideBar).find('.sort-by li').removeClass('selected');
            $this.addClass('selected');

            this.getMovies();

        },
        getGenre:function($this) {
            loaded = 0;
            genre = $this.attr("data-genre");
            $(sideBar).find('#genresList li').removeClass('selected');
            $this.closest('li').addClass('selected');

            $(movieContainer).attr("data-genre", genre);
            this.getMovies();
            this.closeLightBox();
        },
        showGenres:function() {
            if (genres == 0) {
                var data = {function : "getMovieGenres"};
                var response = _call(data, 'GET', false);
                genres = response;
                var $genreList = $('#genresList');

                var output = '<li class="selected"><a class="genre" data-genre="">Show All ('+ totalFiles +')</a></li>';
                $.each(genres, function(key, val){
                    output +='<li> <a class="genre" data-genre="'+ key +'">'+ key +' ('+ val +')</a></li>';
                });
                $genreList.html(output);

                //var sideBarHeight = $(sideBar).height();
                //$($movieContainer).css({'height':sideBarHeight});

            }
            $('body').toggleClass('side-bar-open');
        },
        onSearch:function() {
             var value = $(searchBox).val();
             if (value.length > 0)  {
                 var data = {function : "searchMovies", query : value};
                 var response = _call(data, 'POST', false);

                 loading = true;
                 if (response == undefined || response == null || response.length == 0) {
                     $(movieContainer).html('<div class="no-results"><i class="fa fa-search"></i> Oops there are no search results for '+ value +'..</div>');
                 } else {
                    var output = '';
                    $.each(response, function(key, val){
                            output +='<li class="movie" movie-id="'+ val.movie_id +'">'
                                   +'<img src="' + val.poster_path + '" alt="'+ val.title +'" />'
                                   +'</li>';
                    });
                    $(movieContainer).html(output);
                }

            } else if (value.length === 0){
                 loaded = 0;
                 loading = false;
                 this.getMovies();
             }
        },
        openLightBox:function($this) {
            var data = {function : "getMovieById", id :  $this.attr("movie-id")};
            var response = _call(data, 'GET', false);

            if (response) {
                var stars = this.showStars(response.stars);
                var year = response.release_date.split('-')[0];
                var genres = response.genres.split(',');

                 $(lightBox).load(includesPath +' '+ lightBoxTarget,  function() {
                     var $backdropImage = $('.hero');
                     var $coverImage = $('#cover');
                     var $movieInfo = $('.column-left');
                     var $overview = $('.column-right');
                     var $movieDetails = $('.details');


                     var movieInfoOutput ='<b><span class="fa fa-clock-o"></span></b> ' + response.runtime + ' minutes<br>';
                     i = 0;
                     $.each(genres, function(index, genre) {
                         movieInfoOutput +='<span class="tag" data-genre="'+ genre +'">' + genre + '</span>';
                         if (i%2) {
                             movieInfoOutput +='<br>';
                         }
                         i++
                     });
                     var movieDetailsOutput ='<div class="bottom-bar">'
                         +'<div class="title-container"><b>'+ response.title +' ('+ year +')</b></div>'
                         +'<div class="right">'+ stars +'</div></div>';

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
            }
        },
       startMovie:function() {
            var data = {function : "playMovie", id : $(movieHolder).attr("data-id")};
            var response = _call(data, 'GET', false);

             if (response) {
                 $(movieHolder).html('<video><source src="'+ response.path +'"></video>');
                    $('video').PopStopPlayer({
                        'posterPath': response.poster_path,
                        'title': response.title
                    });
            }
        },
        closeLightBox:function() {
            $(lightBoxTarget).css({opacity: 0, 'z-index': -10000});
            $(lightBoxClose).css({top: -100});
        },
       onScroll:function() {
            var documentHeight = $(document).height();
            var windowHeight = $(window).height();
            var windowTop = $(window).scrollTop();
            var menuTop = $(featured).height();

            if (windowTop >= menuTop) {
                $(menuBar).addClass('menu-bar-sticky');
                $(sideBar).addClass('side-bar-sticky');
                $(logo).addClass('logo-sticky');
            } else if (windowTop < menuTop) {
                $(sideBar).removeClass('side-bar-sticky');
                $(menuBar).removeClass('menu-bar-sticky');
                $(logo).removeClass('logo-sticky');
              }

            if((windowTop + windowHeight) === documentHeight)  //user scrolled to bottom of the page?
            {
               if(loaded <= totalFiles && loading === false) //there's more data to load
               {
                  loading = true;
                  $(spinner).show(); //show loading image
                  this.getMovies(true);
               }
            }
       },
        confirmApiKey:function(key) {
            if(key.length > 0) {
                data = {function : "confirmApiKey", key: key};
                var response = _call(data, "POST", false);

                if(!response.status) {
                    $(messageContent).find('input').css('border', '2px solid #F94F6A');
                    $(messageContent).find('.error').html('The API-KEY is not valid, make sure you insert a valid key and that the key is activated.')
                               .css({'color':'#F94F6A', 'font-weight':'bold'});
                } else {
                    var data = {function : "saveApiKey", key: key};
                    var response = _call(data, "POST", false);
                    if (response.saved) {
                        this.startInstallation(2);
                    }

                }
            }
            $('input').css('border', '2px solid #F94F6A');

        },
       installationProcess: function(step) {
           var output = '';

           switch (step) {
               case '1':
                   output ='<p>To fetch the movie information you need to have an <strong>API KEY</strong>, you can create a free account '
                       +'<a href="https://www.themoviedb.org/account/signup" target="_blank">here.</a> </p>'
                       +'<p><div class="api-key"> <span class="fa fa-key"></span> <input placeholder="API-KEY"></div></p>'
                       +'<p class="error"></p>'
                       +'<div step-id="2" class="button step" id="confirmKey">Confirm</div>';
                   break;
               case '2':
                   output ='<p>There are <strong>'+ totalFiles +'</strong> files in the content folder ready to be installed. </p>'
                       +'<p>The installation might take a while depending on the number of files, during the installation do not close this window.</p>'
                       +'<div step-id="3" class="button step" id="installButton">Install</div>';
                   break;
               case '3':
                   this.startInstallation();
                   break;
               case '4':
                  _reload();
                   break;
               case '5':
                   output ='<p>This will remove all the movie information stored in the database. this action cannot be undone.</p>'
                       +'<div step-id="3" class="button step" id="installButton">Confirm</div>';
                   break;
               case '6':
                   this.updateMovies();
                   break;
               default:
                   var title = '<i class="fa fa-cube"></i> Installation';
                   output ='<p>Before you continue the installation check if you have done the following:</p>'
                       +'<ul><li>Added your movies to the content folder</li>'
                       +'<li>Made sure the database folder is writable</li>'
                       +'<li>Renamed your movies</li></ul>'
                       +'<div step-id="1" class="button step" id="installButton">Continue</div>';
                   _container(output, title);
           }

           $(messageContent).html(output);


       },
        startInstallation: function() {
            $.ajax({
                type: 'GET',
                dataType: 'json',
                data: {function : "installFiles"},
                url: 'bootstrap.php',
                beforeSend: function () {
                    var output ='<p>Fetching the movie information please wait..<p>'
                        +'<div class="progress">'
                        +'<span class="progress-val">0%</span>'
                        +'<span class="progress-bar">'
                        +'<span class="progress-in"></span>'
                        +'</span></div>'
                        +'<br><p>Remember to not close this window during the installation.</p>';

                    $(messageContent).html(output);
                },
                complete: function(data) {
                    var response = data.responseJSON;

                    if(response.data.not_found) {
                        clearInterval(progressBar);
                        var files = response.data.files;
                        var output ='<p>The script was not able to fetch the movie information for the following files:</p>'
                            +'<ul>';
                        for(var i = 0; i < files.length; i++){
                            output += '<li>'+ files[i].file +'</li>';
                        }
                        output +='</ul>'
                        +'<p>Rename the file(s) or add the year of the movie to the file name.</p>'
                        +'<div step-id="3" class="button step" id="installButton">Try Again</div>';

                        $(messageContent).html(output);
                    }
                }
            });

            progressBar = setInterval(function(){
                var percentage ='';
                /* query the completion percentage from the server */
                var data = {function : "getInserted"};
                var response = _call(data, "GET", false);

                percentage = Math.round((response.inserted / totalFiles) * 100);

                /* update the progress bar width */
                $(messageContent).find(".progress-in").css('width', percentage +'%');
                /* and display the numeric value */
                $(messageContent).find(".progress-val").html(percentage + '%');

                /* test to see if the job has completed */
                if(percentage >= 100) {
                    clearInterval(progressBar);
                    output ='<p>The installation has completed successfully</p>'
                           +'<div step-id="4" class="button step" id="installButton">Finish</div>';
                    $(messageContent).html(output);
                }
            }, 1000);

        },
        updateMovies: function() {
            var output = '';

            $.ajax({
                type: 'GET',
                dataType: 'json',
                data: {function : "updateFiles"},
                url: 'bootstrap.php',
                beforeSend: function () {
                    output ='<p>Scanning for new content and fetching the information please wait...<p>'
                        +'<div class="loader"></div>';
                    var title = '<i class="fa fa-database"></i> Update';
                    _container(output, title);
                },
                complete: function(data) {
                    var response = data.responseJSON;

                    if(response.data.not_found) {
                        var files = response.data.files;
                        output ='<p>The script was not able to fetch information for the following file(s):</p>'
                            +'<ul>';
                        for(var i = 0; i < files.length; i++){
                            output += '<li>'+ files[i].file +'</li>';
                        }
                        output +='</ul>'
                        +'<p>Rename the file(s) or add the year of the movie to the file name.</p>'
                        +'<div class="button step" id="updateAgain">Try Again</div>';
                    }

                    if(response.data.updated) {
                        output ='<p>The installation has completed successfully</p>'
                            +'<div step-id="4" class="button step" id="installButton">Finish</div>';
                    } else if (!response.data.not_found && !response.data.updated) {
                        output ='<p>Everything is up to date and no new files are found.</p>'
                            +'<div step-id="4" class="button step" id="installButton">Finish</div>';
                    }
                    $(messageContent).html(output);

                }
            });
        },
        showSettings:function() {
            var data = {function : "getSettings"};
            var response = _call(data, "GET", false);

            var password_checked = response.password ? 'checked' : '';
            var auto_update_checked = response.auto_update != 0 ? 'checked' : '';
            var batch = response.batch;

            var title = '<i class="fa fa-cog"></i> Settings';
            var output ='<form>'
                +'<label><span>Auto update </span><input id="autoUpdate" type="checkbox" '+ auto_update_checked +'/></label>'
                +'<label><span>Password  </span><input id="passwordField" type="checkbox" '+ password_checked +'/></label>'
                +'<label id="enterPassword"><span>Enter your password  </span><input id="passwordInput" type="password"/> <small class="error"></small></label>'
                +'<label><span>Batch per page </span><input id="batchInput" type="text" value="'+ batch +'"/></label>'
                +'</form>'
                +'<div step-id="5" class="button setting install" id="installButton"><i class="fa fa-cube"></i> Re-Install</div>'
                +'<div step-id="6" class="button setting update" id="installButton"><i class="fa fa-database"></i> Update</div>'
                +'<div class="button step" id="saveSettings">Save & Exit</div>';
            _container(output, title);
        },
        saveSettings:function() {
            var settings = {};

            var passwordInputValue = $('#passwordInput').val();
            var batchInputValue = $('#batchInput').val();

            var $passwordInput = $('#passwordInput');
            var $passwordField = $('#passwordField');
            var $batchInput = $('#batchInput');
            var $autoUpdate = $('#autoUpdate');

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
            var response = _call(data, "POST", false);
            if (response.updated) {
                _reload();
            }

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
                var response = _call(data, "POST", false);

                if(response.correct) {
                    _reload();
                    return false;
                }
            }

            if (!password || !correct) {
                $('#passwordInput').css('border', '2px solid #F94F6A');
                return false;
            }
        }
    };


    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function ( options ) {
            return this.each(function() {
                if ( !$.data( this, "plugin_" + pluginName ) ) {
                                $.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
                }
            });
    };

})( jQuery, window, document );
