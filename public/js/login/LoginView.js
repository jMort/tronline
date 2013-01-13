define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      template = require('text!login/login.html');

  var MainView = Backbone.View.extend({
    initialize: function() {
      this.$el.html(_.template(template)());
    }
  });

  return MainView;
});