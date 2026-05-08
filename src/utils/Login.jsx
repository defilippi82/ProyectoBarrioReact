import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Card, Spinner } from 'react-bootstrap';
import { FaPaperPlane, FaUser, FaHome, FaCommentAlt, FaUsersCog, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase'; 
import Swal from 'sweetalert2';

export const Contacto = () => {
  const [barrioId, setBarrioId] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', lote: '', consulta: '', destino: 'AtencionAlPropietario' });
  const [contacto, setContacto] = useState({ email: '', numerotelefono: '' });
  const [loading, setLoading] = useState(false);
  const [metodosContacto, setMetodosContacto] = useState({ whatsapp: false, correo: false });

  const destinos = [
    { value: 'AtencionAlPropietario', label: '📂 Administración' },
    { value: 'Facturacion', label: '💳 Facturación' },
    { value: 'ControlDeObras', label: '🏗️ Control de Obras' }
  ];

  useEffect(() => {
    const data = localStorage.getItem('userData');
    if (data) {
      try {
        const stored = JSON.parse(data);
        if (stored?.barrioId) setBarrioId(String(stored.barrioId).toLowerCase().trim());
      } catch (e) { console.error(e); }
    }
  }, []);

  const fetchContacto = async (idDestino) => {
    if (!barrioId) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'usuarios'), where('idPublico', '==', idDestino), where("barrioId", "==", barrioId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0].data();
        setContacto({ email: d.email || '', numerotelefono: d.numerotelefono || '' });
        setMetodosContacto({ whatsapp: !!d.numerotelefono, correo: !!d.email });
      } else {
        setContacto({ email: '', numerotelefono: '' });
        setMetodosContacto({ whatsapp: false, correo: false });
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (barrioId && formData.destino) fetchContacto(formData.destino);
  }, [formData.destino, barrioId]);

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} lg={7}>
          <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
            <Card.Header className="bg-success text-white text-center py-4">
              <FaUsersCog size={40} className="mb-2" />
              <h3 className="fw-bold mb-0">Contacto con Administración</h3>
            </Card.Header>
            <Card.Body className="p-4 bg-white">
              <Form onSubmit={(e) => { e.preventDefault(); Swal.fire('Enviado', 'Consulta recibida', 'success'); }}>
                <Row className="g-3 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">NOMBRE</Form.Label>
                      <Form.Control type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">LOTE</Form.Label>
                      <Form.Control type="text" value={formData.lote} onChange={(e) => setFormData({...formData, lote: e.target.value})} required />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">DEPARTAMENTO</Form.Label>
                  <Form.Select value={formData.destino} onChange={(e) => setFormData({...formData, destino: e.target.value})}>
                    {destinos.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-muted">MENSAJE</Form.Label>
                  <Form.Control as="textarea" rows={3} value={formData.consulta} onChange={(e) => setFormData({...formData, consulta: e.target.value})} required />
                </Form.Group>
                <div className="d-flex justify-content-around mb-4 p-3 bg-light rounded shadow-sm">
                  <Form.Check type="switch" label="WhatsApp" disabled={!contacto.numerotelefono || loading} checked={metodosContacto.whatsapp} onChange={(e) => setMetodosContacto({...metodosContacto, whatsapp: e.target.checked})} />
                  <Form.Check type="switch" label="Correo" disabled={!contacto.email || loading} checked={metodosContacto.correo} onChange={(e) => setMetodosContacto({...metodosContacto, correo: e.target.checked})} />
                </div>
                <Button variant="success" type="submit" className="w-100 fw-bold py-2" disabled={loading || (!metodosContacto.whatsapp && !metodosContacto.correo)}>
                  {loading ? <Spinner size="sm" /> : "ENVIAR CONSULTA"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};