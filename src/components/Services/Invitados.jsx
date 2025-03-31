import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';
import Swal from 'sweetalert2';
import { Table, Button, Form, Modal, Row, Col, InputGroup, Card } from 'react-bootstrap';
import { FaWhatsapp, FaCopy, FaList, FaPlusCircle } from 'react-icons/fa';

export const Invitados = () => {
  // Estados
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    patente: '',
    email: '',
    telefono: '',
    mensaje: ''
  });
  
  const [userData, setUserData] = useState(null);
  const [invitados, setInvitados] = useState([]);
  const [mostrarQR, setMostrarQR] = useState(null);
  const [showListModal, setShowListModal] = useState(false);
  const [listas, setListas] = useState([]);
  const [nuevaLista, setNuevaLista] = useState({
    nombre: '',
    invitados: []
  });

  // Cargar datos del usuario al iniciar
  useEffect(() => {
    const userDataFromStorage = localStorage.getItem('userData');
    if (userDataFromStorage) {
      setUserData(JSON.parse(userDataFromStorage));
    }
  }, []);

  // Manejadores de cambios
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Agregar invitado
  const agregarInvitado = (e) => {
    e.preventDefault();
    const { nombre, dni, patente } = formData;
    
    if (!nombre || !dni || !patente) {
      Swal.fire('Error', 'Nombre, DNI y Patente son obligatorios', 'error');
      return;
    }

    const nuevoInvitado = {
      ...formData,
      fecha: new Date().toISOString()
    };

    setInvitados([...invitados, nuevoInvitado]);
    setFormData({
      nombre: '',
      dni: '',
      patente: '',
      email: '',
      telefono: '',
      mensaje: ''
    });
  };

  // Generar enlace de invitación
  const generarEnlaceInvitacion = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/invitacion.html?lote=${userData.manzana}-${userData.lote}&invitador=${encodeURIComponent(userData.nombre)}`;
  };

  // Compartir por WhatsApp
  const compartirPorWhatsapp = () => {
    const enlace = generarEnlaceInvitacion();
    const mensaje = `Hola, ${userData.nombre} te está invitando. Por favor completa tus datos aquí: ${enlace}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`);
  };

  // Copiar enlace al portapapeles
  const copiarEnlace = () => {
    navigator.clipboard.writeText(generarEnlaceInvitacion());
    Swal.fire('Copiado', 'El enlace ha sido copiado al portapapeles', 'success');
  };

  // Agregar invitado a lista temporal
  const agregarALista = (invitado) => {
    setNuevaLista(prev => ({
      ...prev,
      invitados: [...prev.invitados, invitado]
    }));
  };

  // Crear lista definitiva
  const crearLista = async () => {
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

      // Guardar en Firestore
      const docRef = await addDoc(collection(db, 'listasInvitados'), listaCompleta);
      
      // Actualizar estado local
      setListas([...listas, { id: docRef.id, ...listaCompleta }]);
      setNuevaLista({ nombre: '', invitados: [] });
      setShowListModal(false);
      
      Swal.fire('Éxito', 'Lista creada correctamente', 'success');
    } catch (error) {
      console.error("Error al crear lista:", error);
      Swal.fire('Error', 'No se pudo crear la lista', 'error');
    }
  };

  // Enviar lista a guardia
  const enviarListaGuardia = (lista) => {
    const telefonoGuardia = "+5491167204232"; // Número de guardia
    let mensaje = `*LISTA DE INVITADOS - ${lista.nombre}*\n`;
    mensaje += `Lote: ${userData.manzana}-${userData.lote}\n`;
    mensaje += `Propietario: ${userData.nombre}\n\n`;
    mensaje += `*Invitados:*\n`;
    
    lista.invitados.forEach((inv, index) => {
      mensaje += `${index + 1}. ${inv.nombre} - DNI: ${inv.dni} - Patente: ${inv.patente}\n`;
    });

    window.open(`https://api.whatsapp.com/send?phone=${telefonoGuardia}&text=${encodeURIComponent(mensaje)}`);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Sistema de Invitaciones</h2>
      
      {/* Tarjeta para compartir formulario */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Card.Title>Compartir formulario de invitación</Card.Title>
          <Card.Text className="mb-3">
            Envía este enlace a tus invitados para que completen sus datos:
          </Card.Text>
          
          <InputGroup className="mb-3">
            <Form.Control 
              value={generarEnlaceInvitacion()} 
              readOnly 
            />
            <Button 
              variant="outline-secondary" 
              onClick={copiarEnlace}
            >
              <FaCopy /> Copiar
            </Button>
          </InputGroup>
          
          <div className="d-grid gap-2">
            <Button 
              variant="success" 
              onClick={compartirPorWhatsapp}
              className="text-white"
            >
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

      {/* Tabla de invitados actuales */}
      {invitados.length > 0 && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Card.Title>Invitados actuales ({invitados.length})</Card.Title>
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
                        className="me-2"
                        onClick={() => agregarALista(inv)}
                      >
                        <FaList /> Agregar a lista
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            <div className="d-grid gap-2 mt-3">
              <Button 
                variant="success" 
                onClick={() => setShowListModal(true)}
              >
                <FaPlusCircle /> Crear lista con estos invitados
              </Button>
            </div>
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
                        onClick={() => enviarListaGuardia(lista)}
                      >
                        <FaWhatsapp /> Enviar a Guardia
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
      <Modal show={showListModal} onHide={() => setShowListModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Crear nueva lista de invitados</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nombre de la lista*</Form.Label>
            <Form.Control
              type="text"
              value={nuevaLista.nombre}
              onChange={(e) => setNuevaLista({...nuevaLista, nombre: e.target.value})}
              placeholder="Ej: Fiesta de cumpleaños"
              required
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
                      <td>{inv.patente}</td>
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setNuevaLista({
                            ...nuevaLista,
                            invitados: nuevaLista.invitados.filter((_, i) => i !== index)
                          })}
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
            <p className="text-muted">No hay invitados en esta lista</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowListModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={crearLista}>
            Guardar Lista
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};