import './styles.scss';

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// Заливка всего холста в белый цвет.
// Пипетка после клика на холст будет использовать белый цвет.
context.fillStyle = 'rgba(255, 255, 255, 255)';
context.fillRect(0, 0, canvas.width, canvas.height);

const toolsPanel = [...document.querySelectorAll('.tools__list')[0].children];

const activeColorPanel = [...document.querySelectorAll('.tools__list')[1].children];
const colorPanel = activeColorPanel.slice(2, activeColorPanel.length);
const prevColorPalette = activeColorPanel[1];

let tool = '';
let draw = false;

let coords = [];
const fullCoord = [];

let currentColor = 'rgba(0, 0, 0, 255)';
let prevColor = 'rgba(0, 0, 0, 255)';

let usedColors = [];

toolsPanel.forEach((element) => {
  element.addEventListener('click', () => {
    toolsPanel.forEach((element) => element.classList.remove('active'));

    element.classList.add('active');

    tool = element.dataset.tool;
  });
});

colorPanel.forEach((element) => {
  element.addEventListener('click', () => {
    colorPanel.forEach((element) => element.classList.remove('active'));

    element.classList.add('active');

    prevColor = currentColor;
    currentColor = element.dataset.color;

    // Чтобы кружки предыдущего и текущего цвета не красились в один цвет.
    if (currentColor !== prevColor) {
      activeColorPanel[0].children[0].style.backgroundColor = currentColor;
      activeColorPanel[1].children[0].style.backgroundColor = prevColor;
    }
  });
});

const hex2rgba = (hex, alpha = 1) => {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));

  return `rgba(${r},${g},${b},${alpha})`;
};

function drawPixel(canvas, startX, startY, sizePixel, color) {
  if (color.length === 6) {
    canvas.fillStyle = hex2rgba(color);
  } else {
    canvas.fillStyle = `rgba(${color})`;
  }
  canvas.fillRect(startX, startY, sizePixel, sizePixel);
}

function drawImage(canvas, dataArray) {
  let sizePixel = 0;
  let x = 0;
  let y = 0;

  sizePixel = 512 / dataArray.length;

  for (const row of dataArray) {
    for (const cell of row) {
      drawPixel(canvas, x, y, sizePixel, cell);
      x += sizePixel;
    }

    y += sizePixel;
    x = 0;
  }
}

document.querySelectorAll('.actions__item').forEach((item) => {
  item.addEventListener('click', () => {
    const { type, url } = item.dataset;

    switch (type) {
      case 'pixels':
        fetch(url).then((response) => response.json()).then((data) => drawImage(context, data));
        break;

      case 'image':
        const img = new Image();
        img.onload = function () {
          context.drawImage(img, 0, 0, 512, 512);
        };

        img.src = url;
        break;

      default:
        break;
    }
  });
});

canvas.addEventListener('mousedown', (event) => {
  draw = true;

  context.strokeStyle = currentColor;
  context.beginPath();
  context.moveTo(event.offsetX, event.offsetY);
  // 11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
});

canvas.addEventListener('mouseup', (event) => {
  draw = false;
  usedColors.push(currentColor);
  // Условие для того, чтобы сохранять координаты только в том случае, если рисуем.
  // Иначе сохранялись пустые массивы (т.к. ничего не рисовалось).
  if (tool === 'pencil') {
    fullCoord.push(coords);

    // Сохряняем массивы координат, чтобы рисовать отдельные линии при восстановлении рисунка.
    // Если сохранять массив coords, то при восстановлении рисунка все линии соединялись.
    window.sessionStorage.setItem('coords', JSON.stringify(fullCoord));
    window.sessionStorage.setItem('colors', JSON.stringify(usedColors));

    coords = [];
  }
});

canvas.addEventListener('mousemove', (evet) => {
  if (draw === true && tool === 'pencil') {
    coords.push(event.offsetX, event.offsetY);

    context.lineTo(event.offsetX, event.offsetY);
    context.stroke();
  }
});

canvas.addEventListener('click', (evet) => {
  if (tool === 'pencil') {
    context.fillStyle = currentColor;

    // Отрисовка точки при клике на ЛКМ.
    context.beginPath();
    context.arc(event.offsetX, event.offsetY, 1, 0, Math.PI * 2);
    context.fill();
  }

  if (tool === 'dropper') {
    const img_data = context.getImageData(evet.offsetX, evet.offsetY, 1, 1);
    const pix = img_data.data;

    const red = pix[0];
    const green = pix[1];
    const blue = pix[2];
    const alpha = pix[3];

    prevColor = currentColor;
    currentColor = `rgba(${red}, ${green}, ${blue}, ${alpha})`;

    if (currentColor !== prevColor) {
      activeColorPanel[0].children[0].style.backgroundColor = currentColor;
      activeColorPanel[1].children[0].style.backgroundColor = prevColor;
    }
  }

  if (tool === 'bucket') {
    context.fillStyle = currentColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    window.sessionStorage.clear();
    usedColors = [];
  }
});

// Возможность получить предыдущий цвет по клику на соответствующую палитру.
prevColorPalette.addEventListener('click', (event) => {
  let temp = null;

  activeColorPanel[0].children[0].style.backgroundColor = prevColor;
  activeColorPanel[1].children[0].style.backgroundColor = currentColor;

  temp = currentColor;
  currentColor = prevColor;
  prevColor = temp;
});

if (window.sessionStorage.length) {
  recoveryPainting(window.sessionStorage.getItem('coords'), window.sessionStorage.getItem('colors'));
  usedColors = [];
}

function recoveryPainting(coord, color) {
  coord = JSON.parse(coord);
  color = JSON.parse(color);

  for (let i = 0; i < coord.length; i++) {
    context.beginPath();
    context.moveTo(coord[i][0], coord[i][1]);
    context.strokeStyle = color[i];

    for (let j = 2; j < coord[i].length - 1; j += 2) {
      context.lineTo(coord[i][j], coord[i][j + 1]);
      context.stroke();
    }
  }
}

window.addEventListener("keypress", event => {
	if(event.code === "KeyB") {
		tool = "bucket";
	}

	if(event.code === "KeyP") {
		tool = "pencil";
	}

	if(event.code === "KeyC") {
		tool = "dropper";
	}
	
	highlightTool(toolsPanel, tool);
});

function highlightTool(panel, instrument) {
	panel.forEach((element) => {
		if(element.dataset.tool === instrument) {
			element.classList.add('active');
		}
		else {
			element.classList.remove('active');
		}
	});
}
