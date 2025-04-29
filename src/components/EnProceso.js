import React, { useState, useEffect } from "react";
import config from "../config";
import Swal from "sweetalert2";

const EnProceso = () => {
  // Estados para almacenar datos
  const [lotes, setLotes] = useState([]);
  const [procesosPorLote, setProcesosPorLote] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [respuestaDebug, setRespuestaDebug] = useState(null);
  const [busquedaLote, setBusquedaLote] = useState("");
  const [procesoFiltrado, setProcesoFiltrado] = useState(null);

  // Lista de procesos disponibles
  const procesos = [
    "Llegada",
    "Sulfurada",
    "Descarnada y Dividida",
    "Piquelada",
    "Teñida",
    "En Almacén",
  ];

  // Función para cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = `${config.API_URL}/api/proceso-lotes`;

        console.log("Iniciando petición a:", apiUrl);

        const response = await fetch(apiUrl);
        console.log(
          "Respuesta recibida:",
          response.status,
          response.statusText
        );

        // Guardamos el contenido en texto para debug
        const textContent = await response.text();
        console.log(
          "Contenido recibido (primeros 100 caracteres):",
          textContent.substring(0, 100)
        );

        // Si parece HTML, mostramos el error adecuado
        if (
          textContent.trim().startsWith("<!DOCTYPE") ||
          textContent.trim().startsWith("<html")
        ) {
          setError(
            "El servidor devolvió HTML en lugar de JSON. Verifica la ruta de la API."
          );
          setRespuestaDebug(textContent.substring(0, 500) + "...");
          setCargando(false);
          return;
        }

        // Intentamos parsear el JSON
        try {
          const data = JSON.parse(textContent);
          console.log("Datos parseados:", data);
          setRespuestaDebug(data);

          if (Array.isArray(data) && data.length > 0) {
            setLotes(data);

            // Crear un objeto con los procesos iniciales
            const procesosIniciales = {};
            data.forEach((lote) => {
              procesosIniciales[lote.numero_lote] = lote.proceso;
            });

            setProcesosPorLote(procesosIniciales);
          } else if (Array.isArray(data)) {
            setError(
              "No se encontraron lotes en la base de datos (array vacío)"
            );
          } else {
            setError("La respuesta no es un array. Formato inesperado.");
          }
        } catch (jsonError) {
          setError(`Error al parsear JSON: ${jsonError.message}`);
          setRespuestaDebug(textContent);
        }
      } catch (error) {
        console.error("Error al cargar lotes:", error);
        setError(`Error al cargar datos: ${error.message}`);
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  const actualizarProceso = (numeroLote, nuevoProceso) => {
    setProcesosPorLote((prev) => ({
      ...prev,
      [numeroLote]: nuevoProceso,
    }));
  };

  const lotesFiltrados = lotes.filter((lote) => {
    const coincideBusqueda = lote.numero_lote
      .toLowerCase()
      .includes(busquedaLote.toLowerCase());
    const coincideProceso =
      !procesoFiltrado || lote.proceso === procesoFiltrado;
    return coincideBusqueda && coincideProceso;
  });

  const toggleFiltroProceso = (proceso) => {
    setProcesoFiltrado((prev) => (prev === proceso ? null : proceso));
  };

  const guardarCambio = async (numeroLote) => {
    const nuevoProceso = procesosPorLote[numeroLote];
    const { isConfirmed } = await Swal.fire({
      title: "¿Confirmar cambio de proceso?",
      text: `¿Quieres cambiar el proceso de este lote a: ${nuevoProceso}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      confirmColor: "#0e0e0e",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "Cancelar",
      color: "#0e0e0e",
      iconColor: "#d33",
      background: "#fffff",
    });

    if (!isConfirmed) return;

    try {
      const response = await fetch(`${config.API_URL}/api/actualizar-proceso`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numero_lote: numeroLote,
          nuevo_proceso: nuevoProceso,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "¡Exito!",
          text: "Proceso actualizado correctamente.",
          confirmButtonColor: "#10b981", // Verde
          background: "#f0fdf4",
          color: "#0e0e0e",
        });
      } else {
        Swal.fire(
          "Error",
          data.error || data.message || "Hubo un problema",
          "error"
        );
      }
    } catch (error) {
      Swal.fire(
        "Error",
        "Hubo un error al actualizar el proceso: " + error.message,
        "error"
      );
    }
  };

  if (cargando) {
    return (
      <div className="loading-container">
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <div>
          <h3>Información de depuración:</h3>
          <button onClick={() => window.location.reload()}>
            Intentar de nuevo
          </button>
          <pre
            style={{
              marginTop: "20px",
              padding: "10px",
              background: "#f5f5f5",
              overflow: "auto",
              maxHeight: "300px",
            }}
          >
            {typeof respuestaDebug === "object"
              ? JSON.stringify(respuestaDebug, null, 2)
              : respuestaDebug}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="proceso-container">
      <h1 className="inventario-title seguimiento-lotes-title">
        Seguimiento de Lotes en Proceso
      </h1>

      {/* Leyenda de procesos */}
      <div className="proceso-section">
        <h2 className="proceso-subheading">Procesos:</h2>
        <div className="proceso-badges">
          {procesos.map((proceso) => (
            <div
              key={proceso}
              className={`proceso-badge proceso-${proceso
                .toLowerCase()
                .replace(/\s+/g, "-")} ${
                procesoFiltrado === proceso ? "activo" : ""
              }`}
              onClick={() => toggleFiltroProceso(proceso)}
              style={{ cursor: "pointer" }}
            >
              {proceso}
            </div>
          ))}
        </div>
      </div>

      {/* Gráfica de lotes */}
      <div className="proceso-panel">
        <h2 className="proceso-subheading proceso-subheading-2">
          Estado Actual de Lotes
        </h2>
        <div
          className="proceso-busqueda-container"
          style={{ marginBottom: "1rem" }}
        >
          <input
            type="text"
            placeholder="Buscar por número de lote..."
            value={busquedaLote}
            onChange={(e) => setBusquedaLote(e.target.value)}
            className="input-busqueda-lote"
            style={{
              padding: "8px",
              fontSize: "1rem",
              borderRadius: "5px",
              border: "1px solid #ccc",
              width: "100%",
              maxWidth: "300px",
            }}
          />
        </div>

        {lotes.length === 0 ? (
          <div>
            <p>No hay lotes registrados</p>
            <div
              style={{
                marginTop: "20px",
                padding: "10px",
                background: "#f5f5f5",
              }}
            >
              <p>Respuesta del servidor:</p>
              <pre>{JSON.stringify(respuestaDebug, null, 2)}</pre>
            </div>
          </div>
        ) : (
          <div className="proceso-card-grid">
            {lotesFiltrados.map((lote) => {
              const procesoGuardado = lote.proceso;
              const numeroLote = lote.numero_lote;
              const procesoActual =
                procesosPorLote[numeroLote] || "Desconocido";

              return (
                <div
                  key={lote.id || numeroLote}
                  className={`proceso-card proceso-${procesoActual
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  <h3 className="proceso-card-title">
                    <strong>Lote:</strong> {numeroLote}
                  </h3>

                  <div className="proceso-card-status">
                    <span className="proceso-card-label">Proceso actual: </span>
                    <span className="proceso-card-value">{procesoActual}</span>
                  </div>

                  <div className="proceso-card-actions">
                    <label className="proceso-select-label">
                      Cambiar proceso:
                    </label>
                    <select
                      className="proceso-select"
                      value={procesoActual}
                      onChange={(e) =>
                        actualizarProceso(numeroLote, e.target.value)
                      }
                      disabled={procesoGuardado.toLowerCase() === "en almacén"}
                    >
                      {procesos.map((proceso) => (
                        <option key={proceso} value={proceso}>
                          {proceso.charAt(0).toUpperCase() + proceso.slice(1)}
                        </option>
                      ))}
                    </select>

                    <button
                      className="btn_azul"
                      onClick={() => guardarCambio(numeroLote)}
                      disabled={procesoGuardado.toLowerCase() === "en almacén"}
                    >
                      Guardar
                    </button>

                    {procesoGuardado.toLowerCase() === "en almacén" && (
                      <p className="proceso-card-note">
                        Este lote está en almacén y no se puede modificar su
                        proceso.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel de estadísticas */}
      <div className="proceso-panel">
        <h2 className="proceso-subheading">Resumen</h2>
        <div className="proceso-stats-grid">
          {procesos.map((proceso) => {
            const cantidadEnProceso = Object.values(procesosPorLote).filter(
              (p) => p && p.toLowerCase() === proceso.toLowerCase()
            ).length;

            return (
              <div
                key={proceso}
                className={`proceso-stat-item proceso-${proceso
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                <p className="proceso-stat-label">{proceso}</p>
                <p className="proceso-stat-value">{cantidadEnProceso}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EnProceso;
