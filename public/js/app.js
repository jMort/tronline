define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      Router   = require('Router'),
      MainView = require('MainView');

  var initialize = function() {
    console.log('initializing application');
    var router = new Router();
    console.log('starting backbone history');
    Backbone.history.start({ pushState: true });
    new MainView();
  };

  return {
    initialize: initialize
  };
});