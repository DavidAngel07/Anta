import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../img/ANTA-2.png";
import logo_empresa from "../img/AT-LOGO.png";
import config from "../config";

const Simulador = () => {
  const [nombreProceso, setNombreProceso] = useState("");
  const [fecha, setFecha] = useState("");
  const [numeroLote, setNumeroLote] = useState("");
  const [productos, setProductos] = useState([]);
  const [sulfuradas, setSulfuradas] = useState([{ id: 1, peso: 0, cueros: 0 }]);
  const [filas_sulfurada, setFilas_sulfurada] = useState({
    1: [
      { id: 1, producto: "", porcentaje: 0, cantidad: "", precio: "" },
      { id: 2, producto: "", porcentaje: 0, cantidad: "", precio: "" },
      { id: 3, producto: "", porcentaje: 0, cantidad: "", precio: "" },
      { id: 4, producto: "", porcentaje: 0, cantidad: "", precio: "" },
      { id: 5, producto: "", porcentaje: 0, cantidad: "", precio: "" },
    ],
  });
  const [isCalculado, setIsCalculado] = useState(false);

  useEffect(() => {
    const fetchProductos = async () => {
      if (!config.API_URL) {
        console.error(
          "La variable de entorno config.API_URL no está definida."
        );
        return;
      }
      try {
        const response = await fetch(`${config.API_URL}/productos`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        setProductos(data);
      } catch (error) {
        console.error("Error al obtener los productos:", error);
      }
    };

    fetchProductos();
  }, []);

  const calcularCantidad = (productoId, sulfuradaId) => {
    const productoSeleccionado = productos.find(
      (producto) => producto.id === parseInt(productoId)
    );
    const sulfurada = sulfuradas.find((s) => s.id === sulfuradaId);

    if (productoSeleccionado && sulfurada) {
      let porcentaje = productoSeleccionado.porcentaje || 0;
      let cantidad = sulfurada.peso * porcentaje;
      return parseFloat(cantidad).toFixed(2);
    }

    return "";
  };

  const handleProductoChange = (e, index, sulfuradaId) => {
    const productoId = e.target.value;
    const nuevasFilas = { ...filas_sulfurada };
    const productoSeleccionado = productos.find(
      (producto) => producto.id === parseInt(productoId)
    );

    const porcentaje = productoSeleccionado?.porcentaje
      ? productoSeleccionado.porcentaje * 100 // Mostramos el porcentaje como número entero
      : 0;

    nuevasFilas[sulfuradaId][index] = {
      ...nuevasFilas[sulfuradaId][index],
      producto: productoId,
      porcentaje: porcentaje,
      cantidad: calcularCantidadPorValor(
        productoSeleccionado?.porcentaje || 0,
        sulfuradaId
      ),
      cantidadModificada: false, // <-- muy importante
    };

    setFilas_sulfurada(nuevasFilas);
  };

  const handlePorcentajeChange = (e, index, sulfuradaId) => {
    const nuevoPorcentaje = parseFloat(e.target.value);
    const nuevasFilas = { ...filas_sulfurada };

    // Guardar nuevo porcentaje (como entero), pero calcular cantidad con porcentaje / 100
    nuevasFilas[sulfuradaId][index].porcentaje = nuevoPorcentaje;
    nuevasFilas[sulfuradaId][index].cantidad = calcularCantidadPorValor(
      nuevoPorcentaje / 100,
      sulfuradaId
    );
    nuevasFilas[sulfuradaId][index].cantidadModificada = false;

    setFilas_sulfurada(nuevasFilas);
  };

  const handleCantidadChange = (e, index, sulfuradaId) => {
    const nuevasFilas = { ...filas_sulfurada };
    const nuevaCantidad = parseFloat(e.target.value);
    const fila = nuevasFilas[sulfuradaId][index];

    const productoSeleccionado = productos.find(
      (producto) => producto.id === parseInt(fila.producto)
    );

    let nuevoTotal = "";
    let precioUnidad = "";

    if (productoSeleccionado && !isNaN(nuevaCantidad)) {
      precioUnidad = productoSeleccionado.precio;
      nuevoTotal = (precioUnidad * nuevaCantidad).toFixed(2);
    }

    nuevasFilas[sulfuradaId][index] = {
      ...fila,
      cantidad: e.target.value,
      cantidadModificada: true,
      precio: precioUnidad,
      total: nuevoTotal,
    };

    setFilas_sulfurada(nuevasFilas);
  };

  const calcularCantidadPorValor = (porcentajeReal, sulfuradaId) => {
    const sulfurada = sulfuradas.find((s) => s.id === sulfuradaId);
    if (sulfurada) {
      return parseFloat(sulfurada.peso * porcentajeReal).toFixed(2);
    }
    return "";
  };

  const handlePeso_sulfChange = (e, id) => {
    const value = Number(e.target.value);
    if (value >= 0) {
      setSulfuradas((prevSulfuradas) =>
        prevSulfuradas.map((sulfurada) =>
          sulfurada.id === id ? { ...sulfurada, peso: value } : sulfurada
        )
      );

      // Recalcular cantidades si no han sido modificadas manualmente
      const nuevasFilas = { ...filas_sulfurada };
      nuevasFilas[id] = nuevasFilas[id].map((fila) => {
        if (!fila.cantidadModificada) {
          const porcentaje = fila.porcentaje || 0;
          return {
            ...fila,
            cantidad: calcularCantidadPorValor(porcentaje / 100, id),
          };
        }
        return fila;
      });
      setFilas_sulfurada(nuevasFilas);
    }
  };

  const handleCueroChange = (e, id) => {
    const value = Number(e.target.value);
    if (value >= 0) {
      // Solo acepta valores mayores o iguales a 0
      setSulfuradas(
        sulfuradas.map((sulfurada) =>
          sulfurada.id === id ? { ...sulfurada, cueros: value } : sulfurada
        )
      );
    }
  };

  const calcularPrecioSulf = (sulfuradaId) => {
    const nuevasFilas = filas_sulfurada[sulfuradaId].map((fila) => {
      const productoSeleccionado = productos.find(
        (producto) => producto.id === parseInt(fila.producto)
      );
      if (productoSeleccionado && fila.cantidad > 0) {
        const precioPorUnidad = productoSeleccionado.precio;
        const total = fila.cantidad * precioPorUnidad;
        return {
          ...fila,
          precio: precioPorUnidad.toFixed(2),
          total: total.toFixed(2),
        };
      }
      return fila;
    });

    setFilas_sulfurada((prev) => ({ ...prev, [sulfuradaId]: nuevasFilas }));
    setIsCalculado(true);
  };

  const calcularTotalGeneral = (sulfuradaId) => {
    const filas = filas_sulfurada[sulfuradaId] || [];
    return filas.reduce(
      (total, fila) => total + (parseFloat(fila.total) || 0),
      0
    );
  };

  const calcularTotalGeneralPorCuero = (sulfuradaId) => {
    const sulfurada = sulfuradas.find((s) => s.id === sulfuradaId);
    const totalGeneral = calcularTotalGeneral(sulfuradaId);

    if (!sulfurada || !sulfurada.cueros || sulfurada.cueros === 0) return 0; // Validar que la cantidad de cueros no sea cero
    return totalGeneral / sulfurada.cueros;
  };

  const formatoMoneda = (valor) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const handleAgregarFila = (sulfuradaId) => {
    const nuevasFilas = { ...filas_sulfurada };
    const nuevaFila = {
      id: nuevasFilas[sulfuradaId].length + 1,
      producto: "",
      porcentaje: 0,
      cantidad: "",
      cantidadModificada: false,
      precio: "",
    };

    if (!nuevasFilas[sulfuradaId]) {
      nuevasFilas[sulfuradaId] = [];
    }

    nuevasFilas[sulfuradaId].push(nuevaFila);
    setFilas_sulfurada(nuevasFilas);
  };

  const handleEliminarFila = (sulfuradaId, filaId) => {
    const nuevasFilas = { ...filas_sulfurada };
    if (nuevasFilas[sulfuradaId]) {
      nuevasFilas[sulfuradaId] = nuevasFilas[sulfuradaId].filter(
        (fila) => fila.id !== filaId
      );
    }
    setFilas_sulfurada(nuevasFilas);
  };

  const guardarSimulacion = async () => {
    try {
      console.log("Fecha que se va a enviar:", fecha);

      const simulacionData = sulfuradas.map((sulfurada) => ({
        id: sulfurada.id, // Incluye el ID de la sulfurada si lo necesitas en el backend
        peso: sulfurada.peso,
        cueros: sulfurada.cueros,
        filas: filas_sulfurada[sulfurada.id] || [],
      }));

      const response = await fetch(`${config.API_URL}/guardar-simulacion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombreProceso,
          numeroLote,
          simulacionData,
          fecha,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar la simulación.");
      }

      const data = await response.json();
      alert("Tabla guardada exitosamente con ID de Lote: " + data.loteId);
      console.log("Respuesta del servidor:", data);
      // Puedes redirigir al usuario o limpiar el formulario aquí
    } catch (error) {
      console.error("Error al guardar la simulación:", error);
      alert("Hubo un error al guardar la simulación: " + error.message);
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

  const generarPDF = () => {
    const doc = new jsPDF({
      orientation: "p", // "p" para portrait, "l" para landscape
      unit: "mm",
      format: "letter"
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
    doc.text("TABLA DE COSTOS", 70, 17);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `PROCESO: ${nombreProceso || "N/A"}`,

      202,
      17,
      {
        align: "right",
      }
    );
    doc.text(`LOTE: ${numeroLote || "N/A"}`, 202, 21, {
      align: "right",
    });
    doc.text(`FECHA: ${formatearFecha(fecha)}`, 202, 25, {
      align: "right",
    });
    if (sulfuradas.length > 0) {
      const primero = sulfuradas[0];
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.text(
        `PESO: ${primero.peso} kg     /     CANTIDAD: ${primero.cueros} cueros`,
        105,
        35,
        { align: "center" }
      );
    }

    let startY = 40;

    sulfuradas.forEach((sulfurada) => {
      const tableColumnas = [
        "Producto",
        "Cantidad (kg)",
        "Precio (COP)",
        "Total (COP)",
      ];

      const tableRows = filas_sulfurada[sulfurada.id].map((fila) => {
        const producto = productos.find(
          (prod) => prod.id === Number(fila.producto)
        );
        const nombreProducto = producto ? producto.producto : "Desconocido";
        return [
          nombreProducto,
          fila.cantidad,
          formatoMoneda(fila.precio),
          formatoMoneda(fila.total),
        ];
      });

      // Calcular el total general y el total por cuero
      const totalGeneral = calcularTotalGeneral(sulfurada.id);
      const totalPorCuero = calcularTotalGeneralPorCuero(sulfurada.id);

      // Añadir filas con el total general y el total por cuero
      tableRows.push(["", "", "TOTAL:", formatoMoneda(totalGeneral)]);

      tableRows.push([
        "",
        "",
        "TOTAL POR CUERO:",
        formatoMoneda(totalPorCuero),
      ]);

      doc.autoTable({
        startY,
        head: [tableColumnas],
        body: tableRows,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 0, 102], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        didParseCell: function (data) {
          // Estilo para las celdas de totales
          if (
            data.row.index === tableRows.length - 1 ||
            data.row.index === tableRows.length - 2
          ) {
            if (data.column.index >= 2) {
              data.cell.styles.fillColor = [210, 210, 210]; // Fondo gris claro
              data.cell.styles.textColor = [0, 0, 102]; // Texto azul oscuro
              data.cell.styles.fontStyle = "bold"; // Texto en negrita
            } else {
              data.cell.styles.fillColor = [255, 255, 255]; // Fondo blanco
            }
          }
        },
      });

      startY = doc.lastAutoTable.finalY + 10;
    });

    if (logo) {
      doc.addImage(logo, "PNG", 10, 255, 30, 15);
    }

    doc.save(`costo_${numeroLote}.pdf`);
  };

  const renderSulfuradas = () => {
    return sulfuradas.map((sulfurada, index) => (
      <div key={sulfurada.id} className="lote-container">
        <div className="frm_sulfurada">
          <form>
            <label style={{ color: "black" }}>Número de Lote</label>
            <input
              type="text"
              value={numeroLote}
              onChange={(e) => setNumeroLote(e.target.value)}
              placeholder="Ingrese el número de lote"
            />
            <label style={{ color: "black" }}>Proceso</label>
            <input
              type="text"
              value={nombreProceso}
              onChange={(e) => setNombreProceso(e.target.value)}
              placeholder="Ingrese el nombre del proceso"
            />
            <label style={{ color: "black" }}>Peso</label>
            <input
              type="number"
              value={sulfurada.peso}
              onChange={(e) => handlePeso_sulfChange(e, sulfurada.id)}
              placeholder="Ingrese el peso"
            />
            <label style={{ color: "black" }}>Numero de cueros</label>
            <input
              type="number"
              value={sulfurada.cueros}
              onChange={(e) => handleCueroChange(e, sulfurada.id)}
              placeholder="Ingrese el numero de cueros"
            />
            <label style={{ color: "black" }}>Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            <button
              type="button"
              className="btn-submit"
              onClick={() => calcularPrecioSulf(sulfurada.id)}
            >
              Calcular
            </button>
          </form>
        </div>
        <table className="lote-table">
          <thead>
            <tr>
              <th className="col-producto">Producto</th>
              <th className="col-pequena">Porcentaje</th>
              <th className="col-pequena">Cantidad</th>
              <th className="col-pequena">Precio</th>
              <th className="col-pequena">Total</th>
              <th className="ultima-columna"></th>
            </tr>
          </thead>
          <tbody>
            {filas_sulfurada[sulfurada.id].map((fila, index) => (
              <tr key={fila.id}>
                <td className="col-producto">
                  <select
                    value={fila.producto}
                    onChange={(e) =>
                      handleProductoChange(e, index, sulfurada.id)
                    }
                  >
                    <option value="">Seleccionar producto</option>
                    {productos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.producto} / {producto.proveedor}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="col-pequena">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <input
                      type="number"
                      value={fila.porcentaje || 0}
                      onChange={(e) =>
                        handlePorcentajeChange(e, index, sulfurada.id)
                      }
                      min="0"
                      max="100"
                      step="0.1"
                      style={{ width: "70px" }}
                    />
                    %
                  </div>
                </td>

                <td className="col-pequena">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <input
                      type="number"
                      value={fila.cantidad}
                      onChange={(e) =>
                        handleCantidadChange(e, index, sulfurada.id)
                      }
                      className="input-cantidad"
                      step="0.01"
                      min="0"
                      style={{ width: "70px" }}
                    />{" "}
                    kg
                  </div>
                </td>

                <td className="col-pequena">{formatoMoneda(fila.precio)}</td>
                <td className="col-pequena">{formatoMoneda(fila.total)}</td>
                <td className="ultima-columna">
                  <button
                    className="btn-eliminar"
                    onClick={() => handleEliminarFila(sulfurada.id, fila.id)}
                  >
                    <i
                      className="bi bi-x-circle"
                      style={{ color: "#cf0000", fontSize: "24px" }}
                    ></i>
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td>
                {" "}
                <button
                  className="btn-agregar"
                  onClick={() => handleAgregarFila(sulfurada.id)}
                >
                  <i
                    className="bi bi-plus-circle"
                    style={{ color: "green", fontSize: "24px" }}
                  ></i>
                </button>
              </td>
              <td></td>
              <td></td>
              <td>
                <strong>Total:</strong>
              </td>
              <td>
                <strong>
                  {formatoMoneda(calcularTotalGeneral(sulfurada.id))}
                </strong>
              </td>
              <td></td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td>
                <strong>Total por cuero:</strong>
              </td>
              <td>
                <strong>
                  {formatoMoneda(calcularTotalGeneralPorCuero(sulfurada.id))}
                </strong>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    ));
  };

  return (
    <div className="simulador">
      {renderSulfuradas()}
      <div className="btn-calculadora">
        <button
          className="btn-descargar-pdf"
          onClick={generarPDF}
          disabled={!isCalculado}
        >
          <i
            className="bi bi-file-earmark-pdf"
            style={{ color: "#fff", fontSize: "20px" }}
          ></i>{" "}
          Generar PDF
        </button>
        <button className="btn-guardar" onClick={guardarSimulacion}>
          <i class="bi bi-save" style={{ color: "#fff", fontSize: "20px" }}></i>
          Guardar
        </button>
      </div>
    </div>
  );
};
export default Simulador;
