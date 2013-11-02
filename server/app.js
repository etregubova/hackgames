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

app.get('/api/teams', function(req, res) {
    res.send(teams)
});
app.post('/api/teams', function (req, res) {
    addedTeam = req.body;
    addedTeam.createTime = new Date();
    teams.push(addedTeam);
    res.send(201, addedTeam);
    io.sockets.emit('team:added', addedTeam)
});




