var Game = require('./public/js/game/Game');

// Calculates the average ping divided by 2 (one-way trip)
exports.calculateAveragePing = function(pingsArray) {
  var sum = 0;
  for (var i in pingsArray) {
    sum += parseInt(pingsArray[i]);
  }
  return parseInt((sum/pingsArray.length)/2);
};

// Determines the game state X milliseconds ago from a set of snapshots
exports.determineGameStateXMillisAgo = function(snapshots, millis, currentTime) {
  var targetTime = currentTime - millis;
  var game = null;
  var timestamp = null;
  for (var t in snapshots) {
    if (timestamp == null || Math.abs(targetTime - t) < Math.abs(targetTime - timestamp)) {
      game = snapshots[t];
      timestamp = t;
    }
  }
  return Game.clone(game);
};