class Hexawinners {
    constructor(divContainer) {
        this._divContainer = divContainer;
    }

    async Init() {
        this._createInterface();
        this._setDomObjects();
        this._bindEvents();
    }

    _createInterface() {
        let formLines = "";

        for (let index = 1; index <= 10; index++) {
            formLines += this._formLineString(index);
        }

        this._divContainer.innerHTML =
            `<div class="frm" id="hexafrm">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" role="switch" id="requierenImagen">
                    <label class="form-check-label" for="requierenImagen">Requieren Imagen</label>
                </div>

                <table class="table table-dark table-striped table-hover table-sm" id="frmTable">
                    <thead>
                        <tr>
                            <th>Puesto</th>
                            <th>Puntaje</th>
                            <th>Nombre completo</th>
                            <th>Imagen</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${formLines}
                    </tbody>
                </table>
            </div>
            
            <button type="button" class="btn btn-primary">Generar Imagen</button>

            <div class="img-result my-3">
                <svg id="svg" width="1000" height="1000">
                </svg>
            </div>`;
    }

    _formLineString(index) {
        return `<tr>
                    <td>${index}</td>
                    <td><input class="form-control form-control-sm" type="number" value="0" step="0.01" name="puntaje" id="puntaje-${index}" placeholder="puntaje" required></td>
                    <td><input class="form-control form-control-sm" type="text" name="nombre" id="nombre-${index}" placeholder="nombre completo" required></td>
                    <td><div class="no-img" id="has-img-${index}"></div></td>
                </tr>
                `;
    }

    _setDomObjects() {
        this._switchImg = this._divContainer.querySelector("input.form-check-input");
        this._table = this._divContainer.querySelector("table");
        this._button = this._divContainer.querySelector("button");
        this._svg = this._divContainer.querySelector("svg");
    }

    _bindEvents() {
        this._button.addEventListener("click", async () => { await this._onGenerateButtonClick(); });
    }

    async _getFormData() {
        let data = [];
        let index = 1;
        let rows = Array.from(this._table.querySelectorAll("tbody tr"));
        for (let row of rows) {
            let inputs = row.querySelectorAll("td input");
            let puntaje = this._str2Decimal(inputs[0].value);
            let nombreCompleto = inputs[1].value.toUpperCase();
            let image;
            try {
                image = await this._getImage(index);
            } catch {
                image = null;
            }
            data.push({ puesto: index, puntaje: puntaje, nombre: nombreCompleto, image: image });
            index++;
        }
        return data;
    }

    _str2Decimal(str) {
        try {
            let num = parseFloat(str);
            return (isNaN(num) ? 0.00 : num);
        } catch {
            return 0.00;
        }
    }

    _getImage(position) {
        return new Promise((resolve, reject) => {
            // set the file name by position
            let fileName = "images/im_p_" + position + ".png";
            // Create an Image object
            let image = new Image();
            // Set the image source
            image.src = fileName;
            // if the load is successful, resolve the promise with the image
            image.onload = function () {
                resolve(image);
            };
            // if the load fail, reject the promise
            image.onerror = function () {
                reject(new Error('La imagen no se pudo cargar'));
            };
        });
    }


    async _validateInput() {
        let data = await this._getFormData();
        let resultObj = { result: true, message: "", data: null };
        let puntajeCero = data.filter(elem => elem.puntaje == 0)
            .map(elem => elem.puesto)
            .join();
        let nombresVacios = data.filter(elem => elem.nombre == "")
            .map(elem => elem.puesto)
            .join();
        let imagenesVacias = data.filter(elem => elem.image === null)
            .map(elem => elem.puesto)
            .join();

        if (puntajeCero.length > 0) {
            resultObj.result = false;
            resultObj.message += `Los puestos ${puntajeCero} tienen puntaje cero\r\n`;
        }
        if (nombresVacios.length > 0) {
            resultObj.result = false;
            resultObj.message += `Los puestos ${nombresVacios} tienen nombres vacíos\r\n`;
        }
        if (this._switchImg.checked && imagenesVacias.length > 0) {
            resultObj.result = false;
            resultObj.message += `Los puestos ${imagenesVacias} no tienen imagen\r\n`;
        }
        resultObj.data = data;
        return resultObj;
    }

    async _onGenerateButtonClick() {
        let validResult = await this._validateInput();
        if (!validResult.result) {
            alert(validResult.message);
        } else {
            // generar la imagen
            let hexImg = new HexaImage(validResult.data, this._switchImg.checked);
            hexImg._generateImage();
        }
    }

}

class HexaImage {

    constructor(data, useImage) {
        this._data = data;
        this._useImage = useImage;
    }

    // Definir una función para crear un hexágono con SVG
    _createHexagon(x, y, r, color) {
        // x, y son las coordenadas del centro del hexágono
        // r es el radio del hexágono
        // color es el color de relleno del hexágono
        // Devuelve un elemento <polygon> con los atributos correspondientes
        let puntos = ""; // Variable para almacenar los puntos del hexágono
        let angulo = -Math.PI / 6; // Variable para almacenar el ángulo de cada vértice
        for (let i = 0; i < 6; i++) {
            // Calcular las coordenadas de cada vértice
            let vx = x + r * Math.cos(angulo);
            let vy = y + r * Math.sin(angulo);
            // Añadir las coordenadas al atributo points
            puntos += vx + "," + vy + " ";
            // Incrementar el ángulo en 60 grados
            angulo += Math.PI / 3;
        }
        // Crear un elemento <polygon>
        let hexagon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        // Asignar los atributos al elemento
        hexagon.setAttribute("points", puntos);
        hexagon.setAttribute("fill", color);
        hexagon.setAttribute("stroke", "black");
        // Devolver el elemento
        return hexagon;
    }

