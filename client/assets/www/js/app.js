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
        $routeProvider.when('/duel/wait', {templateUrl: 'views/wait.html', controller: 'DuelWaitCtrl'});
        $routeProvider.when('/duel/play', {templateUrl: 'views/duel.html', controller: 'DuelGameCtrl'});
        $routeProvider.when('/duel/result', {templateUrl: 'views/duel_result.html', controller: 'DuelResultCtrl'});
        $routeProvider.when('/training', {templateUrl: 'views/training.html', controller: 'TrainingCtrl'});
        $routeProvider.otherwise({redirectTo: '/registration'});
    }]).
    constant('server', "http://172.17.5.145:3000")
    .run(function ($http, server, socket, Player) {
        document.addEventListener("deviceready", function () {
            document.addEventListener("backbutton", function () {
                var player = Player.getPlayer();
                if (player != null && player != undefined) {
                    socket.emit('player:removed', player.name);
                }
                navigator.app.exitApp();
            }, false);
        }, false);
    });