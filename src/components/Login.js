import React, { useState } from "react";
import logo from "../img/ANTA-SYSTEM.png";
import { useNavigate } from "react-router-dom";
import config from "../config";

const Login = () => {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate(); // Inicializa useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🟡 handleSubmit ejecutado"); // <--- ESTE
    setCargando(true);
    setMensaje(""); // Limpiar mensaje anterior

    try {
      console.log("Llamando a:", `${config.API_URL}/login`);
      const response = await fetch(`${config.API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo, contraseña }),
        credentials: "include", // Esto permite enviar cookies/sesiones si usas JWT
      });

      if (!response.ok) {
        const errorData = await response.json();
        const mensajeError =
          typeof errorData === "string"
            ? errorData
            : errorData.message || "Error en el inicio de sesión";
        throw new Error(mensajeError);
      }

      const data = await response.json();
      console.log("Respuesta del backend:", data);

      // Guardamos el token en localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));

      console.log("Token guardado:", localStorage.getItem("token"));

      // Redirigimos al Dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error al hacer login:", error);
      setMensaje(error.message); // Muestra el mensaje de error en la UI
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container">
      <img src={logo} alt="Logo" className="logo" />
      <div className="container-login">
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
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

          <button type="submit" disabled={cargando} className="button">
            {cargando ? "Cargando..." : "Iniciar Sesión"}
          </button>
        </form>
        {mensaje && <p>{mensaje}</p>}
      </div>
    </div>
  );
};

export default Login;
