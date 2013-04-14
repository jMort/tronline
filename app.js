var app = require('http').createServer(handler),
    io  = require('socket.io').listen(app, { 'log level': 1 }),
    fs  = require('fs');

var sizeOfObject = require('./util/objectSize').sizeOfObject;

var port = parseInt(process.env.PORT) || 80;
console.log('Listening on port '+port);
app.listen(port);

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

var socketIdToSocket = {};
var socketIdToPlayerName = {};

io.sockets.on('connection', function(socket) {
  console.log('User connected');
  socketIdToSocket[socket.id] = socket;
  io.sockets.emit('numPlayersOnline', Object.keys(socketIdToSocket).length);
  socket.on('checkLogin', function(nickname) {
    if (players[nickname]) {
      socket.emit('loginUnsuccessful');
    } else {
      socket.emit('loginSuccessful');
      players[nickname] = true;
      socketIdToPlayerName[socket.id] = nickname;
      io.sockets.emit('playerListUpdate', Object.keys(players));
    }
  });
  socket.on('getPlayerList', function() {
    socket.emit('playerListUpdate', Object.keys(players));
  });
  socket.on('sendMessage', function(message) {
    var name = socketIdToPlayerName[socket.id];
    io.sockets.emit('receiveMessage', name+': '+message);
  });
  socket.on('invitePlayer', function(nickname) {
    var fromNickname = socketIdToPlayerName[socket.id];
    for (var i in socketIdToPlayerName) {
      if (socketIdToPlayerName[i] === nickname) {
        socketIdToSocket[i].emit('invitePlayer', fromNickname);
        break;
      }
    }
  });
  socket.on('acceptInvite', function(fromNickname) {
    var nickname = socketIdToPlayerName[socket.id];
    console.log(nickname+' accepted '+fromNickname+"'s invite");
    for (var i in socketIdToPlayerName) {
      if (socketIdToPlayerName[i] === fromNickname) {
        socketIdToSocket[i].emit('inviteAccepted', nickname);
      }
    }
  });
  socket.on('declineInvite', function(fromNickname) {
    var nickname = socketIdToPlayerName[socket.id];
    console.log(nickname+' declined '+fromNickname+"'s invite");
    for (var i in socketIdToPlayerName) {
      if (socketIdToPlayerName[i] === fromNickname) {
        socketIdToSocket[i].emit('inviteDeclined', nickname);
      }
    }
  });
  socket.on('disconnect', function() {
    console.log('User disconnected');
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
