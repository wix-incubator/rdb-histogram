var measured = require('measured');
var RDBHistogram = require('../index');
var expect = require('chai').expect;

RDBHistogram.patchMeasured(measured);

describe("node-measured patch", function () {

  it("should replace the measured.Histogram member", function() {
    expect(measured.Histogram).to.equal(RDBHistogram);
  });

  it("should replace the measured.Histogram constructor to create RDBHistogram instances", function() {
    var histogram = new measured.Histogram();
    expect(histogram).to.be.an.instanceOf(RDBHistogram);
  });

  it("should replace the measured.createCollection().histogram(<name>) to return RDBHistogram instances", function() {
    var histogram = measured.createCollection().histogram('h1');
    expect(histogram).to.be.an.instanceOf(RDBHistogram);
  });
});
