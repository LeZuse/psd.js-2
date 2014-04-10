// Generated by CoffeeScript 1.6.1
(function() {
  var Log, PSDChannelImage, PSDLayer, PSDLayerMask, Util, assert;

  Log = require('./log');

  Util = require('./util');

  PSDLayer = require('./psdlayer');

  PSDChannelImage = require('./psdchannelimage');

  assert = require('./psdassert');

  PSDLayerMask = (function() {

    function PSDLayerMask(file, header, options) {
      this.file = file;
      this.header = header;
      this.options = options;
      this.layers = [];
      this.mergedAlpha = false;
      this.globalMask = {};
      this.extras = [];
    }

    PSDLayerMask.prototype.skip = function() {
      return this.file.seek(this.file.readInt());
    };

    PSDLayerMask.prototype.parse = function() {
      var endLoc, flag, i, layer, layerInfoSize, layers_copy, maskSize, pos, skip_count, _i, _j, _k, _len, _ref, _ref1, _ref2;
      maskSize = this.file.readInt();
      endLoc = this.file.tell() + maskSize;
      Log.debug("Layer mask size is " + maskSize);
      if (maskSize <= 0) {
        return;
      }
      layerInfoSize = Util.pad2(this.file.readInt());
      flag = true;
      if (layerInfoSize !== 0) {
        flag = false;
      }
      skip_count = 0;
      while (flag) {
        skip_count++;
        layerInfoSize = this.file.readInt();
        if (layerInfoSize !== 0 && layerInfoSize < maskSize) {
          flag = false;
        }
      }
      if (skip_count > 0) {
        console.log("Skipped " + skip_count + " times...");
      }
      pos = this.file.tell();
      if (layerInfoSize > 0) {
        this.numLayers = this.file.readShortInt();
        if (this.numLayers < 0) {
          Log.debug("Note: first alpha channel contains transparency data");
          this.numLayers = Math.abs(this.numLayers);
          this.mergedAlpha = true;
        }
        if (this.numLayers * (18 + 6 * this.header.channels) > layerInfoSize) {
          throw "Unlikely number of " + this.numLayers + " layers for " + this.header['channels'] + " with " + layerInfoSize + " layer info size. Giving up.";
        }
        console.log("Found " + this.numLayers + " layer(s)");
        layers_copy = [];
        for (i = _i = 0, _ref = this.numLayers; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          layer = new PSDLayer(this.file, this.header);
          layer.parse(i);
          this.layers.push(layer);
          layers_copy.push(layer);
        }
        if (this.layers[0].name === "Background") {
          this.layers.splice(0, 1);
          layers_copy.splice(0, 1);
          for (i = _j = 0, _ref1 = this.layers.length - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
            this.layers[i].idx = this.layers[i].idx - 1;
          }
        }
        _ref2 = this.layers;
        for (_k = 0, _len = _ref2.length; _k < _len; _k++) {
          layer = _ref2[_k];
          if (layer.isFolder || layer.isHidden) {
            this.file.seek(8);
            continue;
          }
          layer.image = new PSDChannelImage(this.file, this.header, layer);
          if (this.options.layerImages && ((this.options.onlyVisibleLayers && layer.visible) || !this.options.onlyVisibleLayers)) {
            layer.image.parse();
          } else {
            layer.image.skip();
          }
        }
      }
      this.file.seek(pos + layerInfoSize, false);
      this.parseGlobalMask();
      this.file.seek(endLoc, false);
      this.visible_layers = this.prune_hidden_layers(layers_copy);
      return;
      if (this.file.tell() < endLoc) {
        return this.parseExtraInfo(endLoc);
      }
    };

    PSDLayerMask.prototype.parseGlobalMask = function() {
      var end, i, length, start, _i;
      length = this.file.readInt();
      if (length === 0) {
        return;
      }
      start = this.file.tell();
      end = this.file.tell() + length;
      Log.debug("Global mask length: " + length);
      this.globalMask.overlayColorSpace = this.file.readShortInt();
      this.globalMask.colorComponents = [];
      for (i = _i = 0; _i < 4; i = ++_i) {
        this.globalMask.colorComponents.push(this.file.readShortInt() >> 8);
      }
      this.globalMask.opacity = this.file.readShortInt();
      this.globalMask.kind = this.file.read(1)[0];
      Log.debug("Global mask:", this.globalMask);
      return this.file.seek(end, false);
    };

    PSDLayerMask.prototype.parseExtraInfo = function(end) {
      var key, length, sig, _ref, _results;
      _results = [];
      while (this.file.tell() < end) {
        _ref = this.file.readf(">4s4sI"), sig = _ref[0], key = _ref[1], length = _ref[2];
        length = Util.pad2(length);
        console.log("Layer extra:", sig, key, length);
        _results.push(this.file.seek(length));
      }
      return _results;
    };

    PSDLayerMask.prototype.groupLayers = function() {
      var groupLayer, layer, _i, _len, _ref, _results;
      groupLayer = null;
      _ref = this.layers;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        layer = _ref[_i];
        if (layer.isFolder) {
          _results.push(groupLayer = layer);
        } else if (layer.isHidden) {
          _results.push(groupLayer = null);
        } else {
          _results.push(layer.groupLayer = groupLayer);
        }
      }
      return _results;
    };

    PSDLayerMask.prototype.prune_hidden_layers = function(layers) {
      var child_layer, children_layers, current_layer_set, current_layer_sets, layer, layer_id, layer_keys, layer_names, layer_sets, layer_visibility_status, layers_after_pruning, visible, _i, _j, _k, _l, _len, _len1, _len2, _len3;
      layers.reverse();
      layer_sets = {};
      layer_visibility_status = {};
      layer_names = {};
      current_layer_sets = [0];
      for (_i = 0, _len = layers.length; _i < _len; _i++) {
        layer = layers[_i];
        layer_id = layer.layerId;
        layer_visibility_status[layer_id] = layer.visible;
        layer_names[layer_id] = layer.name;
        if (layer.layerType === "bounding section divider") {
          layer_visibility_status[layer_id] = 0;
          current_layer_sets.pop();
          continue;
        }
        current_layer_set = current_layer_sets[current_layer_sets.length - 1];
        if (layer_sets[current_layer_set] == null) {
          layer_sets[current_layer_set] = [];
        }
        layer_sets[current_layer_set].push(layer_id);
        if (layer.isFolder) {
          current_layer_sets.push(layer.layerId);
        }
      }
      layer_keys = Object.keys(layer_visibility_status);
      for (_j = 0, _len1 = layer_keys.length; _j < _len1; _j++) {
        layer = layer_keys[_j];
        visible = layer_visibility_status[layer];
        if (visible === 0) {
          layer_visibility_status[layer] = 0;
          children_layers = layer_sets[layer] || [];
          for (_k = 0, _len2 = children_layers.length; _k < _len2; _k++) {
            child_layer = children_layers[_k];
            layer_visibility_status[child_layer] = 0;
          }
        }
      }
      layers_after_pruning = [];
      for (_l = 0, _len3 = layers.length; _l < _len3; _l++) {
        layer = layers[_l];
        layer_id = layer.layerId;
        if (layer_visibility_status[layer_id] === 1 && layer.layerType !== "open folder" && layer.layerType !== "closed folder") {
          layers_after_pruning.push(layer);
        }
      }
      console.log("" + layers_after_pruning.length + " Layers are visible");
      return layers_after_pruning;
    };

    PSDLayerMask.prototype.toJSON = function() {
      var data, layer, _i, _len, _ref;
      data = {
        numLayers: this.numLayers,
        visibleLayers: this.visible_layers.length,
        layers: []
      };
      _ref = this.visible_layers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        layer = _ref[_i];
        data.layers.push(layer.toJSON());
      }
      return data;
    };

    return PSDLayerMask;

  })();

  module.exports = PSDLayerMask;

}).call(this);