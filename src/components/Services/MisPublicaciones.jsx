import React, { useEffect, useState, useContext } from "react";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "/src/firebaseConfig/firebase";
import { UserContext } from "./UserContext";
import { Card, Button, Badge, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export const MisPublicaciones = () => {
  const { userData } = useContext(UserContext);
  const [mis, setMis] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData) return;

    const fetch = async () => {
      const q = query(
        collection(db, "alquileres"),
        where("propietarioId", "==", userData.id)
      );

      const snap = await getDocs(q);
      setMis(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetch();
  }, [userData]);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta publicación?")) return;

    await deleteDoc(doc(db, "alquileres", id));
    setMis(prev => prev.filter(a => a.id !== id));
  };

  if (!mis.length) {
    return <p className="mt-4 text-center">No tienes publicaciones aún</p>;
  }

  return (
    <Row className="mt-4">
      {mis.map(a => (
        <Col md={6} key={a.id} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Body>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <Card.Title>{a.titulo}</Card.Title>

                <Badge bg={a.estado === "pausado" ? "secondary" : "success"}>
                  {a.estado}
                </Badge>
              </div>

              <p className="mb-1">
                <strong>
                  {a.precio.moneda === "USD" ? "U$S" : "$"}
                  {a.precio.valor}
                </strong>{" "}
                por {a.precio.tipo}
              </p>

              <p className="mb-1">{a.capacidad} personas</p>

              <div className="d-flex gap-2 mt-3">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => navigate(`/editar-publicacion/${a.id}`)}
                >
                  Editar
                </Button>

                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(a.id)}
                >
                  Eliminar
                </Button>
              </div>

            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};