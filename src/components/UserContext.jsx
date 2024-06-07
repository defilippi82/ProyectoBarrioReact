import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebaseConfig/firebase";  // Asegúrate de que esta importación sea correcta
import { onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
  
      if (currentUser) {
        const db = getFirestore();
        const userDocRef = doc(db, "usuarios", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
  
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserData(userData);
        } else {
          console.log("No se encontraron datos del usuario en Firestore");
        }
      } else {
        setUserData(null);
      }
    });
  
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{user, userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};