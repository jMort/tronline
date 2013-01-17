var app = require('http').createServer(handler),
    io  = require('socket.io').listen(app, { 'log level': 1 }),
    fs  = require('fs');

var sizeOfObject = require('./util/objectSize').sizeOfObject;

app.listen(80);

// Client request handler
function handler(req, res) {
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

var numPlayers = 0;
var players = {};

io.sockets.on('connection', function(socket) {
  console.log('User connected');
  numPlayers++;
  var name;
  io.sockets.emit('numPlayersOnline', numPlayers);
  socket.on('checkLogin', function(nickname) {
    if (players[nickname]) {
      socket.emit('loginUnsuccessful');
    } else {
      socket.emit('loginSuccessful');
      players[nickname] = true;
      name = nickname;
    }
  });
  socket.on('disconnect', function() {
    console.log('User disconnected');
    numPlayers--;
    for (var i in players) {
      if (i == name) {
        delete players[i];
        break;
      }
    }
    io.sockets.emit('numPlayersOnline', numPlayers);
  });
});
