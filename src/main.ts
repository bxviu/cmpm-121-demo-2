import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Colorful Canvas";

document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

const drawingArea = document.createElement("canvas");
const dimension = 256;
drawingArea.width = dimension;
drawingArea.height = dimension;

const ctx = drawingArea.getContext("2d")!;
ctx.fillStyle = "white";
ctx.fillRect(0, 0, dimension, dimension);

app.append(drawingArea);
