// components/BarChartProceso.jsx
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import config from "../config";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const coloresPastel = [
  "rgba(173, 216, 230, 0.4)", // Llegada (celeste claro)
  "rgba(144, 238, 144, 0.4)", // Sulfurada (verde claro)
  "rgba(255, 228, 181, 0.4)", // Descaranda y Dividida (naranja claro)
  "rgba(255, 182, 193, 0.4)", // Piquelada (rosado claro)
  "rgba(216, 191, 216, 0.4)", // Teñida (lila claro)
  "rgba(175, 238, 238, 0.4)", // En Almacén (verde agua claro)
];

const coloresBordes = [
  "#00bcd4",
  "#8bc34a",
  "#ff9800",
  "#e91e63",
  "#9c27b0",
  "#009688",
];

const BarChartProceso = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetch(`${config.API_URL}/api/proceso-lotes`)
      .then((res) => res.json())
      .then((data) => {
        const procesosFijos = [
          "Llegada",
          "Sulfurada",
          "Descarnada y Dividida",
          "Piquelada",
          "Teñida",
          "En Almacén",
        ];
      
        // Inicializamos en 0
        const conteo = {};
        procesosFijos.forEach((proceso) => {
          conteo[proceso] = 0;
        });
      
        // Mapa de correcciones si algún nombre llega mal
        const correcciones = {
          "descaranda y dividida": "Descarnada y Dividida",
          "descarnada y dividida": "Descarnada y Dividida",
          "descaranda": "Descarnada y Dividida",
          "descarnada": "Descarnada y Dividida",
          // Puedes agregar más si detectas errores en otros procesos
        };
      
        data.forEach((item) => {
          let procesoRaw = (item.nombre_proceso || item.proceso || "Desconocido").toLowerCase().trim();
          const procesoCorregido = correcciones[procesoRaw] || 
            procesosFijos.find(p => p.toLowerCase() === procesoRaw);
      
          if (procesoCorregido && conteo.hasOwnProperty(procesoCorregido)) {
            conteo[procesoCorregido] += 1;
          }
        });
      
        const labels = procesosFijos;
        const values = procesosFijos.map((proceso) => conteo[proceso]);
      
        setChartData({
          labels,
          datasets: [
            {
              label: "Cantidad de lotes",
              data: values,
              backgroundColor: labels.map((_, index) => coloresPastel[index % coloresPastel.length]),
              borderColor: labels.map((_, index) => coloresBordes[index % coloresBordes.length]),
              borderWidth: 2,
              borderRadius: 10,
            },
          ],
        });
      })
      
      .catch((error) => {
        console.error("Error al obtener datos:", error);
      });
  }, []);
  

  return (
    <div className="bar-chart-container">
      <h2 className="bar-chart-title">Lotes por proceso</h2>
      {chartData ? (
        <>
          <Bar
            data={chartData}
            options={{
              plugins: {
                legend: { display: false }, // Ocultamos leyenda automática
              },
              scales: {
                y: {
                  ticks: { stepSize: 2 },
                  beginAtZero: true,
                },
              },
            }}
          />
          <div className="custom-legend">
            {chartData.labels.map((label, index) => (
              <div className="legend-item" key={index}>
                <div
                  className="legend-color"
                  style={{ backgroundColor: coloresBordes[index % coloresBordes.length] }}
                ></div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p>Cargando datos...</p>
      )}
    </div>
  );
};

export default BarChartProceso;
