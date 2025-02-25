import React, { useState, useEffect } from 'react';

const Perfil = () => {
  const [usuario, setUsuario] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    // Agrega más campos según sea necesario
  });

  useEffect(() => {
    // Simulación de una llamada a la API para obtener la información del usuario
    const fetchUsuario = async () => {
      // Aquí deberías hacer la llamada a tu API
      const response = await fetch('http://localhost:3001/api/usuario/1'); // Cambia la URL según tu API
      const data = await response.json();
      setUsuario(data);
      setFormData(data); // Inicializa el formulario con los datos del usuario
    };

    fetchUsuario();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Aquí deberías hacer la llamada a tu API para guardar los cambios
    const response = await fetch('http://localhost:3001/api/usuario/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      alert('Información actualizada correctamente');
      // Puedes volver a obtener la información del usuario si es necesario
    } else {
      alert('Error al actualizar la información');
    }
  };

  return (
    <div className="perfil-container">
      <div className="perfil-info">
        <h2>Información del Usuario</h2>
        {usuario ? (
          <ul>
            <li><strong>Nombre:</strong> {usuario.nombre}</li>
            <li><strong>Email:</strong> {usuario.email}</li>
            <li><strong>Teléfono:</strong> {usuario.telefono}</li>
            {/* Agrega más campos según sea necesario */}
          </ul>
        ) : (
          <p>Cargando información del usuario...</p>
        )}
      </div>
      <div className="perfil-editar">
        <h2>Editar Información</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Nombre:</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Teléfono:</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
            />
          </div>
          {/* Agrega más campos según sea necesario */}
          <button type="submit">Guardar Cambios</button>
        </form>
      </div>
    </div>
  );
};

export default Perfil;