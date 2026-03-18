import React, { useEffect, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getToken, onMessage } from "firebase/messaging";
import { messaging, auth } from './firebaseConfig/firebase.js'; 
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// --- CONTEXTO ---
import { UserProvider, UserContext } from './components/Services/UserContext';

// --- COMPONENTES DE VISTA ---
import { NavbarComponent } from './components/Views/Navbar.jsx';
import { Footer } from './components/Views/Footer';
import { Login } from "./utils/Login";
import { Privacidad } from "./components/Views/Privacidad";

// --- COMPONENTES DE SOCIOS / INICIO ---
import { Panico } from './components/Socios/Panico';
import { Contacto } from "./components/Socios/Contacto";
import { Novedades } from "./components/Services/Novedades";

// --- COMPONENTES DE SERVICIOS ---
import { Invitados } from "./components/Services/Invitados";
import { Alquileres } from "./components/Services/Alquileres";
import { EditarPublicacion } from "./components/Services/EditarPublicacion";
import { Mensajeria } from "./components/Services/Mensajeria";
import { RegistrarReserva } from "./components/Services/RegistrarReservas";
import { RegistrarSocio } from "./components/Services/RegistrarSocios";

// --- COMPONENTES DE ADMINISTRACIÓN ---
import { Administracion } from "./components/Admin/Administracion";
import { AdminMensajeria } from "./components/Services/AdminMensajeria.jsx";
import { Reservas } from "./components/Admin/Reservas";
import { EditarReserva } from "./components/Admin/EditarReserva";
import { EditarSocio } from "./components/Admin/EditarSocio";

// --- COMPONENTES DE SEGURIDAD ---
import { SeguridadDashboard } from "./components/Seguridad/SeguridadDashboard";

// --- ESTILOS ---
import './css/App.css';
import "react-day-picker/dist/style.css";

// Componente para envolver el contenido y tener acceso al Contexto
const AppContent = () => {
  const { userData, setUserData, loading } = useContext(UserContext);

  const guardarTokenEnBaseDeDatos = async (token) => {
    const db = getFirestore();
    const usuario = auth.currentUser;
    if (usuario) {
      const usuarioRef = doc(db, 'usuarios', usuario.uid);
      try {
        await setDoc(usuarioRef, { fcmToken: token }, { merge: true });
        console.log('Token FCM actualizado');
      } catch (error) {
        console.error('Error al guardar token:', error);
      }
    }
  };

  const solicitarPermiso = async () => {
    try {
      const permiso = await Notification.requestPermission();
      if (permiso === 'granted') {
        const token = await getToken(messaging, { 
          vapidKey: 'BC1dFTH3QJeInZ8LL-2ZrBj6EXE8iWmDu7PDfDGhx7LiADYJ_KjzZdK-izhIaPOpmI2qQ0cveH_fl5orZ1znFTw' 
        });
        guardarTokenEnBaseDeDatos(token);
      }
    } catch (error) {
      console.error('Error en notificaciones:', error);
    }
  };

  useEffect(() => {
    solicitarPermiso();
    const unsubscribe = onMessage(messaging, (payload) => {
      alert(payload.notification.body);
    });
    return () => unsubscribe();
  }, []);

  // Función de logout para pasar al Navbar
  const handleLogout = () => {
    localStorage.removeItem('userData');
    setUserData(null);
  };

  if (loading) return null; // Evita parpadeos mientras carga el localStorage

  return (
    <div className="App container">
      <NavbarComponent handleLogout={handleLogout} />
      <main style={{ marginBottom: '100px', marginTop: '80px' }}>
        <Routes>
          {/* Lógica de Raíz: Si hay usuario va a pánico, si no a Login */}
          <Route path="/" element={userData ? <Navigate to="/novedades" /> : <Login />} />
          <Route path="/login" element={!userData ? <Login /> : <Navigate to="/novedades" />} />

          {/* Rutas Protegidas */}
          <Route path="/panico" element={userData ? <Panico /> : <Navigate to="/login" />} />
          <Route path="/administracion" element={userData ? <Administracion /> : <Navigate to="/login" />} />
          <Route path="/invitados" element={userData ? <Invitados /> : <Navigate to="/login" />} />
          <Route path="/novedades" element={userData ? <Novedades /> : <Navigate to="/login" />} />
          <Route path="/alquileres" element={userData ? <Alquileres /> : <Navigate to="/login" />} />
          <Route path="/editar-publicacion/:id" element={userData ? <EditarPublicacion /> : <Navigate to="/login" />} />
          <Route path="/mensajeria" element={userData ? <Mensajeria /> : <Navigate to="/login" />} />
          <Route path="/campanas" element={userData ? <AdminMensajeria /> : <Navigate to="/login" />} />
          <Route path="/privacidad" element={userData ? <Privacidad /> : <Navigate to="/login" />} />
          <Route path="/contacto" element={userData ? <Contacto /> : <Navigate to="/login" />} />
          <Route path="/reservas" element={userData ? <Reservas /> : <Navigate to="/login" />} />
          <Route path="/reservas/create" element={userData ? <RegistrarReserva /> : <Navigate to="/login" />} />
          <Route path="/reservas/edit/:id" element={userData ? <EditarReserva /> : <Navigate to="/login" />} />
          <Route path="/socios/edit/:id" element={userData ? <EditarSocio /> : <Navigate to="/login" />} />
          <Route path="/seguridad" element={userData ? <SeguridadDashboard /> : <Navigate to="/login" />} />
          
          {/* Ruta de registro siempre accesible o según prefieras */}
          <Route path="/socios/create" element={<RegistrarSocio />} />

          {/* Captura de rutas no existentes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

// Componente principal que envuelve todo en el Provider y el Router
export const App = () => {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
};