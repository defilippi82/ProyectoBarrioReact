import React, { useEffect, useState } from "react";
import { Card, Row, Col, Button, Badge } from "react-bootstrap";
import { collection, getDocs } from "firebase/firestore";
import { db } from "/src/firebaseConfig/firebase";
import "./alquileres.css";

export const ExplorarAlquileres = () => {
  const [alquileres, setAlquileres] = useState([]);
  const [detalleAbierto, setDetalleAbierto] = useState(null);
  const [contactoAbierto, setContactoAbierto] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "alquileres"));
      setAlquileres(
        snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetch();
  }, []);

  const renderDisponibilidad = (a) => {
    if (a.modoDisponibilidad === "bloqueadoPorDefecto") {
      return <Badge bg="warning">Disponible bajo consulta</Badge>;
    }

    if (a.fechasBloqueadas && a.fechasBloqueadas.length > 0) {
      return <Badge bg="secondary">Parcialmente disponible</Badge>;
    }

    return <Badge bg="success">Disponible</Badge>;
  };

  const renderRating = (a) => {
    if (!a.promedioRating || a.totalRatings === 0) {
      return <small className="text-muted">Sin calificaciones</small>;
    }

    const estrellas = "⭐".repeat(Math.round(a.promedioRating));

    return (
      <div>
        {estrellas}{" "}
        <small>
          ({a.promedioRating.toFixed(1)}) · {a.totalRatings} opiniones
        </small>
      </div>
    );
  };

  return (
    <Row className="mt-4">
      {alquileres.map(a => (
        <Col md={4} key={a.id}>
          <Card className="mb-4 shadow alquiler-card">


            <Card.Body>

              <div className="d-flex justify-content-between align-items-start">
                <Card.Title>{a.titulo}</Card.Title>
              </div>
                {renderDisponibilidad(a)}
            {/* Placeholder Imagen */}
            <div className="imagen-placeholder">
              📷 Próximamente fotos
            </div>

              <Card.Subtitle className="mb-2 text-primary">
                ${a.precio?.valor} por {a.precio?.tipo}
              </Card.Subtitle>

              {renderRating(a)}

              <p className="mt-2">
                👥 {a.capacidad} personas
              </p>

              

              {a.mascotas && (
                <Badge bg="info" className="me-1">
                  🐶 Mascotas
                </Badge>
              )}

              {/* Amenities */}
              <div className="mt-2">
                {a.amenities && (
  <div className="mt-2">
    <strong>Amenities:</strong>
    <div className="mt-1">
      {Array.isArray(a.amenities)
        ? a.amenities.map((am, i) => (
            <span key={i} className="badge bg-light text-dark me-1 mb-1">
              {am}
            </span>
          ))
        : Object.entries(a.amenities)
            .filter(([_, value]) => value)
            .map(([key]) => (
              <span key={key} className="badge bg-light text-dark me-1 mb-1">
                {key}
              </span>
            ))}
    </div>
  </div>
)}
              </div>

              {/* BOTÓN VER DETALLE */}
              <Button
                variant="outline-secondary"
                size="sm"
                className="mt-3 me-2"
                onClick={() =>
                  setDetalleAbierto(detalleAbierto === a.id ? null : a.id)
                }
              >
                Ver detalles
              </Button>

              {/* BOTÓN CONTACTO */}
              <Button
                variant="outline-primary"
                size="sm"
                className="mt-3"
                onClick={() =>
                  setContactoAbierto(contactoAbierto === a.id ? null : a.id)
                }
              >
                Ver contacto
              </Button>

              {/* DESCRIPCIÓN DESPLEGABLE */}
              {detalleAbierto === a.id && (
                <div className="mt-3 border-top pt-2 fade-in">
                  <strong>Descripción:</strong>
                  <p className="mb-0">{a.descripcion}</p>
                </div>
              )}

              {/* CONTACTO DESPLEGABLE */}
              {contactoAbierto === a.id && (
                <div className="mt-3 border-top pt-2 fade-in">
                  <strong>Propietario:</strong>
                  <p className="mb-1">
                    📍 Isla {a.isla}
                  </p>
                  <p className="mb-1">
                    🏠 {a.manzana}-{a.lote}
                  </p>
                  <p className="mb-1">
                    📞 {a.contacto?.telefono || "No informado"}
                  </p>
                  <p className="mb-0">
                    ✉️ {a.contacto?.email || "No informado"}
                  </p>
                </div>
              )}

            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};