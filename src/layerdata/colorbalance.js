// Generated by CoffeeScript 1.6.1
(function() {
  var PSDColorBalance;

  PSDColorBalance = (function() {

    function PSDColorBalance(layer, length) {
      this.layer = layer;
      this.length = length;
      this.file = this.layer.file;
      this.data = {
        cyanRed: [],
        magentaGreen: [],
        yellowBlue: []
      };
    }

    PSDColorBalance.prototype.parse = function() {
      var i, _i;
      for (i = _i = 0; _i < 3; i = ++_i) {
        this.data.cyanRed.push(this.file.readShortInt());
        this.data.magentaGreen.push(this.file.readShortInt());
        this.data.yellowBlue.push(this.file.readShortInt());
      }
      return this.data;
    };

    return PSDColorBalance;

  })();

  module.exports = PSDColorBalance;

}).call(this);