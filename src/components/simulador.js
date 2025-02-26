import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from "../img/ANTA-2.png";

const Simulador = () => {
  const [productos, setProductos] = useState([]);
  const [sulfuradas, setSulfuradas] = useState([{ id: 1, peso: 0, cueros: 0 }]);
  const [filas_sulfurada, setFilas_sulfurada] = useState({
    1: [
      { id: 1, producto: '', cantidad: '', precio: '' },
      { id: 2, producto: '', cantidad: '', precio: '' },
      { id: 3, producto: '', cantidad: '', precio: '' },
      { id: 4, producto: '', cantidad: '', precio: '' },
      { id: 5, producto: '', cantidad: '', precio: '' },
    ],
  });
  const [isCalculado, setIsCalculado] = useState(false);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch('https://anta-production.up.railway.app/productos');
        const data = await response.json();
        setProductos(data);
      } catch (error) {
        console.error('Error al obtener los productos:', error);
      }
    };

    fetchProductos();
  }, []);

  const calcularCantidad = (productoId, sulfuradaId) => {
    const productoSeleccionado = productos.find(producto => producto.id === parseInt(productoId));
    const sulfurada = sulfuradas.find(s => s.id === sulfuradaId);
  
    if (productoSeleccionado && sulfurada) {
      let porcentaje = productoSeleccionado.porcentaje || 0;
      let cantidad = (sulfurada.peso * porcentaje);
      return parseFloat(cantidad).toFixed(2);
    }
  
    return '';
  };

  const handleProductoChange = (e, index, sulfuradaId) => {
    const nuevoValor = e.target.value; // Este es el ID del producto
    const nuevasFilas = { ...filas_sulfurada };
  
    nuevasFilas[sulfuradaId][index].producto = nuevoValor; // Guardar el ID del producto
    nuevasFilas[sulfuradaId][index].cantidad = calcularCantidad(nuevoValor, sulfuradaId);
    
    setFilas_sulfurada(nuevasFilas);
  };

  const handlePeso_sulfChange = (e, id) => {
    const value = Number(e.target.value);
    if (value >= 0) { // Solo acepta valores mayores o iguales a 0
      setSulfuradas(sulfuradas.map(sulfurada => 
        sulfurada.id === id ? { ...sulfurada, peso: value } : sulfurada
      ));
    }
  };
  
  const handleCueroChange = (e, id) => {
    const value = Number(e.target.value);
    if (value >= 0) { // Solo acepta valores mayores o iguales a 0
      setSulfuradas(sulfuradas.map(sulfurada => 
        sulfurada.id === id ? { ...sulfurada, cueros: value } : sulfurada
      ));
    }
  };

  const calcularPrecioSulf = (sulfuradaId) => {
    const nuevasFilas = filas_sulfurada[sulfuradaId].map(fila => {
      const productoSeleccionado = productos.find(producto => producto.id === parseInt(fila.producto));
      if (productoSeleccionado && fila.cantidad > 0) {
        const precioPorUnidad = productoSeleccionado.precio;
        const total = fila.cantidad * precioPorUnidad;
        return { ...fila, precio: precioPorUnidad.toFixed(2), total: total.toFixed(2) };
      }
      return fila;
    });
  
    setFilas_sulfurada(prev => ({ ...prev, [sulfuradaId]: nuevasFilas }));
    setIsCalculado(true);
  };

  const calcularTotalGeneral = (sulfuradaId) => {
    const filas = filas_sulfurada[sulfuradaId] || [];
    return filas.reduce((total, fila) => total + (parseFloat(fila.total) || 0), 0);
  };

  const calcularTotalGeneralPorCuero = (sulfuradaId) => {
    const sulfurada = sulfuradas.find(s => s.id === sulfuradaId);
    const totalGeneral = calcularTotalGeneral(sulfuradaId);
  
    if (!sulfurada || !sulfurada.cueros || sulfurada.cueros === 0) return 0; // Validar que la cantidad de cueros no sea cero
    return totalGeneral / sulfurada.cueros;
  };

  const formatoMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const handleAgregarFila = (sulfuradaId) => {
    const nuevasFilas = { ...filas_sulfurada };
    const nuevaFila = {
      id: nuevasFilas[sulfuradaId].length + 1,
      producto: '',
      cantidad: '',
      precio: '',
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
      nuevasFilas[sulfuradaId] = nuevasFilas[sulfuradaId].filter(fila => fila.id !== filaId);
    }
    setFilas_sulfurada(nuevasFilas);
  };

  const generarPDF = () => {
    const doc = new jsPDF();
  
    // Header background
    doc.setFillColor(0, 0, 102);
    doc.rect(0, 0, 210, 20, "F");
  
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Simulador de Sulfurada", 105, 12, { align: "center" });
  
    let startY = 40; // Posición inicial en Y para la tabla
  
    sulfuradas.forEach((sulfurada, index) => {
      // Crear tabla con los datos
      const tableColumnas = ["Producto", "Cantidad (kg)", "Precio (COP)", "Total (COP)"];
      
      // Acceder a las filas de la sulfurada específica
      const tableRows = filas_sulfurada[sulfurada.id].map((fila) => {
        const producto = productos.find(prod => prod.id === Number(fila.producto)); // Asegúrate de que estás buscando el producto por su ID como número
        const nombreProducto = producto ? producto.producto : "Desconocido"; // Si no se encuentra, muestra "Desconocido"
  
        return [
          nombreProducto, // Usamos el nombre en lugar del ID
          fila.cantidad,
          formatoMoneda(fila.precio),
          formatoMoneda(fila.total),
        ];
      });
  
      doc.autoTable({
        startY,
        head: [tableColumnas],
        body: tableRows,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 0, 0], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });
  
      startY = doc.lastAutoTable.finalY + 10; // Ajustar posición Y después de cada tabla

      // Agregar total por cuero
      const totalPorCuero = calcularTotalGeneralPorCuero(sulfurada.id);
      doc.text(`Total por cuero: ${formatoMoneda(totalPorCuero)}`, 10, startY);
      startY += 10; // Espacio después del total por cuero
    });
  
    // Agregar logo
    doc.addImage(logo, "PNG", 160, 260, 40, 15);
  
    // Guardar el PDF
    doc.save(`Simulador_Sulfurada.pdf`);
  };

  const renderSulfuradas = () => {
    return sulfuradas.map((sulfurada, index) => (
      <div key={sulfurada.id} className="lote-container">
        <div className="header-container">
          <h1></h1>
        </div>
        <div className="frm_sulfurada">
          <form>
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
            <button type="button" className="btn-submit" onClick={() => calcularPrecioSulf(sulfurada.id)}>Calcular</button>
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
                  <select value={fila.producto} onChange={(e) => handleProductoChange(e, index, sulfurada.id)}>
                    <option value="">Seleccionar producto</option>
                    {productos.map((producto) => (
                      <option key={producto.id} value={producto.id}>{producto.producto} / {producto.proveedor}</option>
                    ))}
                  </select>
                </td>
                <td>{fila.cantidad} kl</td>
                <td>{formatoMoneda(fila.precio)}</td>
                <td>{formatoMoneda(fila.total)}</td>
                <td className="ultima-columna">
                  <button className="btn-eliminar" onClick={() => handleEliminarFila(sulfurada.id, fila.id)}>
                    <i className="bi bi-x-circle" style={{ color: '#cf0000', fontSize: '24px' }}></i>
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan="3"><strong>Total:</strong></td>
              <td><strong>{formatoMoneda(calcularTotalGeneral(sulfurada.id))}</strong></td>
              <td></td>
            </tr>
            <tr>
              <td colSpan="3"><strong>Total por cuero:</strong></td>
              <td><strong>{formatoMoneda(calcularTotalGeneralPorCuero(sulfurada.id))}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <button className="btn-agregar" onClick={() => handleAgregarFila(sulfurada.id)}>
          <i className="bi bi-plus-circle" style={{ color: 'green', fontSize: '24px' }}></i>
        </button>
      </div>
    ));
  };

  return (
    <div className='simulador'>
      <div className='lote_titulo'><h2>SIMULADOR</h2></div>
      {renderSulfuradas()}
      <div className='btn-agregar-sulf-container'>
      <button className="btn-descargar-pdf" onClick={generarPDF} disabled={!isCalculado}>
        <i className="bi bi-file-earmark-pdf" style={{ color: '#fff', fontSize: '20px' }}></i> Generar PDF
      </button>
      </div>
    </div>
  );
};

export default Simulador;

