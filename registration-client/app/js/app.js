'use strict';


// Declare app level module which depends on filters, and services
angular.module('hackGames', [
        'ngRoute',
        'ngCookies',
        'hackGames.filters',
        'hackGames.services',
        'hackGames.directives',
        'hackGames.controllers'
    ]).
    config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/registration', {templateUrl: 'partials/registration.html', controller: 'RegistrationCtrl'});
        $routeProvider.when('/teams', {templateUrl: 'partials/teams.html', controller: 'TeamsCtrl'});
        $routeProvider.otherwise({redirectTo: '/registration'});
    }])
    .constant('serverHost', "http://localhost:3000")
    .run(function ($cookies, $http, serverHost, Team) {
        //pre-load team by cookie
        //TODO the result is visible redirect from registration to teams
        if ($cookies.teamName) {
            $http.get(serverHost + '/api/teams/' + $cookies.teamName).success(function (data) {
                Team.setTeam(data);
            })
        }
    });