var app = require('http').createServer(handler),
    io  = require('socket.io').listen(app, { 'log level': 1 }),
    fs  = require('fs');

var sizeOfObject = require('./util/objectSize').sizeOfObject;

var port = parseInt(process.env.PORT) || 80;
console.log('Listening on port '+port);
app.listen(port);

/* Game Classes */
var Game = require('./public/js/game/gameLogic');
var Player = require('./public/js/game/Player');

// Client request handler
function handler(req, res) {
  if (req.headers.host === 'tronline.me') {
    res.writeHead(303, { 'Location': 'http://www.tronline.me'+req.url });
    return res.end();
  }
  // Automatically look for index.html file if path is a directory as this is not done by default
  if (fs.existsSync(__dirname + '/public' + req.url)) {
    if (fs.statSync(__dirname + '/public' + req.url).isDirectory()) {
      if (fs.existsSync(__dirname + '/public' + req.url + 'index.html')) {
        req.url += 'index.html';
      }
    }
  }
  
  fs.readFile(__dirname + '/public' + req.url,
    function(err, data) {
      if (err) {
        //res.writeHead(404);
        //res.end('<html><head><title>404 Page Not Found</title></head><h1>404 Page Not Found</h1></html>');
        res.writeHead(200, { 'Content-type': 'text/html' });
        res.end(fs.readFileSync(__dirname + '/public/index.html'));
      } else {
        // Default content type will be text/plain
        var contentType = 'text/plain';
        var extensionToContentType = {
          '.html': 'text/html',
          '.js'  : 'text/javascript',
          '.css' : 'text/css',
          '.png' : 'image/png'
        };
        for (var ext in extensionToContentType) {
          if (req.url.lastIndexOf(ext) == req.url.length - ext.length)
            contentType = extensionToContentType[ext];
        }
        res.writeHead(200, { 'Content-type': contentType });
        res.end(data);
      }
    });
}

var bytesSent = 0;
var bytesReceived = 0;

function logDataUsage() {
  var sent     = bytesSent/1024,
      received = bytesReceived/1024,
      total    = sent + received;
  console.log('Sent: ' + sent + 'KB Received: ' + received + 'KB Total: ' + total);
}

var players = {};
// pendingGames will be accessed using the player's nickname who created the game
var pendingGames = {};
// A list of all acceptable colours for players
var playerColorList = ['#BB2200', '#0022BB', '#9900FF', '#FF00FF', '#FF6600', '#009933',
                        '#00FFCC', '#663300', '#FFFF47', '#00FF00', '#FFFFFF', '#999999',
                        '#003366', '#CCA300', '#7ACC52', '#A37547'];

var socketIdToSocket = {};
var socketIdToPlayerName = {};

/* Finds the first index of an object in array which contains a key-value pair */
function indexOfKeyValuePairInArray(array, key, value) {
  var index = -1;
  for (var i = 0; i < array.length; i++) {
    if (array[i][key] === value) {
      index = i;
      break;
    }
  }
  return index;
}

function addToPending(pendingGame, nickname) {
  var player = { nickname: nickname, color: '' };
  var index = indexOfKeyValuePairInArray(pendingGame.accepted, 'nickname', nickname);
  if (index != -1)
    pendingGame.accepted.splice(index, 1);
  index = indexOfKeyValuePairInArray(pendingGame.declined, 'nickname', nickname);
  if (index != -1)
    pendingGame.declined.splice(index, 1);
  if (indexOfKeyValuePairInArray(pendingGame.pending, 'nickname', nickname) == -1)
    pendingGame.pending.push(player);
  return pendingGame;
}

