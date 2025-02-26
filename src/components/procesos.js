import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Lote from "../components/Lote";

const Procesos = () => {
  const [lotes, setLotes] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [isFormularioVisible, setFormularioVisible] = useState(false);
  const [tipoCuero, setTipoCuero] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [peso, setPeso] = useState("");
  const [procesoActual, setProcesoActual] = useState("");
  const [activeSection, setActiveSection] = useState("procesos"); // Estado para manejar la sección activa
  const [selectedLote, setSelectedLote] = useState(null); // Almacena el lote seleccionado

  const navigate = useNavigate();

  useEffect(() => {
    const obtenerLotes = async () => {
      try {
        const response = await axios.get("https://anta-production.up.railway.app/api/lotes_cueros");
        setLotes(response.data);
      } catch (error) {
        console.error("Error al obtener los lotes:", error);
      }
    };

    const obtenerProcesos = async () => {
      try {
        const response = await axios.get("https://anta-production.up.railway.app/api/procesos");
        setProcesos(response.data);
      } catch (error) {
        console.error("Error al obtener los procesos:", error);
      }
    };

    obtenerLotes();
    obtenerProcesos();
  }, []);

  const toggleFormulario = () => {
    setFormularioVisible(!isFormularioVisible);
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("https://anta-production.up.railway.app/api/lotes_cueros", {
        tipo_cuero: tipoCuero,
        cantidad,
        peso,
        proceso_actual: procesoActual,
      });
      if (response.status === 200) {
        alert("Lote creado exitosamente");
        setTipoCuero("");
        setCantidad("");
        setPeso("");
        setProcesoActual("");
        setFormularioVisible(false);
        setLotes((prev) => [...prev, response.data.lote]);
      }
    } catch (error) {
      console.error("Error al crear el lote:", error);
      alert("Hubo un error al crear el lote.");
    }
  };

  const mostrarLote = (lote) => {
    setSelectedLote(lote);
    setActiveSection("lote");
  };

  return (
    <div className="procesos-container">
      {activeSection === "procesos" && (
        <>
          {!isFormularioVisible && (
            <a href="#crear_lote" onClick={toggleFormulario} className="btn_azul">
              <i className="bi bi-plus-circle"></i> Crear Lote
            </a>
          )}

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
                  <input
                    type="number"
                    placeholder="Peso"
                    name="peso"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-submit">
                    Crear Lote
                  </button>
                </form>
              </div>
            </section>
          ) : (
            <div className="tb">
              <table className="tabla procesos">
                <thead>
                  <tr>
                    <th>Lote</th>
                    <th>Fecha de Creación</th>
                    <th>Tipo de Cuero</th>
                    <th>Cantidad</th>
                    <th>Peso</th>
                    <th>Proceso Actual</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lotes.map((lote) => (
                    <tr key={lote.id}>
                      <td>{lote.id}</td>
                      <td>{new Date(lote.fecha_creacion).toLocaleDateString("es-ES")}</td>
                      <td>{lote.tipo_cuero}</td>
                      <td>{lote.cantidad}</td>
                      <td>{lote.peso} kl</td>
                      <td>{lote.proceso_actual}</td>
                      <td>
                      <a href="#lote" className="btn_ver" onClick={() => mostrarLote(lote)}>
                          Ver
                      </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeSection === "lote" && selectedLote && (
        <section id="lote">
          <a href="#procesos" onClick={() => setActiveSection("procesos")} className="btn_azul">
          <i className="bi bi-backspace"></i>Volver
          </a>
          <Lote loteId={selectedLote.id} />
        </section>
      )}

    </div>
  );
};

export default Procesos;

