"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _path = _interopRequireDefault(require("path"));

var _SingleEntryPlugin = _interopRequireDefault(require("webpack/lib/SingleEntryPlugin"));

var _minimatch = _interopRequireDefault(require("minimatch"));

var _webpack = _interopRequireDefault(require("webpack"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function validatePaths(assets, options) {
  var depth = options.filename.replace(/^\//, '').split('/').length;
  var basePath = Array(depth).join('../') || './';
  return assets.filter(function (asset) {
    return !!asset;
  }).map(function (key) {
    // if absolute url, use it as is
    if (/^(?:\w+:)\/\//.test(key)) {
      return key;
    }

    key = key.replace(/^\//, '');

    if (options.publicPath !== '') {
      return options.publicPath + key;
    }

    return basePath + key;
  });
}

var COMPILER_NAME = 'serviceworker-plugin';

var ServiceWorkerPlugin = /*#__PURE__*/function () {
  function ServiceWorkerPlugin(options) {
    _classCallCheck(this, ServiceWorkerPlugin);

    _defineProperty(this, "options", []);

    _defineProperty(this, "warnings", []);

    this.options = Object.assign({
      publicPath: '/',
      excludes: ['**/.*', '**/*.map'],
      includes: ['**/*'],
      entry: null,
      filename: 'sw.js',
      template: function template() {
        return Promise.resolve('');
      },
      transformOptions: function transformOptions(serviceWorkerOption) {
        return {
          assets: serviceWorkerOption.assets
        };
      },
      minimize: process.env.NODE_ENV === 'production'
    }, options);

    if (this.options.filename.match(/\[hash/)) {
      throw new Error("The name of the service worker need to fixed across releases.\n        https://developers.google.com/web/fundamentals/instant-and-offline/service-worker/lifecycle#avoid_changing_the_url_of_your_service_worker_script");
    }
  }

  _createClass(ServiceWorkerPlugin, [{
    key: "apply",
    value: function apply(compiler) {
      var _this = this;

      // compiler.hooks was introduced in webpack4, older versions are not supported
      if (compiler.hooks === undefined) {
        throw new Error('serviceworker-webpack-plugin requires webpack >= 4. Use serviceworker-webpack-plugin@0 on older versions of webpack');
      }

      var runtimePath = _path["default"].resolve(__dirname, './runtime.js');

      var data = JSON.stringify({
        scriptURL: _path["default"].join(this.options.publicPath, this.options.filename)
      });
      var loaderPath = "".concat(_path["default"].join(__dirname, 'runtimeLoader.js'), "?").concat(data);
      var module = compiler.options.module;
      var rules;

      if (module.rules) {
        module.rules = rules = _toConsumableArray(module.rules);
      } else if (module.loaders) {
        module.loaders = rules = _toConsumableArray(module.loaders);
      } else {
        module.rules = rules = [];
      }

      rules.push({
        test: runtimePath,
        use: loaderPath
      });
      compiler.hooks.make.tapAsync('sw-plugin-make', function (compilation, callback) {
        if (_this.warnings.length) {
          var array = [];
          array.push.apply(compilation.warnings, _this.warnings);
        }

        _this.handleMake(compilation, compiler).then(function () {
          callback();
        })["catch"](function () {
          callback(new Error('Something went wrong during the make event.'));
        });
      });
      compiler.hooks.emit.tapAsync('sw-plugin-emit', function (compilation, callback) {
        _this.handleEmit(compilation, compiler, callback);
      });
    }
  }, {
    key: "handleMake",
    value: function handleMake(compilation, compiler) {
      var childCompiler = compilation.createChildCompiler(COMPILER_NAME, {
        filename: this.options.filename
      });
      var childEntryCompiler = new _SingleEntryPlugin["default"](compiler.context, this.options.entry);
      childEntryCompiler.apply(childCompiler); // Fix for "Uncaught TypeError: __webpack_require__(...) is not a function"
      // Hot module replacement requires that every child compiler has its own
      // cache. @see https://github.com/ampedandwired/html-webpack-plugin/pull/179

      childCompiler.hooks.compilation.tap('sw-plugin-compilation', function (compilation2) {
        if (compilation2.cache) {
          if (!compilation2.cache[COMPILER_NAME]) {
            compilation2.cache[COMPILER_NAME] = {};
          }

          compilation2.cache = compilation2.cache[COMPILER_NAME];
        }
      }); // Compile and return a promise.

      return new Promise(function (resolve, reject) {
        childCompiler.runAsChild(function (err) {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        });
      });
    }
  }, {
    key: "handleEmit",
    value: function handleEmit(compilation, compiler, callback) {
      var _this2 = this;

      var asset = compilation.assets[this.options.filename];

      if (!asset) {
        compilation.errors.push(new Error('ServiceWorkerPlugin: the `entry` option is incorrect.'));
        callback();
        return;
      }

      var jsonStats = compilation.getStats().toJson({
        hash: false,
        publicPath: false,
        assets: true,
        chunks: false,
        modules: true,
        source: false,
        errorDetails: false,
        timings: false
      });
      delete compilation.assets[this.options.filename];
      var assets = Object.keys(compilation.assets);
      var excludes = this.options.excludes;

      if (excludes.length > 0) {
        assets = assets.filter(function (assetCurrent) {
          return !excludes.some(function (glob) {
            return (0, _minimatch["default"])(assetCurrent, glob);
          });
        });
      }

      var includes = this.options.includes;

      if (includes.length > 0) {
        assets = assets.filter(function (assetCurrent) {
          return includes.some(function (glob) {
            return (0, _minimatch["default"])(assetCurrent, glob);
          });
        });
      }

      assets = validatePaths(assets, this.options);
      var minify;

      if (Number(_webpack["default"].version[0]) >= 4) {
        minify = compiler.options.optimization && compiler.options.optimization.minimize;
      } else {
        minify = (compiler.options.plugins || []).some(function (plugin) {
          return plugin instanceof _webpack["default"].optimize.UglifyJsPlugin;
        });
      }

      var serviceWorkerOption = this.options.transformOptions({
        assets: assets,
        jsonStats: jsonStats
      });
      var templatePromise = this.options.template(serviceWorkerOption);
      templatePromise.then(function (template) {
        var serviceWorkerOptionInline = JSON.stringify(serviceWorkerOption, null, _this2.options.minimize ? 0 : 2);

        var _source = "\n        var serviceWorkerOption = ".concat(serviceWorkerOptionInline, ";\n        ").concat(template, "\n        ").concat(asset.source(), "\n      ").trim();

        compilation.assets[_this2.options.filename] = {
          source: function source() {
            return _source;
          },
          size: function size() {
            return Buffer.byteLength(_source, 'utf8');
          }
        };
        callback();
      });
    }
  }]);

  return ServiceWorkerPlugin;
}();

exports["default"] = ServiceWorkerPlugin;
module.exports = exports.default;