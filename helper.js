var Game      = require('./public/js/game/Game');
var Player    = require('./public/js/game/Player');
var constants = require('./public/js/game/constants');

// Calculates the average ping divided by 2 (one-way trip)
exports.calculateAveragePing = function(pingsArray) {
  var sum = 0;
  for (var i in pingsArray) {
    sum += parseInt(pingsArray[i]);
  }
  return parseInt((sum/pingsArray.length)/2);
};

// Determines the game state X milliseconds ago from a set of snapshots
exports.determineGameStateXMillisAgoUsingSnapshot = function(snapshots, millis, currentTime) {
  var targetTime = currentTime - millis;
  var game = null;
  var timestamp = null;
  for (var t in snapshots) {
    if (timestamp == null || Math.abs(targetTime - t) < Math.abs(targetTime - timestamp)) {
      game = snapshots[t];
      timestamp = t;
    }
  }
  return { timestamp: timestamp, game: Game.clone(game) };
};

// Determines the player state X milliseconds ago
exports.determinePlayerStateXMillisAgo = function(player, millis) {
  // Clone the player first to avoid modifying the actual player
  var newPlayer = Player.clone(player);

  // Calculate how far the player must be moved backwards in time
  var distance = parseInt(millis/(1000/constants.FPS) * newPlayer.speed);

  // Keep removing the last node from the player's path, while the distance to rewind the player by
  // is greater than the distance between the last two nodes
  var lastDistance = newPlayer.lastDistance();
  while (distance > lastDistance) {
    // Remove the last node from the player's path
    newPlayer.path.pop();
    distance -= lastDistance;
    lastDistance = newPlayer.lastDistance();

    // Update the direction based on the last two nodes now
    var lastIndex = newPlayer.path.length - 1;
    if (newPlayer.path[lastIndex-1][0] == newPlayer.path[lastIndex][0]) {
      if (newPlayer.path[lastIndex-1][1] < newPlayer.path[lastIndex][1])
        newPlayer.direction = 'S';
      else
        newPlayer.direction = 'N';
    } else {
      if (newPlayer.path[lastIndex-1][0] < newPlayer.path[lastIndex][0])
        newPlayer.direction = 'E';
      else
        newPlayer.direction = 'W;';
    }
  }

  // Now if the player still needs to move back some more, move the last node backwards by this distance
  if (distance > 0) {
    var lastIndex = newPlayer.path.length - 1;
    // If the last line the player made was vertical, move the distance in the y axis
    // Otherwise it must be horizontal, so move the distance in the x axis
    if (newPlayer.path[lastIndex-1][0] == newPlayer.path[lastIndex][0]) {
      // If the second last node is higher up than the last node, move the last node upwards
      // Otherwise move it downwards
      if (newPlayer.path[lastIndex-1][1] < newPlayer.path[lastIndex][1])
        newPlayer.path[lastIndex][1] -= distance;
      else
        newPlayer.path[lastIndex][1] += distance;
    } else {
      // If the second last node is further left than the last node, move the last node left
      // Otherwise move it right
      if (newPlayer.path[lastIndex-1][0] < newPlayer.path[lastIndex][0])
        newPlayer.path[lastIndex][0] -= distance;
      else
        newPlayer.path[lastIndex][0] += distance;
    }
  }

  return newPlayer;
};