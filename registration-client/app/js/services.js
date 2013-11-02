'use strict';

/* Services */

angular.module('hackGames.services', []).
    factory('socket', function ($rootScope, serverHost) {
        var socket = io.connect(serverHost);
        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    })
                })
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                })
            }
        }
    })
    .factory('Team', function ($http, serverHost, $cookies) {
        var team;

        //pre-load team by cookie
        if ($cookies.teamName) {
            $http.get(serverHost + '/api/teams/' + $cookies.teamName).success(function (data) {
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
                    post(serverHost + "/api/teams", addedTeam).
                    success(function (data) {
                        team = data;
                        $cookies.teamName = addedTeam.name;
                        callback();
                    })
            }
        }
    });
