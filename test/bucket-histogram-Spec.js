// ignore the lint error of not having a function call.
// Mocha actually uses property getters as function calls (like .empty) and lint see those as errors by default
/*jshint -W030 */
var expect = require('chai').expect;
var Histogram = require('../src/bucket-histogram');

describe("histogram with uniform distribution 0..100", function () {

  var histogram = new Histogram();
  for (var i=0; i < 101; i++)
    histogram.update(i);

  it("should compute min 0", function () {
    expect(histogram.toJSON().min).to.be.equal(0);
  });

  it("should compute max 100", function () {
    expect(histogram.toJSON().max).to.be.equal(100);
  });

  it("should compute p50 to be within 49..51", function () {
    expect(histogram.toJSON().p50).to.be.within(49, 51);
  });

  it("should compute p75 to be within 74..76", function () {
    expect(histogram.toJSON().p75).to.be.within(74, 76);
  });

  it("should compute p95 to be within 94..96", function () {
    expect(histogram.toJSON().p95).to.be.within(94, 96);
  });

  it("should compute p99 to be within 98..100", function () {
    expect(histogram.toJSON().p99).to.be.within(98, 100);
  });

  it("should compute p999 to be within 99..100", function () {
    expect(histogram.toJSON().p999).to.be.within(99, 100);
  });
});

describe("histogram of spiky distribution 92% at 90-110, 6% at 900-1100, 1.5% at 1900-2100 and 0.5% at 3500-4500", function () {

  var histogram = new Histogram();
  for (var i=0; i < 10000; i++) {
    var group = i % 200;
    if (group < 92*2)
      histogram.update(90 + Math.random()*20);
    else if (group < (92+6)*2)
      histogram.update(900 + Math.random()*200);
    else if (group < (92+6+1.5)*2)
      histogram.update(1900 + Math.random()*200);
    else
      histogram.update(3500 + Math.random()*1000);
  }

  it("should compute min to be within 90..110", function () {
    expect(histogram.toJSON().min).to.be.within(90, 110);
  });

  it("should compute max to be within 3500..4500", function () {
    expect(histogram.toJSON().max).to.be.within(3500, 4500);
  });

  it("should compute p50 to be within 90..110", function () {
    expect(histogram.toJSON().p50).to.be.within(90, 110);
  });

  it("should compute p75 to be within 90..110", function () {
    expect(histogram.toJSON().p75).to.be.within(90, 110);
  });

  it("should compute p95 to be within 900..1100", function () {
    expect(histogram.toJSON().p95).to.be.within(900, 1100);
  });

  it("should compute p99 to be within 1900..2100", function () {
    expect(histogram.toJSON().p99).to.be.within(1900, 2100);
  });

  it("should compute p999 to be within 3500..4500", function () {
    expect(histogram.toJSON().p999).to.be.within(3500, 4500);
  });
});

describe("histogram minimal number of events", function () {

  it("should return empty for no events", function () {
    var histogram = new Histogram();
    expect(histogram.toJSON().count).to.be.equal(0);
  });

  it("should return all stats equal for one event", function () {
    var histogram = new Histogram();
    histogram.update(10);
    expect(histogram.toJSON().count).to.be.equal(1);
    expect(histogram.toJSON().max).to.be.equal(10);
    expect(histogram.toJSON().min).to.be.equal(10);
    expect(histogram.toJSON().p50).to.be.equal(10);
    expect(histogram.toJSON().p75).to.be.equal(10);
    expect(histogram.toJSON().p95).to.be.equal(10);
    expect(histogram.toJSON().p99).to.be.equal(10);
    expect(histogram.toJSON().p999).to.be.equal(10);
  });

});

describe("histogram add", function () {

  it("should add two empty histograms as empty", function () {
    var h1 = new Histogram();
    var h2 = new Histogram();
    h1.add(h2);
    expect(h1.toJSON().count).to.be.equal(0);
    expect(h1.toJSON().min).to.be.undefined;
    expect(h1.toJSON().max).to.be.undefined;
    expect(h1.toJSON().p50).to.be.undefined;
    expect(h1.toJSON().p75).to.be.undefined;
    expect(h1.toJSON().p95).to.be.undefined;
    expect(h1.toJSON().p99).to.be.undefined;
    expect(h1.toJSON().p999).to.be.undefined;
  });

  it("adding empty histogram to filled one should return the same histogram", function () {
    var h1 = new Histogram();
    var h2 = new Histogram();

    for (var i=0; i < 1000; i++)
      h1.update(100*Math.random());

    var json2 = h1.toJSON();
    h1.add(h2);
    var json1 = h1.toJSON();

    expect(json1.count).to.be.equal(json2.count);
    expect(json1.min).to.be.equal(json2.min);
    expect(json1.max).to.be.equal(json2.max);
    expect(json1.p50).to.be.equal(json2.p50);
    expect(json1.p75).to.be.equal(json2.p75);
    expect(json1.p95).to.be.equal(json2.p95);
    expect(json1.p99).to.be.equal(json2.p99);
    expect(json1.p999).to.be.equal(json2.p999);
  });

  it("adding filled histogram to an empty one should return the same histogram", function () {
    var h1 = new Histogram();
    var h2 = new Histogram();

    for (var i=0; i < 1000; i++)
      h1.update(100*Math.random());

    var json2 = h1.toJSON();
    h2.add(h1);

    var json1 = h2.toJSON();

    expect(json1.count).to.be.equal(json2.count);
    expect(json1.min).to.be.equal(json2.min);
    expect(json1.max).to.be.equal(json2.max);
    expect(json1.p50).to.be.equal(json2.p50);
    expect(json1.p75).to.be.equal(json2.p75);
    expect(json1.p95).to.be.equal(json2.p95);
    expect(json1.p99).to.be.equal(json2.p99);
    expect(json1.p999).to.be.equal(json2.p999);
  });

  it("adding 2 histogram return the added histogram", function () {
    var h1 = new Histogram();
    var h2 = new Histogram();

    for (var i=0; i < 100; i++)
      h1.update(i);

    for (i=100; i < 200; i++)
      h2.update(i);

    var json2 = h2.toJSON();
    var json1 = h1.toJSON();
    h2.add(h1);
    var json3 = h2.toJSON();

    expect(json3.count).to.be.equal(json1.count + json2.count);
    expect(json3.min).to.be.equal(Math.min(json1.min, json2.min));
    expect(json3.max).to.be.equal(Math.max(json1.max, json2.max));
    expect(json3.p50).to.be.within(99,101);
    expect(json3.p75).to.be.within(149,151);
    expect(json3.p95).to.be.within(189,191);
    expect(json3.p99).to.be.within(197,199);
    expect(json3.p999).to.be.within(198,199);
  });

});





