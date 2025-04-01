import React, { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import Swal from 'sweetalert2';
import { Table, Button, Form, Modal, Row, Col, InputGroup, Card, Spinner, Alert } from 'react-bootstrap';
import { FaWhatsapp, FaCopy, FaList, FaPlusCircle, FaEnvelope, FaQrcode } from 'react-icons/fa';
import QRCode from 'qrcode.react';
import emailjs from 'emailjs-com';

emailjs.init("f.defilippi@gmail.com"); // Reemplaza con tu User ID
const EMAILJS_CONFIG = {
  SERVICE_ID: "service_invitado",       // Reemplaza con tu Service ID
  TEMPLATE_ID: "template_listainvitados",     // Reemplaza con tu Template ID
  USER_ID: "f.defilippi@gmail.com"      // Reemplaza con tu User ID
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
    currentQR: null
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
    currentQR
  } = state;

  // Inicializa EmailJS
  useEffect(() => {
    emailjs.init("service_invitado");
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

  const agregarInvitado = async (e) => {
    e.preventDefault();
    const { nombre, dni, patente, email, telefono } = formData;
    
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
        telefonoInvitador: userData.telefono || '',
        estado: 'pendiente'
      };
  
      // Guarda en Firestore
      const docRef = await addDoc(collection(db, 'invitados'), nuevoInvitado);
      
      // Envía el correo electrónico
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

  const generarDatosQR = (invitado) => {
    return {
      nombre: invitado.nombre,
      dni: invitado.dni,
      patente: invitado.patente,
      lote: `${userData.manzana}-${userData.lote}`,
      invitador: userData.nombre,
      fecha: new Date().toISOString(),
      valido: true
    };
  };
  const [qrModal, setQrModal] = useState({
    show: false,
    data: null,
    email: ''
  });
  
  // Función para mostrar el QR
  const mostrarQR = (invitado) => {
    setQrModal({
      show: true,
      data: invitado,
      email: invitado.email || userData.email || ''
    });
  };
  
  // Modal para QR
  const QRModal = () => (
    <Modal show={qrModal.show} onHide={() => setQrModal({...qrModal, show: false})} centered>
      <Modal.Header closeButton>
        <Modal.Title>Invitación para {qrModal.data?.nombre}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        {qrModal.data && (
          <>
            <QRCode 
              value={JSON.stringify(qrModal.data)} 
              size={200}
              level="H"
              includeMargin={true}
            />
            <Form.Group className="mt-3">
              <Form.Label>Email para enviar</Form.Label>
              <Form.Control
                type="email"
                value={qrModal.email}
                onChange={(e) => setQrModal({...qrModal, email: e.target.value})}
                placeholder="correo@ejemplo.com"
              />
            </Form.Group>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="primary" 
          onClick={async () => {
            await enviarPorCorreo({
              ...qrModal.data,
              email: qrModal.email
            });
            setQrModal({...qrModal, show: false});
          }}
        >
          <FaEnvelope /> Enviar por Email
        </Button>
        <Button 
          variant="success"
          onClick={() => {
            const mensaje = `Hola ${qrModal.data.nombre}, aquí está tu invitación. Presenta este código QR al llegar:\n\nLote: ${qrModal.data.lote}\nAnfitrión: ${userData.nombre}`;
            window.open(`https://wa.me/${qrModal.data.telefono}?text=${encodeURIComponent(mensaje)}`);
          }}
          disabled={!qrModal.data?.telefono}
        >
          <FaWhatsapp /> Enviar por WhatsApp
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const generarQR = (data) => {
    return (
      <div className="text-center my-3 p-2 border rounded">
        <QRCode 
          value={JSON.stringify(data)} 
          size={200}
          level="H"
          includeMargin={true}
        />
        <p className="mt-2 small text-muted">Válido por 48 horas</p>
      </div>
    );
  };

  const compartirInvitacionQR = (invitado) => {
    const qrData = invitado.qrData || generarDatosQR(invitado);
    setState(prev => ({ ...prev, showQRModal: true, currentQR: qrData }));
  };

  const enviarPorWhatsApp = () => {
    const mensaje = `✅ *Invitación Verificada* ✅\n\n` +
      `🔹 *Invitado:* ${currentQR.nombre}\n` +
      `🔹 *DNI:* ${currentQR.dni}\n` +
      `🔹 *Patente:* ${currentQR.patente}\n` +
      `🔹 *Lote:* ${currentQR.lote}\n` +
      `🔹 *Anfitrión:* ${currentQR.invitador}\n\n` +
      `*Fecha:* ${new Date(currentQR.fecha).toLocaleString()}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`);
    setState(prev => ({ ...prev, showQRModal: false }));
  };

  const enviarPorCorreo = async (invitadoData) => {
    try {
      // Genera el QR como Data URL
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, JSON.stringify(invitadoData), { 
        width: 200,
        margin: 2
      });
      const qrImageUrl = canvas.toDataURL();
  
      // Prepara los parámetros para el email
      const templateParams = {
        nombre_invitado: invitadoData.nombre,
        nombre_anfitrion: userData.nombre,
        lote: invitadoData.lote,
        fecha: new Date(invitadoData.fecha).toLocaleDateString(),
        qr_image_url: qrImageUrl,
        email_invitado: invitadoData.email || userData.email // Fallback al email del usuario
      };
  
      // Envía el email
      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAILJS_CONFIG.USER_ID
      );
  
      Swal.fire({
        icon: 'success',
        title: 'Invitación enviada',
        text: `Se ha enviado el QR a ${templateParams.email_invitado}`,
        timer: 3000
      });
    } catch (error) {
      console.error("Error al enviar email:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo enviar el correo. Por favor intenta nuevamente.',
      });
    }
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
          telefonoPropietario: userData.telefono || '',
          fecha: new Date().toISOString(),
          estado: 'pendiente',
          qrData: generarDatosQR({ nombre: 'Lista: ' + nuevaLista.nombre, dni: 'multiple' })
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
      Swal.fire({
        title: 'Enviar lista de invitados',
        html: `¿Cómo deseas enviar la lista <strong>${lista.nombre}</strong> con ${lista.invitados.length} invitados?`,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: '<FaWhatsapp /> WhatsApp',
        denyButtonText: '<FaEnvelope /> Email',
        cancelButtonText: 'Cancelar',
        icon: 'question',
        customClass: {
          confirmButton: 'btn btn-success me-2',
          denyButton: 'btn btn-primary me-2',
          cancelButton: 'btn btn-secondary'
        },
        buttonsStyling: false
      }).then((result) => {
        if (result.isConfirmed) {
          const telefonoGuardia = "+5491167204232";
          let mensaje = `*LISTA DE INVITADOS - ${lista.nombre}*\n\n`;
          mensaje += `🔹 *Lote:* ${userData.manzana}-${userData.lote}\n`;
          mensaje += `🔹 *Propietario:* ${userData.nombre}\n`;
          mensaje += `🔹 *Teléfono:* ${userData.telefono || 'No registrado'}\n\n`;
          mensaje += `*INVITADOS (${lista.invitados.length})*\n`;
          
          lista.invitados.forEach((inv, index) => {
            mensaje += `▸ ${index+1}. ${inv.nombre} | DNI: ${inv.dni} | Patente: ${inv.patente}\n`;
          });

          window.open(`https://wa.me/${telefonoGuardia}?text=${encodeURIComponent(mensaje)}`);
        } else if (result.isDenied) {
          setState(prev => ({ ...prev, currentQR: lista.qrData, showQRModal: true }));
        }
      });
    }
  };

  const compartir = {
    enlace: () => {
      if (!userData) return 'Cargando...';
      
      const params = new URLSearchParams();
      params.append('lote', `${userData.manzana}-${userData.lote}`);
      params.append('invitador', encodeURIComponent(userData.nombre));
      if (userData.telefono) params.append('telefono', userData.telefono);
      
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
            <Button variant="outline-danger" onClick={() => window.location.href = '/login'}>
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
            {userData?.telefono ? (
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
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Patente</th>
                <th>Acciones</th> {/* Columna donde irán los botones */}
              </tr>
            </thead>
            <tbody>
              {invitados.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.nombre}</td>
                  <td>{inv.dni}</td>
                  <td>{inv.patente || '-'}</td>
                  <td>
                    {/* Botón QR que agregamos */}
                    <Button 
                      variant="success" 
                      size="sm" 
                      onClick={() => mostrarQR(inv)}
                      className="me-2"
                      title="Generar QR"
                    >
                      <FaQrcode /> QR
                    </Button>
                    
                    {/* Otros botones que ya tengas */}
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
                {listas.map((lista, index) => (
                  <tr key={index}>
                    <td>{lista.nombre}</td>
                    <td>{lista.invitados.length}</td>
                    <td className="text-nowrap">
                      <Button
                        variant="success"
                        className="me-2"
                        onClick={() => manejarLista.enviarLista(lista)}
                        title="Enviar lista"
                      >
                        <FaWhatsapp />
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          setState(prev => ({ 
                            ...prev, 
                            showQRModal: true,
                            currentQR: lista.qrData 
                          }));
                        }}
                        title="Ver QR"
                      >
                        <FaQrcode />
                      </Button>
                      
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Modal para crear lista */}
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
            <div className="table-responsive">
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
            </div>
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

      {/* Modal para QR */}
      <Modal show={showQRModal} onHide={() => setState(prev => ({ ...prev, showQRModal: false }))} centered>
        <Modal.Header closeButton>
          <Modal.Title>Invitación con QR</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {currentQR && generarQR(currentQR)}
          <p className="mb-3">Presenta este código para el ingreso</p>
          
          <div className="d-flex justify-content-center gap-3">
            {currentQR?.nombre && (
              <Button variant="success" onClick={enviarPorWhatsApp}>
                <FaWhatsapp className="me-2" /> Enviar por WhatsApp
              </Button>
            )}
            <Button variant="primary" onClick={enviarPorCorreo}>
              <FaEnvelope className="me-2" /> Enviar por Email
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <small className="text-muted">
            Código válido hasta: {new Date(new Date(currentQR?.fecha).getTime() + 48*60*60*1000).toLocaleString()}
          </small>
        </Modal.Footer>
      </Modal>
      <QRModal />
    </div>
  );
};