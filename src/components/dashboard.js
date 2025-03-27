import React, { useState } from "react";
import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import "./dashboard.css";
import logo from "../img/ANTA-2.png";
import Productos from "./productos";
import Procesos from "./procesos";
import Perfil from "./perfil";
import Simulador from "./simulador";
import Inventario from "./inventario";
import config from "../config";

const Dashboard = () => {
  const [usuarioActual, setUsuarioActual] = useState(null);

// Cargar el usuario desde el localStorage al iniciar
useEffect(() => {
  const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
  if (usuarioGuardado) {
    setUsuarioActual(usuarioGuardado);
  }
}, []);

  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [formData, setFormData] = useState({
    producto: "",
    proveedor: "",
    cantidad: "",
    medida: "",
    precio: "",
    porcentaje: "", // Añadido el campo porcentaje
  });

  const [productoSeleccionado, setProductoSeleccionado] = useState(null); // Para almacenar el producto seleccionado

  const handleSectionChange = (section, producto = null) => {
    setActiveSection(section);
    setSidebarVisible(false); // Asegura que el sidebar se oculte
    if (section === "editar_producto" && producto) {
      setProductoSeleccionado(producto);
      setFormData({
        producto: producto.producto,
        proveedor: producto.proveedor,
        cantidad: producto.cantidad,
        medida: producto.medida,
        precio: producto.precio,
        porcentaje: producto.porcentaje || "",
      });
    } else if (section === "agregar_producto") {
      setFormData({
        producto: "",
        proveedor: "",
        cantidad: "",
        medida: "",
        precio: "",
        porcentaje: "",
      });
    }
  };

  const handleLogout = async () => {
    try {
      const correo = usuarioActual?.correo || ""; // Asegúrate de que este dato esté disponible

      const response = await fetch("/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo }),
      });

      if (!response.ok) {
        throw new Error("Error al cerrar sesión en el servidor");
      }

      // Eliminar token del localStorage
      localStorage.removeItem("token");

      // Redirigir a login
      window.location.href = "/login";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Maneja el cambio de los campos del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Maneja el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que todos los campos estén llenos
    if (
      !formData.producto ||
      !formData.proveedor ||
      !formData.cantidad ||
      !formData.medida ||
      !formData.precio ||
      (!productoSeleccionado && !formData.porcentaje)
    ) {
      alert("Por favor, complete todos los campos");
      return;
    }

    try {
      let response;
      let url = `${config.API_URL}/productos`;
      let method = "POST"; // Predeterminado a POST, para agregar productos

      // Si estamos editando un producto, cambiamos el método y la URL
      if (productoSeleccionado) {
        url = `${config.API_URL}/productos/${productoSeleccionado.id}`; // Usamos el ID del producto
        method = "PUT"; // Cambiamos el método a PUT para la actualización
      }

      // Asegurar que el porcentaje se guarde como decimal (dividiendo entre 100)
      const datosAEnviar = {
        ...formData,
        porcentaje: formData.porcentaje ? formData.porcentaje / 100 : 0, // Si el porcentaje es vacío, se guarda como 0
      };

      // Hacemos la solicitud para agregar o actualizar el producto
      response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosAEnviar),
      });

      const data = await response.json();
      if (data.success) {
        const successMessage = productoSeleccionado
          ? "Producto actualizado exitosamente"
          : "Producto agregado exitosamente";
        alert(successMessage);

        // Limpiar formulario y regresar a la sección de productos
        setFormData({
          producto: "",
          proveedor: "",
          cantidad: "",
          medida: "",
          precio: "",
          porcentaje: "",
        });
        setActiveSection("productos");
      } else {
        alert("Error al procesar el producto");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un problema al procesar el producto");
    }
  };

  const toggleSidebar = () => {
    console.log("Toggle sidebar ejecutado");
    setSidebarVisible(!sidebarVisible);
  };
  

  return (
    <div className="dashboard-container">
      {/* Botón para mostrar/ocultar el sidebar */}
      <button className="menu-toggle" onClick={toggleSidebar}>
        ☰
      </button>
      {/* Barra de navegación superior */}
      <nav className="top-nav">
        <img src={logo} alt="Logo" className="logo-nav" />
        <div className="nav-right">
          <a
            href="/login"
            className="btn-cerrar-sesion"
            onClick={() => handleLogout()}
          >
            Cerrar Sesión
          </a>
        </div>
      </nav>
      <div className="container-aside-contenido">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarVisible ? "show" : ""}`}>
          <ul>
            {/*<li>
              <a
                href="#dashboard"
                onClick={() => handleSectionChange("dashboard")}
                className={activeSection === "dashboard" ? "active" : ""}
              >
                <i className="bi bi-bounding-box"></i> Dashboard
              </a>
            </li>*/}
            <li>
            <a
                href="#productos"
                onClick={() => handleSectionChange("productos")}
                className={activeSection === "productos" ? "active" : ""}
              >
                <i className="bi bi-box-seam-fill"></i> Productos
              </a>
            </li>
            {/*<li>
              <a
                href="#procesos"
                onClick={() => handleSectionChange("procesos")}
                className={activeSection === "procesos" ? "active" : ""}
              >
                <i className="bi bi-hdd-rack"></i> Procesos
              </a>
            </li>*/}
            <li>
            <a
                href="#simulador"
                onClick={() => handleSectionChange("simulador")}
                className={activeSection === "simulador" ? "active" : ""}
              >
                <i className="bi bi-calculator"></i> Calculadora
              </a>
            </li>
            {/*<li>
              <a
                href="#inventario"
                onClick={() => handleSectionChange('inventario')}
                className={activeSection === 'inventario' ? 'active' : ''}>
                <i className="bi bi-calculator"></i> Inventario
              </a>
            </li>*/}
          </ul>
        </aside>

        {/* Contenido principal */}
        <div className="main-content">
          {activeSection === "dashboard" && (
            <section id="dashboard">
              <h3>Dashboard</h3>
            </section>
          )}

          {activeSection === "productos" && (
            <section id="productos">
              <a
                href="#agregar_producto"
                onClick={() => handleSectionChange("agregar_producto")}
                className="btn_azul"
              >
                <i className="bi bi-plus-circle"></i> Agregar producto
              </a>
              <Productos handleSectionChange={handleSectionChange} />{" "}
              {/* Pasamos handleSectionChange aquí */}
            </section>
          )}

          {activeSection === "procesos" && (
            <section id="procesos">
              <Procesos />
            </section>
          )}

          {activeSection === "simulador" && (
            <section id="simulador">
              <Simulador />
            </section>
          )}

          {activeSection === "inventario" && (
            <section id="inventario">
              <Inventario />
            </section>
          )}

          {activeSection === "agregar_producto" && (
            <section id="agregar_producto">
              <div className="header-agregar">
                <a
                  href="#productos"
                  onClick={() => handleSectionChange("productos")}
                  className="volver"
                >
                  <i className="bi bi-backspace"></i> Volver
                </a>
                <h3>Agregar Producto</h3>
              </div>
              <div className="container_agregar_producto">
                <form className="frm_agregar_producto" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    placeholder="Producto"
                    name="producto"
                    value={formData.producto}
                    onChange={handleInputChange}
                  />
                  <input
                    type="text"
                    placeholder="Proveedor"
                    name="proveedor"
                    value={formData.proveedor}
                    onChange={handleInputChange}
                  />
                  <input
                    type="number"
                    placeholder="Cantidad"
                    name="cantidad"
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
                    type="number"
                    placeholder="Precio"
                    name="precio"
                    value={formData.precio}
                    onChange={handleInputChange}
                  />
                  <input
                    type="number"
                    step="0.0001" // Permite decimales
                    placeholder="Porcentaje"
                    name="porcentaje"
                    value={formData.porcentaje}
                    onChange={handleInputChange}
                  />
                  %
                  <button type="submit" className="btn-submit">
                    Guardar Producto
                  </button>
                </form>
              </div>
            </section>
          )}

          {activeSection === "editar_producto" && (
            <section id="editar_producto">
              <div className="header-editar">
                <a
                  href="#productos"
                  onClick={() => handleSectionChange("productos")}
                  className="volver"
                >
                  <i className="bi bi-backspace"></i> Volver
                </a>
                <h3>Editar Producto</h3>
              </div>
              <div className="container_editar_producto">
                <form className="frm_agregar_producto" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    placeholder="Producto"
                    name="producto"
                    value={formData.producto}
                    onChange={handleInputChange}
                  />
                  <input
                    type="text"
                    placeholder="Proveedor"
                    name="proveedor"
                    value={formData.proveedor}
                    onChange={handleInputChange}
                  />
                  <input
                    type="number"
                    placeholder="Cantidad"
                    name="cantidad"
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
                    type="number"
                    placeholder="Precio"
                    name="precio"
                    value={formData.precio}
                    onChange={handleInputChange}
                  />
                  <button type="submit" className="btn-submit-editar">
                    Guardar Producto
                  </button>
                </form>
              </div>
            </section>
          )}

          {activeSection === "crear_lote" && (
            <section id="crear_lote">
              <div className="header-editar">
                <a
                  href="#productos"
                  onClick={() => handleSectionChange("productos")}
                  className="volver"
                >
                  <i className="bi bi-backspace"></i> Volver
                </a>
                <h3>Editar Producto</h3>
              </div>
              <div className="container_editar_producto">
                <form className="frm_agregar_producto" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    placeholder="Producto"
                    name="producto"
                    value={formData.producto}
                    onChange={handleInputChange}
                  />
                  <input
                    type="text"
                    placeholder="Proveedor"
                    name="proveedor"
                    value={formData.proveedor}
                    onChange={handleInputChange}
                  />
                  <input
                    type="number"
                    placeholder="Cantidad"
                    name="cantidad"
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
                    type="number"
                    placeholder="Precio"
                    name="precio"
                    value={formData.precio}
                    onChange={handleInputChange}
                  />
                  <button type="submit" className="btn-submit-editar">
                    Guardar Producto
                  </button>
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
