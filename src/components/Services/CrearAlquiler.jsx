import React, { useState, useContext } from "react";
import { Form, Button, Card, Row, Col, Spinner, InputGroup } from "react-bootstrap";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig/firebase";
import { UserContext } from "./UserContext";

export const CrearAlquiler = () => {
  const { userData } = useContext(UserContext);
  // Extraemos etiquetas dinámicas del contexto, con valores por defecto
  const etiquetas = userData?.etiquetas || { bloque: 'Manzana', unidad: 'Lote', distribucion: 'Isla' };
  
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
      alert("Máximo 4 fotos.");
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
          method: "POST", body: formData,
        });
        const data = await res.json();
        if (data.secure_url) uploadedUrls.push(data.secure_url);
      } catch (error) { console.error("Error:", error); }
    }
    setImagenes(prev => [...prev, ...uploadedUrls]);
    setLoadingImg(false);
  };

  const handleCrear = async () => {
    if (!userData) return alert("Debes estar logueado.");
    if (!form.titulo || !form.valor) return alert("Completa título y valor.");

    try {
      const nuevoAviso = {
        propietarioId: userData.uid || userData.id,
        propietarioNombre: userData.nombre,
        barrioId: userData.barrioId, // CRÍTICO: Mantiene el aislamiento multibarrio
        ubicacion: {
          [etiquetas.distribucion]: userData.isla,
          [etiquetas.bloque]: userData.manzana,
          [etiquetas.unidad]: userData.lote
        },
        titulo: form.titulo,
        descripcion: form.descripcion,
        imagenes: imagenes,
        precio: { valor: Number(form.valor), moneda: form.moneda, tipo: form.tipoPrecio },
        capacidad: Number(form.capacidad),
        mascotas: form.mascotas,
        contacto: { 
          email: userData.email || "", 
          telefono: userData.numerotelefono || "" 
        },
        amenities: form.amenitiesSeleccionadas,
        estado: "disponible",
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "alquileres"), nuevoAviso);
      alert("¡Publicado!");
      window.location.reload();
    } catch (error) { console.error(error); }
  };

  return (
    <Card className="p-3 p-md-4 mt-4 shadow-sm border-0">
      <h4 className="text-center mb-4">Publicar Alquiler</h4>
      
      {/* ... (Sección Fotos igual al original) ... */}

      <h6 className="text-muted text-uppercase small fw-bold mt-4">Información del Aviso</h6>
      <Form.Group className="mb-3"><Form.Control placeholder="Título" onChange={e => setForm({...form, titulo: e.target.value})} /></Form.Group>
      <Form.Group className="mb-3"><Form.Control as="textarea" rows={3} placeholder="Descripción" onChange={e => setForm({...form, descripcion: e.target.value})} /></Form.Group>

      {/* Inputs de Precio dinámicos según tipo */}
      <Row className="g-2 mb-3">
        <Col xs={12} md={6}>
          <InputGroup>
            <InputGroup.Text>{form.moneda === "ARS" ? "$" : "U$S"}</InputGroup.Text>
            <Form.Control type="number" placeholder="Valor" onChange={e => setForm({...form, valor: e.target.value})} />
          </InputGroup>
        </Col>
        <Col xs={12} md={6}>
            <Form.Select onChange={e => setForm({...form, moneda: e.target.value})}>
                <option value="ARS">ARS</option><option value="USD">USD</option>
            </Form.Select>
        </Col>
      </Row>

      <div className="alert alert-info py-2 mb-4" style={{ fontSize: '0.85rem' }}>
        📢 Publicarás con tus datos de contacto registrados y la ubicación: 
        <strong> {etiquetas.distribucion} {userData?.isla} | {etiquetas.bloque} {userData?.manzana}</strong>.
      </div>

      <Button variant="primary" className="w-100 py-2 fw-bold" onClick={handleCrear} disabled={loadingImg}>
        PUBLICAR
      </Button>
    </Card>
  );
};