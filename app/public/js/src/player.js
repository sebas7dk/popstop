/*
 *  PopStop Player to play HTML5 videos
 *
 *  Made by Sebastian de Kok
 *  Under MIT License
 */
;(function ($, window, document, undefined) {
    // default properties.
    var pluginName = "PopStopPlayer",
        defaults = {
            movieId : "",
            autoPlay : "",
            resumeTime : "",
            posterPath : "",
            title: "",
            year: "",
            stars : "",
            basePath : ""


        };

    // self constructor.
    function Plugin(element,options){
        this.element = element,
        this.options = $.extend({},defaults,options),
        this.$player,
        this.self,
        this.subtitles,
        this.movieId,
        this.$movieTitle,
        this.$moviePoster,
        this.totalTime,
        this.$progressBar,
        this.$playedTime,
        this.$currentVolume,
        this.$playerButton,
        this.$volumeIcon,
        this.$volumeControl,
        this.$progressControl,
        this.$normalScreenButton,
        this.buffer,
        this.$fullScreenButton,
        this.fullScreenStatus,
        this.updatedTime,
        this.$closeButton,
        this.$movieHolder,
        this.$playerControls,
        this.subtitleMenuButton,
        this.subtitleMenu,
        this.subtitleDisplay,
        this.subtitleHolder,
        this.$controlsHolder;

        this.init();
    }

    function _loader() {
        $player.on('loadstart', function () {
            $('body').addClass('loading');
            self.showControls('show', true);
        });
        $player.on('canplay', function () {
            $('body').removeClass('loading');
            self.showControls('hide', false);
        });
    }
    function _destroy() {
        var currentTime = $player[0].currentTime;
        var data = {function : "saveCurrentTime", current_time : currentTime, movie_id : movieId};
        $.ajax({type: 'POST', url: 'bootstrap.php', data: data, dataType: 'json'});

        /* Destroy the plugin instance */
        $.data(this, 'plugin_' + pluginName, null);
        $('.PopStopPlayer').remove();
    }
    Plugin.prototype = {
        init: function(){
            $player = $(this.element);
            fullScreenStatus = false;
            movieId = this.options.movieId;
            moviePoster = this.options.posterPath;
            movieTitle = this.options.title;
            movieYear = this.options.year;
            movieRating = this.options.stars;
            var timeDrag = false;
            var volumeDrag = false;
            subtitleEnd = 0;
            self = this;
            this.createPlayer();
            this.getControls();
            this.getSubtitles();
            _loader();

            if(this.options.resumeTime.length > 0) {
                $player[0].currentTime = this.options.resumeTime;
            }

            if(this.options.autoPlay === true) {
                self.playerStatus();
            }

            $player.on('loadedmetadata', function() {
                /* Show the total play time */
                $totalTime.html(self.timeFormat($player[0].duration));
                /* Show the current volume level */
                $currentVolume.css("height", $player[0].volume * 100 + "%");
            });
            $player.on("timeupdate", function() {
                var currentTime = $player[0].currentTime;
                var duration = $player[0].duration;
                var bufferEnd =  $player[0].buffered.end(0);
                /* Show the played & buffered time */
                //$loadedBar.css("width", self.toPercentage(bufferEnd,duration) + "%");
                $playedTime.text(self.timeFormat(currentTime));
                $progressBar.css("width", self.toPercentage(currentTime,duration) + "%");

                if ($subtitleDisplay.find('li').hasClass('selected')){
                    self.setSubtitles(currentTime);
                } else {
                    $subtitleHolder.css('opacity', 0);
                }
            });
            $player.on("ended", function () {
                $player[0].currentTime = null;
                _destroy();
            });
            $volumeControl.mousedown(function(e) {
                /* Adjust the dragged volume level */
                volumeDrag = true;
                $player[0].muted = false;
                self.updateVolume(e.pageY);
            });
            $volumeControl.mouseup(function(e) {
                /* Adjust the dragged volume level */
                if(volumeDrag) {
                    volumeDrag = false;
                    self.updateVolume(e.pageY);
                }
            });
            $volumeControl.mousemove(function(e) {
                /* Adjust the dragged volume level */
                if(volumeDrag) {
                    self.updateVolume(e.pageY);
                }
            });
            $progressControl.mousedown(function(e) {
                /*Adjust the dragged time */
                timeDrag = true;
                self.updateBar(e.pageX);
            });
            $progressControl.mouseup(function(e) {
                /* Adjust the dragged tim*/
                if(timeDrag) {
                    timeDrag = false;
                    self.updateBar(e.pageX);
                }
            });
            $progressControl.mousemove(function(e) {
                /* Adjust the dragged time */
                if(timeDrag) {
                    self.updateBar(e.pageX);
                }
            });
            $playerButton.on('click', function(){
                /* Change the player status */
                self.playerStatus();
            });

            $volumeIcon.on('click', function(){
                /* Mute the volume */
                self.muteSound();
            });

            $fullScreenButton.on('click', function(){
                /* Show hide fullscreen */
                self.fullscreenToggle();
            });
            $closeButton.on('click', function(){
                _destroy();
            });
            $controlsHolder.mouseenter(function() {
                /* Show the controls */
                self.showControls('show');
            });

            $controlsHolder.mouseleave(function() {
                /* Hide the controls */
                self.showControls('hide');
            });

            $(document).on('click', '.subtitle-item', function(){
                var $this = $(this);
                var path = $this.find('span').attr('data-path');

                if($this.hasClass('selected')) {
                    $subtitleDisplay.find('li').removeClass('selected');
                } else {
                    $this.toggleClass('selected');
                    self.showSubTitles(path);
                }
            });

            $(document).keyup(function(e) {
                /* Some controls */
                var key = e.keyCode;
                switch (key) {
                    case 32:
                        self.playerStatus();
                        break;
                    case 27:
                        _destroy();
                        break;
                }
            });

            $(window).on('beforeunload', function(){
                _destroy();
            });
        },
        getControls:function() {
            /* Get the variables for the controls */
            $totalTime = $('#totalTime'),
            $progressBar = $('#played'),
            $playedTime = $('#playingTime'),
            $currentVolume = $("#currentVolume"),
            $playerButton = $("#playerButton"),
            $volumeIcon = $("#volumeIcon"),
            $volumeControl = $("#volumeControl"),
            $progressControl = $("#progressBar"),
            $normalScreenButton = $("#normalScreenButton"),
            $loadedBar = $("#loadedBar"),
            $fullScreenButton = $("#fullScreenButton"),
            $closeButton = $("#closeButton"),
            $movieHolder = $('#movieHolder'),
            $playerControls = $('#controls'),
            $controlsHolder = $('.holder'),
            $subtitleMenu = $('#subtitleMenu'),
            $subtitleDisplay = $('#subtitleDisplay'),
            $subtitleHolder = $('#subtitleHolder');
        },

        showControls:function(status) {
            /*Show or hide the controls depending on the status*/
            switch (status) {
                case 'show':
                    $playerControls.animate({opacity: 1}, 1500);
                    break;
                case 'hide':
                    $playerControls.delay(4000).animate({opacity: 0}, 1500);
                    break;
                case 'play':
                    $closeButton.animate({top: '-60px'});
                    break;
                case 'pause':
                    $closeButton.animate({top: '10px'});
                    break;
            }
        },

        createPlayer:function(){
            /*Create a new div with the player controls*/
            $(this.element).wrap('<div class="PopStopPlayer" />');
            var $PopStopPlayer = $(".PopStopPlayer");

            var output = '<div class="holder"><div id="controls"><div class="control-bar"><div id="progressBar">'
                +'<div id="played"></div><div id="loadedBar"></div></div><ul class="left"><li>'
                +'<div class="play" id="playerButton"></div></li><li><div class="time-holder">' +
                '<span id="playingTime">00:00</span><span>/</span> <span id="totalTime">00:00</span></div></li>'
                +'<li><div id="movieInfo">'+ movieTitle +' ('+ movieYear +') '+ movieRating +' </div></li></ul>'
                +'<ul class="right"><li><div id="volume"><div id="volumeIcon" class="volume-max"><span></span></div>'
                +'<div id="volumeControl"><div id="volumePosition"><div id="currentVolume"></div></div></div></div></li>'
                +'<li><div id="subtitleMenu"><div id="subtitleMenuIcon"></div><div id="subtitleDisplay"></div></div></li>'
                +'<li><div id="fullScreenButton"><span></span></div></li></ul></div></div></div>'
                +'<div id="subtitleHolder"></div><span id="closeButton"></span>';

            $PopStopPlayer.append(output);
        },
        updateVolume:function(yPosition) {
            /*Get the position of the volume bar */
            var position = yPosition - $volumeControl.offset().top;
            var percentage = 100 - (100 * position / $volumeControl.height());

            if(percentage > 100) {
                percentage = 100;
            }
            if(percentage < 0) {
                percentage = 0;
            }
            $player[0].volume = percentage / 100;
            /* Change the sound icon based on the volume */
            $currentVolume.css('height' , percentage + "%");
            this.speakerChange(percentage);
        },
        playerStatus:function() {
            /* Remove the current class */
            $playerButton.removeClass($playerButton.attr("class"));
            /*Add the class depending on the play status*/
            if ($player[0].paused){
                this.showControls('play');
                $player[0].play();
                $playerButton.addClass("pause");
            } else{
                this.showControls('pause');
                $player[0].pause();
                $playerButton.addClass("play");
            }
        },
        muteSound:function(){
            /* Mute the player */
            if($player.get(0).muted){
                $volumeIcon.toggleClass("mute volume-max");
                $currentVolume.css('height' , "100%");
                $player.get(0).muted = false;
            }else{
                $volumeIcon.toggleClass("volume-max mute");
                $currentVolume.css('height' , "0%");
                $player.get(0).muted = true;
            }
        },
        updateBar:function(xPosition) {
           /*Video duration*/
            var max_duration = $player.get(0).duration;
            /* Get the click position */
            var position = xPosition - $progressControl.offset().left;
            var percentage = 100 * position / $progressControl.width();

            /* Check within range */
            if(percentage > 100) {
                percentage = 100;
            }
            if(percentage < 0) {
                percentage = 0;
            }
            /* Update progress bar and video current time */
            $progressBar.css('width', percentage+'%');
            $player[0].currentTime = max_duration * percentage / 100;
        },
        speakerChange:function(percentage) {
            /* Remove the current class */
            $volumeIcon.removeClass($volumeIcon.attr("class"));

            /* Add the class depending on the percentage */
            if (percentage > 60){
                $volumeIcon.addClass("volume-max");
            } else if(percentage > 30){
                $volumeIcon.addClass("volume-mid");
            } else if(percentage === 0){
                $volumeIcon.addClass("mute");
                $player[0].muted = true;
            } else{
                $volumeIcon.addClass ("volume-min");
            }
        },

        fullscreenToggle:function(){
            /*Get the fullscreen status in multiple browsers */
            if (fullScreenStatus) {
                fullScreenStatus = false;
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }else{
                fullScreenStatus = true;
                if ($player[0].requestFullscreen) {
                    $player[0].requestFullscreen();
                } else if ($player[0].webkitRequestFullscreen) {
                    $player[0].webkitRequestFullscreen();
                } else if ($player[0].mozRequestFullScreen) {
                    $player[0].mozRequestFullScreen();
                } else if ($player[0].msRequestFullscreen) {
                    $player[0].msRequestFullscreen();
                }
            }
        },
        toPercentage:function(num, amount){
            /* Return the percentage */
            return (num/amount*100).toFixed(2);
        },
        timeFormat:function (seconds){
            /* Get whole hours */
            var hours = Math.floor(seconds/3600);
            hours = (hours < 10 ? '0' + hours : hours);
            seconds -= hours*3600;
            /* Get remaining minutes */
            var minutes = Math.floor(seconds/60);
            minutes = (minutes < 10 ? '0' + minutes : minutes);
            seconds -= minutes*60;
            seconds = seconds.toFixed(0);
            seconds = (seconds < 10 ? '0' + seconds : seconds);
            /* Calculate the time in minutes and seconds */
            return hours +":"+ minutes +":"+ seconds;
        },
        getSubtitles:function() {
            /* Get the subtitle file in the directory */
            var data = {function : "getMovieSubtitles", path : this.options.basePath};
            $.ajax({type: 'GET', url: 'bootstrap.php', data:data, dataType: 'json'}).done(function(response) {
                var output = '<ul>';
                if (response.length > 0) {
                    $.each(response, function (key, val) {
                        output += '<li class="subtitle-item"><span data-path="' + val.path + '">' + val.name + '</span></li>';
                    });
                } else {
                    output += '<li>No subtitles</li>';
                }
                output += '</ul>';
                $subtitleDisplay.html(output);
            });
        },
        showSubTitles:function(url) {
            var srt = $.ajax({type: 'GET', url: url, async: false}).responseText;
            /* Strip the subtitle and split by line */
            srt = $.trim(srt.replace(/\r\n|\r|\n/g, '\n')).split('\n\n');
            subtitles = new Array(srt.length);

            for (var i=0; i<srt.length; i++) {
                string = srt[i].split('\n');
                if(string.length >= 2) {
                    var number = string[0];
                    var split = string[1].split(' --> ');
                    var start = this.toSeconds($.trim(split[0]));
                    var end = this.toSeconds($.trim(split[1]));
                    var text = string[2];
                    if(string.length > 2) {
                        for(var count = 3; count < string.length; count++) {
                            text += '<br />' + string[count];
                        }
                    }
                    subtitles[i]={
                        start : start,
                        end : end,
                        text : text
                    };
                }
            }

        },
        setSubtitles:function(currentTime) {
            /* Hide the subtitles */
            if (subtitleEnd < currentTime) {
                $subtitleHolder.css('opacity', 0);
            }
            var subtitle;
            for (var i=0; i<subtitles.length; i++) {
                /* Find the next subtitle */
                if(subtitles[i].end > currentTime) {
                    subtitle = i;
                    break;
                }
            }
            if(subtitle >= 0) {
                /* Show the subtitle if it's in the time range */
                if(currentTime > subtitles[subtitle].start && currentTime < subtitles[subtitle].end) {
                        $subtitleHolder.html('<p>'+ subtitles[subtitle].text +'</p>').css('opacity', 1);
                        subtitleEnd = subtitles[subtitle].end;
                }
            }
        },
        toSeconds:function(time) {
            var seconds = 0.0;
            if(time) {
                var part = time.split(':');
                for(i= 0; i < part.length; i++)
                    seconds = seconds * 60 + parseFloat(part[i].replace(',', '.'))
            }
            return seconds;
        }
    };
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function ( options ) {
        return this.each(function() {
            if (!$.data( this, "plugin_" + pluginName)) {
                $.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
            }
        });
    };

})( jQuery, window, document );
