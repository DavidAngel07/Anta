import { useState, useEffect } from "react";

const InventoryForm = () => {
  const [cueroTipo, setCueroTipo] = useState("Bufalo");
  const [cantidad, setCantidad] = useState(0);
  const [estado, setEstado] = useState("Almacenado");
  const [inventario, setInventario] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/inventario")
      .then((res) => res.json())
      .then((data) => {
        console.log("Datos del inventario:", data);
        if (Array.isArray(data)) {
          setInventario(data);
        } else {
          console.error("La respuesta no es un array:", data);
        }
      })
      .catch((error) => console.error("Error al obtener inventario:", error));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch("http://localhost:3001/inventario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cueroTipo, cantidad, estado }),
    });

    if (response.ok) {
      const updatedData = await response.json();
      setInventario(updatedData);
      alert("Inventario actualizado con éxito");
    }
  };

  return (
    <div className="inventario_container">
      <h2>Registro de Inventario</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Tipo de Cuero:
          <select value={cueroTipo} onChange={(e) => setCueroTipo(e.target.value)}>
            <option value="Bufalo">Búfalo</option>
            <option value="Vacuno">Vacuno</option>
            <option value="Cabra">Cabra</option>
          </select>
        </label>
        <label>
          Cantidad:
          <input type="number" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} required />
        </label>
        <label>
          Estado:
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="Almacenado">Almacenado</option>
            <option value="En Producción">En Producción</option>
          </select>
        </label>
        <button type="submit">Registrar</button>
      </form>
      <h3>Inventario Actual</h3>
      <ul>
        {inventario.map((item) => (
          <li key={item.tipo}>
            {item.tipo}: {item.cantidad} ({item.estado})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InventoryForm;
