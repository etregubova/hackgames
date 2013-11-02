'use strict';

/* Controllers */

angular.module('app.controllers', []).
    controller('AppCtrl', function ($scope, $http, socket, server) {
        $http.get(server + '/api/teams').success(function (data) {
            $scope.teams = data
        });

        $scope.$on('team:added', function (event, team) {
            $scope.teams.push(team);
        });

    })
    .controller('RatingCtrl', function ($scope, $http, socket, server) {
        $scope.players = [
            {id: 1, name: 'Катя', score: 55, tournaments: 3}
        ];
    });