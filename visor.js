async function loadJson(url) {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) {
        throw new Error(`Error al descargar JSON: ${resp.status} ${resp.statusText}`);
    }
    return await resp.json(); // convierte automáticamente a objeto/array
}

function normalize_data(records) {
    let norm_data = []
    records.forEach(record => {
        for (h = 1; h <= 24; h++) {
            norm_data.push({
                PROVINCIA: record.PROVINCIA,
                MUNICIPIO: record.MUNICIPIO,
                ESTACION: record.ESTACION,
                MAGNITUD: record.MAGNITUD,
                ANO: record.ANO,
                MES: record.MES,
                DIA: record.DIA,
                HORA: h,
                VALOR: parseFloat(record[`H${h.toString().padStart(2, '0')}`]),
                VALIDEZ: record[`V${h.toString().padStart(2, '0')}`],
            });
        }

    });
    return norm_data;
}

function prepare_box_data(temp_data) {
    let data = []
    for (h = 1; h <= 24; h++) {
        let td = temp_data.filter(p => p.HORA === h)
        let vl = [];
        td.forEach(e => { vl.push(e.VALOR) });
        data.push({
            type: 'box',
            y: vl,
            name: h,
            boxmean: true,
        });
    };
    return data
}

(async () => {
    try {
        const url = "https://ciudadesabiertas.madrid.es/dynamicAPI/API/query/meteo_tiemporeal.json?pageSize=5000"; // reemplaza por tu URL
        const data = await loadJson(url);
        console.log("JSON cargado en memoria:", data);
        response = data;
        let norm_data = normalize_data(response.records);
        console.log("datos normalizados", norm_data);
        temp_data = norm_data.filter(item => item.MAGNITUD === "83" && item.VALIDEZ === "V");
        console.log("datos temperatura", temp_data);
        let plot_data = prepare_box_data(temp_data);
        console.log("datos plot", plot_data);

        const layout = {
            title: { text: 'Temperaturas de hoy' },
            legend: { visible: false },
            xaxis: { autorangeoptions: { maxallowed: 24 }, dtick: 1 },
            font: { size: 12 },
            plot_bgcolor: 'rgba(250,250, 250, 0.5)',
            paper_bgcolor: 'rgba(250,250, 250, 0.5)',
            font: {
                family: 'verdana, arial, sans-serif',
                size: 12,
                color: 'rgb(100,150,200)'
            },
        };

        const plot_conf = { responsive: true }

        TESTER = document.getElementById('tester');
        Plotly.newPlot(TESTER, plot_data, layout, plot_conf);

    } catch (err) {
        console.error(err);
    }
})();




