import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import logo from "../img/ANTA-2.png";
import 'jspdf-autotable';
import logo_empresa from "../img/AT-LOGO.png";
import config from "../config";
import Swal from "sweetalert2";

const CalculadoraProcesos = () => {
  const [nombreProceso, setNombreProceso] = useState("");
  const [fecha, setFecha] = useState("");
  const [numeroLote, setNumeroLote] = useState("");
  const [productos, setProductos] = useState([]);
  const [sulfuradas, setSulfuradas] = useState([{ id: 1, peso: 0, cueros: 0 }]);
  const [filas_sulfurada, setFilas_sulfurada] = useState({
    1: [
      { id: 1, producto: "", porcentaje: 0, cantidad: "", precio: "", total: "" },
      { id: 2, producto: "", porcentaje: 0, cantidad: "", precio: "", total: "" },
      { id: 3, producto: "", porcentaje: 0, cantidad: "", precio: "", total: "" },
      { id: 4, producto: "", porcentaje: 0, cantidad: "", precio: "", total: "" },
      { id: 5, producto: "", porcentaje: 0, cantidad: "", precio: "", total: "" },
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

  // Nuevo useEffect para actualizar precios automáticamente cuando cambia cualquier valor relevante
  useEffect(() => {
    Object.keys(filas_sulfurada).forEach(sulfuradaId => {
      filas_sulfurada[sulfuradaId].forEach((fila, index) => {
        if (fila.producto && fila.cantidad) {
          actualizarPrecioYTotal(index, parseInt(sulfuradaId));
        }
      });
    });
    setIsCalculado(true);
  }, [filas_sulfurada, sulfuradas]);

  const actualizarPrecioYTotal = (index, sulfuradaId) => {
    const nuevasFilas = { ...filas_sulfurada };
    const fila = nuevasFilas[sulfuradaId][index];
    
    const productoSeleccionado = productos.find(
      (producto) => producto.id === parseInt(fila.producto)
    );

    if (productoSeleccionado && fila.cantidad > 0) {
      const precioPorUnidad = productoSeleccionado.precio;
      const total = parseFloat(fila.cantidad) * precioPorUnidad;
      
      nuevasFilas[sulfuradaId][index] = {
        ...fila,
        precio: precioPorUnidad.toFixed(2),
        total: total.toFixed(2),
      };
      
      setFilas_sulfurada(nuevasFilas);
    }
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

    const cantidad = calcularCantidadPorValor(
      productoSeleccionado?.porcentaje || 0,
      sulfuradaId
    );

    const precio = productoSeleccionado?.precio || 0;
    const total = cantidad ? (parseFloat(cantidad) * precio).toFixed(2) : "";

    nuevasFilas[sulfuradaId][index] = {
      ...nuevasFilas[sulfuradaId][index],
      producto: productoId,
      porcentaje: porcentaje,
      cantidad: cantidad,
      cantidadModificada: false,
      precio: precio.toFixed(2),
      total: total,
    };

    setFilas_sulfurada(nuevasFilas);
  };

  const handlePorcentajeChange = (e, index, sulfuradaId) => {
    const nuevoPorcentaje = parseFloat(e.target.value);
    const nuevasFilas = { ...filas_sulfurada };
    const fila = nuevasFilas[sulfuradaId][index];
    
    // Calcular la nueva cantidad basada en el nuevo porcentaje
    const cantidad = calcularCantidadPorValor(
      nuevoPorcentaje / 100,
      sulfuradaId
    );
    
    // Obtener precio del producto seleccionado
    const productoSeleccionado = productos.find(
      (producto) => producto.id === parseInt(fila.producto)
    );
    
    // Calcular el nuevo total
    const precio = productoSeleccionado?.precio || 0;
    const total = cantidad ? (parseFloat(cantidad) * precio).toFixed(2) : "";
    
    nuevasFilas[sulfuradaId][index] = {
      ...fila,
      porcentaje: nuevoPorcentaje,
      cantidad: cantidad,
      cantidadModificada: false,
      precio: precio.toFixed(2),
      total: total,
    };

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
      precio: precioUnidad ? precioUnidad.toFixed(2) : "",
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
        if (!fila.cantidadModificada && fila.producto) {
          const porcentaje = fila.porcentaje || 0;
          const nuevaCantidad = calcularCantidadPorValor(porcentaje / 100, id);
          
          // Obtener precio del producto
          const productoSeleccionado = productos.find(
            (producto) => producto.id === parseInt(fila.producto)
          );
          
          // Calcular nuevo total
          const precio = productoSeleccionado?.precio || 0;
          const total = nuevaCantidad ? (parseFloat(nuevaCantidad) * precio).toFixed(2) : "";
          
          return {
            ...fila,
            cantidad: nuevaCantidad,
            precio: precio.toFixed(2),
            total: total,
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
    if (!valor) return "$ 0";
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
      total: "",
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
  
      const simulacionData = sulfuradas.map((sulfurada) => {
        const totalGeneral = calcularTotalGeneral(sulfurada.id);
        const totalPorCuero = calcularTotalGeneralPorCuero(sulfurada.id);
  
        return {
          id: sulfurada.id,
          peso: sulfurada.peso,
          cueros: sulfurada.cueros,
          filas: filas_sulfurada[sulfurada.id] || [],
          total: totalGeneral,
          totalPorCuero: totalPorCuero,
        };
      });
  
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
  
      const data = await response.json(); // ✅ LEE el cuerpo solo una vez
  
      if (!response.ok) {
        // ⚠️ Ya tenemos el cuerpo leído, así que usamos `data.error` directamente
        if (data.error === "Faltan datos requeridos.") {
          Swal.fire({
            icon: "warning",
            title: "Campos incompletos",
            text: "Por favor, complete todos los campos requeridos.",
            confirmButtonText: "OK",
            confirmButtonColor: "#f59e0b", // Rojo
            color: "#0e0e0e", // Texto oscuro para fondo rojo
          });
        } else {
          throw new Error(data.error || "Error al guardar la simulación.");
        }
        return;
      }
  
      // Si todo va bien
      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        html: `Tabla guardada con número de Lote <strong> N° ${numeroLote}</strong>.<br/>Ahora puedes visualizarla en el módulo <strong>Lotes</strong>.`,
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981", // Verde
        background: "#f0fdf4", // Fondo verde claro
        color: "#0e0e0e",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error inesperado",
        html: error.message.replace(/\n/g, "<br/>"),
        confirmButtonText: "OK",
        confirmButtonColor: "#0025c9", // Azul
        background: "#fffff", // fondo suave
        color: "#0e0e0e",
      });
    }
  };
 
  // Formatear fecha
  const formatearFecha = (fechaString) => {
    if (!fechaString) return "N/A";
    
    // Obtener los componentes de la fecha directamente del string
    const [year, month, day] = fechaString.split('-').map(num => parseInt(num, 10));
    
    // Crear la fecha con los componentes específicos (restando 1 al mes porque en JS los meses van de 0-11)
    const fecha = new Date(year, month - 1, day);
    
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

    // Encabezado
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 20, "F");

    if (logo_empresa) {
      doc.addImage(logo_empresa, "PNG", 10, 5, 20, 20);
    }

    const text = nombreProceso || "N/A";
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
    doc.text(`LOTE:               ${numeroLote || "N/A"}`, 14, 34, {
      align: "left",
    });
    doc.text(`FECHA:            ${formatearFecha(fecha)}`, 14, 38, {
      align: "left",
    });
     
    if (sulfuradas.length > 0) {
      const primero = sulfuradas[0];
      doc.setTextColor(0, 0, 102);
      doc.setFontSize(10);
      doc.text(`PESO:              ${primero.peso || "N/A"}`, 14, 42,  {
        align: "left",
      });
      doc.text(`CANTIDAD:      ${primero.cueros || "N/A"}`, 14, 46,  {
        align: "left",
      });
    }

    let startY = 52;

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
            {/* Botón Calcular removido ya que ahora los cálculos son automáticos */}
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
          <i className="bi bi-save" style={{ color: "#fff", fontSize: "20px" }}></i>
          Guardar
        </button>
      </div>
    </div>
  );
};

export default CalculadoraProcesos;