'use strict'

/* Application */

angular.module('app', [
        'ngRoute',
        'ngAnimate'
    ])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/rating', {templateUrl: 'views/rating.html', controller: 'RatingCtrl'});
        $routeProvider.otherwise({redirectTo: '/rating'});
    }]).
    constant('server', "http://172.17.5.101:3000")
    .run(function ($http, server) {
        //do nothing now
    });