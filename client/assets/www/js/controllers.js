'use strict';

/* Controllers */

angular.module('app')
    .controller('AppCtrl', function ($scope, $rootScope, $location, Application) {
        $scope.back = function () {
            $rootScope.$broadcast('back');
        };

        $scope.hide = function () {
            return $location.path() === '/registration' ||
                $location.path() === '/duel/wait' ||
                $location.path() === '/training' ||
                $location.path() === '/duel/play';
        };
    })

    .controller('MenuCtrl', function ($scope, $location, $window, Player) {
        $scope.exit = function () {
            Player.logOut();
            $location.path('/registration');
        };

        $scope.$on('back', function () {
            $scope.exit();
        });
    })

    .controller('SettingsCtrl', function ($scope) {
        $scope.$on('back', function () {
            history.back();
        });
    })

    .controller('RatingCtrl', function ($scope, $http, $location, socket) {
        $scope.$on('back', function () {
            $location.path('/menu');
        });

        socket.emit("player:getRating", {}, function (data) {
            $scope.players = data;
        });

        socket.on('player:added', function (player) {
            $scope.players.push(player);
        });

        socket.on('player:removed', function (playerName) {
            for (var index = 0; index < $scope.players.length; ++index) {
                if ($scope.players[index].name === playerName) {
                    $scope.players.splice(index, 1);
                    return;
                }
            }
        });
    })

    .controller('RegistrationCtrl', function ($scope, Player, $location) {
        if (Player.hasPreviousUser()) {
            Player.register(Player.getPreviousUser(), function () {
                $location.path('/menu');
            });
        } else {
            $scope.start = function () {
                Player.register({name: $scope.playerName}, function () {
                    $location.path('/menu')
                })
            };
        }
    })

    //THIS IS A COPY PASTE FROM DuelGameController. You have to duplicate all changes!!!
    .controller('TrainingCtrl', ['$scope', 'Application', 'Player', 'socket', function ($scope, Application, Player, socket) {
        var queue;


        var manifest = [
            {id: "image_bird", src: "content/flying/bird.png"},
            {id: "image_book", src: "content/flying/book.png"}
        ];

        var successShotPoints;
        var wrongShotPoints;
        $scope.score = 0;

        /*!
         * Initializes and loads resources.
         */
        $scope.init = function () {
            socket.emit('game:training', {}, function (s) {
                $scope.scenario = s;
                $scope.rounds = s.rounds;
            });

            $scope.stage = new createjs.Stage("gameCanvas");
            createjs.Touch.enable($scope.stage);

            /* Take into account "Mobile Safe Approach":
             http://www.createjs.com/Docs/SoundJS/classes/Sound.html
             */
            createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.FlashPlugin, createjs.HTMLAudioPlugin]);
            /* We provide here 20 channels instead of the default value 2,
             because users can surely touch more than 2 times in very small time duration.
             When we will use sound with smaller duration for destroy - we can probably remove this line.
             */
            createjs.Sound.registerSound("content/thunder.ogg", "sound_thunder", 20);
            queue = new createjs.LoadQueue(false);
            queue.installPlugin(createjs.Sound);
            queue.addEventListener("complete", $scope.handleLoadComplete);
            queue.loadManifest(manifest);
        }

        /*!
         * Initializes game board, prepares all objects.
         * Will be called right after all resources will be loaded.
         *
         * @param event   resource loaded complete event
         */
        $scope.handleLoadComplete = function (event) {
            successShotPoints = $scope.scenario.successShotPoints;
            wrongShotPoints = $scope.scenario.wrongShotPoints;

            /* Setting up game canvas related objects. */
            for (var i in $scope.scenario.objects) {
                var obj = $scope.scenario.objects[i];
                /*console.log("Initialization of object, id=" + obj.id);*/

                var object = new createjs.Bitmap(queue.getResult(obj.type));
                var from_ = $scope.adjustBorderlineCoordinate(obj.from);
                object.x = from_.x;
                object.y = from_.y;
                object.on("click", $scope.handleObjectTouched, null, true, {canvasObject : object, objectInfo : obj});

                var to_ = $scope.adjustBorderlineCoordinate(obj.to);
                createjs.Tween.get(object).wait(obj.delayTimeMillis).to({x: to_.x, y: to_.y}, obj.availableMillis);

                $scope.stage.addChild(object);
            }
            createjs.Ticker.addEventListener("tick", $scope.updateStage);
        }

        var IMAGE_SIZE = 32;

        $scope.adjustBorderlineCoordinate = function (point) {
            if (point.x == 0) {
                point.x -= IMAGE_SIZE;
            } else {
                point.x += IMAGE_SIZE / 2;
            }
            if (point.y == 0) {
                point.y -= IMAGE_SIZE;
            } else {
                point.y += IMAGE_SIZE / 2;
            }
            return point
        }

        /*
         * Destroys clicked/touched object.
         *
         * @param event   object clicked/touched event
         * @param object   the object
         */
        $scope.handleObjectTouched = function (event, objectStructure) {
            if ($scope.isEatable == objectStructure.objectInfo.isEatable  && $scope.color === objectStructure.objectInfo.color) {
                $scope.score += successShotPoints;
            } else {
                $scope.score += wrongShotPoints;
            }

            $scope.stage.removeChild(objectStructure.canvasObject);
            var instance = createjs.Sound.play("sound_thunder");
            instance.volume = 0.5;
        };

        $scope.updateStage = function (event) {
            $scope.stage.update();
        };

        $scope.init();
    }])

    //THIS IS A COPY PASTE FROM TrainingController. You have to duplicate all changes!!!
    .controller('DuelGameCtrl', ['$scope', 'Application', 'Player', 'socket', '$location', function ($scope, Application, Player, socket, $location) {
        var queue;

        var manifest = [
            {id: "image_bird", src: "content/flying/bird.png"},
            {id: "image_book", src: "content/flying/book.png"}
        ];

        $scope.duel = Application.getCurrentDuel();

        $scope.$on('timer:ended', function () {
            socket.emit("game:pitergrad:end", {
                duelId: Application.getCurrentDuel().id
            }, function () {
                $location.path("/rating")
            });
        });
        /*!
         * Initializes and loads resources.
         */
        $scope.init = function () {
            $scope.stage = new createjs.Stage("gameCanvas");
            createjs.Touch.enable($scope.stage);

            /* Take into account "Mobile Safe Approach":
             http://www.createjs.com/Docs/SoundJS/classes/Sound.html
             */
            createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.FlashPlugin, createjs.HTMLAudioPlugin]);
            /* We provide here 20 channels instead of the default value 2,
             because users can surely touch more than 2 times in very small time duration.
             When we will use sound with smaller duration for destroy - we can probably remove this line.
             */
            createjs.Sound.registerSound("content/thunder.ogg", "sound_thunder", 20);
            queue = new createjs.LoadQueue(false);
            queue.installPlugin(createjs.Sound);
            queue.addEventListener("complete", $scope.handleLoadComplete);
            queue.loadManifest(manifest);
        }

        var objects = [
            {id: 1, type: 'image_bird', delayTimeMillis: 200, availableMillis: 7000, from: {x: 0, y: 150}, to: {x: 800, y: 300}},
            {id: 2, type: 'image_book', delayTimeMillis: 700, availableMillis: 7500, from: {x: 100, y: 0}, to: {x: 800, y: 200}},
            {id: 3, type: 'image_book', delayTimeMillis: 1000, availableMillis: 6000, from: {x: 300, y: 0}, to: {x: 800, y: 600}},
            {id: 4, type: 'image_bird', delayTimeMillis: 2100, availableMillis: 6500, from: {x: 800, y: 50}, to: {x: 200, y: 600}},
            {id: 5, type: 'image_book', delayTimeMillis: 2000, availableMillis: 5700, from: {x: 800, y: 40}, to: {x: 0, y: 550}},
            {id: 6, type: 'image_bird', delayTimeMillis: 3000, availableMillis: 5900, from: {x: 500, y: 0}, to: {x: 0, y: 600}}
        ]

        var objectIdToObjectMap = {};

        /*!
         * Initializes game board, prepares all objects.
         * Will be called right after all resources will be loaded.
         *
         * @param event   resource loaded complete event
         */
        $scope.handleLoadComplete = function (event) {
            for (var i in objects) {
                var obj = objects[i];
                console.log("Initialization of object, id=" + obj.id);

                var object = new createjs.Bitmap(queue.getResult(obj.type));
                var from_ = $scope.adjustBorderlineCoordinate(obj.from);
                object.x = from_.x;
                object.y = from_.y;
                object.on("click", $scope.handleObjectTouched, null, true, {object: object, objectId: obj.id});

                objectIdToObjectMap[obj.id] = object;
                var to_ = $scope.adjustBorderlineCoordinate(obj.to);
                createjs.Tween.get(object).wait(obj.delayTimeMillis).to({x: to_.x, y: to_.y}, obj.availableMillis);

                $scope.stage.addChild(object);
            }
            createjs.Ticker.addEventListener("tick", $scope.updateStage);
        }

        var IMAGE_SIZE = 32;

        $scope.adjustBorderlineCoordinate = function (point) {
            if (point.x == 0) {
                point.x -= IMAGE_SIZE;
            } else {
                point.x += IMAGE_SIZE / 2;
            }
            if (point.y == 0) {
                point.y -= IMAGE_SIZE;
            } else {
                point.y += IMAGE_SIZE / 2;
            }
            return point
        };

        /**
         * Destroys object that was touched by competitor.
         */
        socket.on("game:pitergrad:touch", function (touchEvent) {
            if (touchEvent.duelId == Application.getCurrentDuel().id) {
                Application.updateCurrentDuelScore(touchEvent.duel);

                if (touchEvent.initiator != Player.getPlayer().name) { //if no then object was already removed
                    var objectToRemove = objectIdToObjectMap[touchEvent.objectId];
                    $scope.stage.removeChild(objectToRemove);
                    //TODO use bad sounds here - user lose
                    var instance = createjs.Sound.play("sound_thunder");
                    instance.volume = 0.5;
                }
            }
        });

        /*
         * Destroys clicked/touched object.
         *
         * @param event   object clicked/touched event
         * @param object   the object
         */
        $scope.handleObjectTouched = function (event, objectInfo) {
            //TODO item is deleted from screen before socket answer for better user experience
            socket.emit("game:pitergrad:touch", {
                objectId: objectInfo.objectId,
                duelId: Application.getCurrentDuel().id,
                initiator: Player.getPlayer().name
            });
            $scope.stage.removeChild(objectInfo.object);
            var instance = createjs.Sound.play("sound_thunder");
            instance.volume = 0.5;
        };

        $scope.updateStage = function (event) {
            $scope.stage.update();
        };

        $scope.init();
    }])

    .controller('DuelWaitCtrl', ['$scope', '$window', '$location', 'Application', function ($scope, $window, $location, Application) {
        Application.setupDuel();

        $scope.$on('duel:joined', function (event, duelId) {
            $scope.duelId = duelId;
        });

        $scope.$on('duel:start', function (event, duel) {
            if ($scope.duelId === duel.id) {
                $location.path('/duel/play')
            }
        });

        $scope.cancel = function () {
            Application.cancelDuel(function () {
                $location.path('/menu')
            });
        };
    }])

    .controller('SplashCtrl', ['$location', function ($location) {
        document.addEventListener('deviceready', function () {
            document.addEventListener("backbutton", function () {
                e.preventDefault();
                e.stopPropagation();
            }, false);
            $location.path('/registration');
        }, false);
    }])

    .controller('TournamentCtrl', ['$scope', '$window', function ($scope, $window) {
        $scope.score = 456;
        $scope.window = $window;
    }]);
