define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      eventBus = require('eventBus'),
      template = require('text!home/chat.html');

  var ChatView = Backbone.View.extend({
    initialize: function(options) {
      this.socket = options.socket;
      this.render();
    },
    render: function() {
      this.$el.hide().html(_.template(template)()).fadeIn(500);
    }
  });

  return ChatView;
});