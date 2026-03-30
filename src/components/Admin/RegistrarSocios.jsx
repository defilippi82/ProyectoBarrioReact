import React, { useState, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDoc, updateDoc, setDoc, increment, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';
import { Form, Button, Row, Col, Card, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaHome, FaPhone, FaLock, FaEnvelope, FaCity } from 'react-icons/fa';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export const RegistrarSocio = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  
  // ESTADOS PARA BARRIOS
  const [barrios, setBarrios] = useState([]);
  const [barrioSeleccionado, setBarrioSeleccionado] = useState('');

  // Estados del Formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [manzana, setManzana] = useState('');
  const [lote, setLote] = useState('');
  const [isla, setIsla] = useState('');
  const [tel, setTel] = useState('');
  const [codPais, setCodPais] = useState('+54');
  const [contrasena, setContrasena] = useState('');
  const [repetirContrasena, setRepetirContrasena] = useState('');
  const [rolSeleccionado, setRolSeleccionado] = useState('propietario');

  // Cargar barrios disponibles al iniciar
  useEffect(() => {
    const obtenerBarrios = async () => {
      try {
        const q = query(collection(db, "configuracionBarrios"), orderBy("nombre"));
        const snap = await getDocs(q);
        setBarrios(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error cargando barrios:", error);
      }
    };
    obtenerBarrios();
  }, []);

  const rolesMap = {
    propietario: { valor: 'propietario', administrador: false, propietario: true, inquilino: false, guardia: false },
    inquilino: { valor: 'inquilino', administrador: false, propietario: false, inquilino: true, guardia: false }
  };

  const crearSocio = async (e) => {
    e.preventDefault();

    if (!barrioSeleccionado) {
      return MySwal.fire('Atención', 'Debes seleccionar un barrio para registrarte', 'warning');
    }
    if (contrasena.length < 6) {
      return MySwal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
    }
    if (contrasena !== repetirContrasena) {
      return MySwal.fire('Error', 'Las contraseñas no coinciden', 'error');
    }

    try {
      // 1. VALIDACIÓN DE CUPO DINÁMICA
      const barrioRef = doc(db, "configuracionBarrios", barrioSeleccionado);
      const barrioSnap = await getDoc(barrioRef);
      const config = barrioSnap.data();

      if (config.usuariosActuales >= config.limiteUsuarios) {
        return MySwal.fire('Cupo Alcanzado', `El barrio ${config.nombre} no tiene más cupos disponibles.`, 'warning');
      }

      // 2. CREACIÓN EN AUTH
      const { user } = await createUserWithEmailAndPassword(auth, email, contrasena);
      
      const idPublico = `${nombre.trim()}-${manzana.trim()}-${lote.trim()}`.toLowerCase().replace(/\s+/g, '-');
      const numeroCompleto = `${codPais}${tel}`;

      // 3. GUARDADO EN FIRESTORE
      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nombre,
        apellido,
        email,
        manzana,
        lote,
        isla,
        rol: rolesMap[rolSeleccionado],
        contrasena: contrasena, 
        numerotelefono: numeroCompleto,
        idPublico,
        barrioId: barrioSeleccionado, // <--- AHORA ES DINÁMICO
        createdAt: new Date()
      });

      // 4. INCREMENTO DEL CONTADOR
      await updateDoc(barrioRef, { usuariosActuales: increment(1) });

      MySwal.fire('¡Éxito!', 'Socio registrado correctamente', 'success').then(() => navigate('/login'));

    } catch (error) {
      MySwal.fire('Error', error.message, 'error');
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg border-0">
            <Card.Header className="bg-primary text-white text-center py-4">
              <FaUserPlus size={40} className="mb-2" />
              <h2 className="fw-bold">Registrar Nuevo Socio</h2>
              <p className="mb-0 opacity-75">Completá los datos para el acceso al barrio</p>
            </Card.Header>
            <Card.Body className="p-4 p-md-5">
              <Form onSubmit={crearSocio}>
                
                <h5 className="text-primary mb-3 border-bottom pb-2">Asignación de Barrio</h5>
                <Row>
                  <Col md={12} className="mb-4">
                    <Form.Floating>
                      <Form.Select 
                        value={barrioSeleccionado} 
                        onChange={(e) => setBarrioSeleccionado(e.target.value)}
                        required
                      >
                        <option value="">Seleccione el barrio donde vive...</option>
                        {barrios.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                      </Form.Select>
                      <label><FaCity className="me-2" /> Barrio / Urbanización</label>
                    </Form.Floating>
                  </Col>
                </Row>

                <h5 className="text-primary mb-3 border-bottom pb-2">Datos Personales</h5>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Floating>
                      <Form.Control type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                      <label>Nombre</label>
                    </Form.Floating>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Floating>
                      <Form.Control type="text" placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
                      <label>Apellido</label>
                    </Form.Floating>
                  </Col>
                </Row>

                <Row>
                  <Col md={12} className="mb-3">
                    <Form.Floating>
                      <Form.Control type="email" placeholder="email@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      <label><FaEnvelope className="me-2" />Correo Electrónico</label>
                    </Form.Floating>
                  </Col>
                </Row>

                <h5 className="text-primary mb-3 border-bottom pb-2 mt-3">Ubicación y Contacto</h5>
                <Row>
                  <Col md={4} className="mb-3">
                    <Form.Floating>
                      <Form.Control type="number" placeholder="Manzana" value={manzana} onChange={(e) => setManzana(e.target.value)} required />
                      <label><FaHome className="me-2" />Manzana</label>
                    </Form.Floating>
                  </Col>
                  <Col md={4} className="mb-3">
                    <Form.Floating>
                      <Form.Control type="number" placeholder="Lote" value={lote} onChange={(e) => setLote(e.target.value)} required />
                      <label>Lote</label>
                    </Form.Floating>
                  </Col>
                  <Col md={4} className="mb-3">
                    <Form.Floating>
                      <Form.Control type="number" placeholder="Isla" value={isla} onChange={(e) => setIsla(e.target.value)} required />
                      <label>Isla</label>
                    </Form.Floating>
                  </Col>
                </Row>

                <Row>
                  <Col md={5} className="mb-3">
                    <Form.Floating>
                      <Form.Select value={codPais} onChange={(e) => setCodPais(e.target.value)}>
                        <option value="+54">Argentina (+54)</option>
                        <option value="+598">Uruguay (+598)</option>
                        <option value="+55">Brasil (+55)</option>
                        <option value="+1">EE.UU. (+1)</option>
                        <option value="+34">España (+34)</option>
                      </Form.Select>
                      <label>País</label>
                    </Form.Floating>
                  </Col>
                  <Col md={7} className="mb-3">
                    <Form.Floating>
                      <Form.Control type="text" placeholder="Teléfono" value={tel} onChange={(e) => setTel(e.target.value)} required />
                      <label><FaPhone className="me-2" />Teléfono (sin el código)</label>
                    </Form.Floating>
                  </Col>
                </Row>

                <h5 className="text-primary mb-3 border-bottom pb-2 mt-3">Seguridad y Rol</h5>
                <Row>
                  <Col md={12} className="mb-4">
                    <div className="d-flex gap-5 mt-2 justify-content-center p-3 border rounded bg-light">
                        <Form.Check
                            type="radio"
                            label="Propietario"
                            name="rolOptions"
                            id="role-propietario"
                            checked={rolSeleccionado === 'propietario'}
                            onChange={() => setRolSeleccionado('propietario')}
                            className="fw-bold text-dark custom-radio"
                        />
                        <Form.Check
                            type="radio"
                            label="Inquilino"
                            name="rolOptions"
                            id="role-inquilino"
                            checked={rolSeleccionado === 'inquilino'}
                            onChange={() => setRolSeleccionado('inquilino')}
                            className="fw-bold text-dark custom-radio"
                        />
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Floating>
                      <Form.Control type="password" placeholder="Contraseña" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required />
                      <label><FaLock className="me-2" />Contraseña</label>
                    </Form.Floating>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Floating>
                      <Form.Control type="password" placeholder="Repetir" value={repetirContrasena} onChange={(e) => setRepetirContrasena(e.target.value)} required />
                      <label>Repetir Contraseña</label>
                    </Form.Floating>
                  </Col>
                </Row>

                <Row className="mt-4">
                  <Col xs={12} className="d-flex justify-content-center">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      size="lg" 
                      className="text-nowrap px-5 shadow-sm fw-bold"
                      style={{ minWidth: '250px' }}
                    >
                      REGISTRAR SOCIO
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};