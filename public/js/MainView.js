define(function(require) {
  var $           = require('jquery'),
      _           = require('underscore'),
      Backbone    = require('backbone'),
      eventBus    = require('eventBus'),
      LoginView   = require('login/LoginView'),
      HomeView    = require('home/HomeView'),
      SidebarView = require('home/SidebarView'),
      ChatView    = require('home/ChatView'),
      GameView    = require('game/GameView');

  var baseURL;
  var MainView = Backbone.View.extend({
    initialize: function() {
      baseURL = (function() {
        var PRODUCTION = 'http://www.tronline.me';
        var DEVELOPMENT = 'http://localhost';
        if (window && window.location && window.location.href) {
          var href = window.location.href;
          if (href.lastIndexOf('/') === href.length-1)
            href = href.substring(0, href.length-1);
          if (href == DEVELOPMENT)
            return DEVELOPMENT;
          else
            return PRODUCTION;
        }
        return PRODUCTION;
      })();

      var self = this;
      $.getScript('/socket.io/socket.io.js', function() {
        self.onSocketIOLoaded(io);
      });
    },
    onSocketIOLoaded: function(io) {
      this.socket = io.connect(baseURL);
      this.socket.on('connect', function() {
        console.log('Socket connected');
      });
      this.render();
      this.showLogin();
      this.nickname = null;
      var self = this;
      eventBus.on('showLogin', function() {
        self.loginView.destroy();
        self.$el.html('');
        self.appendTitle();
        self.showLogin();
      });
      eventBus.on('showLobby', function(data) {
        var nickname = data.nickname;
        self.nickname = nickname;
        self.loginView.destroy();
        self.showLobby(nickname);
      });
      eventBus.on('playSinglePlayer', function() {
        self.homeView.destroy();
        self.sidebarView.destroy();
        self.chatView.destroy();
        self.showSinglePlayer();
      });
      eventBus.on('playHeadToHead', function() {
        self.homeView.destroy();
        self.sidebarView.destroy();
        self.chatView.destroy();
        self.showHeadToHead();
      });
    },
    render: function() {
      this.$el = $('.mainView');
      this.appendTitle();
    },
    appendTitle: function() {
      this.$el.append('<h1>Tronline</h1>');
    },
    showLogin: function() {
      this.$el.append('<div class="loginView"></div>');
      var loginView = new LoginView({ el: this.$('.loginView'), socket: this.socket });
      this.loginView = loginView;
    },
    showLobby: function(nickname) {
      this.$el.append('<div class="sidebarView"></div>');
      this.$el.append('<div class="homeView"></div>');
      this.$el.append('<div class="chatView"></div>');
      var homeView = new HomeView({ el: this.$('.homeView'), socket: this.socket,
                                    nickname: nickname });
      var sidebarView = new SidebarView({ el: this.$('.sidebarView'), socket: this.socket,
                                          nickname: nickname });
      var chatView = new ChatView({ el: this.$('.chatView'), socket: this.socket,
                                   nickname: nickname });
      this.homeView = homeView;
      this.sidebarView = sidebarView;
      this.chatView = chatView;
    },
    showSinglePlayer: function() {
      this.$el.html('');
      this.$el.append('<div class="gameView"></div>');
      var gameView = new GameView({ el: this.$('.gameView') });
      this.gameView = gameView;
    },
    showHeadToHead: function() {
      this.$el.html('');
      this.$el.append('<div class="gameView"></div>');
      var gameView = new GameView({ el: this.$('.gameView'), headToHead: true });
      this.gameView = gameView;
    }
  });

  return MainView;
});