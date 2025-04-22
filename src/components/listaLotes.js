import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import logo from "../img/ANTA-2.png";
import logo_empresa from "../img/AT-LOGO.png";
import config from "../config";

const ListaLotes = () => {
  const [lotes, setLotes] = useState([]);
  const [filtroLote, setFiltroLote] = useState(""); // Estado para filtrar por lote
  const [filtroFecha, setFiltroFecha] = useState(""); // Estado para filtrar por fecha
  const [buscandoLote, setBuscandoLote] = useState(false); // Estado para mostrar barra de búsqueda de lote
  const [mostrandoFecha, setMostrandoFecha] = useState(false); // Estado para mostrar el calendario de fecha
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLoteId, setSelectedLoteId] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [detalleError, setDetalleError] = useState(null);
  const [viewMode, setViewMode] = useState("lista"); // "lista" or "detalle"

  // Define la función cargarLotes fuera del useEffect para poder reutilizarla
  const cargarLotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/lotes`);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setLotes(data.data);
      setError(null);
    } catch (error) {
      console.error("Error al obtener los lotes:", error);
      setError(
        "No se pudieron cargar los lotes. Por favor, intente nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarLotes();
  }, []);

  const fetchDetalleLote = async (loteId) => {
    try {
      setDetalleLoading(true);
      const response = await fetch(`${config.API_URL}/lotes/${loteId}`);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setSelectedLote(data.lote);
      setDetalles(data.detalles);
      setDetalleError(null);
      setViewMode("detalle"); // Switch to detail view after loading
    } catch (error) {
      console.error("Error al obtener los detalles del lote:", error);
      setDetalleError(
        "No se pudieron cargar los detalles del lote. Por favor, intente nuevamente."
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

  const filtrarLotes = lotes.filter((lote) => {
    return (
      (filtroLote
        ? lote.numero_lote.toLowerCase().includes(filtroLote.toLowerCase())
        : true) && // Compara sin distinción de mayúsculas/minúsculas
      (filtroFecha ? formatearFecha(lote.fecha) === filtroFecha : true) // Filtrar por fecha
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
    return selectedLote && selectedLote.numero_de_cueros
      ? total / selectedLote.numero_de_cueros
      : 0;
  };

  // Generar PDF
  const generarPDF = () => {
    if (!selectedLote) {
      alert("No hay lote seleccionado para generar el PDF.");
      return;
    }

    const doc = new jsPDF({
      orientation: "p", // "p" para portrait, "l" para landscape
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
    doc.text("TABLA DE COSTOS", 70, 17);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`PROCESO: ${selectedLote.proceso || "N/A"}`, 202, 17, {
      align: "right",
    });
    doc.text(`LOTE: ${selectedLote.numero_lote || "N/A"}`, 202, 21, {
      align: "right",
    });
    doc.text(`FECHA: ${formatearFecha(selectedLote.fecha)}`, 202, 25, {
      align: "right",
    });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(
      `PESO: ${selectedLote.peso} kg     /     CANTIDAD: ${selectedLote.numero_de_cueros} cueros`,
      105,
      35,
      { align: "center" }
    );

    // Tabla de productos
    let startY = 40;

    const tableColumnas = [
      "Producto",
      "Cantidad (kg)",
      "Precio (COP)",
      "Total (COP)",
    ];

    const tableRows = detalles.map((detalle) => [
      detalle.producto_nombre,
      detalle.cantidad,
      formatoMoneda(detalle.precio_unitario),
      formatoMoneda(detalle.total),
    ]);

    // Totales
    tableRows.push(["", "", "TOTAL:", formatoMoneda(calcularTotal())]);
    tableRows.push([
      "",
      "",
      "TOTAL POR CUERO:",
      formatoMoneda(calcularTotalPorCuero()),
    ]);

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
          data.row.index === tableRows.length - 2
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

    doc.save(`costo_${selectedLote.numero_lote}.pdf`);
  };

  // Ver detalles del lote
  const verDetalles = (loteId) => {
    setSelectedLoteId(loteId);
    fetchDetalleLote(loteId);
  };

  // Volver a la lista
  const volverALista = () => {
    setViewMode("lista");
    setSelectedLoteId(null);
    setSelectedLote(null);
    setDetalles([]);
  };

  const eliminarLote = async (loteId) => {
    // Mostrar confirmación antes de eliminar
    const confirmar = window.confirm(
      "¿Estás seguro de que deseas eliminar este lote? Esta acción no se puede deshacer."
    );

    if (!confirmar) {
      return; // Si el usuario cancela, no hacer nada
    }

    try {
      const response = await fetch(
        `${config.API_URL}/eliminar-lote/${loteId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar el lote.");
      }

      // Actualizar la lista de lotes después de eliminar
      cargarLotes();
    } catch (error) {
      console.error("Error al eliminar el lote:", error);
      alert("Hubo un error al eliminar el lote: " + error.message);
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

  // Renderizado del detalle del lote
  const renderDetalleLote = () => {
    if (detalleLoading) {
      return (
        <div className="detalle-loading">
          <div className="spinner"></div>
          <p>Cargando detalles del lote...</p>
        </div>
      );
    }

    if (detalleError) {
      return (
        <div className="detalle-error">
          <p className="error-message">{detalleError}</p>
          <button
            onClick={() => fetchDetalleLote(selectedLoteId)}
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

    if (!selectedLote) {
      return (
        <div className="detalle-error">
          <p className="error-message">Lote no encontrado</p>
          <button onClick={volverALista} className="btn-back">
            <i className="bi bi-arrow-left"></i> Volver a la lista
          </button>
        </div>
      );
    }

    return (
      <div className="detalle-lote-container">
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
                    <strong style={{ color: "#000d80" }}>Proceso:</strong>{" "}
                    {selectedLote.proceso}
                  </div>
                  <div className="info-item" style={{ marginRight: "55px" }}>
                    <strong style={{ color: "#000d80" }}>
                      Número de Lote:
                    </strong>{" "}
                    {selectedLote.numero_lote}
                  </div>
                </div>
                <div className="info-row" style={{ display: "flex" }}>
                  <div className="info-item" style={{ marginRight: "55px" }}>
                    <strong style={{ color: "#000d80" }}>Peso:</strong>{" "}
                    {selectedLote.peso} kg
                  </div>
                  <div className="info-item" style={{ marginRight: "55px" }}>
                    <strong style={{ color: "#000d80" }}>
                      Número de Cueros:
                    </strong>{" "}
                    {selectedLote.numero_de_cueros}
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-item" style={{ marginRight: "55px" }}>
                    <strong style={{ color: "#000d80" }}>Fecha:</strong>{" "}
                    {formatearFecha(selectedLote.fecha)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="productos-container">
            <table className="tabla">
              <thead>
                <tr>
                  <th className="col-pequena">Producto</th>
                  <th className="col-pequena">Cantidad (kg)</th>
                  <th className="col-pequena">Precio Unitario</th>
                  <th className="col-pequena">Total</th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((detalle) => (
                  <tr key={detalle.id}>
                    <td className="col-pequena">{detalle.producto_nombre}</td>
                    <td className="col-pequena">
                      {parseFloat(detalle.cantidad).toFixed(2)} kg
                    </td>
                    <td className="col-pequena">
                      {formatoMoneda(detalle.precio_unitario)}
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
                    <strong>{formatoMoneda(calcularTotal())}</strong>
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td>
                    <strong>Total por cuero:</strong>
                  </td>
                  <td>
                    <strong>{formatoMoneda(calcularTotalPorCuero())}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="btn-seccion">
            <button
              onClick={() => generarPDF(selectedLoteId)}
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

  // Renderizado de la lista de lotes
  const renderListaLotes = () => {
    return (
      <>
        <div className="header-container-seccion">
          <h1>Lotes Guardados</h1>
        </div>

        {lotes.length === 0 ? (
          <div className="empty-state">
            <i
              className="bi bi-inbox"
              style={{ fontSize: "100px", color: "#0025c9" }}
            ></i>
            <p>No hay lotes guardados</p>
          </div>
        ) : (
          <div className="tb">
            <table className="tabla">
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
                  <th>Proceso</th>
                  <th>Peso (kg)</th>
                  <th>Cueros</th>
                  <th>Productos</th>
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
                {filtrarLotes.map((lote) => (
                  <tr key={lote.id}>
                    <td>{lote.numero_lote}</td>
                    <td>{lote.proceso}</td>
                    <td>{lote.peso}</td>
                    <td>{lote.numero_de_cueros}</td>
                    <td>{lote.cantidad_productos}</td>
                    <td>{formatoMoneda(lote.costo_total || 0)}</td>
                    <td>{formatearFecha(lote.fecha)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => verDetalles(lote.id)}
                          className="btn_ver"
                          title="Ver detalles"
                        >
                          <i
                            className="bi bi-eye-fill"
                            style={{ color: "#0025c9", fontSize: "25px" }}
                          ></i>
                        </button>
                        <button
                          onClick={() => eliminarLote(lote.id)}
                          className="btn_eliminar_mini"
                          title="Eliminar lote"
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
    <div className="lotes-container">
      {viewMode === "lista" ? renderListaLotes() : renderDetalleLote()}
    </div>
  );
};

export default ListaLotes;
