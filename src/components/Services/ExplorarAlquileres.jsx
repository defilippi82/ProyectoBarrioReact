import React, { useEffect, useState } from "react";
import { Card, Row, Col } from "react-bootstrap";
import { collection, getDocs } from "firebase/firestore";
import { db } from "/src/firebaseConfig/firebase";

export const ExplorarAlquileres = () => {
  const [alquileres, setAlquileres] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "alquileres"));
      setAlquileres(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetch();
  }, []);

  return (
    <Row className="mt-3">
      {alquileres.map(a => (
        <Col md={4} key={a.id}>
          <Card className="mb-3 shadow-sm">
            <Card.Body>
              <Card.Title>{a.titulo}</Card.Title>
              <Card.Subtitle>
                ${a.precio.valor} por {a.precio.tipo}
              </Card.Subtitle>

              <p>{a.capacidad} personas</p>
              <p>
                Isla {a.isla} - Mz {a.manzana} - Lote {a.lote}
              </p>

              {a.mascotas && <p>🐶 Acepta mascotas</p>}
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};