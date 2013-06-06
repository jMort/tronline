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

var events = require('./events.js')(io,
                                    Game, Player,
                                    players, socketIdToSocket, socketIdToPlayerName, pendingGames,
                                    indexOfKeyValuePairInArray, addToPending);

io.sockets.on('connection', function(socket) {
  console.log('User connected');
  socketIdToSocket[socket.id] = socket;
  io.sockets.emit('numPlayersOnline', Object.keys(socketIdToSocket).length);

  // This is to emulate a for loop.
  // This is done due to asynchronous issues which resulted in the for loop always taking
  // the value of the last item looped through.
  var i = 0;
  var each = function() {
    var e = Object.keys(events)[i];
    // Add event listener for event `e` which calls the event function from events.js
    socket.on(e, function() {
      // Convert arguments object to an array
      arguments = Array.prototype.slice.call(arguments);
      // Call the event callback with socket as the first parameter
      var args = [socket].concat(arguments);
      events[e].apply(this, args);
    });
    i++;
    if (i < Object.keys(events).length)
      setTimeout(each, 1);
  };
  setTimeout(each, 1);
});
