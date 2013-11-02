'use strict';

/* Controllers */

angular.module('app').

    controller('MenuCtrl', function ($scope, $http, socket, server) {
    })

    .controller('RatingCtrl',function ($scope, $http, socket, server) {
        $scope.players = [
            {id: 1, name: 'Катя', score: 55, tournaments: 3}
        ];

        $http.get(server + "/api/players").success(function (data) {
            $scope.players = data;
        });

        socket.on('player:added', function (player) {
            $scope.players.push(player);
        })
    }).

    controller('RegistrationCtrl', function ($scope, Player, $location) {
        if (Player.isLoggedIn()) {
            $location.path('/menu')
        }
        $scope.start = function () {
            Player.register({name: $scope.playerName}, function () {
                $location.path('/menu')
            })
        };
    })

    .controller('DuelCtrl', ['$scope', 'Application', function ($scope, Application) {
        $('#modalWait').modal('show');

        Application.setupDuel();

        $scope.$on('duel:start', function () {
            $('#modalWait').modal('hide');
        });
    }])
