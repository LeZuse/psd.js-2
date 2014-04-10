// Generated by CoffeeScript 1.6.1
(function() {
  var PSDBlackWhite, PSDDescriptor, Parser, assert;

  PSDDescriptor = require('../psddescriptor');

  Parser = require('../parser');

  assert = require('../psdassert');

  PSDBlackWhite = (function() {

    function PSDBlackWhite(layer, length) {
      this.layer = layer;
      this.length = length;
      this.file = this.layer.file;
    }

    PSDBlackWhite.prototype.parse = function() {
      var version;
      version = this.file.readInt();
      assert(version === 16);
      return (new PSDDescriptor(this.file)).parse();
    };

    return PSDBlackWhite;

  })();

  module.exports = PSDBlackWhite;

}).call(this);