    // Definir una función para crear una imagen dentro de un hexágono con SVG
    _createImage(x, y, r, url) {
        // x, y son las coordenadas del centro del hexágono
        // r es el radio del hexágono
        // url es la dirección de la imagen
        // Devuelve un elemento <image> con los atributos correspondientes
        // Crear un elemento <image>
        let imageSvg = document.createElementNS("http://www.w3.org/2000/svg", "image");
        // Asignar los atributos al elemento
        imageSvg.setAttribute("x", x - r);
        imageSvg.setAttribute("y", y - r);
        imageSvg.setAttribute("width", 2 * r);
        imageSvg.setAttribute("height", 2 * r);
        imageSvg.setAttribute("href", url);
        imageSvg.setAttribute("clip-path", "url(#hexagon)");
        // Devolver el elemento
        return imageSvg;
    }

    // Definir una función para crear un texto dentro de un hexágono con SVG
    _createText(x, y, r, texto) {
        // x, y son las coordenadas del centro del hexágono
        // r es el radio del hexágono
        // texto es el texto a mostrar
        // Devuelve un elemento <text> con los atributos correspondientes
        // Crear un elemento <text>
        let textSvg = document.createElementNS("http://www.w3.org/2000/svg", "text");
        // Asignar los atributos al elemento
        textSvg.setAttribute("x", x);
        textSvg.setAttribute("y", y);
        textSvg.setAttribute("text-anchor", "middle");
        textSvg.setAttribute("dominant-baseline", "middle");
        textSvg.setAttribute("font-size", r / 4);
        textSvg.setAttribute("fill", "white");
        textSvg.textContent = texto;
        // Devolver el elemento
        return textSvg;
    }

    // Definir una función para generar el código SVG de la imagen de los hexágonos
    _generateImage() {
        // Limpiar el contenido del elemento SVG
        svg.innerHTML = "";
        // Definir el radio de los hexágonos
        let r = 100;
        // Definir los colores de los hexágonos según el puesto
        let colores = ["gold", "silver", "brown", "green", "blue", "purple", "pink", "orange", "red", "black"];
        // Definir las coordenadas del centro del primer hexágono
        let x = 300;
        let y = 200;
        // Definir un contador para el puesto
        let puesto = 0;
        // Crear un elemento <defs> para definir el clip-path de los hexágonos
        let defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        // Crear un elemento <clipPath> con el id "hexagono"
        let clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
        clipPath.setAttribute("id", "hexagon");
        // Crear un hexágono con el mismo radio y color transparente
        let hexagon = this._createHexagon(0, 0, r, "transparent");
        // Añadir el hexágono al clipPath
        clipPath.appendChild(hexagon);
        // Añadir el clipPath al defs
        defs.appendChild(clipPath);
        // Añadir el defs al svg
        svg.appendChild(defs);
        // Crear un bucle para recorrer las filas de la rejilla de hexágonos
        for (let i = 0; i < 4; i++) {
            // Crear un bucle para recorrer las columnas de la rejilla de hexágonos
            for (let j = 0; j < 4 - i; j++) {
                // Incrementar el contador del puesto
                puesto++;
                // Obtener el color del hexágono según el puesto
                let color = colores[puesto - 1];
                // Crear un hexágono con las coordenadas, el radio y el color correspondientes
                hexagon = this._createHexagon(x, y, r, color);
                // Añadir el hexágono al svg
                svg.appendChild(hexagon);
                // Obtener el nombre y el puntaje del estudiante según el puesto
                let nombre = this._data[puesto-1].nombre;
                let puntaje = this._data[puesto-1].puntaje;
                // Crear un texto con las coordenadas, el radio y el nombre y el puntaje del estudiante
                let texto = this._createText(x, y, r, nombre + "\n" + puntaje);
                // Añadir el texto al svg
                svg.appendChild(texto);
                
                // Si la marca es verdadera, verificar si existe la imagen en la carpeta
                if (this._useImage) {
                    // Obtener la marca de la imagen del estudiante según el puesto
                    let imagen = this._data[puesto-1].image;
                    let url = imagen.src;
                    // let url = "images/im_p_" + puesto + ".png";
                    // Crear una imagen con las coordenadas, el radio y la url correspondientes
                    let imagenSvg = this._createImage(x, y, r, url);
                    // Añadir la imagen al svg
                    svg.appendChild(imagenSvg);
                }
                // Actualizar las coordenadas del centro del siguiente hexágono en la misma fila
                x += 2 * r * Math.cos(Math.PI / 6);
                // Si se llega al final de la fila, actualizar las coordenadas del centro del primer hexágono de la siguiente fila
                if (j == 3 - i) {
                    x = 300 + r * Math.cos(Math.PI / 6);
                    y += 1.5 * r;
                }
                // Si se llega al último hexágono, terminar el bucle
                if (puesto == 10) {
                    break;
                }
            }
            // Si se llega al último hexágono, terminar el bucle
            if (puesto == 10) {
                break;
            }
        }
    }
}
