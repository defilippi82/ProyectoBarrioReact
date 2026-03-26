import React, { useState, useEffect, useContext } from 'react';
import { db } from '/src/firebaseConfig/firebase.js';
import { collection, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { UserContext } from '../Services/UserContext';
import { Container, Table, Button, Card, Row, Col, Form, Badge, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faSave, faUsers, faShieldAlt, faUsersCog, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

export const GodPanel = () => {
  const { userData } = useContext(UserContext);
  const [barrios, setBarrios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Seguridad: Si no es GOD, no entra
  if (!userData?.rol?.god) {
    return <Container className="py-5 text-center"><h1>Acceso Denegado</h1></Container>;
  }

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "configuracionBarrios"), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBarrios(lista);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdateBarrio = async (id, data) => {
    try {
      const barrioRef = doc(db, "configuracionBarrios", id);
      await updateDoc(barrioRef, data);
      Swal.fire({
        title: 'Actualizado',
        text: 'Configuración de barrio aplicada con éxito.',
        icon: 'success',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', 'No se pudo actualizar el barrio', 'error');
    }
  };

  const handleTogglePack = (barrio, pack) => {
    const nuevoValor = !barrio[pack];
    handleUpdateBarrio(barrio.id, { [pack]: nuevoValor });
  };

  return (
    <Container className="py-5 mt-5">
      <div className="d-flex align-items-center mb-4 border-bottom pb-3">
        <FontAwesomeIcon icon={faCrown} size="2x" className="text-warning me-3" />
        <h1 className="fw-bold mb-0">PANEL GOD - Gestión Global de Barrios</h1>
      </div>

      <Row>
        {barrios.map((barrio) => (
          <Col lg={6} key={barrio.id} className="mb-4">
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">{barrio.nombre} <small className="text-muted">({barrio.id})</small></h5>
                <Badge bg={barrio.plan === 'full' ? 'warning' : 'info'} text="dark">
                  PLAN: {barrio.plan?.toUpperCase()}
                </Badge>
              </Card.Header>
              <Card.Body>
                
                {/* GESTIÓN DE USUARIOS */}
                <div className="mb-4">
                  <h6 className="text-primary fw-bold mb-3"><FontAwesomeIcon icon={faUsers} className="me-2"/>Usuarios y Cupos</h6>
                  <InputGroup className="mb-2">
                    <InputGroup.Text>Usuarios Actuales</InputGroup.Text>
                    <Form.Control disabled value={barrio.usuariosActuales} />
                    <InputGroup.Text>Límite Contratado</InputGroup.Text>
                    <Form.Control 
                      type="number" 
                      defaultValue={barrio.limiteUsuarios} 
                      onBlur={(e) => handleUpdateBarrio(barrio.id, { limiteUsuarios: Number(e.target.value) })}
                    />
                  </InputGroup>
                  <div className="progress" style={{ height: '8px' }}>
                    <div 
                      className={`progress-bar ${barrio.usuariosActuales >= barrio.limiteUsuarios ? 'bg-danger' : 'bg-success'}`} 
                      style={{ width: `${(barrio.usuariosActuales / barrio.limiteUsuarios) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* GESTIÓN DE PACKS */}
                <h6 className="text-primary fw-bold mb-3"><FontAwesomeIcon icon={faUsersCog} className="me-2"/>Módulos Activos</h6>
                <div className="d-flex flex-wrap gap-2">
                  <Button 
                    variant={barrio.isSeguridad ? "success" : "outline-secondary"} 
                    onClick={() => handleTogglePack(barrio, 'isSeguridad')}
                    size="sm"
                  >
                    <FontAwesomeIcon icon={faShieldAlt} className="me-1"/> Pack Seguridad
                  </Button>
                  
                  <Button 
                    variant={barrio.isAdminPack ? "success" : "outline-secondary"} 
                    onClick={() => handleTogglePack(barrio, 'isAdminPack')}
                    size="sm"
                  >
                    <FontAwesomeIcon icon={faUsersCog} className="me-1"/> Pack Administrativo
                  </Button>
                </div>

                <hr />

                {/* CAMBIO DE PLAN RÁPIDO */}
                <Form.Group>
                  <Form.Label className="small fw-bold">Plan de Suscripción</Form.Label>
                  <Form.Select 
                    size="sm" 
                    value={barrio.plan} 
                    onChange={(e) => handleUpdateBarrio(barrio.id, { plan: e.target.value })}
                  >
                    <option value="standard">Standard</option>
                    <option value="seguridad">Seguridad</option>
                    <option value="administrativo">Administrativo</option>
                    <option value="full">Full Access</option>
                  </Form.Select>
                </Form.Group>

              </Card.Body>
              <Card.Footer className="bg-light text-end">
                <small className="text-muted">ID: {barrio.id}</small>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Botón para un nuevo barrio */}
      <div className="text-center mt-4">
        <Button variant="outline-primary" onClick={() => Swal.fire('Función en desarrollo', 'Próximamente podrás crear barrios desde aquí', 'info')}>
          <FontAwesomeIcon icon={faPlusCircle} className="me-2"/> Registrar Nuevo Barrio
        </Button>
      </div>
    </Container>
  );
};