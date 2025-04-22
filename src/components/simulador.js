// simulador.js - Main component that manages calculator selection

import React, { useState } from "react";
import CalculadoraProcesos from "./CalculadoraProcesos";
import CalculadoraCostos from "./CalculadoraCostos";

const Simulador = () => {
  const [calculadoraActiva, setCalculadoraActiva] = useState("procesos"); // 'procesos' o 'costos'

  return (
    <div className="simulador-container">
      <div className="calculadora-selector">
        <button
          className={`btn-selector ${
            calculadoraActiva === "procesos" ? "active" : ""
          }`}
          onClick={() => setCalculadoraActiva("procesos")}
        >
          Calculadora de Procesos
        </button>
        <button
          className={`btn-selector ${
            calculadoraActiva === "costos" ? "active" : ""
          }`}
          onClick={() => setCalculadoraActiva("costos")}
        >
          Calculadora de Costos
        </button>
      </div>

      {calculadoraActiva === "procesos" ? (
        <CalculadoraProcesos />
      ) : (
        <CalculadoraCostos />
      )}
    </div>
  );
};

export default Simulador;
