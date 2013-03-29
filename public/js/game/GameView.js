define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      eventBus = require('eventBus'),
      Kinetic  = require('kinetic'),
      Game     = require('game/gameLogic'),
      template = require('text!game/game.html');

  var LEFT  = 37,
      UP    = 38,
      RIGHT = 39,
      DOWN  = 40;
  var WIDTH  = $(window).width();
      HEIGHT = $(window).height();
  var GameView = Backbone.View.extend({
    initialize: function() {
      var game = new Game(WIDTH, HEIGHT);
      this.game = game;
      $(window).bind('keydown', function(e) {
        if (e.keyCode == LEFT)
          game.player.updateDirection('W');
        else if (e.keyCode == UP)
          game.player.updateDirection('N');
        else if (e.keyCode == RIGHT)
          game.player.updateDirection('E');
        else if (e.keyCode == DOWN)
          game.player.updateDirection('S');
      });
      this.render();
    },
    render: function() {
      this.$el.html(_.template(template)());

      var stage = new Kinetic.Stage({
        container: 'gameCanvasContainer',
        width: WIDTH,
        height: HEIGHT
      });

      var layer = new Kinetic.Layer();
      stage.add(layer);

      var game = this.game;
      var intervalId = setInterval(function() {
        layer.removeChildren();
        var player = game.getPlayer();
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
            points: points,
            stroke: player.color,
            strokeWidth: 10
          });
          layer.add(line);
        }
        layer.draw();
        game.update();
      }, 1000/30);
    }
  });

  return GameView;
});