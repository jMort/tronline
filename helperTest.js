var helper = require('./helper');
var calculateAveragePing         = helper.calculateAveragePing;
var determineGameStateXMillisAgo = helper.determineGameStateXMillisAgo;

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

exports.testDetermineGameStateXMillisAgo = function(test) {
  var snapshots1 = {
    5: new Game(100, 100, [new Player('', 5, 5, 5, 'E', '')]),
    7: new Game(100, 100, [new Player('', 5, 5, 5, 'E', '')]),
    10: new Game(100, 100, [new Player('correct2', 5, 5, 5, 'E', '')]),
    30: new Game(100, 100, [new Player('correct1', 5, 5, 5, 'E', '')])
  };

  var game = determineGameStateXMillisAgo(snapshots1, 7, 31);
  test.equal(game.getPlayers()[0].nickname, 'correct1');

  game = determineGameStateXMillisAgo(snapshots1, 11, 31);
  test.equal(game.getPlayers()[0].nickname, 'correct2');

  game = determineGameStateXMillisAgo(snapshots1, 21, 31);
  test.equal(game.getPlayers()[0].nickname, 'correct2');

  var snapshots2 = {
    2000: new Game(100, 100, [new Player('correct1', 5, 5, 5, 'E', '')]),
    2500: new Game(100, 100, [new Player('', 5, 5, 5, 'E', '')]),
    3000: new Game(100, 100, [new Player('', 5, 5, 5, 'E', '')]),
    6500: new Game(100, 100, [new Player('correct2', 5, 5, 5, 'E', '')]),
    7000: new Game(100, 100, [new Player('correct3', 5, 5, 5, 'E', '')])
  };

  game = determineGameStateXMillisAgo(snapshots2, 6000, 7000);
  test.equal(game.getPlayers()[0].nickname, 'correct1');

  game = determineGameStateXMillisAgo(snapshots2, 251, 7000);
  test.equal(game.getPlayers()[0].nickname, 'correct2');

  game = determineGameStateXMillisAgo(snapshots2, 249, 7000);
  test.equal(game.getPlayers()[0].nickname, 'correct3');
  test.done();
};