define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      eventBus = require('eventBus'),
      template = require('text!game/gameOver.html');

  var GameOverView = Backbone.View.extend({
    events: {
      'click button[name="continue"]': 'clickContinue',
    },
    initialize: function(options) {
      this.results = options.results;
      var self = this;
      $(window).bind('keydown', function(e) {
        if (e.keyCode == 13)
          self.clickContinue();
      });
      this.render();
    },
    render: function() {
      this.$el.hide().html(_.template(template)({ results: this.results })).fadeIn(500);
      var width  = this.$('div.gameOverContainer').width();
      var height = this.$('div.gameOverContainer').height();
      this.$('div.gameOverContainer').css('margin-left', -width/2 - 5);
      this.$('div.gameOverContainer').css('margin-top', -height/2 - 5);
    },
    clickContinue: function() {
      Backbone.history.navigate('/home', { replace: true });
      eventBus.trigger('showLobby');
    }
  });

  return GameOverView;
});