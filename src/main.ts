import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Colorful Canvas";

document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

const drawingArea = document.createElement("canvas");
const dimension = 256;
const origin = 0;
drawingArea.width = dimension;
drawingArea.height = dimension;

const ctx = drawingArea.getContext("2d")!;
// ctx.fillStyle = "white";
// ctx.fillRect(origin, origin, dimension, dimension);

app.append(drawingArea);

const cursor = { active: false, x: origin, y: origin };

// const paths = [];

drawingArea.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
});

// drawingArea.onmousedown = (e) => {
//   cursor.active = true;
//   cursor.x = e.offsetX;
//   cursor.y = e.offsetY;
// };

drawingArea.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    ctx.beginPath();
    ctx.moveTo(cursor.x, cursor.y);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
  }
});

drawingArea.addEventListener("mouseup", () => {
  cursor.active = false;
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
app.append(clearButton);

clearButton.addEventListener("click", () => {
  ctx.clearRect(origin, origin, drawingArea.width, drawingArea.height);
});
