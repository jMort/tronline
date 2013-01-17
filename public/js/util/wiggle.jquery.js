(function($){
  $.fn.wiggle = function(method, options) {
    options = $.extend({
      wiggleDegrees: ['2','4','2','0','-2','-4','-2','0'],
      delay: 35,
      limit: null,
      randomStart: true,
      onWiggle: function(object) {},
      onWiggleStart: function(object) {},
      onWiggleStop: function(object) {}
    }, options);

    var methods = {
      wiggle: function(object, step){
        if(step === undefined) {
          step = options.randomStart ? Math.floor(Math.random()*options.wiggleDegrees.length) : 0;
        }

        if(!$(object).hasClass('wiggling')) {
          $(object).addClass('wiggling');
        }

        var degree = options.wiggleDegrees[step];
        $(object).css({
          '-webkit-transform': 'rotate('+degree+'deg)',
          '-moz-transform': 'rotate('+degree+'deg)',
          '-o-transform': 'rotate('+degree+'deg)',
          '-sand-transform': 'rotate('+degree+'deg)',
          '-ms-transform': 'rotate('+degree+'deg)',
          'transform': 'rotate('+degree+'deg)'
        });

        if(step == (options.wiggleDegrees.length - 1)) {
          step = 0;
          if($(object).data('wiggles') === undefined) {
            $(object).data('wiggles', 1);
          } else {
            $(object).data('wiggles', $(object).data('wiggles') + 1);
          }
          options.onWiggle(object);
        }

        if(options.limit && $(object).data('wiggles') == options.limit) {
          return methods.stop(object);
        }

        object.timeout = setTimeout(function(){
          methods.wiggle(object, step+1);
        }, options.delay);
      },
      stop: function(object) {
        $(object).data('wiggles', 0);
        $(object).css({
          '-webkit-transform': 'rotate(0deg)',
          '-moz-transform': 'rotate(0deg)',
          '-o-transform': 'rotate(0deg)',
          '-sand-transform': 'rotate(0deg)',
          '-ms-transform': 'rotate(0deg)',
          'transform': 'rotate(0deg)'
        });

        if($(object).hasClass('wiggling')) {
          $(object).removeClass('wiggling');
        }

        clearTimeout(object.timeout);

        object.timeout = null;

        options.onWiggleStop(object);
      },
      isWiggling: function(object) {
        return !object.timeout ? false : true;
      }
    };

    if(method == 'isWiggling' && this.length == 1) {
      return methods.isWiggling(this[0]);
    }

    this.each(function() {
      if((method == 'start' || method === undefined) && !this.timeout) {
        methods.wiggle(this);
        options.onWiggleStart(this);
      } else if (method == 'stop') {
        methods.stop(this);
      }
    });

    return this;
  }
})(jQuery);