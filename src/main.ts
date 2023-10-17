import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Colorful? Canvas";

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

app.append(drawingArea);

const cursor = { active: false, x: origin, y: origin };

const paths: [[{ x?: number; y?: number }]] = [[{}]];
const redoPaths: [[{ x?: number; y?: number }]] = [[{}]];
let currentPath: [{ x?: number; y?: number }] = [{}];
const drawEvent = new Event("drawing-changed");

drawingArea.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  paths.push(currentPath);
  currentPath.push({ x: cursor.x, y: cursor.y });
  drawingArea.dispatchEvent(drawEvent);
});

drawingArea.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentPath.push({ x: cursor.x, y: cursor.y });
    redoPaths.splice(0, redoPaths.length);
    drawingArea.dispatchEvent(drawEvent);
  }
});

drawingArea.addEventListener("mouseup", () => {
  cursor.active = false;
  currentPath = [{}];
  drawingArea.dispatchEvent(drawEvent);
});

drawingArea.addEventListener("drawing-changed", () => {
  console.log("rec");
  ctx.clearRect(origin, origin, drawingArea.width, drawingArea.height);
  for (const line of paths) {
    if (line.length > 1) {
      ctx.beginPath();
      const { x, y } = line[0];
      ctx.moveTo(x!, y!);
      for (const { x, y } of line) {
        ctx.lineTo(x!, y!);
      }
      ctx.stroke();
    }
  }
});

const menu = document.createElement("div");
app.append(menu);

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
menu.append(clearButton);

clearButton.addEventListener("click", () => {
  paths.splice(0, paths.length);
  redoPaths.splice(0, redoPaths.length);
  ctx.clearRect(origin, origin, drawingArea.width, drawingArea.height);
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
menu.append(undoButton);
undoButton.addEventListener("click", () => {
  if (paths.length > 0) {
    redoPaths.push(paths.pop()!);
    drawingArea.dispatchEvent(drawEvent);
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
menu.append(redoButton);
redoButton.addEventListener("click", () => {
  if (redoPaths.length > 0) {
    paths.push(redoPaths.pop()!);
    drawingArea.dispatchEvent(drawEvent);
  }
});
