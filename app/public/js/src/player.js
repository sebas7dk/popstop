/*
 *  PopStop Player to play HTML5 videos
 *
 *  Made by Sebastian de Kok
 *  Under MIT License
 */
;(function ($, window, document, undefined) {
    	// default properties.
        var selfName = "PopStopPlayer",
                        defaults = {
                        autoPlay : "",
                        posterPath : "",
                        title: ""


        };

	// self constructor.
	function self(element,options){
		this.element = element;
		this.options = $.extend({},defaults,options);
        this.$player ="";
        this.self =""
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
        this.$controlsholder = "";

		this.init();
	}

    function _loader() {
        $player.on('loadstart', function () {
            $('body').addClass('loading')
            this.showControls('pause');
        });
        $player.on('canplay', function () {
            $('body').removeClass('loading')
            this.showControls('play');
        });
    }

	self.prototype = {
		init: function(){
            $player = $(this.element);
            fullScreenStatus = false;
            moviePoster = this.options.posterPath;
            movieTitle = this.options.title;
            var timeDrag = false;
            var volumeDrag = false;
            self = this;
            this.createPlayer();
            this.getControls();
            _loader();


            if(this.options.autoPlay === true) {
                self.playerStatus();
            }

            $player.on('loadedmetadata', function() {
                   //Show the total play time
                   $totalTime.html(self.timeFormat($player[0].duration));
                   //Show the current volume level
                   $currentVolume.css("height", $player[0].volume * 100 + "%");
             });
            $player.on("timeupdate", function () {
                     //Show the played & buffered time
                     $loadedBar.css("width", self.toPercentage($player[0].buffered.end(0),$player[0].duration) + "%");
                     $playedTime.text(self.timeFormat($player[0].currentTime));
                     $progressBar.css("width", self.toPercentage($player[0].currentTime,$player[0].duration) + "%");
             });
            $player.on("ended", function () {
                    $movieHolder.html('');
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

            $fullScreenButton.on('click', function(){
                //Show hide fullscreen
                self.fullscreenToggle();
            });
            $closeButton.on('click', function(){
                //Hide the player
                $movieHolder.html('');
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
        },

        showControls:function(status) {
            //Show or hide the controls depending on the status
            switch (status) {
                case 'show':
                    if ($playerControls.css('bottom') !== '60px') {
                        $playerControls.animate({bottom: '60px'}, 1500);
                    }
                    break;
                case 'hide':
                    $playerControls.delay(200).animate({bottom: '-200px'}, 1500);
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
                        +'<div id="controls"><div class="info">'
                        +'<div class="poster" style="background-image: url('+ moviePoster +')"></div><div class="title">'+ movieTitle +'</div></div>'
                        +'<div class="control-bar">'
                        +'<div class="play" id="playerButton"></div>'
                        +'<div id="playingTime">00:00</div>'
                        +'<div id="progressBar"><div id="played"></div><div id="loadedBar"></div></div>'
                        +'<div id="totalTime">00:00</div>'
                        +'<div id="volume">'
                        +'<div id="volumeIcon" class="volume-max"><span></span></div>'
                        +'<div id="volumeControl">'
                        +'<div id="volumePosition">'
                        +'<div id="currentVolume"></div>'
                        +' </div></div></div>'
                        +'<div id="fullScreenButton"><span></span></div></div>'
                        +'</div></div></div><span id="closeButton"></span>';
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
            return minutes + ":" + seconds;
        }

    };
    // preventing against multiple instantiations
    $.fn[ selfName ] = function ( options ) {
        return this.each(function() {
            if (!$.data( this, "self_" + selfName)) {
                $.data( this, "self_" + selfName, new self( this, options ) );
            }
        });
    };

})( jQuery, window, document );
