import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from "../img/ANTA-2.png";



const Lote = ({ loteId }) => {
  const [productos, setProductos] = useState([]);
  const [filas_sulfurada, setFilas_sulfurada] = useState({
    1: [
      { id: 1, producto: '', cantidad: '', precio: '' },
      { id: 2, producto: '', cantidad: '', precio: '' },
      { id: 3, producto: '', cantidad: '', precio: '' },
      { id: 4, producto: '', cantidad: '', precio: '' },
      { id: 5, producto: '', cantidad: '', precio: '' },
    ],
  });

  const [sulfuradas, setSulfuradas] = useState([{ id: 1, peso: 0, cueros: 0 }]); // Comienza con 1 sulfurada por defecto
  const [lote, setLote] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState('informacion'); // Estado para la pestaña activa
  const id = loteId;
  const [peso_sulfurada, setPeso_sulfurada] = useState(); // Inicializa como número
  const [cueros, setCueros] = useState(); // Inicializa como número
  const [isCalculado, setIsCalculado] = useState(false);

  // Función para calcular el total general
  const calcularTotalGeneral = (sulfuradaId) => {
    const filas = filas_sulfurada[sulfuradaId] || []; // Accede a las filas de la sulfurada específica
    return filas.reduce((total, fila) => total + (parseFloat(fila.total) || 0), 0);
  };

  const calcularTotalGeneralPorCuero = (sulfuradaId) => {
    const sulfurada = sulfuradas.find(s => s.id === sulfuradaId);
    const filas = filas_sulfurada[sulfuradaId] || []; // Accede a las filas de la sulfurada específica
  
    if (!sulfurada || !sulfurada.cueros || sulfurada.cueros === 0) return 0; // Validar que la cantidad de cueros no sea cero
    return filas.reduce((total, fila) => total + (parseFloat(fila.total) || 0), 0) / sulfurada.cueros;
  };

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch('httpa://anta-production.up.railway.app/productos');
        const data = await response.json();
        setProductos(data);
      } catch (error) {
        console.error('Error al obtener los productos:', error);
      }
    };

    fetchProductos();
  }, []);

  useEffect(() => {
    const fetchLote = async () => {
      try {
        const response = await fetch(`httpa://anta-production.up.railway.app/api/lotes_cueros/${loteId}`); // Ruta corregida
  
        if (!response.ok) {
          const errorData = await response.json(); // Obtén los detalles del error desde el backend
  
          if (response.status === 404) {
            throw new Error("Lote no encontrado"); // Mensaje de error más específico
          } else {
            throw new Error(errorData.error || 'Error al obtener el lote');
          }
        }
  
        const data = await response.json();
        setLote(data);
      } catch (error) {
        console.error('Error al obtener el lote:', error);
        alert(error.message); // Muestra el mensaje de error al usuario (o usa un componente para mostrar errores)
        setLote(null); // Restablece el estado del lote a null para evitar mostrar datos antiguos
      }
    };
  
    fetchLote();
  }, [loteId]);

  useEffect(() => {
    const fetchSulfuradas = async () => {
      try {
        const response = await fetch(`httpa://anta-production.up.railway.app/api/sulfuradas/${loteId}`);
        if (!response.ok) {
          throw new Error('Error al obtener sulfuradas');
        }
        const data = await response.json();
        
        // Actualiza el estado de sulfuradas y filas_sulfurada
        setSulfuradas(data);
        const nuevasFilas = {};
        data.forEach(sulfurada => {
          nuevasFilas[sulfurada.id] = []; // Inicializa las filas para cada sulfurada
        });
        setFilas_sulfurada(nuevasFilas);
      } catch (error) {
        console.error('Error al obtener sulfuradas:', error);
      }
    };

    fetchSulfuradas();
  }, [loteId]);

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
    if (value >= 0 && (!lote || value <= lote.peso)) { // Solo acepta valores mayores o iguales a 0 y menores que el peso del lote
      setSulfuradas(sulfuradas.map(sulfurada => 
        sulfurada.id === id ? { ...sulfurada, peso: value } : sulfurada
      ));
    } else {
      alert(`El peso debe ser menor o igual que ${lote ? lote.peso : 0} kg.`);
    }
  };
  
  const handleCueroChange = (e, id) => {
    const value = Number(e.target.value);
    if (value >= 0 && (!lote || value <= lote.cantidad)) { // Solo acepta valores mayores o iguales a 0 y menores que la cantidad del lote
      setSulfuradas(sulfuradas.map(sulfurada => 
        sulfurada.id === id ? { ...sulfurada, cueros: value } : sulfurada
      ));
    } else {
      alert(`La cantidad de cueros debe ser menor o igual que ${lote ? lote.cantidad : 0}.`);
    }
  };

  const calcularPrecioSulf = (sulfuradaId) => {
    const sulfurada = sulfuradas.find(s => s.id === sulfuradaId);
    if (!sulfurada || !sulfurada.peso || !sulfurada.cueros) {
      alert('Por favor, completa todos los campos antes de calcular.');
      return;
    }
  
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
    setIsCalculado(true); //
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
      id: nuevasFilas[sulfuradaId].length + 1, // Asegúrate de que el ID sea único
      producto: '',
      cantidad: '',
      precio: '',
    };
  
    // Verifica que el sulfuradaId exista en filas_sulfurada
    if (!nuevasFilas[sulfuradaId]) {
      nuevasFilas[sulfuradaId] = []; // Inicializa si no existe
    }
  
    nuevasFilas[sulfuradaId].push(nuevaFila); // Agrega la nueva fila
    setFilas_sulfurada(nuevasFilas); // Actualiza el estado
  };

  const handleAgregarSulfurada = () => {
    const nuevaSulfuradaId = sulfuradas.length + 1; // Crear un nuevo id para cada sulfurada
    const nuevaSulfurada = { id: nuevaSulfuradaId, peso: 0, cueros: 0 }; // Crear la nueva sulfurada
  
    // Inicializar filas para la nueva sulfurada
    const nuevasFilas = {
      ...filas_sulfurada,
      [nuevaSulfuradaId]: [
        { id: 1, producto: '', cantidad: '', precio: '' },
        { id: 2, producto: '', cantidad: '', precio: '' },
        { id: 3, producto: '', cantidad: '', precio: '' },
        { id: 4, producto: '', cantidad: '', precio: '' },
        { id: 5, producto: '', cantidad: '', precio: '' },
      ],
    };
  
    setSulfuradas([...sulfuradas, nuevaSulfurada]); // Añadir al array de sulfuradas
    setFilas_sulfurada(nuevasFilas); // Actualizar el estado de filas
  };

  const handleEliminarSulf = (id) => {
    const nuevasSulfuradas = sulfuradas.filter(sulfurada => sulfurada.id !== id);
    setSulfuradas(nuevasSulfuradas);
  };

  const handleEliminarFila = (sulfuradaId, filaId) => {
    const nuevasFilas = { ...filas_sulfurada }; // Copia el estado actual
  
    // Verifica que el sulfuradaId exista en filas_sulfurada
    if (nuevasFilas[sulfuradaId]) {
      // Filtra las filas para eliminar la fila con el id correspondiente
      nuevasFilas[sulfuradaId] = nuevasFilas[sulfuradaId].filter(fila => fila.id !== filaId);
    }
  
    setFilas_sulfurada(nuevasFilas); // Actualiza el estado
  };

  const generarPDF = () => {
    const doc = new jsPDF();
  
    // Header background
    doc.setFillColor(0, 0, 102);
    doc.rect(0, 0, 210, 20, "F");
  
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Costo Sulfurada", 105, 12, { align: "center" });
  
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Lote ${loteId}`, 10, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 30);
  
    let startY = 40; // Posición inicial en Y para la tabla
  
    sulfuradas.forEach((sulfurada, index) => {
      // Agregar título de la sección si hay múltiples sulfuradas
      if (sulfuradas.length > 1) {
        doc.setFontSize(12);
        doc.text(`Sulfurada ${index + 1}`, 10, startY);
        startY += 10;
      }
  
      // Crear tabla con los datos corregidos
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
    });
  
    // Agregar logo
    doc.addImage(logo, "PNG", 160, 260, 40, 15);
  
    // Guardar el PDF
    doc.save(`Lote_${loteId}_Sulfurada.pdf`);
  };
  
  const handleGuardarSulfuradas = async () => {
    const sulfuradasData = sulfuradas.map(sulfurada => ({
        peso: sulfurada.peso,
        cueros: sulfurada.cueros,
        filas: filas_sulfurada[sulfurada.id].map(fila => ({
            producto_id: fila.producto,
            cantidad: fila.cantidad,
            precio: fila.precio,
            total: fila.total,
        })),
    }));

    try {
        const response = await fetch('/api/sulfuradas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ loteId: lote.id, sulfuradas: sulfuradasData }),
        });

        if (response.ok) {
            alert('Sulfuradas guardadas correctamente');
            setIsCalculado(false); // Resetear el estado
        } else {
            alert('Error al guardar las sulfuradas');
        }
      } catch (error) {
        console.error('Error al guardar las sulfuradas:', error);
        alert('Error al guardar las sulfuradas. Por favor, intenta de nuevo.');
    }
};

  // Renderizar las sulfuradas dinámicamente
  const renderSulfuradas = () => {
    return sulfuradas.map((sulfurada, index) => (
      <div key={sulfurada.id} className="lote-content">
        <div className="header-container">
          <h4>Sulfurada #{index + 1}</h4>
          <button className="btn-eliminar" onClick={() => handleEliminarSulf(sulfurada.id)}>
            <i className="bi bi-x-square-fill" style={{ color: '#000d46', fontSize: '35px' }}></i>
          </button>
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
        {/* Tabla de sulfurada */}
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
                      <option key={producto.id} value={producto.id}>{producto.producto}</option>
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
  <td></td>
  <td></td>
  <td><strong>Total:</strong></td>
  <td><strong>{formatoMoneda(calcularTotalGeneral(sulfurada.id))}</strong></td>
  <td></td>
</tr>
<tr>
  <td></td>
  <td></td>
  <td><strong>Precio por cuero:</strong></td>
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
    <div className='lote'>
      <div className='lote_titulo'><h2>LOTE #{loteId}</h2></div>

      <div className='nav-procesos'>
      {lote ? (
        <ul>
          <li><a onClick={() => setSeccionActiva('informacion')} className={seccionActiva === 'informacion' ? 'active-tab' : ''}>Informacion General</a></li>
          <li><a onClick={() => setSeccionActiva('sulfurada')} className={seccionActiva === 'sulfurada' ? 'active-tab' : ''}>Sulfurada</a></li>
          <li><a onClick={() => setSeccionActiva('des_div')} className={seccionActiva === 'des_div' ? 'active-tab' : ''}>Descarnada y Dividida</a></li>
          <li><a onClick={() => setSeccionActiva('piquelada')} className={seccionActiva === 'piquelada' ? 'active-tab' : ''}>Piquelada</a></li>
          <li><a onClick={() => setSeccionActiva('tenida')} className={seccionActiva === 'tenida' ? 'active-tab' : ''}>Teñida</a></li>
          <li><a onClick={() => setSeccionActiva('terminado')} className={seccionActiva === 'terminado' ? 'active-tab' : ''}>Terminado</a></li>
        </ul>
        ) : (
          <p>{lote === null ? "Lote no encontrado" : "Cargando información del lote..."}</p> // Mensaje mejorado
        )}
      </div>

      {/* Secciones con renderizado condicional */}
      {seccionActiva === 'informacion' && (
        <div className="lote-container">
          <div className="lote_subtitulo">
            <h1>Información General</h1>
          </div>
          <div className='info'>
            {lote ? (
              <ul>
                <li><strong>ID:</strong> {lote.id}</li>
                <li><strong>Fecha de Creación:</strong>{' '}
                    {new Date(lote.fecha_creacion).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: '2-digit',
                    })}
                </li>
                <li><strong>Tipo de Cuero:</strong> {lote.tipo_cuero}</li>
                <li><strong>Cantidad:</strong> {lote.cantidad}</li>
                <li><strong>Peso:</strong> {lote.peso} kg</li>
              </ul>
            ) : (
              <p>Cargando información del lote...</p>
            )}
          </div>
        </div>
      )}

{seccionActiva === 'sulfurada' && (
  <div className="lote-container">
  <div className="lote_subtitulo">
    <h1>Sulfurada</h1>
  </div>
  {renderSulfuradas()}  {/* Renderiza las sulfuradas aquí */}
  
  <div className="btn-agregar-sulf-container">
    <button className="btn-agregar-sulf" onClick={handleAgregarSulfurada}>
      <i class="bi bi-plus-lg" style={{ color: '#fff', fontSize: '20px' }}></i> <strong>Agregar Sulfurada</strong>
    </button>
    <button className="btn-descargar-pdf" onClick={generarPDF}>
      <i className="bi bi-file-earmark-pdf" style={{ color: '#fff', fontSize: '20px' }}></i> Descargar PDF
    </button>
    <button className="btn-guardar" onClick={handleGuardarSulfuradas} disabled={!isCalculado}>
    <i class="bi bi-floppy" style={{ color: '#fff', fontSize: '20px' }}></i>Guardar
    </button>
  </div>
</div>
)}


      {seccionActiva === 'des_div' && (
        <div className="lote-container">
          <div className="lote_subtitulo">
            <h1>Descarnada y Dividida</h1>
          </div>
          <div className='info'>
          <div className="frm_des_div">
          <form>
            <label style={{ color: "black" }}>Precio Descarnada</label>
            <input
              type="number"
              placeholder="Ingrese el precio por cuero"
            />
            <label style={{ color: "black" }}>Precio Dividida</label>
            <input
              type="number"
              placeholder="Ingrese el precio por cuero"
            />
            <label style={{ color: "black" }}>Precio Bombos</label>
            <input
              type="number"
              placeholder="Ingrese el precio por cuero"
            />
            <button type="button" className="btn-submit">Calcular</button>
          </form>
        </div>
          </div>
        </div>
      )}

      {seccionActiva === 'piquelada' && (
        <div className="lote-container">
          <div className="lote_subtitulo">
            <h1>Piquelada</h1>
          </div>
          <div className='info'>
            <p>Aquí va la información general del lote.</p>
          </div>
        </div>
      )}

      {seccionActiva === 'tenida' && (
        <div className="lote-container">
          <div className="lote_subtitulo">
            <h1>Teñida</h1>
          </div>
          <div className='lote-content'>
        </div>
        </div>
      )}

      {seccionActiva === 'terminado' && (
        <div className="lote-container">
          <div className="lote_subtitulo">
            <h1>Terminado</h1>
          </div>
          <div className='info'>
            <p>Aquí va la información general del lote.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lote;
