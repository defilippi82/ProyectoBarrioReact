import React, { useState, useContext } from "react";
import { Form, Button, Card, Row, Col, Spinner, InputGroup } from "react-bootstrap";
import { addDoc, collection } from "firebase/firestore";
import { db } from "/src/firebaseConfig/firebase";
import { UserContext } from "./UserContext";

export const CrearAlquiler = () => {
  const { userData } = useContext(UserContext);
  const [loadingImg, setLoadingImg] = useState(false);
  const [imagenes, setImagenes] = useState([]);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    valor: "",
    moneda: "ARS",
    tipoPrecio: "dia",
    capacidad: "",
    mascotas: false,
    amenities: ["Pileta", "Playroom", "Jacuzzi", "Internet", "Cable", "Parrilla", "Cama Elástica"],
    amenitiesSeleccionadas: [],
    modoDisponibilidad: "disponiblePorDefecto"
  });

  const handleUploadImages = async (e) => {
    const files = Array.from(e.target.files);
    if (imagenes.length + files.length > 4) {
      alert("Solo puedes subir un máximo de 4 fotos.");
      return;
    }

    setLoadingImg(true);
    const uploadedUrls = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_cube");

      try {
        const res = await fetch("https://api.cloudinary.com/v1_1/cubealquiler/image/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.secure_url) uploadedUrls.push(data.secure_url);
      } catch (error) {
        console.error("Error subiendo imagen:", error);
      }
    }

    setImagenes(prev => [...prev, ...uploadedUrls]);
    setLoadingImg(false);
  };

  const handleCrear = async () => {
    if (!userData) return alert("Debes estar logueado para publicar.");
    if (!form.titulo || !form.valor) return alert("Por favor, completa el título y el valor.");

    try {
      const nuevoAviso = {
        propietarioId: userData.id,
        propietarioNombre: userData.nombre,
        isla: userData.isla,
        manzana: userData.manzana,
        lote: userData.lote,
        titulo: form.titulo,
        descripcion: form.descripcion,
        imagenes: imagenes,
        precio: { valor: Number(form.valor), moneda: form.moneda, tipo: form.tipoPrecio },
        capacidad: Number(form.capacidad),
        mascotas: form.mascotas,
        contacto: { 
          email: userData.email || "", 
          telefono: userData.numerotelefono || "No especificado" 
        },
        amenities: form.amenitiesSeleccionadas,
        estado: "disponible",
        modoDisponibilidad: form.modoDisponibilidad,
        fechas: [],
        createdAt: new Date()
      };

      await addDoc(collection(db, "alquileres"), nuevoAviso);
      alert("¡Aviso publicado con éxito!");
      window.location.reload();
    } catch (error) {
      console.error("Error al crear publicación:", error);
    }
  };

  const toggleAmenity = (amenity) => {
    setForm(prev => ({
      ...prev,
      amenitiesSeleccionadas: prev.amenitiesSeleccionadas.includes(amenity)
        ? prev.amenitiesSeleccionadas.filter(a => a !== amenity)
        : [...prev.amenitiesSeleccionadas, amenity]
    }));
  };

  return (
    <Card className="p-3 p-md-4 mt-4 shadow-sm border-0">
      <h4 className="text-center mb-4">Publicar Alquiler</h4>

      {/* SECCIÓN FOTOS */}
      <h6 className="text-muted text-uppercase small fw-bold">Fotos ({imagenes.length}/4)</h6>
      <div className="mb-4 p-3 border rounded bg-light">
        <Row className="g-2 mb-2">
          {imagenes.map((url, i) => (
            <Col xs={3} key={i}>
              <div className="position-relative">
                <img src={url} className="img-thumbnail w-100" style={{ height: "60px", objectFit: "cover" }} alt="preview" />
                <button 
                  className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0" 
                  style={{ width: "20px", height: "20px", fontSize: "12px" }}
                  onClick={() => setImagenes(imagenes.filter((_, index) => index !== i))}
                >
                  ×
                </button>
              </div>
            </Col>
          ))}
        </Row>
        {imagenes.length < 4 && (
          <Form.Control type="file" size="sm" multiple accept="image/*" onChange={handleUploadImages} disabled={loadingImg} />
        )}
        {loadingImg && <Spinner animation="border" size="sm" className="mt-2" />}
      </div>

      {/* DATOS GENERALES */}
      <h6 className="text-muted text-uppercase small fw-bold">Información del Aviso</h6>
      <Form.Group className="mb-3">
        <Form.Control placeholder="Título del aviso (ej: Casa con pileta y parque)" 
          onChange={e => setForm({...form, titulo: e.target.value})} />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Control as="textarea" rows={3} placeholder="Descripción detallada..." 
          onChange={e => setForm({...form, descripcion: e.target.value})} />
      </Form.Group>

      <Row className="g-2 mb-3">
        <Col xs={12} md={6}>
          <InputGroup>
            <InputGroup.Text>{form.moneda === "ARS" ? "$" : "U$S"}</InputGroup.Text>
            <Form.Control type="number" placeholder="Valor" onChange={e => setForm({...form, valor: e.target.value})} />
            <Form.Select style={{ maxWidth: "100px" }} onChange={e => setForm({...form, moneda: e.target.value})}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </Form.Select>
          </InputGroup>
        </Col>
        <Col xs={12} md={6}>
          <Form.Select onChange={e => setForm({...form, tipoPrecio: e.target.value})}>
            <option value="dia">Por Día</option>
            <option value="noche">Por Noche</option>
            <option value="semana">Por Semana</option>
          </Form.Select>
        </Col>
      </Row>

      <Row className="g-2 mb-3">
        <Col xs={6}>
          <Form.Control type="number" placeholder="Capacidad (pers.)" onChange={e => setForm({...form, capacidad: e.target.value})} />
        </Col>
        <Col xs={6} className="d-flex align-items-center justify-content-center border rounded">
          <Form.Check label="Acepta Mascotas" checked={form.mascotas} onChange={e => setForm({...form, mascotas: e.target.checked})} />
        </Col>
      </Row>

      {/* AMENITIES */}
      <h6 className="text-muted text-uppercase small fw-bold mt-2">Amenities</h6>
      <Row className="mb-4 g-1">
        {form.amenities.map((am, i) => (
          <Col xs={6} md={4} key={i}>
            <div className={`p-2 border rounded d-flex align-items-center h-100 ${form.amenitiesSeleccionadas.includes(am) ? 'bg-primary text-white' : 'bg-white'}`}
                 onClick={() => toggleAmenity(am)} style={{ cursor: 'pointer', transition: '0.2s' }}>
              <Form.Check type="checkbox" checked={form.amenitiesSeleccionadas.includes(am)} readOnly className="me-2" />
              <span style={{ fontSize: '0.85rem' }}>{am}</span>
            </div>
          </Col>
        ))}
      </Row>

      <div className="alert alert-info py-2 mb-4" style={{ fontSize: '0.85rem' }}>
        📢 <strong>Info:</strong> Se publicará con tu teléfono (<strong>{userData?.numerotelefono}</strong>) e ubicación de <strong>Isla {userData?.isla}</strong> automáticamente.
      </div>

      <Button variant="primary" className="w-100 py-2 fw-bold text-no-wrap" style={{ fontSize: "0.9rem" }} onClick={handleCrear} disabled={loadingImg}>
        {loadingImg ? "Subiendo fotos..." : "PUBLICAR"}
      </Button>
    </Card>
  );
};