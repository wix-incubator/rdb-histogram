

var RollingHistogram = require("../src/rolling-histogram");
var rollingHistogram = new RollingHistogram({backetSize: Math.sqrt(Math.sqrt(Math.sqrt(10)))});

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


for (var i=0; i < 10000; i++)
 rollingHistogram.update(phase1());

console.log(rollingHistogram.toJSON());