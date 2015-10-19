

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

  if (this.mainScale !== other.mainScale || this.subScale !== other.subScale || this.minBucket !== other.minBucket)
    throw new Error("Histogram.add: incompatible histogram configs");

  var result = new BucketHistogram({
    minBucket: this.minBucket,
    mainScale: this.mainScale,
    subScale: this.subScale
  });

  var i, thisBucket, otherBucket, newBucket;
  var length = Math.max(this.buckets.length, other.buckets.length);

  result.min = safeMin(this.min, other.min);
  result.max = safeMax(this.max, other.max);
  result.count = this.count + other.count;

  for (i=0; i < length; i++) {
    if (this.buckets[i] && other.buckets[i]) {
      thisBucket = this.buckets[i];
      otherBucket = other.buckets[i];
      newBucket = setBucket(result.buckets, i, thisBucket.count + otherBucket.count, safeMin(thisBucket.min, otherBucket.min), safeMax(thisBucket.max, otherBucket.max));
      if (thisBucket.subBuckets && otherBucket.subBuckets)
        mergeSubBuckets(thisBucket, otherBucket, newBucket);
      else if (thisBucket.subBuckets)
        mergeSubBucketsAndBucket(thisBucket, otherBucket.count, newBucket);
      else if (otherBucket.subBuckets)
        mergeSubBucketsAndBucket(otherBucket, thisBucket.count, newBucket);
    }
    else if (other.buckets[i]) {
      otherBucket = other.buckets[i];
      newBucket = setBucket(result.buckets, i, otherBucket.count, otherBucket.min, otherBucket.max);
      if (otherBucket.subBuckets)
        copySubBuckets(otherBucket, newBucket);
    }
    else if (this.buckets[i]) {
      thisBucket = this.buckets[i];
      newBucket = setBucket(result.buckets, i, thisBucket.count, thisBucket.min, thisBucket.max);
      if (thisBucket.subBuckets)
        copySubBuckets(thisBucket, newBucket);
    }
  }

  return result;
};

function setBucket(buckets, pos, count, min, max) {
  var bucket = {
    count: count,
    max: max,
    min: min
  };
  buckets[pos] = bucket;
  return bucket;
}

function copySubBuckets(sourceBucket, newBucket) {
  var subBuckets = newBucket.subBuckets = [];
  for (var i=0; i < sourceBucket.subBuckets.length; i++) {
    if (sourceBucket.subBuckets[i]) {
      setBucket(subBuckets, i, sourceBucket.subBuckets[i].count, sourceBucket.subBuckets[i].min, sourceBucket.subBuckets[i].max);
    }
  }
}

function mergeSubBucketsAndBucket(sourceBucket, otherCount, newBucket) {
  copySubBuckets(sourceBucket, newBucket);
  var subBuckets = newBucket.subBuckets;
  var ratio = 1.0 + otherCount/sourceBucket.count;
  // distribute count by a factor
  subBuckets.forEach(function(sub) {
    sub.count = Math.floor(sub.count * ratio);
  });
  // get the remaining count
  var reminder = sourceBucket.count + otherCount - subBuckets.reduce(function(sum, subBucket) {
    return sum + subBucket.count;
  }, 0);
  while (reminder > 0) {
    // the reminder should be smaller then the number of sub-buckets
    var sortedSubBuckets = newBucket.subBuckets.slice();
    sortedSubBuckets.sort(function(b1, b2) {
      return b2.count - b1.count;
    });
    var reminderCopy = reminder;
    for (var i=0; i < safeMin(sortedSubBuckets.length, reminderCopy); i++) {
      if (sortedSubBuckets[i]) {
        sortedSubBuckets[i].count += 1;
        reminder -= 1;
      }
    }
  }
}

function mergeSubBuckets(thisBucket, otherBucket, newBucket) {
  newBucket.subBuckets = newBucket.subBuckets || [];
  for (var i=0; i < safeMax(thisBucket.subBuckets.length, otherBucket.subBuckets.length); i++) {
    if (thisBucket.subBuckets[i] && otherBucket.subBuckets[i])
      setBucket(newBucket.subBuckets, i, thisBucket.subBuckets[i].count + otherBucket.subBuckets[i].count,
        safeMin(thisBucket.subBuckets[i].min, otherBucket.subBuckets[i].min),
        safeMax(thisBucket.subBuckets[i].max, otherBucket.subBuckets[i].max));
    else if (thisBucket.subBuckets[i])
      setBucket(newBucket.subBuckets, i, thisBucket.subBuckets[i].count, thisBucket.subBuckets[i].min,
        thisBucket.subBuckets[i].max);
    else if (otherBucket.subBuckets[i])
      setBucket(newBucket.subBuckets, i, otherBucket.subBuckets[i].count, otherBucket.subBuckets[i].min,
        otherBucket.subBuckets[i].max);
  }
}

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

  while (currSum/total < percentile && pos < buckets.length) {
    prevSum = currSum;
    if (buckets[pos]) {
      if (buckets[pos].subBuckets) {
        var subPos = 0;
        while (currSum/total < percentile && subPos < buckets[pos].subBuckets.length) {
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

