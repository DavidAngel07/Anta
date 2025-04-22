import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../img/ANTA-2.png";
import logo_empresa from "../img/AT-LOGO.png";
import config from "../config";

const Costos = () => {
  const [costos, setCostos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCostoId, setSelectedCostoId] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [selectedCosto, setSelectedCosto] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [detalleError, setDetalleError] = useState(null);
  const [viewMode, setViewMode] = useState("lista"); // "lista" or "detalle"

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
  

  // Formatear fecha
  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
      orientation: "p", // "p" para portrait, "l" para landscape
      unit: "mm",
      format: "letter",
    });

    const fechaHoy = new Date().toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
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
    doc.setFontSize(8);
    doc.text(`COLOR: ${selectedCosto.color || "N/A"}`, 202, 25, {
      align: "right",
    });
    doc.text(`LOTE: ${selectedCosto.numero_lote || "N/A"}`, 202, 17, {
      align: "right",
    });
    doc.text(`FECHA: ${formatearFecha(selectedCosto.fecha)}`, 202, 21, {
      align: "right",
    });
    doc.text(`PROM.DCM: ${(selectedCosto?.prom_dcm)}`, 202, 29, {
      align: "right",
    });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(
      `PESO: ${selectedCosto.peso} kg     /     CANTIDAD: ${selectedCosto.numero_cueros} cueros`,
      105,
      35,
      { align: "center" }
    );

    // Tabla de productos
    let startY = 40;

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
    tableRows.push(["", "", "TOTAL COSTO POR CUERO:",formatoMoneda(calcularTotalPorCuero()),]);
    tableRows.push(["", "", "TOTAL COSTO POR DCM:",formatoMoneda(selectedCosto?.total_dcm),]);

    doc.autoTable({
      startY,
      head: [tableColumnas],
      body: tableRows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 0, 102], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      didParseCell: function (data) {
        if (
          data.row.index === tableRows.length - 1 ||
          data.row.index === tableRows.length - 2 ||
          data.row.index === tableRows.length - 3
        ) {
          if (data.column.index >= 2) {
            data.cell.styles.fillColor = [210, 210, 210]; // Fondo gris claro
            data.cell.styles.textColor = [0, 0, 102]; // Texto azul oscuro
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.fillColor = [255, 255, 255]; // Fondo blanco
          }
        }
      },
    });

    // Logo al pie
    if (logo) {
      doc.addImage(logo, "PNG", 10, 255, 30, 15);
    }

    doc.save(`costo_${selectedCosto.numero_lote}.pdf`);
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
    // Mostrar confirmación antes de eliminar
    const confirmar = window.confirm(
      "¿Estás seguro de que deseas eliminar este costo? Esta acción no se puede deshacer."
    );

    if (!confirmar) {
      return; // Si el usuario cancela, no hacer nada
    }

    try {
      const response = await fetch(
        `${config.API_URL}/eliminar-costo/${costoId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar el costo.");
      }

      const data = await response.json();
      alert("Costo eliminado exitosamente");

      // Actualizar la lista de costos después de eliminar
      cargarCostos();
    } catch (error) {
      console.error("Error al eliminar el costo:", error);
      alert("Hubo un error al eliminar el costo: " + error.message);
    }
  };

  // Renderizado condicional para estados de carga y error
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando costos...</p>
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
          <h1>Costos Guardados</h1>
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
            <table className="tabla">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Peso (kg)</th>
                  <th>Cueros</th>
                  <th>Color</th>
                  <th>Costo Total</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {costos.map((costo) => (
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
