import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";

const Insumos = () => {
  const [insumos, setInsumos] = useState([]);
  const [movimientos, setMovimientos] = useState([]); // Estado para movimientos
  const [mostrandoFecha, setMostrandoFecha] = useState(false); // Estado para mostrar el calendario de fecha
  const [filtroFecha, setFiltroFecha] = useState("");
  const [mostrarMovimientos, setMostrarMovimientos] = useState(false);
  const [formData, setFormData] = useState({
    codigo: "",
    cantidad: "",
  });

  // Cargar insumos y movimientos
  useEffect(() => {
    axios
      .get(`${config.API_URL}/api/insumos`)
      .then((res) => {
        setInsumos(res.data);
      })
      .catch((err) => {
        console.error("Error al obtener insumos:", err);
      });

    // Obtener movimientos de insumos
    axios
      .get(`${config.API_URL}/api/movimientos`) // Cambiar la URL aquí
      .then((res) => {
        setMovimientos(res.data); // Suponiendo que la API devuelve los movimientos
      })
      .catch((err) => {
        console.error("Error al obtener movimientos:", err);
      });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatearFechaParaMostrar = (fecha) => {
    const date = new Date(fecha);
    const opciones = { day: "numeric", month: "long", year: "numeric" };
    return date.toLocaleDateString("es-ES", opciones);
  };

  const formatearFechaParaFiltro = (fecha) => {
    const date = new Date(fecha);
    return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
  }; 

  const filtrarMovimientos = movimientos.filter((lote) => {
    return (
        (!filtroFecha || formatearFechaParaFiltro(lote.fecha) === filtroFecha) // Filtrar por fecha
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.codigo || !formData.cantidad) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor, complete todos los campos",
        confirmButtonColor: "#f59e0b",
        color: "#0e0e0e",
        background: "#fffff",
      });
      return;
    }

    try {
      const res = await axios.post(
        `${config.API_URL}/api/insumos/stock`,
        formData
      );
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "¡Stock actualizado!",
          text: `El stock del producto fue actualizado correctamente.`,
          confirmButtonColor: "#10b981",
          background: "#f0fdf4",
          color: "#0e0e0e",
        });

        setFormData({ codigo: "", cantidad: "" });

        const updatedInsumos = await axios.get(`${config.API_URL}/api/insumos`);
        setInsumos(updatedInsumos.data);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo actualizar el stock",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al agregar stock",
        confirmButtonColor: "#0025c9",
        color: "#0e0e0e",
      });
    }
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(precio);
  };

  const obtenerColorFondo = (tipo) => {
    if (tipo === "ENTRADA") {
      return { backgroundColor: "#eafdec", color: "#00750a" }; // Fondo verde y texto blanco
    } else if (tipo === "SALIDA") {
      return { backgroundColor: "#ffe6e6", color: "#700000" }; // Fondo rojo y texto blanco
    }
    return {}; // Sin cambios si no es ENTRADA ni SALIDA
  };

  const handleClickFecha = () => {
    setMostrandoFecha(!mostrandoFecha);
    if (mostrandoFecha) {
      setFiltroFecha(""); // Limpiar filtro de fecha si se vuelve a hacer clic
    }
  };

  return (
    <div className="simulador">
      <div className="lote-container">
        {/* Botón para cambiar de sección */}
        {!mostrarMovimientos && (
          <div style={{ marginBottom: "1rem" }}>
            <button
              className="btn_editar"
              onClick={() => setMostrarMovimientos(true)}
            >
              Ver Movimientos <i class="bi bi-arrow-bar-right"></i>
            </button>
          </div>
        )}

        {/* Sección de insumos */}
        {!mostrarMovimientos && (
          <>
            <div className="frm_inventario">
              <div className="frm_insumo_existente">
                <form onSubmit={handleSubmit}>
                  <div className="fila-inputs">
                    <select
                      name="codigo"
                      value={formData.codigo}
                      onChange={handleChange}
                    >
                      <option value="">Seleccione un producto</option>
                      {insumos.map((insumo, index) => (
                        <option key={index} value={insumo.codigo}>
                          {insumo.producto}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Cantidad"
                      name="cantidad"
                      value={formData.cantidad}
                      onChange={handleChange}
                    />
                  </div>
                  <button type="submit" className="btn-agregar-inventario">
                    Agregar Existencia
                  </button>
                </form>
              </div>
            </div>

            <table className="lote-table">
              <thead>
                <tr>
                  <th className="col-pequena">Codigo</th>
                  <th className="col-producto-pq">Producto</th>
                  <th className="col-pequena">Proveedor</th>
                  <th className="col-pequena">Precio</th>
                  <th className="col-pequena">Stock</th>
                  <th className="col-pequena">Valor actual</th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((item, index) => (
                  <tr key={index}>
                    <td>{item.codigo}</td>
                    <td>{item.producto}</td>
                    <td>{item.proveedor}</td>
                    <td>{formatearPrecio(item.precio)}</td>
                    <td>{item.stock} kg</td>
                    <td>{formatearPrecio(item.precio * item.stock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Sección de movimientos */}
        {mostrarMovimientos && (
          <div className="movimientos-insumos">
            <div className="movimientos-header">
              <button
                className="btn_editar"
                onClick={() => setMostrarMovimientos(false)}
              >
                <i class="bi bi-arrow-bar-left"></i> Volver a los insumos
              </button>
              <h3 className="titulo-movimientos">Movimientos de Insumos</h3>
              <div style={{ width: 120 }}></div>{" "}
              {/* Espacio vacío igual al ancho del botón */}
            </div>

            <table className="lote-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
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
                </tr>
              </thead>
              <tbody>
              {filtrarMovimientos.map((movimiento, index) => (
                  <tr
                    key={index}
                    style={{
                      ...obtenerColorFondo(
                        movimiento.tipo_movimiento.toUpperCase()
                      ),
                    }}
                  >
                    <td>{movimiento.tipo_movimiento.toUpperCase()}</td>                    
                    <td>{movimiento.producto}</td>
                    <td>{movimiento.cantidad} kg</td>
                    <td>{formatearFechaParaMostrar(movimiento.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Insumos;
