let resetRectFunction
// Exposing functions to external -----------------------------
function setEventListenerForNewRect() {
  canvas.addEventListener('mousedown', mouseDownForNewRect);
  // currentShape.canvas.addEventListener('mouseup', mouseUpForRect);
  // resetRectFunction = callback;
}

// internal Functions & Variables -----------------------------
function setEventListenerForRect() {
  canvas.removeEventListener('mousedown', mouseDownForNewRect);
}
function mouseDownForNewRect(event) {
  // Set Config Values
  config.lineColor = myColor;
  config.owner = mySelf;
  myShapeNo += 1;
  const rect = new Rect(config, myShapeNo);
  shapes.push(rect);
  currentShape = rect;

  // Add Default Points for Rectangle
  const position_lefttop = currentShape.getPosition(event); //LeftTop
  console.log("Mouse Down for Rect...",currentShape);
  console.log(position_lefttop,config,currentShape);
  let position_righttop = {...position_lefttop};
  position_righttop.x += config.defaultShapeSize; //RightBottom
  let position_rightbottom = {...position_righttop};
  position_rightbottom.y += config.defaultShapeSize; //RightBottom
  let position_leftbottom = {...position_rightbottom};
  position_leftbottom.x -= config.defaultShapeSize; //LeftBottom
  currentShape.points.push(position_lefttop);
  currentShape.points.push(position_righttop);
  currentShape.points.push(position_rightbottom);
  currentShape.points.push(position_leftbottom);
  currentShape.draw();
  console.log(config,currentShape);

  sendData(currentShape); // Share the shpae to others of the same room
  // currentShape.canvas.addEventListener('mousemove', mouseMoveForLine);
}
function mouseMoveForRect(event) {
  // currentShape.mouseMove(event);
  // sendData(currentShape);
}
function mouseUpForRect(event) {
  canvas.removeEventListener('mousemove', mouseMoveForRect);
  canvas.removeEventListener('mousedown', mouseDownForNewRect);
  canvas.removeEventListener('mouseup', mouseUpForRect);
  resetRectFunction();
}

class Rect {
  constructor (config,shapeNo){
    this.shapeType = "RECT";
    this.lineWidth = config.lineWidth;
    this.lineColor = config.lineColor;
    this.fillColor = config.fillColor;
    this.owner = config.owner;
    this.defaultShapeSize = config.defaultShapeSize;
    this.shapeId = shapeNo; // KEY : this.owner.userId + this.shapeId
    this.points = [];
  }

  mouseMove(event) {
      // const position = this.getPosition(event);
      // this.points.push(position);
      // this.draw();
  }
  getPosition(event,eventType) {
      const x = event.clientX - canvas.offsetLeft;
      const y = event.clientY - canvas.offsetTop;
      return {x:x, y:y}
  }
  draw() {
    drawRectForOther(this);
  }
}
async function drawRectForOther(rect) {
    for (let i = 0; i < rect.points.length; i++) {
      let pointBegin = rect.points[i - 1];
      if (i == 0) {
          pointBegin = rect.points[rect.points.length - 1];
      } 
      const pointEnd = rect.points[i];
      ctx.beginPath();
      ctx.lineWidth = rect.lineWidth;
      ctx.lineCap = 'round';
      ctx.strokeStyle = rect.lineColor;
      ctx.moveTo(pointBegin.x, pointBegin.y);
      ctx.lineTo(pointEnd.x, pointEnd.y);
      ctx.stroke();
    }
}