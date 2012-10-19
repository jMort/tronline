$(document).ready(function() {
	var socket = io.connect('http://transverse.ap01.aws.af.cm');
	socket.on('receiveMessage', function(data) {
		document.getElementById('messages').innerHTML += 'RECEIVED: '+data.message+'<br/>';
	});
	function sendMessage(message) {
		socket.emit('sendMessage', { message: message });
	}
	$('#button').click(function() {
		sendMessage($('#message').val());
		$('#message').val('');
	});
});