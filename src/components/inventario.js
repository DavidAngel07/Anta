import { useState, useEffect } from "react";
import axios from "axios";

const Inventario = () => {
  const [productos, setProductos] = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState({
    tipo: "",
    color: "",
    acabado: "",
    calibre: "",
    cantidad: ""
  });
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const { data } = await axios.get("http://localhost:3001/productos-terminados");
      setProductos(data);
    } catch (error) {
      console.error("Error al cargar productos-terminados", error);
    }
  };

  const handleChange = (e) => {
    setNuevoProducto({ ...nuevoProducto, [e.target.name]: e.target.value });
  };

  const agregarProducto = async () => {
    try {
      await axios.post("http://localhost:3001/productos-terminados", nuevoProducto);
      cargarProductos();
    } catch (error) {
      console.error("Error al agregar producto", error);
    }
  };

  const actualizarStock = async (id, cantidad) => {
    try {
      await axios.put(`http://localhost:3001/productos-terminados/vender/${id}`, { cantidad });
      cargarProductos();
    } catch (error) {
      console.error("Error al actualizar stock", error);
    }
  };

  return (
    <div className="p-4 tb">
      <div className="frm_inventario">
      <input
        type="text"
        placeholder="Filtrar por tipo, color, acabado o calibre"
        className="border p-2 mb-4 w-full"
        onChange={(e) => setFiltro(e.target.value)}
      />
      </div>
      <table className="tabla">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Tipo</th>
            <th className="border p-2">Color</th>
            <th className="border p-2">Acabado</th>
            <th className="border p-2">Calibre</th>
            <th className="border p-2">Cantidad</th>
            <th className="border p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos
            .filter(p => Object.values(p).some(v => String(v).toLowerCase().includes(filtro.toLowerCase())))
            .map(producto => (
              <tr key={producto.id}>
                <td className="border p-2">{producto.tipo}</td>
                <td className="border p-2">{producto.color}</td>
                <td className="border p-2">{producto.acabado}</td>
                <td className="border p-2">{producto.calibre}</td>
                <td className="border p-2">{producto.cantidad}</td>
                <td className="border p-2">
                  <button onClick={() => actualizarStock(producto.id, producto.cantidad + 1)} className="bg-green-500 text-white px-2 py-1 mr-2">+</button>
                  <button onClick={() => actualizarStock(producto.id, producto.cantidad - 1)} className="bg-red-500 text-white px-2 py-1">-</button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <h3 className="">Añadir Producto</h3>
      <div className="frm_inventario">
        <input name="tipo" placeholder="Tipo" onChange={handleChange} />
        <input name="color" placeholder="Color" onChange={handleChange} />
        <input name="acabado" placeholder="Acabado" onChange={handleChange} />
        <input name="calibre" placeholder="Calibre" onChange={handleChange} />
        <input name="cantidad" placeholder="Cantidad" type="number" onChange={handleChange} />
      </div>
      <a onClick={agregarProducto} className="btn_azul">Agregar</a>
    </div>
  );
};

export default Inventario;


