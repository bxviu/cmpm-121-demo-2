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

app.append(drawingArea);

const cursor = { active: false, x: origin, y: origin };

const paths: [[{ x?: number; y?: number }]] = [[{}]];
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

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
app.append(clearButton);

clearButton.addEventListener("click", () => {
  paths.splice(0, paths.length);
  ctx.clearRect(origin, origin, drawingArea.width, drawingArea.height);
});
