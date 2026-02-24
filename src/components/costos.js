import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import logo from "../img/ANTA-2.png";
import logo_empresa from "../img/AT-LOGO.png";
import config from "../config";
import Swal from 'sweetalert2';

const Costos = () => {
  const [costos, setCostos] = useState([]);
  const [filtroLote, setFiltroLote] = useState(""); // Estado para filtrar por lote
  const [filtroFecha, setFiltroFecha] = useState(""); // Estado para filtrar por fecha
  const [buscandoLote, setBuscandoLote] = useState(false); // Estado para mostrar barra de búsqueda de lote
  const [mostrandoFecha, setMostrandoFecha] = useState(false); // Estado para mostrar el calendario de fecha
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCostoId, setSelectedCostoId] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [selectedCosto, setSelectedCosto] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [detalleError, setDetalleError] = useState(null);
  const [viewMode, setViewMode] = useState("lista");

  // Define la función cargarCostos para cargar todos los costos
  const cargarCostos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/costos`);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setCostos(data.data);
      setError(null);
    } catch (error) {
      console.error("Error al obtener los costos:", error);
      setError(
        "No se pudieron cargar los costos. Por favor, intente nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCostos();
  }, []);

  const fetchDetalleCosto = async (costoId) => {
    try {
      setDetalleLoading(true);
      const response = await fetch(`${config.API_URL}/costos/${costoId}`);
  
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
  
      const data = await response.json();
  
      setSelectedCosto({
        ...data.costo,
        ...data.total, // <--- esto agrega los valores de total_costo
      });
  
      setDetalles(data.detalles);
      setDetalleError(null);
      setViewMode("detalle"); // Switch to detail view after loading
    } catch (error) {
      console.error("Error al obtener los detalles del costo:", error);
      setDetalleError(
        "No se pudieron cargar los detalles del costo. Por favor, intente nuevamente."
      );
    } finally {
      setDetalleLoading(false);
    }
  };
  

  // Función para formatear la fecha (ajusta a tu formato)
  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toISOString().split("T")[0]; // Devuelve la fecha en formato YYYY-MM-DD
  };

  const filtrarLotes = costos.filter((detalle) => {
    return (
      (filtroLote
        ? detalle.numero_lote.toLowerCase().includes(filtroLote.toLowerCase())
        : true) && // Compara sin distinción de mayúsculas/minúsculas
      (filtroFecha ? formatearFecha(detalle.fecha) === filtroFecha : true) // Filtrar por fecha
    );
  });

  const handleClickLote = () => {
    setBuscandoLote(!buscandoLote);
    if (buscandoLote) {
      setFiltroLote(""); // Limpiar filtro de lote si se vuelve a hacer clic
    }
  };

  const handleClickFecha = () => {
    setMostrandoFecha(!mostrandoFecha);
    if (mostrandoFecha) {
      setFiltroFecha(""); // Limpiar filtro de fecha si se vuelve a hacer clic
    }
  };


  // Formatear moneda
  const formatoMoneda = (valor) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  // Calcular total
  const calcularTotal = () => {
    return detalles.reduce(
      (total, detalle) => total + parseFloat(detalle.total || 0),
      0
    );
  };

  // Calcular total por cuero
  const calcularTotalPorCuero = () => {
    const total = calcularTotal();
    return selectedCosto && selectedCosto.numero_cueros
      ? total / selectedCosto.numero_cueros
      : 0;
  };

  // Generar PDF
const generarPDF = () => {
  if (!selectedCosto) {
    alert("No hay costo seleccionado para generar el PDF.");
    return;
  }

  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "letter",
  });

  // Encabezado
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 20, "F");

  if (logo_empresa) {
    doc.addImage(logo_empresa, "PNG", 10, 5, 20, 20);
  }

  doc.setTextColor(0, 0, 102);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TABLA DE COSTOS DE SERVICIOS", 70, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`LOTE:               ${selectedCosto.numero_lote || "N/A"}`, 14, 34, { align: "left" });
  doc.text(`FECHA:            ${formatearFecha(selectedCosto.fecha)}`, 14, 38, { align: "left" });
  doc.text(`COLOR:            ${selectedCosto.color || "N/A"}`, 14, 42, { align: "left" });
  doc.text(`PROM.DCM:    ${selectedCosto?.prom_dcm || "N/A"}`, 14, 46, { align: "left" });
  doc.text(`PESO:              ${selectedCosto.peso} kg`, 14, 50, { align: "left" });
  doc.text(`CANTIDAD:      ${selectedCosto.numero_cueros} cueros`, 14, 54, { align: "left" });

  // Tabla de productos
  let startY = 58;

  const tableColumnas = [
    "Servicio",
    "Cantidad",
    "Precio (COP)",
    "Total (COP)",
  ];

  const tableRows = detalles.map((detalle) => [
    detalle.servicio,
    detalle.cantidad,
    formatoMoneda(detalle.precio),
    formatoMoneda(detalle.total),
  ]);

  // Totales
  tableRows.push(["", "", "TOTAL COSTO:", formatoMoneda(calcularTotal())]);
  tableRows.push(["", "", "TOTAL COSTO POR CUERO:", formatoMoneda(calcularTotalPorCuero())]);
  tableRows.push(["", "", "TOTAL COSTO POR DCM:", formatoMoneda(selectedCosto?.total_dcm)]);

  doc.autoTable({
    startY,
    head: [tableColumnas],
    body: tableRows,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [0, 0, 102], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    didParseCell: function (data) {
      if (data.row.index >= tableRows.length - 3) {
        if (data.column.index >= 2) {
          data.cell.styles.fillColor = [210, 210, 210];
          data.cell.styles.textColor = [0, 0, 102];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.fillColor = [255, 255, 255];
        }
      }
    },
  });

  // Logo al pie
  if (logo) {
    doc.addImage(logo, "PNG", 10, 255, 30, 15);
  }

  doc.save(`costo_total_${selectedCosto.numero_lote}.pdf`);
};

  // Ver detalles del costo
  const verDetalles = (costoId) => {
    setSelectedCostoId(costoId);
    fetchDetalleCosto(costoId);
  };

  // Volver a la lista
  const volverALista = () => {
    setViewMode("lista");
    setSelectedCostoId(null);
    setSelectedCosto(null);
    setDetalles([]);
  };

  const eliminarCosto = async (costoId) => {
    // Confirmación con Swal
    const { isConfirmed } = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Deseas eliminar este costo? Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#0025c9',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      color: "#0e0e0e",
      iconColor: '#d33',
      background: "#fffff",
    });
  
    if (!isConfirmed) return;
  
    try {
      const response = await fetch(`${config.API_URL}/eliminar-costo/${costoId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar el costo.");
      }
  
      // Alerta de éxito
      Swal.fire({
        icon: "success",
        title: "Costo eliminado",
        text: "El costo ha sido eliminado exitosamente.",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981", // Verde
        background: "#f0fdf4",
        color: "#0e0e0e",
      });
  
      cargarCostos(); // Actualizar la lista
    } catch (error) {
      console.error("Error al eliminar el costo:", error);
      Swal.fire({
        icon: "error",
        title: "Error al eliminar",
        html: error.message.replace(/\n/g, "<br/>"),
        confirmButtonText: "OK",
        confirmButtonColor: "#0025c9",
        background: "#fff1f2", // Fondo suave de error
        color: "#0e0e0e",
      });
    }
  };
  

  // Renderizado condicional para estados de carga y error
  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-retry">
          Reintentar
        </button>
      </div>
    );
  }

  // Renderizado del detalle del costo
  const renderDetalleCosto = () => {
    if (detalleLoading) {
      return (
        <div className="detalle-loading">
          <div className="spinner"></div>
          <p>Cargando detalles del costo...</p>
        </div>
      );
    }

    if (detalleError) {
      return (
        <div className="detalle-error">
          <p className="error-message">{detalleError}</p>
          <button
            onClick={() => fetchDetalleCosto(selectedCostoId)}
            className="btn-retry"
          >
            Reintentar
          </button>
          <button onClick={volverALista} className="btn-back">
            <i className="bi bi-arrow-left"></i> Volver a la lista
          </button>
        </div>
      );
    }

    if (!selectedCosto) {
      return (
        <div className="detalle-error">
          <p className="error-message">Costo no encontrado</p>
          <button onClick={volverALista} className="btn-back">
            <i className="bi bi-arrow-left"></i> Volver a la lista
          </button>
        </div>
      );
    }

    return (
      <div className="detalle-costo-container">
        <div className="header-container-seccion">
          <button onClick={volverALista} className="btn_azul">
            <i className="bi bi-arrow-left"></i> Volver a la lista
          </button>
        </div>
        <div className="tb">
          <div className="lote-info">
            <div className="info-card">
              <h3 style={{ color: "#000d80" }}>Información General</h3>
              <div style={{ display: "flex", marginRight: "55px" }}>
                <div className="info-row" style={{ display: "flex" }}>
                  <div className="info-item" style={{ marginRight: "55px" }}>
                    <strong style={{ color: "#000d80" }}>
                      Número de Lote:
                    </strong>{" "}
                    {selectedCosto.numero_lote}
                  </div>
                </div>
                <div className="info-row" style={{ display: "flex" }}>
                  <div className="info-item" style={{ marginRight: "55px" }}>
                    <strong style={{ color: "#000d80" }}>Peso:</strong>{" "}
                    {selectedCosto.peso} kg
                  </div>
                  <div className="info-item" style={{ marginRight: "55px" }}>
                    <strong style={{ color: "#000d80" }}>
                      Número de Cueros:
                    </strong>{" "}
                    {selectedCosto.numero_cueros}
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-item" style={{ marginRight: "55px" }}>
                    <strong style={{ color: "#000d80" }}>Fecha:</strong>{" "}
                    {formatearFecha(selectedCosto.fecha)}
                  </div>
                  <div className="info-item" style={{ marginRight: "55px" }}>
                    <strong style={{ color: "#000d80" }}>Color:</strong>{" "}
                    {selectedCosto.color}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="servicios-container">
            <table className="tabla">
              <thead>
                <tr>
                  <th className="col-pequena">Servicio</th>
                  <th className="col-pequena">Cantidad (kg)</th>
                  <th className="col-pequena">Precio</th>
                  <th className="col-pequena">Total</th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((detalle) => (
                  <tr key={detalle.id}>
                    <td className="col-pequena">{detalle.servicio}</td>
                    <td className="col-pequena">
                      {parseFloat(detalle.cantidad).toFixed(2)} kg
                    </td>
                    <td className="col-pequena">
                      {formatoMoneda(detalle.precio)}
                    </td>
                    <td className="col-pequena">
                      {formatoMoneda(detalle.total)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td></td>
                  <td></td>
                  <td>
                    <strong>Total:</strong>
                  </td>
                  <td>
                    <strong>{formatoMoneda(selectedCosto?.total)}</strong>
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td>
                    <strong>Total por cuero:</strong>
                  </td>
                  <td>
                    <strong>
                      {formatoMoneda(selectedCosto?.total_cuero)}
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td>
                    <strong>Total por dcm:</strong>
                  </td>
                  <td>
                    <strong>
                      {formatoMoneda(selectedCosto?.total_dcm)}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="btn-seccion">
            <button
              onClick={() => generarPDF(selectedCostoId)}
              className="btn-descargar-pdf"
            >
              <i
                className="bi bi-file-earmark-pdf"
                style={{ color: "#fff", fontSize: "20px" }}
              ></i>{" "}
              Generar PDF
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Renderizado de la lista de costos
  const renderListaCostos = () => {
    return (
      <>
        <div className="header-container-seccion">
          <h1 className="inventario-title">Costos Guardados</h1>
        </div>
        {costos.length === 0 ? (
          <div className="empty-state">
            <i
              className="bi bi-inbox"
              style={{ fontSize: "100px", color: "#0025c9" }}
            ></i>
            <p>No hay costos guardados</p>
          </div>
        ) : (
          <div className="tb">
            <table className="tabla tabla-costos">
              <thead>
                <tr>
                <th>
                    <div className="filtro-container">
                      <span
                        onClick={handleClickLote}
                        style={{ cursor: "pointer" }}
                      >
                        Lote {buscandoLote ? "▲" : "▼"}
                      </span>
                      {buscandoLote && (
                        <input
                          type="text"
                          className="filtro_lote"
                          placeholder="Buscar lote"
                          value={filtroLote}
                          onChange={(e) => setFiltroLote(e.target.value)}
                          autoFocus
                        />
                      )}
                    </div>
                  </th>
                  <th>Peso (kg)</th>
                  <th>Cueros</th>
                  <th>Color</th>
                  <th>Costo Total</th>
                  <th>
                    <div className="filtro-container">
                      <span
                        onClick={handleClickFecha}
                        style={{ cursor: "pointer" }}
                      >
                        Fecha {mostrandoFecha ? "▲" : "▼"}
                      </span>
                      {mostrandoFecha && (
                        <input
                          type="date"
                          className="filtro_fecha"
                          value={filtroFecha}
                          onChange={(e) => setFiltroFecha(e.target.value)}
                        />
                      )}
                    </div>
                  </th>
                  <th>Ver detalles</th>
                </tr>
              </thead>
              <tbody>
              {filtrarLotes.map((costo) => (
                  <tr key={costo.id}>
                    <td>{costo.numero_lote}</td>
                    <td>{costo.peso}</td>
                    <td>{costo.numero_cueros}</td>
                    <td>{costo.color}</td>
                    <td>{formatoMoneda(costo.costo_total || 0)}</td>
                    <td>{formatearFecha(costo.fecha)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => verDetalles(costo.id)}
                          className="btn_ver"
                          title="Ver detalles"
                        >
                          <i
                            className="bi bi-eye-fill"
                            style={{ color: "#0025c9", fontSize: "25px" }}
                          ></i>
                        </button>
                        <button
                          onClick={() => eliminarCosto(costo.id)}
                          className="btn_eliminar_mini"
                          title="Eliminar costo"
                        >
                          <i
                            className="bi bi-trash-fill"
                            style={{ color: "#c90000", fontSize: "25px" }}
                          ></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="costos-container">
      {viewMode === "lista" ? renderListaCostos() : renderDetalleCosto()}
    </div>
  );
};

export default Costos;
