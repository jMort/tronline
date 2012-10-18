/*var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('Hello from <a href="http://appfog.com">AppFog.com</a><br/>This is my message!');
}).listen(process.env.VMC_APP_PORT || 1337, null);*/

var port = process.env.VMC_APP_PORT || 8080;
port = parseInt(port);
console.log(port);
var io = require('socket.io').listen(port);

io.sockets.on('connection', function(socket) {
	io.sockets.emit('receiveMessage', { message: 'NEW PERSON joined' });
	socket.on('sendMessage', function(data) {
		console.log(data);
		io.sockets.emit('receiveMessage', data);
	});
	socket.on('disconnect', function() {
		console.log('User disconnected');
		io.sockets.emit('receiveMessage', { message: 'User disconnected' });
	});
});
