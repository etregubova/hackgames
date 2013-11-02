'use strict';

/* Controllers */

angular.module('hackGames.controllers', []).
    controller('RegistrationCtrl', ['$scope', 'Team', 'serverHost', '$location', function ($scope, Team, serverHost, $location) {
        if (Team.hasTeam()) {
            $location.path('/teams')
        }

        $scope.addTeam = function () {
            Team.registerTeam({name: $scope.teamName}, function () {
                $location.path('/teams')
            })
        };

    }]).
    controller('TeamsCtrl', ['$scope', '$http', 'serverHost', 'socket', function ($scope, $http, serverHost, socket) {

        $http.get(serverHost + "/api/teams").success(function (data) {
            $scope.teams = data;
        });

        socket.on('team:added', function (team) {
            $scope.teams.push(team);
        })
    }]);