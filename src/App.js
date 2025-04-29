import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register'; 
import Dashboard from './components/dashboard';
import PrivateRoute from './components/PrivateRoute';
import Simulador from './components/simulador';
import ListaLotes from "./components/listaLotes";
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
          <Route path="/listaLote" element={<ListaLotes />} />
          <Route path="/simulador" element={<Simulador />} />
          <Route path="/costos" element={<Costos />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
