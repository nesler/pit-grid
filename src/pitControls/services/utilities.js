/**
 * @ngdoc method
 * @methodOf pitControls.service:utilities
 * @name scrollbarWidth
 * @description
 * Calculates the width of the browsers scroll bars
 * @return      {number} Width of scrollbar
 */
var scrollbarWidth = (function(){
  var calculatedWidth = 0;
  return function(){
    if(calculatedWidth != 0)
      return calculatedWidth;

    /* Taken from http://www.alexandre-gomes.com/?p=115 */
    var inner = document.createElement('p');
    inner.style.width = "100%";
    inner.style.height = "200px";

    var outer = document.createElement('div');
    outer.style.position = "absolute";
    outer.style.top = "0px";
    outer.style.left = "0px";
    outer.style.visibility = "hidden";
    outer.style.width = "200px";
    outer.style.height = "150px";
    outer.style.overflow = "hidden";
    outer.appendChild (inner);

    document.body.appendChild (outer);
    var w1 = inner.offsetWidth;
    outer.style.overflow = 'scroll';
    var w2 = inner.offsetWidth;
    if (w1 == w2) w2 = outer.clientWidth;

    document.body.removeChild (outer);

    calculatedWidth = (w1 - w2);

    return calculatedWidth;
  }
}());


/**
 * @ngdoc method
 * @methodOf pitControls.service:utilities
 * @name sortBy
 * @description
 * A generic method to sort by properties of objects in an array
 * http://stackoverflow.com/questions/6913512/how-to-sort-an-array-of-objects-by-multiple-fields
 *
 * Example usage:
 * <pre>
 *   var toSort = [
 *     {
 *       'Col1': 1,
 *       'Col2': 'z'
 *     },
 *     {
 *       'Col1': 2,
 *       'Col2': 'y'
 *     },
 *     {
 *       'Col1': 3,
 *       'Col2': 'x'
 *     }
 *   ];
 *
 *   toSort.sort(utilities.sortBy('Col1'));
 *   // --> original
 *   toSort.sort(utilities.sortBy({name: 'Col1', reverse: true}));
 *   // --> original reversed
 *   toSort.sort(utilities.sortBy({name: 'Col2'}));
 *   // --> original reversed
 *   toSort.sort(utilities.sortBy({name: 'Col1', reverse: true, primer: parseInt}));
 *   // --> original reversed with values parsed as int
 * </pre>
 * @param {string|object} a..z Takes an "unlimited" number of objects or strings for arguments
 *                             The strings contain the name of the property to sort by
 *                             The objects contain the sorting-info to apply to the array
 *                             The sort-order is the same as the order the arguments are applied
 *                             <pre>Object = {name: string[, reverse: boolean][, primer: function]}</pre>
 * @return      {array} The sorted array
 */
var sortBy = (function() {
  // utility functions
  var default_cmp = function(a, b) {
      if (a == b) return 0;
      return a < b ? -1 : 1;
    },
    getCmpFunc = function(primer, reverse) {
      var dfc = default_cmp, // closer in scope
          cmp = default_cmp;
      if (primer) {
        cmp = function(a, b) {
          return dfc(primer(a), primer(b));
        };
      }
      if (reverse) {
        return function(a, b) {
          return -1 * cmp(a, b);
        };
      }
      return cmp;
    };

  // actual implementation
  return function() {
    var fields = [],
        n_fields = arguments.length,
        field, name, reverse, cmp;

    // preprocess sorting options
    for (var i = 0; i < n_fields; i++) {
      field = arguments[i];
      if (typeof field === 'string') {
          name = field;
          cmp = default_cmp;
      }
      else {
          name = field.name;
          cmp = getCmpFunc(field.primer, field.reverse);
      }
      fields.push({
          name: name,
          cmp: cmp
      });
    }

    // final comparison function
    return function(A, B) {
      var a, b, name, result;
      for (var i = 0; i < n_fields; i++) {
        result = 0;
        field = fields[i];
        name = field.name;

        result = field.cmp(A[name], B[name]);
        if (result !== 0) break;
      }
      return result;
    }
  }
}());

// Load a configuration through a service, to allow other parts of the
// app to wait for the config to be loaded
/**
 * @ngdoc service
 * @name pitControls.service:utilities
 * @description
 * service containing utility functions used throughout pitControls directives
 */
pitServices.factory('utilities', function(){
  return {
    scrollbarWidth: function(){
      return scrollbarWidth();
    },
    sortBy: sortBy
  };
});