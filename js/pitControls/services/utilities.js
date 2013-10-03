// Load a configuration through a service, to allow other parts of the
// app to wait for the config to be loaded
pitServices.factory('utilities', function(){

  var scrollBarWidth = 0;
  var calcScrollbarWidth = function(){
    if(scrollBarWidth != 0)
      return scrollBarWidth;

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

    scrollBarWidth = (w1 - w2);

    return scrollBarWidth;
  }

  // http://stackoverflow.com/questions/6913512/how-to-sort-an-array-of-objects-by-multiple-fields
  var sort_by;
  (function() {
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
    sort_by = function() {
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

  return {
    scrollbarWidth: function(){
      return calcScrollbarWidth();
    },
    sortBy: sort_by
  };
});