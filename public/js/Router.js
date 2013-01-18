define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      eventBus = require('eventBus');

  var Router = Backbone.Router.extend({
    routes: {
      //'home': 'home',

      '*action': 'defaultAction'
    },
    /*home: function() {
      eventBus.trigger('showLobby');
    },*/
    defaultAction: function(action) {
      Backbone.history.navigate('/');
      eventBus.trigger('showLogin');
    }
  });

  return Router;
});