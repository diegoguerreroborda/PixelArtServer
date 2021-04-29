
window.onload = function () {
  var mouse = false;
  var canvas = document.getElementById("canvas1");
  var contenedor = document.getElementById("Contenedor");
  var cuadritos = [];
  var sizeCuadro = { ancho: 100, alto: 100 };
  
  var inputColor = document.getElementById("color");
  var inputSizeCuadros = document.getElementById("sizeCuadros");

  var x_select;
  var x_pixel_select;
  var y_select;
  var y_pixel_select;
  var color = "";

  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    if (ctx) {
      function dibujaGrid(disX, disY, anchoLinea, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = anchoLinea;
        var columnas = [];
        var filas = [];
        columnas.push(0);
        filas.push(0);
        for (i = disX; i < canvas.width; i += disX) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
          columnas.push(i);
        }
        for (i = disY; i < canvas.height; i += disY) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(ctx.canvas.width, i);
          ctx.stroke();
          filas.push(i);
        }
        for (x = 0; x < columnas.length; x++) {
          for (y = 0; y < filas.length; y++) {
            cuadritos.push([columnas[x], filas[y], disX, disY, x, y]);
          }
        }
        //console.log('columnas', columnas);
        //console.log('filas  ', filas);
      }

      function fillCell(x, y, colorC) {
        console.log('x: ', x, 'y: ', y);
        //console.log(cuadritos);
        ctx.fillStyle = colorC;
        for (i = 0; i < cuadritos.length; i++) {
          var cuadro = cuadritos[i];
          if(x == cuadro[4] && y == cuadro[5]){
            //console.log('cuadro  ', cuadro);
              ctx.fillRect(
                cuadro[0],
                cuadro[1],
                sizeCuadro.ancho,
                sizeCuadro.alto
              );
              console.log('x_select ', x_select);
              console.log('y_select ', y_select);
              break;
          }
        }
        dibujaGrid(sizeCuadro.ancho, sizeCuadro.alto, 0.4, "#44414B");
      }

      function addPixel(x, y, color){
        axios.get('/new_pixel', {
          params: {
            x: x,
            y: y,
            color: color
          }
        }).then(response => {
          console.log(response)
          /*
          servers: [];
          for(let i=0; i <= response.data.length; i++){
            app4.servers.push({lastname: response.data[i]["lastname"], surname: response.data[i]["surname"], phone: response.data[i]["phone"]})
          }
          */
        }).catch(e => {
          console.log(e);
        })
      }

      canvas.onclick = function (e) {
        var canvaspos = canvas.getBoundingClientRect();
        x_pixel_select = e.clientX - canvaspos.left
        y_pixel_select = e.clientY - canvaspos.top
        color = inputColor.value;
        console.log('color ', color);
        for (i = 0; i < cuadritos.length; i++) {
          var cuadro = cuadritos[i];
          if (x_pixel_select > cuadro[0] && x_pixel_select < cuadro[0] + cuadro[2] && y_pixel_select > cuadro[1] && y_pixel_select < cuadro[1] + cuadro[3]) {
            //console.log('cuadro  ', cuadro);
            x_select = cuadro[4]
            y_select = cuadro[5]
            break;
          }
        }
        //fillCell(x_select, y_select);
        //Aqui envia
        addPixel(x_select, y_select, color)
      };

      canvas.onmousedown = function () {
        mouse = true;
      };

      canvas.onmouseup = function () {
        mouse = false;
      };

      canvas.width = contenedor.offsetWidth - 400;
      dibujaGrid(sizeCuadro.ancho, sizeCuadro.alto, 1, "#44414B");
    } else {
      alert("No se pudo cargar el contexto");
    }

    var socket = io()
    socket.on('server/list_art_work', function(list){
      console.log(list)
      list.forEach(function(pixel){
        console.log(list)
        fillCell(pixel.pixel.x, pixel.pixel.y, pixel.color)
      })
  })
  }
};