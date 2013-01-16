define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone');

  var Router = Backbone.Router.extend({
    routes: {
      'view/:id': 'view',

      '*action': 'defaultAction'
    },
    view: function(id) {
      alert(id);
    },
    defaultAction: function(action) {
      Backbone.history.navigate('/');
    }
  });

  return Router;
});