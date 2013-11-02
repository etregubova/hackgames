'use strict'

/* Application */

angular.module('app', [
        'ngRoute',
        'ngAnimate',
        'app.controllers',
        'app.services'
    ])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/menu', {templateUrl: 'views/menu.html', controller: 'AppCtrl'});
        $routeProvider.when('/rating', {templateUrl: 'views/rating.html', controller: 'RatingCtrl'});
        $routeProvider.otherwise({redirectTo: '/menu'});
    }]).
    constant('server', "http://localhost:3000");