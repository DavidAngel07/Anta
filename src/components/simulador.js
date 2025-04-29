import React, { useState } from "react";
import CalculadoraProcesos from "./CalculadoraProcesos";
import CalculadoraCostos from "./CalculadoraCostos";

const Simulador = () => {
  const [calculadoraActiva, setCalculadoraActiva] = useState(""); // 'procesos' o 'costos'

  const handleVolver = () => {
    setCalculadoraActiva("");
  };

  return (
    <div>      
      {calculadoraActiva === "" ? (
        <>
        <div className="inventario-container">
        <h1 className="inventario-title">Calculadora</h1>
        <p className="inventario-subtitle">Selecciona una opción</p>
          <div className="cards-container-calculator">
            <div className="card card-calculator" onClick={() => setCalculadoraActiva("procesos")}>
            <i className="bi bi-hdd-rack" style={{color: "#0026bf", fontSize: "150px" }}></i>
              <h2 className="card-title">PROCESOS</h2>
            </div>
            <div className="card card-calculator" onClick={() => setCalculadoraActiva("costos")}>
            <i class="bi bi-cash-coin" style={{color: "#0026bf", fontSize: "150px" }}></i>
              <h2 className="card-title">COSTOS</h2>
            </div>
          </div>
          </div>
          </>
          ) : (
            <>
          <button className="btn-volver" onClick={handleVolver}>
                <i className="bi bi-backspace"></i>Volver
              </button>
    
          {calculadoraActiva === "procesos" && <CalculadoraProcesos />}
          {calculadoraActiva === "costos" && <CalculadoraCostos />}
        </>
        )}
      </div>
  );
};

export default Simulador;