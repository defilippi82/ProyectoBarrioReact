import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Form, 
  Button, 
  Card, 
  Alert, 
  Spinner,
  Row,
  Col,
  Badge
} from 'react-bootstrap';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaTennisBall, 
  FaFutbol,
  FaUser,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useMediaQuery } from 'react-responsive';

const MySwal = withReactContent(Swal);

export const RegistrarReserva = () => {
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    cancha: '',
    fecha: '',
    hora: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // Opciones de canchas
  const canchas = [
    { value: 'Tenis 1', label: 'Cancha de Tenis 1', icon: <FaTennisBall /> },
    { value: 'Tenis 2', label: 'Cancha de Tenis 2', icon: <FaTennisBall /> },
    { value: 'Futbol', label: 'Cancha de Fútbol', icon: <FaFutbol /> }
  ];

  // Generar horas disponibles (8:00 a 23:00)
  const generarHoras = () => {
    const horas = [];
    for (let h = 8; h <= 23; h++) {
      horas.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return horas;
  };
  const horasDisponibles = generarHoras();

  useEffect(() => {
    const loadUserData = () => {
      const userDataFromStorage = localStorage.getItem('userData');
      if (userDataFromStorage) {
        setUserData(JSON.parse(userDataFromStorage));
      }
    };
    loadUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const verificarDisponibilidad = async () => {
    if (!formData.cancha || !formData.fecha || !formData.hora) return false;
    
    const fechaReserva = new Date(`${formData.fecha}T${formData.hora}`);
    const q = query(
      collection(db, 'reservas'), 
      where('cancha', '==', formData.cancha),
      where('fecha', '==', Timestamp.fromDate(fechaReserva))
    );
    
    try {
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      console.error("Error verificando disponibilidad:", error);
      setError("Error al verificar disponibilidad");
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setLoading(false);
      setValidated(true);
      return;
    }

    try {
      // Verificar disponibilidad
      const disponible = await verificarDisponibilidad();
      if (!disponible) {
        setError('La cancha ya está reservada para esa fecha y hora');
        setLoading(false);
        return;
      }

      const fechaReserva = new Date(`${formData.fecha}T${formData.hora}`);
      
      // Mostrar advertencia si es después de las 20hs
      if (fechaReserva.getHours() >= 20) {
        const confirmacion = await MySwal.fire({
          title: 'Aviso Importante',
          html: '<div class="text-start"><p>Se cobrará la ficha de luz por reservar después de las 20hs.</p><p>¿Desea continuar?</p></div>',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Confirmar Reserva',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          customClass: {
            popup: 'text-start'
          }
        });

        if (confirmacion.isDismissed) {
          setLoading(false);
          return;
        }
      }

      // Crear reserva
      await addDoc(collection(db, 'reservas'), {
        cancha: formData.cancha,
        fecha: Timestamp.fromDate(fechaReserva),
        apellido: userData?.apellido || '',
        usuario: userData?.nombre || '',
        lote: userData ? `${userData.manzana}-${userData.lote}` : '',
        timestamp: Timestamp.now()
      });

      // Éxito
      await MySwal.fire({
        title: 'Reserva Exitosa',
        html: `
          <div class="text-start">
            <p><strong>Cancha:</strong> ${formData.cancha}</p>
            <p><strong>Fecha:</strong> ${fechaReserva.toLocaleDateString()}</p>
            <p><strong>Hora:</strong> ${formData.hora}</p>
            <p><strong>Responsable:</strong> ${userData?.apellido || ''}</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

      // Resetear formulario
      setFormData({
        cancha: '',
        fecha: '',
        hora: ''
      });
      setValidated(false);
      navigate('/reservas');
    } catch (error) {
      console.error("Error al crear reserva:", error);
      setError('Ocurrió un error al registrar la reserva');
    } finally {
      setLoading(false);
    }
  };

  // Validar fecha mínima (hoy)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Container className="py-4 px-3 px-md-5">
      <Row className="justify-content-center">
        <Col xs={12} lg={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h2 className="mb-0 d-flex align-items-center">
                <FaCalendarAlt className="me-2" />
                Nueva Reserva
              </h2>
            </Card.Header>
            
            <Card.Body>
              {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                  <FaExclamationTriangle className="me-2" />
                  {error}
                </Alert>
              )}

              <Alert variant="info" className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <FaExclamationTriangle className="me-2" />
                  <strong>Normas de reserva:</strong>
                </div>
                <ul className="mb-0">
                  <li>Solo se permite 1 hora de reserva por socio</li>
                  <li>Horario de reservas: 8:00 a 23:00</li>
                  <li>Se cobrará ficha de luz después de las 20:00</li>
                </ul>
              </Alert>

              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                {/* Cancha */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaTennisBall className="me-2" />
                    Cancha
                  </Form.Label>
                  <Form.Select
                    name="cancha"
                    value={formData.cancha}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Seleccione una cancha</option>
                    {canchas.map((cancha) => (
                      <option key={cancha.value} value={cancha.value}>
                        {isMobile ? cancha.value : `${cancha.icon} ${cancha.label}`}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    Por favor seleccione una cancha
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Fecha */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaCalendarAlt className="me-2" />
                    Fecha
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    min={today}
                    required
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    Por favor seleccione una fecha válida
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Hora */}
                <Form.Group className="mb-4">
                  <Form.Label>
                    <FaClock className="me-2" />
                    Hora
                  </Form.Label>
                  <Form.Select
                    name="hora"
                    value={formData.hora}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Seleccione una hora</option>
                    {horasDisponibles.map((hora, index) => (
                      <option key={index} value={hora}>{hora}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    Por favor seleccione una hora
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Responsable */}
                {userData?.apellido && (
                  <Form.Group className="mb-4">
                    <Form.Label>
                      <FaUser className="me-2" />
                      Responsable
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={userData.apellido}
                      readOnly
                      plaintext
                    />
                  </Form.Group>
                )}

                {/* Botón de enviar */}
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="me-2" />
                        Confirmar Reserva
                      </>
                    )}
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