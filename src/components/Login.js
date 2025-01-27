import React, { useState } from 'react';
import axios from 'axios';
import logo from '../img/ANTA-SYSTEM.png';
import { useNavigate } from 'react-router-dom';


const Login = () => {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate(); // Inicializa useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
  
    try {
      const response = await axios.post('http://localhost:3001/login', {
        correo,
        contraseña,
      });
  
      setMensaje('Inicio de sesión exitoso');
      setCargando(false);
  
      // Redirige al Dashboard en caso de éxito
      navigate('/dashboard');
    } catch (error) {
      const mensajeError =
        error.response && error.response.data
          ? error.response.data
          : 'Error al iniciar sesión. Por favor, intenta de nuevo.';
  
      setMensaje(mensajeError);
      setCargando(false);
    }
  };
  

  return (
    <div className='container'>
        <img src={logo} alt="Logo" className='logo'/>
    <div className='container-login'>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
          <input
            type="email"
            className='input-login'
            placeholder='Email'
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
          <input
            type="password"
            className='input-login'
            placeholder='Contraseña'
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
            required
          />

        <button type="submit" disabled={cargando} className='button'>
          {cargando ? 'Cargando...' : 'Iniciar Sesión'}
        </button>
      </form>
      <a href='/register'>Registrate</a>
      {mensaje && <p>{mensaje}</p>}
    </div>
    </div>
  );
};

export default Login;

