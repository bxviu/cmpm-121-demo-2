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

const commands: (LineCommand | StickerCommand)[] = [];
const redoCommands: (LineCommand | StickerCommand)[] = [];
let currentLineCommand: LineCommand | undefined = undefined;
const drawEvent = new CustomEvent("drawing-changed");
const toolEvent = new CustomEvent("tool-moved", {
  detail: {
    preview: true,
  },
});

let cursorCommand: CursorCommand | StickerCommand | null = null;

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
  display(context: CanvasRenderingContext2D) {
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
  if (stickers.some((sticker) => sticker.htmlData!.button!.id)) {
    return;
  }
  cursorCommand = null;
  currentLineCommand = new LineCommand(e.offsetX, e.offsetY, currentThickness);
  commands.push(currentLineCommand);
  redoCommands.splice(0, redoCommands.length);
  drawingArea.dispatchEvent(drawEvent);
});

drawingArea.addEventListener("mousemove", (e) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  if (stickers.some((sticker) => sticker.htmlData!.button!.id)) {
    stickers.forEach((s) => {
      if (s.htmlData!.button!.id) {
        cursorCommand = new StickerCommand(e.offsetX, e.offsetY, s.visual);
      }
    });
  } else if (cursor.active) {
    currentLineCommand!.drag(cursor.x, cursor.y);
  } else {
    cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
  }
  drawingArea.dispatchEvent(toolEvent);
});

drawingArea.addEventListener("mouseup", (e) => {
  if (stickers.some((sticker) => sticker.htmlData!.button!.id)) {
    stickers.forEach((s) => {
      if (s.htmlData!.button!.id) {
        commands.push(new StickerCommand(e.offsetX, e.offsetY, s.visual));
      }
    });
  }
  cursor.active = false;
  currentLineCommand = undefined;
  drawingArea.dispatchEvent(drawEvent);
});

drawingArea.addEventListener("mouseenter", (e) => {
  if (stickers.some((sticker) => sticker.htmlData!.button!.id)) {
    stickers.forEach((s) => {
      if (s.htmlData!.button!.id) {
        cursorCommand = new StickerCommand(e.offsetX, e.offsetY, s.visual);
      }
    });
  } else {
    cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
  }
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
    ctx.globalAlpha = 0.5;
    cursorCommand.display(ctx);
  }
  ctx.globalAlpha = 1;
}

const menu = document.createElement("div");
menu.id = "menu";
app.append(menu);

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
menu.append(clearButton);

clearButton.addEventListener("click", () => {
  commands.splice(0, commands.length);
  redoCommands.splice(0, redoCommands.length);
  ctx.clearRect(origin, origin, drawingArea.width, drawingArea.height);
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
menu.append(undoButton);
undoButton.addEventListener("click", () => {
  if (commands.length) {
    redoCommands.push(commands.pop()!);
    drawingArea.dispatchEvent(drawEvent);
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
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

const exportButton = document.createElement("button");
exportButton.innerHTML = "Export";
menu.append(exportButton);
exportButton.addEventListener("click", () => {
  const bigCanvas = document.createElement("canvas");
  bigCanvas.id = "canvas";
  const exportSize = 1024;
  bigCanvas.height = exportSize;
  bigCanvas.width = exportSize;
  const bigctx = bigCanvas.getContext("2d");
  bigctx!.clearRect(origin, origin, bigCanvas.width, bigCanvas.height);
  bigctx!.scale(4, 4);
  commands.forEach((cmd) => {
    cmd.display(bigctx!);
  });
  const anchor = document.createElement("a");
  anchor.href = bigCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
});

class StickerCommand {
  x: number;
  y: number;
  sticker: string;
  constructor(x: number, y: number, sticker: string) {
    this.x = x - 20;
    this.y = y + 10;
    this.sticker = sticker;
  }
  display(context: CanvasRenderingContext2D) {
    context.lineWidth = thinMarkerVal;
    context.beginPath();
    context.font = "32px monospace";
    context.fillText(this.sticker, this.x - 20, this.y + 10);
    context.stroke();
  }
  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

interface Sticker {
  visual: string;
  htmlData?: {
    button?: HTMLButtonElement;
  };
}

const stickers: Sticker[] = [
  { visual: "🍏" },
  { visual: "😬" },
  { visual: "�" },
];

const customStickerButton = document.createElement("button");
customStickerButton.innerHTML = "Add Sticker";
customStickerButton.addEventListener("click", () => {
  const text = prompt("Custom sticker text", "^o^");
  if (!text) {
    alert("No sticker added due to lack of text.");
    return;
  }
  if (stickers.some((sticker) => sticker.visual == text)) {
    alert("Sticker already exists.");
    return;
  }
  const newSticker = { visual: text } as Sticker;
  stickers.push(newSticker);
  newSticker.htmlData = { button: createStickerButton(newSticker.visual) };
});
menu.append(customStickerButton);

stickers.forEach((s) => {
  s.htmlData = { button: createStickerButton(s.visual) };
});

function createStickerButton(visual: string) {
  const stickersButton = document.createElement("button");
  stickersButton.innerHTML = visual;
  stickersButton.addEventListener("click", () => {
    if (stickersButton.id) {
      stickersButton.id = "";
    } else {
      stickers.forEach((ss) => {
        ss.htmlData!.button!.id = "";
      });
      stickersButton.id = "selectedTool";
    }
    drawingArea.dispatchEvent(toolEvent);
  });
  menu.append(stickersButton);
  return stickersButton;
}
