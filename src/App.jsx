import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from './firebaseConfig/firebase.js';  // Asegúrate de importar la instancia de messaging desde tu configuración de Firebase
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { auth } from './firebaseConfig/firebase.js';
import { Login } from "./utils/Login";
import { Reservas } from "./components/Admin/Reservas";
import { Administracion } from "./components/Admin/Administracion";
import { EditarReserva } from "./components/Admin/EditarReserva";
import { EditarSocio } from "./components/Admin/EditarSocio";
import { Panico } from './components/Socios/Panico';
import { Contacto } from "./components/Socios/Contacto";
import { RegistrarReserva } from "./components/Services/RegistrarReservas";
import { RegistrarSocio } from "./components/Services/RegistrarSocios";
import { Invitados } from "./components/Services/Invitados";
import { Novedades } from "./components/Services/Novedades";
import { Alquileres } from "./components/Services/Alquileres";
import { Mensajeria } from "./components/Services/Mensajeria";
import { AdminMensajeria } from "./components/Services/AdminMensajeria.jsx";
import { UserProvider } from './components/Services/UserContext';
import { Privacidad } from "./components/Views/Privacidad";
import { NavbarComponent } from './components/Views/Navbar.jsx';
import { Footer } from './components/Views/Footer';
import { SeguridadDashboard } from "./components/Seguridad/SeguridadDashboard";
import './css/App.css';

export const App = () => {
  const [userData, setUserData] = useState(null);

  const guardarTokenEnBaseDeDatos = async (token) => {
    const db = getFirestore();
    const usuario = auth.currentUser;

    if (usuario) {
      const usuarioRef = doc(db, 'usuarios', usuario.uid);

      try {
        const usuarioDoc = await getDoc(usuarioRef);
        if (usuarioDoc.exists()) {
          await setDoc(usuarioRef, { fcmToken: token }, { merge: true });
          console.log('Token FCM guardado en la base de datos');
        } else {
          console.error('El documento del usuario no existe');
        }
      } catch (error) {
        console.error('Error al guardar el token en la base de datos:', error);
      }
    } else {
      console.error('No hay usuario autenticado');
    }
  };

  const solicitarPermisoParaNotificaciones = async () => {
    try {
      const permiso = await Notification.requestPermission();
      if (permiso === 'granted') {
        const token = await getToken(messaging, { vapidKey: 'BC1dFTH3QJeInZ8LL-2ZrBj6EXE8iWmDu7PDfDGhx7LiADYJ_KjzZdK-izhIaPOpmI2qQ0cveH_fl5orZ1znFTw' });
        console.log('Token de FCM:', token);
        guardarTokenEnBaseDeDatos(token);
      } else {
        console.log('Permiso de notificación denegado');
      }
    } catch (error) {
      console.error('Error al solicitar permiso:', error);
    }
  };

  useEffect(() => {
    // Solicitar permiso cuando el componente se monta
    solicitarPermisoParaNotificaciones();

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Mensaje recibido:', payload);
      alert(payload.notification.body);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userDataFromStorage = localStorage.getItem('userData');
    if (userDataFromStorage) {
      setUserData(JSON.parse(userDataFromStorage));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    setUserData(null);
  };

  return (
    <div className="App container">
      <Router>
        <UserProvider>
               <header>
            <NavbarComponent handleLogout={handleLogout} />
          </header>
          <main style={{ marginBottom: '100px' }}>
            <Routes>
              <Route path="/" element={userData ? <Login />:< Navigate to="/panico" /> } />
              <Route path="/login" element={<Login />} />
              <Route path="/panico" element={userData ? <Panico /> : <Navigate to="/login" />} />
              <Route path="/administracion" element={userData ? <Administracion /> : <Navigate to="/login" />} />
              <Route path="/invitados" element={userData ? <Invitados /> : <Navigate to="/login" />} />
              <Route path="/novedades" element={userData ? <Novedades /> : <Navigate to="/login" />} />
              <Route path="/alquileres" element={userData ? <Alquileres /> : <Navigate to="/login" />} />
              <Route path="/mensajeria" element={userData ? <Mensajeria /> : <Navigate to="/login" />} />
              <Route path="/campanas" element={userData ? <AdminMensajeria /> : <Navigate to="/login" />} />
              <Route path="/privacidad" element={userData ? <Privacidad /> : <Navigate to="/login" />} />
              <Route path="/contacto" element={userData ? <Contacto /> : <Navigate to="/login" />} />
              <Route path="/socios/create" element={<RegistrarSocio />} />
              <Route path="/reservas" element={userData ? <Reservas /> : <Navigate to="/login" />} />
              <Route path="/reservas/create" element={userData ? <RegistrarReserva /> : <Navigate to="/login" />} />
              <Route path="/socios/edit/:id" element={userData ? <EditarSocio /> : <Navigate to="/login" />} />
              <Route path="/reservas/edit/:id" element={userData ? <EditarReserva /> : <Navigate to="/login" />} />
              <Route path="/seguridad" element={userData ? <SeguridadDashboard /> : <Navigate to="/login" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </UserProvider>
      </Router>
    </div>
  );
};
