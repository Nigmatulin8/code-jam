import './styles.scss';

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// Заливка всего холста в белый цвет.
// Пипетка после клика на холст будет использовать белый цвет.
context.fillStyle = 'rgba(255, 255, 255, 255)';
context.fillRect(0, 0, canvasWidth, canvasHeight);

const toolsPanel = [...document.querySelectorAll('.tools__list')[0].children];

const activeColorPanel = [...document.querySelectorAll('.tools__list')[1].children];
const colorPanel = activeColorPanel.slice(2, activeColorPanel.length);
const prevColorPalette = activeColorPanel[1];

const colorPaletteBtn = document.getElementsByClassName("colorPalette")[0];

const getImg = document.getElementsByClassName('getRandomImg')[0];
const imgToSearch = document.getElementsByClassName('imgToSearch')[0];

const url = 'https://api.unsplash.com/photos/random?query=';
const accessKey = '&client_id=2a14a529a9005420bf553fd4f6bf782c01a1669e804f5a786d72bc18b8dd82c1';

const grayBtn = document.getElementsByClassName("grayBtn")[0];
const clearBtn = document.getElementsByClassName("clearCanvas")[0];

let tool = '';
let draw = false;

let coords = [];
const fullCoord = [];

let currentColor = 'rgba(0, 0, 0, 255)';
let prevColor = 'rgba(0, 0, 0, 255)';

let usedColors = [];

recoveryImg();

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

      colorPaletteBtn.style.backgroundColor = currentColor;
      colorPaletteBtn.value = rgbToHex(currentColor);
    }
  });
});

//Очистка канваса
clearBtn.addEventListener("click", () => {
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = 'rgba(255, 255, 255, 255)';
  context.fillRect(0, 0, canvasWidth, canvasHeight);
});

const hex2rgba = (hex, alpha = 1) => {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));

  return `rgba(${r},${g},${b},${alpha})`;
};

function drawPixel(canvas, startX, startY, sizePixel, color) {
  if (color.length === 6) {
    canvas.fillStyle = hex2rgba(color);
  } 
  else {
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

colorPaletteBtn.addEventListener("input", e => {
  let newColor = hex2rgb(e.target.value);

  prevColor = currentColor;
  currentColor = newColor;

  if (currentColor !== prevColor) {
    activeColorPanel[0].children[0].style.backgroundColor = currentColor;
    activeColorPanel[1].children[0].style.backgroundColor = prevColor;

    colorPaletteBtn.style.backgroundColor = currentColor;
  }
});

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
      
      colorPaletteBtn.style.backgroundColor = currentColor;
      colorPaletteBtn.value = rgbToHex(currentColor);
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

  if (currentColor !== prevColor) {
    activeColorPanel[0].children[0].style.backgroundColor = prevColor;
    activeColorPanel[1].children[0].style.backgroundColor = currentColor;

    colorPaletteBtn.style.backgroundColor = prevColor;
    colorPaletteBtn.value = rgbToHex(prevColor);

    temp = currentColor;
    currentColor = prevColor;
    prevColor = temp;
  }
});

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

getImg.addEventListener('click', (event) => {
  let full_url = url;
  let data = imgToSearch.value.split(' ');

  for(let i = 0; i < data.length; i++) {
    (i !== data.length - 1) ? full_url += data[i] + ',' : 
                              full_url += data[i];
  }

  full_url += accessKey;

  fetch(full_url)
    .then(res => res.json())
    .then(data => { 
      let newImg = new Image();
      newImg.src = data.urls.small;
      newImg.crossOrigin = "Anonymous";

      newImg.onload = function () {   
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        
        //Значения для масштабирования изображения на холсте
        const widthRatio = canvas.width / newImg.width;
        const heightRation = canvas.height / newImg.height;

        const ratio = Math.min(widthRatio, heightRation);

        const x = (canvas.width - newImg.width * ratio) / 2;
        const y = (canvas.height - newImg.height * ratio) / 2;

        context.drawImage(newImg, 0, 0, newImg.width, newImg.height, x, y, newImg.width * ratio, newImg.height * ratio);

        window.sessionStorage.setItem('currentCanvas', canvas.toDataURL());

        recoveryImg();
      };
    });
});

grayBtn.addEventListener('click', () => {
  const currentImg = context.getImageData(0, 0, canvasWidth, canvasHeight);
  let pixel = currentImg.data;

  for (let i = 0, len = pixel.length; i < len; i += 4) {
      let grayscale = pixel[i] * 0.3 + pixel[i + 1] * 0.59 + pixel[i + 2] * 0.11;

      pixel[i] = grayscale; // red
      pixel[i+1] = grayscale; // green
      pixel[i+2] = grayscale; // blue
  }

  context.putImageData(currentImg, 0, 0);
})


//Восстановление изображения на холсте
function recoveryImg() {
  if (window.sessionStorage.length) {
    if(!window.sessionStorage.currentCanvas) {
      recoveryPainting(window.sessionStorage.getItem('coords'), window.sessionStorage.getItem('colors'));
      usedColors = [];
    }
  
    else {
      if(window.sessionStorage.getItem('coords')) {
        recoveryPainting(window.sessionStorage.getItem('coords'), window.sessionStorage.getItem('colors'));
        usedColors = [];
      }
  
      const newImg = new Image();
      let img = window.sessionStorage.getItem('currentCanvas');
  
      newImg.src = img;
      
      newImg.onload = function() {
        context.drawImage(newImg, 0, 0);
      }
    }
  }  
}

//Подсветка активных пунктов меню
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

//Из rgba(255, 255, 255, 255) в #ffffff
function rgbToHex(color){
  color = color.replace(/[^\d,]/g,"").split(","); 
  return "#"+ ((1 << 24) + ( +color[0] << 16) + (+color[1] << 8) + +color[2]).toString(16).slice(1);
}

//Из #ffffff в rgba(255, 255, 255, 255)
function hex2rgb(c) {
  let bigint = parseInt(c.split('#')[1], 16);

  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, 255)`;
}
