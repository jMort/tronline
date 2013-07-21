define(function(require) {
  var Game = require('../../../public/js/game/Game');

  describe('Game', function() {

    it('should detect collisions', function() {
      expect(Game.isCollision([55, 55], [[[105, 55], [85, 55]]])).toBe(false);
      expect(Game.isCollision([155, 55], [[[185, 55], [155, 55], [155, 35], [165, 35]]])).toBe(true);
      expect(Game.isCollision([155, 55], [[[185, 55], [165, 55], [165, 35], [175, 35]]])).toBe(false);
      expect(Game.isCollision([155, 55], [[[185, 65], [155, 65], [155, 95], [165, 95]]])).toBe(false);
      expect(Game.isCollision([155, 55], [[[185, 55], [135, 55], [135, 35], [125, 35]]])).toBe(true);
      expect(Game.isCollision([155, 55], [[[185, 85], [155, 85], [155, 55], [145, 55]]])).toBe(true);
    });
  });
});