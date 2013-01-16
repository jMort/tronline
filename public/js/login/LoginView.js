define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      eventBus = require('eventBus'),
      template = require('text!login/login.html');

  require('/js/util/jquerySlide.js');

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
      this.fixDisplayIssue();
    },
    onKeypress: function(e) {
      if (e.keyCode == 13)
        this.enter();
    },
    enter: function() {
      var nickname = this.$('div.loginBox input[name="name"]').val().toUpperCase();
      eventBus.trigger('login', { nickname: nickname });
      var self = this;
      this.$el.slideLeft(500, function() {
        self.destroy();
      });
    },

    fixDisplayIssue: function() {
      /* When div.numPlayersOnline is updated a light background shows up
         on the div so this is just a little hack to get the loginBox glow
         to refresh itself and render over the top */ 
      this.$('div.loginBox').addClass('glow-alt').removeClass('glow');
      setTimeout(function() {
        this.$('div.loginBox').addClass('glow').removeClass('glow-alt');
      }, 0);
    }
  });

  return LoginView;
});