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

const commands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];
let currentLineCommand: LineCommand | undefined = undefined;
const drawEvent = new Event("drawing-changed");

class LineCommand {
  points: [{ x?: number; y?: number }];
  constructor(x: number, y: number) {
    this.points = [{ x, y }];
  }
  display(context: CanvasRenderingContext2D) {
    context.strokeStyle = "black";
    // ctx.strokeWidth = 4;
    context.beginPath();
    const { x, y } = this.points[0];
    context.moveTo(x!, y!);
    for (const { x, y } of this.points) {
      context.lineTo(x!, y!);
    }
    context.stroke();
  }
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
}

drawingArea.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  currentLineCommand = new LineCommand(e.offsetX, e.offsetY);
  commands.push(currentLineCommand);
  redoCommands.splice(0, redoCommands.length);
  drawingArea.dispatchEvent(drawEvent);
});

drawingArea.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLineCommand!.drag(cursor.x, cursor.y);
    drawingArea.dispatchEvent(drawEvent);
  }
});

drawingArea.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLineCommand = undefined;
  drawingArea.dispatchEvent(drawEvent);
});

drawingArea.addEventListener("drawing-changed", () => {
  ctx.clearRect(origin, origin, drawingArea.width, drawingArea.height);
  commands.forEach((cmd) => cmd.display(ctx));
});

const menu = document.createElement("div");
app.append(menu);

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
menu.append(clearButton);

clearButton.addEventListener("click", () => {
  commands.splice(0, commands.length);
  redoCommands.splice(0, redoCommands.length);
  ctx.clearRect(origin, origin, drawingArea.width, drawingArea.height);
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
menu.append(undoButton);
undoButton.addEventListener("click", () => {
  if (commands.length > 0) {
    redoCommands.push(commands.pop()!);
    drawingArea.dispatchEvent(drawEvent);
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
menu.append(redoButton);
redoButton.addEventListener("click", () => {
  if (redoCommands.length > 0) {
    commands.push(redoCommands.pop()!);
    drawingArea.dispatchEvent(drawEvent);
  }
});
