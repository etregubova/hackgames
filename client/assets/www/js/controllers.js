'use strict';

/* Controllers */

angular.module('app').

    controller('MenuCtrl', function ($scope, $http, socket, server) {
    })

    .controller('RatingCtrl', function ($scope, $http, socket) {

        socket.emit("player:getRating", {}, function (data) {
            $scope.players = data;
        });

        socket.on('player:added', function (player) {
            $scope.players.push(player);
        });

        socket.on('player:removed', function (playerName) {
            for (var index = 0; index < $scope.players.length; ++index) {
                if ($scope.players[index].name === playerName) {
                    $scope.players.splice(index, 1);
                    return;
                }
            }
        });
    })

    .controller('RegistrationCtrl', function ($scope, Player, $location) {
        if (Player.isLoggedIn()) {
            $location.path('/menu')
        }
        $scope.start = function () {
            Player.register({name: $scope.playerName}, function () {
                $location.path('/menu')
            })
        };
    })

    .controller('DuelCtrl', ['$scope', '$window', '$location', 'Application', function ($scope, $window, $location, Application) {
        Application.setupDuel();

        $scope.$on('duel:joined', function (event, duelId) {
            $scope.duelId = duelId;
        });

        $scope.$on('duel:start', function (event, duelId) {
            if ($scope.duelId === duelId) {
                $location.path('/menu')
            }
        });

        $scope.cancel = function () {
            Application.cancelDuel(function () {
                $location.path('/menu')
            });
        };
    }])
