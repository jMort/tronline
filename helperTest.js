var helper = require('./helper');
var calculateAveragePing                      = helper.calculateAveragePing;
var determineGameStateXMillisAgoUsingSnapshot = helper.determineGameStateXMillisAgoUsingSnapshot;
var determinePlayerStateXMillisAgo            = helper.determinePlayerStateXMillisAgo;

var Game = require('./public/js/game/Game');
var Player = require('./public/js/game/Player');

exports.testCalculateAveragePing = function(test) {
  var pingsArray = [50, 30, 35];
  test.equal(calculateAveragePing(pingsArray), 19);
  pingsArray = [20];
  test.equal(calculateAveragePing(pingsArray), 10);
  pingsArray = [0, 0];
  test.equal(calculateAveragePing(pingsArray), 0);
  pingsArray = [10, 10, 10, 10, 10];
  test.equal(calculateAveragePing(pingsArray), 5);
  pingsArray = [147, 150, 315, 175, 164];
  test.equal(calculateAveragePing(pingsArray), 95);
  test.done();
};

exports.testDetermineGameStateXMillisAgoUsingSnapshot = function(test) {
  var snapshots1 = {
    5: new Game(100, 100, [new Player('', 5, 5, 5, 'E', '')]),
    7: new Game(100, 100, [new Player('', 5, 5, 5, 'E', '')]),
    10: new Game(100, 100, [new Player('correct2', 5, 5, 5, 'E', '')]),
    30: new Game(100, 100, [new Player('correct1', 5, 5, 5, 'E', '')])
  };

  var game = determineGameStateXMillisAgoUsingSnapshot(snapshots1, 7, 31).game;
  test.equal(game.getPlayers()[0].nickname, 'correct1');

  game = determineGameStateXMillisAgoUsingSnapshot(snapshots1, 11, 31).game;
  test.equal(game.getPlayers()[0].nickname, 'correct2');

  game = determineGameStateXMillisAgoUsingSnapshot(snapshots1, 21, 31).game;
  test.equal(game.getPlayers()[0].nickname, 'correct2');

  var snapshots2 = {
    2000: new Game(100, 100, [new Player('correct1', 5, 5, 5, 'E', '')]),
    2500: new Game(100, 100, [new Player('', 5, 5, 5, 'E', '')]),
    3000: new Game(100, 100, [new Player('', 5, 5, 5, 'E', '')]),
    6500: new Game(100, 100, [new Player('correct2', 5, 5, 5, 'E', '')]),
    7000: new Game(100, 100, [new Player('correct3', 5, 5, 5, 'E', '')])
  };

  game = determineGameStateXMillisAgoUsingSnapshot(snapshots2, 6000, 7000).game;
  test.equal(game.getPlayers()[0].nickname, 'correct1');

  game = determineGameStateXMillisAgoUsingSnapshot(snapshots2, 251, 7000).game;
  test.equal(game.getPlayers()[0].nickname, 'correct2');

  game = determineGameStateXMillisAgoUsingSnapshot(snapshots2, 249, 7000).game;
  test.equal(game.getPlayers()[0].nickname, 'correct3');
  test.done();
};

exports.testDeterminePlayerStateXMillisAgo = function(test) {
  var player = new Player('', 5, 5, 5, 'E', '');
  player.move();
  player.move();
  player.updateDirection('S');
  var expectedPlayer = Player.clone(player);
  player.move();
  player.move();
  player.updateDirection('E');
  player.move();

  // If the player is moved back 100ms, that is 100/(1000/30) = 3 frames
  var newPlayer = determinePlayerStateXMillisAgo(player, 100);
  test.deepEqual(newPlayer.path, expectedPlayer.path);
  test.equal(newPlayer.getDirection(), expectedPlayer.getDirection());
  test.done();
};