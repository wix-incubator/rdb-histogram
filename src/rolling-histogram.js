var BucketHistogram = require("./bucket-histogram-2");

function RollingHistogram(properties) {
  this.properties = properties || {};
  this.historyInterval = this.properties.historyInterval || 15*1000;
  this.historyLength = this.properties.historyLength || 4;

  this.reset();
}

RollingHistogram.prototype.reset = function () {
  this._landmark = Date.now();
  this._nextRescale = this._landmark + this.historyInterval;

  this.history = [];
  this.current = new BucketHistogram(this.properties);

};

RollingHistogram.prototype.update = function (value) {
  this.rescale();
  this.current.update(value);
};

RollingHistogram.prototype.rescale = function () {
  var now = Date.now();

  // optimization - if the histogram was not active a long time, just reset it
  if (this._landmark + this.historyLength * this.historyInterval < now) {
    this.reset();
  }
  else
    while (this._nextRescale < now) {
      this.doRollover();
      this._landmark = this._landmark + this.historyInterval;
      this._nextRescale = this._landmark + this.historyInterval;
    }
};

RollingHistogram.prototype.doRollover = function () {
  //optimize - calculate the hot spots - buckets around the percentiles and focus on those buckets.
  var stats = this.current.toJSON();
  var uniqueFocusBuckets = [];
  if (stats.count > 0) {
    var focusBuckets = [this.current.valueToBucket(stats.median),
      this.current.valueToBucket(stats.p75), this.current.valueToBucket(stats.p95),
      this.current.valueToBucket(stats.p99), this.current.valueToBucket(stats.p999)];
    uniqueFocusBuckets = focusBuckets.filter(function(elem, pos) {
      return focusBuckets.indexOf(elem) == pos;
    });
  }
  this.history.push(this.current);
  // todo merge properties
  this.current = new BucketHistogram(this.properties, uniqueFocusBuckets);
  if (this.history.length > this.historyLength)
    this.history.shift();
};

RollingHistogram.prototype.toJSON = function () {
  this.rescale();
  var aggregate;

  aggregate = this.history.reduce(function(sum, current) {
    return sum.add(current);
  }, this.current);

  var numberOfBuckets = this.history.reduce(function(sum, current) {
    return sum + current.numberOfBuckets();
  }, this.current.numberOfBuckets());

  var stats = aggregate.toJSON();
  stats.numBuckets = numberOfBuckets;
  return  stats;
};

module.exports = RollingHistogram;
