import React, { useState } from "react";
import axios from "axios";
import logo from "../img/ANTA-SYSTEM.png";
import config from "../config";

const Register = () => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      await axios.post(`${config.API_URL}/register`, {
        nombre,
        correo,
        contraseña,
      });
  
      setMensaje("Usuario registrado exitosamente");
    } catch (error) {
      if (error.response) {
        setMensaje(error.response.data?.mensaje || "Error en el registro");
      } else {
        setMensaje("No se pudo conectar con el servidor");
      }
    }
  };
  

  return (
    <div className="container">
      <img src={logo} alt="Logo" className="logo" />
      <div className="container-register">
        <h2>Registro</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="input-login"
            placeholder="Nombre y Apellido"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <input
            type="email"
            className="input-login"
            placeholder="Email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
          <input
            type="password"
            className="input-login"
            placeholder="Contraseña"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
            required
          />
          <button type="submit" className="button">
            Registrar
          </button>
        </form>
        <a href="/login">Iniciar Sesión</a>
        {mensaje && <div className="mensaje_container"><p className="mensaje">{mensaje}</p></div>}
      </div>
    </div>
  );
};

export default Register;
