import React, { useState, useEffect } from 'react';

const Formulas = () => {
  // Estado para almacenar los productos de la base de datos
  const [productos, setProductos] = useState([]);
  
  // Estado para almacenar las filas de la tabla
  const [filas, setFilas] = useState([
    { id: 1, producto: '', cantidad: '', precio: '' },
    { id: 2, producto: '', cantidad: '', precio: '' },
    { id: 3, producto: '', cantidad: '', precio: '' },
    { id: 4, producto: '', cantidad: '', precio: '' },
    { id: 5, producto: '', cantidad: '', precio: '' },
  ]);

  // Estado para el peso y color
  const [peso, setPeso] = useState('');
  const [color, setColor] = useState('');

  // Usamos useEffect para obtener los productos cuando el componente se monte
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch('https://backend-anta.up.railway.app/productos'); // Asegúrate de que la URL sea correcta
        const data = await response.json();
        setProductos(data); // Guardamos los productos en el estado
      } catch (error) {
        console.error('Error al obtener los productos:', error);
      }
    };

    fetchProductos();
  }, []);

  // Manejar cambio de selección de producto en la tabla
  const handleProductoChange = (e, index) => {
    const nuevoValor = e.target.value;
    const nuevasFilas = [...filas];
    nuevasFilas[index].producto = nuevoValor;
    setFilas(nuevasFilas);
  };

  // Manejar cambios en el campo de peso
  const handlePesoChange = (e) => {
    setPeso(e.target.value);
  };

  // Manejar cambios en el campo de color
  const handleColorChange = (e) => {
    setColor(e.target.value);
  };

  // Función para calcular el precio dividido entre la cantidad
  const calcularPrecio = () => {
    if (!peso || !color || filas.some(fila => !fila.producto || !fila.cantidad)) {
      // Si el peso, color o algún select está vacío, mostramos una alerta
      alert('Por favor, completa todos los campos antes de calcular.');
      return;
    }

    // Si todos los campos están llenos, realizamos el cálculo
    const nuevasFilas = filas.map(fila => {
      const productoSeleccionado = productos.find(producto => producto.id === parseInt(fila.producto));
      if (productoSeleccionado && fila.cantidad > 0) {
        // Usamos la cantidad del producto en la base de datos para el cálculo
        const precioPorUnidad = productoSeleccionado.precio / productoSeleccionado.cantidad; // Dividimos el precio entre la cantidad del producto
        return { ...fila, precio: precioPorUnidad.toFixed(2) }; // Asignamos el precio calculado
      }
      return fila;
    });

    setFilas(nuevasFilas); // Actualizamos las filas con los precios calculados
  };

  // Función para formatear los valores en pesos colombianos
  const formatoMoneda = (valor) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', // Esto mantiene el signo de pesos colombianos
    currency: 'COP', // Asegura que sea en pesos colombianos
    minimumFractionDigits: 0, // Elimina los decimales
    maximumFractionDigits: 0, // Elimina los decimales
  }).format(valor);
};


  // Agregar una nueva fila
  const handleAgregarFila = () => {
    const nuevaFila = {
      id: filas.length + 1, // Generamos un ID único
      producto: '',
      cantidad: '',
      precio: '',
    };
    setFilas([...filas, nuevaFila]); // Agregamos la nueva fila al estado
  };

  // Eliminar una fila
  const handleEliminarFila = (id) => {
    const nuevasFilas = filas.filter(fila => fila.id !== id); // Filtramos la fila por su ID
    setFilas(nuevasFilas); // Actualizamos el estado
  };

  return (
    <div className="formulas-container">
      <div className='frm_peso_color'>
        <form>
          <label style={{color: "black"}}>Peso total</label>
          <input
            type="text"
            value={peso}
            onChange={handlePesoChange}
            placeholder='Ingrese el peso'
          />
          <label style={{color: "black"}}>Color</label>
          <select
            name="color"
            className="select-medida"
            value={color}
            onChange={handleColorChange}
          >
            <option value="" disabled>
              Color
            </option>
            <option value="Negro">Negro</option>
            <option value="Cafe">Cafe</option>
            <option value="Roble">Roble</option>
          </select>
          <button
            type="button"
            className='btn-submit'
            onClick={calcularPrecio}
          >
            Calcular
          </button>
        </form>
      </div>
      <table className="formulas-table">
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
          {filas.map((fila, index) => (
            <tr key={fila.id}>
              <td>
                <select
                  value={fila.producto}
                  onChange={(e) => handleProductoChange(e, index)}
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.producto} / {producto.proveedor}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  value={fila.cantidad}
                  onChange={(e) => {
                    const nuevasFilas = [...filas];
                    nuevasFilas[index].cantidad = e.target.value;
                    setFilas(nuevasFilas);
                  }}
                />
              </td>
              <td>{formatoMoneda(fila.precio)}</td>
              <td>{formatoMoneda(fila.precio * fila.cantidad)}</td>
              <td className="ultima-columna">
                <button
                  className="btn-eliminar"
                  onClick={() => handleEliminarFila(fila.id)}
                >
                  <i className="bi bi-x-circle-fill i_eliminar" style={{color: 'red', fontSize: '24px'}}></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Botón para agregar una fila más */}
      <button className="btn-agregar" onClick={handleAgregarFila}>
        <i className="bi bi-plus-circle" style={{color: 'green', fontSize: '24px'}}></i>
      </button>
    </div>
  );
};

export default Formulas;
