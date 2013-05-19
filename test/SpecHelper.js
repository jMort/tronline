beforeEach(function() {
  this.addMatchers({
    toBeTypeOf: function(expected) {
      var actual, notText, objType;
 
      actual = this.actual;
      notText = this.isNot ? 'not ' : '';
      objType = actual ? Object.prototype.toString.call(actual) : '';
     
      this.message = function() {
        return 'Expected ' + actual + notText + ' to be of type "' + expected + '"';
      }
     
      return objType.toLowerCase() === '[object ' + expected.toLowerCase() + ']';
    }
  });
});
