var measured = require('measured');
var index = require('../index');
var expect = require('chai').expect;

index.patchMeasured(measured);

describe("node-measured patch", function () {

  it("should replace the measured.Histogram member", function() {
    expect(measured.Histogram).to.equal(index.rdbHistogram);
  });

  it("should replace the measured.Histogram constructor to create RDBHistogram instances", function() {
    var histogram = new measured.Histogram();
    expect(histogram).to.be.an.instanceOf(index.rdbHistogram);
  });

  it("should replace the measured.createCollection().histogram(<name>) to return RDBHistogram instances", function() {
    var histogram = measured.createCollection().histogram('h1');
    expect(histogram).to.be.an.instanceOf(index.rdbHistogram);
  });
});
