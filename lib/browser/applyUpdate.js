"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

// @flow weak
function applyUpdate() {
  return new Promise(function (resolve, reject) {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistration().then(function (registration) {
        if (!registration || !registration.waiting) {
          reject();
          return;
        }

        registration.waiting.postMessage({
          action: 'skipWaiting'
        });
        resolve();
      });
    } else {
      reject();
    }
  });
}

var _default = applyUpdate;
exports["default"] = _default;
module.exports = exports.default;