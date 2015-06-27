;(function ( $, window, document, undefined ) {
    // default properties.
    var pluginName = "PopStop";

    // plugin constructor.
    function Plugin(element){
            this.element = element;
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
    function _call(data, type, async, before_send) {
        //var call = $.ajax({type: type, url: 'bootstrap.php', data: data, dataType: 'json',  async: async});

        if (response) {
            var call = $.ajax({
                type: type,
                dataType: 'json',
                data: data,
                url: 'bootstrap.php',
                async: false,
                beforeSend: function () {

                    if (before_send != undefined) {
                       switch(before_send) {
                          case 'update':
                               _update();
                               break;
                           case 'install':
                               _install();
                               break;
                       }
                    }
                },
                error: function (request) {
                    var message = request.responseJSON;
                    response = false;
                    _error(message);

                },
                success: function() {
                    $(messageContainer).html('');
                }
            }).responseJSON;

            return call;
        }



    }
    function _error(message) {
        var title = '<i class="fa fa-exclamation-triangle"></i> Error';
        var output = '<strong>Message:</strong> ' + message
            + '<div step-id="4" class="button step" id="installButton">Try Again</div>';
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
        });
    }
    function _update() {
        var output ='<p>Scanning for new content and fetching the information please wait...<p>'
            +'<div class="loader"></div>';
        var title = '<i class="fa fa-database"></i> Update';
        _container(output, title);
    }
    function _install() {
        var title = '<i class="fa fa-cube"></i> Installation';
        var output ='<p>Fetching the movie information please wait..<p>'
            +'<div class="progress">'
            +'<span class="progress-val">0%</span>'
            +'<span class="progress-bar">'
            +'<span class="progress-in"></span>'
            +'</span></div>'
            +'<br><p>Remember to not close this window during the installation.</p>';

        _container(output, title);
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
                response = true;
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
            var call = _call(data, 'GET', true);

            totalFiles = call.total_files;

            if (response) {
                if (!call.is_installed) {
                    this.installationProcess();
                } else if(call.password) {
                    this.showLogin();
                } else if(!call.is_updated) {
                    this.updateMovies();
                } else {
                    $(windowMargin).fadeIn(2000);
                    this.getFeatured();
                    this.getMovies();
                }
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
            var call = _call(data, 'GET', true);

            if (response) {
                 var year = call.release_date.split('-')[0];
                 var stars = this.showStars(call.stars);

                 var output ='<div class="bottom-bar">'
                            +'<div class="title-container"><b>'+ call.title +' ('+ year +')</b></div>'
                            +'<div class="right">'+ stars +'</div></div>';

                $(featured).css('background-image', 'url(' + call.backdrop_path + ')')
                            .attr('movie-id', call.movie_id)
                            .html(output);
            }
        },
        getMovies:function(scroll) {
            //Show the spinner
            $(windowMargin).addClass('loading');

            var $movieContainer = $(movieContainer);
            var type = $movieContainer.attr("data-type");
            genre =  $movieContainer.attr("data-genre");
            genre = (genre != 'Categories') ? genre : '';
            var data = {function : "getMovies", is_loaded : loaded, type: type, genre: genre};
            var call = _call(data, 'GET', true);

            if (response) {
                var output = '';
                $.each(call.movies, function(key, val){
                    output +='<li class="movie" movie-id="'+ val.movie_id +'">'
                           +'<img src="' + val.poster_path + '" alt="'+ val.title +'" />'
                           +'</li>';
                });
                if(scroll === true) {
                    $movieContainer.append(output);
                    loaded++; //loaded group increment
                    loading = false;
                } else {
                    $movieContainer.html(output);
                }
                $(windowMargin).removeClass('loading');
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
                genres = _call(data, 'GET', true);
                var $genreList = $('#genresList');

                var output = '<li class="selected"><a class="genre" data-genre="">Show All ('+ totalFiles +')</a></li>';
                $.each(genres, function(key, val){
                    output +='<li> <a class="genre" data-genre="'+ key +'">'+ key +' ('+ val +')</a></li>';
                });
                $genreList.html(output);
            }
            $('body').toggleClass('side-bar-open');
        },
        onSearch:function() {
             var value = $(searchBox).val();
             if (value.length > 0)  {
                 var data = {function : "searchMovies", query : value};
                 var call = _call(data, 'POST', true);

                 loading = true;
                 if (call == undefined || call == null || call.length == 0) {
                     $(movieContainer).html('<div class="no-results"><i class="fa fa-search"></i> Oops there are no search results for '+ value +'..</div>');
                 } else {
                    var output = '';
                    $.each(call, function(key, val){
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
            var call = _call(data, 'GET', true);

            if (response) {
                var stars = this.showStars(call.stars);
                var year = call.release_date.split('-')[0];
                var genres = call.genres.split(',');

                 $(lightBox).load(includesPath +' '+ lightBoxTarget,  function() {
                     var $backdropImage = $('.hero');
                     var $coverImage = $('#cover');
                     var $movieInfo = $('.column-left');
                     var $overview = $('.column-right');
                     var $movieDetails = $('.details');


                     var movieInfoOutput ='<b><span class="fa fa-clock-o"></span></b> ' + call.runtime + ' minutes<br>';
                     i = 0;
                     $.each(genres, function(index, genre) {
                         movieInfoOutput +='<span class="tag" data-genre="'+ genre +'">' + genre + '</span>';
                         if (i%2) {
                             movieInfoOutput +='<br>';
                         }
                         i++
                     });
                     var movieDetailsOutput ='<div class="bottom-bar">'
                         +'<div class="title-container"><b>'+ call.title +' ('+ year +')</b></div>'
                         +'<div class="right">'+ stars +'</div></div>';

                     $(movieHolder).attr('data-id', call.movie_id);
                     $backdropImage.css('background-image', 'url(' + call.cover_path + ')');
                     $coverImage.html('<img src="' + call.poster_path + '" alt="cover" class="cover" />');
                     $overview.html('<p>' + call.overview + '</p>');
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
            var call = _call(data, 'GET', true);

             if (response) {
                 $(movieHolder).html('<video><source src="'+ call.path +'"></video>');
                    $('video').PopStopPlayer({
                        'posterPath': call.poster_path,
                        'title': call.title
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
                  this.getMovies(true);
               }
            }
       },
        confirmApiKey:function(key) {
            if(key.length > 0) {
                data = {function : "confirmApiKey", key: key};
                var call = _call(data, "POST", true);

                if(!call.status) {
                    $(messageContent).find('input').css('border', '2px solid #F94F6A');
                    $(messageContent).find('.error').html('The API-KEY is not valid, make sure you insert a valid key and that the key is activated.')
                               .css({'color':'#F94F6A', 'font-weight':'bold'});
                } else {
                    var data = {function : "saveApiKey", key: key};
                    call = _call(data, "POST", true);
                    if (call.saved) {
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

            var before_send = 'install';
            var data = {function : "installFiles"}
            var call = _call(data, "POST", true, before_send);

            if (response) {
                   if(call.not_found) {
                        clearInterval(progressBar);
                        var files = call.files;
                        var output ='<p>The script was not able to fetch the movie information for the following files:</p>'
                            +'<ul>';
                        for(var i = 0; i < files.length; i++){
                            output += '<li>'+ files[i].file +'</li>';
                    }
                    output +='</ul>'
                    +'<p>Rename the file(s) or add the year of the movie to the file name.</p>'
                    +'<div step-id="3" class="button step" id="installButton">Try Again</div>';

                    $('div' + messageContent).html(output);
                }
            }
            //$.ajax({
            //    type: 'GET',
            //    dataType: 'json',
            //    data: {function : "installFiles"},
            //    url: 'bootstrap.php',
            //    beforeSend: function () {
            //        var output ='<p>Fetching the movie information please wait..<p>'
            //            +'<div class="progress">'
            //            +'<span class="progress-val">0%</span>'
            //            +'<span class="progress-bar">'
            //            +'<span class="progress-in"></span>'
            //            +'</span></div>'
            //            +'<br><p>Remember to not close this window during the installation.</p>';
            //
            //        $(messageContent).html(output);
            //    },
            //    complete: function(data) {
            //        var call = data.callJSON;
            //
            //        if(call.data.not_found) {
            //            clearInterval(progressBar);
            //            var files = call.data.files;
            //            var output ='<p>The script was not able to fetch the movie information for the following files:</p>'
            //                +'<ul>';
            //            for(var i = 0; i < files.length; i++){
            //                output += '<li>'+ files[i].file +'</li>';
            //            }
            //            output +='</ul>'
            //            +'<p>Rename the file(s) or add the year of the movie to the file name.</p>'
            //            +'<div step-id="3" class="button step" id="installButton">Try Again</div>';
            //
            //            $(messageContent).html(output);
            //        }
            //    }
            //});

            progressBar = setInterval(function(){
                var percentage ='';
                /* query the completion percentage from the server */
                var data = {function : "getInserted"};
                var call = _call(data, "GET", true);

                percentage = Math.round((call.inserted / totalFiles) * 100);

                /* update the progress bar width */
                $('div' + messageContent).find(".progress-in").css('width', percentage +'%');
                /* and display the numeric value */
                $('div' + messageContent).find(".progress-val").html(percentage + '%');

                /* test to see if the job has completed */
                if(percentage >= 100) {
                    clearInterval(progressBar);
                    output ='<p>The installation has completed successfully</p>'
                           +'<div step-id="4" class="button step" id="installButton">Finish</div>';
                    $('div' + messageContent).html(output);
                }
            }, 1000);

        },
        updateMovies: function() {
            var before_send = 'update';
            var data = {function : "updateFiles"}
            var call = _call(data, "GET", true, before_send);

            if (response) {
                var output = '';
                var title = '<i class="fa fa-database"></i> Update';
                if(call.not_found) {
                    var files = call.files;
                    output ='<p>The script was not able to fetch information for the following file(s):</p>'
                    +'<ul>';
                    for(var i = 0; i < files.length; i++){
                        output += '<li>'+ files[i].file +'</li>';
                    }
                    output +='</ul>'
                    +'<p>Rename the file(s) or add the year of the movie to the file name.</p>'
                    +'<div class="button step" id="updateAgain">Try Again</div>';
                } else if(call.updated) {
                    output ='<p>The installation has completed successfully</p>'
                    +'<div step-id="4" class="button step" id="installButton">Finish</div>';
                } else {
                    output ='<p>Everything is up to date and no new files are found.</p>'
                    +'<div step-id="4" class="button step" id="installButton">Finish</div>';
                }
                console.log(output);

                   $(messageContent).html(output);
            }
        },
        showSettings:function() {
            var data = {function : "getSettings"};
            var call = _call(data, "GET", true);

            var password_checked = call.password ? 'checked' : '';
            var auto_update_checked = call.auto_update != 0 ? 'checked' : '';
            var batch = call.batch;

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
            var call = _call(data, "POST", true);
            if (call.updated) {
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
                var call = _call(data, "POST", true);

                if(call.correct) {
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
