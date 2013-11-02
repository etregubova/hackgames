'use strict';

/* Services */

angular.module('app.services', [])

    .factory('Team', function ($http, server, $cookies, $window) {
        var team;

        //pre-load team by cookie
        if ($cookies.teamName) {
            $http.get(server + '/api/teams/' + $cookies.teamName).success(function (data) {
                team = data;
            })
        }

        return {

            hasTeam: function () {
                return team != null;
            },

            getTeam: function () {
                return team;
            },

            setTeam: function (data) {
                team = data;
            },

            registerTeam: function (addedTeam, callback) {
                $http.
                    post(server + "/api/teams", addedTeam).
                    success(function (data) {
                        $window.alert("Saved");
                        team = data;
                        callback();
                    }).
                    error(function (data, status, headers, config) {
                        //do nothing
                    })
            }
        }
    });