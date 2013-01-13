var app = require('http').createServer(handler),
    io  = require('socket.io').listen(app, { 'log level': 1 }),
    fs  = require('fs');

var sizeOfObject = require('./objectSize').sizeOfObject;

app.listen(80);

// Client request handler
function handler(req, res) {
  // Automatically look for index.html file if path is a directory as this is not done by default
  if (fs.existsSync(__dirname + '/public' + req.url)) {
    if (fs.statSync(__dirname + '/public' + req.url).isDirectory()) {
      if (fs.existsSync(__dirname + '/public' + req.url + '/index.html')) {
        req.url += '/index.html';
      }
    }
  }
  fs.readFile(__dirname + '/public' + req.url,
    function(err, data) {
      if (err) {
        res.writeHead(404);
        res.end('<html><head><title>404 Page Not Found</title></head><h1>404 Page Not Found</h1></html>');
      } else {
        var contentType = 'text/html';
        // If path ends in .js change content type to text/javascript
        if (req.url.lastIndexOf('.js') == req.url.length - 3)
          contentType = 'text/javascript';
        // If path ends in .css change content type to text/css
        if (req.url.lastIndexOf('.css') == req.url.length - 4)
          contentType = 'text/css';
        // If path ends in .png change content type to image/png
        if (req.url.lastIndexOf('.png') == req.url.length - 4)
          contentType = 'image/png';
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

io.sockets.on('connection', function(socket) {
  console.log('User connected');
  numPlayers++;
  io.sockets.emit('numPlayersOnline', numPlayers);
  socket.on('disconnect', function() {
    console.log('User disconnected');
    numPlayers--;
    io.sockets.emit('numPlayersOnline', numPlayers);
  });
});
