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
const toolEvent = new Event("tool-moved");

let cursorCommand: CursorCommand | null = null;

const thinMarkerVal = 1;
const thickMarkerVal = 4;
let currentThickness = thinMarkerVal;

class LineCommand {
  points: [{ x?: number; y?: number }];
  thickness: number;
  constructor(x: number, y: number, thickness = thinMarkerVal) {
    this.points = [{ x, y }];
    this.thickness = thickness;
  }
  display(context: CanvasRenderingContext2D) {
    context.strokeStyle = "black";
    context.lineWidth = this.thickness;
    context.beginPath();
    const [initialPoint, ...otherPoints] = this.points;
    const { x, y } = initialPoint;
    context.moveTo(x!, y!);
    for (const { x, y } of otherPoints) {
      context.lineTo(x, y);
    }
    context.stroke();
  }
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
}

class CursorCommand {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  draw(context: CanvasRenderingContext2D) {
    context.lineWidth = thinMarkerVal;
    context.beginPath();
    context.arc(
      this.x,
      this.y,
      currentThickness == thinMarkerVal ? currentThickness : 2,
      0,
      2 * Math.PI
    );
    context.stroke();
    context.fill();
  }
}

drawingArea.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  cursorCommand = null;
  currentLineCommand = new LineCommand(e.offsetX, e.offsetY, currentThickness);
  commands.push(currentLineCommand);
  redoCommands.splice(0, redoCommands.length);
  drawingArea.dispatchEvent(drawEvent);
});

drawingArea.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLineCommand!.drag(cursor.x, cursor.y);
  } else {
    cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
  }
  drawingArea.dispatchEvent(toolEvent);
});

drawingArea.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLineCommand = undefined;
  drawingArea.dispatchEvent(drawEvent);
});

drawingArea.addEventListener("mouseenter", (e) => {
  cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
  drawingArea.dispatchEvent(toolEvent);
});

drawingArea.addEventListener("mouseout", () => {
  cursorCommand = null;
  drawingArea.dispatchEvent(toolEvent);
});

drawingArea.addEventListener("drawing-changed", () => redraw());
drawingArea.addEventListener("tool-moved", () => redraw());

function redraw() {
  ctx.clearRect(origin, origin, drawingArea.width, drawingArea.height);
  commands.forEach((cmd) => cmd.display(ctx));
  if (cursorCommand) {
    cursorCommand.draw(ctx);
  }
}

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
  if (commands.length) {
    redoCommands.push(commands.pop()!);
    drawingArea.dispatchEvent(drawEvent);
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
menu.append(redoButton);
redoButton.addEventListener("click", () => {
  if (redoCommands.length) {
    commands.push(redoCommands.pop()!);
    drawingArea.dispatchEvent(drawEvent);
  }
});

const thinMarkerButton = document.createElement("button");
thinMarkerButton.innerHTML = "Thin";
thinMarkerButton.id = "selectedTool";
menu.append(thinMarkerButton);
thinMarkerButton.addEventListener("click", () => {
  currentThickness = thinMarkerVal;
  thinMarkerButton.id = "selectedTool";
  thickMarkerButton.id = "";
});

const thickMarkerButton = document.createElement("button");
thickMarkerButton.innerHTML = "Thick";
menu.append(thickMarkerButton);
thickMarkerButton.addEventListener("click", () => {
  currentThickness = thickMarkerVal;
  thickMarkerButton.id = "selectedTool";
  thinMarkerButton.id = "";
});
