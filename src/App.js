import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register'; 
import Dashboard from './components/dashboard';
import Procesos from "./components/procesos";
import Lote from "./components/Lote";
import PrivateRoute from './components/PrivateRoute';
import Perfil from './components/perfil';
import Simulador from './components/simulador';
import ListaLotes from "./components/listaLotes";
import DetalleLote from "./components/detalleLote";
import Costos from "./components/costos";

function App() {
  return (
    <Router>
      <div className="body">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/procesos" element={<Procesos />} />
          <Route path="/lote/:id" element={<Lote />} /> {/* Ruta dinámica */}
          <Route path="/listaLote" element={<ListaLotes />} />
          <Route path="/simulador" element={<Simulador />} />
          <Route path="/costos" element={<Costos />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
