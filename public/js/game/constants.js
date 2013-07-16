({ define: typeof define === 'function'
            ? define
            : function (f) {
              module.exports = exports = f();
            }}).
define(function(require) {
  return {
                KEY_LEFT : 37,
                  KEY_UP : 38,
               KEY_RIGHT : 39,
                KEY_DOWN : 40,
                   KEY_W : 87,
                   KEY_A : 65,
                   KEY_S : 83,
                   KEY_D : 68,
    DEFAULT_PLAYER_SPEED : 5,
                     FPS : 30
  };
});