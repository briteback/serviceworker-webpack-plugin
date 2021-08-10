"use strict";

var _webpack = _interopRequireDefault(require("webpack"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _rimraf = _interopRequireDefault(require("rimraf"));

var _chai = require("chai");

var _index = _interopRequireDefault(require("./index"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function trim(str) {
  return str.replace(/^\s+|\s+$/, '');
}

var filename = 'sw.js';

var webpackOutputPath = _path["default"].resolve('./tmp-build');

var makeWebpackConfig = function makeWebpackConfig(options) {
  return {
    entry: _path["default"].join(__dirname, '../test/test-build-entry'),
    mode: 'development',
    devtool: false,
    plugins: [new _index["default"](_objectSpread({
      entry: _path["default"].join(__dirname, '../test/test-build-sw')
    }, options))],
    resolve: {
      alias: {
        'serviceworker-webpack-plugin/lib/runtime': _path["default"].join(__dirname, 'runtime.js')
      }
    },
    output: {
      path: webpackOutputPath
    }
  };
};

describe('ServiceWorkerPlugin', function () {
  beforeEach(function (done) {
    return (0, _rimraf["default"])(webpackOutputPath, done);
  });
  describe('options: filename', function () {
    it('should throw if trying to hash the filename', function () {
      _chai.assert["throws"](function () {
        // eslint-disable-next-line no-new
        new _index["default"]({
          filename: 'sw-[hash:7].js'
        });
      }, /The name of the/);
    });
    it('should strip double slashes', function (done) {
      var options = makeWebpackConfig({
        filename: '//sw.js'
      });
      return (0, _webpack["default"])(options, function (err, stats) {
        (0, _chai.expect)(err).to.equal(null);

        var _stats$toJson = stats.toJson(),
            assetsByChunkName = _stats$toJson.assetsByChunkName,
            errors = _stats$toJson.errors,
            warnings = _stats$toJson.warnings;

        (0, _chai.expect)(errors).to.have.length(0);
        (0, _chai.expect)(warnings).to.have.length(0);

        var mainFile = _fs["default"].readFileSync(_path["default"].join(webpackOutputPath, assetsByChunkName.main), 'utf8');

        (0, _chai.expect)(mainFile).to.include('var serviceWorkerOption = {"scriptURL":"/sw.js"}');
        done();
      });
    });
  });
  it('should correctly generate a service worker', function () {
    var options = makeWebpackConfig({
      filename: '//sw.js'
    });
    return (0, _webpack["default"])(options, function (err, stats) {
      (0, _chai.expect)(err).to.equal(null);

      var _stats$toJson2 = stats.toJson(),
          assetsByChunkName = _stats$toJson2.assetsByChunkName,
          errors = _stats$toJson2.errors,
          warnings = _stats$toJson2.warnings;

      (0, _chai.expect)(errors).to.have.length(0);
      (0, _chai.expect)(warnings).to.have.length(0);

      var swFile = _fs["default"].readFileSync(_path["default"].join(webpackOutputPath, 'sw.js'), 'utf8').replace(/\s+/g, ' '); // sw.js should reference main.js


      (0, _chai.expect)(swFile).to.include('var serviceWorkerOption = { "assets": [ "/main.js" ] }'); // sw.js should include the webpack require code

      (0, _chai.expect)(swFile).to.include('function __webpack_require__(moduleId)');
    });
  });
  describe('options: includes', function () {
    it('should allow to have a white list parameter', function () {
      var _assets;

      var serviceWorkerPlugin = new _index["default"]({
        filename: filename,
        includes: ['bar.*']
      });
      var compilation = {
        assets: (_assets = {}, _defineProperty(_assets, filename, {
          source: function source() {
            return '';
          }
        }), _defineProperty(_assets, 'bar.js', {}), _defineProperty(_assets, 'foo.js', {}), _assets),
        getStats: function getStats() {
          return {
            toJson: function toJson() {
              return {};
            }
          };
        }
      };
      return serviceWorkerPlugin.handleEmit(compilation, {
        options: {}
      }, function () {
        _chai.assert.strictEqual(compilation.assets[filename].source(), trim("\nvar serviceWorkerOption = {\n  \"assets\": [\n    \"/bar.js\"\n  ]\n};"));
      });
    });
    describe('options: transformOptions', function () {
      it('should be used', function () {
        var transformOptions = function transformOptions(serviceWorkerOption) {
          return {
            bar: 'foo',
            jsonStats: serviceWorkerOption.jsonStats
          };
        };

        var serviceWorkerPlugin = new _index["default"]({
          filename: filename,
          transformOptions: transformOptions
        });
        var compilation = {
          assets: _defineProperty({}, filename, {
            source: function source() {
              return '';
            }
          }),
          getStats: function getStats() {
            return {
              toJson: function toJson() {
                return {
                  foo: 'bar'
                };
              }
            };
          }
        };
        return serviceWorkerPlugin.handleEmit(compilation, {
          options: {}
        }, function () {
          _chai.assert.strictEqual(compilation.assets[filename].source(), trim("\nvar serviceWorkerOption = {\n  \"bar\": \"foo\",\n  \"jsonStats\": {\n    \"foo\": \"bar\"\n  }\n};"));
        });
      });
    });
  });
});