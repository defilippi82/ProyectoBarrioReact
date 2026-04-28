 import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Modal, Spinner } from 'react-bootstrap';
import { collection, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase'; 
import { UserContext } from '../Services/UserContext';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPalette, faPlus, faSave, faUsers, 
  faExclamationTriangle, faImage, faBars, faCrown 
} from '@fortawesome/free-solid-svg-icons';

export const GodPanel = () => {
  const { userData } = useContext(UserContext);
  const [barrios, setBarrios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
  const [showUIModal, setShowUIModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [barrioUI, setBarrioUI] = useState(null);

  const [newBarrio, setNewBarrio] = useState({
    nombre: '',
    identificador: '',
    colorPrincipal: '#2c3e50',
    colorSecundario: '#18bc9c',
    colorNavbar: '#343a40',
    fondoUrl: '',
    logoUrl: '',
    plan: 'standard'
  });

  // 1. Verificación de Seguridad
  useEffect(() => {
    if (userData && userData.rol?.god) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
  }, [userData]);

  // 2. Escuchar Barrios
  useEffect(() => {
    if (!authorized) return;

    const unsub = onSnapshot(collection(db, "configuracionBarrios"), (snap) => {
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBarrios(lista);
      setLoading(false);
    });
    return () => unsub();
  }, [authorized]);

  const handleUpdateUI = async (e) => {
    e.preventDefault();
    try {
      const barrioRef = doc(db, "configuracionBarrios", barrioUI.id);
      await updateDoc(barrioRef, {
        nombre: barrioUI.nombre,
        colorPrincipal: barrioUI.colorPrincipal,
        colorSecundario: barrioUI.colorSecundario,
        colorNavbar: barrioUI.colorNavbar || '#343a40',
        fondoUrl: barrioUI.fondoUrl || '',
        logoUrl: barrioUI.logoUrl || '',
        updatedAt: serverTimestamp()
      });
      setShowUIModal(false);
      Swal.fire("Actualizado", "La estética del barrio ha sido actualizada.", "success");
    } catch (error) {
      Swal.fire("Error", "No se pudieron guardar los cambios.", "error");
    }
  };

  const handleCreateBarrio = async (e) => {
    e.preventDefault();
    if (!newBarrio.identificador) return;

    try {
      await setDoc(doc(db, "configuracionBarrios", newBarrio.identificador.toLowerCase()), {
        ...newBarrio,
        identificador: newBarrio.identificador.toLowerCase(),
        usuariosActuales: 0,
        limiteUsuarios: 100,
        createdAt: serverTimestamp()
      });
      setShowCreateModal(false);
      Swal.fire("Éxito", "Barrio creado correctamente.", "success");
    } catch (error) {
      Swal.fire("Error", "Hubo un problema al crear el barrio.", "error");
    }
  };

  if (!authorized) {
    return (
      <Container className="mt-5 text-center">
        {/* CORRECCIÓN: Usar FontAwesomeIcon en lugar de FaExclamationTriangle */}
        <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="text-danger mb-3" />
        <h3>Acceso Denegado</h3>
        <p>No tienes permisos de Super Administrador para ver este panel.</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">
            <FontAwesomeIcon icon={faCrown} className="text-warning me-2" /> 
            Panel God
          </h2>
          <p className="text-muted">Gestión Multi-Barrio y Configuración Global</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <FontAwesomeIcon icon={faPlus} className="me-2" /> Nuevo Barrio
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : (
        <Row className="g-4">
          {barrios.map(barrio => (
            <Col key={barrio.id} md={6} lg={4}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
                  <Badge bg="dark" className="text-uppercase">{barrio.id}</Badge>
                  <div className="d-flex gap-1">
                    <div title="Principal" style={{ width: 15, height: 15, borderRadius: '50%', backgroundColor: barrio.colorPrincipal }}></div>
                    <div title="Secundario" style={{ width: 15, height: 15, borderRadius: '50%', backgroundColor: barrio.colorSecundario }}></div>
                    <div title="Navbar" style={{ width: 15, height: 15, borderRadius: '50%', backgroundColor: barrio.colorNavbar || '#343a40' }}></div>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Card.Title className="fw-bold">{barrio.nombre}</Card.Title>
                  <div className="small text-muted mb-3">
                    <FontAwesomeIcon icon={faUsers} className="me-2" /> 
                    Usuarios: {barrio.usuariosActuales || 0} / {barrio.limiteUsuarios || 100}
                  </div>
                  <Button 
                    variant="outline-dark" 
                    size="sm" 
                    className="w-100 mb-2"
                    onClick={() => { setBarrioUI(barrio); setShowUIModal(true); }}
                  >
                    <FontAwesomeIcon icon={faPalette} className="me-2" /> Personalizar Estética
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* MODAL PERSONALIZACIÓN */}
      <Modal show={showUIModal} onHide={() => setShowUIModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title><FontAwesomeIcon icon={faPalette} className="me-2" /> Estética de {barrioUI?.nombre}</Modal.Title>
        </Modal.Header>
        {barrioUI && (
          <Form onSubmit={handleUpdateUI}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Nombre a Mostrar</Form.Label>
                    <Form.Control 
                      value={barrioUI.nombre} 
                      onChange={e => setBarrioUI({...barrioUI, nombre: e.target.value})} 
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">URL del Logo</Form.Label>
                    <Form.Control 
                      value={barrioUI.logoUrl || ''} 
                      placeholder="https://..."
                      onChange={e => setBarrioUI({...barrioUI, logoUrl: e.target.value})} 
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3 mb-3">
                <Col xs={4}>
                  <Form.Label className="small fw-bold">Color Primario</Form.Label>
                  <Form.Control type="color" className="w-100" value={barrioUI.colorPrincipal} onChange={e => setBarrioUI({...barrioUI, colorPrincipal: e.target.value})} />
                </Col>
                <Col xs={4}>
                  <Form.Label className="small fw-bold">Color Secundario</Form.Label>
                  <Form.Control type="color" className="w-100" value={barrioUI.colorSecundario} onChange={e => setBarrioUI({...barrioUI, colorSecundario: e.target.value})} />
                </Col>
                <Col xs={4}>
                  <Form.Label className="small fw-bold"><FontAwesomeIcon icon={faBars} className="me-1"/> Color Navbar</Form.Label>
                  <Form.Control type="color" className="w-100" value={barrioUI.colorNavbar || '#343a40'} onChange={e => setBarrioUI({...barrioUI, colorNavbar: e.target.value})} />
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold"><FontAwesomeIcon icon={faImage} className="me-2"/> URL Imagen de Fondo</Form.Label>
                <Form.Control 
                  value={barrioUI.fondoUrl || ''} 
                  placeholder="Ej: https://mi-imagen.jpg"
                  onChange={e => setBarrioUI({...barrioUI, fondoUrl: e.target.value})} 
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowUIModal(false)}>Cerrar</Button>
              <Button variant="primary" type="submit"><FontAwesomeIcon icon={faSave} className="me-2"/> Guardar Cambios</Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>

      {/* MODAL CREAR BARRIO */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Registrar Nuevo Barrio</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateBarrio}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Identificador Único (ID)</Form.Label>
              <Form.Control 
                placeholder="ej: trespinos" 
                onChange={e => setNewBarrio({...newBarrio, identificador: e.target.value})}
                required 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Nombre del Barrio</Form.Label>
              <Form.Control 
                placeholder="Ej: Club de Campo Tres Pinos" 
                onChange={e => setNewBarrio({...newBarrio, nombre: e.target.value})}
                required 
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" type="submit" className="w-100">Crear Barrio</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};