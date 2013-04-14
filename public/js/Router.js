define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      eventBus = require('eventBus');

  var initialized = false;
  var Router = Backbone.Router.extend({
    routes: {
      'home': 'home',
      'home/create/multiplayer': 'multiplayerSetup',

      '*action': 'defaultAction'
    },
    home: function() {
      if (initialized)
        eventBus.trigger('showLobby');
      else
        this.defaultAction();
    },
    multiplayerSetup: function() {
      if (initialized)
        eventBus.trigger('createMultiplayer');
      else
        this.defaultAction();
    },
    defaultAction: function(action) {
      initialized = true;
      Backbone.history.navigate('/');
      eventBus.trigger('showLogin');
    }
  });

  return Router;
});