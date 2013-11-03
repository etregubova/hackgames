'use strict'

/* Application */

angular.module('app', [
        'ngRoute',
        'ngAnimate'
    ])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/splash', {templateUrl: 'views/splash.html', controller: 'SplashCtrl'});
        $routeProvider.when('/registration', {templateUrl: 'views/registration.html', controller: 'RegistrationCtrl'});
        $routeProvider.when('/menu', {templateUrl: 'views/menu.html', controller: 'MenuCtrl'});
        $routeProvider.when('/settings', {templateUrl: 'views/settings.html', controller: 'SettingsCtrl'});
        $routeProvider.when('/rating', {templateUrl: 'views/rating.html', controller: 'RatingCtrl'});
        $routeProvider.when('/tournament', {templateUrl: 'views/tournament.html', controller: 'TournamentCtrl'});
        $routeProvider.when('/duel', {templateUrl: 'views/wait.html', controller: 'DuelCtrl'});
        $routeProvider.when('/duel/play', {templateUrl: 'views/duel.html', controller: 'DuelGameCtrl'});
        $routeProvider.when('/training', {templateUrl: 'views/training.html', controller: 'TrainingCtrl'});
        $routeProvider.otherwise({redirectTo: '/registration'});
    }]).
    constant('server', "http://172.17.4.115:3000")
    .run(function ($http, server) {
        //do nothing now
    });