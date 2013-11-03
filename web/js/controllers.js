'use strict';

/* Controllers */

angular.module('app')
    .controller('AppCtrl', function ($scope, $rootScope, socket, Application) {
    })

    .controller('RatingCtrl', function ($scope, socket) {
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

        socket.on('rating:updated', function (players) {
            $scope.players = players;
        });
    });