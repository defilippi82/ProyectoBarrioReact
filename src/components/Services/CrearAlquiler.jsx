import React, { useState, useContext } from "react";
import { Form, Button, Card, Row, Col, Spinner } from "react-bootstrap";
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
      alert("Máximo 4 fotos permitidas.");
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
        uploadedUrls.push(data.secure_url);
      } catch (error) {
        console.error("Error en Cloudinary:", error);
      }
    }

    setImagenes(prev => [...prev, ...uploadedUrls]);
    setLoadingImg(false);
  };

  const handleCrear = async () => {
    if (!userData) return alert("Error: No se detectó usuario");
    
    try {
      const nuevo = {
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
        // TOMA EL TELÉFONO AUTOMÁTICAMENTE DE USERDATA
        contacto: { 
          email: userData.email || "", 
          telefono: userData.numerotelefono || "No informado" 
        },
        amenities: form.amenitiesSeleccionadas,
        estado: "disponible",
        modoDisponibilidad: form.modoDisponibilidad,
        fechas: [],
        createdAt: new Date()
      };

      await addDoc(collection(db, "alquileres"), nuevo);
      alert("Publicación creada con éxito");
      window.location.reload(); 
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  return (
    <Card className="p-4 mt-4 shadow-sm">
      <h3 className="mb-4 text-center">Nueva Publicación</h3>

      <h5 className="border-bottom pb-1">Fotos ({imagenes.length}/4)</h5>
      <Form.Group className="mb-4">
        <Row className="mb-2 g-2">
          {imagenes.map((url, i) => (
            <Col xs={3} key={i}><img src={url} className="img-thumbnail" style={{height:'80px', width:'100%', objectFit:'cover'}} /></Col>
          ))}
        </Row>
        {imagenes.length < 4 && (
          <Form.Control type="file" multiple onChange={handleUploadImages} disabled={loadingImg} />
        )}
      </Form.Group>

      <h5 className="border-bottom pb-1">Detalles del Aviso</h5>
      <Form.Control placeholder="Título" className="mb-3" onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
      <Form.Control as="textarea" rows={3} placeholder="Descripción" className="mb-3" onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />

      <Row className="mb-3">
        <Col md={4}><Form.Control type="number" placeholder="Precio" onChange={(e) => setForm({ ...form, valor: e.target.value })} /></Col>
        <Col md={4}>
          <Form.Select onChange={(e) => setForm({ ...form, moneda: e.target.value })}>
            <option value="ARS">ARS ($)</option>
            <option value="USD">USD (U$S)</option>
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select onChange={(e) => setForm({ ...form, tipoPrecio: e.target.value })}>
            <option value="dia">Por Día</option>
            <option value="noche">Por Noche</option>
          </Form.Select>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}><Form.Control type="number" placeholder="Capacidad" onChange={(e) => setForm({ ...form, capacidad: e.target.value })} /></Col>
        <Col md={6} className="d-flex align-items-center">
          <Form.Check label="Acepta Mascotas" onChange={(e) => setForm({ ...form, mascotas: e.target.checked })} />
        </Col>
      </Row>

      <div className="bg-light p-2 rounded mb-4 small text-muted">
        El contacto se mostrará como: <strong>{userData?.numerotelefono || "Sin teléfono"}</strong> (Isla {userData?.isla})
      </div>

      <Button className="w-100" onClick={handleCrear} disabled={loadingImg}>
        {loadingImg ? "Subiendo fotos..." : "Publicar Ahora"}
      </Button>
    </Card>
  );
};