async function loadJson(url) {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) {
        throw new Error(`Error al descargar JSON: ${resp.status} ${resp.statusText}`);
    }
    return await resp.json(); // convierte automáticamente a objeto/array
}

function prepare_box_data(temp_data) {
    const headerNames = Object.keys(temp_data[0])
    const headerValues = [];
    const cellValues = [];
    for (i = 0; i < headerNames.length; i++) {
        const headerValue = [headerNames[i]];
        headerValues[i] = headerValue;
        const cellValue = temp_data.map(c => c[headerValue])
        cellValues[i] = cellValue;
    }
    const plot_data = [{
        type: 'table',
        columnwidth: [150, 600, 1000, 900, 600, 500, 1000, 1000, 1000],
        columnorder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        header: {
            values: headerValues,
            align: "center",
            line: { width: 1, color: 'rgb(50, 50, 50)' },
            fill: { color: ['rgb(235, 100, 230)'] },
            font: { family: "Arial", size: 12, color: "white" }
        },
        cells: {
            values: cellValues,
            align: ["center", "center"],
            line: { color: "black", width: 1 },
            fill: { color: ['rgba(228, 222, 249, 0.65)', 'rgb(235, 193, 238)', 'rgba(228, 222, 249, 0.65)'] },
            font: { family: "Arial", size: 12, color: ["black"] }
        }
    }]
    return plot_data
}

async function load_data(url) {
    const data = await loadJson(url);
    console.log("JSON cargado en memoria:", data);
    return data;
}

function plot_temp_data2(plot_data, hora, div) {
    div.innerHTML = ""
    plot_data.forEach(i => {
        const item = document.createElement("li");
        item.textContent = `${i.address} (${i.name})`;
        div.appendChild(item);
    })
}

function plot_temp_data(plot_data, div) {
    const ploty_data = prepare_box_data(plot_data)
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString();
    const layout = {
        title: { text: `Aparcamientos [ ${hora} ]` },
        font: { size: 12 },
        plot_bgcolor: 'rgba(250, 250, 250, 1)',
        paper_bgcolor: 'rgba(20, 106, 219, 1)',
        font: {
            family: 'verdana, arial, sans-serif',
            size: 12,
            color: 'rgb(100,150,200)'
        },
    };
    const plot_conf = { responsive: true }
    Plotly.newPlot(div, ploty_data, layout, plot_conf);
}

async function load_aparcamientos() {
    const url_listado = "https://servayto.madrid.es/MTPAR_RSINFO/restInfoParking/listParking?language=ES"
    const host_servicio = "https://servayto.madrid.es";
    const path_aparcamiento_detalle = "/MTPAR_RSINFO/restInfoParking/detailParking";

    const listado_aparcamientos = await load_data(url_listado)
    await Promise.all(listado_aparcamientos.map(async a => {
        const params = {
            id: a.id,
            family: a.familyCode,
            date: (new Date()).toISOString(),
            language: "ES",
            publicData: "true"
        };
        const url_detalle = new URL(path_aparcamiento_detalle, host_servicio);
        Object.entries(params).forEach(([key, value]) => url_detalle.searchParams.append(key, value));
        const aparcamiento_detalle = await load_data(url_detalle);
        a['ocupacion_disponible'] = !!aparcamiento_detalle['lstOccupation'];
        if (a['ocupacion_disponible']) {
            a['ocupacion_plazas_libres'] = aparcamiento_detalle['lstOccupation'][0]['free'];
            a['ocupacion_hora_dato'] = aparcamiento_detalle['lstOccupation'][0]['moment'];
        } else {
            a['ocupacion_plazas_libres'] = null;
            a['ocupacion_hora_dato'] = null;
        }
    }));

    return listado_aparcamientos
}


function mostrarMapa(aparcamientos) {
    // Si el mapa ya existe, elimínalo para evitar duplicados
    if (window._leafletMap) {
        window._leafletMap.remove();
    }

    // Centra el mapa en Madrid (puedes ajustar según tus datos)
    const centro = [40.4168, -3.7038];
    const map = L.map('map').setView(centro, 12);
    window._leafletMap = map; // Guarda referencia global para limpiar después

    // Añade capa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Iconos personalizados
    const iconVerde = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const iconGris = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    const iconAmarillo = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const iconNaranja = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Añade marcadores
    aparcamientos.forEach(a => {
        if (a.latitude && a.longitude) {
            let icon;
            if (!a.ocupacion_disponible || a.ocupacion_plazas_libres === null) {
                icon = iconGris;
            } else if (a.ocupacion_plazas_libres <= 10) {
                icon = iconNaranja;
            } else if (a.ocupacion_plazas_libres <= 30) {
                icon = iconAmarillo;
            } else {
                icon = iconVerde;
            }
            L.marker([a.latitude, a.longitude], { icon })
                .addTo(map)
                .bindPopup(`<b>${a.name}</b><br>${a.address}<br>Plazas libres: ${a.ocupacion_plazas_libres ?? "N/D"}`);
        }
    });
}


async function load_show() {
    try {

        const spinner = document.getElementById("spinner");
        const tester = document.getElementById('tester');
        spinner.style.display = "block"; // Mostrar spinner
        //tester.style.display = "none"; //oculta el grafico
        const listado_aparcamientos = await load_aparcamientos()
        console.log('listado aparcamientos', listado_aparcamientos)
        //plot_temp_data(plot_data, tester);
        const tabla = new Tabulator("#tabla-aparcamientos", {
            data: listado_aparcamientos,
            height: 200,
            layout: "fitColumns",
            columns: [
                { title: "Nombre", field: "name", sorter: "string", headerFilter: "input" },
                { title: "Dirección", field: "address", sorter: "string", headerFilter: "input" },
                { title: "Hay libres", field: "ocupacion_disponible", sorter: "string", headerFilter: "input" },
                { title: "Numero libres", field: "ocupacion_plazas_libres", sorter: "number", headerFilter: "input" },
                { title: "Hora info", field: "ocupacion_hora_dato", sorter: "date", headerFilter: "input" },
                // ...más columnas según tus datos
                // ...más columnas según tus datos
            ],
        });
        // Muestra el mapa con los puntos
        mostrarMapa(listado_aparcamientos);

        //tester.style.display = "block";
    } catch (error) {
        const errorItem = document.createElement("li");
        errorItem.textContent = "Error al cargar los datos: " + error.message;
        errorItem.style.color = "red";
        lista.appendChild(errorItem);
    } finally {
        spinner.style.display = "none"; // Ocultar spinner
    }

}

document.getElementById("cargarBtn").addEventListener("click", load_show);






