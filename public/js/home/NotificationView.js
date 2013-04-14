define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      eventBus = require('eventBus'),
      template = require('text!home/notification.html');

  var NotificationView = Backbone.View.extend({
    events: {
      'click button.green': 'clickAccept',
      'click button.red': 'clickDecline'
    },
    initialize: function(options) {
      this.socket = options.socket;
      this.nickname = options.nickname;
      this.render();
    },
    render: function() {
      this.$el.hide().html(_.template(template)({ nickname: this.nickname })).fadeIn(500);
      this.$el.add(this.$('div')).animate({
        'bottom': 0
      }, 500);
    },
    clickAccept: function() {
      eventBus.trigger('acceptInvite', this.nickname);
      this.slideDown();
    },
    clickDecline: function() {
      eventBus.trigger('declineInvite', this.nickname);
      this.slideDown();
    },
    slideDown: function() {
      this.$el.add(this.$('div')).animate({
        'bottom': -175
      }, 500);
    }
  });

  return NotificationView;
});