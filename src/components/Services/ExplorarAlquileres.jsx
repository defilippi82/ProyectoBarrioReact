import React, { useEffect, useState } from "react";
import { Card, Row, Col, Button, Badge, Carousel } from "react-bootstrap";
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
      setAlquileres(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetch();
  }, []);

  const renderImagen = (a) => {
    const imagenes = a.imagenes || (a.imagen ? [a.imagen] : []);
    
    if (imagenes.length === 0) {
      return <div className="imagen-placeholder" style={{ height: "220px" }}><span>Sin fotos</span></div>;
    }

    if (imagenes.length === 1) {
      return <Card.Img variant="top" src={imagenes[0].replace('/upload/', '/upload/w_600,f_auto,q_auto/')} style={{ height: "220px", objectFit: "cover" }} />;
    }

    return (
      <Carousel interval={null} indicators={true}>
        {imagenes.map((url, idx) => (
          <Carousel.Item key={idx}>
            <img
              className="d-block w-100"
              src={url.replace('/upload/', '/upload/w_600,f_auto,q_auto/')}
              alt={`Foto ${idx + 1}`}
              style={{ height: "220px", objectFit: "cover" }}
            />
          </Carousel.Item>
        ))}
      </Carousel>
    );
  };

  return (
    <Row className="mt-4">
      {alquileres.map(a => (
        <Col md={4} key={a.id} className="mb-4">
          <Card className="alquiler-card h-100 shadow-sm">
            {renderImagen(a)}
            <Card.Body>
              <Card.Title>{a.titulo}</Card.Title>
              <Card.Subtitle className="mb-2 text-primary">
                {a.precio?.moneda === "USD" ? "U$S" : "$"}{a.precio?.valor} <small className="text-muted">/{a.precio?.tipo}</small>
              </Card.Subtitle>
              
              <p className="small mb-1">👥 Capacidad: {a.capacidad} pers. {a.mascotas && "· 🐶 Aptos"}</p>

              <div className="d-flex gap-2 mt-3">
                <Button variant="outline-secondary" size="sm" className="w-100" onClick={() => setDetalleAbierto(detalleAbierto === a.id ? null : a.id)}>Detalles</Button>
                <Button variant="outline-primary" size="sm" className="w-100" onClick={() => setContactoAbierto(contactoAbierto === a.id ? null : a.id)}>Contacto</Button>
              </div>

              {detalleAbierto === a.id && (
                <div className="mt-3 border-top pt-2 fade-in">
                  <p className="small mb-2">{a.descripcion}</p>
                  <div className="d-flex flex-wrap gap-1">
                    {a.amenities?.map((am, i) => <Badge key={i} bg="light" text="dark" border="true" className="border">{am}</Badge>)}
                  </div>
                </div>
              )}

              {contactoAbierto === a.id && (
                <div className="mt-3 border-top pt-2 fade-in bg-light p-2 rounded">
                  <p className="mb-0 small"><strong>📍 Isla {a.isla}</strong> ({a.manzana}-{a.lote})</p>
                  <p className="mb-0 small">📞 {a.contacto?.telefono}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};