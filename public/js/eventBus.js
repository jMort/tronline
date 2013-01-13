define(function(require) {
  var _        = require('underscore'),
      Backbone = require('backbone');

  var eventBus = _.extend({}, Backbone.Events);

  return eventBus;
});