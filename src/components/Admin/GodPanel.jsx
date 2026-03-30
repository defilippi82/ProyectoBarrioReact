import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Modal, InputGroup, Spinner } from 'react-bootstrap';
import { collection, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase'; 
import { UserContext } from '../Services/UserContext';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPalette, faPlus, faCheckCircle, faGlobe, faSave, 
  faLayerGroup, faUsers, faShieldAlt, faFileInvoiceDollar, 
  faEdit, faIdBadge, faLock, faExclamationTriangle, faTrashAlt
} from '@fortawesome/free-solid-svg-icons';

export const GodPanel = () => {
  const { userData } = useContext(UserContext);
  const [barrios, setBarrios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
  // Estados para Modales
  const [showUIModal, setShowUIModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [barrioUI, setBarrioUI] = useState(null);

  // Estado para nuevo barrio (Full funcionalidades)
  const [newBarrio, setNewBarrio] = useState({
    nombre: '',
    identificador: '',
    colorPrincipal: '#2c3e50',
    colorSecundario: '#18bc9c',
    logoUrl: '',
    plan: 'standard',
    limiteUsuarios: 100,
    estado: 'activo',
    packSocios: true,
    packSeguridad: true,
    packExpensas: false
  });

  // --- 1. VALIDACIÓN DE SEGURIDAD ---
  useEffect(() => {
    const checkAuth = () => {
      const godEmail = import.meta.env.VITE_GOD_EMAIL;
      if (userData && userData.email === godEmail) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
      setLoading(false);
    };
    checkAuth();
  }, [userData]);

  // --- 2. ESCUCHA DE DATOS (Solo si está autorizado) ---
  useEffect(() => {
    if (!authorized) return;

    const unsubscribe = onSnapshot(collection(db, 'configuracionBarrios'), 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBarrios(data);
      },
      (error) => {
        console.error("Error en Snapshot:", error);
        Swal.fire("Error", "Error al conectar con la base de datos", "error");
      }
    );
    return () => unsubscribe();
  }, [authorized]);

  // --- 3. FUNCIONES DE ACTUALIZACIÓN ---
  const updateBarrioField = async (id, field, value) => {
    try {
      const docRef = doc(db, 'configuracionBarrios', id);
      await updateDoc(docRef, { [field]: value });
    } catch (error) {
      Swal.fire("Error", "No se pudo actualizar el campo", "error");
    }
  };

  const handleCreateBarrio = async (e) => {
    e.preventDefault();
    Swal.fire({
      title: 'Creando barrio...',
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const customId = newBarrio.identificador.toLowerCase().trim().replace(/\s+/g, '_');
      
      await setDoc(doc(db, 'configuracionBarrios', customId), {
        ...newBarrio,
        identificador: customId,
        usuariosActuales: 0,
        creadoEn: serverTimestamp()
      });

      Swal.fire("¡Éxito!", "Barrio dado de alta correctamente", "success");
      setShowCreateModal(false);
      setNewBarrio({
        nombre: '', identificador: '', colorPrincipal: '#2c3e50', colorSecundario: '#18bc9c',
        logoUrl: '', plan: 'standard', limiteUsuarios: 100, estado: 'activo',
        packSocios: true, packSeguridad: true, packExpensas: false
      });
    } catch (error) {
      Swal.fire("Error", "No se pudo crear el documento", "error");
    }
  };

  // --- 4. RENDERIZADO CONDICIONAL ---
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <Spinner animation="grow" variant="primary" />
          <p className="mt-3 fw-bold">Verificando Credenciales Maestro...</p>
        </div>
      </Container>
    );
  }

  if (!authorized) {
    return (
      <Container className="text-center py-5 mt-5">
        <div className="p-5 bg-white rounded-4 shadow-lg d-inline-block">
          <FontAwesomeIcon icon={faLock} size="5x" className="text-danger mb-4" />
          <h1 className="fw-bold">ACCESO RESTRINGIDO</h1>
          <p className="text-muted">Tu cuenta no tiene privilegios para acceder al Panel Maestro.</p>
          <Button variant="dark" size="lg" onClick={() => window.location.href = '/'}>SALIR DE AQUÍ</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5 mt-4 min-vh-100 px-lg-5" fluid>
      {/* HEADER DASHBOARD */}
      <div className="bg-dark text-white p-4 rounded-4 shadow-lg mb-5 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 border-bottom border-primary border-5">
        <div>
          <h2 className="fw-bold mb-1"><FontAwesomeIcon icon={faGlobe} className="me-2 text-primary"/>Terminal de Control God</h2>
          <p className="mb-0 opacity-75">Administración central de infraestructura CUBE</p>
        </div>
        <Button variant="primary" size="lg" className="fw-bold px-4 py-3 rounded-3" onClick={() => setShowCreateModal(true)}>
          <FontAwesomeIcon icon={faPlus} className="me-2" /> REGISTRAR NUEVO BARRIO
        </Button>
      </div>

      <Row className="g-4">
        {barrios.map(barrio => (
          <Col xl={4} lg={6} md={12} key={barrio.id}>
            <Card className="shadow border-0 rounded-4 overflow-hidden h-100 border-top border-5" style={{ borderTopColor: barrio.colorPrincipal || '#2c3e50' }}>
              <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <Badge pill className={`px-3 py-2 ${barrio.estado === 'activo' ? 'bg-success' : 'bg-danger'}`}>
                  {(barrio.estado || 'activo').toUpperCase()}
                </Badge>
                <code className="text-muted"><FontAwesomeIcon icon={faIdBadge} className="me-1"/> {barrio.id}</code>
              </Card.Header>

              <Card.Body className="px-4 pb-4">
                <h4 className="fw-bold text-dark mb-4">{barrio.nombre}</h4>
                
                {/* BLOQUE PLANES */}
                <div className="bg-light p-3 rounded-4 mb-4 border">
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">PLAN DE SERVICIO</Form.Label>
                    <Form.Select 
                      className="form-control-lg border-0 shadow-sm"
                      value={barrio.plan || 'standard'} 
                      onChange={(e) => updateBarrioField(barrio.id, 'plan', e.target.value)}
                    >
                      <option value="standard">Standard Pack</option>
                      <option value="full">Full Premium</option>
                      <option value="seguridad">Solo Seguridad</option>
                    </Form.Select>
                  </Form.Group>

                  <Row className="g-2 text-center">
                    <Col xs={6}>
                      <div className="p-2 bg-white rounded border">
                        <small className="d-block fw-bold text-muted">USUARIOS</small>
                        <span className="h4 fw-bold text-primary">{barrio.usuariosActuales || 0}</span>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="p-2 bg-white rounded border">
                        <small className="d-block fw-bold text-muted">LÍMITE</small>
                        <Form.Control 
                          type="number" 
                          className="fw-bold text-center border-0 p-0"
                          defaultValue={barrio.limiteUsuarios || 100} 
                          onBlur={(e) => updateBarrioField(barrio.id, 'limiteUsuarios', parseInt(e.target.value))}
                        />
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* GESTIÓN DE PACKS */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3 text-secondary border-bottom pb-2">
                    <FontAwesomeIcon icon={faLayerGroup} className="me-2"/> Módulos Independientes
                  </h6>
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex justify-content-between align-items-center p-2 rounded hover-bg-light border">
                      <span className="small fw-semibold"><FontAwesomeIcon icon={faUsers} className="me-2 text-muted"/> Pack Socios</span>
                      <Form.Check type="switch" checked={barrio.packSocios ?? true} onChange={(e) => updateBarrioField(barrio.id, 'packSocios', e.target.checked)} />
                    </div>
                    <div className="d-flex justify-content-between align-items-center p-2 rounded hover-bg-light border">
                      <span className="small fw-semibold"><FontAwesomeIcon icon={faShieldAlt} className="me-2 text-muted"/> Pack Seguridad</span>
                      <Form.Check type="switch" checked={barrio.packSeguridad ?? true} onChange={(e) => updateBarrioField(barrio.id, 'packSeguridad', e.target.checked)} />
                    </div>
                    <div className="d-flex justify-content-between align-items-center p-2 rounded hover-bg-light border">
                      <span className="small fw-semibold"><FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2 text-muted"/> Pack Expensas</span>
                      <Form.Check type="switch" checked={barrio.packExpensas ?? false} onChange={(e) => updateBarrioField(barrio.id, 'packExpensas', e.target.checked)} />
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <Button variant="outline-dark" className="py-2 fw-bold" onClick={() => { setBarrioUI(barrio); setShowUIModal(true); }}>
                    <FontAwesomeIcon icon={faPalette} className="me-2" /> PERSONALIZAR UI & NOMBRE
                  </Button>
                </div>
              </Card.Body>

              <Card.Footer className="bg-light border-0 py-3 d-flex justify-content-between align-items-center">
                <Form.Select 
                  size="sm" 
                  className="w-auto border-0 bg-transparent text-muted fw-bold"
                  value={barrio.estado || 'activo'}
                  onChange={(e) => updateBarrioField(barrio.id, 'estado', e.target.value)}
                >
                  <option value="activo">ACTIVO</option>
                  <option value="suspendido">SUSPENDIDO</option>
                  <option value="mantenimiento">MANTENIMIENTO</option>
                </Form.Select>
                <small className="text-muted opacity-50">Rev. 2026</small>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>

      {/* MODAL: ALTA DE BARRIO COMPLETO */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered scrollable>
        <Modal.Header closeButton className="bg-dark text-white border-0"><Modal.Title className="fw-bold">Alta de Nueva Instancia CUBE</Modal.Title></Modal.Header>
        <Modal.Body className="p-4 bg-light">
          <Form onSubmit={handleCreateBarrio}>
            <Row className="g-3">
              <Col md={7}>
                <Form.Group><Form.Label className="fw-bold">Nombre del Barrio</Form.Label>
                <Form.Control required size="lg" placeholder="Ej: Los Olivos" onChange={e => setNewBarrio({...newBarrio, nombre: e.target.value})} /></Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group><Form.Label className="fw-bold">ID URL (Slug)</Form.Label>
                <Form.Control required size="lg" placeholder="ej: los_olivos" onChange={e => setNewBarrio({...newBarrio, identificador: e.target.value})} /></Form.Group>
              </Col>
              <Col md={6}>
                <Form.Label className="fw-bold">Color Principal</Form.Label>
                <InputGroup><Form.Control type="color" value={newBarrio.colorPrincipal} onChange={e => setNewBarrio({...newBarrio, colorPrincipal: e.target.value})} /><Form.Control value={newBarrio.colorPrincipal} readOnly /></InputGroup>
              </Col>
              <Col md={6}>
                <Form.Label className="fw-bold">Color Secundario</Form.Label>
                <InputGroup><Form.Control type="color" value={newBarrio.colorSecundario} onChange={e => setNewBarrio({...newBarrio, colorSecundario: e.target.value})} /><Form.Control value={newBarrio.colorSecundario} readOnly /></InputGroup>
              </Col>
              <Col md={12}>
                <Form.Label className="fw-bold">Logo URL (PNG Transparente)</Form.Label>
                <Form.Control placeholder="https://..." onChange={e => setNewBarrio({...newBarrio, logoUrl: e.target.value})} />
              </Col>
              <Col md={6}>
                <Form.Label className="fw-bold">Plan Inicial</Form.Label>
                <Form.Select onChange={e => setNewBarrio({...newBarrio, plan: e.target.value})}>
                  <option value="standard">Standard Pack</option>
                  <option value="full">Full Premium</option>
                  <option value="seguridad">Solo Seguridad</option>
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label className="fw-bold">Cupo Usuarios</Form.Label>
                <Form.Control type="number" defaultValue="100" onChange={e => setNewBarrio({...newBarrio, limiteUsuarios: parseInt(e.target.value)})} />
              </Col>
            </Row>
            <Button variant="primary" type="submit" className="w-100 mt-4 py-3 fw-bold shadow-lg">CREAR Y DESPLEGAR INSTANCIA</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* MODAL: PERSONALIZAR UI & NOMBRE (CORREGIDO) */}
      {barrioUI && (
        <Modal show={showUIModal} onHide={() => setShowUIModal(false)} centered>
          <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">Editor de Identidad: {barrioUI.nombre}</Modal.Title></Modal.Header>
          <Modal.Body className="p-4">
            <Form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const docRef = doc(db, 'configuracionBarrios', barrioUI.id);
                await updateDoc(docRef, {
                  nombre: barrioUI.nombre || '',
                  colorPrincipal: barrioUI.colorPrincipal || '#2c3e50',
                  colorSecundario: barrioUI.colorSecundario || '#18bc9c',
                  logoUrl: barrioUI.logoUrl || ''
                });
                Swal.fire("¡Listo!", "Identidad actualizada correctamente", "success");
                setShowUIModal(false);
              } catch (err) { Swal.fire("Error", "No se pudo actualizar la configuración", "error"); }
            }}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Nombre Visible</Form.Label>
                <Form.Control size="lg" value={barrioUI.nombre || ''} onChange={e => setBarrioUI({...barrioUI, nombre: e.target.value})} />
              </Form.Group>
              
              <Row className="g-3 mb-3">
                <Col xs={6}>
                  <Form.Label className="small fw-bold">Color Primario</Form.Label>
                  <Form.Control type="color" className="w-100" value={barrioUI.colorPrincipal || '#2c3e50'} onChange={e => setBarrioUI({...barrioUI, colorPrincipal: e.target.value})} />
                </Col>
                <Col xs={6}>
                  <Form.Label className="small fw-bold">Color Secundario</Form.Label>
                  <Form.Control type="color" className="w-100" value={barrioUI.colorSecundario || '#18bc9c'} onChange={e => setBarrioUI({...barrioUI, colorSecundario: e.target.value})} />
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">URL del Logo</Form.Label>
                <Form.Control 
                  value={barrioUI.logoUrl || ''} 
                  placeholder="https://..."
                  onChange={e => setBarrioUI({...barrioUI, logoUrl: e.target.value})} 
                />
              </Form.Group>

              <Button variant="dark" type="submit" className="w-100 py-3 fw-bold">GUARDAR CONFIGURACIÓN</Button>
            </Form>
          </Modal.Body>
        </Modal>
      )}
    </Container>
  );
};