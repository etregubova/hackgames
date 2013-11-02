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
        var service = {
            setupDuel: function () {
                socket.emit('duel:join');
            },
            cancelDuel: function () {
                socket.emit('duel:cancel');
            }
        };

        socket.on('duel:joined', function (duelId) {
            $rootScope.$broadcast('duel:joined', duelId);
        })

        socket.on('duel:start', function (duelId) {
            $rootScope.$broadcast('duel:start', duelId);
        })

        return service;
    }]);
