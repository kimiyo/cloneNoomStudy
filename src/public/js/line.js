let currentLine
let resetFunction
function setEventListenerForLine(line, callback) {
  currentLine = line;
  currentLine.canvas.addEventListener('mousedown', mouseDownForLine);
  currentLine.canvas.addEventListener('mouseup', mouseUpForLine);
  resetFunction = callback;
}
function mouseDownForLine(event) {
  const firstPosition = currentLine.getPosition(event);
  currentLine.points.push(firstPosition);
  currentLine.canvas.addEventListener('mousemove', mouseMoveForLine);
}
function mouseMoveForLine(event) {
  currentLine.mouseMove(event);
  sendData(currentLine);
}
function mouseUpForLine(event) {
  currentLine.canvas.removeEventListener('mousemove', mouseMoveForLine);
  currentLine.canvas.removeEventListener('mousedown', mouseDownForLine);
  currentLine.canvas.removeEventListener('mouseup', mouseUpForLine);
  resetFunction();
}

async function drawLineForOther(line,ctx) {
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
  constructor (config,ctx, canvas, shapeNo){
    this.shapeType = "LINE";
    this.lineWidth = config.lineWidth;
    this.lineColor = config.lineColor;
    this.fillColor = config.fillColor;
    this.owner = config.owner;
    this.shapeId = shapeNo; // KEY : this.owner.userId + this.shapeId
    this.points = [];
    this.ctx = ctx;
    this.canvas = canvas;
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
      for (let i = 1; i < this.points.length; i++) {
        this.drawTwoPoint(this.points[i-1],this.points[i]);
      }
  }
  drawTwoPoint(pointBegin,pointEnd) {
      this.ctx.beginPath();
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.lineCap = 'round';
      this.ctx.strokeStyle = this.lineColor;
      this.ctx.moveTo(pointBegin.x, pointBegin.y);
      this.ctx.lineTo(pointEnd.x, pointEnd.y);
      this.ctx.stroke();
  }
}
