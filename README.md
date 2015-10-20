# RDBHistogram

RDBHistogram (Rolling Dynamic range Bucket Histogram) is an histogram algorithm that aims for high precision while preserving memory.
The Histogram is optimized for performance and latency use cases which tend to have distributions with large variance and
large values tend to be huge compared to the normal values.

For instance, a certain latency figure can have 10µSec minimum and 10µSec median with 10mSec 99%tile, 100mSec 99.9%tile and 1 Sec max
(in this case this is the latency of waiting on a Java blocking queue when there are available workers).

The RDBHistogram is optimized to measure such distributions and compute statistics to visualize how the distribution varies over time.

Statistics captured:

* max
* min
* median
* 75%tile
* 95%tile
* 99%tile
* 99.9%tile

With the default configuration, the RDBHistogram tracks 1:00 - 1:15 minutes of history to compute the statistics
(it uses 4 historic buckets of 15 seconds each plus one current bucket of between 0..15 seconds).
The default configuration ensures precision of about 10% in the computed percentile values.

## Why?

Read the comparison with the popular Metrics Histogram algorithm [here](metrics-vs-rdb.md).

## Usage


Create the histogram object

```
var RDBHistogram = require('../src/rdb-histogram');
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

## Configuration

The histogram accepts a single configuration object with the following properties:

* historyInterval - The length in mSec of a single time bucket. Defaults to 15000 - 15 seconds.
* historyLength - The number of time buckets to use. Defaults to 4 time buckets.
* minBucket - The minimal value, that anything under this value is considered as part of a single minimum bucket. Defaults to 1.
* mainScale - The number of buckets used between each scale (1..10). The default value of 5 ensures 40% (10^(1/5)) accuracy (before considering subScale).
* subScale - The number of sub-buckets used to breakdown an interesting bucket (a bucket that has one of the percentiles in the output statistics).
    The default value of 5 ensures accuracy of about 10% (10^(1/25)).
