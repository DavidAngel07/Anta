import React, { useState } from "react";
import Insumos from "./Insumos";
import Cueros from "./Cueros";
import EnProceso from "./EnProceso";

const Inventario = () => {
  const [inventarioActivo, setInventarioActivo] = useState("");

  const handleVolver = () => {
    setInventarioActivo("");
  };

  return (
    <div>
      {inventarioActivo === "" ? (
        <>
        <div className="inventario-container">
          <h1 className="inventario-title">Inventario</h1>
          <p className="inventario-subtitle">Selecciona el modulo con el que quieres interactuar</p>
          
          <div className="cards-container">
            <div className="card card-inventario" onClick={() => setInventarioActivo("insumos")}>
              <h2 className="card-title">INSUMOS</h2>
              <p className="card-text">Gestión de los insumos disponibles para los procesos de curtido, incluyendo su registro, control y actualización.</p>
            </div>

            <div className="card card-inventario" onClick={() => setInventarioActivo("proceso")}>
              <h2 className="card-title">EN PROCESO</h2>
              <p className="card-text">Seguimiento de los lotes de cuero que se encuentran en fase de producción, con información detallada sobre su estado y etapa del proceso.</p>
            </div>

            <div className="card card-inventario" onClick={() => setInventarioActivo("almacen")}>
              <h2 className="card-title">ALMACEN</h2>
              <p className="card-text">Administración del inventario de cueros finalizados, listos para su comercialización, con control de cantidades.</p>
            </div>
          </div>
          </div>
        </>
      ) : (
        <>
          <button className="btn-volver" onClick={handleVolver}>
            <i className="bi bi-backspace"></i>Volver
          </button>
          
          {inventarioActivo === "insumos" && <Insumos />}
          {inventarioActivo === "proceso" && <EnProceso />}
          {inventarioActivo === "almacen" && <Cueros />}
        </>
      )}
    </div>
  );
};
export default Inventario;
