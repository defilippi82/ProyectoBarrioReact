import React, { createContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '../../firebaseConfig/firebase'; // Asegúrate de que la ruta sea correcta

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [barrioConfig, setBarrioConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Escuchar el estado de autenticación real de Firebase
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // El usuario está logueado en Firebase Auth, buscamos su perfil en Firestore
        const userRef = doc(db, 'users', user.uid);
        
        const unsubUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({ uid: user.uid, email: user.email, ...data });
            // Guardamos un backup en localStorage por si acaso
            localStorage.setItem('userData', JSON.stringify({ uid: user.uid, ...data }));
          } else {
            console.warn("No se encontró el documento del usuario en Firestore");
            setLoading(false);
          }
        }, (error) => {
          console.error("Error de permisos en colección 'users':", error);
          setLoading(false);
        });

        return () => unsubUser();
      } else {
        // No hay usuario logueado
        setUserData(null);
        setBarrioConfig(null);
        localStorage.removeItem('userData');
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Escuchar la configuración del Barrio (White Label)
  useEffect(() => {
    // Solo pedimos el barrio si tenemos un userData con barrioId
    if (!userData || !userData.barrioId) {
      if (!userData) setLoading(false); 
      return;
    }

    const barrioRef = doc(db, 'configuracionBarrios', userData.barrioId);
    
    const unsubBarrio = onSnapshot(barrioRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Seteamos la configuración extendida
        setBarrioConfig({
          id: snapshot.id,
          ...data,
          isStandard: data.plan === 'standard' || data.plan === 'full',
          isSeguridad: data.plan === 'seguridad' || data.plan === 'full',
          cupoAgotado: (data.usuariosActuales || 0) >= (data.limiteUsuarios || 100)
        });

        // Aplicamos los colores dinámicos al CSS global
        const root = document.documentElement;
        root.style.setProperty('--primary-color', data.colorPrincipal || '#2c3e50');
        root.style.setProperty('--secondary-color', data.colorSecundario || '#18bc9c');
      }
      setLoading(false);
    }, (error) => {
      console.warn("Falta de permisos para leer barrio o ID inexistente.");
      setLoading(false);
    });

    return () => unsubBarrio();
  }, [userData]);

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userData');
      setUserData(null);
      setBarrioConfig(null);
      
      // Resetear colores al default
      const root = document.documentElement;
      root.style.setProperty('--primary-color', '#2c3e50');
      root.style.setProperty('--secondary-color', '#18bc9c');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <UserContext.Provider value={{ userData, setUserData, barrioConfig, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
};