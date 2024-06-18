import React,{ useEffect, useState} from 'react';
import { HashRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import { Login } from "./utils/Login";
import { Reservas } from "./components/Admin/Reservas";
import { Administracion } from "./components/Admin/Administracion";
import { EditarReserva } from "./components/Admin/EditarReserva";
import { EditarSocio } from "./components/Admin/EditarSocio";
import { RegistrarReserva } from "./components/Socios/RegistrarReservas";
import { RegistrarSocio } from "./components/Socios/RegistrarSocios";
import { Panico } from './components/Socios/Panico';
import {Contacto} from "./components/Socios/Contacto";
import { Invitados } from "./components/Services/Invitados";
import {Novedades} from "./components/Services/Novedades";
import {Mensajeria} from "./components/Services/Mensajeria";
import {ChatRoom} from "./components/Services/ChatRoom";
import { UserProvider } from './components/Services/UserContext';
import {Privacidad} from "./components/Views/Privacidad";
import { NavbarComponent } from './components/Views/Navbar.jsx';
import {Footer} from './components/Views/Footer';
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
          <Route path="/mensajeria" element={<Mensajeria />} />
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
