var RollingHistogram = require("./src/rolling-histogram");
module.exports.RollingHistogram = RollingHistogram;

module.exports.patchMeasured = function(measured) {
  // replace the direct constructor
  measured.Histogram = RollingHistogram;

  // replace the constructor on the collection object
  var originalCreateCollection = measured.createCollection;
  measured.createCollection = function(name) {
    var collection = originalCreateCollection(name);
    collection.histogram = function(name, properties) {
      if (!name) {
        throw new Error('Collection.NoMetricName');
      }

      if (this._metrics[name]) {
        return this._metrics[name];
      }

      var metric = new RollingHistogram(properties);
      this.register(name, metric);
      return metric;
    };
    collection.histogram.bind(collection);
  }
};