// Generated by CoffeeScript 1.6.1
(function() {
  var PSD, base, fs, outputFolder, psd;

  fs = require('fs');

  PSD = require(__dirname + '/../lib/psd.js').PSD;

  PSD.DEBUG = true;

  if (process.argv.length === 2) {
    console.log("Please specify an input file");
    process.exit();
  }

  psd = PSD.fromFile(process.argv[2]);

  console.log("Parsing PSD...");

  psd.parse();

  console.log("Parsing finished!\n");

  console.log("PSD Groups\n=======================");

  base = psd.getLayerStructure();

  outputFolder = function(folder, prefix) {
    var layer, _i, _len, _ref, _results;
    if (prefix == null) {
      prefix = [];
    }
    if (folder.name) {
      console.log(prefix.join("") + folder.name);
    }
    _ref = folder.layers;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      layer = _ref[_i];
      console.log(prefix.join("") + layer.name);
      if (layer.layers != null) {
        prefix.push("->  ");
        outputFolder(layer, prefix);
        _results.push(prefix.pop());
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  outputFolder(base);

}).call(this);