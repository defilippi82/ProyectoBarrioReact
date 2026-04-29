import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Row, Col, Card, Button, Form, Badge, Modal, 
  Tabs, Tab, InputGroup, Spinner, ListGroup 
} from 'react-bootstrap';
import { collection, onSnapshot, doc, updateDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase'; 
import { UserContext } from '../Services/UserContext';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPalette, faPlus, faSave, faUsers, faExclamationTriangle, 
  faImage, faBars, faCrown, faCogs, faTrash, faCheckCircle 
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
    plan: 'standard',
    limiteUsuarios: 100,
    hasReservas: true,
    hasAlquileres: true,
    hasPanico: true,
    hasMensajeria: true
  });

  // 1. Verificación de Seguridad
  useEffect(() => {
    if (userData && userData.rol?.god) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
  }, [userData]);

  // 2. Escuchar Barrios en tiempo real
  useEffect(() => {
    if (!authorized) return;
    const unsub = onSnapshot(collection(db, "configuracionBarrios"), (snap) => {
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBarrios(lista);
      setLoading(false);
    });
    return () => unsub();
  }, [authorized]);

  // 3. Guardar cambios (Estética + Módulos)
  const handleUpdateUI = async (e) => {
    e.preventDefault();
    try {
      const barrioRef = doc(db, "configuracionBarrios", barrioUI.id);
      await updateDoc(barrioRef, {
        ...barrioUI,
        updatedAt: serverTimestamp()
      });
      setShowUIModal(false);
      Swal.fire("Éxito", "Configuración global actualizada.", "success");
    } catch (error) {
      Swal.fire("Error", "No se pudieron guardar los cambios.", "error");
    }
  };

  // 4. Crear nuevo Barrio
  const handleCreateBarrio = async (e) => {
    e.preventDefault();
    const id = newBarrio.identificador.trim().toLowerCase();
    if (!id) return;

    try {
      await setDoc(doc(db, "configuracionBarrios", id), {
        ...newBarrio,
        identificador: id,
        usuariosActuales: 0,
        createdAt: serverTimestamp()
      });
      setShowCreateModal(false);
      Swal.fire("Creado", `El barrio ${id} ya está operativo.`, "success");
    } catch (error) {
      Swal.fire("Error", "ID duplicado o error de red.", "error");
    }
  };

  // 5. Eliminar Barrio (Opcional, con precaución)
  const deleteBarrio = (id) => {
    Swal.fire({
      title: '¿Eliminar Barrio?',
      text: "Esta acción borrará la configuración, pero no los usuarios.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, borrar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await deleteDoc(doc(db, "configuracionBarrios", id));
      }
    });
  };

  if (!authorized) {
    return (
      <Container className="mt-5 text-center">
        <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="text-danger mb-3" />
        <h3>Acceso Restringido</h3>
        <p>Solo personal autorizado "GOD" puede acceder.</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">
            <FontAwesomeIcon icon={faCrown} className="text-warning me-2" /> Panel God
          </h2>
          <Badge bg="info">Modo Multi-Tenant Activo</Badge>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <FontAwesomeIcon icon={faPlus} className="me-2" /> Registrar Barrio
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : (
        <Row className="g-4">
          {barrios.map(barrio => (
            <Col key={barrio.id} md={6} lg={4}>
              <Card className="h-100 shadow-sm border-0 position-relative">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Badge bg="dark">{barrio.identificador}</Badge>
                    <Button variant="link" className="text-danger p-0" onClick={() => deleteBarrio(barrio.id)}>
                      <FontAwesomeIcon icon={faTrash} size="sm"/>
                    </Button>
                  </div>
                  <Card.Title className="fw-bold">{barrio.nombre}</Card.Title>
                  
                  <ListGroup variant="flush" className="small mb-3">
                    <ListGroup.Item className="px-0 py-1">
                      <FontAwesomeIcon icon={faUsers} className="me-2 text-muted"/> 
                      Capacidad: {barrio.usuariosActuales || 0} / {barrio.limiteUsuarios || 100}
                    </ListGroup.Item>
                    <ListGroup.Item className="px-0 py-1 text-capitalize">
                      <FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success"/> 
                      Plan: {barrio.plan || 'Standard'}
                    </ListGroup.Item>
                  </ListGroup>

                  <div className="d-flex gap-2 mb-3">
                    <div title="Principal" className="border shadow-sm" style={{ width: 25, height: 25, borderRadius: 5, backgroundColor: barrio.colorPrincipal }}></div>
                    <div title="Navbar" className="border shadow-sm" style={{ width: 25, height: 25, borderRadius: 5, backgroundColor: barrio.colorNavbar || '#343a40' }}></div>
                  </div>

                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="w-100"
                    onClick={() => { setBarrioUI(barrio); setShowUIModal(true); }}
                  >
                    <FontAwesomeIcon icon={faCogs} className="me-2" /> Configuración Maestra
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* MODAL CONFIGURACIÓN MAESTRA */}
      <Modal show={showUIModal} onHide={() => setShowUIModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title><FontAwesomeIcon icon={faCrown} className="me-2 text-warning"/> Gestión de {barrioUI?.nombre}</Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleUpdateUI}>
          <Modal.Body>
            <Tabs defaultActiveKey="estetica" id="config-tabs" className="mb-4">
              
              {/* --- PESTAÑA: ESTÉTICA --- */}
              <Tab eventKey="estetica" title={<span><FontAwesomeIcon icon={faPalette} className="me-1"/> Apariencia</span>}>
                <Row>
                  <Col md={7}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold small">Nombre Público</Form.Label>
                      <Form.Control 
                        value={barrioUI?.nombre || ''} 
                        onChange={e => setBarrioUI({...barrioUI, nombre: e.target.value})} 
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold small">Logo URL</Form.Label>
                      <Form.Control 
                        value={barrioUI?.logoUrl || ''} 
                        onChange={e => setBarrioUI({...barrioUI, logoUrl: e.target.value})} 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                     <Form.Label className="fw-bold small">Colores de Marca</Form.Label>
                     <div className="d-flex gap-2 mb-3">
                        <Form.Control type="color" title="Primario" value={barrioUI?.colorPrincipal || '#2c3e50'} onChange={e => setBarrioUI({...barrioUI, colorPrincipal: e.target.value})} />
                        <Form.Control type="color" title="Secundario" value={barrioUI?.colorSecundario || '#18bc9c'} onChange={e => setBarrioUI({...barrioUI, colorSecundario: e.target.value})} />
                        <Form.Control type="color" title="Navbar" value={barrioUI?.colorNavbar || '#343a40'} onChange={e => setBarrioUI({...barrioUI, colorNavbar: e.target.value})} />
                     </div>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small"><FontAwesomeIcon icon={faImage} className="me-1"/> Imagen de Fondo (Wallpaper)</Form.Label>
                  <Form.Control 
                    value={barrioUI?.fondoUrl || ''} 
                    placeholder="URL de la imagen o dejar vacío para degradado"
                    onChange={e => setBarrioUI({...barrioUI, fondoUrl: e.target.value})} 
                  />
                </Form.Group>
              </Tab>

              {/* --- PESTAÑA: FUNCIONALIDADES --- */}
              <Tab eventKey="modulos" title={<span><FontAwesomeIcon icon={faCogs} className="me-1"/> Módulos</span>}>
                <div className="p-3 bg-light rounded border mb-3">
                  <Form.Label className="fw-bold text-primary">Plan de Negocio</Form.Label>
                  <Form.Select 
                    value={barrioUI?.plan || 'standard'} 
                    onChange={e => setBarrioUI({...barrioUI, plan: e.target.value})}
                  >
                    <option value="standard">Standard (Vecinos)</option>
                    <option value="seguridad">Seguridad (Guardias)</option>
                    <option value="full">Full Premium (Todo)</option>
                  </Form.Select>
                </div>

                <h6 className="fw-bold mb-3">Interruptores de Módulos (Feature Flags)</h6>
                <Row>
                  <Col sm={6}>
                    <Form.Check type="switch" label="Sistema de Reservas" className="mb-2" checked={!!barrioUI?.hasReservas} onChange={e => setBarrioUI({...barrioUI, hasReservas: e.target.checked})} />
                    <Form.Check type="switch" label="Avisos de Alquiler" className="mb-2" checked={!!barrioUI?.hasAlquileres} onChange={e => setBarrioUI({...barrioUI, hasAlquileres: e.target.checked})} />
                  </Col>
                  <Col sm={6}>
                    <Form.Check type="switch" label="Botón de Pánico" className="mb-2" checked={!!barrioUI?.hasPanico} onChange={e => setBarrioUI({...barrioUI, hasPanico: e.target.checked})} />
                    <Form.Check type="switch" label="Mensajería Interna" className="mb-2" checked={!!barrioUI?.hasMensajeria} onChange={e => setBarrioUI({...barrioUI, hasMensajeria: e.target.checked})} />
                  </Col>
                </Row>

                <hr />
                <Form.Group>
                  <Form.Label className="fw-bold small">Límite de Usuarios Registrados</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type="number" 
                      value={barrioUI?.limiteUsuarios || 100} 
                      onChange={e => setBarrioUI({...barrioUI, limiteUsuarios: parseInt(e.target.value)})}
                    />
                    <InputGroup.Text>Suscritos</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Tab>
            </Tabs>
          </Modal.Body>
          
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUIModal(false)}>Cerrar</Button>
            <Button variant="primary" type="submit">
              <FontAwesomeIcon icon={faSave} className="me-2"/> Aplicar Cambios Globales
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL REGISTRO BARRIO */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Nuevo Barrio en la Red</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateBarrio}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">ID del Barrio (Slug)</Form.Label>
              <Form.Control 
                placeholder="ej: santamaria (sin espacios)" 
                onChange={e => setNewBarrio({...newBarrio, identificador: e.target.value})}
                required 
              />
              <Form.Text className="text-muted">Este ID se usa para el login de los usuarios.</Form.Text>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fw-bold">Nombre Completo</Form.Label>
              <Form.Control 
                placeholder="Ej: Barrio Santa María del Monte" 
                onChange={e => setNewBarrio({...newBarrio, nombre: e.target.value})}
                required 
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" type="submit" className="w-100 py-2">Completar Registro</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};