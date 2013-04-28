define(function(require) {
  var $          = require('jquery'),
      _          = require('underscore'),
      Backbone   = require('backbone'),
      eventBus   = require('eventBus'),
      template   = require('text!create/multiplayerSetup.html'),
      playerTmpl = require('text!create/player.html');

  var MultiplayerSetupView = Backbone.View.extend({
    events: {
      'click table#colorSelection span': 'clickColor'
    },
    initialize: function(options) {
      this.socket = options.socket;
      this.hostNickname = options.hostNickname;
      if (options.isHost)
        this.socket.emit('createMultiplayer');
      else
        this.socket.emit('getPlayersInGameUpdate', this.hostNickname);
      var self = this;
      this.socket.on('playersInGameUpdate', function(players) {
        self.$('#numPlayersInGame').html((players.accepted.length+1) + '/16');
        var host = $(_.template(playerTmpl)({ name: players.host.nickname })).addClass('textGlow');
        self.$('#playersInGameList').html(host);
        for (var i in players.accepted) {
          var player = $(_.template(playerTmpl)({ name: players.accepted[i].nickname })).addClass('textGlowGreen');
          self.$('#playersInGameList').append(player);
        }
        for (var i in players.pending) {
          var player = $(_.template(playerTmpl)({ name: players.pending[i].nickname })).addClass('textGlowOrange');
          self.$('#playersInGameList').append(player);
        }
        for (var i in players.declined) {
          var player = $(_.template(playerTmpl)({ name: players.declined[i].nickname })).addClass('textGlowRed');
          self.$('#playersInGameList').append(player);
        }
      });
      this.render();
    },
    render: function() {
      this.$el.hide().html(_.template(template)()).fadeIn(500);
    },
    clickColor: function(e) {
      console.log($(e.currentTarget).attr('class'));
    }
  });

  return MultiplayerSetupView;
});