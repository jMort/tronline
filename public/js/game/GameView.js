define(function(require) {
  var $            = require('jquery'),
      _            = require('underscore'),
      Backbone     = require('backbone'),
      eventBus     = require('eventBus'),
      Kinetic      = require('kinetic'),
      Game         = require('game/Game'),
      Player       = require('game/Player'),
      AI           = require('game/AI'),
      GameOverView = require('game/GameOverView'),
      template     = require('text!game/game.html');

  var LEFT  = 37,
      UP    = 38,
      RIGHT = 39,
      DOWN  = 40,
      KEY_W = 87,
      KEY_A = 65,
      KEY_S = 83,
      KEY_D = 68;
  var WIDTH, HEIGHT;
  var GameView = Backbone.View.extend({
    initialize: function(options) {
      WIDTH = $(window).width();
      HEIGHT = $(window).height();
      this.renderedWidth = WIDTH-20-(WIDTH%10);
      this.renderedHeight = HEIGHT-20-(HEIGHT%10);
      this.nickname = options.nickname;
      if (options.headToHead) {
        this.headToHeadInit();
        this.render();
      } else if (options.multiplayer) {
        this.socket = options.socket;
        this.hostNickname = options.hostNickname;
        this.clockDiff = options.clockDiff;
        this.multiplayerInit();
      } else {
        this.singlePlayerInit();
        this.render();
      }
    },
    singlePlayerInit: function() {
      var player = new Player(this.nickname, 45, parseInt(this.renderedHeight/2), 5, 'E', '#BB2200');
      var aiLogic = new AI(this.renderedWidth, this.renderedHeight);
      var aiPlayer = new Player('AI', this.renderedWidth-45, parseInt(this.renderedHeight/2), 5, 'W', '#0022BB', aiLogic);
      this.players = [player, aiPlayer];
      var self = this;
      this.game = new Game(this.renderedWidth, this.renderedHeight, this.players, function() {
        self.displayGameOver(self.game.results());
      });
      $(window).bind('keydown', function(e) {
        if (e.keyCode == LEFT)
          player.updateDirection('W');
        else if (e.keyCode == UP)
          player.updateDirection('N');
        else if (e.keyCode == RIGHT)
          player.updateDirection('E');
        else if (e.keyCode == DOWN)
          player.updateDirection('S');
      });
    },
    headToHeadInit: function() {
      var player1 = new Player('PLAYER 1', 45, parseInt(this.renderedHeight/2), 5, 'E', '#BB2200');
      var player2 = new Player('PLAYER 2', this.renderedWidth-45, parseInt(this.renderedHeight/2), 5, 'W', '#0022BB');
      this.players = [player1, player2];
      var self = this;
      this.game = new Game(this.renderedWidth, this.renderedHeight, this.players, function() {
        self.displayGameOver(self.game.results());
      });
      $(window).bind('keydown', function(e) {
        if (e.keyCode == LEFT)
          player2.updateDirection('W');
        else if (e.keyCode == UP)
          player2.updateDirection('N');
        else if (e.keyCode == RIGHT)
          player2.updateDirection('E');
        else if (e.keyCode == DOWN)
          player2.updateDirection('S');
        else if (e.keyCode == KEY_W)
          player1.updateDirection('N');
        else if (e.keyCode == KEY_A)
          player1.updateDirection('W');
        else if (e.keyCode == KEY_S)
          player1.updateDirection('S');
        else if (e.keyCode == KEY_D)
          player1.updateDirection('E');
      });
    },
    multiplayerInit: function() {
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

      this.gameStarted = false;
      var countdown = 3;
      var self = this;
      this.socket.on('startCountdown', function() {
        var intervalId = setInterval(function() {
          self.$('#countdown').text(countdown);
          if (countdown > 0) {
            countdown--;
          } else {
            self.gameStarted = true;
            clearInterval(intervalId);
            self.$('#countdown').remove();
          }
        }, 1000);
      });
      this.socket.on('gameUpdate', function(data) {
        var serverTime = new Date().getTime() + self.clockDiff;
        var millis = Math.abs(serverTime - data.timestamp);
        if (!(self.game)) {
          self.game = fastForwardGameByXMillis(Game.createNewFromObject(data.game), millis);
          var left = WIDTH/2 - 55;
          var top = HEIGHT/2 - 50;
          self.renderMultiplayer();
          self.$el.append('<h1 id="countdown" class="textGlow" style="position: absolute; left: '+left+'px; top: '+top+'px;">Ready!</h1>');
        } else {
          self.game = fastForwardGameByXMillis(Game.createNewFromObject(data.game), millis);
        }
        var players = self.game.getPlayers();
        for (var i in players) {
          if (players[i].nickname === self.nickname) {
            var player = players[i];
            break;
          }
        }

        // We need to use 'one' instead of 'bind' to stop it picking up a keydown event
        // multiple times and spamming the server, making the game really slow.
        $(window).one('keydown', function(e) {
          var timestamp = new Date().getTime();
          if (e.keyCode == LEFT) {
            player.updateDirection('W');
            self.socket.emit('changeDirection', self.hostNickname, 'W', timestamp);
          } else if (e.keyCode == UP) {
            player.updateDirection('N');
            self.socket.emit('changeDirection', self.hostNickname, 'N', timestamp);
          } else if (e.keyCode == RIGHT) {
            player.updateDirection('E');
            self.socket.emit('changeDirection', self.hostNickname, 'E', timestamp);
          } else if (e.keyCode == DOWN) {
            player.updateDirection('S');
            self.socket.emit('changeDirection', self.hostNickname, 'S', timestamp);
          }
        });
      });
      this.socket.on('gameOver', function(results) {
        // Wait one frame before deactivating players so the flashing animation can happen
        setTimeout(function() {
          var players = self.game.getPlayers();
          for (var i in players)
            players[i].active = false;
        }, 1000/30);
        self.displayGameOver(results);
      });
    },
    translatePoints: function(points) {
      var newPoints = [];
      for (var i in points) {
        newPoints.push([points[i][0]+10, points[i][1]+10]);
      }
      return newPoints;
    },
    render: function() {
      this.$el.hide().html(_.template(template)()).fadeIn(500);

      var stage = new Kinetic.Stage({
        container: 'gameCanvasContainer',
        width: WIDTH,
        height: HEIGHT
      });

      var borderLayer = new Kinetic.Layer();
      var leftLine = new Kinetic.Line({ points: [[5, 0], [5, HEIGHT]], stroke: '#FFF', strokeWidth: 10 });
      var bottomLine = new Kinetic.Line({ points: [[5, HEIGHT-5-(HEIGHT%10)/2], [WIDTH, HEIGHT-5-(HEIGHT%10)/2]], stroke: '#FFF', strokeWidth: 10+(HEIGHT%10) });
      var rightLine = new Kinetic.Line({ points: [[WIDTH-5-(WIDTH%10)/2, HEIGHT], [WIDTH-5-(WIDTH%10)/2, 0]], stroke: '#FFF', strokeWidth: 10+(WIDTH%10) });
      var topLine = new Kinetic.Line({ points: [[WIDTH-(WIDTH%10), 5], [5, 5]], stroke: '#FFF', strokeWidth: 10 });
      borderLayer.add(leftLine);
      borderLayer.add(bottomLine);
      borderLayer.add(rightLine);
      borderLayer.add(topLine);

      var layer = new Kinetic.Layer();
      stage.add(borderLayer);
      stage.add(layer);

      var game = this.game;
      var self = this;
      var intervalId = setInterval(function() {
        layer.removeChildren();
        var players = game.getPlayers();
        for (var p = 0; p < players.length; p++) {
          var player = players[p];
          for (var i = 0; i < player.path.length-1; i++) {
            var points = [[player.path[i][0], player.path[i][1]],
                          [player.path[i+1][0], player.path[i+1][1]]];
            if (points[0][0] === points[1][0]) {
              // If it's a vertical line, expand the points vertically by half the stroke width
              if (points[0][1] < points[1][1]) {
                points[0][1] -= 5;
                points[1][1] += 5;
              } else {
                points[0][1] += 5;
                points[1][1] -= 5;
              }
            } else {
              // If it's a horizontal line, expand the points horizontally by half the stroke width
              if (points[0][0] < points[1][0]) {
                points[0][0] -= 5;
                points[1][0] += 5;
              } else {
                points[0][0] += 5;
                points[1][0] -= 5;
              }
            }
            var line = new Kinetic.Line({
              points: self.translatePoints(points),
              stroke: player.getColor(),
              strokeWidth: 10
            });
            layer.add(line);
          }
        }
        layer.draw();
        game.update();
      }, 1000/30);
      this.intervalId = intervalId;
    },
    renderMultiplayer: function() {
      this.$el.hide().html(_.template(template)()).fadeIn(500);

      var width  = this.game.width,
          height = this.game.height;
      var stage = new Kinetic.Stage({
        container: 'gameCanvasContainer',
        width: width+20,
        height: height+20
      });

      // All multiplayer games will have widths and heights that are divisible by 10
      var borderLayer = new Kinetic.Layer();
      var leftLine = new Kinetic.Line({ points: [[5, 0], [5, height+20]], stroke: '#FFF', strokeWidth: 10 });
      var bottomLine = new Kinetic.Line({ points: [[5, height+15], [width+15, height+15]], stroke: '#FFF', strokeWidth: 10 });
      var rightLine = new Kinetic.Line({ points: [[width+15, height+20], [width+15, 0]], stroke: '#FFF', strokeWidth: 10 });
      var topLine = new Kinetic.Line({ points: [[width+10, 5], [5, 5]], stroke: '#FFF', strokeWidth: 10 });
      borderLayer.add(leftLine);
      borderLayer.add(bottomLine);
      borderLayer.add(rightLine);
      borderLayer.add(topLine);

      var layer = new Kinetic.Layer();
      stage.add(borderLayer);
      stage.add(layer);

      var self = this;
      var intervalId = setInterval(function() {
        layer.removeChildren();
        var players = self.game.getPlayers();
        for (var p = 0; p < players.length; p++) {
          var player = players[p];
          for (var i = 0; i < player.path.length-1; i++) {
            var points = [[player.path[i][0], player.path[i][1]],
                          [player.path[i+1][0], player.path[i+1][1]]];
            if (points[0][0] === points[1][0]) {
              // If it's a vertical line, expand the points vertically by half the stroke width
              if (points[0][1] < points[1][1]) {
                points[0][1] -= 5;
                points[1][1] += 5;
              } else {
                points[0][1] += 5;
                points[1][1] -= 5;
              }
            } else {
              // If it's a horizontal line, expand the points horizontally by half the stroke width
              if (points[0][0] < points[1][0]) {
                points[0][0] -= 5;
                points[1][0] += 5;
              } else {
                points[0][0] += 5;
                points[1][0] -= 5;
              }
            }
            var line = new Kinetic.Line({
              points: self.translatePoints(points),
              stroke: player.getColor(),
              strokeWidth: 10
            });
            layer.add(line);
          }
        }
        layer.draw();
        // Only update if the game has started
        if (self.gameStarted)
          self.game.update();
      }, 1000/30);
      this.intervalId = intervalId;
    },
    displayGameOver: function(results) {
      // If the gameOverView doesn't already exist
      if (this.$('.gameOverView').length == 0) {
        this.$el.append('<div class="gameOverView"></div>');
        var gameOverView = new GameOverView({ el: this.$('.gameOverView'), results: results });
      }
    },
    teardown: function() {
      clearInterval(this.intervalId);
      $(window).unbind('keydown');
    }
  });

  return GameView;
});