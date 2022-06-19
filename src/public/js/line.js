let resetFunction
// Exposing functions to external -----------------------------
function  newLine() {
  setEventListenerForLine(()=>{
      nextTask();
  });
}



// internal Functions & Variables -----------------------------
function setEventListenerForLine(callback) {
  canvas.addEventListener('mousedown', mouseDownForLine);
  canvas.addEventListener('mouseup', mouseUpForLine);
  resetFunction = callback;
}
function mouseDownForLine(event) {
  config.lineColor = myColor;
  config.owner = mySelf;
  myShapeNo += 1;
  const line = new Line(config, myShapeNo);
  shapes.push(line);
  currentShape = line;
  //
  const firstPosition = currentShape.getPosition(event);
  currentShape.points.push(firstPosition);
  //
  canvas.addEventListener('mousemove', mouseMoveForLine);
}
function mouseMoveForLine(event) {
  currentShape.mouseMove(event);
  sendData(currentShape);
}
function mouseUpForLine(event) {
  canvas.removeEventListener('mousemove', mouseMoveForLine);
  canvas.removeEventListener('mousedown', mouseDownForLine);
  canvas.removeEventListener('mouseup', mouseUpForLine);
  resetFunction();
}

async function drawLineForOther(line) {
  for (let i = 1; i < line.points.length; i++) {
    const pointBegin = line.points[i-1];
    const pointEnd = line.points[i];
    ctx.beginPath();
    ctx.lineWidth = line.lineWidth;
    ctx.lineCap = 'round';
    ctx.strokeStyle = line.lineColor;
    ctx.moveTo(pointBegin.x, pointBegin.y);
    ctx.lineTo(pointEnd.x, pointEnd.y);
    ctx.stroke();
  }
}

class Line {
  constructor (config, shapeNo){
    this.shapeType = SHAPETYPE_LINE;
    this.lineWidth = config.lineWidth;
    this.lineColor = config.lineColor;
    this.fillColor = config.fillColor;
    this.owner = config.owner;
    this.shapeId = shapeNo; // KEY : this.owner.userId + this.shapeId
    this.points = [];
    // console.log(`${this.canvas}`);
  }

  mouseMove(event) {
      const position = this.getPosition(event);
      this.points.push(position);
      this.draw();
  }
  getPosition(event,eventType) {
      const x = event.clientX - canvas.offsetLeft;
      const y = event.clientY - canvas.offsetTop;
      return {x:x, y:y}
  }
  draw() {
      // for (let i = 1; i < this.points.length; i++) {
      //   this.drawTwoPoint(this.points[i-1],this.points[i]);
      // }
      drawLineForOther(this); 
  }
}
