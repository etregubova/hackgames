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
                socket.emit('player:added', addedPlayer, function (savedPlayer) {
                    player = savedPlayer;
                    callback();
                });
            }
        }
    })

    .factory('Application', ['$rootScope', 'socket', function ($rootScope, socket) {
        var service = {
            setupDuel: function () {
                socket.emit('duel:join');
            },
            cancelDuel: function (callback) {
                socket.emit('duel:cancel', {}, function () {
                    callback();
                });
            }
        };

        socket.on('duel:joined', function (duelId) {
            $rootScope.$broadcast('duel:joined', duelId);
        });

        socket.on('duel:start', function (duelId) {
            $rootScope.$broadcast('duel:start', duelId);
        });

        return service;
    }]);
