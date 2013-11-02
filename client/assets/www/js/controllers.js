'use strict';

/* Controllers */

angular.module('app').

    controller('MenuCtrl', function ($scope, $http, socket, server) {
    })

    .controller('RatingCtrl', function ($scope, $http, socket) {

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

    .controller('TrainingCtrl', ['$scope', 'Application', 'socket', function ($scope, Application, socket) {
        var queue;

        var manifest = [
            {id: "image_pizza", src: "content/pizza_64.png"},
            {id: "image_poo", src: "content/poo_64.gif"}
        ];

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
            {id: 1, type: 'image_pizza', delayTimeMillis: 200, availableMillis: 7000, from: {x: 0, y: 150}, to: {x: 800, y: 300}},
            {id: 2, type: 'image_poo', delayTimeMillis: 700, availableMillis: 7500, from: {x: 100, y: 0}, to: {x: 800, y: 200}},
            {id: 3, type: 'image_poo', delayTimeMillis: 1000, availableMillis: 6000, from: {x: 300, y: 0}, to: {x: 800, y: 600}},
            {id: 4, type: 'image_pizza', delayTimeMillis: 2100, availableMillis: 6500, from: {x: 800, y: 50}, to: {x: 200, y: 600}},
            {id: 5, type: 'image_poo', delayTimeMillis: 2000, availableMillis: 5700, from: {x: 800, y: 40}, to: {x: 0, y: 550}},
            {id: 6, type: 'image_pizza', delayTimeMillis: 3000, availableMillis: 5900, from: {x: 500, y: 0}, to: {x: 0, y: 600}}
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

        var IMAGE_SIZE = 64;

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

        /**
         * Destroys object that was touched by competitor.
         */
        socket.on("game:pitergrad:touch", function (touchEvent) {
            if (touchEvent.duelId == Application.getCurrentDuelId()) {
                var objectToRemove = objectIdToObjectMap[touchEvent.objectId];
                $scope.stage.removeChild(objectToRemove);
                //TODO use bad sounds here - user lose
                var instance = createjs.Sound.play("sound_thunder");
                instance.volume = 0.5;
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
                duelId: Application.getCurrentDuelId()
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

    .controller('DuelCtrl', ['$scope', '$window', '$location', 'Application', function ($scope, $window, $location, Application) {
        Application.setupDuel();

        $scope.$on('duel:joined', function (event, duelId) {
            $scope.duelId = duelId;
        });

        $scope.$on('duel:start', function (event, duelId) {
            if ($scope.duelId === duelId) {
                $location.path('/training')
            }
        });

        $scope.cancel = function () {
            Application.cancelDuel(function () {
                $location.path('/menu')
            });
        };
    }]);
