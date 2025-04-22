// CalculadoraCostos.js - Versión corregida

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../img/ANTA-2.png";
import logo_empresa from "../img/AT-LOGO.png";
import config from "../config";

const CalculadoraCostos = () => {
  const [nombreProceso, setNombreProceso] = useState("");
  const [fecha, setFecha] = useState("");
  const [numeroLote, setNumeroLote] = useState("");
  const [peso, setPeso] = useState(0);
  const [cueros, setCueros] = useState(0);
  const [color, setColor] = useState("");
  const [servicios, setServicios] = useState([]);
  const [promedioDcm, setPromedioDcm] = useState("");
  const [filas, setFilas] = useState([
    { id: 1, servicio: "", cantidad: 0, precio: 0, total: 0 },
    { id: 2, servicio: "", cantidad: 0, precio: 0, total: 0 },
    { id: 3, servicio: "", cantidad: 0, precio: 0, total: 0 },
  ]);
  const [filasAdicionales, setFilasAdicionales] = useState([
    { id: 1, servicio: "", cantidad: 0, precio: 0, total: 0 },
    { id: 2, servicio: "", cantidad: 0, precio: 0, total: 0 },
    { id: 3, servicio: "", cantidad: 0, precio: 0, total: 0 },
    { id: 4, servicio: "", cantidad: 0, precio: 0, total: 0 },
    { id: 5, servicio: "", cantidad: 0, precio: 0, total: 0 },
  ]);
  const [isCalculado, setIsCalculado] = useState(false);
  const [lotes, setLotes] = useState([]);
  const [procesosPorLote, setProcesosPorLote] = useState([]);

  useEffect(() => {
    const fetchLotes = async () => {
      try {
        const res = await fetch(`${config.API_URL}/lotes`);
        const data = await res.json();

        // Filtrar lotes duplicados por número de lote
        const lotesUnicos = [];
        const numerosLoteVistos = new Set();

        data.data.forEach((lote) => {
          if (!numerosLoteVistos.has(lote.numero_lote)) {
            numerosLoteVistos.add(lote.numero_lote);
            lotesUnicos.push(lote);
          }
        });

        setLotes(lotesUnicos);
      } catch (error) {
        console.error("Error al cargar lotes:", error);
      }
    };

    fetchLotes();
  }, []);

  useEffect(() => {
    const fetchProcesosPorLote = async () => {
      if (!numeroLote) {
        setProcesosPorLote([]);
        return;
      }

      try {
        console.log("Solicitando procesos para lote:", numeroLote);

        const res = await fetch(
          `${config.API_URL}/procesos-por-lote/${numeroLote}`
        );

        if (!res.ok) {
          throw new Error(`Error HTTP: ${res.status}`);
        }

        const data = await res.json();

        // Inspección detallada de los datos recibidos
        console.log("Datos recibidos de procesos-por-lote:", data);

        // Si es un array, veamos el primer elemento para entender su estructura
        if (Array.isArray(data) && data.length > 0) {
          console.log(
            "Estructura del primer proceso:",
            JSON.stringify(data[0], null, 2)
          );
          console.log("Propiedades disponibles:", Object.keys(data[0]));
          setProcesosPorLote(data);
        } else if (
          data.success &&
          Array.isArray(data.procesos) &&
          data.procesos.length > 0
        ) {
          console.log(
            "Estructura del primer proceso:",
            JSON.stringify(data.procesos[0], null, 2)
          );
          console.log(
            "Propiedades disponibles:",
            Object.keys(data.procesos[0])
          );
          setProcesosPorLote(data.procesos);
        } else {
          console.error("Formato de datos inesperado o vacío:", data);
          setProcesosPorLote([]);
        }
      } catch (error) {
        console.error("Error al obtener procesos del lote:", error);
        setProcesosPorLote([]);
      }
    };

    fetchProcesosPorLote();
  }, [numeroLote]);

  const handleServicioChange = async (e, index) => {
    const servicioProceso = e.target.value;
    const nuevasFilas = [...filas];
    nuevasFilas[index].servicio = servicioProceso;

    if (!servicioProceso) {
      nuevasFilas[index].precio = 0;
      setFilas(nuevasFilas);
      calcularTotal(nuevasFilas[index], index, nuevasFilas);
      return;
    }

    const procesoSeleccionado = procesosPorLote.find(
      (proceso) => proceso.proceso === servicioProceso
    );

    if (!procesoSeleccionado) {
      nuevasFilas[index].precio = 0;
      setFilas(nuevasFilas);
      calcularTotal(nuevasFilas[index], index, nuevasFilas);
      return;
    }

    const idLote = procesoSeleccionado.id_lote;

    if (!idLote) {
      nuevasFilas[index].precio = 0;
    } else {
      try {
        const precio = await fetchTotalCuero(idLote);
        nuevasFilas[index].precio = precio;
      } catch (error) {
        nuevasFilas[index].precio = 0;
      }
    }

    setFilas(nuevasFilas);
    calcularTotal(nuevasFilas[index], index, nuevasFilas);
  };

  // Nuevo manejador específico para el servicio en filas adicionales
  const handleServicioAdicionalChange = (e, index) => {
    const servicioNombre = e.target.value;
    const nuevasFilasAdicionales = [...filasAdicionales];
    nuevasFilasAdicionales[index].servicio = servicioNombre;
    setFilasAdicionales(nuevasFilasAdicionales);
  };

  const handleCantidadChange = (e, index) => {
    const cantidad = parseFloat(e.target.value);
    const nuevasFilas = [...filas];
    nuevasFilas[index].cantidad = cantidad;
    setFilas(nuevasFilas);
    calcularTotal(nuevasFilas[index], index, nuevasFilas);
  };

  const handleCantidadChangeAdicional = (e, index) => {
    const cantidad = parseFloat(e.target.value);
    const nuevasFilas = [...filasAdicionales];
    nuevasFilas[index].cantidad = isNaN(cantidad) ? 0 : cantidad;
    setFilasAdicionales(nuevasFilas);
    calcularTotalAdicional(nuevasFilas[index], index, nuevasFilas);
  };

  const calcularTotalAdicional = (fila, index, nuevasFilas = null) => {
    const filasActuales = nuevasFilas || [...filasAdicionales];
    if (!isNaN(fila.cantidad) && !isNaN(fila.precio)) {
      filasActuales[index].total = fila.cantidad * fila.precio;
      if (!nuevasFilas) {
        setFilasAdicionales(filasActuales);
      }
    }
  };

  const handlePrecioChangeAdicional = (e, index) => {
    const precio = parseFloat(e.target.value);
    const nuevasFilas = [...filasAdicionales];
    nuevasFilas[index].precio = isNaN(precio) ? 0 : precio;
    setFilasAdicionales(nuevasFilas);
    calcularTotalAdicional(nuevasFilas[index], index, nuevasFilas);
  };

  const calcularTotal = (fila, index, nuevasFilas = null) => {
    const filasActuales = nuevasFilas || [...filas];
    if (!isNaN(fila.cantidad) && !isNaN(fila.precio)) {
      filasActuales[index].total = fila.cantidad * fila.precio;
      if (!nuevasFilas) {
        setFilas(filasActuales);
      }
    }
  };

  const calcularTotalGeneral = () => {
    const totalPrincipal = filas.reduce((total, fila) => total + (fila.total || 0), 0);
    const totalAdicional = filasAdicionales.reduce((total, fila) => total + (fila.total || 0), 0);
    return totalPrincipal + totalAdicional;
  };

  const calcularTotalPorCuero = () => {
    const total = calcularTotalGeneral();
    return cueros > 0 ? total / cueros : 0;
  };

  const calcularTotalPorDcm = () => {
    const totalPorCuero = calcularTotalPorCuero();
    const dcm = parseFloat(promedioDcm);
    return cueros > 0 && dcm > 0 ? totalPorCuero / dcm : 0;
  };

  const formatoMoneda = (valor) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const handleAgregarFilaPrincipal = () => {
    const nuevaFila = {
      id: filas.length + 1,
      servicio: "",
      cantidad: 0,
      precio: 0,
      total: 0,
      tipo: "principal",
    };
    setFilas([...filas, nuevaFila]);
  };

  const handleAgregarFilaAdicional = () => {
    const nuevaFila = {
      id: filasAdicionales.length + 1,
      servicio: "",
      cantidad: 0,
      precio: 0,
      total: 0,
      tipo: "adicional",
    };
    setFilasAdicionales([...filasAdicionales, nuevaFila]);
  };

  const handleEliminarFilaAdicional = (filaId) => {
    setFilasAdicionales(filasAdicionales.filter((fila) => fila.id !== filaId));
  };

  const handleEliminarFila = (filaId) => {
    setFilas(filas.filter((fila) => fila.id !== filaId));
  };

  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fetchTotalCuero = async (idLote) => {
    if (!idLote) {
      console.error("ID de lote no válido:", idLote);
      return 0;
    }

    try {
      const res = await fetch(`${config.API_URL}/total-cuero/${idLote}`);

      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.total_cuero !== undefined) {
        return parseFloat(data.total_cuero);
      }
      return 0;
    } catch (error) {
      return 0;
    }
  };

  const generarPDF = () => {
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
    doc.text("TABLA DE COSTOS DE SERVICIOS", 70, 17);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`LOTE: ${numeroLote || "N/A"}`, 202, 17, {
      align: "right",
    });
    doc.text(`FECHA: ${formatearFecha(fecha)}`, 202, 21, {
      align: "right",
    });
    doc.text(`COLOR: ${color || "N/A"}`, 202, 25, {
      align: "right",
    });
    doc.text(`PROM.DCM: ${promedioDcm || "N/A"}`, 202, 29, {
      align: "right",
    });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`PESO: ${peso} kg     /     CANTIDAD: ${cueros} cueros`, 105, 35, {
      align: "center",
    });

    let startY = 40;

    const tableColumnas = [
      "Servicio",
      "Cantidad",
      "Precio (COP)",
      "Total (COP)",
    ];

    // Combinar filas principales y adicionales para el PDF
    const todasLasFilas = [
      ...filas.map(fila => {
        const servicio = servicios.find(
          (serv) => serv.id === parseInt(fila.servicio)
        );
        const nombreServicio = servicio ? servicio.nombre : fila.servicio;
        return [
          nombreServicio,
          fila.cantidad,
          formatoMoneda(fila.precio),
          formatoMoneda(fila.total),
        ];
      }),
      ...filasAdicionales
        .filter(fila => fila.servicio) // Solo incluir filas adicionales que tengan un servicio
        .map(fila => [
          fila.servicio,
          fila.cantidad,
          formatoMoneda(fila.precio),
          formatoMoneda(fila.total),
        ])
    ];

    // Añadir filas con el total general y el total por cuero
    todasLasFilas.push([
      "",
      "",
      "TOTAL COSTO:",
      formatoMoneda(calcularTotalGeneral()),
    ]);
    todasLasFilas.push([
      "",
      "",
      "TOTAL COSTO POR CUERO:",
      formatoMoneda(calcularTotalPorCuero()),
    ]);
    todasLasFilas.push([
      "",
      "",
      "TOTAL COSTO POR DCM:",
      formatoMoneda(calcularTotalPorDcm()),
    ]);

    doc.autoTable({
      startY,
      head: [tableColumnas],
      body: todasLasFilas,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 0, 102], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      didParseCell: function (data) {
        // Estilo para las celdas de totales
        if (data.row.index >= todasLasFilas.length - 3) {
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

    if (logo) {
      doc.addImage(logo, "PNG", 10, 255, 30, 15);
    }

    doc.save(`costos_servicios_${numeroLote}.pdf`);
  };

  const guardarCostos = async () => {
    try {
      // Validación básica
      if (!numeroLote || !fecha || !cueros || !peso) {
        alert("Por favor complete todos los campos requeridos (Número de lote, fecha, cueros y peso)");
        return;
      }
  
      // Combinar todas las filas para guardar
      const todasLasFilas = [
        ...filas
          .filter(fila => fila.servicio && fila.cantidad > 0)
          .map(fila => ({
            servicioId: fila.servicio,
            cantidad: fila.cantidad,
            precio: fila.precio,
            total: fila.total
          })),
        ...filasAdicionales
          .filter(fila => fila.servicio && fila.cantidad > 0 && fila.precio > 0)
          .map(fila => ({
            servicioId: fila.servicio, // Aquí será el nombre del servicio
            cantidad: fila.cantidad,
            precio: fila.precio,
            total: fila.total
          }))
      ];
  
      // Verificar que hay servicios para guardar
      if (todasLasFilas.length === 0) {
        alert("No hay servicios para guardar. Agregue al menos un servicio con cantidad y precio.");
        return;
      }
  
      const costosData = {
        numeroLote,
        fecha,
        peso,
        cueros,
        color,
        promedioDcm,
        servicios: todasLasFilas
      };
  
      const response = await fetch(`${config.API_URL}/guardar-costos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(costosData),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Error al guardar los costos.");
      }
  
      alert("Costos guardados exitosamente con ID: " + data.loteId);
      
      // Opcional: resetear el formulario o redirigir
      // resetForm(); o history.push('/costos');
    } catch (error) {
      console.error("Error al guardar los costos:", error);
      alert("Hubo un error al guardar los costos: " + error.message);
    }
  };

  return (
    <div className="p-4">
      <div className="lote-container">
        <div className="frm_sulfurada">
          <form>
            <label style={{ color: "black" }}>Número de Lote</label>
            <select
              value={numeroLote}
              onChange={(e) => setNumeroLote(e.target.value)}
              className="w-full border px-2 py-1 rounded"
            >
              <option value="">Seleccione un lote</option>
              {lotes.map((lote, idx) => (
                <option key={idx} value={lote.numero_lote}>
                  {lote.numero_lote}
                </option>
              ))}
            </select>
            <label style={{ color: "black" }}>Peso</label>
            <input
              type="number"
              value={peso}
              onChange={(e) => setPeso(Number(e.target.value))}
              placeholder="Ingrese el peso"
            />
            <label style={{ color: "black" }}>Numero de cueros</label>
            <input
              type="number"
              value={cueros}
              onChange={(e) => setCueros(Number(e.target.value))}
              placeholder="Ingrese el numero de cueros"
            />
            <label style={{ color: "black" }}>Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            <label style={{ color: "black" }}>Color</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Ingrese el color"
            />
            <label style={{ color: "black" }}>Promedio dcm</label>
            <input
              type="number"
              value={promedioDcm}
              onChange={(e) => setPromedioDcm(e.target.value)}
              placeholder="Ingrese los dcm promedio"
            />
          </form>
        </div>
        <table className="lote-table">
          <thead>
            <tr>
              <th className="col-pequena-costo">Servicio</th>
              <th className="col-pequena-costo">Cantidad</th>
              <th className="col-pequena-costo">Precio</th>
              <th className="col-pequena-costo">Total</th>
              <th className="ultima-columna"></th>
            </tr>
          </thead>
          <tbody>
            {/* Filas principales con servicios del lote */}
            {filas.map((fila, index) => (
              <tr key={fila.id}>
                <td>
                  <select
                    value={fila.servicio}
                    onChange={(e) => handleServicioChange(e, index)}
                  >
                    <option value="">Seleccione un servicio</option>
                    {procesosPorLote && procesosPorLote.length > 0 ? (
                      procesosPorLote.map((proceso) => (
                        <option key={proceso.proceso} value={proceso.proceso}>
                          {proceso.nombre ||
                            proceso.proceso ||
                            "Servicio sin nombre"}
                        </option>
                      ))
                    ) : (
                      <option disabled>No hay servicios disponibles</option>
                    )}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={fila.cantidad}
                    onChange={(e) => handleCantidadChange(e, index)}
                  />
                </td>
                <td>
                  <span>{formatoMoneda(fila.precio)}</span>
                </td>
                <td>{formatoMoneda(fila.total)}</td>
                <td>
                  <button
                    className="btn-eliminar"
                    onClick={() => handleEliminarFila(fila.id)}
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
                <button
                  className="btn-agregar"
                  onClick={handleAgregarFilaPrincipal}
                >
                  <i
                    className="bi bi-plus-circle"
                    style={{ color: "green", fontSize: "24px" }}
                  ></i>
                </button>
              </td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            
            {/* Filas adicionales con servicios manuales */}
            {filasAdicionales.map((fila, index) => (
              <tr key={`adicional-${fila.id}`}>
                <td>
                  <input
                    type="text"
                    value={fila.servicio}
                    onChange={(e) => handleServicioAdicionalChange(e, index)}
                    placeholder="Servicio"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={fila.cantidad}
                    onChange={(e) => handleCantidadChangeAdicional(e, index)}
                    placeholder="Cantidad"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={fila.precio}
                    onChange={(e) => handlePrecioChangeAdicional(e, index)}
                    placeholder="Precio"
                  />
                </td>
                <td>{formatoMoneda(fila.total)}</td>
                <td>
                  <button
                    className="btn-eliminar"
                    onClick={() => handleEliminarFilaAdicional(fila.id)}
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
                <button
                  className="btn-agregar"
                  onClick={handleAgregarFilaAdicional}
                >
                  <i
                    className="bi bi-plus-circle"
                    style={{ color: "green", fontSize: "24px" }}
                  ></i>
                </button>
              </td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            
            {/* Totales */}
            <tr>
              <td></td>
              <td></td>
              <td>
                <strong>Total Costo:</strong>
              </td>
              <td>
                <strong>{formatoMoneda(calcularTotalGeneral())}</strong>
              </td>
              <td></td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td>
                <strong>Total Costo por cuero:</strong>
              </td>
              <td>
                <strong>{formatoMoneda(calcularTotalPorCuero())}</strong>
              </td>
              <td></td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td>
                <strong>Total Costo por dcm:</strong>
              </td>
              <td>
                <strong>{formatoMoneda(calcularTotalPorDcm())}</strong>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="btn-calculadora">
        <button className="btn-descargar-pdf" onClick={generarPDF}>
          <i
            className="bi bi-file-earmark-pdf"
            style={{ color: "#fff", fontSize: "20px" }}
          ></i>{" "}
          Generar PDF
        </button>
        <button className="btn-guardar" onClick={guardarCostos}>
          <i
            className="bi bi-save"
            style={{ color: "#fff", fontSize: "20px" }}
          ></i>
          Guardar
        </button>
      </div>
    </div>
  );
};

export default CalculadoraCostos;