define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      eventBus = require('eventBus'),
      Kinetic  = require('kinetic'),
      Game     = require('game/gameLogic'),
      Player   = require('game/Player'),
      AI       = require('game/AI'),
      template = require('text!game/game.html');

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
      if (options.headToHead) {
        this.headToHeadInit();
        this.render();
      } else if (options.multiplayer) {
        this.socket = options.socket;
        this.hostNickname = options.hostNickname;
        this.multiplayerInit();
      } else {
        this.singlePlayerInit();
        this.render();
      }
    },
    singlePlayerInit: function() {
      var player = new Player('', 45, parseInt(this.renderedHeight/2), 5, 'E', '#BB2200');
      var aiLogic = new AI(this.renderedWidth, this.renderedHeight);
      var aiPlayer = new Player('', this.renderedWidth-45, parseInt(this.renderedHeight/2), 5, 'W', '#0022BB', aiLogic);
      this.players = [player, aiPlayer];
      this.game = new Game(this.renderedWidth, this.renderedHeight, this.players);
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
      var player1 = new Player('', 45, parseInt(this.renderedHeight/2), 5, 'E', '#BB2200');
      var player2 = new Player('', this.renderedWidth-45, parseInt(this.renderedHeight/2), 5, 'W', '#0022BB');
      this.players = [player1, player2];
      this.game = new Game(this.renderedWidth, this.renderedHeight, this.players);
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
      var left = WIDTH/2 - 55;
      var top = HEIGHT/2 - 50;
      this.$el.append('<h1 id="countdown" style="position: absolute; left: '+left+'px; top: '+top+'px;">Ready!</h1>');
      var countdown = 3;
      var self = this;
      this.socket.on('startCountdown', function() {
        var intervalId = setInterval(function() {
          self.$('#countdown').text(countdown);
          if (countdown > 0)
            countdown--;
          else
            clearInterval(intervalId);
        }, 1000);
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
    teardown: function() {
      clearInterval(this.intervalId);
      $(window).unbind('keydown');
    }
  });

  return GameView;
});