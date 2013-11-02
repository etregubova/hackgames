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
var duels = [];

io.sockets.on('connection', function (socket) {

    socket.on('disconnect', function () {
//        remove player
        socket.get('player', function (err, playerName) {
            for (index = 0; index < players.length; ++index) {
                if (players[index].name === playerName) {
                    players.splice(index, 1);
                    io.sockets.emit('player:removed', playerName);
                    return;
                }
            }
        });
    });

    socket.on('player:added', function (newPlayer) {
        console.log('player:added!!!')
        socket.set('player', newPlayer.name);
        newPlayer.createTime = new Date();
        newPlayer.score = 0;
        newPlayer.tournaments = 0;
        players.push(newPlayer);
        io.sockets.emit('player:added', newPlayer)
    });

    socket.on('player:rating', function () {
        console.log('player:rating!!!')
        socket.emit('player:rating', players)
    });

    socket.on('player:get', function (playerName) {
        console.log('player:get!!!')
        for (index = 0; index < teams.length; ++index) {
            if (players[index].name === playerName) {
                socket.on('player:get', players[index])
                return;
            }
        }
    });

    socket.on('duel:join', function (newPlayerName) {
        handleDuelRequest(socket, newPlayerName)
        console.log('duel:join - ' + newPlayerName);
    });
});

function handleDuelRequest(socket, newPlayerName) {
    var notStartedDuels = duels.filter(function (duel) {
        return duel.status === 'waiting';
    })

    if (notStartedDuels.length > 0) {
        var duel = notStartedDuels[0];
        duel.status = 'started';

        duel.player2 = {};
        duel.player2.name = newPlayerName;
        duel.player2.socket = socket;

        duel.player1.socket.emit('duel:start');
        duel.player2.socket.emit('duel:start');
    } else {
        var duel = {status: 'waiting'};

        duel.player1 = {};
        duel.player1.name = newPlayerName;
        duel.player1.socket = socket;

        duels.push(duel);
    }

    console.log(duels);
}




