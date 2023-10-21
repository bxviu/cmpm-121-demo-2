import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Canvasticker";

document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

const drawingArea = document.createElement("canvas");
const dimension = 256;
const startingNum = 0;
drawingArea.width = dimension;
drawingArea.height = dimension;

const ctx = drawingArea.getContext("2d")!;

const historyMenu = document.createElement("div");
historyMenu.id = "histMenu";
app.append(historyMenu);

app.append(drawingArea);

const rangeMenu = document.createElement("div");
rangeMenu.id = "rangeMenu";
app.append(rangeMenu);

const cursor = { active: false, x: startingNum, y: startingNum };

const commands: (LineCommand | StickerCommand)[] = [];
const redoCommands: (LineCommand | StickerCommand)[] = [];
let currentLineCommand: LineCommand | undefined = undefined;
const drawEvent = new CustomEvent("drawing-changed");
const toolEvent = new CustomEvent("tool-moved");

let cursorCommand: CursorCommand | StickerCommand | null = null;

const thinMarkerVal = 1;
const thickMarkerVal = 4;
let currentThickness = thinMarkerVal;

class LineCommand {
  points: [{ x?: number; y?: number }];
  thickness: number;
  colorVal: number;
  constructor(x: number, y: number, thickness = thinMarkerVal) {
    this.points = [{ x, y }];
    this.thickness = thickness;
    this.colorVal = parseInt(rangeSelector.value) * (255 / 100);
  }
  display(context: CanvasRenderingContext2D) {
    // context.strokeStyle = `rgb(${parseInt(rangeSelector.value) * (255 / 100)},
    //   ${Math.abs((parseInt(rangeSelector.value) - 33) % 255) * (255 / 100)},
    //   ${Math.abs((parseInt(rangeSelector.value) + 85) % 255) * (255 / 100)})`;
    context.strokeStyle = `hsl(${this.colorVal}, 100%, 50%)`;
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
  if (stickers.some((sticker) => sticker.htmlData!.button!.id)) {
    return;
  }
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  cursorCommand = null;
  currentLineCommand = new LineCommand(e.offsetX, e.offsetY, currentThickness);
  commands.push(currentLineCommand);
  redoCommands.splice(startingNum, redoCommands.length);
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
  ctx.clearRect(
    startingNum,
    startingNum,
    drawingArea.width,
    drawingArea.height
  );
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
const menuButtons: HTMLButtonElement[] = [];

function createMenuButton(text: string) {
  const button = document.createElement("button");
  button.innerHTML = text;
  menuButtons.push(button);
  return button;
}

const clearButton = createMenuButton("Clear");
clearButton.addEventListener("click", () => {
  commands.splice(startingNum, commands.length);
  redoCommands.splice(startingNum, redoCommands.length);
  ctx.clearRect(
    startingNum,
    startingNum,
    drawingArea.width,
    drawingArea.height
  );
});

const undoButton = createMenuButton("Undo");
undoButton.addEventListener("click", () => {
  if (commands.length) {
    redoCommands.push(commands.pop()!);
    drawingArea.dispatchEvent(drawEvent);
  }
});

const redoButton = createMenuButton("Redo");
redoButton.addEventListener("click", () => {
  if (redoCommands.length) {
    commands.push(redoCommands.pop()!);
    drawingArea.dispatchEvent(drawEvent);
  }
});

const thinMarkerButton = createMenuButton("Thin");
thinMarkerButton.id = "selectedTool";
thinMarkerButton.addEventListener("click", () => {
  currentThickness = thinMarkerVal;
  selectTool(thinMarkerButton);
});

const thickMarkerButton = createMenuButton("Thick");
thickMarkerButton.addEventListener("click", () => {
  currentThickness = thickMarkerVal;
  selectTool(thickMarkerButton);
});

const exportButton = createMenuButton("Export");
exportButton.addEventListener("click", () => {
  const bigCanvas = document.createElement("canvas");
  bigCanvas.id = "canvas";
  const exportSize = 1024;
  bigCanvas.height = exportSize;
  bigCanvas.width = exportSize;
  const bigctx = bigCanvas.getContext("2d");
  bigctx!.clearRect(
    startingNum,
    startingNum,
    bigCanvas.width,
    bigCanvas.height
  );
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
  rotationVal: number;
  constructor(x: number, y: number, sticker: string) {
    this.x = x - 20;
    this.y = y + 10;
    this.sticker = sticker;
    this.rotationVal = parseInt(rangeSelector.value) * (360 / 100);
    console.log(this.rotationVal);
  }
  display(context: CanvasRenderingContext2D) {
    context.save();
    context.translate(this.x, this.y);
    context.rotate((this.rotationVal * Math.PI) / 180);
    context.font = "18px monospace";
    context.fillText(this.sticker, startingNum, startingNum);
    context.beginPath();
    context.stroke();
    context.restore();
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
  { visual: "( ͡👁️ ͜ʖ ͡👁️)" },
  { visual: "😎" },
  { visual: "😂" },
  { visual: "😘" },
  { visual: "😍" },
  { visual: "😉" },
  { visual: "😄" },
  { visual: "😜" },
];

const customStickerButton = createMenuButton("Add Sticker");
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

stickers.forEach((s) => {
  s.htmlData = { button: createStickerButton(s.visual) };
});

function createStickerButton(visual: string) {
  const stickersButton = createMenuButton(visual);
  stickersButton.addEventListener("click", () => {
    selectTool(stickersButton);
    drawingArea.dispatchEvent(toolEvent);
  });
  return stickersButton;
}

function selectTool(selected: HTMLButtonElement) {
  menuButtons.forEach((button) => {
    button.id = "";
  });
  selected.id = "selectedTool";
}

const rangeSelector = document.createElement("input");
rangeSelector.type = "range";
rangeSelector.addEventListener("input", () => {
  rangeSelector.value;
});
rangeMenu.append(rangeSelector);

// so I can decide where the buttons are on the page
function buttonPlacement() {
  historyMenu.append(clearButton);
  historyMenu.append(undoButton);
  historyMenu.append(redoButton);
  historyMenu.append(exportButton);
  menu.append(thinMarkerButton);
  menu.append(thickMarkerButton);
  historyMenu.append(customStickerButton);
  stickers.forEach((sticker) => {
    menu.append(sticker.htmlData!.button!);
  });
}

buttonPlacement();
