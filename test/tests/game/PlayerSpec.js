define(function(require) {
  var Player = require('../../../public/js/game/Player');

  describe('Player', function() {

    it('should calculate its own length correctly', function() {
      var player = new Player('testPlayer', 50, 50, 5, 'E', '#F00');
      expect(player.calculateLength()).toBe(0);
      player.move();
      player.move();
      expect(player.calculateLength()).toBe(10);
      player.updateDirection('S');
      expect(player.calculateLength()).toBe(10);
      player.move();
      expect(player.calculateLength()).toBe(15);
    });

    it('should calculate the distance between the last two nodes', function() {
      var player = new Player('testPlayer', 50, 50, 5, 'E', '#F00');
      expect(player.lastDistance()).toBe(0);
      player.move();
      player.move();
      expect(player.lastDistance()).toBe(10);
      player.updateDirection('S');
      player.move();
      player.move()
      expect(player.lastDistance()).toBe(10);
      player.move();
      expect(player.lastDistance()).toBe(15);
      player.updateDirection('E');
      player.move();
      player.move();
      player.move();
      player.move();
      expect(player.lastDistance()).toBe(20);
    });

    it('should change direction when updateDirection is called \
        (provided there is no barrier)', function() {
      var player = new Player('testPlayer', 50, 50, 5, 'E', '#F00');
      expect(player.getDirection()).toBe('E');
      player.updateDirection('S');
      expect(player.getDirection()).toBe('S');
      player.move();
      player.move();
      player.updateDirection('E');
      expect(player.getDirection()).toBe('E');
      player.move();
      player.move();
      player.updateDirection('N');
      expect(player.getDirection()).toBe('N');
      player.move();
      player.move();
      player.updateDirection('W');
      expect(player.getDirection()).toBe('W');
    });

    it('should be able to clone other Player objects', function() {
      var player = new Player('testPlayer', 50, 50, 5, 'E', '#F00');
      var clonedPlayer = Player.clone(player);
      clonedPlayer.nickname = 'anotherName';
      expect(player.nickname).toNotEqual(clonedPlayer.nickname);
      for (var i = 0; i < 12; i++) {
        clonedPlayer.move();
      }
      clonedPlayer.updateDirection('S');
      for (var i = 0; i < 4; i++) {
        clonedPlayer.move();
      }
      expect(clonedPlayer.getPath().length).toNotEqual(player.getPath().length);
    });
  });
});