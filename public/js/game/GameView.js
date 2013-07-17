define(function(require) {
  var $            = require('jquery'),
      _            = require('underscore'),
      Backbone     = require('backbone'),
      eventBus     = require('eventBus'),
      Kinetic      = require('kinetic'),
      constants    = require('game/constants'),
      Game         = require('game/Game'),
      Player       = require('game/Player'),
      AI           = require('game/AI'),
      GameOverView = require('game/GameOverView'),
      template     = require('text!game/game.html');

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
      var player = new Player(this.nickname, 45, parseInt(this.renderedHeight/2),
                              constants.DEFAULT_PLAYER_SPEED, 'E', '#BB2200');
      var aiLogic = new AI(this.renderedWidth, this.renderedHeight);
      var aiPlayer = new Player('AI', this.renderedWidth-45, parseInt(this.renderedHeight/2),
                                constants.DEFAULT_PLAYER_SPEED, 'W', '#0022BB', aiLogic);
      this.players = [player, aiPlayer];
      var self = this;
      this.game = new Game(this.renderedWidth, this.renderedHeight, this.players, false, function() {
        self.displayGameOver(self.game.results());
      });
      $(window).bind('keydown', function(e) {
        if (e.keyCode == constants.KEY_LEFT || e.keyCode == constants.KEY_A)
          player.updateDirection('W');
        else if (e.keyCode == constants.KEY_UP || e.keyCode == constants.KEY_W)
          player.updateDirection('N');
        else if (e.keyCode == constants.KEY_RIGHT || e.keyCode == constants.KEY_D)
          player.updateDirection('E');
        else if (e.keyCode == constants.KEY_DOWN || e.keyCode == constants.KEY_S)
          player.updateDirection('S');
      });
    },
    headToHeadInit: function() {
      var player1 = new Player('PLAYER 1', 45, parseInt(this.renderedHeight/2), 5, 'E', '#BB2200');
      var player2 = new Player('PLAYER 2', this.renderedWidth-45, parseInt(this.renderedHeight/2), 5, 'W', '#0022BB');
      this.players = [player1, player2];
      var self = this;
      this.game = new Game(this.renderedWidth, this.renderedHeight, this.players, false, function() {
        self.displayGameOver(self.game.results());
      });
      $(window).bind('keydown', function(e) {
        if (e.keyCode == constants.KEY_LEFT)
          player2.updateDirection('W');
        else if (e.keyCode == constants.KEY_UP)
          player2.updateDirection('N');
        else if (e.keyCode == constants.KEY_RIGHT)
          player2.updateDirection('E');
        else if (e.keyCode == constants.KEY_DOWN)
          player2.updateDirection('S');
        else if (e.keyCode == constants.KEY_W)
          player1.updateDirection('N');
        else if (e.keyCode == constants.KEY_A)
          player1.updateDirection('W');
        else if (e.keyCode == constants.KEY_S)
          player1.updateDirection('S');
        else if (e.keyCode == constants.KEY_D)
          player1.updateDirection('E');
      });
    },
    multiplayerInit: function() {
      // Fast forwards a player ahead by X milliseconds and returns the new player
      var fastForwardPlayerByXMillis = function(player, millis) {
        var newPlayer = Player.clone(player);
        var frames = parseInt(millis/(1000/constants.FPS));
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
      var player;
      var lastKeyPressed = null;
      var self = this;
      this.socket.on('startCountdown', function() {
        var intervalId = setInterval(function() {
          self.$('#countdown').text(countdown);
          self.$('#countdown').css('margin-left', -self.$('#countdown').width()/2);
          self.$('#countdown').css('margin-top', -self.$('#countdown').height()/2);
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
          self.renderMultiplayer();
          var countdownTitle = $('<h1 id="countdown" class="textGlow" style="position: absolute; left: 50%; top: 50%;">Ready!</h1>');
          $(countdownTitle).css('margin-left', -$(countdownTitle).width()/2 - 50);
          $(countdownTitle).css('margin-top', -$(countdownTitle).height()/2 - 15);

          self.$el.append($(countdownTitle));
        } else {
          var game = fastForwardGameByXMillis(Game.createNewFromObject(data.game), millis);
          // Only update the other players, not yourself
          for (var i in game.players) {
            if (game.players[i].nickname !== self.nickname)
              self.game.players[i] = game.players[i];
          }
        }

        // Find the player with our nickname and store a reference to it in player
        var players = self.game.getPlayers();
        for (var i in players) {
          if (players[i].nickname === self.nickname) {
            player = players[i];
            break;
          }
        }
      });
      this.socket.on('gameOver', function(data) {
        self.game = Game.createNewFromObject(data.game);
        var results = data.results;
        // Wait one frame before deactivating players so the flashing animation can happen
        setTimeout(function() {
          var players = self.game.getPlayers();
          for (var i in players) {
            if (!players[i].active) {
              players[i].active = true;
              players[i].deactivate();
            } else {
              players[i].active = false;
            }
          }
        }, 1000/constants.FPS);
        self.displayGameOver(results);
      });

      $(window).bind('keydown', function(e) {
        var timestamp = new Date().getTime();
        if (player && e.keyCode !== lastKeyPressed) {
          lastKeyPressed = e.keyCode;
          if (e.keyCode == constants.KEY_LEFT || e.keyCode == constants.KEY_A) {
            self.socket.emit('changeDirection', self.hostNickname, 'W', player.getPath(), timestamp);
            player.updateDirection('W');
          } else if (e.keyCode == constants.KEY_UP || e.keyCode == constants.KEY_W) {
            self.socket.emit('changeDirection', self.hostNickname, 'N', player.getPath(), timestamp);
            player.updateDirection('N');
          } else if (e.keyCode == constants.KEY_RIGHT || e.keyCode == constants.KEY_D) {
            self.socket.emit('changeDirection', self.hostNickname, 'E', player.getPath(), timestamp);
            player.updateDirection('E');
          } else if (e.keyCode == constants.KEY_DOWN || e.keyCode == constants.KEY_S) {
            self.socket.emit('changeDirection', self.hostNickname, 'S', player.getPath(), timestamp);
            player.updateDirection('S');
          }
        }
      });
      $(window).bind('keyup', function(e) {
        lastKeyPressed = null;
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
      }, 1000/constants.FPS);
      this.intervalId = intervalId;
    },
    renderMultiplayer: function() {
      this.$el.hide().html(_.template(template)()).fadeIn(500);

      var width  = this.game.width,
          height = this.game.height;
      var scale = 1;
      if (width+20 > WIDTH || height+20 > HEIGHT) {
        if (width+20-WIDTH > height+20-HEIGHT)
          scale = (WIDTH-50)/(width+20);
        else
          scale = (HEIGHT-50)/(height+20);
      }
      var stage = new Kinetic.Stage({
        container: 'gameCanvasContainer',
        width: width+20,
        height: height+20,
        scale: scale
      });

      this.$('div#gameCanvasContainer').css('position', 'absolute');
      this.$('div#gameCanvasContainer').css('left', '50%');
      this.$('div#gameCanvasContainer').css('top', '50%');
      this.$('div#gameCanvasContainer').width((width+20)*scale);
      this.$('div#gameCanvasContainer').height((height+20)*scale);
      var w = this.$('div#gameCanvasContainer').width();
      var h = this.$('div#gameCanvasContainer').height();
      this.$('div#gameCanvasContainer').css('margin-left', -w/2);
      this.$('div#gameCanvasContainer').css('margin-top', -h/2);

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

      var hasPlayerDied = false;
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
        if (self.gameStarted) {
          self.game.update();
          var player;
          // Find the player with our nickname and store a reference to it in player
          var players = self.game.getPlayers();
          for (var i in players) {
            if (players[i].nickname === self.nickname) {
              player = players[i];
              break;
            }
          }
          if (!player.active && !hasPlayerDied) {
            self.socket.emit('playerDied', self.hostNickname, player.getPath());
            hasPlayerDied = true;
          }
        }
      }, 1000/constants.FPS);
      this.intervalId = intervalId;
    },
    displayGameOver: function(results) {
      // If the gameOverView doesn't already exist
      if (this.$('.gameOverView').length == 0) {
        this.$el.append('<div class="gameOverView"></div>');
        var gameOverView = new GameOverView({ el: this.$('.gameOverView'), results: results });
        this.gameOverView = gameOverView;
      }
    },
    teardown: function() {
      clearInterval(this.intervalId);
      $(window).unbind('keydown');
    }
  });

  return GameView;
});