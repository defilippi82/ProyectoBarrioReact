import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Card, Spinner } from 'react-bootstrap';
import { FaPaperPlane, FaUser, FaHome, FaCommentAlt, FaUsersCog } from 'react-icons/fa';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';
import Swal from 'sweetalert2';
import { useMediaQuery } from 'react-responsive';

export const Contacto = () => {
  // 1. Definición de estados
  const [barrioId, setBarrioId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    lote: '',
    consulta: '',
    destino: 'Administracion'
  });
  
  const [contacto, setContacto] = useState({ email: '', telefono: '' });
  const [loading, setLoading] = useState(false);
  const [metodosContacto, setMetodosContacto] = useState({
    whatsapp: false,
    correo: false
  });

  const isMobile = useMediaQuery({ maxWidth: 768 });

  const destinos = [
    { value: 'Administracion', label: '📂 Administración' },
    { value: 'Facturacion', label: '💳 Facturación' },
    { value: 'ControlDeObras', label: '🏗️ Control de Obras' }
  ];

  // 2. Obtener el barrioId al montar el componente
  useEffect(() => {
    try {
      const storedUserData = JSON.parse(localStorage.getItem('user'));
      if (storedUserData?.barrioId) {
        setBarrioId(storedUserData.barrioId);
      } else {
        console.warn("No se encontró el barrioId en el almacenamiento local.");
      }
    } catch (error) {
      console.error("Error al leer localStorage:", error);
    }
  }, []);

  // 3. Función para buscar el contacto en Firestore
  const fetchContacto = async (destinoSeleccionado) => {
    if (!barrioId) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, 'contactos'), 
        where('departamento', '==', destinoSeleccionado),
        where("barrioId", "==", barrioId)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setContacto({ 
          email: data.email || '', 
          telefono: data.telefono || '' 
        });
      } else {
        setContacto({ email: '', telefono: '' });
        // Reseteamos métodos si no hay datos
        setMetodosContacto({ whatsapp: false, correo: false });
      }
    } catch (err) {
      console.error("Error al obtener contacto:", err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Actualizar contacto cuando cambie el destino o el barrioId
  useEffect(() => {
    if (formData.destino && barrioId) {
      fetchContacto(formData.destino);
    }
  }, [formData.destino, barrioId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!metodosContacto.whatsapp && !metodosContacto.correo) {
      Swal.fire('Atención', 'Por favor selecciona al menos un método de contacto', 'warning');
      return;
    }
    
    // Lógica de envío simulada
    Swal.fire('Enviado', `Consulta enviada a ${formData.destino} correctamente`, 'success');
  };

  return (
    <Container className="py-4 px-2">
      <Row className="justify-content-center">
        <Col xs={12} lg={8}>
          <Card className="shadow-lg border-0 overflow-hidden">
            <Card.Header className="bg-success text-white text-center py-4">
              <FaUsersCog size={40} className="mb-2" />
              <h3 className="fw-bold mb-0">Contacto con Administración</h3>
              <p className="mb-0 opacity-75">Estamos para ayudarte con tus gestiones</p>
            </Card.Header>

            <Card.Body className="p-3 p-md-5 bg-light">
              <Form onSubmit={handleSubmit}>
                
                <h5 className="text-success mb-3 border-bottom pb-2">Tu Información</h5>
                <Row className="g-3 mb-4">
                  <Col md={6}>
                    <Form.Floating>
                      <Form.Control 
                        type="text" 
                        placeholder="Nombre" 
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        required 
                      />
                      <label><FaUser className="me-2" />Nombre Completo</label>
                    </Form.Floating>
                  </Col>
                  <Col md={6}>
                    <Form.Floating>
                      <Form.Control 
                        type="text" 
                        placeholder="Lote" 
                        value={formData.lote}
                        onChange={(e) => setFormData({...formData, lote: e.target.value})}
                        required 
                      />
                      <label><FaHome className="me-2" />Lote / Manzana</label>
                    </Form.Floating>
                  </Col>
                </Row>

                <h5 className="text-success mb-3 border-bottom pb-2">Detalles del Contacto</h5>
                <Row className="g-3 mb-4">
                  <Col md={12}>
                    <Form.Floating>
                      <Form.Select 
                        value={formData.destino}
                        onChange={(e) => setFormData({...formData, destino: e.target.value})}
                      >
                        {destinos.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </Form.Select>
                      <label>¿A quién diriges tu consulta?</label>
                    </Form.Floating>
                  </Col>

                  <Col md={12}>
                    <Form.Floating>
                      <Form.Control 
                        as="textarea" 
                        placeholder="Escribe aquí"
                        style={{ height: '150px' }}
                        value={formData.consulta}
                        onChange={(e) => setFormData({...formData, consulta: e.target.value})}
                        required
                      />
                      <label><FaCommentAlt className="me-2" />Tu mensaje o duda</label>
                    </Form.Floating>
                  </Col>
                </Row>

                <Card className="border-0 shadow-sm mb-4 bg-white">
                  <Card.Body>
                    <h6 className="fw-bold mb-3 text-secondary text-center">Selecciona cómo quieres contactarnos:</h6>
                    <Row className="text-center g-3">
                      <Col xs={6}>
                        <Form.Check 
                          type="switch"
                          id="check-whatsapp"
                          label="WhatsApp"
                          disabled={!contacto.telefono || loading}
                          checked={metodosContacto.whatsapp}
                          onChange={(e) => setMetodosContacto({...metodosContacto, whatsapp: e.target.checked})}
                          className="d-inline-block fw-bold text-success"
                        />
                      </Col>
                      <Col xs={6}>
                        <Form.Check 
                          type="switch"
                          id="check-email"
                          label="Correo"
                          disabled={!contacto.email || loading}
                          checked={metodosContacto.correo}
                          onChange={(e) => setMetodosContacto({...metodosContacto, correo: e.target.checked})}
                          className="d-inline-block fw-bold text-warning"
                        />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {loading && (
                  <div className="text-center mb-3">
                    <Spinner animation="border" variant="success" size="sm" />
                    <span className="ms-2 text-muted">Buscando datos de contacto...</span>
                  </div>
                )}

                <div className="d-grid gap-2">
                  <Button 
                    variant="success" 
                    type="submit" 
                    size="lg" 
                    className="py-3 fw-bold shadow-sm text-nowrap"
                    disabled={loading || (!metodosContacto.whatsapp && !metodosContacto.correo)}
                  >
                    <FaPaperPlane className="me-2" /> ENVIAR CONSULTA
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};