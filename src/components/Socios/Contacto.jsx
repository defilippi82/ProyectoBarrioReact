import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Card, Spinner } from 'react-bootstrap';
import { FaPaperPlane, FaUsersCog, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';
import Swal from 'sweetalert2';

export const Contacto = () => {
  // 1. ESTADOS
  const [barrioId, setBarrioId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    lote: '',
    consulta: '',
    destino: 'AtencionAlPropietario'
  });
  
  const [contacto, setContacto] = useState({ email: '', numerotelefono: '' });
  const [loading, setLoading] = useState(false);
  const [metodosContacto, setMetodosContacto] = useState({ whatsapp: false, correo: false });

  // 2. DESTINOS
  const destinos = [
    { value: 'AtencionAlPropietario', label: '📂 Administración' },
    { value: 'Facturacion', label: '💳 Facturación' },
    { value: 'ControlDeObras', label: '🏗️ Control de Obras' }
  ];

  // 3. CARGA DE SESIÓN (Unificada)
  useEffect(() => {
    const data = localStorage.getItem('userData') || localStorage.getItem('userData');
    if (data) {
      try {
        const stored = JSON.parse(data);
        if (stored?.barrioId) {
          setBarrioId(String(stored.barrioId).toLowerCase().trim());
        }
      } catch (e) {
        console.error("Error sesión:", e);
      }
    }
  }, []);

  // 4. BÚSQUEDA DE DATOS DE CONTACTO
  const fetchContacto = async (idPublicoSeleccionado) => {
    if (!barrioId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'usuarios'), 
        where('idPublico', '==', idPublicoSeleccionado),
        where("barrioId", "==", barrioId) 
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docEncontrado = querySnapshot.docs[0].data();
        setContacto({ 
          email: docEncontrado.email || '', 
          numerotelefono: docEncontrado.numerotelefono || '' 
        });
        setMetodosContacto({
          whatsapp: !!docEncontrado.numerotelefono,
          correo: !!docEncontrado.email
        });
      } else {
        setContacto({ email: '', numerotelefono: '' });
        setMetodosContacto({ whatsapp: false, correo: false });
      }
    } catch (err) {
      console.error("Error Firebase:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (barrioId && formData.destino) {
      fetchContacto(formData.destino);
    }
  }, [formData.destino, barrioId]);

  // 5. LÓGICA DE ENVÍO (Única declaración)
  const handleSubmit = (e) => {
    e.preventDefault();
    const { nombre, lote, consulta, destino } = formData;
    const { email, numerotelefono } = contacto;
    const destinoLabel = destinos.find(d => d.value === destino)?.label || destino;

    const mensajeBase = `*Nueva Consulta - Barrio Cube*\n\n` +
                        `👤 *Nombre:* ${nombre}\n` +
                        `🏡 *Lote/Unidad:* ${lote}\n` +
                        `🏢 *Sector:* ${destinoLabel}\n` +
                        `💬 *Consulta:* ${consulta}`;

    // WhatsApp
    if (metodosContacto.whatsapp && numerotelefono) {
      const phoneClean = numerotelefono.replace(/\D/g, '');
      const waUrl = `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(mensajeBase)}`;
      window.open(waUrl, '_blank');
    }

    // Correo
    if (metodosContacto.correo && email) {
      const subject = `Consulta de ${nombre} - Lote ${lote}`;
      const bodyEmail = mensajeBase.replace(/\*/g, ''); 
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyEmail)}`;
      setTimeout(() => {
        window.location.href = mailtoUrl;
      }, 500);
    }

    Swal.fire({
      title: '¡Consulta Iniciada!',
      text: 'Se están abriendo los canales de contacto seleccionados.',
      icon: 'success',
      confirmButtonColor: '#198754'
    });
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} lg={7}>
          <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
            <Card.Header className="bg-success text-white text-center py-4">
              <FaUsersCog size={40} className="mb-2" />
              <h3 className="fw-bold mb-0">Contacto</h3>
            </Card.Header>

            <Card.Body className="p-4 bg-white">
              <Form onSubmit={handleSubmit}>
                <Row className="g-3 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">NOMBRE</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        required 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">LOTE / UNIDAD</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={formData.lote}
                        onChange={(e) => setFormData({...formData, lote: e.target.value})}
                        required 
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">DEPARTAMENTO DESTINO</Form.Label>
                  <Form.Select 
                    value={formData.destino}
                    onChange={(e) => setFormData({...formData, destino: e.target.value})}
                  >
                    {destinos.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-muted">MENSAJE</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={4}
                    value={formData.consulta}
                    onChange={(e) => setFormData({...formData, consulta: e.target.value})}
                    required
                  />
                </Form.Group>

                <Card className="bg-light border-0 mb-4">
                  <Card.Body className="py-3">
                    <div className="d-flex justify-content-around align-items-center">
                      <Form.Check 
                        type="switch"
                        id="ws-switch"
                        label={<span><FaWhatsapp className="text-success me-1"/> WhatsApp</span>}
                        disabled={!contacto.numerotelefono || loading}
                        checked={metodosContacto.whatsapp}
                        onChange={(e) => setMetodosContacto({...metodosContacto, whatsapp: e.target.checked})}
                      />
                      <Form.Check 
                        type="switch"
                        id="mail-switch"
                        label={<span><FaEnvelope className="text-primary me-1"/> Correo</span>}
                        disabled={!contacto.email || loading}
                        checked={metodosContacto.correo}
                        onChange={(e) => setMetodosContacto({...metodosContacto, correo: e.target.checked})}
                      />
                    </div>
                  </Card.Body>
                </Card>

                <Button 
                  variant="success" 
                  type="submit" 
                  size="lg" 
                  className="w-100 fw-bold shadow-sm"
                  disabled={loading || (!metodosContacto.whatsapp && !metodosContacto.correo)}
                >
                  {loading ? <Spinner size="sm" /> : <><FaPaperPlane className="me-2" /> ENVIAR CONSULTA</>}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};