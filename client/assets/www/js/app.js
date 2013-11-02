'use strict'

/* Application */

angular.module('app', [
        'ngRoute',
        'ngCookies',
        'ngAnimate',
        'app.controllers',
        'app.services'
    ])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/registration', {templateUrl: 'views/registration.html', controller: 'RegistrationCtrl'});
        $routeProvider.when('/teams', {templateUrl: 'views/teams.html', controller: 'TeamsCtrl'});
        $routeProvider.when('/menu', {templateUrl: 'views/menu.html', controller: 'MenuCtrl'});
        $routeProvider.when('/rating', {templateUrl: 'views/rating.html', controller: 'RatingCtrl'});
        $routeProvider.otherwise({redirectTo: '/registration'});
    }]).
    constant('server', "http://172.17.4.195:3000")
    .run(function ($cookies, $http, server, Team) {
        //pre-load team by cookie
        //TODO the result is visible redirect from registration to teams
        if ($cookies.teamName) {
            $http.get(server + '/api/teams/' + $cookies.teamName).
                success(function (data) {
                    Team.setTeam(data);
                }).
                error(function () {
                    console.log("Team wasn't found");
                    //do nothing
                })
        }
    });