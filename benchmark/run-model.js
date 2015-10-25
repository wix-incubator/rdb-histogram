var Measured    = require('measured');
var RollingHistogram = require("../src/rdb-histogram");
var fs = require('fs');


var metricsHistogram = new Measured.Histogram();
var rdbHistogram = new RollingHistogram();
var date = new Date();

var dataFile = fs.createWriteStream("data.csv");
var metricsHistogramFile = fs.createWriteStream("metrics-histogram.csv");
var rdbHistogramFile = fs.createWriteStream("rdb-histogram.csv");

dataFile.once('open', function() {
  metricsHistogramFile.once('open', function() {
    rdbHistogramFile.once('open', function() {
      dataFile.write("time,value");
      metricsHistogramFile.write("time, min, max, count, median, p75, p95, p99, p999\n");
      rdbHistogramFile.write("time, min, max, count, median, p75, p95, p99, p999, numBuckets\n");

      benchmark();
    })
  })
});

function benchmark() {

  var time = 0;
  var timer;
  timer = setInterval(function() {
    time = time + 1;
    var isEvent = Math.random()*10 > 7;
    if (isEvent) {
      var value;
      if (time < 15*60*1000)
        value = phase1();
      else if (time < 30*60*1000)
        value = phase2();
      else if (time < 45*60*1000)
        value = phase3();
      else
        value = phase1();

      metricsHistogram.update(value);
      rdbHistogram.update(value);
      dataFile.write("" + time + "," + value + "\n");
    }

    console.log(time, time % (10 * 1000));
    if (time % (10 * 1000) == 0) {
      console.log(time);
      var metricsStats = metricsHistogram.toJSON();
      console.log(metricsStats);
      metricsHistogramFile.write("" + time + ", " + metricsStats.min +"," + metricsStats.max + "," + metricsStats.count +","+metricsStats.median + "," +
        metricsStats.p75 + "," + metricsStats.p95 + "," + metricsStats.p99 + "," + metricsStats.p999 + "\n");
      var rollingStats = rdbHistogram.toJSON();
      console.log(rollingStats);
      rdbHistogramFile.write("" + time + ", " + rollingStats.min +"," + rollingStats.max + "," + rollingStats.count +","+rollingStats.median + "," +
        rollingStats.p75 + "," + rollingStats.p95 + "," + rollingStats.p99 + "," + rollingStats.p999 + "," + rollingStats.numBuckets + "\n");
    }

    if (time > 60*60*1000) {
      clearInterval(timer);
      dataFile.end();
      metricsHistogramFile.end();
      rdbHistogramFile.end();
    }

  }, 1);
}

function phase1() {
  var group = Math.random()*200;
  if (group < 92*2)
    return 40 + Math.random()*10;
  else if (group < (92+6)*2)
    return 60 + Math.random()*10;
  else if (group < (92+6+1.5)*2)
    return 70 + Math.random()*10;
  else
    return 80 + Math.random()*10;
}

function phase2() {
  var group = Math.random()*200;
  if (group < 92*2)
    return 90 + Math.random()*20;
  else if (group < (92+6)*2)
    return 120 + Math.random()*30;
  else if (group < (92+6+1.5)*2)
    return 150 + Math.random()*50;
  else
    return 200 + Math.random()*100;
}

function phase3() {
  var group = Math.random()*200;
  if (group < 92*2)
    return 70 + Math.random()*20;
  else if (group < (92+6)*2)
    return 90 + Math.random()*20;
  else if (group < (92+6+1.5)*2)
    return 110 + Math.random()*30;
  else
    return 140 + Math.random()*50;
}










