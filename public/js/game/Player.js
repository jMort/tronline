define(function(require) {
  var Player = function(nickname, x, y, speed, direction, color) {
    this.nickname = nickname;

    // Make sure position is at a multiple of 10 before making a new node
    while ((x-5) % 10)
      x++;
    while ((y-5) % 10)
      y++;

    this.path = [[x, y]];
    this.speed = speed;
    this.direction = direction;
    this.color = color;
    this.active = true;

    var self = this;

    // Advances the player's position for one frame based on the player's speed
    this.move = function() {
      if (!self.active)
        return false;

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

      return true;
    };

    this.updateDirection = function(direction) {
      if (direction === self.direction)
        return;
      
      if (direction !== null || typeof direction !== 'undefined') {
        var directions = ['N', 'E', 'S', 'W'];

        // Remove the current direction from possible directions
        directions.splice(directions.indexOf(self.direction), 1);

        // Remove the opposite of the current direction from possible directions
        var opposites = { 'N': 'S', 'S': 'N', 'E': 'W', 'W': 'E' };
        var opposite = opposites[self.direction];
        directions.splice(directions.indexOf(opposite), 1);
        if ($.inArray(direction, directions) != -1) {
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
        return;
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
    };

    this.getColor = function() {
      return self.color;
    };
  };

  return Player;
});