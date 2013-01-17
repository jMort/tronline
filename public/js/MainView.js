define(function(require) {
  var $           = require('jquery'),
      _           = require('underscore'),
      Backbone    = require('backbone'),
      eventBus    = require('eventBus'),
      LoginView   = require('login/LoginView'),
      SidebarView = require('home/SidebarView'),
      ChatView    = require('home/ChatView'),
      io          = require('/socket.io/socket.io.js');

  var MainView = Backbone.View.extend({
    initialize: function() {
      this.socket = io.connect('http://localhost');
      this.socket.on('connect', function() {
        console.log('Socket connected');
      });
      this.render();
      this.showLogin();
      var self = this;
      eventBus.on('showLogin', function() {
        self.loginView.destroy();
        self.$el.html('');
        self.appendTitle();
        self.showLogin();
      });
      eventBus.on('showLobby', function(data) {
        var nickname = data.nickname;
        self.loginView.destroy();
        self.$el.html('');
        self.showLobby();
        self.appendTitle();
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
    showLobby: function() {
      this.$el.append('<div class="sidebarView"></div>');
      this.$el.append('<div class="homeView"></div>');
      this.$el.append('<div class="chatView"></div>');
      var sidebarView = new SidebarView({ el: this.$('.sidebarView'), socket: this.socket });
      var chatViw = new ChatView({ el: this.$('.chatView'), socket: this.socket });
    }
  });

  return MainView;
});