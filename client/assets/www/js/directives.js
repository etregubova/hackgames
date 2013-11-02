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
        }
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
        }
    })

    .directive('field', function ($timeout) {
        return function (scope, element, attrs) {
            scope.$watch('window', function (value) {
                var window = value;

                var canvasWidth = window.innerWidth * 0.9;
                var canvasHeight = window.innerHeight * 0.7;

                if (element[0].getContext) {
                    var context = element[0].getContext('2d');

                    context.canvas.width  = canvasWidth;
                    context.canvas.height = canvasHeight;

                    context.fillStyle = "rgb(60,60,60)";
                    context.fillRect(2, 2, canvasWidth, canvasHeight);
                }
            });
        }
    });