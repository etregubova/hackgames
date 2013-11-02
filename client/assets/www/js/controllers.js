'use strict';

/* Controllers */

angular.module('app.controllers', []).

    controller('MenuCtrl', function ($scope, $http, socket, server) {
        $http.get(server + '/api/teams').success(function (data) {
            $scope.teams = data
        });

        $scope.$on('team:added', function (event, team) {
            $scope.teams.push(team);
        });

    })

    .controller('RatingCtrl',function ($scope, $http, socket, server) {
        $scope.players = [
            {id: 1, name: 'Катя', score: 55, tournaments: 3}
        ];
    }).

    controller('RegistrationCtrl',function ($scope, Team, $location, $window) {
        if (Team.hasTeam()) {
            $location.path('/menu')
        }

        $scope.addTeam = function () {
            Team.registerTeam({name: $scope.teamName}, function () {
                $window.alert("Registered");
                $location.path('/menu')
            })
        };

    }).

    controller('TeamsCtrl', function ($scope, $http, server, socket) {

        $http.get(server + "/api/teams").success(function (data) {
            $scope.teams = data;
        });

        socket.on('team:added', function (team) {
            $scope.teams.push(team);
        })
    });