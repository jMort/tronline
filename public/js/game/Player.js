({ define: typeof define === 'function'
            ? define
            : function (f) {
              module.exports = exports = f();
            }}).
define(function(require) {
  var Player = function(nickname, x, y, speed, direction, color, logic) {
    this.nickname = nickname;

    // Make sure position is at a multiple of 10 before making a new node
    while ((x-5) % 10)
      x++;
    while ((y-5) % 10)
      y++;

    this.path = [[x, y]];
    this.speed = speed;
    this.direction = direction;
    this.nextDirection = null;
    this.color = color;
    this.active = true;
    this._pings = [];
    this._lastPingSentAt = null;

    var self = this;

    // Advances the player's position for one frame based on the player's speed
    this.move = function(paths) {
      if (!self.active)
        return false;

      if (self.nextDirection !== null) {
        var distance = self.lastDistance();
        if (self.lastDistance() === 10)
          self.updateDirection(self.nextDirection);
        if (self.lastDistance() >= 10)
          self.nextDirection = null;
      }

      // Change in position (defaults to no movement)
      var deltaPosition = [0, 0];

      if (self.direction === 'N')
        deltaPosition[1] = self.speed * -1;
      else if (self.direction === 'E')
        deltaPosition[0] = self.speed;
      else if (self.direction === 'S')
        deltaPosition[1] = self.speed;
      else if (self.direction === 'W')
        deltaPosition[0] = self.speed * -1;

      var last = self.path.length - 1;
      var x = self.path[last][0] + deltaPosition[0],
          y = self.path[last][1] + deltaPosition[1];

      if (self.path.length == 1)
        self.path.push([x, y]);
      else
        self.path[last] = [x, y];

      // After moving the player in its current direction, check if the player has logic
      // attached to it (meaning it's an AI), and now let it make a decision to change directions.
      if (typeof logic !== 'undefined' && typeof logic === 'object') {
        var direction = logic.makeMove(self.path, self.direction, paths[0]);
        if (['N', 'E', 'W', 'S'].indexOf(direction) != -1)
          self.updateDirection(direction);
      }

      return true;
    };

    this.lastDistance = function() {
      var last = self.path.length - 1;
      var distance = 0;
      if (last > 0) {
        distance = Math.abs(self.path[last][0] - self.path[last-1][0]) +
                   Math.abs(self.path[last][1] - self.path[last-1][1]);
      }
      return distance;
    };

    this.calculateLength = function() {
      var length = 0;
      for (var i = 0; i < self.path.length-1; i++) {
        length += Math.abs(self.path[i+1][0] - self.path[i][0]);
        length += Math.abs(self.path[i+1][1] - self.path[i][1]);
      }
      return length;
    };

    this.updateDirection = function(direction) {
      if (!self.active)
        return false;
      
      if (direction === self.direction) {
        return false;
      } else if (self.path.length > 1) {
        var distance = self.lastDistance();
        if (distance == 0 || distance == 5) {
          self.nextDirection = direction;
          return false;
        }
      }
      
      if (direction !== null || typeof direction !== 'undefined') {
        var directions = ['N', 'E', 'S', 'W'];

        // Remove the current direction from possible directions
        directions.splice(directions.indexOf(self.direction), 1);

        // Remove the opposite of the current direction from possible directions
        var opposites = { 'N': 'S', 'S': 'N', 'E': 'W', 'W': 'E' };
        var opposite = opposites[self.direction];
        directions.splice(directions.indexOf(opposite), 1);
        if (directions.indexOf(direction) != -1) {
          self.direction = direction;
        }
      }

      var last = self.path.length - 1;
      var x = self.path[last][0],
          y = self.path[last][1];

      // Make sure position is at a multiple of 10 before making a new node
      while ((x-5) % 10)
        x++;
      while ((y-5) % 10)
        y++;

      self.path[last] = [x, y];
      self.path.push([x, y]);

      return true;
    };

    this.setColor = function(color) {
      self.color = color;
    };

    this.getHead = function() {
      return self.path[self.path.length-1];
    };

    this.getPath = function() {
      return self.path;
    };

    this.getDirection = function() {
      return self.direction;
    };

    this.deactivate = function() {
      if (!self.active)
        return false;
      self.active = false;
      var oldColor = self.color;
      self.color = '#666';
      var frame = 1;
      var intervalID = setInterval(function() {
        if (frame == 4)
          clearInterval(intervalID);
        if (self.color == oldColor)
          self.color = '#666';
        else
          self.color = oldColor;
        frame++;
      }, 100);

      return true;
    };

    this.getColor = function() {
      return self.color;
    };
  };

  // Makes sure position is at a multiple of 10 and returns it
  Player.cleanPosition = function(x, y) {
    while ((x-5) % 10)
      x++;
    while ((y-5) % 10)
      y++;
    return [x, y];
  };

  // This is used to create a new Player object with the same data as on the server.
  // It is needed as socket.io doesn't send functions contained within an object, only data.
  Player.createNewFromObject = function(obj) {
    var player = new Player(obj.nickname, obj.path[0][0], obj.path[0][1], obj.speed, obj.direction,
                            obj.color);
    player.path = [];
    for (var i in obj.path) {
      player.path.push([obj.path[i][0], obj.path[i][1]]);
    }
    player.nextDirection = obj.nextDirection;
    player.active = obj.active;
    player._pings = obj._pings;
    player._lastPingSentAt = obj._lastPingSentAt;
    return player;
  };

  // This is used to clone a Player object to avoid passing by reference
  Player.clone = function(player) {
    return Player.createNewFromObject(player);
  };

  return Player;
});