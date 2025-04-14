import React, { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import Swal from 'sweetalert2';
import { Table, Button, Form, Modal, Row, Col, InputGroup, Card, Spinner, Alert } from 'react-bootstrap';
import { FaWhatsapp, FaCopy, FaList, FaPlusCircle, FaEnvelope, FaQrcode } from 'react-icons/fa';
import QRCode from 'qrcode';
import emailjs from '@emailjs/browser';

// Configuración EmailJS
const EMAILJS_CONFIG = {
  SERVICE_ID: "service_invitado",
  TEMPLATE_ID: "template_listainvitados",
  USER_ID: "F2yt1jfmdvtF48It0"
};

export const Invitados = () => {
  const [state, setState] = useState({
    formData: {
      nombre: '',
      dni: '',
      patente: '',
      email: '',
      telefono: '',
      mensaje: ''
    },
    userData: null,
    loading: true,
    error: null,
    invitados: [],
    showListModal: false,
    listas: [],
    nuevaLista: {
      nombre: '',
      invitados: []
    },
    showQRModal: false,
    currentQR: null,
    qrImageUrl: ''
  });

  const {
    formData,
    userData,
    loading,
    error,
    invitados,
    showListModal,
    listas,
    nuevaLista,
    showQRModal,
    currentQR,
    qrImageUrl
  } = state;

  // Inicializa EmailJS
  useEffect(() => {
    emailjs.init(EMAILJS_CONFIG.USER_ID);
    const loadUserData = async () => {
      try {
        const userDataFromStorage = localStorage.getItem('userData');
        if (!userDataFromStorage) throw new Error('No se encontraron datos de usuario');
        
        const parsedData = JSON.parse(userDataFromStorage);
        if (!parsedData?.manzana || !parsedData?.lote || !parsedData?.nombre) {
          throw new Error('Datos de usuario incompletos');
        }
        
        setState(prev => ({ ...prev, userData: parsedData, error: null }));
      } catch (err) {
        console.error('Error al cargar userData:', err);
        setState(prev => ({ ...prev, error: err.message }));
        Swal.fire('Error', 'No se pudieron cargar tus datos. Serás redirigido.', 'error')
          .then(() => window.location.href = '/login');
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    loadUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [name]: value }
    }));
  };

  const generarQRDataURL = async (data) => {
    try {
      return await QRCode.toDataURL(JSON.stringify(data), {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'H'
      });
    } catch (error) {
      console.error("Error generando QR:", error);
      return '';
    }
  };

  const enviarPorCorreo = async (invitadoData) => {
    try {
      const emailDestino = invitadoData.email || userData.email;
      if (!emailDestino) {
        Swal.fire('Error', 'No hay dirección de email disponible', 'error');
        return;
      }

      const qrImageUrl = await generarQRDataURL(invitadoData);
      if (!qrImageUrl) {
        throw new Error('No se pudo generar el código QR');
      }

      const templateParams = {
        nombre_invitado: invitadoData.nombre,
        nombre_anfitrion: userData.nombre,
        lote: invitadoData.lote,
        fecha: new Date(invitadoData.fecha).toLocaleDateString(),
        qr_image_url: qrImageUrl,
        email_invitado: emailDestino
      };

      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAILJS_CONFIG.USER_ID
      );

      Swal.fire({
        icon: 'success',
        title: 'Invitación enviada',
        text: `Se ha enviado el QR a ${emailDestino}`,
        timer: 3000
      });
    } catch (error) {
      console.error("Error al enviar email:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo enviar el correo. Por favor intenta nuevamente.',
      });
    }
  };

  const agregarInvitado = async (e) => {
    e.preventDefault();
    const { nombre, dni, patente, email } = formData;
    
    if (!nombre || !dni || !patente) {
      Swal.fire('Error', 'Nombre, DNI y Patente son obligatorios', 'error');
      return;
    }

    try {
      const nuevoInvitado = {
        ...formData,
        fecha: new Date().toISOString(),
        lote: `${userData.manzana}-${userData.lote}`,
        invitador: userData.nombre,
        telefonoInvitador: userData.numerotelefono || '', // Cambiado a numerotelefono
        estado: 'pendiente'
      };

      const docRef = await addDoc(collection(db, 'invitados'), nuevoInvitado);
      
      if (email || userData.email) {
        await enviarPorCorreo(nuevoInvitado);
      }

      setState(prev => ({
        ...prev,
        invitados: [...prev.invitados, { id: docRef.id, ...nuevoInvitado }],
        formData: {
          nombre: '',
          dni: '',
          patente: '',
          email: '',
          telefono: '',
          mensaje: ''
        }
      }));
      
    } catch (error) {
      console.error("Error al agregar invitado:", error);
      Swal.fire('Error', 'No se pudo agregar el invitado', 'error');
    }
  };

  const mostrarQR = async (invitado) => {
    const qrImage = await generarQRDataURL(invitado);
    setState(prev => ({
      ...prev,
      showQRModal: true,
      currentQR: {
        ...invitado,
        email: invitado.email || userData.email || ''
      },
      qrImageUrl: qrImage
    }));
  };

  const enviarPorWhatsApp = () => {
    const mensaje = `✅ *Invitación Verificada* ✅\n\n` +
      `🔹 *Invitado:* ${currentQR.nombre}\n` +
      `🔹 *DNI:* ${currentQR.dni}\n` +
      `🔹 *Patente:* ${currentQR.patente}\n` +
      `🔹 *Lote:* ${currentQR.lote}\n` +
      `🔹 *Anfitrión:* ${currentQR.invitador}\n\n` +
      `*Fecha:* ${new Date(currentQR.fecha).toLocaleString()}`;
    
    window.open(`https://wa.me/${currentQR.telefono}?text=${encodeURIComponent(mensaje)}`);
    setState(prev => ({ ...prev, showQRModal: false }));
  };

  const manejarLista = {
    agregarInvitado: (invitado) => {
      setState(prev => ({
        ...prev,
        nuevaLista: {
          ...prev.nuevaLista,
          invitados: [...prev.nuevaLista.invitados, invitado]
        }
      }));
    },

    eliminarInvitado: (index) => {
      setState(prev => ({
        ...prev,
        nuevaLista: {
          ...prev.nuevaLista,
          invitados: prev.nuevaLista.invitados.filter((_, i) => i !== index)
        }
      }));
    },

    crearLista: async () => {
      if (!nuevaLista.nombre || nuevaLista.invitados.length === 0) {
        Swal.fire('Error', 'Debes ingresar un nombre y al menos un invitado', 'error');
        return;
      }

      try {
        const listaCompleta = {
          ...nuevaLista,
          lote: `${userData.manzana}-${userData.lote}`,
          propietario: userData.nombre,
          telefonoPropietario: userData.numerotelefono || '', // Cambiado a numerotelefono
          fecha: new Date().toISOString(),
          estado: 'pendiente'
        };

        const docRef = await addDoc(collection(db, 'listasInvitados'), listaCompleta);
        
        setState(prev => ({
          ...prev,
          listas: [...prev.listas, { id: docRef.id, ...listaCompleta }],
          nuevaLista: { nombre: '', invitados: [] },
          showListModal: false
        }));
        
        Swal.fire('Éxito', 'Lista creada correctamente', 'success');
      } catch (error) {
        console.error("Error al crear lista:", error);
        Swal.fire('Error', 'No se pudo crear la lista', 'error');
      }
    },

    enviarLista: (lista) => {
      const telefonoGuardia = "+5491167204232";
      let mensaje = `*LISTA DE INVITADOS - ${lista.nombre}*\n\n`;
      mensaje += `🔹 *Lote:* ${userData.manzana}-${userData.lote}\n`;
      mensaje += `🔹 *Propietario:* ${userData.nombre}\n`;
      mensaje += `🔹 *Teléfono:* ${userData.numerotelefono || 'No registrado'}\n\n`; // Cambiado a numerotelefono
      mensaje += `*INVITADOS (${lista.invitados.length})*\n`;
      
      lista.invitados.forEach((inv, index) => {
        mensaje += `▸ ${index+1}. ${inv.nombre} | DNI: ${inv.dni} | Patente: ${inv.patente}\n`;
      });

      window.open(`https://wa.me/${telefonoGuardia}?text=${encodeURIComponent(mensaje)}`);
    }
  };

  const compartir = {
    enlace: () => {
      if (!userData) return 'Cargando...';
      
      const params = new URLSearchParams();
      params.append('lote', `${userData.manzana}-${userData.lote}`);
      params.append('invitador', encodeURIComponent(userData.nombre));
      if (userData.numerotelefono) params.append('telefono', userData.numerotelefono); // Cambiado a numerotelefono
      
      return `${window.location.origin}/pages/invitacion.html?${params.toString()}`;
    },

    copiar: () => {
      navigator.clipboard.writeText(compartir.enlace());
      Swal.fire('Copiado', 'El enlace ha sido copiado al portapapeles', 'success');
    },

    porWhatsapp: () => {
      const mensaje = `Hola, ${userData.nombre} te está invitando. Por favor completa tus datos aquí: ${compartir.enlace()}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Cargando datos del usuario...</span>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="container mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error al cargar los datos</Alert.Heading>
          <p>{error || 'No se pudieron cargar los datos del usuario'}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-danger" 
              onClick={() => { window.location.href = '/login'; }}
            >
              Volver a iniciar sesión
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Sistema de Invitaciones</h2>
      
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Card.Title>Compartir formulario de invitación</Card.Title>
          <Card.Text className="mb-3">
            {userData?.numerotelefono ? ( // Cambiado a numerotelefono
              <span className="text-success">El enlace incluye tu contacto para confirmaciones</span>
            ) : (
              <span className="text-warning">
                <FaQrcode className="me-1" /> Advertencia: Registra tu teléfono para recibir notificaciones
              </span>
            )}
          </Card.Text>
          
          <InputGroup className="mb-3">
            <Form.Control value={compartir.enlace()} readOnly />
            <Button variant="outline-secondary" onClick={compartir.copiar}>
              <FaCopy /> Copiar
            </Button>
          </InputGroup>
          
          <div className="d-grid gap-2">
            <Button variant="success" onClick={compartir.porWhatsapp} className="text-white">
              <FaWhatsapp /> Compartir por WhatsApp
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Form onSubmit={agregarInvitado}>
        <Row className="g-3 mb-4">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Nombre completo*</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group>
              <Form.Label>DNI*</Form.Label>
              <Form.Control
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                placeholder="XX.XXX.XXX"
                required
              />
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group>
              <Form.Label>Patente*</Form.Label>
              <Form.Control
                type="text"
                name="patente"
                value={formData.patente}
                onChange={handleChange}
                placeholder="XXX-XXX"
                required
              />
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Para envío de QR"
              />
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group>
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej: 549112345678"
              />
            </Form.Group>
          </Col>
          
          <Col md={12}>
            <Form.Group>
              <Form.Label>Mensaje adicional</Form.Label>
              <Form.Control
                as="textarea"
                name="mensaje"
                value={formData.mensaje}
                onChange={handleChange}
                rows={3}
                placeholder="Instrucciones especiales para tu invitado"
              />
            </Form.Group>
          </Col>
          
          <Col xs={12}>
            <Button variant="primary" type="submit" className="w-100">
              <FaPlusCircle className="me-2" /> Agregar Invitado
            </Button>
          </Col>
        </Row>
      </Form>

      {invitados.length > 0 && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Card.Title>Invitados registrados ({invitados.length})</Card.Title>
              <Button 
                variant="success" 
                onClick={() => setState(prev => ({
                  ...prev,
                  nuevaLista: {
                    nombre: `Lista ${new Date().toLocaleDateString()}`,
                    invitados: [...prev.invitados]
                  },
                  showListModal: true
                }))}
              >
                <FaList className="me-2" /> Crear lista
              </Button>
            </div>
            
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>DNI</th>
                  <th>Patente</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invitados.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.nombre}</td>
                    <td>{inv.dni}</td>
                    <td>{inv.patente || '-'}</td>
                    <td>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => mostrarQR(inv)}
                        className="me-2"
                        title="Generar QR"
                      >
                        <FaQrcode />
                      </Button>
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => manejarLista.agregarInvitado(inv)}
                        title="Agregar a lista"
                      >
                        <FaList />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {listas.length > 0 && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Card.Title>Tus listas guardadas</Card.Title>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Invitados</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {listas.map((lista) => (
                  <tr key={lista.id}>
                    <td>{lista.nombre}</td>
                    <td>{lista.invitados.length}</td>
                    <td>
                      <Button
                        variant="success"
                        className="me-2"
                        onClick={() => manejarLista.enviarLista(lista)}
                        title="Enviar lista"
                      >
                        <FaWhatsapp />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <Modal show={showListModal} onHide={() => setState(prev => ({ ...prev, showListModal: false }))} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Crear nueva lista</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nombre de la lista*</Form.Label>
            <Form.Control
              type="text"
              value={nuevaLista.nombre}
              onChange={(e) => setState(prev => ({
                ...prev,
                nuevaLista: { ...prev.nuevaLista, nombre: e.target.value }
              }))}
              required
              placeholder="Ej: Fiesta cumpleaños 15/08"
            />
          </Form.Group>

          <h5>Invitados en esta lista ({nuevaLista.invitados.length})</h5>
          {nuevaLista.invitados.length > 0 ? (
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>DNI</th>
                  <th>Patente</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {nuevaLista.invitados.map((inv, index) => (
                  <tr key={index}>
                    <td>{inv.nombre}</td>
                    <td>{inv.dni}</td>
                    <td>{inv.patente || '-'}</td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => manejarLista.eliminarInvitado(index)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Alert variant="info">No hay invitados en esta lista</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setState(prev => ({ ...prev, showListModal: false }))}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={manejarLista.crearLista}>
            Guardar Lista
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showQRModal} onHide={() => setState(prev => ({ ...prev, showQRModal: false }))} centered>
        <Modal.Header closeButton>
          <Modal.Title>Invitación para {currentQR?.nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {currentQR && (
            <>
              <img src={qrImageUrl} alt="Código QR de invitación" className="img-fluid" />
              <Form.Group className="mt-3">
                <Form.Label>Email para enviar</Form.Label>
                <Form.Control
                  type="email"
                  value={currentQR.email || ''}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    currentQR: { ...prev.currentQR, email: e.target.value }
                  }))}
                  placeholder="correo@ejemplo.com"
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-center gap-3 w-100">
            <Button 
              variant="primary" 
              onClick={() => enviarPorCorreo(currentQR)}
              disabled={!currentQR?.email && !userData.email}
            >
              <FaEnvelope className="me-2" /> Enviar por Email
            </Button>
            <Button 
              variant="success"
              onClick={enviarPorWhatsApp}
              disabled={!currentQR?.telefono}
            >
              <FaWhatsapp className="me-2" /> Enviar por WhatsApp
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
