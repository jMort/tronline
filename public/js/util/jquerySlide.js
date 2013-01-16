(function($){
  $.fn.slideLeft = function(duration, callback) {
    return this.each(function() {
      var left = $(this).position().left;
      $(this).animate({
        'opacity': 0,
        'margin-left': left-($(this).width()*2)
      }, duration, callback);
    });
  };
})(jQuery);

(function($){
  $.fn.slideRight = function(duration, callback) {
    var right = $(window).width()-$(this).position().left-$(this).width();
    return this.each(function() {
      $(this).animate({
        'opacity': 0,
        'margin-left': right+($(this).width()*2)
      }, duration, callback);
    });
  };
})(jQuery);