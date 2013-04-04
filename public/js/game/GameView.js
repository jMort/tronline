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
      DOWN  = 40;
  var WIDTH  = $(window).width();
      HEIGHT = $(window).height();
  console.log(WIDTH, HEIGHT);
  var GameView = Backbone.View.extend({
    initialize: function() {
      var renderedWidth = WIDTH-20-(WIDTH%10);
      var renderedHeight = HEIGHT-20-(HEIGHT%10);
      var player = new Player('', 45, parseInt(renderedHeight/2), 5, 'E', '#BB2200');
      var aiPlayer = new Player('', renderedWidth-45, parseInt(renderedHeight/2), 5, 'W', '#0022BB');
      var aiLogic = new AI(renderedWidth, renderedHeight);
      var game = new Game(renderedWidth, renderedHeight, [player, aiPlayer]);
      this.player = player;
      this.aiPlayer = aiPlayer;
      this.aiLogic = aiLogic;
      this.game = game;
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
      this.render();
    },
    translatePoints: function(points) {
      var newPoints = [];
      for (var i in points) {
        newPoints.push([points[i][0]+10, points[i][1]+10]);
      }
      return newPoints;
    },
    render: function() {
      this.$el.html(_.template(template)());

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

      var aiPlayer = this.aiPlayer;
      var aiLogic = this.aiLogic;
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

      var intervalId2 = setInterval(function() {
        var direction = aiLogic.makeMove(aiPlayer.getPath(), aiPlayer.getDirection(), game.getPlayers()[0].getPath());
        if (['N', 'E', 'W', 'S'].indexOf(direction) != -1)
          aiPlayer.updateDirection(direction);
      }, 1000/60);
    }
  });

  return GameView;
});