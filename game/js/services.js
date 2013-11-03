'use strict';

/* Services */

angular.module('app')
    .factory('Application', function ($rootScope, $location, socket) {
        var service = {
            getCurrentDuel: function () {
                return currentDuel;
            },

            updateCurrentDuelScore: function (duel) {
                currentDuel.player1.score = duel.player1.score;
                currentDuel.player2.score = duel.player2.score;
            }
        };

        var currentDuel = {};

        socket.on('duel:start', function (duel) {
            if (!currentDuel) {
                currentDuel = duel;
                $location.path('/play');
            }
        });

        socket.on('duel:end', function (duelId) {
            if (!currentDuel && currentDuel.id === duelId) {
                currentDuel = null;
                $location.path('/splash');
            }
        });

        return service;
    });