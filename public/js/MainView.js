define(function(require) {
  var $         = require('jquery'),
      _         = require('underscore'),
      Backbone  = require('backbone'),
      LoginView = require('login/LoginView');

  var MainView = Backbone.View.extend({
    initialize: function() {
      this.$el = $('.mainView');
      this.$el.html('<h1>Tronline</h1>');
      this.$el.append('<div class="loginView"></div>');
      var loginView = new LoginView({ el: this.$('.loginView') });
    }
  });

  return MainView;
});