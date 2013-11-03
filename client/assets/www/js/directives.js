'use strict'

angular.module('app')

    .directive('rules', function ($timeout, $rootScope) {
        return function (scope, element, attrs) {
            var rounds;
            var timeoutId;
            var curIndex = 0;

            var passedSeconds = 0;

            function updateRule() {
                if (passedSeconds === rounds[curIndex].duration) {
                    curIndex++;
                    passedSeconds = 0;
                    if (curIndex > rounds.length) {
                        $timeout.cancel(timeoutId);
                    } else {
                        console.log(scope.isEatable + " : " + scope.color);
                    }
                } else {
                    passedSeconds++;
                }

                if (curIndex < rounds.length) {
                    setIsEatable(rounds[curIndex].isEatable);
                    setColor(rounds[curIndex].color);
                }
            }

            scope.$watch(attrs.rules, function (value) {
                rounds = value;
                if (!rounds) {
                    return;
                }

                updateRule();
                updateLater();
            });

            function updateLater() {
                if (curIndex < rounds.length) {
                    // save the timeoutId for canceling
                    timeoutId = $timeout(function () {
                        updateRule(); // update DOM
                        updateLater(); // schedule another update
                    }, 1000);
                }
            }

            function setIsEatable(isEatable) {
                scope.isEatable = isEatable;
                scope.curIsEatable = isEatable ? 'content/image/eatable.png' : 'content/image/not-eatable.png';
            }

            function setColor(color) {
                scope.color = color;

                switch (color) {
                    case 'blue':
                        scope.curColor = 'content/image/blue.png';
                        break;
                    case 'yellow':
                        scope.curColor = 'content/image/yellow.png';
                        break;
                    case 'green':
                        scope.curColor = 'content/image/green.png';
                        break;
                    case 'red':
                        scope.curColor = 'content/image/red.png';
                        break;
                }
            }

            element.bind('$destroy', function () {
                $timeout.cancel(timeoutId);
            });
        };
    })

    .directive('timer', function ($timeout, dateFilter, $rootScope) {
        // return the directive link function. (compile function not needed)
        return function (scope, element, attrs) {
            var format = 'mm:ss';
            var seconds;
            var timeoutId;

            // used to update the UI
            function updateTime() {
                seconds--;

                if (seconds < 5) {
                    element.addClass('label-danger');
                }

                var milliseconds = seconds * 1000;
                element.text(dateFilter(new Date(milliseconds), format));
                if (seconds === 0) {
                    $rootScope.$broadcast("timer:ended");
                    $timeout.cancel(timeoutId);
                }
            }

            // watch the expression, and update the UI on change.
            scope.$watch(attrs.timer, function (value) {
                element.addClass('label');
                element.addClass('label-success');

                seconds = value;
                updateTime();
                updateLater();
            });

            // schedule update in one second
            function updateLater() {
                if (seconds > 0) {
                    // save the timeoutId for canceling
                    timeoutId = $timeout(function () {
                        updateTime(); // update DOM
                        updateLater(); // schedule another update
                    }, 1000);
                }
            }

            // listen on DOM destroy (removal) event, and cancel the next UI update
            // to prevent updating time ofter the DOM element was removed.
            element.bind('$destroy', function () {
                $timeout.cancel(timeoutId);
            });

            scope.$on('training:reinit', function () {
                element.removeClass('label-danger');
                element.addClass('label-success');

                seconds = 30;
                updateTime();
                updateLater();
            });
        };
    })

    .directive('background', function () {
        return function (scope, element) {
            var loaded = false;
            var soundOn = false;

            function init() {
                if (!createjs.Sound.initializeDefaultPlugins()) {
                    return;
                }

                createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.FlashPlugin, createjs.HTMLAudioPlugin]);

                createjs.Sound.addEventListener("fileload", createjs.proxy(handleLoad, this));
                createjs.Sound.registerSound("content/background.mp3", "sound");
            }

            function handleLoad() {
                loaded = true;
                play();
            }

            function handleComplete() {
                play();
            }

            function play() {
                if (loaded && soundOn) {
                    var instance = createjs.Sound.play("sound");
                    instance.addEventListener("complete", createjs.proxy(handleComplete, this));
                }
            }

            function stop() {
                soundOn = false;
                if (loaded) {
                    createjs.Sound.stop();
                }
            }

            scope.$on('background-sound:on', function () {
                element.click();
            });

            scope.$on('background-sound:off', function () {
                stop();
            });

            init();

            element.context.addEventListener("click", function () {
                soundOn = true;
                play();
            }, false);

            element.click();
        };
    });