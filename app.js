var app = require('express').createServer(),
    io  = require('socket.io').listen(app),
    fs  = require('fs');

var sizeOfObject = require('./objectSize').sizeOfObject;

app.listen(80);

var bytesSent = 0;
var bytesReceived = 0;

function logDataUsage() {
  var sent     = bytesSent/1024,
      received = bytesReceived/1024,
      total    = sent + received;
  console.log('Sent: ' + sent + 'KB Received: ' + received + 'KB Total: ' + total);
}

io.sockets.on('connection', function(socket) {
  console.log('User connected');
	socket.on('disconnect', function() {
		console.log('User disconnected');
	});
});
