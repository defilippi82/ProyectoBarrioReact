import React, { useState, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';
import { Form, Button, Row, Col, Card, Container, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaHome, FaPhone, FaLock, FaEnvelope } from 'react-icons/fa';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export const RegistrarSocio = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const sociosCollection = collection(db, 'usuarios');

  // Estados del Formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [manzana, setManzana] = useState('');
  const [lote, setLote] = useState('');
  const [isla, setIsla] = useState('');
  const [tel, setTel] = useState('');
  const [codPais, setCodPais] = useState('+54'); // Argentina por defecto
  const [contrasena, setContrasena] = useState('');
  const [repetirContrasena, setRepetirContrasena] = useState('');

  // SOLUCIÓN AL ERROR DEL ROL:
  // Definimos los roles fuera o dentro pero los usamos en el estado principal
  /*const rolesMap = {
    propietario: { valor: 'propietario', administrador: false, propietario: true, inquilino: false, guardia: false },
    inquilino: { valor: 'inquilino', administrador: false, propietario: false, inquilino: true, guardia: false }
  };*/

  // Seteamos el objeto completo de 'propietario' por defecto
  //const [rol, setRol] = useState(rolesMap.propietario);
  const [rol, setRol] = useState('');

  const crearSocio = async (e) => {
    e.preventDefault();

    if (contrasena.length < 6) {
      return MySwal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
    }
    if (contrasena !== repetirContrasena) {
      return MySwal.fire('Error', 'Las contraseñas no coinciden', 'error');
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, contrasena);
      const idPublico = `${nombre.trim()}-${manzana.trim()}-${lote.trim()}`.toLowerCase().replace(/\s+/g, '-');
      const numeroCompleto = `${codPais}${tel}`;

      await addDoc(sociosCollection, {
        nombre,
        apellido,
        email,
        manzana,
        lote,
        isla,
        rol: rol, // Aquí enviamos el valor ("propietario" o "inquilino")
        contrasena: contrasena,
        numerotelefono: numeroCompleto,
        idPublico,
        createdAt: new Date()
      });

      MySwal.fire({
        title: '¡Éxito!',
        text: 'Socio registrado correctamente',
        icon: 'success'
      }).then(() => navigate('/login'));

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
                  <Col md={12} className="mb-3">
                    <Form.Floating>
                      <Form.Select 
                        value={rol} 
                        onChange={(e) => setRol(e.target.value)}
                      >
                        <option value="propietario">Propietario</option>
                        <option value="inquilino">Inquilino</option>
                      </Form.Select>
                      <label>Tipo de Usuario (Rol)</label>
                    </Form.Floating>
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

                {/* Enlace opcional para volver al login */}
                <div className="text-center mt-3">
                  <Button variant="link" onClick={() => navigate('/login')} className="text-muted small">
                    ¿Ya tenés cuenta? Iniciá sesión
                  </Button>
                </div>

              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};