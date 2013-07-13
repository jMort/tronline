var EPSILON = 0.0000001;

define(function(require) {
  var mathFunctions = require('../../public/js/mathFunctions');

  describe('mathFunctions', function() {

    it('should sum a list of numbers', function() {
      expect(mathFunctions.sum([1, 2, 3, 4, 5])).toBe(15);
      expect(mathFunctions.sum([0, -1, 5, -6, 10])).toBe(8);
      expect(mathFunctions.sum([])).toBe(0);
      expect(mathFunctions.sum([0])).toBe(0);
      expect(mathFunctions.sum([5])).toBe(5);
      expect(mathFunctions.sum([-3])).toBe(-3);
    });

    it('should average a list of numbers', function() {
      expect(mathFunctions.average([1, 2, 3, 4, 5])).toBe(3);
      expect(mathFunctions.average([0, -1, 5, -6, 10])).toBe(1.6);
      expect(mathFunctions.average([])).toBeNaN();
      expect(mathFunctions.average([0])).toBe(0);
      expect(mathFunctions.average([5])).toBe(5);
      expect(mathFunctions.average([-3])).toBe(-3);
    });

    it('should calculate the median of a list of numbers', function() {
      expect(mathFunctions.median([1, 2, 3, 4, 5])).toBe(3);
      expect(mathFunctions.median([0, -1, 5, -6, 10])).toBe(0);
      expect(mathFunctions.median([1, 2, 3, 4])).toBe(2.5);
      expect(mathFunctions.median([6, 6, 6, 6])).toBe(6);
    });

    it('should calculate the variance of a list of numbers', function() {
      expect(mathFunctions.variance([1, 2, 3, 4, 5])).toEqual([4, 1, 0, 1, 4]);
      var arr = mathFunctions.variance([0, -1, 5, -6, 10]);
      expect(arr.length).toBe(5);
      expect(Math.abs(arr[0]-2.56)).toBeLessThan(EPSILON);
      expect(Math.abs(arr[1]-6.76)).toBeLessThan(EPSILON);
      expect(Math.abs(arr[2]-11.56)).toBeLessThan(EPSILON);
      expect(Math.abs(arr[3]-57.76)).toBeLessThan(EPSILON);
      expect(Math.abs(arr[4]-70.56)).toBeLessThan(EPSILON);
    });

    it('should calculate the standard deviation of a list of numbers', function() {
      expect(mathFunctions.standardDeviation([1, 2, 3, 4, 5])).toBe(Math.sqrt(2));
      var sd = mathFunctions.standardDeviation([0, -1, 5, -6, 10]);
      expect(Math.abs(sd-Math.sqrt(29.84))).toBeLessThan(EPSILON);
    });

    it('should filter out numbers more than X standard deviations away from the median of a list', function() {
      var arr = mathFunctions.filterNumbersXStandardDeviationsAwayFromMedian([1, 2, 3, 4, 5], 1);
      expect(arr).toEqual([2, 3, 4]);
      arr = mathFunctions.filterNumbersXStandardDeviationsAwayFromMedian([1, 2, 3, 4, 5], 2);
      expect(arr).toEqual([1, 2, 3, 4, 5]);
      arr = mathFunctions.filterNumbersXStandardDeviationsAwayFromMedian([0, -1, 5, -6, 10], 1);
      expect(arr).toEqual([0, -1, 5]);
      arr = mathFunctions.filterNumbersXStandardDeviationsAwayFromMedian([0, -1, 5, -6, 10], 2);
      expect(arr).toEqual([0, -1, 5, -6, 10]);
    });
  });
});