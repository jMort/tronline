define(function(require) {
  var $         = require('jquery'),
      _         = require('underscore'),
      Backbone  = require('backbone'),
      LoginView = require('login/LoginView'),
      io        = require('/socket.io/socket.io.js');

  var MainView = Backbone.View.extend({
    initialize: function() {
      this.socket = io.connect('http://localhost');
      this.socket.on('connect', function() {
        console.log('Socket connected');
      });
      this.render();
    },
    render: function() {
      this.$el = $('.mainView');
      this.$el.html('<h1>Tronline</h1>');
      this.$el.append('<div class="loginView"></div>');
      var loginView = new LoginView({ el: this.$('.loginView'), socket: this.socket });
    }
  });

  return MainView;
});