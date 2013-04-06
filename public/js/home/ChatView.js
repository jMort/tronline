define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      eventBus = require('eventBus'),
      template = require('text!home/chat.html');

  var ChatView = Backbone.View.extend({
    events: {
      'click button[name="send"]' : 'sendMessage',
      'keypress input[name="message"]': 'onKeypress'
    },
    initialize: function(options) {
      this.socket = options.socket;
      var self = this;
      this.socket.on('receiveMessage', function(message) {
        self.$('#messages').append(message+'<br/>');
      });
      this.render();
    },
    render: function() {
      this.$el.hide().html(_.template(template)()).fadeIn(500);
    },
    onKeypress: function(e) {
      if (e.keyCode == 13)
        this.sendMessage();
    },
    sendMessage: function() {
      this.socket.emit('sendMessage', this.$('input[name="message"]').val());
      this.$('input[name="message"]').val('');
    }
  });

  return ChatView;
});