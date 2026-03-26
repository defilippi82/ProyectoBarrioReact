import React, { createContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [barrioConfig, setBarrioConfig] = useState(null); // Nuevo: Configuración del barrio
  const [loading, setLoading] = useState(true);

  // 1. Efecto inicial para recuperar la sesión del usuario
  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      setUserData(JSON.parse(savedUser));
    }
  }, []);

  // 2. Efecto para escuchar la configuración del Barrio (Packs y Límites)
  // Se dispara cada vez que userData cambia o se loguea
  useEffect(() => {
    if (!userData || !userData.barrioId) {
      setLoading(false);
      return;
    }

    // Escuchamos el documento del barrio en tiempo real
    const barrioRef = doc(db, 'configuracionBarrios', userData.barrioId);
    
    const unsubBarrio = onSnapshot(barrioRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBarrioConfig({
          id: snapshot.id,
          ...data,
          // Lógica booleana para facilitar el uso en el Navbar
          isStandard: data.plan === 'standard' || data.plan === 'full',
          isSeguridad: data.plan === 'seguridad' || data.plan === 'full',
          isAdminPack: data.plan === 'administrativo' || data.plan === 'full',
          isFull: data.plan === 'full',
          cupoAgotado: data.usuariosActuales >= data.limiteUsuarios
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener config del barrio:", error);
      setLoading(false);
    });

    return () => unsubBarrio();
  }, [userData]);

  // Función para cerrar sesión y limpiar todo
  const logout = () => {
    localStorage.removeItem('userData');
    setUserData(null);
    setBarrioConfig(null);
  };

  return (
    <UserContext.Provider value={{ 
      userData, 
      setUserData, 
      barrioConfig, 
      loading, 
      logout 
    }}>
      {children}
    </UserContext.Provider>
  );
};