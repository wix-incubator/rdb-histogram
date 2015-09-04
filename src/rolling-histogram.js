var BucketHistogram = require("./bucket-histogram");

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
  this.history.push(this.current);
  this.current = new BucketHistogram(this.properties);
  if (this.history.length > this.historyLength)
    this.history.shift();
};

RollingHistogram.prototype.toJSON = function () {
  this.rescale();
  var aggregate = new BucketHistogram(this.properties);

  this.history.forEach(function(histogram) {
    aggregate.add(histogram);
  });

  aggregate.add(this.current);

  return aggregate.toJSON();
};

module.exports = RollingHistogram;
