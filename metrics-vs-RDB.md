# RDB vs Metrics histogram

[Node measured](https://github.com/felixge/node-measured) is a port of the java [metrics](https://github.com/dropwizard/metrics) library.
Both implementations (the javascript and java) support an histogram metric aggregate. In fact, both implementation use
 the same algorithm - sampling Exponentially Decaying Sampling using
[forward-decaying priority reservoir](http://dimacs.rutgers.edu/~graham/pubs/papers/fwddecay.pdf) with an exponential
weighting towards newer data.

However, the algorithm in use has a not so nice side-effect - when calculating percentiles over the samples, the high
percentiles (95%, 99% and 99.9%) tend to stay high for a long period of time after the sampled distribution has changed.
By long time we mean 5 minutes and sometimes even considerably longer then that.

Lets see the issues in practice - given a model we get the following measurements for one hour -

![Graph of the Metrics histogram](metrics-histogram.png?raw=true "Metrics Histogram")

The blue vertical lines indicate behaviour change of the model. The x-scale is using a 10-seconds scale (stupid excel scaling issues).
Keep in mind that 90 on the x-scale is 900 seconds or 15 minutes.

A few things to notice -

1. The time it takes for higher percentiles (p99 and p999) to drop after a behaviour change is surprisingly long and non consistent - about
2:20 minutes in one case, 5:00 minutes on the other case.

2. The max does not go down after the first peak - it stays up as a global max.

3. The min does not go up during the first peak - it stays down as a global min.

Using the same model, with the RDB Histogram we get the following graph:

![Graph of the RDB histogram](rdb-histogram.png?raw=true "RDB Histogram")

And the model itself makes the following graph:

![Graph of the Model histogram](model.png?raw=true "Model Histogram")


## Metrics Histogram discussion

The problems we see with the Metrics histogram are precision limitations of the Metrics histogram sampling algorithm.

The metrics histogram offers 4 sampling algorithms to select from, but in most cases everyone are using the default algorithm
[Exponentially Decaying Reservoirs](http://metrics.dropwizard.io/3.1.0/manual/core/#exponentially-decaying-reservoirs).
In fact, the Javascript version offer only this algorithm. It should be noted that the other algorithms are either not time sensitive
or introduce potential memory issues.

The Exponentially Decaying Reservoir is in turn based on the [Forward Decaying Priority Reservior](http://dimacs.rutgers.edu/~graham/pubs/papers/fwddecay.pdf)
algorithm that stores a fixed number of samples (1024 in the default configuration of the Metrics histogram) with some
decaying probability. Each time a new value (sample) is added (updated) to the histogram, the histogram has a probability of replacing
one sample with the new sample. The probability of replacing a sample grows as the sample becomes older.

The challenge with this algorithm is that it is not deterministic when a sample will be dropped - it is just probably that a value will be
 dropped within 5 minutes, depending on the rate of samples coming in to the histogram. Nothing ensures that samples are actually dropped
 from the histogram after a fixed time (like, a minute or 5 minute). In the case of high percentile values who are based on few samples
 (the 99.9%tile is based on 2 samples, the 99%tile is based on 11) it is probable that samples a few high samples will linger for a long time
 in the histogram showing the behaviour we see above - the percentiles 99% and 99.9% take time to reflect the change in our model.

## The RDB Histogram

The RDB Histogram algorithm aims at solving the problems we see with the Metrics Histogram by requiring higher precision in both the
time and value dimensions.

For simplicity, the discussion below is done using the RDB Histogram default configuration.

On the time dimension, the RDB Histogram uses 4 historic time buckets for every 15 seconds plus a single current bucket for the current 15 seconds.
 At any point in time, it considers the 4 historic buckets (measuring for exactly a minute) and one current bucket measuring 0..15 seconds.
 This amounts to computing the percentiles based on between 1:00 and 1:15 minutes - a predictable and fixed time precision.

On the value dimension, the RDB histogram is using multiple buckets to count the number of samples in a range. The size of the buckets
 determine the accuracy of the histogram - the smaller buckets the histogram is more accurate but requires more memory.
 With the default configuration we use 5 buckets and 5 sub-buckets for each scale (every power of 10).
 5 buckets and 5 sub-buckets results in sub-bucket size of ```1 .. 10^(1/25) ~ 1.1``` ensuring a precision of 10%.

The histogram is using buckets and sub buckets to preserve memory. By using 5 buckets per scale and sub-buckets only when needed we minimise
the amount of used memory. Sub-buckets are only introduced for the buckets that are interesting - that one of the percentiles we compute
falls within  for the buckets that that bucket.

In fact, then number of buckets is limited to ```5 * (9 * 5 + 5) = 750``` buckets, each bucket storing 3 numbers resulting in ```750``` numbers.
The 750 numbers of RDB Histogram is lower then the ```1024 * 2 = 2048``` numbers of Metrics Histogram.

The RDB histogram number 750 comes from having 5 time buckets times 5 buckets per power of 10 assuming 9 powers of 10 (between 1 and 1,000,000,000 -
the range of an integer and the range between the nano-second scale and the seconds scale).
and 5 sub-buckets. This amounts to 250 buckets - times 3 numbers per bucket we get 750 numbers. The Metrics Histogram number of 2048 comes from storing two numbers for each sample -
the value and probability of the value to linger).

One more trick the RDB histogram is using to enhance accuracy is track the min and max for each bucket and sub-bucket making sure to
 not predict percentile values that are out of the real samples range due to the built in in-accuracy.


