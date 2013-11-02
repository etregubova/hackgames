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
    .directive('clickLink', ['$location', function ($location) {
        return {
            link: function (scope, element, attrs) {
                attrs.$observe('clickLink', function (value) {
                    element.on('click', function () {
                        scope.$apply(function () {
                            $location.path(attrs.clickLink);
                        });
                    });
                });
            }
        }
    }]);