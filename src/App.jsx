import React, { useEffect, useContext, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getToken, onMessage } from "firebase/messaging";
import { messaging, auth } from './firebaseConfig/firebase.js'; 
import { getFirestore, doc, setDoc } from "firebase/firestore";

// --- LIBRERÍA DE TUTORIAL ---
import Joyride, { STATUS } from 'react-joyride';

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

const AppContent = () => {
  const { userData, setUserData, loading } = useContext(UserContext);
  
  // --- ESTADO Y PASOS DEL TUTORIAL ---
  const [runTutorial, setRunTutorial] = useState(false);

  const [steps] = useState([
  {
    target: '.navbar', // Clase CSS del elemento
    content: 'Bienvenido a CUBE. Esta es tu barra principal.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.titulo-novedades', // Clase de la pestaña Novedades
    content: 'Aquí verás los anuncios importantes del barrio.',
  },
  {
      target: '.btn-agregar-novedad', // La clase del botón verde
      content: 'Usa este botón para publicar una nueva noticia o contacto.',
    },
  {
    target: 'a[href*="mensajeria"]', // Clase de la pestaña Teléfonos
    content: 'En esta sección puedes enviar mensajes a sus vecinos del barrio.',
  },
  {
    target: 'a[href*="alquileres"]', // Clase de la pestaña Teléfonos
    content: 'En esta sección puedes crear avisos para alquileres en el barrio.',
  },
  {
    target: 'a[href*="invitados"]', // Clase de la pestaña Teléfonos
    content: 'En esta sección puedes enviar invitaciones o crear listas para luego autorizar el ingreso a sus invitados.',
  },
  {
    target: 'a[href*="panico"]', // Clase de la pestaña Teléfonos
    content: 'En esta sección puedes enviar Alertas de ayuda por emergencias a vecinos y/o guardia(todavia sin habilitar).',
  },
  {
    target: '.btn-guia-ayuda', // Clase que pusimos en el Navbar
    content: 'Usa este botón si quieres repetir esta guía más tarde.',
  }
]);

  // Lógica para mostrar el tutorial la primera vez
  useEffect(() => {
    const hasSeen = localStorage.getItem('cube_tutorial_visto');
    if (!hasSeen && userData) {
      setRunTutorial(true);
    }
  }, [userData]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem('cube_tutorial_visto', 'true');
      setRunTutorial(false);
    }
  };

  // --- LÓGICA DE FIREBASE MESSAGING ---
  const guardarTokenEnBaseDeDatos = async (token) => {
    const db = getFirestore();
    const usuario = auth.currentUser;
    if (usuario) {
      const usuarioRef = doc(db, 'usuarios', usuario.uid);
      try {
        await setDoc(usuarioRef, { fcmToken: token }, { merge: true });
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
    if (userData) {
      solicitarPermiso();
      const unsubscribe = onMessage(messaging, (payload) => {
        alert(payload.notification.body);
      });
      return () => unsubscribe();
    }
  }, [userData]);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    setUserData(null);
  };

  if (loading) return null;

  return (
    <div className="App container">
      {/* COMPONENTE JOYRIDE PARA EL TUTORIAL */}
      <Joyride
        steps={steps}
        run={runTutorial}
        continuous={true}
        showSkipButton={true}
        showProgress={true}
        callback={handleJoyrideCallback}
        locale={{
          back: 'Atrás',
          close: 'Cerrar',
          last: 'Finalizar',
          next: 'Siguiente',
          skip: 'Saltar guía'
        }}
        styles={{
          options: {
            primaryColor: '#0d6efd',
            zIndex: 10000,
          }
        }}
      />

      {/* Navbar con la función para reiniciar el tutorial */}
      <NavbarComponent 
        handleLogout={handleLogout} 
        startTutorial={() => setRunTutorial(true)} 
      />

      <main style={{ marginBottom: '100px', marginTop: '80px' }}>
        <Routes>
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
          
          <Route path="/socios/create" element={<RegistrarSocio />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export const App = () => {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
};