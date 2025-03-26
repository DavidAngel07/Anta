import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../img/ANTA-2.png";
import logo_empresa from "../img/AT-LOGO.png";
import config from "../config";

const Simulador = () => {
  const [numeroLote, setNumeroLote] = useState("");
  const [productos, setProductos] = useState([]);
  const [sulfuradas, setSulfuradas] = useState([{ id: 1, peso: 0, cueros: 0 }]);
  const [filas_sulfurada, setFilas_sulfurada] = useState({
    1: [
      { id: 1, producto: "", cantidad: "", precio: "" },
      { id: 2, producto: "", cantidad: "", precio: "" },
      { id: 3, producto: "", cantidad: "", precio: "" },
      { id: 4, producto: "", cantidad: "", precio: "" },
      { id: 5, producto: "", cantidad: "", precio: "" },
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
    const nuevoValor = e.target.value; // Este es el ID del producto
    const nuevasFilas = { ...filas_sulfurada };

    nuevasFilas[sulfuradaId][index].producto = nuevoValor; // Guardar el ID del producto
    nuevasFilas[sulfuradaId][index].cantidad = calcularCantidad(
      nuevoValor,
      sulfuradaId
    );

    setFilas_sulfurada(nuevasFilas);
  };

  const handlePeso_sulfChange = (e, id) => {
    const value = Number(e.target.value);
    if (value >= 0) {
      // Solo acepta valores mayores o iguales a 0
      setSulfuradas(
        sulfuradas.map((sulfurada) =>
          sulfurada.id === id ? { ...sulfurada, peso: value } : sulfurada
        )
      );
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
      cantidad: "",
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

  const generarPDF = () => {
    const doc = new jsPDF({
      orientation: "l",
      unit: "mm",
      format: [210, 140],
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
    doc.setFontSize(10);
    doc.text("TABLA DE COSTOS", 60, 17);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Fecha: ${fechaHoy}   |   Lote: ${numeroLote || "N/A"}`, 190, 17, {
      align: "right",
    });

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

      tableRows.push(["","", "TOTAL POR CUERO:",formatoMoneda(totalPorCuero),]);

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
      doc.addImage(logo, "PNG", 170, 120, 20, 10);
    }

    doc.save(`costo.pdf`);
  };

  const renderSulfuradas = () => {
    return sulfuradas.map((sulfurada, index) => (
      <div key={sulfurada.id} className="lote-container">
        <div className="header-container">
          <h1></h1>
        </div>
        <div className="frm_sulfurada">
          <form>
            <label style={{ color: "black" }}>Número de Lote</label>
            <input
              type="text"
              value={numeroLote}
              onChange={(e) => setNumeroLote(e.target.value)}
              placeholder="Ingrese el número de lote"
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
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filas_sulfurada[sulfurada.id].map((fila, index) => (
              <tr key={fila.id}>
                <td>
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
                <td>{fila.cantidad} kl</td>
                <td>{formatoMoneda(fila.precio)}</td>
                <td>{formatoMoneda(fila.total)}</td>
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
              <td colSpan="3">
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
              <td colSpan="3">
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
        <button
          className="btn-agregar"
          onClick={() => handleAgregarFila(sulfurada.id)}
        >
          <i
            className="bi bi-plus-circle"
            style={{ color: "green", fontSize: "24px" }}
          ></i>
        </button>
      </div>
    ));
  };

  return (
    <div className="simulador">
      {renderSulfuradas()}
      <div className="btn-agregar-sulf-container">
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
      </div>
    </div>
  );
};

export default Simulador;
