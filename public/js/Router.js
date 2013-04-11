define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      eventBus = require('eventBus');

  var Router = Backbone.Router.extend({
    routes: {
      'home': 'home',
      'home/create/multiplayer': 'multiplayerSetup',

      '*action': 'defaultAction'
    },
    home: function() {
      eventBus.trigger('showLobby');
    },
    multiplayerSetup: function() {
      eventBus.trigger('createMultiplayer');
    },
    defaultAction: function(action) {
      Backbone.history.navigate('/');
      eventBus.trigger('showLogin');
    }
  });

  return Router;
});