(function() {

  var original = window.console;
  window.console = {};

  ["log", "warn", "error"].forEach(function(func) {
    window.console[func] = function(msg) {
      var style = null;
      if (arguments[2] && arguments[0].indexOf('%c') > -1) {
        style = arguments[1];
      }
      var data = {
        msg: msg,
        style: style,
        type: func
      };

      window.opener.postMessage(JSON.stringify({ console: data}), 'file://');

      original[func].apply(original, arguments);
    };
  });


  window.onerror = function(msg, url, num, column, errorObj) {
    var data = {
      num: num,
      msg: msg,
      type: 'error'
    };

    window.opener.postMessage(JSON.stringify({ console: data}), 'file://');

    return false;
  };

})();

