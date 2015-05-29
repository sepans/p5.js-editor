var x = 10;
var y = 10;
var speedX = .2;

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  rect(x, y, 20, 20);
  x+= speedX;
}
