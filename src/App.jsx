import React,{ useEffect, useState} from 'react';
import { HashRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import { Invitados } from "./components/Invitados";
import { Reservas } from "./components/Reservas";
import { Administracion } from "./components/Administracion";
import { Login } from "./components/Login";
import { RegistrarReserva } from "./components/RegistrarReservas";
import { RegistrarSocio } from "./components/RegistrarSocios";
import { EditarReserva } from "./components/EditarReserva";
import { EditarSocio } from "./components/EditarSocio";
import { Panico } from './components/Panico';
import {Contacto} from "./components/Contacto";
import {Novedades} from "./components/Novedades";
import {Privacidad} from "./components/Privacidad";
import {ChatRoom} from "./components/ChatRoom";
import { UserProvider } from './components/UserContext';
import { NavbarComponent } from './components/Navbar.jsx';
import {Footer} from './components/Footer';
import './css/App.css'


export const App = () => {
  
  const [userData, setUserData]  = useState(null);
  
  useEffect(() => {
    const userDataFromStorage = localStorage.getItem('userData');
    if (userDataFromStorage) {
      setUserData(JSON.parse(userDataFromStorage));
    }
  }, []);
  
  const handleLogout = () => {
    // Limpiar los datos de usuario al cerrar sesión
    localStorage.removeItem('userData');
    setUserData(null);
   
  };

  return (
    
    <div className="App container ">
      <Router>
        <UserProvider>
        <header>
        <NavbarComponent handleLogout={handleLogout}/>
        </header>
        <main style={{ marginBottom: '100px' }}> {/* Add some margin to avoid overlapping with the footer */}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/panico" element={<Panico />} />
          <Route path="/administracion" element={<Administracion />} />
          <Route path="/invitados" element={<Invitados />} />
          <Route path="/chatroom" element={<ChatRoom />} />
          <Route path="/novedades" element={<Novedades />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/socios/create" element={<RegistrarSocio />} />
          <Route path="/reservas" element={<Reservas />} />
          <Route path="/reservas/create" element={<RegistrarReserva />} />
          <Route path="/socios/edit/:id" element={<EditarSocio />} />
          <Route path="/reservas/edit/:id" element={<EditarReserva />} />
          {userData ? null : <Route path="*" element={<Navigate to="/" />} />}
        </Routes>
        </main>
        <Footer/>
   
        </UserProvider>
      </Router>
    </div>
    
  );
};
