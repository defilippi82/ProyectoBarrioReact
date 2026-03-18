import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Button, Container, Row, Col, Card, Spinner, Alert, Modal, Table } from 'react-bootstrap';
import { FaExclamationTriangle, FaBell, FaPhoneAlt, FaMapMarkerAlt, FaHistory } from 'react-icons/fa';
import { getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { UserContext } from "../Services/UserContext";
import { obtenerTokenFCM } from '../../firebaseConfig/firebase';
import { getMessaging, onMessage } from 'firebase/messaging';
import { useMediaQuery } from 'react-responsive';
import Swal from 'sweetalert2';

const messaging = getMessaging();

export const Panico = () => {
  const { userData } = useContext(UserContext);
  const [state, setState] = useState({
    isLoading: true,
    location: null,
    showConfirm: false,
    actionType: null,
    error: null,
    incidencias: [] // Nuevo estado para el registro
  });

  const isMobile = useMediaQuery({ maxWidth: 768 });

  // --- CORRECCIÓN DE SONIDO ---
  const playAlertSound = useCallback((tipo) => {
    // Se elimina '/public' de la ruta para compatibilidad con Vercel
    const audioSrc = tipo === 'alerta' ? '/Sound/siren.mp3' : '/Sound/mensaje.mp3';
    const audio = new Audio(audioSrc);
    audio.play().catch(err => console.log("Reproducción automática bloqueada por el navegador"));
  }, []);

  // --- CARGA DE INCIDENCIAS Y NOTIFICACIONES ---
  useEffect(() => {
    const db = getFirestore();
    
    // Escuchar incidencias recientes del barrio (últimas 5)
    const qIncidencias = query(
      collection(db, 'mensajes'),
      where('source', '==', 'alerta'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribeIncidencias = onSnapshot(qIncidencias, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setState(prev => ({ ...prev, incidencias: docs, isLoading: false }));
    });

    obtenerTokenFCM().catch(console.error);
    
    const unsubscribeFCM = onMessage(messaging, payload => {
      playAlertSound('mensaje');
      Swal.fire('Notificación', payload.notification.body, 'info');
    });

    return () => {
      unsubscribeIncidencias();
      unsubscribeFCM();
    };
  }, [playAlertSound]);

  const obtenerUbicacion = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  }, []);

  const dispararAlerta = async (tipo) => {
    if (!userData?.manzana || !userData?.lote) return;

    setState(prev => ({ ...prev, isLoading: true, showConfirm: false }));
    const db = getFirestore();
    const currentLoc = await obtenerUbicacion();
    
    try {
      let usuariosDestino = [];
      let mensaje = "";
      let prioridad = "media";

      if (tipo === 'alerta') {
        const [snapIsla, snapGuardia] = await Promise.all([
          getDocs(query(collection(db, 'usuarios'), where('isla', '==', userData.isla))),
          getDocs(query(collection(db, 'usuarios'), where('rol.guardia', '==', true)))
        ]);
        usuariosDestino = [...snapIsla.docs, ...snapGuardia.docs].map(d => d.data());
        mensaje = `🚨 EMERGENCIA en Lote ${userData.manzana}-${userData.lote}`;
        prioridad = "alta";
      } else {
        const snapManzana = await getDocs(query(collection(db, 'usuarios'), where('manzana', '==', userData.manzana)));
        usuariosDestino = snapManzana.docs.map(d => d.data());
        mensaje = `⚠️ Ruidos sospechosos cerca del Lote ${userData.manzana}-${userData.lote}`;
      }

      const batchPromises = usuariosDestino
        .filter(u => u.lote !== userData.lote)
        .map(u => addDoc(collection(db, 'mensajes'), {
          sender: `${userData.manzana}-${userData.lote}`,
          receiver: `${u.manzana}-${u.lote}`,
          content: mensaje,
          prioridad,
          ubicacion: currentLoc,
          timestamp: serverTimestamp(),
          read: false,
          source: 'alerta'
        }));

      await Promise.all(batchPromises);
      playAlertSound('alerta'); // Sonar al enviar
      setState(prev => ({ ...prev, location: currentLoc, isLoading: false }));
      Swal.fire('Enviado', 'Alerta distribuida', 'success');
      
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <Container className="py-4">
      <h2 className="text-center mb-4 fw-bold text-primary">Seguridad CUBE</h2>
      
      <Row className="g-3 mb-5">
        <Col xs={12} md={4}>
          <Card className="h-100 border-danger shadow-sm text-center p-3">
            <FaExclamationTriangle size={50} className="text-danger mx-auto mb-2" />
            <Card.Title>EMERGENCIA</Card.Title>
            <Button variant="danger" className="mt-auto py-3 fw-bold" onClick={() => setState(p => ({ ...p, showConfirm: true, actionType: 'alerta' }))}>
              ACTIVAR
            </Button>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="h-100 border-warning shadow-sm text-center p-3">
            <FaBell size={50} className="text-warning mx-auto mb-2" />
            <Card.Title>RUIDOS</Card.Title>
            <Button variant="warning" className="mt-auto py-3 fw-bold text-white" onClick={() => setState(p => ({ ...p, showConfirm: true, actionType: 'ruidos' }))}>
              REPORTAR
            </Button>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="h-100 border-primary shadow-sm text-center p-3">
            <FaPhoneAlt size={50} className="text-primary mx-auto mb-2" />
            <Card.Title>911</Card.Title>
            <Button variant="primary" className="mt-auto py-3 fw-bold" onClick={() => window.open('tel:911')}>
              LLAMAR
            </Button>
          </Card>
        </Col>
      </Row>

      {/* --- REGISTRO DE INCIDENCIAS --- */}
      <Card className="shadow-sm border-0 bg-light">
        <Card.Body>
          <Card.Title className="d-flex align-items-center mb-3">
            <FaHistory className="me-2 text-secondary" /> Registro de Incidencias Recientes
          </Card.Title>
          <Table responsive hover className="bg-white rounded">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Origen</th>
                <th>Evento</th>
              </tr>
            </thead>
            <tbody>
              {state.incidencias.length > 0 ? state.incidencias.map((inc) => (
                <tr key={inc.id}>
                  <td className="small text-muted">
                    {inc.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="fw-bold">{inc.sender}</td>
                  <td className={inc.prioridad === 'alta' ? 'text-danger fw-bold' : 'text-dark'}>
                    {inc.content}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="3" className="text-center text-muted">No hay incidencias hoy</td></tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={state.showConfirm} onHide={() => setState(p => ({ ...p, showConfirm: false }))} centered>
        <Modal.Body className="text-center p-4">
          <h5>¿Confirmas el envío de alerta?</h5>
          <div className="d-flex justify-content-center gap-3 mt-4">
            <Button variant="outline-secondary" onClick={() => setState(p => ({ ...p, showConfirm: false }))}>Cancelar</Button>
            <Button variant={state.actionType === 'alerta' ? 'danger' : 'warning'} onClick={() => dispararAlerta(state.actionType)}>
              Confirmar
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};