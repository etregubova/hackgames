'use strict';

/* Controllers */

angular.module('app')
    .controller('AppCtrl', function ($scope, $rootScope, socket, Application) {
    })

    .controller('SplashCtrl', function ($scope, $rootScope, socket, Application) {
    })

    .controller('DuelGameCtrl', ['$scope', 'Application', 'socket', '$location', function ($scope, Application, socket, $location) {
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

                var objectToRemove = objectIdToCanvasObjectMap[touchEvent.objectId];
                $scope.stage.removeChild(objectToRemove);
                var instance = createjs.Sound.play("sound_wrong");
                instance.volume = 0.5;
            }
        });

        $scope.updateStage = function (event) {
            $scope.stage.update();
        };


        $scope.init();
    }]);