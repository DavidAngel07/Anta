import React, { useState, useEffect } from "react";
import axios from "axios";

const Procesos = () => {
  const [lotes, setLotes] = useState([]);
  const [isFormularioVisible, setFormularioVisible] = useState(false);
  const [tipoCuero, setTipoCuero] = useState("");
  const [cantidad, setCantidad] = useState("");

  // Función para formatear la fecha
  const formatearFecha = (fecha) => {
    const options = { year: "numeric", month: "long", day: "2-digit" };
    const nuevaFecha = new Date(fecha).toLocaleDateString("es-ES", options); // Cambia el formato a DD/MM/YYYY
    return nuevaFecha;
  };

// Cargar lotes desde el servidor
useEffect(() => {
  const obtenerLotes = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/lotes_cueros");
      setLotes(response.data);
    } catch (error) {
      console.error("Error al obtener los lotes:", error);
    }
  };
  obtenerLotes();
}, []);

  // Mostrar/ocultar formulario
  const toggleFormulario = () => {
    setFormularioVisible(!isFormularioVisible);
  };

  // Manejar el envío del formulario
  const manejarEnvio = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3001/api/lotes_cueros", {
        tipo_cuero: tipoCuero,
        cantidad,
      });
      if (response.status === 200) {
        alert("Lote creado exitosamente");
        setTipoCuero("");
        setCantidad("");
        setFormularioVisible(false);
        setLotes((prev) => [...prev, response.data]);
      }
    } catch (error) {
      console.error("Error al crear el lote:", error);
      alert("Hubo un error al crear el lote.");
    }
  };


  return (
    <div className="procesos-container">
      {/* Mostrar el botón solo si el formulario no está visible */}
      {!isFormularioVisible && (
        <a href="#crear_lote" onClick={toggleFormulario} className="btn_azul">
          <i className="bi bi-plus-circle"></i> Crear Lote
        </a>
      )}

      {/* Mostrar el formulario si está visible */}
      {isFormularioVisible ? (
        <section id="crear_lote">
          <div className="header-editar">
            <a href="#procesos" onClick={toggleFormulario} className="volver">
              <i className="bi bi-backspace"></i> Volver
            </a>
            <h3>Crear Lote</h3>
          </div>
          <div className="container_crear_lote">
            <form className="frm_agregar_producto" onSubmit={manejarEnvio}>
              <select
                name="tipo_cuero"
                value={tipoCuero}
                onChange={(e) => setTipoCuero(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecciona el tipo de cuero
                </option>
                <option value="res">Res</option>
                <option value="bufalo">Búfalo</option>
              </select>
              <input
                type="number"
                placeholder="Cantidad"
                name="cantidad"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                required
              />
              <button type="submit" className="btn-submit">
                Crear Lote
              </button>
            </form>
          </div>
        </section>
      ) : (
        // Mostrar la tabla de lotes si el formulario no está visible
        <div className="tb">
          <table className="tabla procesos">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Fecha de Creación</th>
                <th>Tipo de Cuero</th>
                <th>Cantidad</th>
                <th>Color</th>
                <th>Proceso Actual</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((lote) => (
                <tr key={lote.id}>
                  <td>{lote.id}</td>
                  <td>{formatearFecha(lote.fecha_creacion)}</td>
                  <td>{lote.tipo_cuero}</td>
                  <td>{lote.cantidad}</td>
                  <td>{lote.color}</td>
                  <td>{lote.proceso_actual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Procesos;
