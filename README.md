# RDBHistogram

RDBHistogram (Rolling Dynamic range Bucket Histogram) is an histogram algorithm that aims for high precision while preserving memory.
Histograms are a great tool to quantify performance measurements (like latency) which tend to have a non-normal distribution
with extremely large values.

Statistics captured:

* max
* min
* median
* 75%tile
* 95%tile
* 99%tile
* 99.9%tile

With the default configuration, the RDBHistogram tracks last minute statistics with 10% accuracy. Compared to other algorithms
(the algorithm used by [Metrics](https://github.com/dropwizard/metrics)), the RDB histogram provides better accuracy, predictability
and a smaller memory footprint.

## Why?

Read the comparison with the popular Metrics Histogram algorithm <link to our blog post>.

## Usage

Create the histogram object

```
var RDBHistogram = require('rdb-histogram');
var histogram = new RDBHistogram();
```

Put values into the histogram

```
histogram.update(value);
```

Get the statistics

```
histogram.toJSON();
```

## patching node-measured

[node-measured](https://github.com/felixge/node-measured) is a node.js implementation of the excellent
[Metrics](https://github.com/dropwizard/metrics) library. Like the metrics library it has the failing
of the Metrics histogram algorithm which is based on sampling and suffers from inherent inaccuracy, and
more importantly, unpredictable inaccuracy - one cannot calculate what the inaccuracy will be given a certain
input data or rate of input samples simply because the algorithm is preserves a set of samples that is probably to be
representative but is not guaranteed to be so.

The RDBHistogram provides a higher precision algorithm with a lesser memory footprint and a predicable accuracy - accuracy
is only a factor of the RDBHistogram configuration.

The RDBHistogram includes a patch function that patches ```node-measured```, replacing it's Histogram algorithm with
a compatible RDBHistogram. To parch ```node-measured``` use the following:

```
var measured = require('measured');
var RDBHistogram = require('rdb-histogram');
RDBHistogram.patchMeasured(measured);
```

then one can use ```node-measured``` histogram in a compatible way -

```
var histogram = new measured.Histogram();
```

or

```
var collection = measured.createCollection();
var histogram = collection.histogram('metric-name');
```


## Configuration

The histogram accepts a single configuration object with the following properties:

* historyInterval - The length in mSec of a single time bucket. Defaults to 15000 - 15 seconds.
* historyLength - The number of time buckets to use. Defaults to 4 time buckets.
* minBucket - The minimal value, that anything under this value is considered as part of a single minimum bucket. Defaults to 1.
* mainScale - The number of buckets used between each scale (1..10). The default value of 5 ensures 40% (10^(1/5)) accuracy (before considering subScale).
* subScale - The number of sub-buckets used to breakdown an interesting bucket (a bucket that has one of the percentiles in the output statistics).
    The default value of 5 ensures accuracy of about 10% (10^(1/25)).
