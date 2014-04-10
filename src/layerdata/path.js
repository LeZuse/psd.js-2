// Generated by CoffeeScript 1.6.1
(function() {
  var Log, PSDDescriptor, PSDPath, Parser, assert;

  PSDDescriptor = require('../psddescriptor');

  Parser = require('../parser');

  assert = require('../psdassert');

  Log = require('../log');

  PSDPath = (function() {

    function PSDPath(layer, length) {
      this.layer = layer;
      this.length = length;
      this.file = this.layer.file;
      this.size = this.layer.header.size;
      this.image_height = this.size.height;
      this.image_width = this.size.width;
    }

    PSDPath.prototype.parse = function() {
      var bounds, filler, flags, path, pathItem, pathItems, record, records, selector_type, shape, shape_key, shapes, shapes_hash, unique_shapes, version, _i, _j, _k, _len, _len1, _len2, _ref;
      pathItems = [];
      version = this.file.readInt();
      Log.debug("Photoshop version: " + version);
      flags = this.file.readInt();
      Log.debug("Flags: " + flags);
      records = parseInt((this.length - 8) / 26);
      record = 0;
      while (record < records) {
        selector_type = this.file.readShortInt();
        switch (selector_type) {
          case 0:
            Log.debug("Closed subpath length record");
            path = this.parse_subpath_record(this.file);
            Log.debug("Path had " + path.length + " points");
            record += path.length;
            Log.debug_path;
            pathItem = {
              closed: true,
              subPathItems: path
            };
            pathItems.push(pathItem);
            break;
          case 3:
            Log.debug("Open subpath length record");
            path = this.parse_subpath_record(this.file);
            Log.debug("Path had " + path.length + " points");
            record += path.length + 1;
            Log.debug(path);
            pathItem = {
              closed: false,
              subPathItems: path
            };
            pathItems.push(pathItem);
            break;
          case 6:
            Log.debug("Path fill rule record");
            filler = this.file.read(24);
            break;
          case 7:
            Log.debug("Clipboard record");
            filler = this.file.read(24);
            break;
          case 8:
            Log.debug("Initial fill record");
            filler = this.file.read(24);
        }
        record++;
      }
      shapes = [];
      for (_i = 0, _len = pathItems.length; _i < _len; _i++) {
        pathItem = pathItems[_i];
        shapes.push(Parser.parsePathItem(pathItem));
      }
      shapes_hash = {};
      if (shapes.length > 0) {
        for (_j = 0, _len1 = shapes.length; _j < _len1; _j++) {
          shape = shapes[_j];
          bounds = shape.bounds;
          shape_key = "" + bounds.top + "-" + bounds.bottom + "-" + bounds.left + "-" + bounds.right + "-" + shape.type;
          shapes_hash[shape_key] = shape;
        }
      }
      unique_shapes = [];
      _ref = Object.keys(shapes_hash);
      for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
        shape_key = _ref[_k];
        unique_shapes.push(shapes_hash[shape_key]);
      }
      if (unique_shapes.length === 0) {
        unique_shapes = null;
      }
      return unique_shapes;
    };

    PSDPath.prototype.parse_subpath_record = function(file) {
      var beizer_knot, filler, num_subpath_records, subpath_record, subpath_records, _i;
      this.file = file;
      num_subpath_records = this.file.readShortInt();
      filler = this.file.read(22);
      subpath_records = [];
      for (beizer_knot = _i = 1; 1 <= num_subpath_records ? _i <= num_subpath_records : _i >= num_subpath_records; beizer_knot = 1 <= num_subpath_records ? ++_i : --_i) {
        subpath_record = this.parse_beizer_knots_record(this.file);
        subpath_records.push(subpath_record);
      }
      return subpath_records;
    };

    PSDPath.prototype.parse_beizer_knots_record = function(file) {
      var beizer_knot, i, point, selector_type, _i;
      this.file = file;
      selector_type = this.file.readShortInt();
      assert(selector_type === 1 || selector_type === 2 || selector_type === 4 || selector_type === 5);
      beizer_knot = [];
      for (i = _i = 1; _i <= 3; i = ++_i) {
        point = this.parse_point_record(this.file);
        beizer_knot.push(point);
      }
      return beizer_knot;
    };

    PSDPath.prototype.parse_point_record = function(file) {
      var decimal, decimal_str, fraction, fraction_arr, x, y;
      this.file = file;
      decimal_str = this.file.read(1);
      fraction_arr = this.file.read(3);
      decimal = parseInt(decimal_str);
      fraction = (parseInt(fraction_arr[0]) * 255 * 255 + parseInt(fraction_arr[1]) * 255 + parseInt(fraction_arr[2])) / (255 * 255 * 255 + 255 * 255 + 255);
      if (decimal < 128) {
        y = Math.round((decimal + fraction) * this.image_height);
      } else {
        y = Math.round((decimal - 255 + fraction - 1) * this.image_height);
      }
      decimal_str = this.file.read(1);
      fraction_arr = this.file.read(3);
      decimal = parseInt(decimal_str);
      fraction = (parseInt(fraction_arr[0]) * 255 * 255 + parseInt(fraction_arr[1]) * 255 + parseInt(fraction_arr[2])) / (255 * 255 * 255 + 255 * 255 + 255);
      if (decimal < 128) {
        x = Math.round((decimal + fraction) * this.image_width);
      } else {
        x = Math.round((decimal - 255 + fraction - 1) * this.image_width);
      }
      return {
        x: x,
        y: y
      };
    };

    return PSDPath;

  })();

  module.exports = PSDPath;

}).call(this);