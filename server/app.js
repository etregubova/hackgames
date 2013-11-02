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

//Teams service
var teams = [];

app.get('/api/teams', function (req, res) {
    res.send(teams)
});

app.get('/api/teams/:teamName', function (req, res) {
    for (index = 0; index < teams.length; ++index) {
        if (teams[index].name === req.params.teamName) {
            res.send(teams[index])
            return;
        }
    }
    res.send(404)
});

app.post('/api/teams', function (req, res) {
    addedTeam = req.body;
    addedTeam.createTime = new Date();
    teams.push(addedTeam);
    res.send(201, addedTeam);
    io.sockets.emit('team:added', addedTeam)
});

/* Duels */
var duels = [];

io.sockets.on('connection', function (socket) {
    socket.on('duel:join', function(newPlayerName) {
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




