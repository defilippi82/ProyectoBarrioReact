import React, { useEffect, useState, useContext } from "react";
import { Form, Button, Card, Row, Col, Badge, Spinner } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "/src/firebaseConfig/firebase";
import { UserContext } from "./UserContext";
// import { DayPicker } from "react-day-picker"; // COMENTADO PARA FUTURO
// import "react-day-picker/dist/style.css";

export const EditarPublicacion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useContext(UserContext);

  const [form, setForm] = useState(null);
  const [loadingImg, setLoadingImg] = useState(false);
  
  const masterAmenities = ["Pileta", "Playroom", "Jacuzzi", "Internet", "Cable", "Parrilla", "Cama Elástica"];

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, "alquileres", id));
      if (snap.exists()) {
        const d = snap.data();
        setForm({
          ...d,
          valor: d.precio?.valor || "",
          moneda: d.precio?.moneda || "ARS",
          tipoPrecio: d.precio?.tipo || "dia",
          imagenes: d.imagenes || (d.imagen ? [d.imagen] : []),
          amenitiesSeleccionadas: d.amenities || []
        });
      }
    };
    fetch();
  }, [id]);

  const handleGuardar = async () => {
    await updateDoc(doc(db, "alquileres", id), {
      titulo: form.titulo,
      descripcion: form.descripcion,
      imagenes: form.imagenes,
      precio: { valor: Number(form.valor), moneda: form.moneda, tipo: form.tipoPrecio },
      capacidad: Number(form.capacidad),
      mascotas: form.mascotas,
      amenities: form.amenitiesSeleccionadas,
      // Actualizamos contacto por si el usuario cambió su teléfono en su perfil
      contacto: { email: userData?.email || "", telefono: userData?.numerotelefono || "No informado" }
    });
    alert("Publicación actualizada");
    navigate("/alquileres");
  };

  const toggleEstado = async () => {
    const nuevoEstado = form.estado === "disponible" ? "pausado" : "disponible";
    await updateDoc(doc(db, "alquileres", id), { estado: nuevoEstado });
    setForm({ ...form, estado: nuevoEstado });
  };

  if (!form) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  return (
    <Card className="p-4 mt-4 shadow-sm">
      <h3 className="text-center mb-4">Editar Mi Aviso</h3>

      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded border">
        <div>
          <span className="me-2 text-muted small">Estado actual:</span>
          <Badge bg={form.estado === "pausado" ? "secondary" : "success"}>{form.estado.toUpperCase()}</Badge>
        </div>
        <Button variant={form.estado === "disponible" ? "outline-danger" : "outline-success"} size="sm" onClick={toggleEstado}>
          {form.estado === "disponible" ? "Pausar Aviso" : "Activar Aviso"}
        </Button>
      </div>

      <h5 className="border-bottom pb-2">Fotos ({form.imagenes.length}/4)</h5>
      <Row className="mb-3 g-2">
        {form.imagenes.map((url, i) => (
          <Col xs={3} key={i} className="position-relative">
            <img src={url} className="img-thumbnail" style={{height:'80px', width:'100%', objectFit:'cover'}} />
            <Button variant="danger" size="sm" className="position-absolute top-0 end-0 p-0" style={{width:'20px'}} onClick={() => setForm({...form, imagenes: form.imagenes.filter((_, idx) => idx !== i)})}>×</Button>
          </Col>
        ))}
      </Row>
      {form.imagenes.length < 4 && <Form.Control type="file" multiple onChange={async (e) => {
          setLoadingImg(true);
          const files = Array.from(e.target.files);
          const urls = [];
          for(const f of files) {
            const fd = new FormData(); fd.append("file", f); fd.append("upload_preset", "ml_cube");
            const res = await fetch("https://api.cloudinary.com/v1_1/cubealquiler/image/upload", {method:"POST", body:fd});
            const data = await res.json(); urls.push(data.secure_url);
          }
          setForm({...form, imagenes: [...form.imagenes, ...urls]});
          setLoadingImg(false);
      }} />}

      <h5 className="mt-4 border-bottom pb-2">Datos Generales</h5>
      <Form.Group className="mb-3">
        <Form.Label className="small mb-0">Título</Form.Label>
        <Form.Control value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label className="small mb-0">Descripción</Form.Label>
        <Form.Control as="textarea" rows={3} value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
      </Form.Group>

      <Row className="mb-3">
        <Col xs={4}><Form.Label className="small mb-0">Precio</Form.Label><Form.Control type="number" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} /></Col>
        <Col xs={4}><Form.Label className="small mb-0">Moneda</Form.Label>
          <Form.Select value={form.moneda} onChange={e => setForm({...form, moneda: e.target.value})}>
            <option value="ARS">ARS</option><option value="USD">USD</option>
          </Form.Select>
        </Col>
        <Col xs={4}><Form.Label className="small mb-0">Tipo</Form.Label>
          <Form.Select value={form.tipoPrecio} onChange={e => setForm({...form, tipoPrecio: e.target.value})}>
            <option value="dia">Día</option><option value="noche">Noche</option>
          </Form.Select>
        </Col>
      </Row>

      <h5 className="mt-4 border-bottom pb-2">Amenities</h5>
      <Row className="mb-4">
        {masterAmenities.map((am, i) => (
          <Col xs={6} key={i}>
            <Form.Check label={am} checked={form.amenitiesSeleccionadas.includes(am)} 
              onChange={() => setForm({...form, amenitiesSeleccionadas: form.amenitiesSeleccionadas.includes(am) ? form.amenitiesSeleccionadas.filter(x => x !== am) : [...form.amenitiesSeleccionadas, am]})} />
          </Col>
        ))}
      </Row>

      {/* BLOQUE DE DISPONIBILIDAD COMENTADO PARA FUTURO 
      <h5 className="mt-4">Calendario de Disponibilidad</h5>
      <div className="d-flex justify-content-center border p-2 mb-3 bg-white">
        <DayPicker mode="range" />
      </div>
      */}

      <div className="d-flex gap-2 border-top pt-3">
        <Button variant="success" className="w-100" onClick={handleGuardar} disabled={loadingImg}>Guardar</Button>
        <Button variant="secondary" className="w-100" onClick={() => navigate("/alquileres")}>Volver</Button>
      </div>
    </Card>
  );
};