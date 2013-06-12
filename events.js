module.exports = function(io, Game, Player, players, socketIdToSocket, socketIdToPlayerName, pendingGames, playerColorList, indexOfKeyValuePairInArray, addToPending) {
  // Sends event to all players in array `playerGroup`
  var sendEventToPlayerGroup = function(playerGroup, event, data) {
    for (var i in playerGroup) {
      for (var j in socketIdToPlayerName) {
        if (socketIdToPlayerName[j] == playerGroup[i].nickname) {
          socketIdToSocket[j].emit(event, data);
        }
      }
    }
  };

  return {
    pingIn: function(socket) {
      if (players[socketIdToPlayerName[socket.id]]._pings.length == 5)
        players[socketIdToPlayerName[socket.id]]._pings.splice(0, 1);
      var lastPingSentAt = players[socketIdToPlayerName[socket.id]]._lastPingSentAt;
      if (lastPingSentAt !== null)
        players[socketIdToPlayerName[socket.id]]._pings.push(new Date().getTime() - lastPingSentAt);
    },
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
        pendingGames[fromNickname] = { host: players[fromNickname], difficulty: 'Easy',
                                       accepted: [], pending: [], declined: [] };
      socket.emit('playersInGameUpdate', pendingGames[fromNickname]);
    },
    getPlayersInGameUpdate: function(socket, fromNickname) {
      if (fromNickname in pendingGames)
        socket.emit('playersInGameUpdate', pendingGames[fromNickname]);
      else
        socket.emit('gameCancelled');
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
      var player = players[nickname];
      // This stops players trying to accept an invite to a game that does not exist
      if (!(fromNickname in pendingGames))
        return;
      var index = indexOfKeyValuePairInArray(pendingGames[fromNickname].pending, 'nickname', nickname);
      if (index != -1) {
        // Move player from pending to accepted
        pendingGames[fromNickname].pending.splice(index, 1);
        player.setColor('');
        pendingGames[fromNickname].accepted.push(player);
      }
      // Send playersInGameUpdate to all players in game
      var group = [pendingGames[fromNickname].host].concat(pendingGames[fromNickname].accepted);
      sendEventToPlayerGroup(group, 'playersInGameUpdate', pendingGames[fromNickname]);
    },
    declineInvite: function(socket, fromNickname) {
      var nickname = socketIdToPlayerName[socket.id];
      var player = players[nickname];
      // This stops players trying to decline an invite to a game that does not exist
      if (!(fromNickname in pendingGames))
        return;
      var index = indexOfKeyValuePairInArray(pendingGames[fromNickname].pending, 'nickname', nickname);
      if (index != -1) {
        // Move player from pending to declined
        pendingGames[fromNickname].pending.splice(index, 1);
        pendingGames[fromNickname].declined.push(player);
      }
      // Send playersInGameUpdate to all players in game
      var group = [pendingGames[fromNickname].host].concat(pendingGames[fromNickname].accepted);
      sendEventToPlayerGroup(group, 'playersInGameUpdate', pendingGames[fromNickname]);
    },
    changeDifficulty: function(socket, difficulty) {
      var nickname = socketIdToPlayerName[socket.id];
      if (nickname in pendingGames) {
        var validDifficulties = ['Easy', 'Medium', 'Hard'];
        if (validDifficulties.indexOf(difficulty) >= 0) {
          pendingGames[nickname].difficulty = difficulty;
          var group = [pendingGames[nickname].host].concat(pendingGames[nickname].accepted);
          sendEventToPlayerGroup(group, 'playersInGameUpdate', pendingGames[nickname]);
        }
      }
    },
    changeColor: function(socket, hostNickname, color) {
      var nickname = socketIdToPlayerName[socket.id];
      var player = players[nickname];
      // If color is in playerColorList
      if (playerColorList.indexOf(color) !== -1) {
        var index = indexOfKeyValuePairInArray(pendingGames[hostNickname].accepted, 'nickname', nickname);
        // If nickname is in game or nickname is host
        if (index != -1 || nickname === hostNickname) {
          var colorValid = true;
          for (var i in pendingGames[hostNickname].accepted) {
            if (pendingGames[hostNickname].accepted[i].getColor() === color)
              colorValid = false;
          }
          if (pendingGames[hostNickname].host.getColor() === color)
            colorValid = false;
          if (colorValid) {
            player.setColor(color);
            var group = [pendingGames[hostNickname].host].concat(pendingGames[hostNickname].accepted);
            sendEventToPlayerGroup(group, 'playersInGameUpdate', pendingGames[hostNickname]);
          }
        }
      }
      var index = indexOfKeyValuePairInArray(pendingGames[hostNickname].accepted, 'nickname', nickname);
    },
    startGame: function(socket) {
      var nickname = socketIdToPlayerName[socket.id];
      if (nickname in pendingGames) {
        var group = [pendingGames[nickname].host].concat(pendingGames[nickname].accepted);
        sendEventToPlayerGroup(group, 'gameStarting');
        setTimeout(function() {
          var pingToPlayerNames = {};
          for (var i in group) {
            var sum = 0;
            for (var j in group[i]._pings)
              sum += group[i]._pings[j];
            var ping = parseInt((sum/players[group[i].nickname]._pings.length)/2);
            if (ping in pingToPlayerNames)
              pingToPlayerNames[ping].push(group[i].nickname);
            else
              pingToPlayerNames[ping] = [group[i].nickname];
          }
          var sortedPings = Object.keys(pingToPlayerNames).sort(function(a, b) {
            return (parseInt(b) - parseInt(a)) >= 0;
          });

          var i = 0;
          var each = function() {
            var ping = sortedPings[i];
            for (j in pingToPlayerNames[ping]) {
              var nickname = pingToPlayerNames[ping][j];
              for (k in socketIdToPlayerName) {
                console.log(socketIdToPlayerName[k]);
                if (socketIdToPlayerName[k] === nickname) {
                  socketIdToSocket[k].emit('startCountdown');
                  break;
                }
              }
            }
            i++;
            if (i < sortedPings.length) {
              setTimeout(each, ping-sortedPings[i]);
            }
          };
          setTimeout(each, 0);
        }, 1000);
      }
    },
    disconnect: function(socket) {
      console.log('User disconnected');
      if (socketIdToPlayerName[socket.id] in pendingGames) {
        // If player is the host of a game, notify all players in the game that the game has been removed
        var game = pendingGames[socketIdToPlayerName[socket.id]];
        var group = game.accepted.concat(game.pending);
        sendEventToPlayerGroup(group, 'gameCancelled', game.host.nickname);
        delete pendingGames[socketIdToPlayerName[socket.id]];
      } else {
        var nickname = socketIdToPlayerName[socket.id];
        for (var game in pendingGames) {
          var acceptedIndex = indexOfKeyValuePairInArray(pendingGames[game].accepted, 'nickname', nickname);
          var pendingIndex = indexOfKeyValuePairInArray(pendingGames[game].pending, 'nickname', nickname);
          var declinedIndex = indexOfKeyValuePairInArray(pendingGames[game].declined, 'nickname', nickname);
          if (acceptedIndex >= 0 || pendingIndex >= 0 || declinedIndex >= 0) {
            if (acceptedIndex >= 0)
              pendingGames[game].accepted.splice(acceptedIndex, 1);
            if (pendingIndex >= 0)
              pendingGames[game].pending.splice(pendingIndex, 1);
            if (declinedIndex >= 0)
              pendingGames[game].declined.splice(declinedIndex, 1);
            var group = [pendingGames[game].host].concat(pendingGames[game].accepted);
            sendEventToPlayerGroup(group, 'playersInGameUpdate', pendingGames[game]);
          }
        }
      }

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