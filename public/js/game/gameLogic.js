define(function(require) {
  var Game = function(width, height, players) {
    this.players = players;

    var isCollision = function(point, direction, paths) {
      if (direction === 'N')
        point[1] -= 10;
      else if (direction === 'E')
        point[0] += 10;
      else if (direction === 'S')
        point[1] += 10;
      else if (direction === 'W')
        point[0] -= 10;

      if (point[0] < 0 || point[0] > width || point[1] < 0 || point[1] > height)
        return true;

      for (var path in paths) {
        for (var i = 0; i < paths[path].length-1; i++) {
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
            if (point[0] === paths[path][i][0] && point[1] >= minY && point[1] <= maxY)
              return true;
          } else {
            // Horizontal line
            if (point[1] === paths[path][i][1] && point[0] >= minX && point[0] <= maxX)
              return true;
          }
        }
      }
      return false;
    };

    var self = this;
    this.update = function() {
      var paths = []
      for (var i in self.players) {
        paths.push(self.players[i].getPath());
      }
      for (var i in self.players) {
        var player = self.players[i];
        var point = player.getHead();
        if (isCollision([point[0], point[1]], player.getDirection(), paths)) {
          player.deactivate();
        }
        player.move(paths);
      }
    };

    this.getPlayers = function() {
      return self.players;
    };
  };

  return Game;
});