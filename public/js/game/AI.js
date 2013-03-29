define(function() {
  var AI = function(width, height) {
    var distance = function(point1, point2) {
      var a = point2[0]-point1[0];
      var b = point2[1]-point1[1];
      return Math.sqrt(a*a + b*b);
    };

    var isBlocked = function(point, direction, paths) {
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
            if (point[0] === paths[path][i][0] && point[1] > minY && point[1] < maxY)
              return true;
          } else {
            // Horizontal line
            if (point[1] === paths[path][i][1] && point[0] > minX && point[0] < maxX) {
              return true;
            }
          }
        }
      }
      return false;
    };

    this.makeMove = function(myPath, myDirection, playerPath) {
      var directions = ['N', 'E', 'S', 'W'];

      // Remove the current direction from possible directions
      directions.splice(directions.indexOf(myDirection), 1);

      // Remove the opposite of the current direction from possible directions
      var opposites = { 'N': 'S', 'S': 'N', 'E': 'W', 'W': 'E' };
      var opposite = opposites[myDirection];
      directions.splice(directions.indexOf(opposite), 1);

      var point = myPath[myPath.length-1];
      if (isBlocked([point[0], point[1]], directions[0], [myPath, playerPath]))
        directions.splice(0, 1);
      else if (isBlocked([point[0], point[1]], directions[1], [myPath, playerPath]))
        directions.splice(1, 1);

      if (isBlocked([point[0], point[1]], myDirection, [myPath, playerPath])) {
        console.log(directions);
        return directions[Math.floor((Math.random()*2))];
      } else {
        return 0;
      }
    };
  };

  return AI;
});