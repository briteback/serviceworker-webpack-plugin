"use strict";

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// @flow weak
module.exports = function defaultExport() {}; // The loaders are called from right to left.


module.exports.pitch = function pitch() {
  var _this = this;

  // Makes the loader asyn.
  var callback = this.async();

  var templatePath = _path["default"].join(__dirname, './runtimeTemplate.js'); // Make this loader cacheable.


  this.cacheable(); // Explicit the cache dependency.

  this.addDependency(templatePath);

  _fs["default"].readFile(templatePath, 'utf-8', function (err, template) {
    if (err) {
      callback(err);
      return;
    }

    var source = "\n      var serviceWorkerOption = ".concat(_this.query.slice(1), ";\n      ").concat(template, "\n    ").trim();
    callback(null, source);
  });
};