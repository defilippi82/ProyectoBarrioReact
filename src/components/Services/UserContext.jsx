import React, { createContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '../../firebaseConfig/firebase';

export const UserContext = createContext();

// ─── Valores CSS por defecto (única fuente de verdad) ────────────────────────
const CSS_DEFAULTS = {
  '--primary-color':   '#2c3e50',
  '--secondary-color': '#18bc9c',
  '--navbar-bg':       '#343a40',
  '--bg-image':        'linear-gradient(135deg, #375DDB 0%, #308CA4 50%, #F7FEFF 100%)',
  '--bg-footer':       'linear-gradient(135deg, #375DDB 0%, #308CA4 50%, #F7FEFF 100%)',
};

const aplicarCSSDefaults = () => {
  const root = document.documentElement;
  Object.entries(CSS_DEFAULTS).forEach(([prop, val]) => root.style.setProperty(prop, val));
};

export const UserProvider = ({ children }) => {
  const [userData, setUserData]       = useState(null);
  const [barrioConfig, setBarrioConfig] = useState(null);
  const [loading, setLoading]         = useState(true);

  // ── 1. Autenticación + perfil de usuario ─────────────────────────────────
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = doc(db, 'usuarios', user.uid);

        const unsubUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const perfil = { uid: user.uid, email: user.email, ...data };
            setUserData(perfil);
            // FIX: setLoading(false) también cuando el documento existe
            setLoading(false);
            localStorage.setItem('userData', JSON.stringify(perfil));
          } else {
            console.warn('Documento de usuario no encontrado en Firestore');
            setLoading(false);
          }
        }, (error) => {
          console.error('Error al leer perfil:', error);
          setLoading(false);
        });

        return () => unsubUser();
      } else {
        setUserData(null);
        setBarrioConfig(null);
        localStorage.removeItem('userData');
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // ── 2. Configuración del barrio (estética + feature flags) ───────────────
  useEffect(() => {
    if (!userData?.barrioId) return;

    const barrioRef = doc(db, 'configuracionBarrios', userData.barrioId);

    const unsubBarrio = onSnapshot(barrioRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        setBarrioConfig({
          id: snapshot.id,
          ...data,
          // FIX: isAdminPack agregado — lo consumía Navbar pero nunca se calculaba
          isStandard:   data.plan === 'standard' || data.plan === 'full',
          isSeguridad:  data.plan === 'seguridad' || data.plan === 'full',
          isAdminPack:  data.plan === 'admin'     || data.plan === 'full',
          cupoAgotado:  (data.usuariosActuales || 0) >= (data.limiteUsuarios || 100),
        });

        // Inyección dinámica de estilos CSS
        const root = document.documentElement;
        root.style.setProperty('--primary-color',   data.colorPrincipal  || CSS_DEFAULTS['--primary-color']);
        root.style.setProperty('--secondary-color', data.colorSecundario || CSS_DEFAULTS['--secondary-color']);
        root.style.setProperty('--navbar-bg',       data.colorNavbar     || CSS_DEFAULTS['--navbar-bg']);
        root.style.setProperty('--bg-image',
          data.fondoUrl
            ? `url(${data.fondoUrl})`
            : CSS_DEFAULTS['--bg-image']
        );
        root.style.setProperty('--bg-footer',
          data.fondoUrl ? 'transparent' : CSS_DEFAULTS['--bg-footer']
        );
      }
      setLoading(false);
    }, (error) => {
      console.warn('Error al cargar configuración de barrio:', error);
      setLoading(false);
    });

    return () => unsubBarrio();
  }, [userData?.barrioId]);

  // ── 3. Cierre de sesión ───────────────────────────────────────────────────
  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userData');
      setUserData(null);
      setBarrioConfig(null);
      // FIX: eliminada referencia a 'data' que no existía en este scope
      aplicarCSSDefaults();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <UserContext.Provider value={{ userData, setUserData, barrioConfig, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
};