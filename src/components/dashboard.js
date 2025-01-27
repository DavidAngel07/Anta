import React, { useState } from 'react';
import './dashboard.css';
import logo from '../img/ANTA-2.png';
import Productos from '../components/productos';
import Formulas from '../components/formulas';
import Procesos from '../components/procesos';


const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [formData, setFormData] = useState({
    producto: '',
    proveedor: '',
    cantidad: '',
    medida: '',
    precio: ''
  });

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);  // Para almacenar el producto seleccionado
  

const handleSectionChange = (section, producto = null) => {
  setActiveSection(section);
  if (producto) {
    setProductoSeleccionado(producto); // Guardamos el producto seleccionado
    setFormData({  // Actualizamos el formulario con los datos del producto
      producto: producto.producto,
      proveedor: producto.proveedor,
      cantidad: producto.cantidad,
      medida: producto.medida,
      precio: producto.precio
    });
  }
};


  // Maneja el cambio de los campos del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Maneja el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Asegurarse de que todos los campos estén llenos
    if (!formData.producto || !formData.proveedor || !formData.cantidad || !formData.medida || !formData.precio) {
      alert('Por favor, complete todos los campos');
      return;
    }
  
    try {
      let response;
      let url = 'http://localhost:3001/productos';
      let method = 'POST';  // Predeterminado a POST, para agregar productos
  
      // Si estamos editando un producto, cambiamos el método y la URL
      if (productoSeleccionado) {
        url = `http://localhost:3001/productos/${productoSeleccionado.id}`;  // Usamos el ID del producto
        method = 'PUT';  // Cambiamos el método a PUT para la actualización
      }
  
      // Hacemos la solicitud para agregar o actualizar el producto
      response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
  
      const data = await response.json();
      if (data.success) {
        const successMessage = productoSeleccionado ? 'Producto actualizado exitosamente' : 'Producto agregado exitosamente';
        alert(successMessage);
  
        // Limpiar formulario y regresar a la sección de productos
        setFormData({ producto: '', proveedor: '', cantidad: '', medida: '', precio: '' });
        setActiveSection('productos');
      } else {
        alert('Error al procesar el producto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un problema al procesar el producto');
    }
  };
  

  return (
    <div className="dashboard-container">
      {/* Barra de navegación superior */}
      <nav className="top-nav">
        <img src={logo} alt="Logo" className="logo-nav" />
        <div className="nav-right">
          <a href="/login" className="btn-cerrar-sesion">Cerrar Sesión</a>
        </div>
      </nav>
      <div className='container-aside-contenido'>
        {/* Sidebar */}
        <aside className="sidebar">
          <ul>
            <li>
              <a
                href="#dashboard"
                onClick={() => handleSectionChange('dashboard')}
                className={activeSection === 'dashboard' ? 'active' : ''}>
                <i className="bi bi-bounding-box"></i> Dashboard
              </a>
            </li>
            <li>
              <a
                href="#productos"
                onClick={() => handleSectionChange('productos')}
                className={activeSection === 'productos' ? 'active' : ''}>
                <i className="bi bi-box-seam-fill"></i> Productos
              </a>
            </li>
            <li>
              <a
                href="#procesos"
                onClick={() => handleSectionChange('procesos')}
                className={activeSection === 'procesos' ? 'active' : ''}>
                <i class="bi bi-hdd-rack"></i> Procesos
              </a>
            </li>
            <li>
              <a
                href="#formulas"
                onClick={() => handleSectionChange('formulas')}
                className={activeSection === 'formulas' ? 'active' : ''}>
                <i className="bi bi-calculator"></i> Fórmulas
              </a>
            </li>
          </ul>
        </aside>

        {/* Contenido principal */}
        <div className="main-content">
          {activeSection === 'dashboard' && (
            <section id="dashboard">
              <h3>Dashboard</h3>
            </section>
          )}

        {activeSection === 'productos' && (
          <section id="productos">
            <a href="#agregar_producto" 
               onClick={() => handleSectionChange('agregar_producto')} 
               className="btn_azul">
              <i className="bi bi-plus-circle"></i> Agregar producto
            </a>
            <Productos handleSectionChange={handleSectionChange} /> {/* Pasamos handleSectionChange aquí */}
          </section>
        )}

        {activeSection === 'procesos' && (
          <section id="procesos">
            <Procesos />
          </section>
        )}


        {activeSection === 'formulas' && (
          <section id="formulas">
            <Formulas />
          </section>
        )}
        {activeSection === 'agregar_producto' && (
          <section id="agregar_producto">
            <div className="header-agregar">
              <a href='#productos' onClick={() => handleSectionChange('productos')} className='volver'>
                <i className="bi bi-backspace"></i> Volver
              </a>
              <h3>Agregar Producto</h3>
            </div>
            <div className='container_agregar_producto'>
              <form className='frm_agregar_producto' onSubmit={handleSubmit}>
                <input 
                  type='text' 
                  placeholder='Producto' 
                  name='producto' 
                  value={formData.producto} 
                  onChange={handleInputChange} 
                />
                <input 
                  type='text' 
                  placeholder='Proveedor' 
                  name='proveedor' 
                  value={formData.proveedor} 
                  onChange={handleInputChange} 
                />
                <input 
                  type='number' 
                  placeholder='Cantidad' 
                  name='cantidad' 
                  value={formData.cantidad} 
                  onChange={handleInputChange} 
                />
                <select
                  name="medida"
                  value={formData.medida}
                  onChange={handleInputChange}
                  className="select-medida"
                >
                  <option value="" disabled selected>
                    Unidad de medida
                  </option>
                  <option value="kg">kg</option>
                  <option value="mg">mg</option>
                </select>
                <input 
                  type='number' 
                  placeholder='Precio' 
                  name='precio' 
                  value={formData.precio} 
                  onChange={handleInputChange} 
                />
                <button type="submit" className='btn-submit'>Guardar Producto</button>
              </form>
            </div>
          </section>
        )}

        {activeSection === 'editar_producto' && (
          <section id="editar_producto">
            <div className="header-editar">
              <a href='#productos' onClick={() => handleSectionChange('productos')} className='volver'>
                <i className="bi bi-backspace"></i> Volver
              </a>
              <h3>Editar Producto</h3>
            </div>
            <div className='container_editar_producto'>
              <form className='frm_agregar_producto' onSubmit={handleSubmit}>
                <input 
                  type='text' 
                  placeholder='Producto' 
                  name='producto' 
                  value={formData.producto} 
                  onChange={handleInputChange} 
                />
                <input 
                  type='text' 
                  placeholder='Proveedor' 
                  name='proveedor' 
                  value={formData.proveedor} 
                  onChange={handleInputChange} 
                />
                <input 
                  type='number' 
                  placeholder='Cantidad' 
                  name='cantidad' 
                  value={formData.cantidad} 
                  onChange={handleInputChange} 
                />
                <select
                  name="medida"
                  value={formData.medida}
                  onChange={handleInputChange}
                  className="select-medida"
                >
                  <option value="" disabled>
                    Unidad de medida
                  </option>
                  <option value="kg">kg</option>
                  <option value="mg">mg</option>
                </select>
                <input 
                  type='number' 
                  placeholder='Precio' 
                  name='precio' 
                  value={formData.precio} 
                  onChange={handleInputChange} 
                />
                <button type="submit" className='btn-submit-editar'>Guardar Producto</button>
              </form>
            </div>
          </section>
        )}

        {activeSection === 'crear_lote' && (
          <section id="crear_lote">
            <div className="header-editar">
              <a href='#productos' onClick={() => handleSectionChange('productos')} className='volver'>
                <i className="bi bi-backspace"></i> Volver
              </a>
              <h3>Editar Producto</h3>
            </div>
            <div className='container_editar_producto'>
              <form className='frm_agregar_producto' onSubmit={handleSubmit}>
                <input 
                  type='text' 
                  placeholder='Producto' 
                  name='producto' 
                  value={formData.producto} 
                  onChange={handleInputChange} 
                />
                <input 
                  type='text' 
                  placeholder='Proveedor' 
                  name='proveedor' 
                  value={formData.proveedor} 
                  onChange={handleInputChange} 
                />
                <input 
                  type='number' 
                  placeholder='Cantidad' 
                  name='cantidad' 
                  value={formData.cantidad} 
                  onChange={handleInputChange} 
                />
                <select
                  name="medida"
                  value={formData.medida}
                  onChange={handleInputChange}
                  className="select-medida"
                >
                  <option value="" disabled>
                    Unidad de medida
                  </option>
                  <option value="kg">kg</option>
                  <option value="mg">mg</option>
                </select>
                <input 
                  type='number' 
                  placeholder='Precio' 
                  name='precio' 
                  value={formData.precio} 
                  onChange={handleInputChange} 
                />
                <button type="submit" className='btn-submit-editar'>Guardar Producto</button>
              </form>
            </div>
          </section>
        )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
