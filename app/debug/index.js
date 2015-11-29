var $ = require('jquery');
var AutoLinker = require('autolinker');

module.exports = {

  template: require('./template.html'),

  data: {
    orientation: undefined,
    debugWidth: undefined
  },

  methods: {

    startDrag: function(e) {
      if ($('body').hasClass('horizontal')) {
        this.horizonatlDrag(e);
      } else {
        this.verticalDrag(e);
      }
    },

    horizonatlDrag: function(e) {
      var container = $('#debug-container');
      var startY = e.clientY;
      var startHeight = container.height();
      var self = this;
      $(document).on('mousemove', function(e) {
        container.css({
          height: startHeight - (e.clientY - startY)
        });
        self.debugWidth = startHeight - (e.clientY - startY);
        ace.resize();
      }).on('mouseup', function(e) {
        $(document).off('mouseup').off('mousemove');
      });
    },

    verticalDrag: function(e) {
      var container = $('#debug-container');
      var startX = e.clientX;
      var startWidth = container.width();
      var self = this;
      $(document).on('mousemove', function(e) {
        container.css({
          width: startWidth - (e.clientX - startX)
        });
        self.debugWidth = startWidth - (e.clientX - startX)
        ace.resize();
      }).on('mouseup', function(e) {
        $(document).off('mouseup').off('mousemove');
      });
    },

    checkSize: function(value) {
      if (this.orientation != value.consoleOrientation) {
        this.orientation = value.consoleOrientation;
        var container = $('#debug-container');
        if (this.orientation === 'vertical') {
          container.css({
            width: this.debugWidth.toString() + "px",
            height: 'auto'
          });

        } else {
          container.css({
            width: 'auto',
            height: this.debugWidth > $('#editor-container').height() ? "100px" : this.debugWidth.toString() + "px"
          });
        }
      }
    },

    debugOut: function(data) {
      var msg = data.msg;
      var style = data.style;
      var line = data.num;
      var type = data.type;
      if (typeof msg === 'object') msg = JSON.stringify(msg);
      else msg = '' + msg;
      if (msg === 'Uncaught ReferenceError: require is not defined') return false;
      if (style) {
        msg = msg.replace(/%c/g, '');
        msg = msg.replace('[', '');
        msg = msg.replace(']', '');
      }
      msg = AutoLinker.link(msg);
      // console.log(data);
      $('#debug').append('<div class="'+type+'" style="'+(style ? style : '')+'">' + (line ? line + ': ' : '') + msg + '</div>');
      $('#debug').scrollTop($('#debug')[0].scrollHeight);
    }
  },

  ready: function() {
    this.orientation = this.$root.settings.consoleOrientation;
    this.$on('settings-changed', this.checkSize);
    var container = $('#debug-container');
    this.debugWidth = container.width();
    var self = this;

    window.addEventListener('message', function(event) {
      var data = JSON.parse(event.data);
      if (data.console) {
        self.debugOut(data.console);
      }
    }, false);
  }

};
