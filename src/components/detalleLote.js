import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import config from "../config";

const DetalleLote = () => {
  const { id } = useParams();
  const [lote, setLote] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetalleLote = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${config.API_URL}/lotes/${id}`);
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        setLote(data.lote);
        setDetalles(data.detalles);
        setError(null);
      } catch (error) {
        console.error("Error al obtener los detalles del lote:", error);
        setError("No se pudieron cargar los detalles del lote. Por favor, intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetalleLote();
  }, [id]);

  // Formatear fecha
  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    return detalles.reduce((total, detalle) => total + parseFloat(detalle.total || 0), 0);
  };

  // Calcular total por cuero
  const calcularTotalPorCuero = () => {
    const total = calcularTotal();
    return lote && lote.numero_de_cueros ? total / lote.numero_de_cueros : 0;
  };

  // Generar PDF con la misma lógica que en el componente Simulador
  const generarPDF = () => {
    window.open(`${config.API_URL}/lotes/${id}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando detalles del lote...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <Link to="/dashboard#listaLotes" className="btn-back">
          Volver a la lista
        </Link>
      </div>
    );
  }

  if (!lote) {
    return (
      <div className="error-container">
        <p className="error-message">Lote no encontrado</p>
        <Link to="/dashboard#listaLotes" className="btn-back">
          Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <div className="detalle-lote-container">
      <div className="header-container">
        <Link to="/dashboard#listaLotes" className="btn-back">
          <i className="bi bi-arrow-left"></i> Volver
        </Link>
        <h1>Detalles del Lote {lote.numero_lote}</h1>
        <button onClick={generarPDF} className="btn-descargar-pdf">
          <i className="bi bi-file-earmark-pdf" style={{ color: "#fff", fontSize: "20px" }}></i>{" "}
          Generar PDF
        </button>
      </div>

      <div className="lote-info">
        <div className="info-card">
          <h3>Información General</h3>
          <div className="info-row">
            <div className="info-item">
              <strong>Proceso:</strong> {lote.proceso}
            </div>
            <div className="info-item">
              <strong>Número de Lote:</strong> {lote.numero_lote}
            </div>
          </div>
          <div className="info-row">
            <div className="info-item">
              <strong>Peso:</strong> {parseFloat(lote.peso).toFixed(2)} kg
            </div>
            <div className="info-item">
              <strong>Número de Cueros:</strong> {lote.numero_de_cueros}
            </div>
          </div>
          <div className="info-row">
            <div className="info-item">
              <strong>Fecha:</strong> {formatearFecha(lote.fecha)}
            </div>
          </div>
        </div>
      </div>

      <div className="productos-container">
        <h3>Productos</h3>
        <table className="lote-table">
          <thead>
            <tr>
              <th className="col-producto">Producto</th>
              <th className="col-pequena">Cantidad (kg)</th>
              <th className="col-pequena">Precio Unitario</th>
              <th className="col-pequena">Total</th>
            </tr>
          </thead>
          <tbody>
            {detalles.map((detalle) => (
              <tr key={detalle.id}>
                <td className="col-producto">{detalle.producto_nombre}</td>
                <td className="col-pequena">{parseFloat(detalle.cantidad).toFixed(2)} kg</td>
                <td className="col-pequena">{formatoMoneda(detalle.precio_unitario)}</td>
                <td className="col-pequena">{formatoMoneda(detalle.total)}</td>
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
    </div>
  );
};

export default DetalleLote;