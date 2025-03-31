import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import Swal from 'sweetalert2';
import { Table, Button, Form, Modal, Row, Col, InputGroup, Card, Spinner, Alert } from 'react-bootstrap';
import { FaWhatsapp, FaCopy, FaList, FaPlusCircle } from 'react-icons/fa';

export const Invitados = () => {
  // Estados consolidados
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
    }
  });

  // Destructuración para facilitar el acceso
  const {
    formData,
    userData,
    loading,
    error,
    invitados,
    showListModal,
    listas,
    nuevaLista
  } = state;

  // Cargar datos del usuario - efecto único
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataFromStorage = localStorage.getItem('userData');
        
        if (!userDataFromStorage) {
          throw new Error('No se encontraron datos de usuario');
        }
        
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

  // Manejador de cambios genérico
  const handleChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [name]: value }
    }));
  };

  // Funciones de invitados
  const agregarInvitado = async (e) => {
    e.preventDefault();
    const { nombre, dni, patente } = formData;
    
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
        estado: 'pendiente'
      };

      await addDoc(collection(db, 'invitados'), nuevoInvitado);
      
      setState(prev => ({
        ...prev,
        invitados: [...prev.invitados, nuevoInvitado],
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

  // Funciones de listas
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
      let mensaje = `*LISTA DE INVITADOS - ${lista.nombre}*\n`;
      mensaje += `Lote: ${userData.manzana}-${userData.lote}\n`;
      mensaje += `Propietario: ${userData.nombre}\n\n*Invitados:*\n`;
      
      lista.invitados.forEach((inv, index) => {
        mensaje += `${index + 1}. ${inv.nombre} - DNI: ${inv.dni} - Patente: ${inv.patente}\n`;
      });

      window.open(`https://api.whatsapp.com/send?phone=${telefonoGuardia}&text=${encodeURIComponent(mensaje)}`);
    }
  };

  // Funciones de compartir
  const compartir = {
    enlace: () => {
      if (!userData) return 'Cargando...';
      return `${window.location.origin}/pages/invitacion.html`
      // `${window.location.origin}/invitacion.html?lote=${userData.manzana}-${userData.lote}&invitador=${encodeURIComponent(userData.nombre)}`;
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

  // Renderizado condicional
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

  // Renderizado principal
  return (
    <div className="container mt-4">
      <h2 className="mb-4">Sistema de Invitaciones</h2>
      
      {/* Tarjeta para compartir */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Card.Title>Compartir formulario de invitación</Card.Title>
          <Card.Text className="mb-3">Envía este enlace a tus invitados:</Card.Text>
          
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

      {/* Formulario para agregar invitados */}
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
              />
            </Form.Group>
          </Col>
          
          <Col xs={12}>
            <Button variant="primary" type="submit" className="w-100">
              Agregar Invitado
            </Button>
          </Col>
        </Row>
      </Form>

      {/* Lista de invitados actuales */}
      {invitados.length > 0 && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Card.Title>Invitados actuales ({invitados.length})</Card.Title>
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
                <FaPlusCircle /> Crear lista
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
                {invitados.map((inv, index) => (
                  <tr key={index}>
                    <td>{inv.nombre}</td>
                    <td>{inv.dni}</td>
                    <td>{inv.patente}</td>
                    <td>
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => manejarLista.agregarInvitado(inv)}
                      >
                        <FaList /> Agregar a lista
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Listas guardadas */}
      {listas.length > 0 && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Card.Title>Tus listas guardadas</Card.Title>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cantidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {listas.map((lista, index) => (
                  <tr key={index}>
                    <td>{lista.nombre}</td>
                    <td>{lista.invitados.length}</td>
                    <td>
                      <Button
                        variant="success"
                        className="me-2"
                        onClick={() => manejarLista.enviarLista(lista)}
                      >
                        <FaWhatsapp /> Enviar
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
            />
          </Form.Group>

          <h5>Invitados en esta lista ({nuevaLista.invitados.length})</h5>
          {nuevaLista.invitados.length > 0 ? (
            <Table striped bordered hover responsive size="sm">
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
                    <td>{inv.patente}</td>
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
    </div>
  );
};