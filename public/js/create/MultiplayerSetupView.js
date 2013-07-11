define(function(require) {
  var $          = require('jquery'),
      _          = require('underscore'),
      Backbone   = require('backbone'),
      eventBus   = require('eventBus'),
      Player     = require('game/Player'),
      template   = require('text!create/multiplayerSetup.html'),
      playerTmpl = require('text!create/player.html');

  var MultiplayerSetupView = Backbone.View.extend({
    events: {
      'change td#difficulty select': 'changeDifficulty',
      'click table#colorSelection span': 'clickColor',
      'click button[name="createGame"]': 'clickStart'
    },
    initialize: function(options) {
      this.socket = options.socket;
      this.hostNickname = options.hostNickname;
      this.isHost = options.isHost;
      this.difficulty = 'Easy';
      if (options.isHost)
        this.socket.emit('createMultiplayer');
      else
        this.socket.emit('getPlayersInGameUpdate', this.hostNickname);
      var self = this;
      this.socket.on('playersInGameUpdate', function(players) {
        self.difficulty = players.difficulty;
        if (!self.isHost)
          self.$('td#difficulty span').text(self.difficulty);
        self.$('#numPlayersInGame').html((players.accepted.length+1) + '/16');
        
        // Create Player object of host
        players.host = Player.createNewFromObject(players.host);

        var host = $(_.template(playerTmpl)({ name: players.host.nickname,
                                              color: players.host.getColor() })).addClass('textGlow');
        self.$('#playersInGameList').html(host);
        for (var i in players.accepted) {
          // Create Player object of player
          players.accepted[i] = Player.createNewFromObject(players.accepted[i]);
          var player = $(_.template(playerTmpl)({ name: players.accepted[i].nickname,
                                                  color: players.accepted[i].getColor() })).addClass('textGlowGreen');
          self.$('#playersInGameList').append(player);
        }
        for (var i in players.pending) {
          // We don't need to create a Player object of player here as we only do it accepted ones
          var player = $(_.template(playerTmpl)({ name: players.pending[i].nickname,
                                                  color: '' })).addClass('textGlowOrange');
          self.$('#playersInGameList').append(player);
        }
        for (var i in players.declined) {
          // We don't need to create a Player object of player here as we only do it accepted ones
          var player = $(_.template(playerTmpl)({ name: players.declined[i].nickname,
                                                  color: '' })).addClass('textGlowRed');
          self.$('#playersInGameList').append(player);
        }
      });
      this.socket.on('gameCancelled', function(hostNickname) {
        Backbone.history.navigate('/home', { replace: true });
        eventBus.trigger('showLobby');
      });
      this.socket.on('gameStarting', function() {
        Backbone.history.navigate('/home/play/multiplayer', { replace: true });
        eventBus.trigger('playMultiplayer', self.hostNickname);
      });
      this.render();
    },
    render: function() {
      this.$el.hide().html(_.template(template)({ isHost: this.isHost, difficulty: this.difficulty })).fadeIn(500);
    },
    changeDifficulty: function() {
      this.socket.emit('changeDifficulty', this.$('td#difficulty select').val());
    },
    clickColor: function(e) {
      // Taken from http://stackoverflow.com/questions/1740700/how-to-get-hex-color-value-rather-than-rgb-value
      var rgbToHex = function(rgb) {
        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        function hex(x) {
          return ('0' + parseInt(x).toString(16)).slice(-2);
        }
        return ('#' + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3])).toUpperCase();
      };
      var color = rgbToHex($(e.currentTarget).css('background-color'));
      this.socket.emit('changeColor', this.hostNickname, color);
    },
    clickStart: function() {
      this.socket.emit('startGame');
    }
  });

  return MultiplayerSetupView;
});