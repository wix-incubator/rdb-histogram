

function BucketHistogram(properties) {
  properties = properties || {};
  this.minBucket = properties.minBucket || 1;
  this.mainScale = properties.mainScale || 5;
  this.subScale = properties.subScale || 5;
  this.focusBuckets = properties.focusBuckets || [];
  this.values = [];
  this.min = NaN;
  this.max = NaN;
  this.count = 0;
}

BucketHistogram.prototype.normalizedLog = function(value) {
  return Math.log(value) / this.norm;
};

BucketHistogram.prototype.valueToBucket = function (value) {
  return Math.floor(this.mainScale*(log10(value) - log10(this.minBucket))) + 1;
};

BucketHistogram.prototype.valueToSubBucket = function (bucketIndex, value) {
  var bucketLowerBound = Math.floor(Math.pow(10, (bucketIndex-1)/this.mainScale));
  return Math.floor(this.mainScale*(log10(value) - log10(bucketLowerBound))*this.subScale);
};

BucketHistogram.prototype.bucketBounds = function (bucketIndex) {
  return [Math.floor(Math.pow(10, (bucketIndex-1)/this.mainScale)), Math.floor(Math.pow(10, bucketIndex/this.mainScale))];
};

BucketHistogram.prototype.update = function (value) {
  var bucket;
  if (value < this.minBucket)
    bucket = 0;
  else {
    bucket = Math.floor(this.mainScale*(log10(value) - log10(this.minBucket))) + 1;
  }

  this.values[bucket] = this.values[bucket] || {count: 0};
  this.values[bucket].count += 1;
  this.values[bucket].min = safeMin(this.values[bucket].min, value);
  this.values[bucket].max = safeMax(this.values[bucket].max, value);
  this.min = safeMin(this.min, value);
  this.max = safeMax(this.max, value);
  this.count = (this.count + 1) || 1;

  if (this.focusBuckets.indexOf(bucket) >=0) {
    this.values[bucket].subBuckets = this.values[bucket].subBuckets || [];

    var subBucket = this.valueToSubBucket(bucket, value);
    this.values[bucket].subBuckets[subBucket] = this.values[bucket].subBuckets[subBucket] || {count: 0};
    this.values[bucket].subBuckets[subBucket].count += 1;
    this.values[bucket].subBuckets[subBucket].min = safeMin(this.values[bucket].subBuckets[subBucket].min, value);
    this.values[bucket].subBuckets[subBucket].max = safeMax(this.values[bucket].subBuckets[subBucket].max, value);
  }
};

BucketHistogram.prototype.add = function(other) {
  var i;
  var length = Math.max(this.values.length, other.values.length);

  this.min = safeMin(this.min, other.min);
  this.max = safeMax(this.max, other.max);
  this.count = this.count + other.count;
  this.numBuckets = safeMax(this.numBuckets, other.numBuckets);

  for (i=0; i < length; i++) {
    if (this.values[i] && other.values[i]) {
      var thisBucket = this.values[i];
      var otherBucket = other.values[i];
      this.values[i] = {
        count: thisBucket.count + otherBucket.count,
        min: safeMin(thisBucket.min, otherBucket.min),
        max: safeMax(thisBucket.max, otherBucket.max)
      }
    }
    else if (other.values[i]) {
      var bucket = other.values[i];
      this.values[i] = {
        count: bucket.count,
        min: bucket.min,
        max: bucket.max
      }
    }
  }
};

BucketHistogram.prototype.toJSON = function() {
  if (this.values.length === 0)
    return {
      count: 0
    };
  else
    return {
      min: this.min,
      max: this.max,
      count: this.count,
      median: this.percentile(0.5, this.values),
      p75: this.percentile(0.75, this.values),
      p95: this.percentile(0.95, this.values),
      p99: this.percentile(0.99, this.values),
      p999: this.percentile(0.999, this.values),
      numBuckets: this.values.length
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

function safeNumOp(fn, a, b) {
  if (isNaN(a))
    return b;
  else if (isNaN(b))
    return a;
  else
    return fn(a,b);
}

function safeMax(a,b) {
  return safeNumOp(Math.max, a, b);
}

function safeMin(a,b) {
  return safeNumOp(Math.min, a, b);
}

var base = Math.log(10);
function log10(n) {
  return Math.log(n) / base;
}

