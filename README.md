# node-measured-ex

[Node measured]() is a port of the java [metrics]() library. Both implementations (the javascript and java) support an
 histogram metric that is sampling values to produce the histogram. However, in both implementations, the sampling
 histogram has issues with high percentile values lingering higher then they should for a period of time (see explanation
 below).

Node-measured-ex introduces a new implementation of an histogram that instead of doing sampling, calculates histogram based
on buckets of values with a rolling behaviour which produces an approximate histogram that has a better time-based
behaviour.

In essence, we trade value accuracy with time based accuracy.

The metrics Histogram is ensured to produce a real sample value for a percentile. It does not ensure that that value is
the actually that percentile, only that it is probably close to the percentile. It also does not ensure when high percentiles
are reverted to smaller values - it only ensures that the decay is about 5 minutes.

The Rolling Bucket Histogram ensures accurate time based values - it decays within 1:00 - 1:15 minutes from high percentile
values. However, it approximates percentile values, an approximation that has variance as large as the ```bucketSize``` parameter.
When the ```bucketSize``` is set to 1.4, the variance can be up to 40% (but in practice it is lower).

## comparing node-measured (Metrics) Histogram with node-measured-ex Histogram

In order to compare the histograms we run a 1 hour long model with 4 different distributions, each running for 15 minutes.
We then compare graph and summarize the different histograms and check how accurate the histograms are at representing
our model. Our model does not use normalized distribution intentionally in order to simulate performance distributions
which tend to not be normally distributed.

The following model is used:

![Graph of the model used to compare histograms](raw/master/model.png "Model")

| percent of values | 00:00 - 14:59 | 15:00 - 29:59 | 30:00 - 44:59 | 45:00 - 60:00 |
-------------------------------------------------------------------------------------
|   92%             |  40 - 50      |  90 - 110     |  70 - 90      |  40 - 50      |
|    6%             |  60 - 70      |  120 - 150    |  90 - 110     |  60 - 70      |
|  1.5%             |  70 - 80      |  150 - 200    |  110 - 140    |  70 - 80      |
|  0.5%             |  80 - 90      |  200 - 300    |  140 - 190    |  80 - 90      |

This model has the following percentile values

| percentile   | 00:00 - 14:59 | 15:00 - 29:59 | 30:00 - 44:59 | 45:00 - 60:00 |
--------------------------------------------------------------------------------
| median       | 45.4          |  100.8        | 80.8          | 45.4          |
| 75%          | 48.1          |  106.3        | 86.3          | 48.1          |
| 95%          | 66.7          |  140          | 103.3         | 66.7          |
| 99%          | 76.7          |  183.3        | 130           | 76.7          |
| 99.9%        | 88            |  280          | 180           | 88            |

### Metrics Histogram

The results of running the metrics histogram are shown below

![Graph of the Metrics histogram](raw/master/metrics-histogram.png "Metrics Histogram")

And the values are

| percentile   | 00:00 - 14:59 | 15:00 - 29:59 | 30:00 - 44:59 | 45:00 - 60:00 |
--------------------------------------------------------------------------------
| median       | 45.4 +- 0.2   | 100.5 +- 0.5  | 81.1 +- 0.6   | 45.6 +- 0.2   |
| 75%          | 48.2 +- 0.1   | 106.1 +- 0.3  | 86.6 +- 0.8   | 48.5 +- 1.6   |
| 95%          | 65.6 +- 0.9   | 133.2 +- 3.3  | 101.3 +- 3.2  | 67.9 +- 5.0   |
| 99%          | 77.0 +- 1.9   | 177.2 +- 8.4  | 129.5 +- 6.9  | 79.1 +- 5.4   |
| 99.9%        | 87.1 +- 2.1   | 276.3 +- 18.1 | 186.6 +- 33.9 | 116.6 +- 41.9 |


### Rolling Bucket Histogram with ß = 1.41

The results of running the rolling bucket histogram with bucket-size (ß) = 1.41 are shown below

![Graph of the Rolling Bucket histogram with ß = 1.41](raw/master/rolling-bucket-histogram-1.41.png "Rolling Bucket Histogram 1.41")

And the values are

| percentile   | 00:00 - 14:59 | 15:00 - 29:59 | 30:00 - 44:59 | 45:00 - 60:00 |
--------------------------------------------------------------------------------
| median       | 46.0 +- 0.1   | 100.5 +- 0.1  | 81.1 +- 0.1   | 45.6 +- 0.1   |
| 75%          | 56.1 +- 0.1   | 106.1 +- 0.1  | 86.6 +- 0.1   | 48.5 +- 0.1   |
| 95%          | 66.9 +- 0.6   | 133.2 +- 1.9  | 101.3 +- 0.6  | 67.9 +- 0.7   |
| 99%          | 85.3 +- 0.2   | 177.2 +- 4.8  | 129.5 +- 3.4  | 79.1 +- 0.2   |
| 99.9%        | 89.4 +- 0.1   | 276.3 +- 3.1  | 186.6 +- 1.6  | 116.6 +- 0.1  |


## usage

