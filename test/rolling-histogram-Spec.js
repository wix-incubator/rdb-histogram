// ignore the lint error of not having a function call.
// Mocha actually uses property getters as function calls (like .empty) and lint see those as errors by default
/*jshint -W030 */
var expect = require('chai').expect;
var RollingHistogram = require('../src/rolling-histogram');
var MockDate = require('mockdate');
var util = require('util');

describe("rolling histogram", function () {

  after(function () { MockDate.reset(); });


  it("should work as a regular histogram in a short timeframe", function() {
    var histogram = new RollingHistogram();
    for (var i=0; i < 101; i++)
      histogram.update(i);
    var stats = histogram.toJSON();
    expect(stats.count).to.be.equal(101);
    expect(stats.min).to.be.equal(0);
    expect(stats.max).to.be.equal(100);
    expect(stats.median).to.be.within(49, 51);
    expect(stats.p75).to.be.within(74, 76);
    expect(stats.p95).to.be.within(94, 96);
    expect(stats.p99).to.be.within(98, 100);
    expect(stats.p999).to.be.within(99, 100);
  });

  it("should retain all measurements within 1 minute", function() {
    MockDate.set("1/1/2000 00:00:00");
    var histogram = new RollingHistogram();
    for (var i=0; i < 101; i++)
      histogram.update(i);

    MockDate.set("1/1/2000 00:01:00");

    var stats = histogram.toJSON();
    expect(stats.count).to.be.equal(101);
    expect(stats.min).to.be.equal(0);
    expect(stats.max).to.be.equal(100);
    expect(stats.median).to.be.within(49, 51);
    expect(stats.p75).to.be.within(74, 76);
    expect(stats.p95).to.be.within(94, 96);
    expect(stats.p99).to.be.within(98, 100);
    expect(stats.p999).to.be.within(99, 100);
  });

  it("should consider all data points in 1 minute history as the same given uniform behavior", function() {
    MockDate.set("1/1/2000 00:00:00");
    var histogram = new RollingHistogram();
    for (var i=0; i < 100; i++) {
      if (i < 25)
        MockDate.set("1/1/2000 00:00:05");
      else if (i < 50)
        MockDate.set("1/1/2000 00:00:20");
      else if (i < 75)
        MockDate.set("1/1/2000 00:00:35");
      else
        MockDate.set("1/1/2000 00:00:50");
      // the *13 % 100 is required to make sure the distribution is uniform and consistent across the 1 minute
      histogram.update((i*13)%100);
    }

    MockDate.set("1/1/2000 00:01:00");

    var stats = histogram.toJSON();

    expect(stats.count).to.be.equal(100);
    expect(stats.numBuckets).to.be.equal(61);
    expect(stats.min).to.be.equal(0);
    expect(stats.max).to.be.equal(99);
    expect(stats.median).to.be.within(49, 51);
    expect(stats.p75).to.be.within(73, 77);
    expect(stats.p95).to.be.within(93, 97);
    expect(stats.p99).to.be.within(97, 99);
    expect(stats.p999).to.be.within(97, 99);
  });

  it("should focus on the percentiles after 15 seconds", function() {
    MockDate.set("1/1/2000 00:00:00");
    var histogram = new RollingHistogram();
    for (var i=0; i < 100; i++) {
      histogram.update((i*13)%100);
    }
    MockDate.set("1/1/2000 00:00:20");
    histogram.update(50);

    var focusBuckets = histogram.current.focusBuckets;
    expect(histogram.current.bucketBounds(focusBuckets[0])).to.be.deep.equal([39, 63]);
    expect(histogram.current.bucketBounds(focusBuckets[1])).to.be.deep.equal([63, 100]);
  });

  it("should clear all measurements within 1 minute and 15 seconds", function() {
    MockDate.set("1/1/2000 00:00:00");
    var histogram = new RollingHistogram();
    for (var i=0; i < 101; i++)
      histogram.update(i);

    MockDate.set("1/1/2000 00:01:16");

    var stats = histogram.toJSON();
    expect(stats.count).to.be.equal(0);
    expect(stats.min).to.be.undefined;
    expect(stats.max).to.be.undefined;
    expect(stats.median).to.be.undefined;
    expect(stats.p75).to.be.undefined;
    expect(stats.p95).to.be.undefined;
    expect(stats.p99).to.be.undefined;
    expect(stats.p999).to.be.undefined;
  });

  function normalRand() {
    return (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() +
      Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) / 10;
  }

  function model1() {
    var group = Math.random()*200;
    if (group < 92*2)
      return 40 + normalRand()*10;
    else if (group < (92+6)*2)
      return 60 + normalRand()*10;
    else if (group < (92+6+1.5)*2)
      return 70 + normalRand()*10;
    else
      return 80 + normalRand()*10;
  }

  it.only("compute percentiles within 10% accuracy (+-5%) for model 1 after 1:15 minute", function() {
    MockDate.set("1/1/2000 00:00:00");
    var values = [];
    function store(value) {
      values.push(value);
      return value;
    }
    var i;
    var histogram = new RollingHistogram();
    for (i=0; i < 10000; i++)
      histogram.update(model1());

    MockDate.set("1/1/2000 00:00:16");
    for (i=0; i < 10000; i++)
      histogram.update(store(model1()));

    MockDate.set("1/1/2000 00:00:31");
    for (i=0; i < 10000; i++)
      histogram.update(store(model1()));

    MockDate.set("1/1/2000 00:00:46");
    for (i=0; i < 10000; i++)
      histogram.update(store(model1()));

    MockDate.set("1/1/2000 00:01:01");
    for (i=0; i < 10000; i++)
      histogram.update(store(model1()));

    MockDate.set("1/1/2000 00:01:16");

    values.sort(function(a,b) {return a-b;});


    var max = values.reduce(function(agg, val) {return Math.max(agg, val);}, 0);
    var min = values.reduce(function(agg, val) {return Math.min(agg, val);}, 100000000);
    var median = values[Math.round(values.length/2)];
    var p75 = values[Math.round(values.length * 0.75)];
    var p95 = values[Math.round(values.length * 0.95)];
    var p99 = values[Math.round(values.length * 0.99)];
    var p999 = values[Math.round(values.length * 0.999)];

    var stats = histogram.toJSON();
    console.log(JSON.stringify(histogram.history[0].buckets));
    expect(stats.count).to.be.equal(values.length);
    expect(stats.min).to.be.equal(min);
    expect(stats.max).to.be.equal(max);
    expect(stats.median).to.be.within(median * 0.95, median * 1.05);
    expect(stats.p75).to.be.within(p75 * 0.95, p75 * 1.05);
    expect(stats.p95).to.be.within(p95 * 0.95, p95 * 1.05);
    expect(stats.p99).to.be.within(p99 * 0.95, p99 * 1.05);
    expect(stats.p999).to.be.within(p999 * 0.95, p999 * 1.05);
  });

});






