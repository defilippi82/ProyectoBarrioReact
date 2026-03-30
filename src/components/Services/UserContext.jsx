import React, { createContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [barrioConfig, setBarrioConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Recuperar sesión local
  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      setUserData(JSON.parse(savedUser));
    }
  }, []);

  // 2. Escuchar la configuración del Barrio y aplicar White Label
  useEffect(() => {
    if (!userData || !userData.barrioId) {
      setLoading(false);
      return;
    }

    const barrioRef = doc(db, 'configuracionBarrios', userData.barrioId);
    
    const unsubBarrio = onSnapshot(barrioRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // --- INYECCIÓN DINÁMICA DE ESTILOS ---
        const root = document.documentElement;
        if (data.colorPrincipal) {
          root.style.setProperty('--primary-color', data.colorPrincipal);
        }
        if (data.colorSecundario) {
          root.style.setProperty('--secondary-color', data.colorSecundario);
        }
        // -------------------------------------

        setBarrioConfig({
          id: snapshot.id,
          ...data,
          isStandard: data.plan === 'standard' || data.plan === 'full',
          isSeguridad: data.plan === 'seguridad' || data.plan === 'full',
          isAdminPack: data.plan === 'administrativo' || data.plan === 'full',
          isFull: data.plan === 'full',
          cupoAgotado: data.usuariosActuales >= data.limiteUsuarios
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error en configuración de barrio:", error);
      setLoading(false);
    });

    return () => unsubBarrio();
  }, [userData]);

  const logout = () => {
    localStorage.removeItem('userData');
    setUserData(null);
    setBarrioConfig(null);
    // Resetear colores al default
    const root = document.documentElement;
    root.style.setProperty('--primary-color', '#2c3e50');
    root.style.setProperty('--secondary-color', '#18bc9c');
  };

  return (
    <UserContext.Provider value={{ userData, setUserData, barrioConfig, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
};