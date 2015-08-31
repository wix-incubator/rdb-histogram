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





