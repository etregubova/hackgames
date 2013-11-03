var express = require('express');
var http = require('http');
var app = express();

var server = http.createServer(app).listen(3000, function () {
    console.log('Express server listening on port 3000');
});
var io = require('socket.io').listen(server);

app.use(express.logger('dev'));
app.use(express.json());

app.all("/api/*", function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

var players = [];
var duelID = 0;
var duels = [];

var getPlayerByName = function (name) {
    //TODO cache for better performance
    for (var index = 0; index < players.length; ++index) {
        if (players[index].name === name) {
            return players[index];
        }
    }
};

var getDuelById = function (id) {
    //TODO cache for better performance
    for (var index = 0; index < duels.length; ++index) {
        var duel = duels[index];
        if (duel.id == id) {
            return duel;
        }
    }
};

var removePlayer = function (playerName) {
    for (var index = 0; index < players.length; ++index) {
        if (players[index].name === playerName) {
            players.splice(index, 1);
            io.sockets.emit('player:removed', playerName);
            return;
        }
    }
};

io.sockets.on('connection', function (socket) {

    socket.on('disconnect', function () {

        socket.get('player', function (err, playerName) {
            console.log('Event received "player:disconnected "' + playerName);
            removePlayer(playerName);
        });
    });

    socket.on('player:added', function (newPlayer, callback) {
        console.log('Event received "player:added "' + newPlayer);

        socket.set('player', newPlayer.name);   // save player name in socket

        newPlayer.createTime = new Date();     //init default properties
        newPlayer.score = 0;
        newPlayer.tournaments = 0;

        players.push(newPlayer);

        socket.broadcast.emit('player:added', newPlayer);
        callback(newPlayer);
    });

    socket.on('player:removed', function (playerName, callback) {
        console.log('Event received "player:removed "' + playerName);
        removePlayer(playerName);
        callback();
    });

    socket.on('player:getRating', function (data, callback) {      //get players rating
        console.log('Event received "player:rating"');
        callback(players);
    });

    socket.on('player:get', function (playerName, callback) {
        console.log('Event received "player:get" ' + playerName);

        for (var index = 0; index < teams.length; ++index) {
            if (players[index].name === playerName) {
                callback(players[index]);
                return;
            }
        }
    });

    socket.on('duel:join', function (data, callback) {
        console.log('Event received duel:join');

        handleDuelRequest(socket, callback)
    });

    socket.on('duel:cancel', function (data, callback) {
        console.log('Event received duel:cancel');

        cancelDuelRequest(socket, callback)
    });

    //pitergrad game

    socket.on('game:pitergrad:touch', function (touchEvent) {
        console.log('Event received game:pitergrad:touch ' + touchEvent.initiator + touchEvent.objectId);

        //find duel.. TODO use map instead of loop through array
        var duel = getDuelById(touchEvent.duelId);

        if (duel.player1.name == touchEvent.initiator) {
            if (touchEvent.success) {
                duel.player1.score += duel.scenario.successShotPoints;
            } else {
                duel.player1.score += duel.scenario.wrongShotPoints;
            }
        } else {
            if (touchEvent.success) {
                duel.player2.score += duel.scenario.successShotPoints;
            } else {
                duel.player2.score += duel.scenario.wrongShotPoints;
            }
        }

        //send duel with scores to clients
        touchEvent.duel = duel;

        //TODO send only to players in current duel. It will be better for performance
        io.sockets.emit('game:pitergrad:touch', touchEvent)
    });

    socket.on('game:pitergrad:end', function (data, callback) {
        var duel = getDuelById(data.duelId);
        if (duel.status != 'completed') { //we should update rating only once
            duel.status = 'completed';
            //update rating
            var firstPlayer = getPlayerByName(duel.player1.name);
            var secondPlayer = getPlayerByName(duel.player2.name);
            firstPlayer.score += duel.player1.score;
            firstPlayer.tournaments++;
            secondPlayer.score += duel.player2.score;
            secondPlayer.tournaments++;
            io.sockets.emit('rating:updated', players)
        }
        callback();
    });

    socket.on('game:size', function (size) {
        console.log('Event received game:size:' + size);

        socket.get('player', function (err, playerName) {
            for (var index = 0; index < players.length; ++index) {
                if (players[index].name === playerName) {
                    players[index].gameFieldSize = size;
                    return;
                }
            }
        });
    });

    socket.on('game:training', function (object, callback) {
        console.log('Event received game:training');

        /*! Temporary it was decided to set default gameFieldSize 250x250, uncomment this block if needed:
         var gameFieldSize;
         socket.get('player', function (err, playerName) {
         console.log('Event :' + playerName);

         for (var index = 0; index < players.length; ++index) {
         if (players[index].name === playerName) {
         gameFieldSize = players[index].gameFieldSize;
         break;
         }
         }
         });
         */
        var gameFieldSize = {width: 250, height: 250};
        callback(generateScenario(gameFieldSize));
    });

});

function handleDuelRequest(socket, callback) {
    socket.get('player', function (err, playerName) {
        var notStartedDuels = duels.filter(function (duel) {
            return duel.status === 'waiting';
        });

        if (notStartedDuels.length > 0) {
            var duel = notStartedDuels[0];

            duel.status = 'started';
            duel.player2 = {};
            duel.player2.name = playerName;
            duel.player2.score = 0;

            var gameFieldSize = {width: 250, height: 250};
            duel.scenario = generateScenario(gameFieldSize);
            console.log(duel);

            callback(duel)
            io.sockets.emit('duel:start', duel);
        } else {
            var duel = {status: 'waiting'};
            duel.id = duelID++;
            duel.player1 = {};
            duel.player1.name = playerName;
            duel.player1.score = 0;

            duels.push(duel);

            callback(duel)
        }

        console.log(duels);
    });
}

function cancelDuelRequest(socket, callback) {
    socket.get('player', function (err, playerName) {
        for (var index = 0; index < duels.length; ++index) {
            var duel = duels[index];
            if (duel.player1.name == playerName && duel.status == 'waiting') {
                duels.splice(index, 1);
                callback();
                return;
            }
        }
    });

    console.log(duels);
}


/**
 *
 *
 * Need to move to separate file.
 *
 *
 */
var ROUND_DURATION = 5;
var ROUNDS_COUNT = 6;

function generateScenario(gameFieldSize) {
    var scenario = {}
    scenario.duration = ROUND_DURATION * ROUNDS_COUNT;
    scenario.successShotPoints = 200;
    scenario.wrongShotPoints = -100;
    scenario.rounds = generateRounds();
    scenario.objects = generateObjects(gameFieldSize);
    return scenario;
}

function generateRounds() {
    var rounds = new Array();

    for (var i = 0; i < ROUNDS_COUNT; i++) {
        var round = {};
        round.id = i;
        round.delayTimeSeconds = i * ROUND_DURATION;

        round.isEatable = getRandomInt(0, 1) == 1 ? true : false;
        round.color = COLORS[getRandomInt(0, COLORS.length - 1)];
        round.duration = ROUND_DURATION;
        rounds[i] = round;
    }

    return rounds;
}

var YELLOW = 'yellow';
var RED = 'red';
var GREEN = 'green';
var BLUE = 'blue';
var COLORS = [YELLOW, RED, GREEN, BLUE];

var OBJECTS_LIST = [
    {type: "b0-angry-bird", isEatable: false, color: BLUE},
    {type: "b0-bus", isEatable: false, color: BLUE},
    {type: "b0-dolphin", isEatable: false, color: BLUE},
    {type: "b0-smurf", isEatable: false, color: BLUE},
    {type: "b0-teapot", isEatable: false, color: BLUE},

    {type: "b1-berries", isEatable: true, color: BLUE},
    {type: "b1-blueberry", isEatable: true, color: BLUE},
    {type: "b1-eggplant", isEatable: true, color: BLUE},
    {type: "b1-cake", isEatable: true, color: BLUE},
    {type: "b1-water", isEatable: true, color: BLUE},

    {type: "g0-angry-bird", isEatable: false, color: GREEN},
    {type: "g0-bus", isEatable: false, color: GREEN},
    {type: "g0-chess", isEatable: false, color: GREEN},
    {type: "g0-dolphin", isEatable: false, color: GREEN},
    {type: "g0-ninja", isEatable: false, color: GREEN},

    {type: "g1-apple", isEatable: true, color: GREEN},
    {type: "g1-brokkoli", isEatable: true, color: GREEN},
    {type: "g1-grapes", isEatable: true, color: GREEN},
    {type: "g1-lemon", isEatable: true, color: GREEN},
    {type: "g1-watermelon", isEatable: true, color: GREEN},

    {type: "r0-angry-bird", isEatable: false, color: RED},
    {type: "r0-bus", isEatable: false, color: RED},
    {type: "r0-chess", isEatable: false, color: RED},
    {type: "r0-frog", isEatable: false, color: RED},
    {type: "r0-ladybug", isEatable: false, color: RED},

    {type: "r1-apple", isEatable: true, color: RED},
    {type: "r1-cake", isEatable: true, color: RED},
    {type: "r1-cherries", isEatable: true, color: RED},
    {type: "r1-strawberry", isEatable: true, color: RED},
    {type: "r1-tomato", isEatable: true, color: RED},

    {type: "y0-angry-bird", isEatable: false, color: YELLOW},
    {type: "y0-bus", isEatable: false, color: YELLOW},
    {type: "y0-chess", isEatable: false, color: YELLOW},
    {type: "y0-frog", isEatable: false, color: YELLOW},
    {type: "y0-lampbulb", isEatable: false, color: YELLOW},

    {type: "y1-banana", isEatable: true, color: YELLOW},
    {type: "y1-cake", isEatable: true, color: YELLOW},
    {type: "y1-fries", isEatable: true, color: YELLOW},
    {type: "y1-honey", isEatable: true, color: YELLOW},
    {type: "y1-lemon", isEatable: true, color: YELLOW}
];

var OBJECTS_PER_SECOND = 4;

function generateObjects(gameFieldSize) {
    var objects = new Array();

    var id = 0;
    for (var i = 0; i < ROUNDS_COUNT * ROUND_DURATION; i++) {
        for (var j = 0; j < OBJECTS_PER_SECOND; j++) {
            var object = {};
            object.id = id;

            var behavior = OBJECTS_LIST[getRandomInt(0, OBJECTS_LIST.length - 1)];
            object.type = behavior.type;
            object.isEatable = behavior.isEatable;
            object.color = behavior.color;

            object.delayTimeMillis = i * 1000 + getRandomInt(0, 1000);
            object.availableMillis = 3500 + getRandomInt(0, 1500);

            var path = generatePath(gameFieldSize);
            object.from = path.from;
            object.to = path.to;

            objects[id] = object;
            id++;
        }
    }
    return objects;
}

function generatePath(gameFieldSize) {
    var isHorizontal = getRandomInt(0, 1) == 1 ? true : false;
    var isReverse = getRandomInt(0, 1) == 1 ? true : false;

    var from = {};
    var to = {};
    if (isHorizontal) {
        if (isReverse) {
            from.x = gameFieldSize.width;
            to.x = 0;
            from.y = getRandomInt(0, gameFieldSize.height);
            to.y = getRandomInt(0, gameFieldSize.height);
        }
        else {
            from.x = 0;
            to.x = gameFieldSize.width;
            from.y = getRandomInt(0, gameFieldSize.height);
            to.y = getRandomInt(0, gameFieldSize.height);
        }
    }
    else {
        if (isReverse) {
            from.x = getRandomInt(0, gameFieldSize.width);
            to.x = getRandomInt(0, gameFieldSize.width);
            from.y = gameFieldSize.height;
            to.y = 0;
        }
        else {
            from.x = getRandomInt(0, gameFieldSize.width);
            to.x = getRandomInt(0, gameFieldSize.width);
            from.y = 0;
            to.y = gameFieldSize.height;
        }
    }

    var trace = {};
    trace.from = from;
    trace.to = to;

    return trace;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function resizeScenario(scenario, gameFieldSize, newGameFieldSize) {
    var newScenario = {};

    newScenario.duration = scenario.duration;
    newScenario.successShotPoints = scenario.successShotPoints;
    newScenario.wrongShotPoints = scenario.wrongShotPoints;

    newScenario.rounds = new Array();
    for (var i = 0; i < scenario.rounds.size; i++) {
        var round = scenario.rounds[i];
        var newRound = {};

        newRound.id = round.id;
        newRound.delayTimeSeconds = round.delayTimeSeconds;
        newRound.duration = round.duration;
        newRound.isEatable = round.isEatable;
        newRound.color = round.color;

        newScenario.rounds[i] = newRound;
    }

    newScenario.objects = new Array();
    for (var i = 0; i < scenario.objects.size; i++) {
        var object = scenario.objects[i];
        var newObject = {};

        newObject.id = object.id;
        newObject.type = object.type;
        newObject.delayTimeMillis = object.delayTimeMillis;
        newObject.availableMillis = object.availableMillis;
        newObject.isEatable = object.isEatable;
        newObject.color = object.color;

        newObject.from = {};
        newObject.from.x = Math.floor(object.from.x * newGameFieldSize.width / gameFieldSize.width);
        newObject.from.y = Math.floor(object.from.y * newGameFieldSize.height / gameFieldSize.height);
        newObject.to = {};
        newObject.to.x = Math.floor(object.to.x * newGameFieldSize.width / gameFieldSize.width);
        newObject.to.y = Math.floor(object.to.y * newGameFieldSize.height / gameFieldSize.height);

        newScenario.objects[i] = newObject;
    }

    return newScenario;
}
