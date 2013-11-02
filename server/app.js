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

io.sockets.on('connection', function (socket) {

    socket.on('disconnect', function () {

        socket.get('player', function (err, playerName) {
            console.log('Event received "player:disconnected "' + playerName);

//            remove player
            for (var index = 0; index < players.length; ++index) {
                if (players[index].name === playerName) {
                    players.splice(index, 1);
                    io.sockets.emit('player:removed', playerName);
                    return;
                }
            }
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

    socket.on('duel:join', function () {
        console.log('Event received duel:join');

        handleDuelRequest(socket)
    });

    socket.on('duel:cancel', function (data, callback) {
        console.log('Event received duel:cancel');

        cancelDuelRequest(socket, callback)
    });

    //pitergrad game

    socket.on('game:pitergrad:touch', function (touchEvent) {
        console.log('Event received game:pitergrad:touch ' + touchEvent.initiator + touchEvent.objectId);

        //find duel.. TODO use map instead of loop through array
        for (var index = 0; index < duels.length; ++index) {
            var duel = duels[index];
            if (duel.id == touchEvent.duelId) {
                if (duel.player1.name == touchEvent.initiator) {
                    duel.player1.score++;
                } else {
                    duel.player2.score++;
                }

                //send duel with scores to clients
                touchEvent.duel = duel;
                break;
            }
        }

        //TODO send only to players in current duel. It will be better for performance
        io.sockets.emit('game:pitergrad:touch', touchEvent)
    });
});

function handleDuelRequest(socket) {
    socket.get('player', function (err, playerName) {
        var notStartedDuels = duels.filter(function (duel) {
            return duel.status === 'waiting';
        })

        if (notStartedDuels.length > 0) {
            var duel = notStartedDuels[0];
            socket.emit('duel:joined', duel.id);

            duel.status = 'started';

            duel.player2 = {};
            duel.player2.name = playerName;
            duel.player2.score = 0;

            io.sockets.emit('duel:start', duel);
        } else {
            var duel = {status: 'waiting'};
            duel.id = duelID++;
            duel.player1 = {};
            duel.player1.name = playerName;
            duel.player1.score = 0;

            duels.push(duel);

            socket.emit('duel:joined', duel.id);
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




