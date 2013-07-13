var helper = require('./helper');
var mathFunctions = require('./public/js/mathFunctions');
module.exports = function(io, Game, Player, players, socketIdToSocket, socketIdToPlayerName, socketIdToLastSynchronizeTime, socketIdToLatencies, socketIdToClockOffset, pendingGames, playerColorList, games, gameSnapshots, indexOfKeyValuePairInArray, addToPending) {
  // Sends event to all players in array `playerGroup`
  var sendEventToPlayerGroup = function(playerGroup, event, data) {
    for (var i in playerGroup) {
      for (var j in socketIdToPlayerName) {
        if (socketIdToPlayerName[j] == playerGroup[i].nickname) {
          socketIdToSocket[j].emit(event, data);
          break;
        }
      }
    }
  };

  // Determines the initial positions and directions for players in a game based on width and height
  var initialPositions = function(width, height, margin, numPlayers) {
    var positions = [];
    if (numPlayers === 1) {
      positions.push({x: margin, y: height/2, direction: 'E'});
    } else if (numPlayers === 2) {
      positions.push({x: margin, y: height/2, direction: 'E'});
      positions.push({x: width-margin, y: height/2, direction: 'W'});
    }

    // Now clean all positions by making sure they are at multiples of 10
    for (var i in positions) {
      var newPosition = Player.cleanPosition(positions[i].x, positions[i].y);
      positions[i].x = newPosition[0];
      positions[i].y = newPosition[1];
    }
    return positions;
  };

  // Fast forwards a player ahead by X milliseconds and returns the new player
  var fastForwardPlayerByXMillis = function(player, millis) {
    var newPlayer = Player.clone(player);
    var frames = parseInt(millis/(1000/30));
    for (var i = 0; i < frames; i++)
      newPlayer.move();

    return newPlayer;
  };

  // Fast forwards a whole game ahead by X milliseconds and returns the new game
  var fastForwardGameByXMillis = function(game, millis) {
    var players = game.getPlayers();
    var newPlayers = [];
    for (var i in players) {
      newPlayers.push(fastForwardPlayerByXMillis(players[i], millis));
    }
    var newGame = Game.clone(game);
    newGame.players = newPlayers;

    return newGame;
  };

  var broadcastGameState = function(hostNickname, intervalId) {
    if (hostNickname in games) {
      var data = { timestamp: new Date().getTime(), game: games[hostNickname] };
      sendEventToPlayerGroup(games[hostNickname].getPlayers(), 'gameUpdate', data);
    } else {
      if (intervalId)
        clearInterval(intervalId);
    }
  };

  return {
    pingIn: function(socket) {
      if (players[socketIdToPlayerName[socket.id]]._pings.length == 10)
        players[socketIdToPlayerName[socket.id]]._pings.splice(0, 1);
      var lastPingSentAt = players[socketIdToPlayerName[socket.id]]._lastPingSentAt;
      if (lastPingSentAt !== null) {
        players[socketIdToPlayerName[socket.id]]._pings.push(new Date().getTime() - lastPingSentAt);
        // Reset lastPingSentAt time to null
        players[socketIdToPlayerName[socket.id]]._lastPingSentAt = null;
      }
    },
    synchronizeTime: function(socket, clientTime) {
      var currentTime = new Date().getTime();
      socket.emit('currentTime', currentTime);
      if (socketIdToLastSynchronizeTime[socket.id] === undefined) {
        socketIdToLastSynchronizeTime[socket.id] = currentTime;
        socketIdToLatencies[socket.id] = [];
      } else {
        var totalTime = currentTime - socketIdToLastSynchronizeTime[socket.id];
        var latency = totalTime/2;
        if (socketIdToClockOffset[socket.id] === undefined)
          socketIdToClockOffset[socket.id] = clientTime - currentTime + latency;
        else
          socketIdToLatencies[socket.id].push(latency);

        if (socketIdToLatencies[socket.id].length < 9) {
          socketIdToLastSynchronizeTime[socket.id] = currentTime;
        } else {
          var latencies = socketIdToLatencies[socket.id];
          var newLatencies = mathFunctions.filterNumbersXStandardDeviationsAwayFromMedian(latencies, 1);
          var averageLatency = parseInt(mathFunctions.average(newLatencies));
          socketIdToClockOffset[socket.id] = clientTime - currentTime + averageLatency;
        }
      }
    },
    getNumPlayersOnline: function(socket) {
      socket.emit('numPlayersOnline', Object.keys(socketIdToSocket).length)
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
      if (name !== undefined) {
        message = message.replace(/</g, '&lt;');
        message = message.replace(/>/g, '&gt;');
        io.sockets.emit('receiveMessage', name+': '+message);
      }
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
          // Check that no other player is already this color (excluding host)
          for (var i in pendingGames[hostNickname].accepted) {
            if (pendingGames[hostNickname].accepted[i].getColor() === color)
              colorValid = false;
          }
          // Check that the host is not already this color
          if (pendingGames[hostNickname].host.getColor() === color)
            colorValid = false;
          if (colorValid) {
            player.setColor(color);
            var group = [pendingGames[hostNickname].host].concat(pendingGames[hostNickname].accepted);
            sendEventToPlayerGroup(group, 'playersInGameUpdate', pendingGames[hostNickname]);
          }
        }
      }
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

          var gamePlayers = [pendingGames[nickname].host].concat(pendingGames[nickname].accepted);
          var positions = initialPositions(800, 600, 50, gamePlayers.length);
          for (var p in positions) {
            gamePlayers[p].path = [[positions[p].x, positions[p].y]];
            gamePlayers[p].direction = positions[p].direction;
          }
          var game = new Game(800, 600, gamePlayers);
          games[nickname] = game;
          broadcastGameState(nickname);

          // Remove game from pendingGames
          delete pendingGames[nickname];

          // Send 'startCountdown' event to all players at times based on their latency
          // so that each player's countdown will start at the same time
          var i = 0;
          var each = function() {
            var ping = sortedPings[i];
            for (var j in pingToPlayerNames[ping]) {
              var nickname = pingToPlayerNames[ping][j];
              for (var k in socketIdToPlayerName) {
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

          // Start the game loop after 3+1 seconds plus the fastest latency
          // (this should start at the same time every player's countdown finishes)
          // NOTE: The reason why it is 4 seconds instead of 3 is because the setInterval
          //       function is being used client-side, and the way it works is that it
          //       initially waits the interval time (making it wait an extra second).
          setTimeout(function() {
            var intervalId = setInterval(function() {
              game.update();
            }, 1000/30);
            var broadcastIntervalId = setInterval(function() {
              broadcastGameState(nickname, broadcastIntervalId);
            }, 500);
          }, parseInt(sortedPings[0])+4000);
        }, 1000);
      }
    },
    changeDirection: function(socket, hostNickname, direction, timestamp) {
      var nickname = socketIdToPlayerName[socket.id];
      var playersInGame = games[hostNickname].getPlayers();
      var playerIsInGame = false;
      var playerIndex = -1;
      for (var i in playersInGame) {
        if (playersInGame[i].nickname === nickname) {
          playerIsInGame = true;
          playerIndex = i;
          break;
        }
      }
      if (playerIsInGame) {
        // Calculate the average ping across the past 5 seconds of data
        // This is the one-way trip
        //var ping = helper.calculateAveragePing(players[nickname]._pings);
        var clientTime = new Date().getTime() + socketIdToClockOffset[socket.id];
        var ping = Math.abs(clientTime - timestamp);

        // We need to look at the closest snapshot to the time the player actually made the move
        var currentTime = new Date().getTime();
        var game = helper.determineGameStateXMillisAgo(gameSnapshots[hostNickname], ping, currentTime);
        var newPlayer = game.getPlayers()[playerIndex];

        // Now make the move. NOTE: The direction is validated in the Player class
        newPlayer.updateDirection(direction);

        // Simulate player forward in time by its ping
        newPlayer = fastForwardPlayerByXMillis(newPlayer, ping);

        // Replace player with new up-to-date player
        games[hostNickname].players[playerIndex] = newPlayer;
        players[nickname] = newPlayer;

        broadcastGameState(hostNickname);
      }
    },
    disconnect: function(socket) {
      console.log('User disconnected');
      var nickname = socketIdToPlayerName[socket.id];
      if (nickname in pendingGames) {
        // If player is the host of a game, notify all players in the game that the game has been removed
        var game = pendingGames[nickname];
        var group = game.accepted.concat(game.pending);
        sendEventToPlayerGroup(group, 'gameCancelled', game.host.nickname);
        delete pendingGames[socketIdToPlayerName[socket.id]];
      } else {
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

      if (nickname in games) {
        delete games[nickname];
        delete gameSnapshots[nickname];
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