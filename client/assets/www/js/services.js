'use strict';

/* Services */

angular.module('app')

    .factory('Player', function (socket, server, $window) {
        var player;
        var localStorage = $window['localStorage'];

        return {

            hasPreviousUser: function () {
                var previousUserName = localStorage.getItem('previousUser');
                return previousUserName != null;
            },

            getPreviousUser: function () {
                var previousUserName = localStorage.getItem('previousUser');
                return {name: previousUserName};
            },

            getPlayer: function () {
                return player;
            },

            register: function (addedPlayer, callback) {
                localStorage.setItem('previousUser', addedPlayer.name);
                socket.emit('player:added', addedPlayer, function (savedPlayer) {
                    player = savedPlayer;
                    callback();
                });
            },

            logOut: function (callback) {
                socket.emit('player:removed', player.name, function () {
                    localStorage.removeItem('previousUser');
                    callback();
                });
            }
        }
    })

    .factory('Application', function ($rootScope, socket, Player) {
        var service = {
            setupDuel: function () {
                socket.emit('duel:join', {}, function (duel) {
                    if (duel.status == 'started') {
                        currentDuel = duel;
                        $rootScope.$broadcast('duel:start', duel);
                    } else if (duel.status == 'waiting') {
                        currentDuel = duel;
                    }
                });
            },

            cancelDuel: function (callback) {
                socket.emit('duel:cancel', {}, function () {
                    currentDuel = null;
                    callback();
                });
            },

            getCurrentDuel: function () {
                return currentDuel;
            },

            updateCurrentDuelScore: function (duel) {
                currentDuel.player1.score = duel.player1.score;
                currentDuel.player2.score = duel.player2.score;
            }
        };

        var currentDuel;

        socket.on('duel:start', function (duel) {
            if (duel.player1.name == Player.getPlayer().name && currentDuel.id == duel.id) {
                currentDuel = duel;
                $rootScope.$broadcast('duel:start', duel);
            }
        });

        return service;
    });
