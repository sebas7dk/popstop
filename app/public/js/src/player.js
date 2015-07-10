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
                        autoPlay : "",
                        posterPath : "",
                        title: "",
                        basePath: ""


        };

	// self constructor.
	function Plugin(element,options){
		this.element = element;
		this.options = $.extend({},defaults,options);
        this.$player ="";
        this.self =""
        this.textTrack ="";
        this.textTrackcounter = "";
        this.currentText = "";
        this.$movieTitle = "";
        this.$moviePoster = "";
        this.totalTime ="";
        this.$progressBar="";
        this.$playedTime="";
        this.$currentVolume ="";
        this.$playerButton ="";
        this.$volumeIcon ="";
        this.$volumeControl ="";
        this.$progressControl ="";
        this.$normalScreenButton ="";
        this.buffer ="";
        this.$fullScreenButton ="";
        this.fullScreenStatus ="";
        this.updatedTime ="";
        this.$closeButton ="";
        this.$movieHolder = "";
        this.$playerControls = "";
        this.subtitleMenuButton = "";
        this.subtitleMenu = "";
        this.$controlsholder = "";

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
        //Destroy the plugin instance
        $.data(this, 'plugin_' + pluginName, null);
        $('.PopStopPlayer').remove();
    }
	Plugin.prototype = {
		init: function(){
            $player = $(this.element);
            fullScreenStatus = false;
            moviePoster = this.options.posterPath;
            movieTitle = this.options.title;
            var timeDrag = false;
            var volumeDrag = false;
            textTrack = [];
            textTrackCounter = 0;
            subtitles = {};
            currentText = [];
            self = this;
            this.createPlayer();
            this.getControls();
            this.getSubtitles();
            _loader();

            console.log(this.options.basePath);


            if(this.options.autoPlay === true) {
                self.playerStatus();
            }

            $player.on('loadedmetadata', function() {
                   //Show the total play time
                   $totalTime.html(self.timeFormat($player[0].duration));
                   //Show the current volume level
                   $currentVolume.css("height", $player[0].volume * 100 + "%");
            });
            $player.on("timeupdate", function() {
                     var currentTime = $player[0].currentTime;
                     var duration = $player[0].duration;
                     var bufferEnd =  $player[0].buffered.end(0);
                     //Show the played & buffered time
                     $loadedBar.css("width", self.toPercentage(bufferEnd,duration) + "%");
                     $playedTime.text(self.timeFormat(currentTime));
                     $progressBar.css("width", self.toPercentage(currentTime,duration) + "%");

                    if ($('#subtitleDisplay').find('li').hasClass('selected')){
                        self.setSubtitles(self.timeFormat(currentTime));
                    }
            });
            $player.on("seeked", function() {
                    textTrackCounter = 0;
            });
            $player.on("ended", function () {
                    _destroy();
             });
            $volumeControl.mousedown(function(e) {
                    //Adjust the dragged volume level
                    volumeDrag = true;
                    $player[0].muted = false;
                    self.updateVolume(e.pageY);
            });
            $volumeControl.mouseup(function(e) {
                //Adjust the dragged volume level
                if(volumeDrag) {
                    volumeDrag = false;
                    self.updateVolume(e.pageY);
                }
            });
            $volumeControl.mousemove(function(e) {
                //Adjust the dragged volume level
                if(volumeDrag) {
                    self.updateVolume(e.pageY);
                }
            });
            $progressControl.mousedown(function(e) {
                //Adjust the dragged time
                 timeDrag = true;
                 self.updateBar(e.pageX);
            });
            $progressControl.mouseup(function(e) {
                //Adjust the dragged time
               if(timeDrag) {
                  timeDrag = false;
                  self.updateBar(e.pageX);
               }
            });
            $progressControl.mousemove(function(e) {
               //Adjust the dragged time
               if(timeDrag) {
                  self.updateBar(e.pageX);
               }
            });
            $playerButton.on('click', function(){
                //Play pause
                self.playerStatus();
            });

            $volumeIcon.on('click', function(){
                //Mute the volume
                self.muteSound();
            });
            $(document).on('click', '.subtitle-item', function(){
                var $this = $(this);
                var path = $this.find('span').attr('data-path');
                $this.addClass('selected');
                self.showSubTitles(path);
            });

            $fullScreenButton.on('click', function(){
                //Show hide fullscreen
                self.fullscreenToggle();
            });
            $closeButton.on('click', function(){
                _destroy();
            });
            $controlsholder.hover(
                //Show or hide the controls
                function () {
                    self.showControls('show');
                },
                function () {
                    self.showControls('hide');
                }
            );
            $(window).keypress(function(e) {
                var key = e.keyCode;
                switch (key) {
                    case '32':
                        console.log('Space pressed');
                        break;
                    case '8':
                        console.log('backspace pressed');
                        break;
                    case '27':
                        console.log('escape pressed');
                        break;
                    case 'pause':
                        console.log('Space pressed');
                        break;
                }
            });
		},
        getControls:function() {
            //Get the variables for the controls
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
            $fullScreenButton = $("#fullScreenButton");
            $closeButton = $("#closeButton");
            $movieHolder = $('#movieHolder');
            $playerControls = $('#controls');
            $controlsholder = $('.holder');
            $subtitleMenu = $('#subtitleMenu');
            $subtitleDisplay = $('#subtitleDisplay');
        },

        showControls:function(status) {
            //Show or hide the controls depending on the status
            switch (status) {
                case 'show':
                    if ($playerControls.css('opacity') !== '1') {
                        $playerControls.animate({opacity: 1}, 1500);
                    }
                    break;
                case 'hide':
                    //$playerControls.delay(2000).animate({bottom: '-200px'}, 1500);
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
            //Create a new div with the player controls
            $(this.element).wrap('<div class="PopStopPlayer" />');
            var $PopStopPlayer = $(".PopStopPlayer");

            var output = '<div class="holder">'
                        +'<div id="controls"><div class="control-bar">'
                        +'<div id="progressBar"><div id="played"></div><div id="loadedBar"></div></div>'
                        +'<ul class="left"><li><div class="play" id="playerButton"></div></li>'
                        +'<li><span id="playingTime">00:00 / <span id="totalTime">00:00</span></li></ul>'
                        +'<ul class="right"><li><div id="volume">'
                        +'<div id="volumeIcon" class="volume-max"><span></span></div>'
                        +'<div id="volumeControl">'
                        +'<div id="volumePosition">'
                        +'<div id="currentVolume"></div></div></div></div></li>'
                        +'<li><div id="subtitleMenu">'
                        +'<div id="subtitleMenuIcon"></div><div id="subtitleDisplay"></div></div></li>'
                        +'<li><div id="fullScreenButton"><span></span></div></li></ul>'
                        +'</div></div></div>'
                        +'<div id="subtitleHolder"></div>'
                        +'<span id="closeButton"></span>';
            $PopStopPlayer.append(output);
        },
        updateVolume:function(yPosition) {
            //Get the position
            var position = yPosition - $volumeControl.offset().top;
            var percentage = 100 - (100 * position / $volumeControl.height());

           if(percentage > 100) {
               percentage = 100;
           }
           if(percentage < 0) {
               percentage = 0;
           }
           $player[0].volume = percentage / 100;
           //change sound icon based on volume
           $currentVolume.css('height' , percentage + "%");
           this.speakerChange(percentage);
        },
        playerStatus:function() {
           //Remove the current class
           $playerButton.removeClass($playerButton.attr("class"));
           //Add the class depending on the play status
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
            //Mute the player
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
            //Video duration
           var max_duration = $player.get(0).duration;
           //Get the click position
           var position = xPosition - $progressControl.offset().left;
           var percentage = 100 * position / $progressControl.width();

           //Check within range
           if(percentage > 100) {
              percentage = 100;
           }
           if(percentage < 0) {
              percentage = 0;
           }
            //Update progress bar and video current time
            $progressBar.css('width', percentage+'%');
            $player[0].currentTime = max_duration * percentage / 100;
        },
        speakerChange:function(percentage) {
            //Remove the current class
            $volumeIcon.removeClass($volumeIcon.attr("class"));

            //Add the class depending on the percentage
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

        fullscreenToggle:function(o){
           //Get the fullscreen status in multiple browsers
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
          //Return the percentage
          return (num/amount*100).toFixed(2);
        },
        timeFormat:function (seconds){
            //Calculate the time in minutes and seconds
            minutes = Math.floor(seconds / 60);
            minutes = (minutes >= 10) ? minutes : "0" + minutes;
            seconds = Math.floor(seconds % 60);
            seconds = (seconds >= 10) ? seconds : "0" + seconds;
            var format = minutes + ":" + seconds;

            if (format.replace(/:/g,"").length == 4) {
                format = '00:' + format;
            }

            return format;
        },
        getSubtitles:function() {
            var data = {function : "getMovieSubtitles", path : this.options.basePath};
            $.ajax({type: 'GET', url: 'bootstrap.php', data:data}).done(function(response) {
                var output = '<ul>';
                $.each(response, function (key, val) {
                    output += '<li class="subtitle-item"><label><input type="checkbox" class="subtitle-check">'
                            +'<span data-path="' + val.path + '">' + val.name + '</span></label</li>';
                });
                output += '</ul>';
                $subtitleDisplay.html(output);
            });
        },
        showSubTitles:function(path) {
            var st, n, i, o, t, is, os;
            var text = $.ajax({type: 'GET', url: path, async: false}).responseText;
            //textTrack[i] = this.parseSRT(subtitle);
            //textTrackCounter[i]=0;
            srt = text.replace(/\r\n|\r|\n/g, '\n');
            srt = this.strip(srt);
            var srt_ = srt.split('\n\n');
            var count = 0;
            for(s in srt_) {
                st = srt_[s].split('\n');
                if(st.length >=2) {
                    n = st[0];
                    i = this.strip(st[1].split(' --> ')[0]);
                    o = this.strip(st[1].split(' --> ')[1]);
                    t = st[2];
                    if(st.length > 2) {
                        for(j=3; j<st.length;j++)
                            t += '\n'+st[j];
                    }
                    is = this.toSeconds(i);
                    os = this.toSeconds(o);
                    subtitles[count] = {i:i, o: o, t: t};
                    count++;
                }
            }
            console.log(subtitles);
        },
        setSubtitles:function(currentTime) {
            var subtitle = '';
            var start = subtitles[textTrackCounter].i.split(',')[0];
            var end = '';

            for (s in subtitles) {
                end = subtitles[textTrackCounter].o.split(',')[0];
                if(end < currentTime) {
                    textTrackCounter++;
                } else {
                    break;
                }
            }

            if (currentTime > start  &&  currentTime < end) {
                subtitle = subtitles[textTrackCounter].t;
                $('#subtitleHolder').html('<p>' + subtitle + '</p>');
                textTrackCounter++;
            } else if(end < currentTime) {
                $('#subtitleHolder').html('');
            }

        },
        toSeconds:function(t) {
            tc1 = t.split(',');
            tc2 = tc1[0].split(':');
            secs = Math.floor(tc2[0]*60*60) + Math.floor(tc2[1]*60) + Math.floor(tc2[2]);
            return secs;
        },
        strip:function(s) {
            return s.replace(/^\s+|\s+$/g,"");
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
