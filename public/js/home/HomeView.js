define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      eventBus = require('eventBus'),
      template = require('text!home/home.html');

  var HomeView = Backbone.View.extend({
    events: {
      'mouseover .imgButton': 'showButtonText',
      'mouseout  .imgButton': 'hideButtonText',
      'click .imgButton:nth-child(1)': 'clickSinglePlayer'
    },
    initialize: function(options) {
      this.socket = options.socket;
      this.nickname = options.nickname;
      this.render();
    },
    render: function() {
      this.$el.hide().html(_.template(template)({ nickname: this.nickname })).fadeIn(500);
      this.$('div.buttonContainer span').css('visibility', 'hidden');
    },
    showButtonText: function(event) {
      var buttonContainer = $(event.currentTarget.parentElement);
      $('span', buttonContainer).css('visibility', 'visible').hide().fadeIn(200);
    },
    hideButtonText: function(event) {
      var buttonContainer = $(event.currentTarget.parentElement);
      $('span', buttonContainer).fadeOut(200, function() {
        // After fading out, remove "display: none;" from style because this affects the layout
        $('span', buttonContainer).css('display', 'inline');
      }).css('visibility', 'hidden');
    },
    clickSinglePlayer: function() {
      Backbone.history.navigate('/home/play/single');
      eventBus.trigger('playSinglePlayer');
    }
  });

  return HomeView;
});