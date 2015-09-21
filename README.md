# node-measured-ex

[Node measured](https://github.com/felixge/node-measured) is a port of the java [metrics](https://github.com/dropwizard/metrics) library.
Both implementations (the javascript and java) support an histogram metric aggregate. In fact,  both implementation use
 the same algorithm - sampling Exponentially Decaying Sampling using
[forward-decaying priority reservoir](http://dimacs.rutgers.edu/~graham/pubs/papers/fwddecay.pdf) with an exponential
weighting towards newer data.

However, the algorithm in use has a not so nice side-effect - when calculating percentiles over the samples, the high
percentiles (95%, 99% and 99.9%) tend to stay high for a long period of time after the sampled distribution has changed.
By long time we mean 5 minutes and sometimes even considerably longer then that.

The Rolling Bucket Histogram is an alternative algorithm for computing histogram values based on buckets of values with
 exponential size based on a power (such as √2~1.41 or √√√2~1.09). The algorithm counts the number of events in each bucket
 and uses this count to estimate which percentiles falls into which bucket, then computes the approximate percentile value
 based on the bucket bounds. To achieve time-based histogram we use 5 histograms, one for each 15 seconds, and sum up the
 5 when asked for a last-minute histogram values (we use the fact that counts in buckets are additive).

The end result is a more accurate and predictable histogram over the time dimension with tunable accuracy over the value
dimension.

## Comparing node-measured (Metrics) Histogram algorithm with node-bucket-histogram algorithm

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

This model has the following percentile values

| percentile   | 00:00 - 14:59 | 15:00 - 29:59 | 30:00 - 44:59 | 45:00 - 60:00 |
| ------------ | ------------- | ------------- | ------------- | ------------- |
| median       | 45.4          |  100.8        | 80.8          | 45.4          |
| 75%          | 48.1          |  106.3        | 86.3          | 48.1          |
| 95%          | 66.7          |  140          | 103.3         | 66.7          |
| 99%          | 76.7          |  183.3        | 130           | 76.7          |
| 99.9%        | 88            |  280          | 180           | 88            |

### Metrics Histogram

The results of running the metrics histogram are shown below

![Graph of the Metrics histogram](metrics-histogram.png?raw=true "Metrics Histogram")

And the values are

| percentile   | 00:00 - 14:59 | 15:00 - 29:59 | 30:00 - 44:59 | 45:00 - 60:00 |
| ------------ | ------------- | ------------- | ------------- | ------------- |
| median       | 45.4 +- 0.2   | 100.5 +- 0.5  | 81.1 +- 0.6   | 45.6 +- 0.2   |
| 75%          | 48.2 +- 0.1   | 106.1 +- 0.3  | 86.6 +- 0.8   | 48.5 +- 1.6   |
| 95%          | 65.6 +- 0.9   | 133.2 +- 3.3  | 101.3 +- 3.2  | 67.9 +- 5.0   |
| 99%          | 77.0 +- 1.9   | 177.2 +- 8.4  | 129.5 +- 6.9  | 79.1 +- 5.4   |
| 99.9%        | 87.1 +- 2.1   | 276.3 +- 18.1 | 186.6 +- 33.9 | 116.6 +- 41.9 |


### Rolling Bucket Histogram with ß = 1.41

The results of running the rolling bucket histogram with bucket-size (ß) = 1.41 are shown below

![Graph of the Rolling Bucket histogram with ß = 1.41](rolling-bucket-histogram-1.41.png?raw=true "Rolling Bucket Histogram 1.41")

And the values are

| percentile   | 00:00 - 14:59 | 15:00 - 29:59 | 30:00 - 44:59 | 45:00 - 60:00 |
| ------------ | ------------- | ------------- | ------------- | ------------- |
| median       | 46.0 +- 0.1   | 100.5 +- 0.1  | 81.1 +- 0.1   | 45.6 +- 0.1   |
| 75%          | 56.1 +- 0.1   | 106.1 +- 0.1  | 86.6 +- 0.1   | 48.5 +- 0.1   |
| 95%          | 66.9 +- 0.6   | 133.2 +- 1.9  | 101.3 +- 0.6  | 67.9 +- 0.7   |
| 99%          | 85.3 +- 0.2   | 177.2 +- 4.8  | 129.5 +- 3.4  | 79.1 +- 0.2   |
| 99.9%        | 89.4 +- 0.1   | 276.3 +- 3.1  | 186.6 +- 1.6  | 116.6 +- 0.1  |


## usage

