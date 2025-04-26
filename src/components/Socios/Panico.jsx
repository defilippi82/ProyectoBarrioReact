import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  Image, 
  Button, 
  Container, 
  Row, 
  Col, 
  Card, 
  Spinner,
  Alert,
  Modal
} from 'react-bootstrap';
import { 
  FaExclamationTriangle, 
  FaBell, 
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaInfoCircle
} from 'react-icons/fa';
import { getFirestore, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { UserContext } from "../Services/UserContext";
import { obtenerTokenFCM } from '../../firebaseConfig/firebase';
import { getMessaging, onMessage } from 'firebase/messaging';
import { useMediaQuery } from 'react-responsive';

const messaging = getMessaging();

export const Panico = () => {
  const { userData } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState(null);
  const [location, setLocation] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [error, setError] = useState(null);
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isSmallMobile = useMediaQuery({ maxWidth: 576 });

  // Inicialización y obtención de token FCM
  useEffect(() => {
    const inicializar = async () => {
      try {
        const token = await obtenerTokenFCM();
        setFcmToken(token);
      } catch (error) {
        console.error("Error obteniendo el token FCM: ", error);
        setError("Error al configurar notificaciones");
      } finally {
        setIsLoading(false);
      }
    };
    inicializar();

    // Escuchar mensajes entrantes
    const unsubscribe = onMessage(messaging, payload => {
      console.log('Mensaje recibido: ', payload);
    });

    return () => unsubscribe();
  }, []);

  // Obtener ubicación del usuario
  const obtenerUbicacion = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setLocation(loc);
            resolve(loc);
          },
          error => {
            console.error("Error obteniendo ubicación: ", error);
            setError("No se pudo obtener la ubicación");
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        const error = "Geolocalización no soportada";
        console.error(error);
        setError(error);
        reject(error);
      }
    });
  }, []);

  // Enviar mensajes a múltiples usuarios
  const enviarMensaje = useCallback(async (usuarios, mensaje, prioridad) => {
    if (!location) {
      await obtenerUbicacion();
    }

    const db = getFirestore();
    try {
      const promesasMensajes = usuarios.map(async (usuario) => {
        await addDoc(collection(db, 'mensajes'), {
          sender: `${userData.manzana}-${userData.lote}`,
          receiver: `${usuario.manzana}-${usuario.lote}`,
          content: mensaje,
          prioridad: prioridad,
          ubicacion: location,
          timestamp: new Date(),
          read: false,
          source: 'alerta'
        });
      });
      await Promise.all(promesasMensajes);
      return true;
    } catch (error) {
      console.error("Error enviando mensajes: ", error);
      setError("Error al enviar alertas");
      return false;
    }
  }, [location, userData, obtenerUbicacion]);

  // Manejar alerta de ruidos
  const manejarRuidos = useCallback(async () => {
    if (!userData?.manzana) {
      setError("Datos de usuario incompletos");
      return false;
    }

    try {
      const db = getFirestore();
      const usuariosManzanaQuery = query(
        collection(db, 'usuarios'),
        where('manzana', '==', userData.manzana)
      );
      const usuariosSnapshot = await getDocs(usuariosManzanaQuery);
      const usuariosManzana = usuariosSnapshot.docs.map(doc => doc.data());

      const mensaje = `Soy del lote ${userData.manzana}-${userData.lote} y escucho ruidos sospechosos`;
      return await enviarMensaje(usuariosManzana, mensaje, 'media');
    } catch (error) {
      console.error("Error en manejarRuidos: ", error);
      setError("Error al notificar ruidos");
      return false;
    }
  }, [userData, enviarMensaje]);

  // Manejar alerta de emergencia
  const manejarAlerta = useCallback(async () => {
    if (!userData?.manzana || !userData?.isla) {
      setError("Datos de usuario incompletos");
      return false;
    }

    try {
      const db = getFirestore();
      const [usuariosIslaSnapshot, usuariosGuardiaSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'usuarios'), where('isla', '==', userData.isla))),
        getDocs(query(collection(db, 'usuarios'), where('rol.guardia', '==', true)))
      ]);

      const usuariosIsla = usuariosIslaSnapshot.docs.map(doc => doc.data());
      const usuariosGuardia = usuariosGuardiaSnapshot.docs.map(doc => doc.data());
      const todosUsuarios = [...usuariosIsla, ...usuariosGuardia];

      const mensaje = `EMERGENCIA en ${userData.manzana}-${userData.lote}, necesito ayuda inmediata`;
      return await enviarMensaje(todosUsuarios, mensaje, 'alta');
    } catch (error) {
      console.error("Error en manejarAlerta: ", error);
      setError("Error al enviar alerta de emergencia");
      return false;
    }
  }, [userData, enviarMensaje]);

  // Confirmar acción antes de ejecutarla
  const confirmarAccion = (tipo) => {
    setActionType(tipo);
    setShowConfirm(true);
  };

  // Ejecutar la acción confirmada
  const ejecutarAccion = async () => {
    setShowConfirm(false);
    let success = false;
    
    if (actionType === 'alerta') {
      success = await manejarAlerta();
    } else if (actionType === 'ruidos') {
      success = await manejarRuidos();
    }

    if (success) {
      Swal.fire({
        icon: 'success',
        title: '¡Alerta enviada!',
        text: actionType === 'alerta' 
          ? 'La guardia y vecinos han sido notificados' 
          : 'Los vecinos de tu manzana han sido notificados',
        timer: 3000
      });
    }
  };

  // Llamar al 911
  const llamar911 = () => {
    window.open('tel:911');
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Cargando sistema de alertas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error en el sistema de alertas</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={() => setError(null)}>
              Reintentar
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 px-2">
      <h2 className="text-center mb-4">Sistema de Emergencias</h2>
      
      <Row className="g-4">
        {/* Tarjeta de Alerta */}
        <Col xs={12} sm={12} md={6} lg={4}>
          <Card className="h-100 shadow-sm w-100 border-danger">
            <Card.Body className="text-center">
              <div className="icon-container mb-3">
                <FaExclamationTriangle size={isSmallMobile ? 70 : isMobile ? 80 : 90} className="text-danger" />
              </div>
              <Card.Title className={`fw-bold ${isSmallMobile ? 'fs-5' : isMobile ? 'fs-4' : 'fs-3'}`}>
                ALERTA DE EMERGENCIA
              </Card.Title>
              <Button 
                variant="danger" 
                size={isSmallMobile ? "md" : "lg"}
                onClick={() => confirmarAccion('alerta')}
                className="w-100 py-3 mt-3"
              >
                <FaBell className="me-2" />
                ACTIVAR ALERTA
              </Button>
              <Card.Text className="mt-3">
                Notifica a la guardia y vecinos de tu isla sobre una emergencia inmediata
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
  
        {/* Tarjeta de Ruidos */}
        <Col xs={12} sm={12} md={6} lg={4}>
          <Card className="h-100 shadow-sm w-100 border-warning">
            <Card.Body className="text-center">
              <div className="icon-container mb-3">
                <FaBell size={isSmallMobile ? 70 : isMobile ? 80 : 90} className="text-warning" />
              </div>
              <Card.Title className={`fw-bold ${isSmallMobile ? 'fs-5' : isMobile ? 'fs-4' : 'fs-3'}`}>
                RUIDOS SOSPECHOSOS
              </Card.Title>
              <Button 
                variant="warning" 
                size={isSmallMobile ? "md" : "lg"}
                onClick={() => confirmarAccion('ruidos')}
                className="w-100 py-3 mt-3 text-white"
              >
                <FaBell className="me-2" />
                REPORTAR RUIDOS
              </Button>
              <Card.Text className="mt-3">
                Avisa a los vecinos de tu manzana sobre actividades sospechosas
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
  
        {/* Tarjeta de 911 */}
        <Col xs={12} sm={12} md={6} lg={4}>
          <Card className="h-100 shadow-sm w-100 border-primary">
            <Card.Body className="text-center">
              <div className="icon-container mb-3">
                <FaPhoneAlt size={isSmallMobile ? 70 : isMobile ? 80 : 90} className="text-primary" />
              </div>
              <Card.Title className={`fw-bold ${isSmallMobile ? 'fs-5' : isMobile ? 'fs-4' : 'fs-3'}`}>
                LLAMADA DE EMERGENCIA
              </Card.Title>
              <Button 
                variant="primary" 
                size={isSmallMobile ? "md" : "lg"}
                onClick={llamar911}
                className="w-100 py-3 mt-3"
              >
                <FaPhoneAlt className="me-2" />
                911
              </Button>
              <Card.Text className="mt-3">
                Realiza una llamada directa al servicio de emergencias 911
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
  
      {/* Información de ubicación */}
      {location && (
        <Row className="mt-4">
          <Col>
            <Alert variant="info" className="d-flex align-items-center">
              <FaMapMarkerAlt size={24} className="me-3" />
              <div>
                <Alert.Heading>Tu ubicación ha sido compartida</Alert.Heading>
                <p className="mb-0">
                  Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                </p>
              </div>
            </Alert>
          </Col>
        </Row>
      )}
  
      {/* Modal de confirmación */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="w-100 text-center">
            <FaExclamationTriangle className="text-warning me-2" />
            Confirmar acción
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {actionType === 'alerta' ? (
            <>
              <p className="fw-bold">¿Estás seguro que deseas activar la ALERTA DE EMERGENCIA?</p>
              <p>Se notificará a la guardia y vecinos de tu isla.</p>
            </>
          ) : (
            <>
              <p className="fw-bold">¿Reportar ruidos sospechosos?</p>
              <p>Se notificará a los vecinos de tu manzana.</p>
            </>
          )}
          <div className="d-flex justify-content-center gap-3 mt-3">
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowConfirm(false)}
              className="px-4"
            >
              Cancelar
            </Button>
            <Button 
              variant={actionType === 'alerta' ? 'danger' : 'warning'}
              onClick={ejecutarAccion}
              className="px-4 text-white"
            >
              {actionType === 'alerta' ? 'CONFIRMAR ALERTA' : 'REPORTAR RUIDOS'}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
  
};