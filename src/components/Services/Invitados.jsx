import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import Swal from 'sweetalert2';
import { Table, Button, Form, Modal, Row, Col, InputGroup, Card, Spinner, Alert } from 'react-bootstrap';
import { FaWhatsapp, FaCopy, FaList, FaPlusCircle, FaEnvelope, FaQrcode, FaTrash, FaShare } from 'react-icons/fa';
import QRCode from 'qrcode';
import emailjs from '@emailjs/browser';
import { useMediaQuery } from 'react-responsive';

// Configuración EmailJS
const EMAILJS_CONFIG = {
  SERVICE_ID: "service_invitado",
  TEMPLATE_ID: "template_listainvitados",
  USER_ID: "F2yt1jfmdvtF48It0"
};

// Componente de botón responsive
const ResponsiveButton = ({ icon, label, ...props }) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  return (
    <Button {...props}>
      {icon && React.cloneElement(icon, { className: `${icon.props.className || ''} ${!isMobile ? 'me-2' : ''}` })}
      {!isMobile && label}
    </Button>
  );
};

export const Invitados = () => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
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

  // Cargar datos del usuario
  const loadUserData = useCallback(async () => {
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
  }, []);

  // Inicializa EmailJS y carga datos del usuario
  useEffect(() => {
    emailjs.init(EMAILJS_CONFIG.USER_ID);
    loadUserData();
  }, [loadUserData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [name]: value }
    }));
  };

  const generarQRDataURL = useCallback(async (data) => {
    try {
      return await QRCode.toDataURL(JSON.stringify(data), {
        width: isMobile ? 150 : 200,
        margin: 2,
        errorCorrectionLevel: 'H'
      });
    } catch (error) {
      console.error("Error generando QR:", error);
      return '';
    }
  }, [isMobile]);

  const enviarPorCorreo = useCallback(async (invitadoData) => {
    try {
      const emailDestino = invitadoData.email || userData?.email;
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
  }, [generarQRDataURL, userData]);

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
        telefonoInvitador: userData.numerotelefono || '',
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
      
      Swal.fire('Éxito', 'Invitado agregado correctamente', 'success');
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
        email: invitado.email || userData?.email || ''
      },
      qrImageUrl: qrImage
    }));
  };

  const enviarPorWhatsApp = useCallback(() => {
    if (!currentQR) return;
    
    const mensaje = `✅ *Invitación Verificada* ✅\n\n` +
      `🔹 *Invitado:* ${currentQR.nombre}\n` +
      `🔹 *DNI:* ${currentQR.dni}\n` +
      `🔹 *Patente:* ${currentQR.patente}\n` +
      `🔹 *Lote:* ${currentQR.lote}\n` +
      `🔹 *Anfitrión:* ${currentQR.invitador}\n\n` +
      `*Fecha:* ${new Date(currentQR.fecha).toLocaleString()}`;
    
    window.open(`https://wa.me/${currentQR.telefono}?text=${encodeURIComponent(mensaje)}`);
    setState(prev => ({ ...prev, showQRModal: false }));
  }, [currentQR]);

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
          telefonoPropietario: userData.numerotelefono || '',
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
      mensaje += `🔹 *Teléfono:* ${userData.numerotelefono || 'No registrado'}\n\n`;
      mensaje += `*INVITADOS (${lista.invitados.length})*\n`;
      
      lista.invitados.forEach((inv, index) => {
        mensaje += `▸ ${index+1}. ${inv.nombre} | DNI: ${inv.dni} | Patente: ${inv.patente}\n`;
      });

      window.open(`https://wa.me/${telefonoGuardia}?text=${encodeURIComponent(mensaje)}`);
    }
  };

  const compartir = {
    //enlace: () => {
      //if (!userData) return 'Cargando...';
      
     // const params = new URLSearchParams();
     // params.append('lote', `${userData.manzana}-${userData.lote}`);
      //params.append('invitador', encodeURIComponent(userData.nombre));
      //if (userData.numerotelefono) params.append('telefono', userData.numerotelefono);
      
    //  return `${window.location.origin}/pages/invitacion.html?${params.toString()}`;
    //}
    enlace: () => {
  if (!userData) return 'Cargando...';

 // return `${window.location.origin}/pages/invitacion.html?id=${userData.idPublico}`;
  const loteID = `${userData.idPublico}`;
  return `${window.location.origin}/pages/invitacion.html?idPublico=${encodeURIComponent(loteID)}`;
}
,

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
    <div className="container mt-3 mb-5">
      <h2 className="mb-4 text-center">Sistema de Invitaciones</h2>
      
      {/* Tarjeta de compartir enlace */}
      <Card className="mb-4 shadow-sm bg-info">
        <Card.Body>
          <Card.Title className="text-center">Compartir formulario de invitación</Card.Title>
          <Card.Text className={`text-center mb-3 ${userData?.numerotelefono ? 'text-success' : 'text-warning'}`}>
            {userData?.numerotelefono ? (
              'El enlace incluye tu contacto para confirmaciones'
            ) : (
              <>
                <FaQrcode className="me-1" /> Advertencia: Registra tu teléfono para recibir notificaciones
              </>
            )}
          </Card.Text>
          
          <InputGroup className="mb-3">
            <Form.Control 
              value={compartir.enlace()} 
              readOnly 
              className="border-end-0"
            />
            <Button 
              variant="outline-primary" 
              onClick={compartir.copiar}
              className="border-start-2"
            >
              <FaCopy /> {!isMobile && 'Copiar'}
            </Button>
          </InputGroup>
          
          <div className="d-grid gap-2">
            <ResponsiveButton 
              variant="success" 
              onClick={compartir.porWhatsapp} 
              className="text-white"
              icon={<FaWhatsapp />}
              label="Compartir por WhatsApp"
            />
          </div>
        </Card.Body>
      </Card>

      {/* Formulario de invitado */}
      <Card className="mb-4 shadow-sm bg-transparent">
        <Card.Body>
          <Card.Title className="text-center mb-4">Agregar nuevo invitado</Card.Title>
          <Form onSubmit={agregarInvitado}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nombre completo*</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Juan Pérez"
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
                    placeholder="XX-XXX-XX"
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
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Mensaje adicional</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleChange}
                    rows={isMobile ? 2 : 3}
                    placeholder="Instrucciones especiales para tu invitado"
                  />
                </Form.Group>
              </Col>
              
              <Col xs={12} className="mt-2">
                <ResponsiveButton 
                  variant="primary" 
                  type="submit" 
                  className="w-100"
                  icon={<FaPlusCircle />}
                  label="Agregar Invitado"
                />
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Lista de invitados */}
      {invitados.length > 0 && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
              <Card.Title className="mb-2">Invitados registrados ({invitados.length})</Card.Title>
              <ResponsiveButton 
                variant="success" 
                onClick={() => setState(prev => ({
                  ...prev,
                  nuevaLista: {
                    nombre: `Lista ${new Date().toLocaleDateString()}`,
                    invitados: [...prev.invitados]
                  },
                  showListModal: true
                }))}
                icon={<FaList />}
                label="Crear lista"
              />
            </div>
            
            <div className="table grid gap-4 col-6 mx-auto">
              <Table responsive striped bordered hover size="sm" variant="warning">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    {!isMobile && <th>DNI</th>}
                    <th>Patente</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {invitados.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.nombre}</td>
                      {!isMobile && <td>{inv.dni}</td>}
                      <td>{inv.patente || '-'}</td>
                      <td className="text-nowrap">
                        <ResponsiveButton
                          variant="success"
                          size="sm"
                          onClick={() => mostrarQR(inv)}
                          className="me-2"
                          icon={<FaQrcode />}
                          title="Generar QR"
                        />
                        <ResponsiveButton
                          variant="info"
                          size="sm"
                          onClick={() => manejarLista.agregarInvitado(inv)}
                          icon={<FaList />}
                          title="Agregar a lista"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Listas guardadas */}
      {listas.length > 0 && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Card.Title className="text-center mb-3">Tus listas guardadas</Card.Title>
            <div className="table-responsive">
              <Table responsive bordered striped hover size="sm" variant="warning">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    {!isMobile && <th>Invitados</th>}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {listas.map((lista) => (
                    <tr key={lista.id}>
                      <td>{lista.nombre}</td>
                      {!isMobile && <td>{lista.invitados.length}</td>}
                      <td>
                        <ResponsiveButton
                          variant="success"
                          className="me-2"
                          onClick={() => manejarLista.enviarLista(lista)}
                          icon={<FaWhatsapp />}
                          title="Enviar lista"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Modal para crear lista */}
      <Modal 
        show={showListModal} 
        onHide={() => setState(prev => ({ ...prev, showListModal: false }))} 
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="w-100 text-center">Crear nueva lista</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-4">
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
              className="py-2"
            />
          </Form.Group>

          <h5 className="mb-3 text-center">
            Invitados en esta lista ({nuevaLista.invitados.length})
          </h5>
          
          {nuevaLista.invitados.length > 0 ? (
            <div className="table-responsive">
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    {!isMobile && <th>DNI</th>}
                    <th>Patente</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {nuevaLista.invitados.map((inv, index) => (
                    <tr key={index}>
                      <td>{inv.nombre}</td>
                      {!isMobile && <td>{inv.dni}</td>}
                      <td>{inv.patente || '-'}</td>
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => manejarLista.eliminarInvitado(index)}
                          title="Eliminar"
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <Alert variant="info" className="text-center">
              No hay invitados en esta lista
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 justify-content-center">
          <Button 
            variant="secondary" 
            onClick={() => setState(prev => ({ ...prev, showListModal: false }))}
            className="me-3"
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={manejarLista.crearLista}
            disabled={!nuevaLista.nombre || nuevaLista.invitados.length === 0}
          >
            <FaShare className="me-2" /> Guardar Lista
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para QR */}
      <Modal 
        show={showQRModal} 
        onHide={() => setState(prev => ({ ...prev, showQRModal: false }))} 
        centered
        size={isMobile ? 'sm' : 'md'}
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="w-100 text-center">
            Invitación para {currentQR?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center pt-0">
          {currentQR && (
            <>
              <img 
                src={qrImageUrl} 
                alt="Código QR de invitación" 
                className="img-fluid mb-3" 
                style={{ maxWidth: isMobile ? '200px' : '250px' }}
              />
              <Form.Group>
                <Form.Label>Email para enviar</Form.Label>
                <Form.Control
                  type="email"
                  value={currentQR.email || ''}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    currentQR: { ...prev.currentQR, email: e.target.value }
                  }))}
                  placeholder="correo@ejemplo.com"
                  className="mb-3"
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 justify-content-center">
          <div className="d-flex flex-wrap justify-content-center gap-2 w-100">
            <ResponsiveButton 
              variant="primary" 
              onClick={() => enviarPorCorreo(currentQR)}
              disabled={!currentQR?.email && !userData.email}
              icon={<FaEnvelope />}
              label="Enviar por Email"
              className="flex-grow-1"
            />
            <ResponsiveButton
              variant="success"
              onClick={enviarPorWhatsApp}
              disabled={!currentQR?.telefono}
              icon={<FaWhatsapp />}
              label="Enviar por WhatsApp"
              className="flex-grow-1"
            />
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};