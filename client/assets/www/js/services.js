'use strict';

/* Services */

angular.module('app')

    .factory('Player', function (socket, server, $window) {
        var player;

        return {

            isLoggedIn: function () {
                return player != null;
            },

            getPlayer: function () {
                return player;
            },

            register: function (addedPlayer, callback) {
                player = addedPlayer;
                socket.emit('player:added', addedPlayer);
                callback();
            }
        }
    })

    .factory('Application', ['$rootScope', 'socket', '$http', 'server', function ($rootScope, socket, $http, server) {
        var player = {
            name: 'robot1'
        };

        var service = {
            setupDuel: function () {
                socket.emit('duel:join', player.name);
            }
        };

        socket.on('duel:start', function (playerName) {
            if (player.name === playerName) {
                $rootScope.$broadcast('duel:start');
            }
        })

        return service;
    }]);
