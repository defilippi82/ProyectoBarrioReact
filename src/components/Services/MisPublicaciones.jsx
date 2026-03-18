import React, { useEffect, useState, useContext } from "react";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "/src/firebaseConfig/firebase";
import { UserContext } from "./UserContext";
import { Card, Button, Badge, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./alquileres.css"; // Importamos los estilos para usar el placeholder

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

  // Función para optimizar la URL de Cloudinary
  const optimizarImagen = (url) => {
    if (!url) return null;
    // Redimensionamos a 400px de ancho y aplicamos optimización de formato y calidad automática
    return url.replace('/upload/', '/upload/w_400,c_fill,f_auto,q_auto/');
  };

  return (
    <Row className="mt-4">
      {mis.map(a => (
        <Col md={6} key={a.id} className="mb-4">
          <Card className="alquiler-card shadow-sm h-100">
            {/* Renderizado de Imagen o Placeholder */}
            {a.imagen ? (
              <Card.Img
                variant="top"
                src={optimizarImagen(a.imagen)}
                alt={a.titulo}
                style={{ height: "160px", objectFit: "cover" }}
              />
            ) : (
              <div className="imagen-placeholder" style={{ height: "160px" }}>
                <span>Sin foto</span>
              </div>
            )}

            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Card.Title className="mb-0 text-truncate" style={{ maxWidth: '70%' }}>
                  {a.titulo}
                </Card.Title>

                <Badge bg={a.estado === "pausado" ? "secondary" : "success"}>
                  {a.estado}
                </Badge>
              </div>

              <p className="mb-1">
                <strong className="text-primary">
                  {a.precio.moneda === "USD" ? "U$S" : "$"}
                  {a.precio.valor}
                </strong>{" "}
                <span className="text-muted small">por {a.precio.tipo}</span>
              </p>

              <p className="mb-1 small text-muted">
                <i className="bi bi-people me-1"></i> {a.capacidad} personas
              </p>

              <div className="d-flex gap-2 mt-3">
                <Button
                  variant="outline-primary"
                  className="w-100"
                  size="sm"
                  onClick={() => navigate(`/editar-publicacion/${a.id}`)}
                >
                  Editar
                </Button>

                <Button
                  variant="outline-danger"
                  className="w-100"
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