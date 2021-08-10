"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

/* eslint-disable flowtype/require-valid-file-annotation */

/* global serviceWorkerOption */
var _default = {
  register: function register() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (navigator.serviceWorker) {
      return navigator.serviceWorker.register(serviceWorkerOption.scriptURL, options);
    }

    return false;
  }
};
exports["default"] = _default;
module.exports = exports.default;