define(function(require) {
  var Player = require('game/Player');

  var Game = function(width, height) {
    this.player = new Player('', 50, 50, 5, 'E', '#BB2200');

    var isCollision = function(point, paths) {
      for (var path in paths) {
        for (var i = 0; i < paths[path].length-2; i++) {
          var minY = paths[path][i][1],
              maxY = paths[path][i+1][1];
          if (paths[path][i+1][1] < paths[path][i][1]) {
            minY = maxY;
            maxY = paths[path][i][1];
          }
          var minX = paths[path][i][0],
              maxX = paths[path][i+1][0];
          if (paths[path][i+1][0] < paths[path][i][0]) {
            minX = maxX;
            maxX = paths[path][i][0];
          }

          if (paths[path][i][0] === paths[path][i+1][0]) {
            // Vertical line
            if (point[0] === paths[path][i][0] && point[1] > minY && point[1] < maxY)
              return true;
          } else {
            // Horizontal line
            if (point[1] === paths[path][i][1] && point[0] > minX && point[0] < maxX)
              return true;
          }
        }
      }
      return false;
    };

    var self = this;
    this.update = function() {
      if (isCollision(self.player.getHead(), [self.player.getPath()])) {
        self.player.deactivate();
      }
      self.player.move();
    };

    this.getPlayer = function() {
      return self.player;
    };
  };

  return Game;
});