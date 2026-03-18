import React, { useEffect, useState, useContext } from "react";
import { Form, Button, Card, Row, Col, Badge, Spinner, InputGroup } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "/src/firebaseConfig/firebase";
import { UserContext } from "./UserContext";

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
    if (!form.titulo || !form.valor) return alert("Título y Valor son obligatorios");

    try {
      await updateDoc(doc(db, "alquileres", id), {
        titulo: form.titulo,
        descripcion: form.descripcion,
        imagenes: form.imagenes,
        precio: { valor: Number(form.valor), moneda: form.moneda, tipo: form.tipoPrecio },
        capacidad: Number(form.capacidad),
        mascotas: form.mascotas,
        amenities: form.amenitiesSeleccionadas,
        // Sincronizamos con los datos actuales del perfil por si cambiaron
        contacto: { 
          email: userData?.email || "", 
          telefono: userData?.numerotelefono || "No informado" 
        }
      });
      alert("Cambios guardados con éxito");
      navigate("/alquileres");
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
  };

  const toggleEstado = async () => {
    const nuevoEstado = form.estado === "disponible" ? "pausado" : "disponible";
    await updateDoc(doc(db, "alquileres", id), { estado: nuevoEstado });
    setForm({ ...form, estado: nuevoEstado });
  };

  const toggleAmenity = (am) => {
    setForm(prev => ({
      ...prev,
      amenitiesSeleccionadas: prev.amenitiesSeleccionadas.includes(am)
        ? prev.amenitiesSeleccionadas.filter(x => x !== am)
        : [...prev.amenitiesSeleccionadas, am]
    }));
  };

  if (!form) return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <Card className="p-3 p-md-4 mt-4 shadow-sm border-0">
      <h4 className="text-center mb-4">Editar Publicación</h4>

      {/* GESTIÓN DE ESTADO (PAUSAR/ACTIVAR) */}
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded border border-primary">
        <div>
          <span className="text-muted small d-block">Estado del aviso:</span>
          <Badge bg={form.estado === "pausado" ? "secondary" : "success"}>
            {form.estado === "pausado" ? "PAUSADO / OCULTO" : "ACTIVO / VISIBLE"}
          </Badge>
        </div>
        <Button 
          variant={form.estado === "disponible" ? "outline-danger" : "outline-success"} 
          size="sm" 
          onClick={toggleEstado}
        >
          {form.estado === "disponible" ? "Pausar Aviso" : "Activar Aviso"}
        </Button>
      </div>

      {/* FOTOS */}
      <h6 className="text-muted text-uppercase small fw-bold">Fotos ({form.imagenes.length}/4)</h6>
      <div className="mb-4 p-3 border rounded bg-light">
        <Row className="g-2 mb-2">
          {form.imagenes.map((url, i) => (
            <Col xs={3} key={i}>
              <div className="position-relative">
                <img src={url} className="img-thumbnail w-100" style={{ height: "60px", objectFit: "cover" }} alt="preview" />
                <button 
                  className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0" 
                  style={{ width: "18px", height: "18px", fontSize: "10px" }}
                  onClick={() => setForm({...form, imagenes: form.imagenes.filter((_, idx) => idx !== i)})}
                >
                  ×
                </button>
              </div>
            </Col>
          ))}
        </Row>
        {form.imagenes.length < 4 && (
          <Form.Control 
            type="file" 
            size="sm" 
            multiple 
            onChange={async (e) => {
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
            }} 
          />
        )}
      </div>

      {/* DATOS GENERALES */}
      <h6 className="text-muted text-uppercase small fw-bold">Detalles</h6>
      <Form.Group className="mb-3">
        <Form.Control value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Control as="textarea" rows={3} value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
      </Form.Group>

      <Row className="g-2 mb-3">
        <Col xs={12} md={6}>
          <InputGroup>
            <InputGroup.Text>{form.moneda === "ARS" ? "$" : "U$S"}</InputGroup.Text>
            <Form.Control type="number" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} />
            <Form.Select style={{ maxWidth: "100px" }} value={form.moneda} onChange={e => setForm({...form, moneda: e.target.value})}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </Form.Select>
          </InputGroup>
        </Col>
        <Col xs={12} md={6}>
          <Form.Select value={form.tipoPrecio} onChange={e => setForm({...form, tipoPrecio: e.target.value})}>
            <option value="dia">Por Día</option>
            <option value="noche">Por Noche</option>
            <option value="semana">Por Semana</option>
          </Form.Select>
        </Col>
      </Row>

      {/* AMENITIES CON ESTILO DE BOTÓN CLIQUEABLE */}
      <h6 className="text-muted text-uppercase small fw-bold mt-2">Amenities</h6>
      <Row className="mb-4 g-1">
        {masterAmenities.map((am, i) => (
          <Col xs={6} md={4} key={i}>
            <div 
              className={`p-2 border rounded d-flex align-items-center h-100 ${form.amenitiesSeleccionadas.includes(am) ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-dark'}`}
              onClick={() => toggleAmenity(am)}
              style={{ cursor: 'pointer', transition: '0.2s', minHeight: '45px' }}
            >
              <Form.Check type="checkbox" checked={form.amenitiesSeleccionadas.includes(am)} readOnly className="me-2" />
              <span style={{ fontSize: '0.85rem', lineHeight: '1.1' }}>{am}</span>
            </div>
          </Col>
        ))}
      </Row>

      {/* ACCIONES FINALES */}
      <div className="d-flex flex-column gap-2 mt-4">
        <Button variant="success" className="py-2 fw-bold text-nowrap" onClick={handleGuardar} disabled={loadingImg}>
          {loadingImg ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
        </Button>
        <Button variant="light" className="text-muted" onClick={() => navigate("/alquileres")}>
          CANCELAR
        </Button>
      </div>
    </Card>
  );
};