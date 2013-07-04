define(function(require) {
  var Player = require('../../../public/js/game/Player');

  describe('Player', function() {

    it('should have getters and setters', function() {
      var player = new Player('testPlayer', 0, 0, 5, 'E', '#F00');
      expect(player.getHead).toBeTypeOf('function');
      expect(player.getPath).toBeTypeOf('function');
      expect(player.getDirection).toBeTypeOf('function');
      expect(player.getColor).toBeTypeOf('function');
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