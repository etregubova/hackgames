'use strict';

/* Controllers */

angular.module('app')
    .controller('AppCtrl', function ($scope, $rootScope, $location, Application) {
        $scope.trainingEnded = false;

        $scope.back = function () {
            $scope.trainingEnded = false;
            $rootScope.$broadcast('back');
        };

        $scope.hide_back = function () {
            return $location.path() === '/registration' ||
                $location.path() === '/duel/wait' ||
                ($location.path() === '/training' && !$scope.trainingEnded) ||
                $location.path() === '/duel/play' ||
                $location.path() === '/duel/result';
        };

        $scope.$on('timer:ended', function () {
            $scope.trainingEnded = true;
        });
    })

    .controller('MenuCtrl', function ($scope, $location, $window, Player) {
        $scope.exit = function () {
            Player.logOut(function () {
                $location.path('/registration');
            });
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

        socket.on('rating:updated', function (players) {
            $scope.players = players;
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
    .controller('TrainingCtrl', function ($scope, $location, Application, Player, socket) {
        $scope.$on('back', function () {
            $location.path('/menu');
        });

        $scope.$on('training:reinit', function () {
            $scope.score = 0;
            $scope.timer = 30;
            $scope.init();
        });


        var queue;

        var manifest = [
            {id: "b0-angry-bird", src: "content/flying/b0-angry-bird.png"},
            {id: "b0-bus", src: "content/flying/b0-bus.png"},
            {id: "b0-dolphin", src: "content/flying/b0-dolphin.png"},
            {id: "b0-smurf", src: "content/flying/b0-smurf.png"},
            {id: "b0-teapot", src: "content/flying/b0-teapot.png"},

            {id: "b1-berries", src: "content/flying/b1-berries.png"},
            {id: "b1-blueberry", src: "content/flying/b1-blueberry.png"},
            {id: "b1-eggplant", src: "content/flying/b1-eggplant.png"},
            {id: "b1-cake", src: "content/flying/b1-cake.png"},
            {id: "b1-water", src: "content/flying/b1-water.png"},

            {id: "g0-angry-bird", src: "content/flying/g0-angry-bird.png"},
            {id: "g0-bus", src: "content/flying/g0-bus.png"},
            {id: "g0-chess", src: "content/flying/g0-chess.png"},
            {id: "g0-dolphin", src: "content/flying/g0-dolphin.png"},
            {id: "g0-ninja", src: "content/flying/g0-ninja.png"},

            {id: "g1-apple", src: "content/flying/g1-apple.png"},
            {id: "g1-brokkoli", src: "content/flying/g1-brokkoli.png"},
            {id: "g1-grapes", src: "content/flying/g1-grapes.png"},
            {id: "g1-lemon", src: "content/flying/g1-lemon.png"},
            {id: "g1-watermelon", src: "content/flying/g1-watermelon.png"},

            {id: "r0-angry-bird", src: "content/flying/r0-angry-bird.png"},
            {id: "r0-bus", src: "content/flying/r0-bus.png"},
            {id: "r0-chess", src: "content/flying/r0-chess.png"},
            {id: "r0-frog", src: "content/flying/r0-frog.png"},
            {id: "r0-ladybug", src: "content/flying/r0-ladybug.png"},

            {id: "r1-apple", src: "content/flying/r1-apple.png"},
            {id: "r1-cake", src: "content/flying/r1-cake.png"},
            {id: "r1-cherries", src: "content/flying/r1-cherries.png"},
            {id: "r1-strawberry", src: "content/flying/r1-strawberry.png"},
            {id: "r1-tomato", src: "content/flying/r1-tomato.png"},

            {id: "y0-angry-bird", src: "content/flying/y0-angry-bird.png"},
            {id: "y0-bus", src: "content/flying/y0-bus.png"},
            {id: "y0-chess", src: "content/flying/y0-chess.png"},
            {id: "y0-frog", src: "content/flying/y0-frog.png"},
            {id: "y0-lampbulb", src: "content/flying/y0-lampbulb.png"},

            {id: "y1-banana", src: "content/flying/y1-banana.png"},
            {id: "y1-cake", src: "content/flying/y1-cake.png"},
            {id: "y1-fries", src: "content/flying/y1-fries.png"},
            {id: "y1-honey", src: "content/flying/y1-honey.png"},
            {id: "y1-lemon", src: "content/flying/y1-lemon.png"}
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
            createjs.Sound.registerSound("content/click-correct.mp3", "sound_correct", 20);
            createjs.Sound.registerSound("content/click-wrong.mp3", "sound_wrong", 20);
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
                console.log("Initialization of object, id=" + obj.id);

                var object = new createjs.Bitmap(queue.getResult(obj.type));
                var from_ = $scope.adjustBorderlineCoordinate(obj.from);
                object.x = from_.x;
                object.y = from_.y;
                object.on("click", $scope.handleObjectTouched, null, true, {canvasObject: object, objectInfo: obj});

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
            if ($scope.isEatable == objectStructure.objectInfo.isEatable && $scope.color === objectStructure.objectInfo.color) {
                $scope.score += successShotPoints;

                $scope.stage.removeChild(objectStructure.canvasObject);
                var instance = createjs.Sound.play("sound_correct");
                instance.volume = 0.5;
            } else {
                $scope.score += wrongShotPoints;
                var instance = createjs.Sound.play("sound_wrong");
                instance.volume = 0.5;
            }
        };

        $scope.updateStage = function (event) {
            $scope.stage.update();
        };

        $scope.init();
    })

    //THIS IS A COPY PASTE FROM TrainingController. You have to duplicate all changes!!!
    .controller('DuelGameCtrl', ['$scope', 'Application', 'Player', 'socket', '$location', function ($scope, Application, Player, socket, $location) {
        var queue;

        var manifest = [
            {id: "b0-angry-bird", src: "content/flying/b0-angry-bird.png"},
            {id: "b0-bus", src: "content/flying/b0-bus.png"},
            {id: "b0-dolphin", src: "content/flying/b0-dolphin.png"},
            {id: "b0-smurf", src: "content/flying/b0-smurf.png"},
            {id: "b0-teapot", src: "content/flying/b0-teapot.png"},

            {id: "b1-berries", src: "content/flying/b1-berries.png"},
            {id: "b1-blueberry", src: "content/flying/b1-blueberry.png"},
            {id: "b1-eggplant", src: "content/flying/b1-eggplant.png"},
            {id: "b1-cake", src: "content/flying/b1-cake.png"},
            {id: "b1-water", src: "content/flying/b1-water.png"},

            {id: "g0-angry-bird", src: "content/flying/g0-angry-bird.png"},
            {id: "g0-bus", src: "content/flying/g0-bus.png"},
            {id: "g0-chess", src: "content/flying/g0-chess.png"},
            {id: "g0-dolphin", src: "content/flying/g0-dolphin.png"},
            {id: "g0-ninja", src: "content/flying/g0-ninja.png"},

            {id: "g1-apple", src: "content/flying/g1-apple.png"},
            {id: "g1-brokkoli", src: "content/flying/g1-brokkoli.png"},
            {id: "g1-grapes", src: "content/flying/g1-grapes.png"},
            {id: "g1-lemon", src: "content/flying/g1-lemon.png"},
            {id: "g1-watermelon", src: "content/flying/g1-watermelon.png"},

            {id: "r0-angry-bird", src: "content/flying/r0-angry-bird.png"},
            {id: "r0-bus", src: "content/flying/r0-bus.png"},
            {id: "r0-chess", src: "content/flying/r0-chess.png"},
            {id: "r0-frog", src: "content/flying/r0-frog.png"},
            {id: "r0-ladybug", src: "content/flying/r0-ladybug.png"},

            {id: "r1-apple", src: "content/flying/r1-apple.png"},
            {id: "r1-cake", src: "content/flying/r1-cake.png"},
            {id: "r1-cherries", src: "content/flying/r1-cherries.png"},
            {id: "r1-strawberry", src: "content/flying/r1-strawberry.png"},
            {id: "r1-tomato", src: "content/flying/r1-tomato.png"},

            {id: "y0-angry-bird", src: "content/flying/y0-angry-bird.png"},
            {id: "y0-bus", src: "content/flying/y0-bus.png"},
            {id: "y0-chess", src: "content/flying/y0-chess.png"},
            {id: "y0-frog", src: "content/flying/y0-frog.png"},
            {id: "y0-lampbulb", src: "content/flying/y0-lampbulb.png"},

            {id: "y1-banana", src: "content/flying/y1-banana.png"},
            {id: "y1-cake", src: "content/flying/y1-cake.png"},
            {id: "y1-fries", src: "content/flying/y1-fries.png"},
            {id: "y1-honey", src: "content/flying/y1-honey.png"},
            {id: "y1-lemon", src: "content/flying/y1-lemon.png"}
        ];

        $scope.duel = Application.getCurrentDuel();

        $scope.$on('timer:ended', function () {
            socket.emit("game:pitergrad:end", {
                duelId: Application.getCurrentDuel().id
            }, function () {
                $location.path("/duel/result")
            });
        });
        /*!
         * Initializes and loads resources.
         */
        $scope.init = function () {

            $scope.scenario = Application.getCurrentDuel().scenario;
            $scope.rounds = Application.getCurrentDuel().scenario.rounds;

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
            createjs.Sound.registerSound("content/click-correct.mp3", "sound_correct", 20);
            createjs.Sound.registerSound("content/click-wrong.mp3", "sound_wrong", 20);
            queue = new createjs.LoadQueue(false);
            queue.installPlugin(createjs.Sound);
            queue.addEventListener("complete", $scope.handleLoadComplete);
            queue.loadManifest(manifest);
        }

        var objectIdToCanvasObjectMap = {};

        /*!
         * Initializes game board, prepares all objects.
         * Will be called right after all resources will be loaded.
         *
         * @param event   resource loaded complete event
         */
        $scope.handleLoadComplete = function (event) {

            /* Setting up game canvas related objects. */
            for (var i in $scope.scenario.objects) {
                var obj = $scope.scenario.objects[i];
                /*console.log("Initialization of object, id=" + obj.id);*/

                var object = new createjs.Bitmap(queue.getResult(obj.type));
                var from_ = $scope.adjustBorderlineCoordinate(obj.from);
                object.x = from_.x;
                object.y = from_.y;

                objectIdToCanvasObjectMap[obj.id] = object;
                object.on("click", $scope.handleObjectTouched, null, true, {canvasObject: object, objectInfo: obj});

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
                    var objectToRemove = objectIdToCanvasObjectMap[touchEvent.objectId];
                    $scope.stage.removeChild(objectToRemove);
                    var instance = createjs.Sound.play("sound_wrong");
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
        $scope.handleObjectTouched = function (event, objectStructure) {
            //TODO item is deleted from screen before socket answer for better user experience
            var isSuccessTouch =
                $scope.isEatable === objectStructure.objectInfo.isEatable &&
                    $scope.color === objectStructure.objectInfo.color;

            socket.emit("game:pitergrad:touch", {
                objectId: objectStructure.objectInfo.id,
                duelId: Application.getCurrentDuel().id,
                initiator: Player.getPlayer().name,
                success: isSuccessTouch
            });

            if (isSuccessTouch) {
                $scope.stage.removeChild(objectStructure.canvasObject);
                var instance = createjs.Sound.play("sound_correct");
                instance.volume = 1.0;
            } else {
                var instance = createjs.Sound.play("sound_wrong");
                instance.volume = 1.0;
            }
        };

        $scope.updateStage = function (event) {
            $scope.stage.update();
        };

        $scope.init();
    }])

    .controller('DuelWaitCtrl', ['$scope', '$window', '$location', 'Application', function ($scope, $window, $location, Application) {
        Application.setupDuel();

        $scope.$on('duel:start', function (event, duel) {
            $location.path('/duel/play')
        });

        $scope.cancel = function () {
            Application.cancelDuel(function () {
                $location.path('/menu')
            });
        };
    }])

    .controller('DuelResultCtrl', function ($scope, $location, Application) {
        $scope.duel = Application.getCurrentDuel();

        $scope.repeat = function () {
            $location.path('/duel/wait');
        };

        $scope.rating = function () {
            $location.path('/rating');
        };

        $scope.menu = function () {
            $location.path('/menu');
        };
    })

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
