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
  // Verificación estricta: si no hay usuario o no hay ID de barrio, no pidas nada a Firebase
  if (!userData || !userData.barrioId) {
    setLoading(false);
    return;
  }

  const barrioRef = doc(db, 'configuracionBarrios', userData.barrioId);
  
  const unsubBarrio = onSnapshot(barrioRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      setBarrioConfig({
        id: snapshot.id,
        ...data,
        isStandard: data.plan === 'standard' || data.plan === 'full',
        isSeguridad: data.plan === 'seguridad' || data.plan === 'full',
        cupoAgotado: data.usuariosActuales >= data.limiteUsuarios
      });
    }
    setLoading(false);
  }, (error) => {
    // Esto atrapa el error de Firebase sin romper la App
    console.warn("Esperando permisos de Firebase o barrio no encontrado...");
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