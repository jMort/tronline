define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      eventBus = require('eventBus'),
      template = require('text!create/multiplayerSetup.html');

  var MultiplayerSetupView = Backbone.View.extend({
    events: {

    },
    initialize: function(options) {
      this.socket = options.socket;
      this.nickname = options.nickname;
      this.render();
    },
    render: function() {
      this.$el.hide().html(_.template(template)()).fadeIn(500);
    }
  });

  return MultiplayerSetupView;
});