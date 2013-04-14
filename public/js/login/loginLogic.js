define(function(require) {
  var login = function(socket, nickname, success, fail) {
      socket.emit('checkLogin', nickname);

      // To avoid calling either callback more than once, we'll keep track when we call it.
      var eitherCallbackCalled = false;
      
      socket.on('loginSuccessful', function() {
        if (!eitherCallbackCalled) {
          success();
          eitherCallbackCalled = true;
        }
      });
      socket.on('loginUnsuccessful', function() {
        if (!eitherCallbackCalled) {
          fail();
          eitherCallbackCalled = true;
        }
      });
  };

  return login;
});