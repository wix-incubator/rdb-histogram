# RDB vs Metrics histogram

[Node measured](https://github.com/felixge/node-measured) is a port of the java [metrics](https://github.com/dropwizard/metrics) library.
Both implementations (the javascript and java) support an histogram metric aggregate. In fact, both implementation use
 the same algorithm - sampling Exponentially Decaying Sampling using
[forward-decaying priority reservoir](http://dimacs.rutgers.edu/~graham/pubs/papers/fwddecay.pdf) with an exponential
weighting towards newer data.

However, the algorithm in use has a not so nice side-effect - when calculating percentiles over the samples, the high
percentiles (95%, 99% and 99.9%) tend to stay high for a long period of time after the sampled distribution has changed.
By long time we mean 5 minutes and sometimes even considerably longer then that.

The metrics histogram algorithm is based on an exponentially decaying sample algorithm who stores by default 1024 samples with some
decaying probability - that is, each time a new value is updated to the histogram, the histogram has a probability of keeping
the new value and dropping an old value. The probability of replacing a value grows as the value becomes older. The problem
with this algorithm is that it is not deterministic when a value will be dropped from the array - meaning that we are not ensured when
a large value will stop to be considered for a top percentile. Note that when keeping only 1024 values, the 99.9%tile is just
the 1023 number (ordered by size).

Lets see the issues in practice - given a model (which is explained below) we get the following measurements for one hour -

![Graph of the Metrics histogram](metrics-histogram.png?raw=true "Metrics Histogram")

The blue vertical lines indicate when behaviour change. The x-scale is using a 10-seconds scale (stupid scaling issues with excel).
The point is that 90 on the x-scale is 15 minutes.

A few things to notice -

1. The time it takes for higher percentiles (p99 and p999) to drop after a behaviour change is surprisingly long - about
2:20 minutes in one case, 5:00 minutes on the other case.

2. The max does not go down after the first peak - it stays up as a global max.

3. The min does not go up during the first peak - it stays down as a global min.

Using the same model, with the RDB Histogram we get the following graph:

![Graph of the Metrics histogram](rdb-histogram.png?raw=true "RDB Histogram")

## Bucket Histogram

In order to address those concerns we introduce a different histogram algorithm.

The bucket algorithm for computing histogram uses buckets of values with exponential size based on a power
(such as ```10^(1/25)~1.09```). The algorithm counts the number of events in each bucket and uses this count to estimate which
percentiles falls into which bucket. To approximate the actual percentile value it based on the bucket bounds using weighted
average between the bucket max and min, moralized by the relative position of the percentile in the bucket.

To achieve time-based histogram we use 5 histogram instances, one for each 15 seconds, and sum up the
 5 when asked to compute the last-minute histogram values.

The end result is a more accurate and predictable histogram over the time dimension with tunable accuracy over the value
dimension.

Again, running the histogram over the same model we get the following result

![Graph of the Rolling Bucket histogram with ß = 1.096](rolling-histogram-1.8.png?raw=true "Rolling Bucket Histogram 1.096")

A few things to note -

1. The time it takes for higher percentiles (p99 and p999) to drop after a behaviour change is deterministic and is 1 minute.

2. The max goes down after 1 minute to represent the last minute max.

3. The min goes up after 1 minute to represent the last minute min.


## Comparing node-measured (metrics) histogram algorithm with node-bucket-histogram algorithm

In order to compare the histograms we run a 1 hour model with 4 different distributions, each running for 15 minutes.
We then compare graph and summarize the different histograms and check how accurate the histograms are at representing
our model.

The following model is used:

![Graph of the model used to compare histograms](model.png?raw=true "Model")

| percent of values | 00:00 - 14:59 | 15:00 - 29:59 | 30:00 - 44:59 | 45:00 - 60:00 |
| ----------------- | ------------- | ------------- | ------------- | ------------- |
|   92%             |  40 - 50      |  90 - 110     |  70 - 90      |  40 - 50      |
|    6%             |  60 - 70      |  120 - 150    |  90 - 110     |  60 - 70      |
|  1.5%             |  70 - 80      |  150 - 200    |  110 - 140    |  70 - 80      |
|  0.5%             |  80 - 90      |  200 - 300    |  140 - 190    |  80 - 90      |

The values in each range are distributed linearly. When computing the expected percentiles for this model we get

| percentile   | 00:00 - 14:59 | 15:00 - 29:59 | 30:00 - 44:59 | 45:00 - 60:00 |
| ------------ | ------------- | ------------- | ------------- | ------------- |
| median       | 45.4          |  100.8        | 80.8          | 45.4          |
| 75%          | 48.1          |  106.3        | 86.3          | 48.1          |
| 95%          | 66.7          |  140          | 103.3         | 66.7          |
| 99%          | 76.7          |  183.3        | 130           | 76.7          |
| 99.9%        | 88            |  280          | 180           | 88            |

### Comparing Metrics Histogram with Bucket histogram

The results of running the metrics histogram are shown below

And the values are

| percentile   | 00:00 - 14:59 | 15:00 - 29:59 | 30:00 - 44:59 | 45:00 - 60:00 |
| ------------ | ------------- | ------------- | ------------- | ------------- |
| median       | 45.4          | 100.5         | 81.1          | 45.6          |
| 75%          | 48.2          | 106.1         | 86.6          | 48.5          |
| 95%          | 65.6          | 133.2         | 101.3         | 67.9          |
| 99%          | 77.0          | 177.2         | 129.5         | 79.1          |
| 99.9%        | 87.1          | 276.3         | 186.6         | 116.6         |


The results of running the rolling bucket histogram with bucket-size (ß) = 1.096 are shown below

And the values are

| percentile   | 00:00 - 14:59 | 15:00 - 29:59 | 30:00 - 44:59 | 45:00 - 60:00 |
| ------------ | ------------- | ------------- | ------------- | ------------- |
| median       | 45.4          | 100.8         | 80.9          | 45.4          |
| 75%          | 48.1          | 106.3         | 86.8          | 48.2          |
| 95%          | 65.0          | 135.2         | 100.0         | 65.1          |
| 99%          | 77.0          | 183.9         | 129.4         | 76.9          |
| 99.9%        | 87.9          | 279.6         | 179.9         | 87.9          |

