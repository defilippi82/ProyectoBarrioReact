import React, { useState, useEffect } from 'react';
import {  Container,  Form,  Button,  Row,  Col,  Card,  Alert, Spinner, FormCheck} from 'react-bootstrap';
import {  FaWhatsapp,  FaEnvelope,  FaPaperPlane, FaUserCircle, FaHome, FaComment, FaUsersCog }from 'react-icons/fa';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';
import Swal from 'sweetalert2';
import { useMediaQuery } from 'react-responsive';

export const Contacto = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    lote: '',
    consulta: '',
    destino: 'Administracion'
  });
  const [contacto, setContacto] = useState({ email: '', telefono: '' });
  const [metodosContacto, setMetodosContacto] = useState({
    whatsapp: false,
    correo: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const destinos = [
    { value: 'Administracion', label: 'Administración', icon: <FaUsersCog className="me-2" /> },
    { value: 'Facturacion', label: 'Facturación', icon: <FaUsersCog className="me-2" /> },
    { value: 'ControlDeObras', label: 'Control de Obras', icon: <FaUsersCog className="me-2" /> }
  ];

  useEffect(() => {
    if (formData.destino) {
      fetchContacto(formData.destino);
    }
  }, [formData.destino]);

  const fetchContacto = async (destino) => {
    setLoading(true);
    try {
      const q = query(collection(db, "usuarios"), where('nombre', '==', destino));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setContacto({ 
          email: userData.email || '', 
          telefono: userData.numerotelefono || '' 
        });
        setError(null);
      } else {
        setContacto({ email: '', telefono: '' });
        setError('No se encontraron datos de contacto para el destino seleccionado');
      }
    } catch (error) {
      console.error("Error fetching contact:", error);
      setError('Error al cargar información de contacto');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setMetodosContacto(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!metodosContacto.whatsapp && !metodosContacto.correo) {
      setError('Selecciona al menos un método de contacto');
      return;
    }

    if (!contacto.email && !contacto.telefono) {
      setError('No hay información de contacto disponible para el destino seleccionado');
      return;
    }

    try {
      const result = await Swal.fire({
        title: 'Confirmar envío',
        html: `¿Deseas enviar el mensaje a <strong>${formData.destino}</strong>?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, enviar',
        cancelButtonText: 'No, cancelar',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
      });

      if (result.isConfirmed) {
        const mensaje = `Soy del lote ${formData.lote}, quiero ${formData.consulta}. Desde ya, muchas gracias, ${formData.nombre}`;

        if (metodosContacto.whatsapp && contacto.telefono) {
          const whatsappUrl = `https://api.whatsapp.com/send?phone=${contacto.telefono}&text=${encodeURIComponent(mensaje)}`;
          window.open(whatsappUrl, '_blank');
        }

        if (metodosContacto.correo && contacto.email) {
          const emailSubject = `Consulta del lote ${formData.lote}`;
          const emailLink = `mailto:${contacto.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(mensaje)}`;
          window.open(emailLink, '_blank');
        }

        // Reset form after successful submission
        setFormData({
          nombre: '',
          lote: '',
          consulta: '',
          destino: 'Administracion'
        });
        setMetodosContacto({
          whatsapp: false,
          correo: false
        });

        Swal.fire(
          '¡Enviado!',
          `Tu mensaje ha sido enviado a ${formData.destino}`,
          'success'
        );
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      setError('Ocurrió un error al enviar el mensaje');
    }
  };

  return (
    <Container className="container fluid py-4 px-3 px-md-5">
      <Row className="justify-content-center">
        <Col xs="auto" mg="auto">
          <Card className="shadow-sm bg-primary">
            <Card.Header className="bg-info ">
              <h2 className="mb-0 text-center">Formulario de Contacto</h2>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit} className="bg-info  p-4 ">
                {/* Nombre */}
                <Form.Group className="shadow-sm mb-3">
                  <Col xs="auto" mg="auto">
                  <Form.Label>
                    <FaUserCircle className=" me-2" />
                    Nombre y Apellido
                  </Form.Label>
                  </Col>
                  
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ingresa tu nombre completo"
                    />
                   
                </Form.Group>

                <Col xs="auto" mg="auto">
                {/* Lote */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaHome className="me-2" />
                    Lote
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="lote"
                    value={formData.lote}
                    onChange={handleChange}
                    required
                    placeholder="Ej: XX-XXX"
                    />
                </Form.Group>
                    </Col>
                  <Col xs="auto" mg="auto">
                {/* Consulta */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaComment className="me-2" />
                    Mensaje
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="consulta"
                    value={formData.consulta}
                    onChange={handleChange}
                    required
                    placeholder="Describe tu consulta aquí..."
                    />
                </Form.Group>
                    </Col>

                {/* Destino */}
                <Form.Group className="mb-4">
                  <Form.Label>Destinatario</Form.Label>
                  <Form.Select
                    name="destino"
                    value={formData.destino}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    {destinos.map((destino) => (
                      <option key={destino.value} value={destino.value}>
                        {isMobile ? destino.label : `${destino.icon} ${destino.label}`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Métodos de contacto */}
                <Form.Group className="mb-4">
                  <Form.Label>Método de contacto:</Form.Label>
                  <div className="d-flex flex-wrap gap-3">
                    <FormCheck
                      type="checkbox"
                      id="whatsapp"
                      name="whatsapp"
                      label={
                        <span className="d-flex align-items-center">
                          <FaWhatsapp className="me-2 text-success" />
                          WhatsApp
                        </span>
                      }
                      checked={metodosContacto.whatsapp}
                      onChange={handleCheckboxChange}
                      disabled={!contacto.telefono}
                    />
                    <FormCheck
                      type="checkbox"
                      id="correo"
                      name="correo"
                      label={
                        <span className="d-flex align-items-center">
                          <FaEnvelope className="me-2 text-primary" />
                          Correo electrónico
                        </span>
                      }
                      checked={metodosContacto.correo}
                      onChange={handleCheckboxChange}
                      disabled={!contacto.email}
                    />
                  </div>
                  {loading && (
                    <div className="mt-2 text-muted">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Cargando información de contacto...
                    </div>
                  )}
                </Form.Group>

                {/* Información de contacto */}
                {contacto.email || contacto.telefono ? (
                  <Alert variant="info" className="mb-4">
                    <strong>Contacto disponible:</strong>
                    <div className="mt-2">
                      {contacto.telefono && (
                        <div>
                          <FaWhatsapp className="me-2 text-success" />
                          {contacto.telefono}
                        </div>
                      )}
                      {contacto.email && (
                        <div>
                          <FaEnvelope className="me-2 text-warning" />
                          {contacto.email}
                        </div>
                      )}
                    </div>
                  </Alert>
                ) : (
                  !loading && (
                    <Alert variant="warning" className="mb-4">
                      No hay información de contacto disponible para el destino seleccionado
                    </Alert>
                  )
                )}

                {/* Botón de enviar */}
                <div className="d-flex align-items-center justify-content-center">
                  <Button 
                    variant="success" 
                    type="submit"
                    size={isMobile ? "sm" : "mg"}
                    disabled={loading || (!contacto.email && !contacto.telefono)}
                  >
                    <FaPaperPlane className="me-2" />
                    Enviar consulta
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