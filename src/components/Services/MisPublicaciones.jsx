import React, { useEffect, useState, useContext } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "/src/firebaseConfig/firebase";
import { UserContext } from "./UserContext";
import { Card } from "react-bootstrap";

export const MisPublicaciones = () => {
  const { userData } = useContext(UserContext);
  const [mis, setMis] = useState([]);

  useEffect(() => {
    if (!userData) return;

    const fetch = async () => {
      const q = query(
        collection(db, "alquileres"),
        where("propietarioId", "==", userData.uid)
      );

      const snap = await getDocs(q);
      setMis(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetch();
  }, [userData]);

  return (
    <>
      {mis.map(a => (
        <Card key={a.id} className="mt-3 p-3">
          <h5>{a.titulo}</h5>
          Estado: {a.estado}
        </Card>
      ))}
    </>
  );
};