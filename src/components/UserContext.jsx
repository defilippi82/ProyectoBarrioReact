import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebaseConfig/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [user, setUser] = useState(null);


  return (
    <UserContext.Provider value={{ user, userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};