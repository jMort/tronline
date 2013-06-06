module.exports = function(io, Game, Player, players, socketIdToSocket, socketIdToPlayerName, pendingGames, indexOfKeyValuePairInArray, addToPending) {
  return {
    checkLogin: function(socket, nickname) {
      if (players[nickname]) {
        socket.emit('loginUnsuccessful');
      } else {
        socket.emit('loginSuccessful');
        players[nickname] = new Player(nickname, 0, 0, 5, 'E', '');
        socketIdToPlayerName[socket.id] = nickname;
        io.sockets.emit('playerListUpdate', Object.keys(players).sort());
      }
    },
    getPlayerList: function(socket) {
      socket.emit('playerListUpdate', Object.keys(players).sort());
    },
    sendMessage: function(socket, message) {
      var name = socketIdToPlayerName[socket.id];
      io.sockets.emit('receiveMessage', name+': '+message);
    },
    createMultiplayer: function(socket) {
      var fromNickname = socketIdToPlayerName[socket.id];
      if (!(fromNickname in pendingGames))
        pendingGames[fromNickname] = { host: { nickname: fromNickname, color: '' },
                                       accepted: [], pending: [], declined: [] };
      socket.emit('playersInGameUpdate', pendingGames[fromNickname]);
    },
    getPlayersInGameUpdate: function(socket, fromNickname) {
      socket.emit('playersInGameUpdate', pendingGames[fromNickname]);
    },
    invitePlayer: function(socket, nickname) {
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
    },
    acceptInvite: function(socket, fromNickname) {
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
    },
    declineInvite: function(socket, fromNickname) {
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
    },
    disconnect: function(socket) {
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
    }
  };
};