io.sockets.on('connection', function(socket) {
  console.log('User connected');
  socketIdToSocket[socket.id] = socket;
  io.sockets.emit('numPlayersOnline', Object.keys(socketIdToSocket).length);
  socket.on('checkLogin', function(nickname) {
    if (players[nickname]) {
      socket.emit('loginUnsuccessful');
    } else {
      socket.emit('loginSuccessful');
      players[nickname] = new Player(nickname, 0, 0, 5, 'E', '');
      socketIdToPlayerName[socket.id] = nickname;
      io.sockets.emit('playerListUpdate', Object.keys(players).sort());
    }
  });
  socket.on('getPlayerList', function() {
    socket.emit('playerListUpdate', Object.keys(players).sort());
  });
  socket.on('sendMessage', function(message) {
    var name = socketIdToPlayerName[socket.id];
    io.sockets.emit('receiveMessage', name+': '+message);
  });
  socket.on('createMultiplayer', function() {
    var fromNickname = socketIdToPlayerName[socket.id];
    if (!(fromNickname in pendingGames))
      pendingGames[fromNickname] = { host: { nickname: fromNickname, color: '' },
                                     accepted: [], pending: [], declined: [] };
    socket.emit('playersInGameUpdate', pendingGames[fromNickname]);
  });
  socket.on('getPlayersInGameUpdate', function(fromNickname) {
    socket.emit('playersInGameUpdate', pendingGames[fromNickname]);
  });
  socket.on('invitePlayer', function(nickname) {
    var fromNickname = socketIdToPlayerName[socket.id];
    if (!(fromNickname in pendingGames))
      return;
    pendingGames[fromNickname] = addToPending(pendingGames[fromNickname], nickname);
    socket.emit('playersInGameUpdate', pendingGames[fromNickname]);
    for (var i in socketIdToPlayerName) {
      if (socketIdToPlayerName[i] === nickname) {
        socketIdToSocket[i].emit('invitePlayer', fromNickname);
        break;
      }
    }
  });
  socket.on('acceptInvite', function(fromNickname) {
    var nickname = socketIdToPlayerName[socket.id];
    var player = { nickname: nickname, color: '' };
    // This stops players trying to accept an invite to a game that does not exist
    if (!(fromNickname in pendingGames))
      return;
    var index = indexOfKeyValuePairInArray(pendingGames[fromNickname].pending, 'nickname', nickname);
    if (index != -1) {
      // Move player from pending to accepted
      pendingGames[fromNickname].pending.splice(index, 1);
      pendingGames[fromNickname].accepted.push(player);
    }
    for (var i in socketIdToPlayerName) {
      if (socketIdToPlayerName[i] === fromNickname) {
        socketIdToSocket[i].emit('inviteAccepted', nickname);
        socketIdToSocket[i].emit('playersInGameUpdate', pendingGames[fromNickname]);
      }
    }
  });
  socket.on('declineInvite', function(fromNickname) {
    var nickname = socketIdToPlayerName[socket.id];
    var player = { nickname: nickname, color: '' };
    // This stops players trying to decline an invite to a game that does not exist
    if (!(fromNickname in pendingGames))
      return;
    var index = indexOfKeyValuePairInArray(pendingGames[fromNickname].pending, 'nickname', nickname);
    if (index != -1) {
      // Move player from pending to declined
      pendingGames[fromNickname].pending.splice(index, 1);
      pendingGames[fromNickname].declined.push(player);
    }
    for (var i in socketIdToPlayerName) {
      if (socketIdToPlayerName[i] === fromNickname) {
        socketIdToSocket[i].emit('inviteDeclined', nickname);
        socketIdToSocket[i].emit('playersInGameUpdate', pendingGames[fromNickname]);
      }
    }
  });
  socket.on('disconnect', function() {
    console.log('User disconnected');
    delete pendingGames[socketIdToPlayerName[socket.id]];
    delete socketIdToSocket[socket.id];
    for (var i in players) {
      if (i == socketIdToPlayerName[socket.id]) {
        delete players[i];
        delete socketIdToPlayerName[socket.id];
        io.sockets.emit('playerListUpdate', Object.keys(players));
        break;
      }
    }
    io.sockets.emit('numPlayersOnline', Object.keys(socketIdToSocket).length);
  });
});
