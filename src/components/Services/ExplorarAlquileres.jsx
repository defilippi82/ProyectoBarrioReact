import React, { useEffect, useState, useContext } from "react"; // 1. Agregamos useContext
import { Card, Row, Col, Button, Badge, Carousel, Spinner } from "react-bootstrap";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "/src/firebaseConfig/firebase";
import { UserContext } from "../Services/UserContext"; // 2. Importamos el Contexto
import { formatPrecio, getOptimizedImage } from "/src/utils/formatters";
import "../Socios/alquileres.css";

export const ExplorarAlquileres = () => {
  // 3. Extraemos userData del contexto
  const { userData } = useContext(UserContext); 
  
  const [alquileres, setAlquileres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalleAbierto, setDetalleAbierto] = useState(null);
  const [contactoAbierto, setContactoAbierto] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      // 4. Ahora userData ya existe y podemos preguntar por el barrioId
      if (!userData?.barrioId) return; 

      try {
        const q = query(
          collection(db, "alquileres"), 
          where("barrioId", "==", userData.barrioId)
        );

        const snap = await getDocs(q);
        setAlquileres(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error al cargar alquileres:", error);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [userData?.barrioId]); // Se ejecutará cuando el ID del barrio esté disponible

  const renderImagen = (a) => {
    // Normalizamos las imágenes: si es vieja usa 'imagen', si es nueva usa el array 'imagenes'
    const fotos = a.imagenes || (a.imagen ? [a.imagen] : []);
    
    if (fotos.length === 0) {
      return (
        <div className="imagen-placeholder" style={{ height: "220px" }}>
          <span>📷 Sin fotos</span>
        </div>
      );
    }

    return (
      <Carousel interval={null} indicators={fotos.length > 1} controls={fotos.length > 1}>
        {fotos.map((url, idx) => (
          <Carousel.Item key={idx}>
            <img
              className="d-block w-100"
              // 2. OPTIMIZAMOS LA IMAGEN PARA WEB (600px de ancho)
              src={getOptimizedImage(url, 600)}
              alt={`Foto ${idx + 1}`}
              style={{ height: "220px", objectFit: "cover" }}
            />
          </Carousel.Item>
        ))}
      </Carousel>
    );
  };

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    /* mx-n3 en mobile quita el margen del Row para pegar las cards al borde */
    <Row className="mt-4 mx-n3 mx-md-0">
      {alquileres.map(a => (
        <Col md={4} key={a.id} className="mb-4 px-0 px-md-2">
          {/* rounded-0 en mobile para look más moderno y fluido */}
          <Card className="alquiler-card h-100 border-0 shadow-sm rounded-0 rounded-md-3">
            {renderImagen(a)}
            
            <Card.Body>
              <Card.Title className="h5 mb-1">{a.titulo}</Card.Title>
              <Card.Subtitle className="mb-2 text-primary fw-bold">
                {/* 3. USAMOS EL FORMATEADOR LIMPIO */}
                {formatPrecio(a.precio)}
              </Card.Subtitle>
              
              <div className="small text-muted mb-3">
                <span>👥 {a.capacidad} pers.</span>
                {a.mascotas && <span className="ms-2">· 🐶 Mascotas</span>}
              </div>

              <div className="d-flex gap-2">
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  className="flex-grow-1" 
                  onClick={() => setDetalleAbierto(detalleAbierto === a.id ? null : a.id)}
                >
                  {detalleAbierto === a.id ? "Cerrar" : "Detalles"}
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="flex-grow-1" 
                  onClick={() => setContactoAbierto(contactoAbierto === a.id ? null : a.id)}
                >
                  {contactoAbierto === a.id ? "Ocultar" : "Contacto"}
                </Button>
              </div>

              {/* DESPLEGABLE DETALLES */}
              {detalleAbierto === a.id && (
                <div className="mt-3 border-top pt-2 fade-in">
                  <p className="small mb-2 text-secondary">{a.descripcion}</p>
                  <div className="d-flex flex-wrap gap-1">
                    {a.amenities?.map((am, i) => (
                      <Badge key={i} bg="light" text="dark" className="border fw-normal">{am}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* DESPLEGABLE CONTACTO */}
              {contactoAbierto === a.id && (
                <div className="mt-3 border-top pt-2 fade-in bg-light p-2 rounded">
                  <p className="mb-1 small"><strong>📍 Isla:</strong> {a.isla}</p>
                  <p className="mb-1 small"><strong>🏠 Ubicación:</strong> {a.manzana}-{a.lote}</p>
                  <p className="mb-0 small"><strong>📞 Tel:</strong> {a.contacto?.telefono}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};