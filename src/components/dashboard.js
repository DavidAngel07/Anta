import React, { useState, useEffect, useRef } from "react";
import "./dashboard.css";
import logo from "../img/ANTA-2.png";
import Productos from "./productos";
import Simulador from "./simulador";
import Inventario from "./Inventario";
import config from "../config";
import ListaLotes from "./listaLotes";
import Costos from "./costos";
import BarChartProceso from "./BarChartProceso";
import Swal from "sweetalert2";
import { Bell } from "lucide-react"; // ícono de campana
import axios from "axios";

const Dashboard = () => {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  // Cargar el usuario desde el localStorage al iniciar
  useEffect(() => {
    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioGuardado) {
      setUsuarioActual(usuarioGuardado);
    }
  }, []);

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const nombreUsuario = usuario?.nombre || "Usuario";

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
        porcentaje: producto.porcentaje ? producto.porcentaje * 100 : "",
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
      !formData.codigo ||
      !formData.producto ||
      !formData.proveedor ||
      !formData.cantidad ||
      !formData.medida ||
      !formData.precio ||
      (!productoSeleccionado && !formData.porcentaje)
    ) {
      Swal.fire({
        icon: "error",
        title: "Campos incompletos",
        text: "Por favor, complete todos los campos",
        confirmButtonText: "OK",
        confirmButtonColor: "#0025c9",
      });
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
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: successMessage,
          confirmButtonText: "OK",
          confirmButtonColor: "#10b981",
          background: "#f0fdf4", // fondo suave
          color: "#0e0e0e", // texto
        });

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
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al procesar el producto",
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al procesar el producto",
        confirmButtonText: "OK",
        confirmButtonColor: "#dc3545",
      });
    }
  };
  const mainContentRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      const mainContent = document.querySelector(".main-content");
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 100); // prueba incluso 200 ms si sigue moviéndose
  }, []);

  const toggleSidebar = () => {
    console.log("Toggle sidebar ejecutado");
    setSidebarVisible(!sidebarVisible);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Función para consultar los productos con stock bajo
  const checkLowStock = async () => {
    try {
      const response = await axios.get(
        `${config.API_URL}/api/insumos/stock-bajo`
      );
      if (response.data.success && response.data.productos.length > 0) {
        setLowStockProducts(response.data.productos); // Guardar los productos con stock bajo
        console.log(response.data.productos); // Para depurar y verificar los datos
      }
    } catch (error) {
      console.error("Error al verificar stock bajo:", error);
    }
  };

  // Usar useEffect para hacer la consulta al cargar el componente
  useEffect(() => {
    checkLowStock();
  }, []);

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
          {/* Campana de notificaciones */}
          <button onClick={toggleNotifications} className="notification-button">
            <Bell size={24} />
            {/* Solo mostrar el indicador si hay notificaciones */}
            {lowStockProducts.length > 0 && (
              <span className="notification-indicator" />
            )}
          </button>

          {/* Panel de notificaciones */}
          {showNotifications && (
            <div className="notification-panel">
              <h3 className="text">Notificaciones</h3>
              <ul>
                {/* Mostrar la alerta si hay productos con stock bajo */}
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((producto, index) => (
                    <li key={index}>
                      ⚠️ Queda poca cantidad de {producto.producto}
                    </li>
                  ))
                ) : (
                  <li style={{ textAlign: "center" }}>No hay notificaciones</li>
                )}
              </ul>
            </div>
          )}

          {/* Botón de cerrar sesión */}
          <a href="/login" className="btn-cerrar-sesion" onClick={handleLogout}>
            Cerrar Sesión
          </a>
        </div>
      </nav>
      <div className="container-aside-contenido">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarVisible ? "show" : ""}`}>
          <ul>
            <li>
              <a
                href="#dashboard"
                onClick={() => handleSectionChange("dashboard")}
                className={activeSection === "dashboard" ? "active" : ""}
              >
                <i className="bi bi-bounding-box"></i> Dashboard
              </a>
            </li>

            <li>
              <a
                href="#inventario"
                onClick={() => handleSectionChange("inventario")}
                className={activeSection === "inventario" ? "active" : ""}
              >
                <i class="bi bi-card-checklist"></i> Inventario
              </a>
            </li>
            <li>
              <a
                href="#simulador"
                onClick={() => handleSectionChange("simulador")}
                className={activeSection === "simulador" ? "active" : ""}
              >
                <i className="bi bi-calculator"></i> Calculadora
              </a>
            </li>
            <li>
              <a
                href="#listaLotes"
                onClick={() => handleSectionChange("listaLotes")}
                className={activeSection === "listaLotes" ? "active" : ""}
              >
                <i className="bi bi-hdd-rack"></i> Lotes
              </a>
            </li>
            <li>
              <a
                href="#costos"
                onClick={() => handleSectionChange("costos")}
                className={activeSection === "costos" ? "active" : ""}
              >
                <i class="bi bi-cash-coin"></i> Costos
              </a>
            </li>
            <li>
              <a
                href="#productos"
                onClick={() => handleSectionChange("productos")}
                className={activeSection === "productos" ? "active" : ""}
              >
                <i class="bi bi-box-seam"></i> Productos
              </a>
            </li>
          </ul>
        </aside>

        {/* Contenido principal */}
        <div className="main-content" ref={mainContentRef}>
          {activeSection === "dashboard" && (
            <section
            id="dashboard"
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
          
              <div style={{ marginBottom: "1rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  Hola, {nombreUsuario} 👋
                </h1>
              </div>

                    <BarChartProceso />
            </section>
          )}

          {activeSection === "productos" && (
            <section id="productos">
              <div className="header-container-seccion">
                <a
                  href="#agregar_producto"
                  onClick={() => handleSectionChange("agregar_producto")}
                  className="btn_azul"
                >
                  <i className="bi bi-plus-circle"></i> Agregar producto
                </a>
                <h1 className="inventario-title">Productos</h1>
              </div>
              <Productos handleSectionChange={handleSectionChange} />{" "}
              {/* Pasamos handleSectionChange aquí */}
            </section>
          )}

          {activeSection === "listaLotes" && (
            <section id="listaLotes">
              <ListaLotes />
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

          {activeSection === "costos" && (
            <section id="costos">
              <Costos />
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
                    placeholder="Codigo"
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleInputChange}
                  />
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
                    placeholder="Codigo"
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleInputChange}
                  />
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
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Porcentaje"
                    name="porcentaje"
                    value={formData.porcentaje}
                    onChange={(e) =>
                      setFormData({ ...formData, porcentaje: e.target.value })
                    }
                  />
                  %
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
