import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import config from '../config';

const PrivateRoute = ({ children }) => {
  const [isValid, setIsValid] = useState(null); // null = cargando

  useEffect(() => {
    const verificarToken = async () => {
      const token = localStorage.getItem('token');
      const usuario = localStorage.getItem('usuario');

      if (!token || !usuario) {
        setIsValid(false);
        return;
      }

      try {
        const response = await fetch(`${config.API_URL}/verificar-sesion`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setIsValid(true);
        } else {
          // Token inválido o usuario offline → limpiar y redirigir
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          setIsValid(false);
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
        setIsValid(false);
      }
    };

    verificarToken();
  }, []);

  // Mientras verifica, no renderiza nada (puedes poner un spinner)
  if (isValid === null) return <div>Cargando...</div>;

  return isValid ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;