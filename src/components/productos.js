import React, { useEffect, useState } from "react";
import config from "../config";
import Swal from 'sweetalert2';

const Productos = ({ handleSectionChange }) => {
  // Recibe la función como prop
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Llamar a la API cuando el componente se monte
  useEffect(() => {
    fetch(`${config.API_URL}/productos`)
      .then((response) => response.json())
      .then((data) => {
        setProductos(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Error al cargar los productos");
        setLoading(false);
      });
  }, []);

  // Función para eliminar un producto
  const handleEliminar = (id) => {
    // Alerta de confirmación antes de eliminar el producto
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el producto permanentemente.',
      icon: 'warning',
      background: "#fffff", // fondo suave
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#0025c9',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      color: "#0e0e0e",
      iconColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        // Si el usuario confirma la eliminación, se hace la solicitud DELETE
        fetch(`${config.API_URL}/productos/${id}`, {
          method: 'DELETE',
        })
          .then((response) => {
            if (response.ok) {
              // Filtramos el producto eliminado del estado
              setProductos(productos.filter((producto) => producto.id !== id));
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'Producto eliminado correctamente',
                confirmButtonColor: '#0025c9'
              });
            } else {
              setError("Error al eliminar el producto");
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el producto',
                confirmButtonColor: '#0025c9'
              });
            }
          })
          .catch(() => {
            setError("Error al eliminar el producto");
            Swal.fire({
              icon: 'error',
              title: 'Error al eliminar',
              text: 'Ocurrió un error inesperado',
              confirmButtonColor: '#0025c9'
            });
          });
      }
    });
  };

  // Función para formatear el precio en pesos colombianos
  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(precio);
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      {productos.length === 0 ? (
        <div className="empty-state">
          <i
            className="bi bi-inbox"
            style={{ fontSize: "100px", color: "#0025c9" }}
          ></i>
          <p>No hay productos registrados</p>
        </div>
      ) : (
        <div className="tb">
          <table className="tabla productos">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Proveedor</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id}>
                  <td>{producto.producto}</td>
                  <td>{producto.proveedor}</td>
                  <td>
                    {producto.cantidad} {producto.medida}
                  </td>
                  <td>{formatearPrecio(producto.precio)}</td>
                  <td>
                    <button
                      className="btn_eliminar"
                      onClick={() => handleEliminar(producto.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn_editar"
                      onClick={() =>
                        handleSectionChange("editar_producto", producto)
                      }
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Productos;
