import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Button, 
  Table, 
  Card,
  Badge,
  Spinner,
  Alert,
  Stack
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from "../../firebaseConfig/firebase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPenToSquare, 
  faTrash, 
  faUserPlus,
  faCalendarPlus,
  faUsers,
  faCalendarCheck
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useMediaQuery } from 'react-responsive';

const MySwal = withReactContent(Swal);

export const Administracion = () => {
  const [socios, setSocios] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // Obtener socios
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sociosSnapshot, reservasSnapshot] = await Promise.all([
          getDocs(collection(db, "usuarios")),
          getDocs(collection(db, "reservas"))
        ]);

        setSocios(
          sociosSnapshot.docs.map(doc => ({
            ...doc.data(), 
            id: doc.id
          }))
        );

        setReservas(
          reservasSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            fecha: doc.data().fecha instanceof Timestamp
              ? doc.data().fecha.toDate().toLocaleString()
              : new Date(doc.data().fecha).toLocaleString()
          }))
        );
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const confirmDelete = async (id, type) => {
    try {
      const result = await MySwal.fire({
        title: '¿Estás seguro?',
        text: type === 'socio' 
          ? "¡No podrás revertir esta acción!" 
          : "La reserva será eliminada permanentemente",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await deleteDoc(doc(db, type === 'socio' ? "usuarios" : "reservas", id));
        
        if (type === 'socio') {
          setSocios(socios.filter((socio) => socio.id !== id));
        } else {
          setReservas(reservas.filter((reserva) => reserva.id !== id));
        }

        await MySwal.fire(
          '¡Eliminado!',
          type === 'socio' 
            ? 'El socio ha sido eliminado.' 
            : 'La reserva ha sido eliminada.',
          'success'
        );
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      MySwal.fire(
        'Error',
        'Ha ocurrido un error al intentar eliminar.',
        'error'
      );
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Cargando datos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error al cargar los datos</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 px-3 px-md-5">
      {/* Sección de Socios */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FontAwesomeIcon icon={faUsers} className="me-2" />
            Administración de Socios
          </h5>
          <Button 
            as={Link} 
            to="/socios/create" 
            variant="light" 
            size="sm"
          >
            <FontAwesomeIcon icon={faUserPlus} className="me-2" />
            Nuevo Socio
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Email</th>
                  {!isMobile && <th>Rol</th>}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className="table-dark">
                {socios.length > 0 ? (
                  socios.map((socio) => (
                    <tr key={socio.id}>
                      <td>{socio.nombre}</td>
                      <td>{socio.apellido}</td>
                      <td>{socio.email}</td>
                      {!isMobile && (
                        <td>
                          {socio.rol?.administrador && <Badge bg="danger" className="me-1">Admin</Badge>}
                          {socio.rol?.guardia && <Badge bg="warning" className="me-1 text-dark">Guardia</Badge>}
                          {socio.rol?.propietario && <Badge bg="info" className="me-1">Propietario</Badge>}
                          {socio.rol?.inquilino && <Badge bg="secondary" className="me-1">Inquilino</Badge>}
                        </td>
                      )}
                      <td className="text-nowrap">
                        <Stack direction="horizontal" gap={2}>
                          <Button 
                            as={Link}
                            to={`/socios/edit/${socio.id}`}
                            variant="outline-primary"
                            size="sm"
                            title="Editar"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => confirmDelete(socio.id, 'socio')}
                            title="Eliminar"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </Stack>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isMobile ? 4 : 5} className="text-center text-muted py-4">
                      No hay socios registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Sección de Reservas */}
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FontAwesomeIcon icon={faCalendarCheck} className="me-2" />
            Administración de Reservas
          </h5>
          <Button 
            as={Link} 
            to="/reservas/create" 
            variant="light" 
            size="sm"
          >
            <FontAwesomeIcon icon={faCalendarPlus} className="me-2" />
            Nueva Reserva
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Socio</th>
                  <th>Fecha</th>
                  <th>Cancha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className="table-dark">
                {reservas.length > 0 ? (
                  reservas.map((reserva) => (
                    <tr key={reserva.id}>
                      <td>{reserva.apellido || 'N/A'}</td>
                      <td className="text-nowrap">{reserva.fecha}</td>
                      <td>{reserva.cancha}</td>
                      <td className="text-nowrap">
                        <Stack direction="horizontal" gap={2}>
                          <Button 
                            as={Link}
                            to={`/reservas/edit/${reserva.id}`}
                            variant="outline-primary"
                            size="sm"
                            title="Editar"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => confirmDelete(reserva.id, 'reserva')}
                            title="Eliminar"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </Stack>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      No hay reservas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};