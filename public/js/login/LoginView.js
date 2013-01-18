define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      eventBus = require('eventBus'),
      template = require('text!login/login.html');

  require('slide.jquery');
  require('wiggle.jquery');

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
      this.$('div.loginBox input[name="name"]').focus();
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
      this.socket.emit('checkLogin', nickname);
      var self = this;
      this.socket.on('loginSuccessful', function() {
        self.$('div.loginBox').removeClass('glowBlue').addClass('glowGreen');
        self.$('div.loginBox input[name="name"]').addClass('green');
        setTimeout(function() {
          Backbone.history.navigate('/home', { replace: true });
          self.$el.slideLeft(500, function() {
            eventBus.trigger('showLobby', { nickname: nickname });
          });
          $('h1').animate({
            'margin-right': '220px'
          }, 600);
        }, 400);
      });
      this.socket.on('loginUnsuccessful', function() {
        self.$('div.loginBox').removeClass('glowBlue').addClass('glowRed');
        self.$('div.loginBox input[name="name"]').addClass('red');
        if (!(self.$('div.loginBox').wiggle('isWiggling')))
          self.$('div.loginBox').wiggle('start', { delay: 15, limit: 3 });
      });
    },

    fixDisplayIssue: function() {
      /* When div.numPlayersOnline is updated a light background shows up
         on the div so this is just a little hack to get the loginBox glow
         to refresh itself and render over the top */ 
      this.$('div.loginBox').addClass('glowBlue-alt').removeClass('glowBlue');
      setTimeout(function() {
        this.$('div.loginBox').addClass('glowBlue').removeClass('glowBlue-alt');
      }, 0);
    }
  });

  return LoginView;
});