({ define: typeof define === 'function'
            ? define
            : function (f) {
              module.exports = exports = f(function(file) {
                // This imitates the 'require' function for node js
                return require('../'+file);
              });
            }}).
define(function(require) {
  var mathFunctions = {
    sum: function(arr) {
      var sum = 0;
      for (var i in arr)
        sum += arr[i];
      return sum;
    },
    average: function(arr) {
      return this.sum(arr) / arr.length;
    },
    median: function(arr) {
      // concat will effectively clone the array so that it won't modify the original array
      var newArr = arr.concat().sort();
      var index1 = parseInt((newArr.length - 1)/2);
      var index2 = index1 + (newArr.length - 1)%2;
      return (newArr[index1] + newArr[index2])/2;
    },
    variance: function(arr) {
      var variance = [];
      var average = this.average(arr);
      for (var i in arr)
        variance.push(Math.pow(arr[i] - average, 2));
      return variance;
    },
    standardDeviation: function(arr) {
      return Math.sqrt(this.average(this.variance(arr)));
    },
    filterNumbersXStandardDeviationsAwayFromMedian: function(arr, standardDeviations) {
      var filteredArr = [];
      var median = this.median(arr);
      var num = this.standardDeviation(arr) * standardDeviations;
      for (var i in arr) {
        if (arr[i] >= median-num && arr[i] <= median+num)
          filteredArr.push(arr[i]);
      }
      return filteredArr;
    }
  };

  return mathFunctions;
});