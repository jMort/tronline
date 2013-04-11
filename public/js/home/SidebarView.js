define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      eventBus = require('eventBus'),
      template = require('text!home/sidebar.html');

  var SidebarView = Backbone.View.extend({
    events: {
      'click tbody#playersOnline tr td h3': 'clickPlayer'
    },
    initialize: function(options) {
      this.socket = options.socket;
      var self = this;
      this.socket.on('inviteAccepted', function(nickname) {
        self.$('tbody#playersOnline tr td h3:contains("'+nickname+'")').css('color', 'rgb(114,255,79)');
      });
      var playerTmpl = '<tr><td><h3 class="textGlow" style="margin: 0;"><%= name %></h3></td></tr>';
      this.socket.emit('getPlayerList');
      this.socket.on('playerListUpdate', function(players) {
        self.$('#playersOnline').html('');
        for (var i in players)
          self.$('#playersOnline').append(_.template(playerTmpl)({ name: players[i] }));
      });
      this.render();
    },
    render: function() {
      this.$el.hide().html(_.template(template)()).fadeIn(500);
    },
    clickPlayer: function(e) {
      eventBus.trigger('invitePlayer', $(e.currentTarget));
    }
  });

  return SidebarView;
});