

function BucketHistogram(properties) {
  properties = properties || {};
  this.minBucket = properties.minBucket || 1;
  this.backetSize = properties.backetSize || Math.sqrt(2);
  this.norm = Math.log(this.backetSize);
  this.values = [];

}

BucketHistogram.prototype.normalizedLog = function(value) {
  return Math.log(value) / this.norm;
};

BucketHistogram.prototype.update = function (value) {
  var bucket;
  if (value < this.minBucket)
    bucket = 0;
  else {
    bucket = Math.floor(this.normalizedLog(value) - this.normalizedLog(this.minBucket) + 1);
  }
  this.values[bucket] = this.values[bucket] + 1 || 1;
  this.min = this.defValue(Math.min(this.min, value), value);
  this.max = this.defValue(Math.max(this.max, value), value);
  this.count = (this.count + 1) || 1;
};

BucketHistogram.prototype.defValue = function(value, defValue) {
  if (value === undefined || isNaN(value))
    return defValue;
  else
    return value;
};

BucketHistogram.prototype.toJSON = function() {
  return {
    min: this.min,
    max: this.max,
    count: this.count,
    p50: this.percentile(0.5, this.values),
    p75: this.percentile(0.75, this.values),
    p95: this.percentile(0.95, this.values),
    p99: this.percentile(0.99, this.values),
    p999: this.percentile(0.999, this.values)
  }
};

BucketHistogram.prototype.percentile = function(percentile, values) {
  var total = values.reduce(function(a,b) {return a+b;});
  var currSum = 0;
  var prevSum = 0;
  var pos = 0;

  while (currSum/total < percentile) {
    prevSum = currSum;
    currSum += (values[pos] || 0);
    pos++;
  }

  var cellValue = values[pos-1];
  var cellHigh = Math.pow(this.backetSize, pos-1);
  var cellLow = Math.pow(this.backetSize, pos-2);
  if (pos === values.length)
    cellHigh = this.max;
  if (pos === 1)
    cellLow = this.min;
  var percentOfCell = (total * percentile - prevSum) / cellValue;
  return percentOfCell * (cellHigh-cellLow) + cellLow;
};

module.exports = BucketHistogram;