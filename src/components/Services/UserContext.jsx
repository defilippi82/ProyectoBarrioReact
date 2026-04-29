import React, { createContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '../../firebaseConfig/firebase'; 

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [barrioConfig, setBarrioConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. ESCUCHAR AUTENTICACIÓN Y PERFIL DE USUARIO
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Importante: Usamos la colección 'usuarios' como en el resto de tu app
        const userRef = doc(db, 'usuarios', user.uid);
        
        const unsubUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Mantenemos la estructura de 'rol' que confirmaste
            setUserData({ uid: user.uid, email: user.email, ...data });
            localStorage.setItem('userData', JSON.stringify({ uid: user.uid, ...data }));
          } else {
            console.warn("Documento de usuario no encontrado en Firestore");
            setLoading(false);
          }
        }, (error) => {
          console.error("Error al leer perfil:", error);
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

  // 2. ESCUCHAR CONFIGURACIÓN DEL BARRIO (Estética y Reglas)
  useEffect(() => {
    if (!userData?.barrioId) {
      if (!userData) setLoading(false);
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
          cupoAgotado: (data.usuariosActuales || 0) >= (data.limiteUsuarios || 100)
        });

        // --- INYECCIÓN DINÁMICA DE ESTILOS CSS ---
        const root = document.documentElement;
        
        // Colores principales
        root.style.setProperty('--primary-color', data.colorPrincipal || '#2c3e50');
        root.style.setProperty('--secondary-color', data.colorSecundario || '#18bc9c');
        
        // Navbar y Fondos
        root.style.setProperty('--navbar-bg', data.colorNavbar || '#343a40');
        
        if (data.fondoUrl) {
          root.style.setProperty('--bg-image', `url(${data.fondoUrl})`);
        } else {
          // Fondo degradado por defecto si no hay imagen
          root.style.setProperty('--bg-image', 'linear-gradient(135deg, #375DDB 0%, #308CA4 50%, #F7FEFF 100%)');
        }
      }
      setLoading(false);
    }, (error) => {
      console.warn("Error al cargar configuración de barrio.");
      setLoading(false);
    });

    return () => unsubBarrio();
  }, [userData?.barrioId]); // Solo se dispara si cambia el ID del barrio

  // 3. FUNCIÓN DE CIERRE DE SESIÓN
  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userData');
      setUserData(null);
      setBarrioConfig(null);
      
      // Resetear variables CSS a valores neutros
      const root = document.documentElement;
      root.style.setProperty('--primary-color', '#2c3e50');
      root.style.setProperty('--secondary-color', '#18bc9c');
      root.style.setProperty('--navbar-bg', '#343a40');
      root.style.setProperty('--bg-image', 'linear-gradient(135deg, #375DDB 0%, #308CA4 50%, #F7FEFF 100%)');
      root.style.setProperty('--bg-footer', data.fondoUrl ? 'transparent' : 'linear-gradient(135deg, #375DDB 0%, #308CA4 50%, #F7FEFF 100%)');
      
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