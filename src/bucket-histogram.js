

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
  this.values[bucket] = this.values[bucket] || {count: 0};
  this.values[bucket].count += 1;
  this.values[bucket].min = this.defValue(Math.min(this.values[bucket].min, value), value);
  this.values[bucket].max = this.defValue(Math.max(this.values[bucket].max, value), value);
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

BucketHistogram.prototype.percentile = function(percentile, buckets) {
  var total = buckets.map(function(bc) {
    return bc.count || 0;
  }).reduce(function(a,b) {
    return a+b;
  });
  var currSum = 0;
  var prevSum = 0;
  var pos = 0;

  while (currSum/total < percentile) {
    prevSum = currSum;
    if (buckets[pos])
      currSum += buckets[pos].count;
    pos++;
  }

  var bucket = buckets[pos-1];
  var value = bucket.count;
  var cellHigh = bucket.max;
  var cellLow = bucket.min;
  var percentOfCell = (total * percentile - prevSum) / value;
  return percentOfCell * (cellHigh-cellLow) + cellLow;
};

module.exports = BucketHistogram;