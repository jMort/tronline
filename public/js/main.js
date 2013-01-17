require.config({
  paths: {
    'jquery': '/js/libs/jquery-1.8.3.min',
    'slide.jquery': '/js/util/slide.jquery',
    'wiggle.jquery': '/js/util/wiggle.jquery',
    'underscore': '/js/libs/underscore-1.4.3.min',
    'backbone': '/js/libs/backbone-0.9.9.min',
    'text': '/js/libs/requirejs-2.1.2/text'
  },
  shim: {
    'underscore': {
      exports: '_'
    },
    'jquery': {
      exports: '$'
    },
    'slide.jquery': {
      deps: ['jquery']
    },
    'wiggle.jquery': {
      deps: ['jquery']
    },
    'backbone': {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    }
  }
});

require(['app'], function(app) {
  app.initialize();
});