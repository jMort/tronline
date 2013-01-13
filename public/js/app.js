define(function(require) {
  var $        = require('jquery'),
      _        = require('underscore'),
      Backbone = require('backbone'),
      MainView = require('MainView');

  var initialize = function() {
    console.log('initializing application');
    new MainView();
  };

  return {
    initialize: initialize
  };
});