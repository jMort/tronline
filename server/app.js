var sizeOfObject = require('./objectSize').sizeOfObject;
/*var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('Hello from <a href="http://appfog.com">AppFog.com</a><br/>This is my message!');
}).listen(process.env.VMC_APP_PORT || 1337, null);*/

var port = process.env.VMC_APP_PORT || 8080;
port = parseInt(port);
console.log(port);

var io = require('socket.io').listen(port);

// This makes the server use long polling
/*io.configure(function() {
	io.set("transports", ["xhr-polling"]);
	io.set("polling duration", 10);
});*/

var numPlayers = 0;

var bytesSent = 0;
var bytesReceived = 0;

io.sockets.on('connection', function(socket) {
	numPlayers++;
	var obj = { message: 'NEW PERSON joined' };
	io.sockets.emit('receiveMessage', obj);
	bytesSent += sizeOfObject(obj);
	console.log("Sent: "+bytesSent/1024+"KB Received: "+bytesReceived/1024+"KB Total: "+(bytesSent+bytesReceived)/1024+"KB");
	socket.on('sendMessage', function(data) {
		bytesReceived += sizeOfObject(data);
		io.sockets.emit('receiveMessage', data);
		bytesSent += sizeOfObject(data);
		console.log("Sent: "+bytesSent/1024+"KB Received: "+bytesReceived/1024+"KB Total: "+(bytesSent+bytesReceived)/1024+"KB");
	});
	socket.on('disconnect', function() {
		numPlayers--;
		console.log('User disconnected');
		obj = { message: 'User disconnected' };
		io.sockets.emit('receiveMessage', obj);
		bytesSent += sizeOfObject(obj);
		console.log("Sent: "+bytesSent/1024+"KB Received: "+bytesReceived/1024+"KB Total: "+(bytesSent+bytesReceived)/1024+"KB");
	});
});
