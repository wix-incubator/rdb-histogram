

function BucketHistogram(properties) {
  properties = properties || {};
  this.minBucket = properties.minBucket || 1;
  this.mainScale = properties.mainScale || 5;
  this.subScale = properties.subScale || 5;
  this.focusBuckets = properties.focusBuckets || [];
  this.buckets = [];
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

  this.buckets[bucket] = this.buckets[bucket] || {count: 0};
  this.buckets[bucket].count += 1;
  this.buckets[bucket].min = safeMin(this.buckets[bucket].min, value);
  this.buckets[bucket].max = safeMax(this.buckets[bucket].max, value);
  this.min = safeMin(this.min, value);
  this.max = safeMax(this.max, value);
  this.count = (this.count + 1) || 1;

  if (this.focusBuckets.indexOf(bucket) >=0) {
    this.buckets[bucket].subBuckets = this.buckets[bucket].subBuckets || [];

    var subBucket = this.valueToSubBucket(bucket, value);
    this.buckets[bucket].subBuckets[subBucket] = this.buckets[bucket].subBuckets[subBucket] || {count: 0};
    this.buckets[bucket].subBuckets[subBucket].count += 1;
    this.buckets[bucket].subBuckets[subBucket].min = safeMin(this.buckets[bucket].subBuckets[subBucket].min, value);
    this.buckets[bucket].subBuckets[subBucket].max = safeMax(this.buckets[bucket].subBuckets[subBucket].max, value);
  }
};

BucketHistogram.prototype.add = function(other) {
  var i;
  var length = Math.max(this.buckets.length, other.buckets.length);

  this.min = safeMin(this.min, other.min);
  this.max = safeMax(this.max, other.max);
  this.count = this.count + other.count;
  this.numBuckets = safeMax(this.numBuckets, other.numBuckets);

  for (i=0; i < length; i++) {
    if (this.buckets[i] && other.buckets[i]) {
      var thisBucket = this.buckets[i];
      var otherBucket = other.buckets[i];
      this.buckets[i] = {
        count: thisBucket.count + otherBucket.count,
        min: safeMin(thisBucket.min, otherBucket.min),
        max: safeMax(thisBucket.max, otherBucket.max)
      }
    }
    else if (other.buckets[i]) {
      var bucket = other.buckets[i];
      this.buckets[i] = {
        count: bucket.count,
        min: bucket.min,
        max: bucket.max
      }
    }
  }
};

BucketHistogram.prototype.toJSON = function() {
  if (this.buckets.length === 0)
    return {
      count: 0
    };
  else
    return {
      min: this.min,
      max: this.max,
      count: this.count,
      median: this.percentile(0.5, this.buckets),
      p75: this.percentile(0.75, this.buckets),
      p95: this.percentile(0.95, this.buckets),
      p99: this.percentile(0.99, this.buckets),
      p999: this.percentile(0.999, this.buckets),
      numBuckets: this.buckets.length
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
  var currBucket;

  while (currSum/total < percentile) {
    prevSum = currSum;
    if (buckets[pos]) {
      if (buckets[pos].subBuckets) {
        var subPos = 0;
        while (currSum/total < percentile && subPos < this.subScale) {
          prevSum = currSum;
          if (buckets[pos].subBuckets[subPos]) {
            currBucket = buckets[pos].subBuckets[subPos];
            currSum += currBucket.count;
          }
          subPos++;
        }
      }
      else {
        currBucket = buckets[pos];
        currSum += currBucket.count;
      }
    }
    pos++;
  }

  var bucket = currBucket;
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

