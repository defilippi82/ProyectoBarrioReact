import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Row, Col, Button, Table, Card, Badge, Spinner, Alert, Stack, ProgressBar 
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  collection, getDocs, deleteDoc, doc, Timestamp, query, where, updateDoc, increment 
} from 'firebase/firestore';
import { db } from "../../firebaseConfig/firebase";
import { UserContext } from '../Services/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPenToSquare, faTrash, faUserPlus, faCalendarPlus, faUsers, faCalendarCheck, faSync 
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useMediaQuery } from 'react-responsive';

const MySwal = withReactContent(Swal);

export const Administracion = () => {
  const { userData, barrioConfig } = useContext(UserContext);
  const [socios, setSocios] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // 1. OBTENER DATOS FILTRADOS POR BARRIO
  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.barrioId) return;

      try {
        setLoading(true);
        // Filtramos para que el admin solo vea los datos de SU barrio
        const sociosQuery = query(collection(db, "usuarios"), where("barrioId", "==", userData.barrioId));
        const reservasQuery = query(collection(db, "reservas"), where("barrioId", "==", userData.barrioId));

        const [sociosSnapshot, reservasSnapshot] = await Promise.all([
          getDocs(sociosQuery),
          getDocs(reservasQuery)
        ]);

        setSocios(sociosSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        setReservas(reservasSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            fechaFormateada: doc.data().fecha instanceof Timestamp
              ? doc.data().fecha.toDate().toLocaleString()
              : new Date(doc.data().fecha).toLocaleString()
          })));
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error al cargar los datos del barrio");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData]);

  // 2. FUNCIÓN DE ELIMINACIÓN (CON CONTROL DE CUPO)
  const confirmDelete = async (id, type) => {
    try {
      const result = await MySwal.fire({
        title: '¿Estás seguro?',
        text: type === 'socio' 
          ? "Se eliminará el acceso y se liberará un cupo en el barrio." 
          : "La reserva será eliminada permanentemente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        // Borrar de Firestore
        await deleteDoc(doc(db, type === 'socio' ? "usuarios" : "reservas", id));
        
        if (type === 'socio') {
          // RESTAR CUPO EN EL BARRIO
          const barrioRef = doc(db, "configuracionBarrios", userData.barrioId);
          await updateDoc(barrioRef, {
            usuariosActuales: increment(-1)
          });
          setSocios(socios.filter((socio) => socio.id !== id));
        } else {
          setReservas(reservas.filter((reserva) => reserva.id !== id));
        }

        await MySwal.fire(
          '¡Eliminado!',
          type === 'socio' ? 'Socio borrado y cupo liberado.' : 'Reserva eliminada.',
          'success'
        );
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      MySwal.fire('Error', 'No se pudo completar la eliminación.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '70vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="mt-3 text-muted fw-bold">Accediendo al Panel de {userData?.barrioId?.toUpperCase()}...</span>
      </div>
    );
  }

  return (
    <Container fluid className="py-5 px-3 px-md-5 mt-4">
      
      {/* Resumen de Estado del Barrio (Visual) */}
      {barrioConfig && (
        <Row className="mb-4">
          <Col md={4}>
            <Card className="shadow-sm border-0 bg-dark text-white p-3">
              <small className="text-muted text-uppercase fw-bold">Estado del Cupo</small>
              <h4 className="mb-2">{barrioConfig.usuariosActuales} / {barrioConfig.limiteUsuarios} <small className="fs-6">SOCIOS</small></h4>
              <ProgressBar 
                variant={barrioConfig.usuariosActuales >= barrioConfig.limiteUsuarios * 0.9 ? "danger" : "success"} 
                now={(barrioConfig.usuariosActuales / barrioConfig.limiteUsuarios) * 100} 
                style={{ height: '6px' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* SECCIÓN DE SOCIOS */}
      <Card className="mb-5 shadow-sm border-0 overflow-hidden">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0 fw-bold">
            <FontAwesomeIcon icon={faUsers} className="me-2" />
            Administración de Socios
          </h5>
          <Button as={Link} to="/socios/create" variant="light" size="sm" className="fw-bold">
            <FontAwesomeIcon icon={faUserPlus} className="me-2" /> Nuevo Socio
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table striped hover variant="dark" className="mb-0">
              <thead className="bg-secondary text-white">
                <tr>
                  <th>Socio</th>
                  <th>Email</th>
                  {!isMobile && <th>Rol</th>}
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {socios.length > 0 ? (
                  socios.map((socio) => (
                    <tr key={socio.id}>
                      <td>{socio.nombre} {socio.apellido}</td>
                      <td>{socio.email}</td>
                      {!isMobile && (
                        <td>
                          {socio.rol?.administrador && <Badge bg="danger" className="me-1">Admin</Badge>}
                          {socio.rol?.propietario && <Badge bg="info" className="me-1">Propietario</Badge>}
                          {socio.rol?.inquilino && <Badge bg="secondary" className="me-1">Inquilino</Badge>}
                          {socio.rol?.seguridad && <Badge bg="secondary" className="me-1">Seguridad</Badge>}
                        </td>
                      )}
                      <td className="text-center">
                        <Stack direction="horizontal" gap={2} className="justify-content-center">
                          <Button as={Link} to={`/socios/edit/${socio.id}`} variant="outline-primary" size="sm">
                            <FontAwesomeIcon icon={faPenToSquare} />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => confirmDelete(socio.id, 'socio')}>
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </Stack>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={isMobile ? 3 : 4} className="text-center py-4">No hay socios en este barrio.</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* SECCIÓN DE RESERVAS */}
      <Card className="shadow-sm border-0 overflow-hidden">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0 fw-bold">
            <FontAwesomeIcon icon={faCalendarCheck} className="me-2" />
            Control de Reservas
          </h5>
          <Button as={Link} to="/reservas/create" variant="light" size="sm" className="fw-bold">
            <FontAwesomeIcon icon={faCalendarPlus} className="me-2" /> Nueva Reserva
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table striped hover variant="dark" className="mb-0">
              <thead className="bg-secondary text-white">
                <tr>
                  <th>Apellido</th>
                  <th>Fecha y Hora</th>
                  <th>Cancha / Lugar</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservas.length > 0 ? (
                  reservas.map((reserva) => (
                    <tr key={reserva.id}>
                      <td>{reserva.apellido || 'Vecino'}</td>
                      <td className="text-nowrap">{reserva.fechaFormateada}</td>
                      <td><Badge bg="success">{reserva.cancha}</Badge></td>
                      <td className="text-center">
                        <Stack direction="horizontal" gap={2} className="justify-content-center">
                          <Button as={Link} to={`/reservas/edit/${reserva.id}`} variant="outline-primary" size="sm">
                            <FontAwesomeIcon icon={faPenToSquare} />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => confirmDelete(reserva.id, 'reserva')}>
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </Stack>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="text-center py-4">No hay reservas activas en el sistema.</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};