require.config({
  paths: {
    jquery: '/js/libs/jquery-1.8.3.min',
    underscore: '/js/libs/underscore-1.4.3.min',
    backbone: '/js/libs/backbone-0.9.9.min',
    text: '/js/libs/requirejs-2.1.2/text'
  },
  shim: {
    underscore: {
      exports: '_'
    },
    jquery: {
      exports: '$'
    },
    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    }
  }
});

require(['app'], function(app) {
  app.initialize();
});