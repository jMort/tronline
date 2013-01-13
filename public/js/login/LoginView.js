define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      eventBus = require('eventBus'),
      template = require('text!login/login.html');

  var LoginView = Backbone.View.extend({
    events: {
      'click div.loginBox button[name="enter"]' : 'enter',
      'keypress div.loginBox input[name="name"]': 'onKeypress' 
    },
    initialize: function(options) {
      this.socket = options.socket;
      var self = this;
      this.socket.on('numPlayersOnline', function(numPlayers) {
        if (self.$('div.numPlayersOnline').length)
          self.updateNumPlayersOnline(numPlayers);
      });
      this.render();
    },
    render: function() {
      this.$el.html(_.template(template)());
    },
    updateNumPlayersOnline: function(numPlayers) {
      var message = 'There is currently one player online';
      if (numPlayers == 0)
        message = 'There are currently no players online';
      else if (numPlayers > 1)
        message = 'There are currently ' + numPlayers + ' players online';
      this.$('div.numPlayersOnline p').html(message);
    },
    onKeypress: function(e) {
      if (e.keyCode == 13)
        this.enter();
    },
    enter: function() {
      eventBus.trigger('login', { nickname: this.$('div.loginBox input[name="name"]').val() });
    }
  });

  return LoginView;
});