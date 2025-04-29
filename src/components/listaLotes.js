import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import logo from "../img/ANTA-2.png";
import logo_empresa from "../img/AT-LOGO.png";
import config from "../config";
import Swal from "sweetalert2";

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
  const formatearFechaParaMostrar = (fecha) => {
    const date = new Date(fecha);
    const opciones = { day: "numeric", month: "long", year: "numeric" };
    return date.toLocaleDateString("es-ES", opciones);
  };

  const formatearFechaParaFiltro = (fecha) => {
    const date = new Date(fecha);
    return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
  };  

  const filtrarLotes = lotes.filter((lote) => {
    return (
      (filtroLote
        ? lote.numero_lote.toLowerCase().includes(filtroLote.toLowerCase())
        : true) && // Compara sin distinción de mayúsculas/minúsculas
        (!filtroFecha || formatearFechaParaFiltro(lote.fecha) === filtroFecha) // Filtrar por fecha
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

    const text = selectedLote.proceso || "N/A";
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxTextWidth = 140;
    const textLines = doc.splitTextToSize(text, maxTextWidth);
    const lineHeight = 10;
    const totalTextHeight = textLines.length * lineHeight;
    const textY = totalTextHeight < 20 ? 17 : 17 + (totalTextHeight - 20) / 2;

    doc.setTextColor(0, 0, 102);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(textLines, pageWidth / 2, textY, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`LOTE:               ${selectedLote.numero_lote || "N/A"}`, 14, 34, {
      align: "left",
    });
    doc.text(`FECHA:            ${formatearFechaParaMostrar(selectedLote.fecha)}`, 14, 38, {
      align: "left",
    });

    doc.setTextColor(0, 0, 102);
    doc.setFontSize(10);
    doc.text(
      `PESO:              ${selectedLote.peso} kg`,
      14,
      42,
      { align: "left" }
    );
    doc.text(
      `CANTIDAD:      ${selectedLote.numero_de_cueros} cueros`,
      14,
      46,
      { align: "left" }
    );

    // Tabla de productos
    let startY = 52;

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
    // Mostrar alerta de confirmación
    const { isConfirmed } = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Deseas eliminar este lote? Esta acción no se puede deshacer.",
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
  
    if (!isConfirmed) return; // Si el usuario cancela, no hacer nada
  
    try {
      const response = await fetch(`${config.API_URL}/eliminar-lote/${loteId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar el lote.");
      }
  
      // Mostrar alerta de éxito
      Swal.fire({
        icon: "success",
        title: "¡Lote eliminado!",
        text: "El lote ha sido eliminado correctamente.",
        confirmButtonColor: "#10b981", // Verde
        background: "#f0fdf4",
        color: "#0e0e0e",
      });
  
      // Recargar la lista
      cargarLotes();
    } catch (error) {
      console.error("Error al eliminar el lote:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un error al eliminar el lote: " + error.message,
        confirmButtonColor: "#dc3545",
        background: "#f8d7da",
        color: "#721c24",
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
                    {formatearFechaParaMostrar(selectedLote.fecha)}
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
          <h1 className="inventario-title">Lotes Guardados</h1>
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
            <table className="tabla tabla-lotes">
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
                    <td>{formatearFechaParaMostrar(lote.fecha)}</td>
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
