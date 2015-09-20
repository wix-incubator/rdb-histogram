# node-measured-ex

[Node measured]() is a port of the java [metrics]() library. Both implementations (the javascript and java) support an
 histogram metric that is sampling values to produce the histogram. However, in both implementations, the sampling
 histogram has issues with high percentile values lingering higher then they should for a period of time (see explanation
 below).

Node-measured-ex introduces a new implementation of an histogram that instead of doing sampling, calculates histogram based
on buckets of values with a rolling behaviour which produces an approximate histogram that has a better time-based
behaviour.

## comparing node-measured (Metrics) Histogram with node-measured-ex Histogram


## usage

