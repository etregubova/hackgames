'use strict'

angular.module('app')

    .directive('back', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.bind('click', goBack);

                function goBack() {
                    history.back();
                    scope.$apply();
                }
            }
        };
    })

    .directive('rules', function ($timeout, $rootScope) {
        // return the directive link function. (compile function not needed)
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
                        scope.isEatable = rounds[curIndex].isEatable;
                        scope.color = rounds[curIndex].color;
                        console.log(scope.isEatable + " : " + scope.color);
                    }
                } else {
                    passedSeconds++;
                }
            }

            // watch the expression, and update the UI on change.
            scope.$watch(attrs.rules, function (value) {
                rounds = value;
                if (!rounds) {
                    return;
                }
                updateRule();
                updateLater();
            });

            // schedule update in one second
            function updateLater() {
                if (curIndex < rounds.length) {
                    // save the timeoutId for canceling
                    timeoutId = $timeout(function () {
                        updateRule(); // update DOM
                        updateLater(); // schedule another update
                    }, 1000);
                }
            }

            // listen on DOM destroy (removal) event, and cancel the next UI update
            // to prevent updating time ofter the DOM element was removed.
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
    })

    .directive('field', function () {
        return function (scope, element, attrs) {
            if (element[0].getContext) {
                var context = element[0].getContext('2d');

                context.canvas.width = 250;
                context.canvas.height = 250;

                context.fillStyle = "rgb(60,60,60)";
                context.fillRect(0, 0, context.canvas.width, context.canvas.height);
            }
        };
    });