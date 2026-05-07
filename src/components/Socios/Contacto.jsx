import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Card, Spinner } from 'react-bootstrap';
import { FaPaperPlane, FaUser, FaHome, FaCommentAlt, FaUsersCog } from 'react-icons/fa';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';
import Swal from 'sweetalert2';

export const Contacto = () => {
  // 1. Estados
  const [barrioId, setBarrioId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    lote: '',
    consulta: '',
    destino: 'AtencionAlPropietario' // Valor inicial basado en idPublico
  });
  
  // Normalizamos el nombre del campo a 'numerotelefono' para que coincida con tu DB
  const [contacto, setContacto] = useState({ email: '', numerotelefono: '' });
  const [loading, setLoading] = useState(false);
  const [metodosContacto, setMetodosContacto] = useState({ whatsapp: false, correo: false });

  // 2. Definición de destinos usando idPublico como 'value'
  const destinos = [
    { value: 'AtencionAlPropietario', label: '📂 Administración' },
    { value: 'Facturacion', label: '💳 Facturación' },
    { value: 'ControlDeObras', label: '🏗️ Control de Obras' }
  ];

  // 3. Cargar barrioId desde localStorage
  useEffect(() => {
    const data = localStorage.getItem('user');
    if (data) {
      try {
        const storedUserData = JSON.parse(data);
        if (storedUserData?.barrioId) {
          // Lo guardamos en minúsculas para asegurar coincidencia con la DB ("cube")
          setBarrioId(storedUserData.barrioId.toLowerCase().trim());
        }
      } catch (e) {
        console.error("Error parseando user de localStorage", e);
      }
    }
  }, []);

  // 4. Función de búsqueda por idPublico en la colección 'usuarios'
  const fetchContacto = async (idSeleccionado) => {
    if (!barrioId) return;

    setLoading(true);
    try {
      console.log(`Buscando idPublico: ${idSeleccionado} en barrio: ${barrioId}`);
      
      const q = query(
        collection(db, 'usuarios'), 
        where('idPublico', '==', idSeleccionado),
        where("barrioId", "==", barrioId) 
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        
        setContacto({ 
          email: data.email?.trim() || '', 
          numerotelefono: data.numerotelefono || '' 
        });
        console.log("✅ Contacto encontrado:", data.email);
      } else {
        console.warn("⚠️ No se encontró el contacto en la colección 'usuarios'");
        setContacto({ email: '', numerotelefono: '' });
        setMetodosContacto({ whatsapp: false, correo: false });
      }
    } catch (err) {
      console.error("❌ Error al obtener contacto:", err);
    } finally {
      setLoading(false);
    }
  };

  // 5. Efecto: Buscar cuando cambie el destino o el barrio
  useEffect(() => {
    if (barrioId && formData.destino) {
      fetchContacto(formData.destino);
    }
  }, [formData.destino, barrioId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!metodosContacto.whatsapp && !metodosContacto.correo) {
      Swal.fire('Atención', 'Selecciona un método de contacto', 'warning');
      return;
    }
    
    // Aquí podrías agregar la lógica para disparar el mail o abrir WhatsApp
    Swal.fire('Enviado', 'Tu consulta ha sido procesada con éxito', 'success');
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} lg={8}>
          <Card className="shadow-lg border-0">
            <Card.Header className="bg-success text-white text-center py-4">
              <FaUsersCog size={40} className="mb-2" />
              <h3 className="fw-bold mb-0">Contacto</h3>
            </Card.Header>

            <Card.Body className="p-4 bg-light">
              <Form onSubmit={handleSubmit}>
                
                <h5 className="text-success mb-3">Tu Información</h5>
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

                <h5 className="text-success mb-3">Detalles de la Consulta</h5>
                <Form.Floating className="mb-3">
                  <Form.Select 
                    value={formData.destino}
                    onChange={(e) => setFormData({...formData, destino: e.target.value})}
                  >
                    {destinos.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </Form.Select>
                  <label>Departamento</label>
                </Form.Floating>

                <Form.Floating className="mb-4">
                  <Form.Control 
                    as="textarea" 
                    placeholder="Mensaje"
                    style={{ height: '120px' }}
                    value={formData.consulta}
                    onChange={(e) => setFormData({...formData, consulta: e.target.value})}
                    required
                  />
                  <label><FaCommentAlt className="me-2" />Tu mensaje</label>
                </Form.Floating>

                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body className="text-center">
                    <h6 className="fw-bold mb-3">Método de contacto:</h6>
                    <div className="d-flex justify-content-around">
                      <Form.Check 
                        type="switch"
                        id="sw-ws"
                        label="WhatsApp"
                        // Validamos contra el nombre correcto del campo
                        disabled={!contacto.numerotelefono || loading}
                        checked={metodosContacto.whatsapp}
                        onChange={(e) => setMetodosContacto({...metodosContacto, whatsapp: e.target.checked})}
                      />
                      <Form.Check 
                        type="switch"
                        id="sw-mail"
                        label="Correo"
                        disabled={!contacto.email || loading}
                        checked={metodosContacto.correo}
                        onChange={(e) => setMetodosContacto({...metodosContacto, correo: e.target.checked})}
                      />
                    </div>
                    {(!contacto.numerotelefono && !contacto.email && !loading) && (
                      <small className="text-danger d-block mt-2">
                        No hay datos de contacto para este departamento.
                      </small>
                    )}
                  </Card.Body>
                </Card>

                {loading && (
                  <div className="text-center mb-3">
                    <Spinner animation="border" variant="success" size="sm" />
                    <span className="ms-2 text-muted">Buscando...</span>
                  </div>
                )}

                <Button 
                  variant="success" 
                  type="submit" 
                  size="lg" 
                  className="w-100 fw-bold"
                  disabled={loading || (!metodosContacto.whatsapp && !metodosContacto.correo)}
                >
                  <FaPaperPlane className="me-2" /> ENVIAR
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};