// ignore the lint error of not having a function call.
// Mocha actually uses property getters as function calls (like .empty) and lint see those as errors by default
/*jshint -W030 */
var expect = require('chai').expect;
var Histogram = require('../src/dynamic-bucket-histogram');

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

  it("should compute median to be within 49..51", function () {
    expect(histogram.toJSON().median).to.be.within(49, 51);
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

// a model of data generated using 10^(1+2*rand())
var aModelStats = {
  median: 103.98,
  p75: 305.86,
  p95: 780.26,
  p99: 964.7,
  p999: 995.24
};
var aModel = [12.34, 143.33, 136.77, 28.67, 83.92, 117.31, 212.12, 45.77, 363.97, 32.39, 611.01, 19.94, 29.61, 153.67, 10.13, 12.59,
  71.31, 37.04, 49.66, 123.07, 279.78, 172.91, 94.56, 671.64, 160.41, 75.02, 51.14, 34.98, 219.65, 208.22, 642.97, 85.3, 26.51, 139.24,
  369.36, 734.66, 20.14, 12.79, 72.38, 15.89, 106.26, 39.48, 69.19, 120.13, 12.37, 233.4, 13.45, 104.89, 155.68, 144.07, 42.24, 413.53,
  61.53, 38.57, 20.76, 65.64, 118.36, 191.29, 19.99, 78.48, 107.51, 784.77, 199.07, 677.73, 10.99, 18.81, 421.95, 647.25, 619.53, 24.79,
  110.25, 64.83, 14.82, 461.7, 19.84, 17.4, 85.42, 19.79, 62.36, 65.97, 35.21, 680.95, 352.37, 305.86, 55.53, 82.2, 133.66, 33.63, 987.04,
  968.71, 11.44, 401.43, 562.35, 717.02, 11.56, 105.27, 126.32, 266.05, 19.05, 11.04, 109.55, 785.81, 836.29, 225.51, 93.19, 184.77,
  37.27, 121.93, 10.96, 68.37, 188.93, 227.94, 211.68, 347.05, 477.23, 33.84, 174.62, 281.05, 10.71, 12.51, 32.52, 503.77, 80.46, 485.99,
  39.95, 716.49, 45.72, 46.38, 83.98, 201.85, 382.04, 254.31, 178.52, 19.43, 251.76, 986.06, 43.42, 56.05, 232.62, 965.37, 450.79, 246.64,
  46.76, 153.16, 771.34, 662.91, 91.64, 199, 70.58, 91.52, 615.24, 917.6, 30.48, 392.74, 62.74, 14.4, 125.69, 14.27, 126.89, 158.44, 88.91,
  368.85, 172.27, 385.07, 422.87, 33.33, 408.88, 81.8, 198.45, 31.82, 25.81, 307.1, 47.63, 99.49, 353.86, 158.33, 15.4, 231.22, 619.57,
  649.4, 275.99, 67.96, 102.56, 530.8, 18.04, 21.61, 103.01, 11.8, 42.59, 379.97, 168.5, 60.91, 62.33, 695.4, 168.72, 11.02, 136.65,
  298.86, 51.29, 153.21, 66.06, 70.18, 192.71, 501.87, 15.76, 13.53, 14.99, 651.63, 47.61, 17.77, 25.6, 64.41, 674.53, 74.81, 38.01,
  480.08, 17.39, 10.57, 57.45, 18.24, 138.54, 336.55, 265.07, 129.03, 134.08, 124.68, 11.35, 14.52, 158.67, 26.45, 39.37, 14.17, 24.19,
  39.46, 234.02, 852.13, 123.51, 602.33, 40.36, 862.53, 56.24, 877.28, 255.99, 99.72, 17.51, 273.99, 12.54, 88.85, 843.02, 234.25, 88.77,
  179.88, 50.17, 149.5, 110.68, 87.5, 71.89, 13.44, 22.08, 36.76, 202.97, 20.71, 249.43, 370.06, 63.99, 75.43, 868.62, 340.59, 36.97,
  31.63, 17.09, 125.88, 17.64, 48.62, 347.58, 107.98, 49.38, 100.98, 522.98, 18.6, 44.38, 981.47, 731.95, 227.75, 180.19, 26.55, 76.28,
  995.24, 43.5, 711.81, 404.55, 39.13, 33.67, 10.13, 142.26, 551.51, 92.81, 39.87, 107.91, 996.28, 28.21, 224.9, 24.68, 12.28, 190.56,
  304.73, 222.79, 29.82, 255.07, 14.95, 17.07, 573.17, 73.94, 109.3, 253.1, 28.67, 64.72, 33.48, 15.06, 152.65, 33.9, 52.64, 143.94,
  23.94, 162.32, 202.09, 12.34, 113.45, 169.43, 264.21, 312.76, 117.62, 149.19, 191.89, 484.63, 126.18, 40.55, 161.51, 837.86, 77.03,
  107.51, 18.99, 11.43, 13.73, 347.44, 51.97, 131.37, 880.51, 477.57, 25.98, 903.51, 134.17, 50.84, 276.47, 38.15, 77.21, 23.06, 18.65,
  79.12, 165.91, 657.68, 40.85, 24.32, 102.37, 113.07, 336.73, 235.81, 27.82, 884.81, 39.87, 74.57, 10.02, 172.13, 13.75, 11.53, 21.13,
  88.89, 253.56, 28.05, 344.31, 347.89, 832.3, 16.26, 35.1, 359.03, 58.06, 735.33, 47.78, 368.22, 27.22, 882.02, 23.94, 544.15, 31.51,
  535.32, 21.25, 800.26, 70.91, 31.47, 68.62, 65.62, 17.87, 644.24, 639.07, 484.32, 433.49, 17.06, 597, 21.15, 34.64, 43.83, 597.5,
  121.06, 16.86, 495.5, 841.38, 72.31, 256.24, 16.27, 111.43, 177.74, 63.41, 18.39, 738.12, 801.35, 88.57, 20.93, 23.61, 31.41, 239.29,
  12.13, 37.68, 411, 317.29, 309.36, 118.79, 265.42, 11.37, 115.58, 18.86, 64.45, 184.85, 56.88, 947.57, 355.3, 432.88, 15.28, 165.04,
  897.38, 49.98, 440.38, 64.82, 10.71, 192.48, 19.75, 56.82, 145.16, 291.13, 37.41, 396.69, 34.62, 526.41, 814.04, 212.41, 23.79, 638.99,
  640.74, 180.32, 55.98, 17.58, 786.66, 279.94, 463.91, 20.57, 12.06, 750.55, 46.9, 49.64, 469.52, 13.48, 18.47, 13.47, 173.8, 126.74,
  238.18, 31.7, 80.72, 180.03, 29.42, 13.73, 339.47, 130.47, 353.19, 109.3, 254.72, 17.72, 934.27, 10.83, 29.54, 246.1, 313.13, 200.35,
  30.17, 51.57, 782.03, 225.59, 575.3, 21.76, 172.85, 347.45, 29.97, 16.33, 501, 76.63, 562, 104.16, 47.31, 988.78, 25.5, 37.25, 21.41,
  507.71, 156.49, 225.03, 76.55, 108.61, 21.88, 321.95, 13.76, 36.47, 191.41, 273.49, 394.16, 457.18, 17.32, 553.8, 117.78, 45.47, 47.66,
  176.5, 545.39, 21.5, 117.85, 85.39, 378.95, 480.04, 216.62, 275.9, 49.79, 43.91, 41.01, 10.18, 261.85, 88.59, 10.57, 337.85, 187.97,
  21.25, 694.95, 181.12, 580.32, 848.97, 406.68, 287.19, 13.29, 56.68, 14.11, 201.12, 11.16, 15.32, 461.15, 19.92, 67.09, 14.75, 24.42,
  519.12, 158.42, 103.98, 174.28, 360.53, 186.83, 957.04, 330.68, 10.06, 31.99, 25.76, 88.6, 26.27, 74.54, 32.26, 206.44, 185.5, 924.7,
  16.08, 41.12, 44.91, 34.54, 491.12, 15.81, 980.59, 15.74, 115.84, 127.09, 18.13, 38.43, 15.38, 26.82, 28.05, 90.8, 769.76, 26.32, 34.84,
  218.79, 306.91, 524.37, 290.84, 543.98, 565.5, 47.54, 634.27, 534.7, 18.49, 18.79, 291.62, 53.84, 402.61, 113.29, 22.62, 62.79, 10.45,
  129.04, 311.24, 964.7, 392.46, 11.56, 372.03, 28.89, 36.21, 62.95, 11.7, 32.09, 192.95, 829.49, 285.34, 20.79, 961.43, 13.36, 178.71,
  12.02, 780.26, 11.47, 176.32, 271.33, 115.05, 378.03, 144.49, 147.58, 192.11, 91.29, 375.27, 486.94, 706.43, 45.6, 45.05, 632.58, 20.53,
  16.44, 199.03, 11.06, 39.86, 408.81, 316.26, 680.14, 915.68, 57.43, 104.05, 319.48, 63.94, 688.01, 622.5, 371.11, 313.67, 11.93, 506.34,
  68.73, 61.59, 25.33, 14.63, 73.68, 42.06, 287.28, 11.3, 969.1, 27.99, 24.84, 923.37, 17.13, 18.76, 19.49, 68.4, 126.62, 200.47, 356.53,
  611.8, 226.59, 49.03, 10.39, 619.23, 273.4, 311.13, 22.2, 39.7, 255.96, 18.77, 70.67, 689.37, 29.15, 120.82, 118.08, 362.47, 170.29, 33.14,
  633.44, 63.52, 36.52, 14.95, 690.62, 341.14, 615.22, 444.27, 226.49, 86.77, 479.73, 950.59, 84.33, 32.14, 14.74, 106.98, 327.33, 11.1,
  182.02, 112.05, 268.95, 451.15, 22.88, 157.48, 13.59, 234.16, 12.33, 116.34, 82.85, 20.99, 282.1, 21.39, 11.23, 10.65, 92.26, 347.81,
  16.09, 319, 22.54, 17.94, 17.2, 12.37, 111.52, 224.58, 19.18, 585.58, 113.95, 129.96, 56.44, 530.97, 41.05, 41.64, 38.2, 43.92, 774.1,
  90.14, 219.92, 368.72, 429.58, 129.86, 52.93, 115.34, 715.75, 55.83, 216.54, 138.41, 468.06, 108.59, 88.1, 24.58, 159.9, 37.3, 63.81,
  42.05, 76.19, 29.55, 18, 393.25, 119.13, 34.65, 13.05, 96.13, 710.84, 169.4, 255.94, 896.6, 12.94, 546.36, 39.54, 37.25, 78.09, 23.56,
  692.71, 724.93, 157.75, 12.49, 57.05, 916.12, 10.53, 69.01, 115.68, 326.32, 804.41, 332.78, 174.25, 310.7, 35.07, 31.6, 301.95, 10.04,
  15.29, 829.96, 103.56, 29.17, 97.22, 180.81, 13.25, 76.8, 57.25, 400.49, 11.05, 322.11, 70.46, 354.99, 110.08, 565.86, 21.32, 300.16,
  60.56, 24.57, 16.88, 31.48, 31.03, 38.31, 12.41, 73.26, 15.18, 19.72, 62.83, 327.01, 32.79, 102.45, 42.81, 243.68, 246.09, 13.62, 41.1,
  71.65, 133.02, 664.07, 225.4, 43.96, 23.41, 22.22, 633.33, 117.13, 17.64, 33.52, 92.63, 312.13, 23.84, 18.17, 19.11, 37.45, 131.01, 319.69,
  96.37, 25.18, 100.55, 22.14, 696.8, 493.66, 282.09, 438.92, 246.15, 18.25, 16.37, 118.38, 130.32, 82.08, 26.32, 89.92, 13.76, 198.38, 76.08,
  591.95, 206.89, 201.61, 19.14, 94.2, 76.94, 232.33, 27.23, 170.4, 39.91, 131.79, 475.46, 413.45, 11.74, 110.67, 14.2, 14.65, 51.46, 767.71,
  450.94, 56.04, 543.13, 92.79, 362.72, 182.75, 52.12, 17.71, 47.31, 14.28, 917, 330.29, 64.73, 46.88, 29.07, 12.89, 117.66, 33.73, 24.49,
  13.51, 270.06, 30.02, 90.54, 278.61, 307.36, 74.69, 121.05, 407.74, 116.5, 205.71, 129.87, 550.55, 12.58, 425.34, 832.89, 21.86, 799.63,
  138.98, 153.89, 317.43, 92.33, 41.1, 242.12, 58.36, 13.06, 33.14, 218.03, 37.55, 67.52, 64.11, 49.64, 13.85, 188.56, 648.67, 30.55, 31.69,
  59.43, 25.06, 137.05, 64.95, 300.09, 771.93, 235.84, 548.57, 66.03, 264.8, 307.51, 95.33, 709.73, 350.01, 80.92, 18.91, 236.68, 19.76, 277.42];

describe("histogram precision with default config (mainScale = 5)", function () {

  var histogram = new Histogram();
  for (var i=0; i < aModel.length; i++)
    histogram.update(aModel[i]);
  var stats = histogram.toJSON();

  var buckets = {
    median: [100,159],
    p75: [251, 398],
    p95: [630, 1000],
    p99: [630, 1000],
    p999: [630, 1000]
  };

  it("should compute median "+aModelStats.median+" to be within the range "+buckets.median[0]+" - "+buckets.median[1]+". Got " + stats.median, function () {
    expect(stats.median).to.be.within(buckets.median[0], buckets.median[1]);
  });

  it("should compute p75 "+aModelStats.p75+" to be within the range "+buckets.p75[0]+" - "+buckets.p75[1]+". Got " + stats.p75, function () {
    expect(stats.p75).to.be.within(buckets.p75[0], buckets.p75[1]);
  });

  it("should compute p95 "+aModelStats.p95+" to be within the range "+buckets.p95[0]+" - "+buckets.p95[1]+". Got " + stats.p95, function () {
    expect(stats.p95).to.be.within(buckets.p95[0], buckets.p95[1]);
  });

  it("should compute p99 "+aModelStats.p99+" to be within the range "+buckets.p99[0]+" - "+buckets.p99[1]+". Got " + stats.p99, function () {
    expect(stats.p99).to.be.within(buckets.p99[0], buckets.p99[1]);
  });

  it("should compute p999 "+aModelStats.p999+" to be within the range "+buckets.p999[0]+" - "+buckets.p999[1]+". Got " + stats.p999, function () {
    expect(stats.p999).to.be.within(buckets.p999[0], buckets.p999[1]);
  });

});

describe("histogram precision with precision scale (mainScale = 25)", function () {

  var histogram = new Histogram({mainScale: 25});
  for (var i=0; i < aModel.length; i++)
    histogram.update(aModel[i]);
  var stats = histogram.toJSON();

  var buckets = {
    median: [100, 109],
    p75: [301, 331],
    p95: [758, 831],
    p99: [912, 1000],
    p999: [912, 1000]
  };

  it("should compute median "+aModelStats.median+" to be within the range "+buckets.median[0]+" - "+buckets.median[1]+". Got " + stats.median, function () {
    expect(stats.median).to.be.within(buckets.median[0], buckets.median[1]);
  });

  it("should compute p75 "+aModelStats.p75+" to be within the range "+buckets.p75[0]+" - "+buckets.p75[1]+". Got " + stats.p75, function () {
    expect(stats.p75).to.be.within(buckets.p75[0], buckets.p75[1]);
  });

  it("should compute p95 "+aModelStats.p95+" to be within the range "+buckets.p95[0]+" - "+buckets.p95[1]+". Got " + stats.p95, function () {
    expect(stats.p95).to.be.within(buckets.p95[0], buckets.p95[1]);
  });

  it("should compute p99 "+aModelStats.p99+" to be within the range "+buckets.p99[0]+" - "+buckets.p99[1]+". Got " + stats.p99, function () {
    expect(stats.p99).to.be.within(buckets.p99[0], buckets.p99[1]);
  });

  it("should compute p999 "+aModelStats.p999+" to be within the range "+buckets.p999[0]+" - "+buckets.p999[1]+". Got " + stats.p999, function () {
    expect(stats.p999).to.be.within(buckets.p999[0], buckets.p999[1]);
  });
});

describe("histogram precision with precision focus on median and percentiles (mainScale = 5, subScale=5)", function () {

  var histogram = new Histogram({focusBuckets: [11, 13, 15]});
  for (var i=0; i < aModel.length; i++)
    histogram.update(aModel[i]);
  var stats = histogram.toJSON();

  var buckets = {
    median: [100, 109],
    p75: [301, 331],
    p95: [758, 831],
    p99: [912, 1000],
    p999: [912, 1000]
  };

  it("should compute median "+aModelStats.median+" to be within the range "+buckets.median[0]+" - "+buckets.median[1]+". Got " + stats.median, function () {
    expect(stats.median).to.be.within(buckets.median[0], buckets.median[1]);
  });

  it("should compute p75 "+aModelStats.p75+" to be within the range "+buckets.p75[0]+" - "+buckets.p75[1]+". Got " + stats.p75, function () {
    expect(stats.p75).to.be.within(buckets.p75[0], buckets.p75[1]);
  });

  it("should compute p95 "+aModelStats.p95+" to be within the range "+buckets.p95[0]+" - "+buckets.p95[1]+". Got " + stats.p95, function () {
    expect(stats.p95).to.be.within(buckets.p95[0], buckets.p95[1]);
  });

  it("should compute p99 "+aModelStats.p99+" to be within the range "+buckets.p99[0]+" - "+buckets.p99[1]+". Got " + stats.p99, function () {
    expect(stats.p99).to.be.within(buckets.p99[0], buckets.p99[1]);
  });

  it("should compute p999 "+aModelStats.p999+" to be within the range "+buckets.p999[0]+" - "+buckets.p999[1]+". Got " + stats.p999, function () {
    expect(stats.p999).to.be.within(buckets.p999[0], buckets.p999[1]);
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

  it("should compute median to be within 90..110", function () {
    expect(histogram.toJSON().median).to.be.within(90, 110);
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
    expect(histogram.toJSON().median).to.be.equal(10);
    expect(histogram.toJSON().p75).to.be.equal(10);
    expect(histogram.toJSON().p95).to.be.equal(10);
    expect(histogram.toJSON().p99).to.be.equal(10);
    expect(histogram.toJSON().p999).to.be.equal(10);
  });

});

describe("histogram add", function () {

  it("adding two empty histograms should return an empty histogram", function () {
    var h1 = new Histogram();
    var h2 = new Histogram();
    var h3 = h1.add(h2);
    expect(h3.toJSON().count).to.be.equal(0);
    expect(h3.toJSON().min).to.be.undefined;
    expect(h3.toJSON().max).to.be.undefined;
    expect(h3.toJSON().median).to.be.undefined;
    expect(h3.toJSON().p75).to.be.undefined;
    expect(h3.toJSON().p95).to.be.undefined;
    expect(h3.toJSON().p99).to.be.undefined;
    expect(h3.toJSON().p999).to.be.undefined;
  });

  it("adding empty histogram to filled one should produce an histogram equivalent to the filled one", function () {
    var h1 = new Histogram();
    var h2 = new Histogram();

    for (var i=0; i < 1000; i++)
      h1.update(100*Math.random());

    var json2 = h1.toJSON();
    var h3 = h1.add(h2);
    var json1 = h3.toJSON();

    expect(json1.count).to.be.equal(json2.count);
    expect(json1.min).to.be.equal(json2.min);
    expect(json1.max).to.be.equal(json2.max);
    expect(json1.median).to.be.equal(json2.median);
    expect(json1.p75).to.be.equal(json2.p75);
    expect(json1.p95).to.be.equal(json2.p95);
    expect(json1.p99).to.be.equal(json2.p99);
    expect(json1.p999).to.be.equal(json2.p999);
  });

  it("adding filled histogram to an empty one should produce an histogram equivalent to the filled one", function () {
    var h1 = new Histogram();
    var h2 = new Histogram();

    for (var i=0; i < 1000; i++)
      h1.update(100*Math.random());

    var json2 = h1.toJSON();
    var h3 = h2.add(h1);

    var json1 = h3.toJSON();

    expect(json1.count).to.be.equal(json2.count);
    expect(json1.min).to.be.equal(json2.min);
    expect(json1.max).to.be.equal(json2.max);
    expect(json1.median).to.be.equal(json2.median);
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
    var h3 = h2.add(h1);
    var json3 = h3.toJSON();

    expect(json3.count).to.be.equal(json1.count + json2.count);
    expect(json3.min).to.be.equal(Math.min(json1.min, json2.min));
    expect(json3.max).to.be.equal(Math.max(json1.max, json2.max));
    expect(json3.median).to.be.within(99,101);
    expect(json3.p75).to.be.within(149,151);
    expect(json3.p95).to.be.within(189,191);
    expect(json3.p99).to.be.within(197,199);
    expect(json3.p999).to.be.within(198,199);
  });

  it("adding empty bucket with regular bucket", function() {
    var h1 = new Histogram({focusBuckets: [7,8]});
    var h2 = new Histogram({focusBuckets: [7,9]});

    h1.buckets[4] = {count: 10, min: 4, max: 6};

    var h3 = h2.add(h1);

    expect(h3.buckets[4].count).to.be.equal(10);
    expect(h3.buckets[4].min).to.be.equal(4);
    expect(h3.buckets[4].max).to.be.equal(6);
  });

  it("adding empty bucket with high precision bucket", function() {
    var h1 = new Histogram({focusBuckets: [7,8]});
    var h2 = new Histogram({focusBuckets: [7,9]});

    h1.buckets[4] = {
      count: 10, min: 4,max: 6,
      subBuckets: [
        {count: 5, min: 4, max: 5},
        {count: 5, min: 6, max: 6}]
    };

    var h3 = h2.add(h1);

    expect(h3.buckets[4].count).to.be.equal(10);
    expect(h3.buckets[4].min).to.be.equal(4);
    expect(h3.buckets[4].max).to.be.equal(6);
    expect(h3.buckets[4].subBuckets.length).to.be.equal(2);
    expect(h3.buckets[4].subBuckets[0].count).to.be.equal(5);
    expect(h3.buckets[4].subBuckets[0].min).to.be.equal(4);
    expect(h3.buckets[4].subBuckets[0].max).to.be.equal(5);
    expect(h3.buckets[4].subBuckets[1].count).to.be.equal(5);
    expect(h3.buckets[4].subBuckets[1].min).to.be.equal(6);
    expect(h3.buckets[4].subBuckets[1].max).to.be.equal(6);
  });

  it("adding regular bucket with high precision bucket", function() {
    var h1 = new Histogram({}, [7,8]);
    var h2 = new Histogram({}, [7,9]);

    h1.buckets[8] = {
      count: 12, min: 26, max: 39,
      subBuckets: [
        {count: 2, min: 26, max: 27},
        {count: 2, min: 28, max: 30},
        {count: 6, min: 31, max: 32},
        {count: 1, min: 33, max: 36},
        {count: 1, min: 37, max: 39}
      ]
    };
    h2.buckets[8] = {count: 6, min: 26, max: 39};

    var h3 = h2.add(h1);

    expect(h3.buckets[8].count).to.be.equal(18);
    expect(h3.buckets[8].min).to.be.equal(26);
    expect(h3.buckets[8].max).to.be.equal(39);
    expect(h3.buckets[8].subBuckets.length).to.be.equal(5);
    expect(h3.buckets[8].subBuckets[0]).to.be.deep.equal({count: 3, min: 26, max: 27});
    expect(h3.buckets[8].subBuckets[1]).to.be.deep.equal({count: 3, min: 28, max: 30});
    expect(h3.buckets[8].subBuckets[2]).to.be.deep.equal({count: 10, min: 31, max: 32});
    expect(h3.buckets[8].subBuckets[3]).to.be.deep.equal({count: 1, min: 33, max: 36});
    expect(h3.buckets[8].subBuckets[4]).to.be.deep.equal({count: 1, min: 37, max: 39});
  });

  it("adding two high precision buckets", function() {
    var h1 = new Histogram({focusBuckets: [7,8]});
    var h2 = new Histogram({focusBuckets: [7,9]});

    h1.buckets[8] = {
      count: 12, min: 26, max: 39,
      subBuckets: [
        {count: 2, min: 26, max: 27},
        {count: 2, min: 28, max: 30},
        {count: 6, min: 31, max: 32},
        {count: 1, min: 33, max: 36},
        {count: 1, min: 37, max: 39}
      ]
    };
    h2.buckets[8] = {
      count: 20, min: 26, max: 39,
      subBuckets: [
        {count: 5, min: 26, max: 27},
        {count: 10, min: 28, max: 30},
        {count: 2, min: 31, max: 32},
        undefined,
        {count: 3, min: 37, max: 39}
      ]
    };

    var h3 = h2.add(h1);

    expect(h3.buckets[8].count).to.be.equal(32);
    expect(h3.buckets[8].min).to.be.equal(26);
    expect(h3.buckets[8].max).to.be.equal(39);
    expect(h3.buckets[8].subBuckets.length).to.be.equal(5);
    expect(h3.buckets[8].subBuckets[0]).to.be.deep.equal({count: 7, min: 26, max: 27});
    expect(h3.buckets[8].subBuckets[1]).to.be.deep.equal({count: 12, min: 28, max: 30});
    expect(h3.buckets[8].subBuckets[2]).to.be.deep.equal({count: 8, min: 31, max: 32});
    expect(h3.buckets[8].subBuckets[3]).to.be.deep.equal({count: 1, min: 33, max: 36});
    expect(h3.buckets[8].subBuckets[4]).to.be.deep.equal({count: 4, min: 37, max: 39});
  });

  it("adding 2 histograms with focus buckets", function () {
    var h1 = new Histogram({}, [7,8]);
    var h2 = new Histogram({}, [7,9]);

    for (var i=0; i < 100; i++)
      h1.update(i);

    for (i=0; i < 100; i++)
      h2.update(i);

    // at this point, the histograms have the following buckets
    // h1: [1, 1, 1, 1, 3, 3, 6,  {10, [1, 2, 1, 2, 2, 2]}, {14, [2, 3, 2, 4, 3]},  24,                         36
    // h2: [1, 1, 1, 1, 3, 3, 6,  {10, [1, 2, 1, 2, 2, 2]},  14,                   {24, [3, 4,  5,  5,  5, 2]}, 36

    // after adding, h2 should have
    // h2: [2, 2, 2, 2, 6, 6, 12, {20, [2, 4, 2, 4, 4, 4]}, {28, [4, 6, 4, 8, 6]}, {48, [6, 8, 10, 10, 10, 4]}, 72

    var h3 = h2.add(h1);

    expect(h3.buckets[0].count).to.be.equal(2);
    expect(h3.buckets[1].count).to.be.equal(2);
    expect(h3.buckets[2].count).to.be.equal(2);
    expect(h3.buckets[3].count).to.be.equal(2);
    expect(h3.buckets[4].count).to.be.equal(6);
    expect(h3.buckets[5].count).to.be.equal(6);
    expect(h3.buckets[6].count).to.be.equal(12);
    expect(h3.buckets[7].count).to.be.equal(20);
    expect(h3.buckets[7].subBuckets.length).to.be.equal(6);
    expect(h3.buckets[7].subBuckets[0].count).to.be.equal(2);
    expect(h3.buckets[7].subBuckets[1].count).to.be.equal(4);
    expect(h3.buckets[7].subBuckets[2].count).to.be.equal(2);
    expect(h3.buckets[7].subBuckets[3].count).to.be.equal(4);
    expect(h3.buckets[7].subBuckets[4].count).to.be.equal(4);
    expect(h3.buckets[7].subBuckets[5].count).to.be.equal(4);
    expect(h3.buckets[8].count).to.be.equal(28);
    expect(h3.buckets[8].subBuckets.length).to.be.equal(5);
    expect(h3.buckets[8].subBuckets[0].count).to.be.equal(4);
    expect(h3.buckets[8].subBuckets[1].count).to.be.equal(6);
    expect(h3.buckets[8].subBuckets[2].count).to.be.equal(4);
    expect(h3.buckets[8].subBuckets[3].count).to.be.equal(8);
    expect(h3.buckets[8].subBuckets[4].count).to.be.equal(6);
    expect(h3.buckets[9].count).to.be.equal(48);
    expect(h3.buckets[9].subBuckets.length).to.be.equal(6);
    expect(h3.buckets[9].subBuckets[0].count).to.be.equal(6);
    expect(h3.buckets[9].subBuckets[1].count).to.be.equal(8);
    expect(h3.buckets[9].subBuckets[2].count).to.be.equal(10);
    expect(h3.buckets[9].subBuckets[3].count).to.be.equal(10);
    expect(h3.buckets[9].subBuckets[4].count).to.be.equal(10);
    expect(h3.buckets[9].subBuckets[5].count).to.be.equal(4);
    expect(h3.buckets[10].count).to.be.equal(72);
  });
});





