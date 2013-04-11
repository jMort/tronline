define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      Router   = require('Router'),
      MainView = require('MainView');

  var initialize = function() {
    console.log('initializing application');

    var router = new Router();
    Backbone.history.start({ pushState: true });

    Backbone.View.prototype.destroy = function() {
      this.remove();
      this.unbind();
    };

    window.onbeforeunload = function(){
      return 'All progress will be lost if you refresh the page.';
    }

    new MainView();
  };

  return {
    initialize: initialize
  };
});