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
      const response = await fetch('https://backend-anta.up.railway.app/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ correo, contraseña }),
      });

      const data = await response.json();

      if (response.status === 200) {
          // Guardamos el token en localStorage
          localStorage.setItem('token', data.token);
          // Redirigimos al Dashboard
          window.location.href = '/dashboard';
      } else {
          console.error(data.message);
      }
  } catch (error) {
      console.error("Error al hacer login:", error);
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

