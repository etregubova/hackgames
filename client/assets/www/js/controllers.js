'use strict';

/* Controllers */

angular.module('app')
    .controller('AppCtrl', function ($scope, $http, socket, server) {
    })

    .controller('MenuCtrl', function ($scope, $http, socket, server) {
    })

    .controller('RatingCtrl', function ($scope, $http, socket, server) {
        $scope.players = [
            {id: 1, name: 'Катя', score: 55, tournaments: 3}
        ];
    })

    .controller('DuelCtrl', ['$scope', 'Application', function ($scope, Application) {
        $('#modalWait').modal('show');

        Application.setupDuel();

        $scope.$on('duel:start', function () {
            $('#modalWait').modal('hide');
        });
    }])

    .controller('RegistrationCtrl',function ($scope, Team, $location, $window) {
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