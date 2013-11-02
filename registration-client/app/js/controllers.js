'use strict';

/* Controllers */

angular.module('hackGames.controllers', []).
    controller('RegistrationCtrl',function ($scope, $http, serverHost, $location) {

        $scope.addTeam = function () {
            $http.post(serverHost + "/api/teams", {
                name: $scope.teamName
            }).success(function () {
                    $location.path('/teams')
                })
        };

    }).
    controller('TeamsCtrl', function ($scope, $http, serverHost, socket) {

        $http.get(serverHost + "/api/teams").success(function (data) {
            $scope.teams = data;
        })

        socket.on('team:added', function (team) {
            $scope.teams.push(team);
        })
    });