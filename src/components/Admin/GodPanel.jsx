import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Modal, Tabs, Tab, InputGroup, Spinner, ListGroup, Table} from 'react-bootstrap';
import { collection, onSnapshot, doc, updateDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase'; 
import { UserContext } from '../Services/UserContext';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPalette, faPlus, faSave, faUsers, faExclamationTriangle, faImage, faBars, faCrown, faCogs, faTrash, faCheckCircle, faTags, faPhone, faFutbol, faShieldAlt} from '@fortawesome/free-solid-svg-icons';

export const GodPanel = () => {
  const { userData } = useContext(UserContext);
  const [barrios, setBarrios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
  const [showUIModal, setShowUIModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [barrioUI, setBarrioUI] = useState(null);

  // Estructura base para un nuevo barrio
  const templateBarrio = {
    nombre: '',
    identificador: '',
    plan: 'standard',
    limiteUsuarios: 100,
    usuariosActuales: 0,
    colorPrincipal: '#2c3e50',
    colorSecundario: '#18bc9c',
    colorNavbar: '#343a40',
    fondoUrl: '',
    logoUrl: '',
    fuenteTexto: 'Inter, sans-serif',
    features: {
      administracion: false,
      alquileres: true,
      invitados: true,
      mensajeria: true,
      novedades: true,
      panico: false,
      seguridad: false
    },
    etiquetas: {
      distribucion: 'Isla',
      bloque: 'Manzana',
      unidad: 'Lote',       
      documento: 'cuit'      
    },
    modulos: {
      invitados: { requierePatente: false },
      panico: { tipoAlerta: 'guardia' },
      mensajeria: { permitirVecinoAVecino: false }
    },
    contactos: [], // <-- Todo unificado a 'contactos' (plural)
    amenities: [] 
  };

  const [newBarrio, setNewBarrio] = useState(templateBarrio);

  // 1. Verificación de Seguridad (GOD)
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

  // FUNCIÓN ADAPTADORA: Evita el crasheo convirtiendo los datos viejos
  const openConfigModal = (barrio) => {
    let parsedContactos = [];
    
    // Por si en la BD vieja estaba como "contacto" o "contactos"
    const rawContactos = barrio.contactos || barrio.contacto;

    if (Array.isArray(rawContactos)) {
      parsedContactos = rawContactos;
    } else if (typeof rawContactos === 'object' && rawContactos !== null) {
      Object.entries(rawContactos).forEach(([key, value], index) => {
        if (value) {
          parsedContactos.push({
            id: Date.now().toString() + index,
            nombre: key.charAt(0).toUpperCase() + key.slice(1),
            departamento: value, // Pasamos el valor viejo a "departamento"
            activo: true
          });
        }
      });
    }

    // Le pasamos el array ya purificado
    setBarrioUI({ ...templateBarrio, ...barrio, contactos: parsedContactos });
    setShowUIModal(true);
  };

  // 3. Guardar cambios del Modal
  const handleUpdateUI = async (e) => {
    e.preventDefault();
    try {
      const barrioRef = doc(db, "configuracionBarrios", barrioUI.id);
      
      // Limpiamos el viejo "contacto" por las dudas, mandamos solo "contactos"
      const dataToSave = { ...barrioUI, updatedAt: serverTimestamp() };
      delete dataToSave.contacto; 

      await updateDoc(barrioRef, dataToSave);
      setShowUIModal(false);
      Swal.fire("Éxito", "Configuración del barrio actualizada.", "success");
    } catch (error) {
      console.error(error);
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
        id: id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setShowCreateModal(false);
      setNewBarrio(templateBarrio); 
      Swal.fire("Creado", `El barrio ${id} ya está operativo.`, "success");
    } catch (error) {
      Swal.fire("Error", "ID duplicado o error de red.", "error");
    }
  };

  // 5. Eliminar Barrio
  const deleteBarrio = (id) => {
    Swal.fire({
      title: '¿Eliminar Barrio?',
      text: "Se borrará la configuración completa. Los usuarios quedarán huérfanos.",
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

  const updateNestedState = (category, field, value) => {
    setBarrioUI(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  // Gestión de Amenities
  const addAmenity = () => {
    const newAmenity = { id: Date.now().toString(), nombre: 'Nuevo Amenity', requiereAprobacion: false, activo: true };
    setBarrioUI(prev => ({ ...prev, amenities: [...(prev.amenities || []), newAmenity] }));
  };

  const updateAmenity = (id, field, value) => {
    setBarrioUI(prev => ({
      ...prev,
      amenities: prev.amenities.map(am => am.id === id ? { ...am, [field]: value } : am)
    }));
  };

  const removeAmenity = (id) => {
    setBarrioUI(prev => ({ ...prev, amenities: prev.amenities.filter(am => am.id !== id) }));
  };

  // Gestión de Contactos (Usando el array 'contactos')
  const addContacto = () => {
    const newContacto = { id: Date.now().toString(), nombre: 'Nueva Área', departamento: '', activo: true };
    setBarrioUI(prev => ({ ...prev, contactos: [...(prev.contactos || []), newContacto] }));
  };

  const updateContacto = (id, field, value) => {
    setBarrioUI(prev => ({
      ...prev,
      contactos: prev.contactos.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const removeContacto = (id) => {
    setBarrioUI(prev => ({ ...prev, contactos: prev.contactos.filter(c => c.id !== id) }));
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
          <Badge bg="info">Gestor Multi-Tenant</Badge>
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
                    <Badge bg="dark">{barrio.id}</Badge>
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
                    <div title="Secundario" className="border shadow-sm" style={{ width: 25, height: 25, borderRadius: 5, backgroundColor: barrio.colorSecundario }}></div>
                    <div title="Navbar" className="border shadow-sm" style={{ width: 25, height: 25, borderRadius: 5, backgroundColor: barrio.colorNavbar || '#343a40' }}></div>
                  </div>

                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="w-100"
                    onClick={() => openConfigModal(barrio)} // <-- Acá llamamos al adaptador
                  >
                    <FontAwesomeIcon icon={faCogs} className="me-2" /> Configurar Instancia
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* MODAL CONFIGURACIÓN MAESTRA DEL BARRIO */}
      <Modal show={showUIModal} onHide={() => setShowUIModal(false)} centered size="xl">
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title><FontAwesomeIcon icon={faCrown} className="me-2 text-warning"/> {barrioUI?.nombre}</Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleUpdateUI}>
          <Modal.Body className="bg-light">
            <Tabs defaultActiveKey="general" id="config-tabs" className="mb-3 custom-tabs">
              
              {/* --- 1. PESTAÑA: GENERAL & CONTACTO --- */}
              <Tab eventKey="general" title={<span><FontAwesomeIcon icon={faBars} className="me-1"/> General</span>}>
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold small">Nombre del Barrio</Form.Label>
                          <Form.Control value={barrioUI?.nombre || ''} onChange={e => setBarrioUI({...barrioUI, nombre: e.target.value})} required />
                        </Form.Group>
                        <Row>
                          <Col>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-bold small">Plan Suscrito</Form.Label>
                              <Form.Select value={barrioUI?.plan || 'standard'} onChange={e => setBarrioUI({...barrioUI, plan: e.target.value})}>
                                <option value="standard">Standard</option>
                                <option value="seguridad">Seguridad</option>
                                <option value="full">Full Premium</option>
                                <option value="admin">Solo Admin</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-bold small">Límite Usuarios</Form.Label>
                              <Form.Control type="number" value={barrioUI?.limiteUsuarios || 100} onChange={e => setBarrioUI({...barrioUI, limiteUsuarios: parseInt(e.target.value)})} />
                            </Form.Group>
                          </Col>
                        </Row>
                      </Col>
                      
                      {/* DIRECTORIO DE CONTACTOS DINÁMICO */}
                      <Col md={6}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-bold mb-0"><FontAwesomeIcon icon={faPhone} className="me-2"/> Directorio de Contactos</h6>
                          <Button variant="outline-success" size="sm" onClick={addContacto}>
                            <FontAwesomeIcon icon={faPlus} className="me-1"/> Agregar
                          </Button>
                        </div>
                        
                        {(!barrioUI?.contactos || barrioUI.contactos.length === 0) ? (
                        <div className="text-center text-muted py-3 small border rounded">
                          No hay departamentos configurados.
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-2" style={{ maxHeight: '250px', overflowY: 'auto', overflowX: 'hidden'}}>
                          {/* ACÁ ESTÁ LA RED DE SEGURIDAD (Array.isArray) */}
                          {Array.isArray(barrioUI.contactos) ? barrioUI.contactos.map((c) => (
                            <Card key={c.id} className="p-2 border shadow-sm">
                              <Row className="g-2 align-items-center">
                                <Col xs={4}>
                                  <Form.Control size="sm" placeholder="Título (Ej: Obras)" value={c.nombre || ''} onChange={(e) => updateContacto(c.id, 'nombre', e.target.value)} />
                                </Col>
                                <Col xs={5}>
                                  <Form.Control size="sm" placeholder="Dpto (Ej: ControlDeObras)" value={c.departamento || ''} onChange={(e) => updateContacto(c.id, 'departamento', e.target.value)} />
                                </Col>
                                <Col xs={2} className="text-center">
                                  <Form.Check type="switch" title="Activo" checked={c.activo || false} onChange={(e) => updateContacto(c.id, 'activo', e.target.checked)} />
                                </Col>
                                <Col xs={1} className="text-end">
                                  <Button variant="link" className="text-danger p-0" onClick={() => removeContacto(c.id)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                  </Button>
                                </Col>
                              </Row>
                            </Card>
                          )) : (
                            <div className="text-danger text-center small mt-2">
                              Formato incorrecto en BD. Guardá los cambios para reparar.
                            </div>
                          )}
                        </div>
                      )}
                    </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>

              {/* --- 2. PESTAÑA: ESTÉTICA --- */}
              <Tab eventKey="estetica" title={<span><FontAwesomeIcon icon={faPalette} className="me-1"/> Estética</span>}>
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <Row>
                      <Col md={7}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold small">URL del Logo</Form.Label>
                          <Form.Control value={barrioUI?.logoUrl || ''} placeholder="https://..." onChange={e => setBarrioUI({...barrioUI, logoUrl: e.target.value})} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold small"><FontAwesomeIcon icon={faImage} className="me-1"/> Imagen de Fondo (Wallpaper)</Form.Label>
                          <Form.Control value={barrioUI?.fondoUrl || ''} placeholder="URL o dejar vacío para degradado css" onChange={e => setBarrioUI({...barrioUI, fondoUrl: e.target.value})} />
                        </Form.Group>
                      </Col>
                      <Col md={5}>
                         <Form.Label className="fw-bold small">Colores de Marca</Form.Label>
                         <div className="d-flex gap-2 mb-3">
                            <div><small className="d-block text-muted">Primario</small><Form.Control type="color" value={barrioUI?.colorPrincipal || '#2c3e50'} onChange={e => setBarrioUI({...barrioUI, colorPrincipal: e.target.value})} /></div>
                            <div><small className="d-block text-muted">Secundario</small><Form.Control type="color" value={barrioUI?.colorSecundario || '#18bc9c'} onChange={e => setBarrioUI({...barrioUI, colorSecundario: e.target.value})} /></div>
                            <div><small className="d-block text-muted">Navbar</small><Form.Control type="color" value={barrioUI?.colorNavbar || '#343a40'} onChange={e => setBarrioUI({...barrioUI, colorNavbar: e.target.value})} /></div>
                         </div>
                         <Form.Group>
                            <Form.Label className="fw-bold small">Tipografía Global</Form.Label>
                            <Form.Select value={barrioUI?.fuenteTexto || 'Inter, sans-serif'} onChange={e => setBarrioUI({...barrioUI, fuenteTexto: e.target.value})}>
                              <option value="Inter, sans-serif">Inter (Moderna)</option>
                              <option value="Roboto, sans-serif">Roboto (Clásica)</option>
                              <option value="Poppins, sans-serif">Poppins (Redondeada)</option>
                            </Form.Select>
                         </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>

              {/* --- 3. PESTAÑA: MÓDULOS Y ETIQUETAS --- */}
              <Tab eventKey="modulos" title={<span><FontAwesomeIcon icon={faCogs} className="me-1"/> Módulos & Tags</span>}>
                <Row className="g-3">
                  <Col md={6}>
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Body>
                        <h6 className="fw-bold mb-3">Activar / Desactivar Módulos</h6>
                        <Row>
                          <Col sm={6}>
                            <Form.Check type="switch" label="Invitados (QR)" checked={!!barrioUI?.features?.invitados} onChange={e => updateNestedState('features', 'invitados', e.target.checked)} className="mb-2" />
                            <Form.Check type="switch" label="Novedades" checked={!!barrioUI?.features?.novedades} onChange={e => updateNestedState('features', 'novedades', e.target.checked)} className="mb-2" />
                            <Form.Check type="switch" label="Alquileres" checked={!!barrioUI?.features?.alquileres} onChange={e => updateNestedState('features', 'alquileres', e.target.checked)} className="mb-2" />
                          </Col>
                          <Col sm={6}>
                            <Form.Check type="switch" label="Mensajería" checked={!!barrioUI?.features?.mensajeria} onChange={e => updateNestedState('features', 'mensajeria', e.target.checked)} className="mb-2" />
                            <Form.Check type="switch" label="Botón Pánico" checked={!!barrioUI?.features?.panico} onChange={e => updateNestedState('features', 'panico', e.target.checked)} className="mb-2" />
                            <Form.Check type="switch" label="App Seguridad" checked={!!barrioUI?.features?.seguridad} onChange={e => updateNestedState('features', 'seguridad', e.target.checked)} className="mb-2" />
                          </Col>
                        </Row>

                        <hr/>
                        <h6 className="fw-bold mb-3 small text-muted">Configuraciones Avanzadas (Módulos)</h6>
                        <Form.Check type="checkbox" label="Invitados: Exigir Patente" checked={!!barrioUI?.modulos?.invitados?.requierePatente} onChange={e => updateNestedState('modulos', 'invitados', { ...barrioUI.modulos.invitados, requierePatente: e.target.checked })} className="mb-2" />
                        <Form.Check type="checkbox" label="Chat: Permitir Vecino-Vecino" checked={!!barrioUI?.modulos?.mensajeria?.permitirVecinoAVecino} onChange={e => updateNestedState('modulos', 'mensajeria', { ...barrioUI.modulos.mensajeria, permitirVecinoAVecino: e.target.checked })} className="mb-2" />
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6}>
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Body>
                        <h6 className="fw-bold mb-3"><FontAwesomeIcon icon={faTags} className="me-2"/> Nomenclatura del Barrio</h6>
                        <p className="small text-muted mb-3">Define cómo se nombran las cosas en la app para este barrio.</p>
                        
                        <Form.Group className="mb-2">
                          <Form.Label className="small mb-1">Distribución (Ej: Manzana, Torre, Isla)</Form.Label>
                          <Form.Control value={barrioUI?.etiquetas?.distribucion || ''} onChange={e => updateNestedState('etiquetas', 'distribucion', e.target.value)} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label className="small mb-1">Bloque (Ej: Manzana, Torre, Isla)</Form.Label>
                          <Form.Control value={barrioUI?.etiquetas?.bloque || ''} onChange={e => updateNestedState('etiquetas', 'bloque', e.target.value)} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label className="small mb-1">Unidad (Ej: Lote, Departamento, UF)</Form.Label>
                          <Form.Control value={barrioUI?.etiquetas?.unidad || ''} onChange={e => updateNestedState('etiquetas', 'unidad', e.target.value)} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label className="small mb-1">CUIT (Ej: CUIT)</Form.Label>
                          <Form.Control value={barrioUI?.etiquetas?.documento || ''} onChange={e => updateNestedState('etiquetas', 'documento', e.target.value)} />
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>

              {/* --- 4. PESTAÑA: AMENITIES / RESERVAS --- */}
              <Tab eventKey="amenities" title={<span><FontAwesomeIcon icon={faFutbol} className="me-1"/> Amenities</span>}>
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">Gestión de Espacios Comunes</h6>
                      <Button variant="outline-success" size="sm" onClick={addAmenity}>
                        <FontAwesomeIcon icon={faPlus} className="me-1"/> Agregar Amenity
                      </Button>
                    </div>

                    {(!barrioUI?.amenities || barrioUI.amenities.length === 0) ? (
                      <div className="text-center text-muted py-4 small">
                        Este barrio no tiene amenities configurados.
                      </div>
                    ) : (
                      <Table responsive hover className="align-middle text-sm">
                        <thead className="table-light">
                          <tr>
                            <th>Nombre del Espacio</th>
                            <th className="text-center">Req. Aprobación</th>
                            <th className="text-center">Estado</th>
                            <th className="text-end">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {barrioUI.amenities.map(am => (
                            <tr key={am.id}>
                              <td>
                                <Form.Control size="sm" value={am.nombre} onChange={(e) => updateAmenity(am.id, 'nombre', e.target.value)} placeholder="Ej: SUM 1" />
                              </td>
                              <td className="text-center">
                                <Form.Check type="switch" checked={am.requiereAprobacion} onChange={(e) => updateAmenity(am.id, 'requiereAprobacion', e.target.checked)} />
                              </td>
                              <td className="text-center">
                                <Form.Check type="switch" checked={am.activo} onChange={(e) => updateAmenity(am.id, 'activo', e.target.checked)} />
                              </td>
                              <td className="text-end">
                                <Button variant="link" className="text-danger p-0" onClick={() => removeAmenity(am.id)}>
                                  <FontAwesomeIcon icon={faTrash} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>
          </Modal.Body>
          
          <Modal.Footer className="bg-light">
            <Button variant="secondary" onClick={() => setShowUIModal(false)}>Descartar</Button>
            <Button variant="primary" type="submit">
              <FontAwesomeIcon icon={faSave} className="me-2"/> Guardar Configuración
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL REGISTRO DE NUEVO BARRIO */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Registrar Nueva Comunidad</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateBarrio}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">ID del Barrio (Slug / BD)</Form.Label>
              <Form.Control 
                placeholder="ej: nordelta-los-castores (sin espacios)" 
                value={newBarrio.identificador}
                onChange={e => setNewBarrio({...newBarrio, identificador: e.target.value})}
                required 
              />
              <Form.Text className="text-muted">Este ID será el Documento en Firebase.</Form.Text>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fw-bold">Nombre Comercial Público</Form.Label>
              <Form.Control 
                placeholder="Ej: Los Castores" 
                value={newBarrio.nombre}
                onChange={e => setNewBarrio({...newBarrio, nombre: e.target.value})}
                required 
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" type="submit" className="w-100 py-2">Inicializar Barrio</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};