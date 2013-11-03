'use strict'

/* Application */

angular.module('app', [
        'ngRoute',
        'ngAnimate'
    ])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/splash', {templateUrl: 'views/splash.html', controller: 'SplashCtrl'});
        $routeProvider.when('/play', {templateUrl: 'views/play.html', controller: 'GameCtrl'});
        $routeProvider.otherwise({redirectTo: '/splash'});
    }]).
    constant('server', "http://172.17.4.115:3000")
    .run(function ($http, server) {
        //do nothing now
    });