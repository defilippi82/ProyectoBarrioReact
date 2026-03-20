import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Card, Button, Form, Badge, ListGroup, 
  Row, Col, Spinner, Stack, InputGroup 
} from 'react-bootstrap';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import { UserContext } from '../Services/UserContext';
import { MessageDetail } from './MessageDetail';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, faEnvelope, faEnvelopeOpen, 
  faTrash, faMapMarkedAlt, faUser 
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useMediaQuery } from 'react-responsive';

const MySwal = withReactContent(Swal);

export const Mensajeria = () => {
  const { userData } = useContext(UserContext);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [receiverManzana, setReceiverManzana] = useState('');
  const [receiverLote, setReceiverLote] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  const socioActual = `${userData?.manzana}-${userData?.lote}`;

  useEffect(() => {
    if (!userData?.manzana || !userData?.lote) return;

    const q = query(
      collection(db, 'mensajes'),
      where('receiver', '==', socioActual),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(docs);
      setLoading(false);
    }, (err) => {
      console.error("Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData, socioActual]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !receiverManzana || !receiverLote) return;

    try {
      await addDoc(collection(db, 'mensajes'), {
        sender: socioActual,
        senderName: userData.nombre || 'Vecino',
        receiver: `${receiverManzana}-${receiverLote}`,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false,
        source: 'chat'
      });
      setNewMessage('');
      setReceiverManzana('');
      setReceiverLote('');
      MySwal.fire({ icon: 'success', title: 'Mensaje enviado', timer: 1500, showConfirmButton: false });
    } catch (err) {
      MySwal.fire('Error', 'No se pudo enviar el mensaje', 'error');
    }
  };

  const handleDeleteMessage = async (id, e) => {
    e.stopPropagation(); // IMPORTANTE: Evita que se abra el mensaje al intentar borrarlo
    const res = await MySwal.fire({
      title: '¿Eliminar mensaje?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, borrar'
    });

    if (res.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'mensajes', id));
        MySwal.fire({ icon: 'success', title: 'Eliminado', timer: 1000, showConfirmButton: false });
      } catch (error) {
        MySwal.fire('Error', 'No se pudo eliminar', 'error');
      }
    }
  };

  const handleShowDetail = async (message) => {
    setSelectedMessage(message);
    setShowDetail(true);
    if (!message.read) {
      await updateDoc(doc(db, 'mensajes', message.id), { read: true });
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && messages.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="grow" variant="primary" />
        <p className="mt-2 text-muted">Cargando mensajes...</p>
      </div>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="text-center mb-4 fw-bold text-primary">Centro de Mensajería</h2>
      
      <Row className="g-4">
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <Col xs={12} lg={4}>
          <Card className="shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
            <Card.Header className="bg-primary text-white fw-bold py-3">
              <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
              Nuevo Mensaje
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSendMessage}>
                <Form.Label className="small fw-bold text-muted">DESTINATARIO</Form.Label>
                <Row className="g-2 mb-3">
                  <Col>
                    <InputGroup size="sm">
                      <InputGroup.Text>Mzn</InputGroup.Text>
                      <Form.Control 
                        type="number" 
                        value={receiverManzana} 
                        onChange={e => setReceiverManzana(e.target.value)} 
                        required 
                      />
                    </InputGroup>
                  </Col>
                  <Col>
                    <InputGroup size="sm">
                      <InputGroup.Text>Lote</InputGroup.Text>
                      <Form.Control 
                        type="number" 
                        value={receiverLote} 
                        onChange={e => setReceiverLote(e.target.value)} 
                        required 
                      />
                    </InputGroup>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">CONTENIDO</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={5} 
                    placeholder="Escribe tu mensaje aquí..." 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)} 
                    required 
                    className="border-0 bg-light"
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 shadow-sm fw-bold">
                  ENVIAR AHORA
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* COLUMNA DERECHA: BANDEJA */}
        <Col xs={12} lg={8}>
          <Card className="shadow-sm border-0 overflow-hidden">
            <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-dark">Bandeja de Entrada</h5>
              <Badge pill bg="primary" className="px-3">{messages.length} mensajes</Badge>
            </Card.Header>
            
            <ListGroup variant="flush">
              {messages.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <FontAwesomeIcon icon={faEnvelopeOpen} size="3x" className="mb-3 opacity-25" />
                  <p>No tienes mensajes recibidos.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <ListGroup.Item 
                    key={msg.id} 
                    action 
                    onClick={() => handleShowDetail(msg)} 
                    className={`py-3 border-start border-4 ${!msg.read ? 'bg-aliceblue border-primary' : 'border-transparent text-secondary'}`}
                  >
                    <Stack direction="horizontal" gap={3} className="align-items-start">
                      <div className={`avatar-icon ${msg.source === 'alerta' ? 'bg-danger text-white' : 'bg-light text-primary'}`}>
                        <FontAwesomeIcon icon={msg.source === 'alerta' ? faMapMarkedAlt : faUser} />
                      </div>
                      
                      <div className="flex-grow-1 min-width-0">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className={`small ${!msg.read ? 'fw-bold text-dark' : ''}`}>
                            Lote {msg.sender} <span className="text-muted fw-normal">({msg.senderName})</span>
                          </span>
                          <span className="x-small text-muted">{formatTime(msg.timestamp)}</span>
                        </div>
                        <p className={`mb-0 text-truncate ${!msg.read ? 'text-dark fw-medium' : 'text-muted'}`} style={{fontSize: '0.9rem'}}>
                          {msg.content}
                        </p>
                      </div>

                      <Button 
                        variant="link" 
                        className="text-danger p-0 ms-2" 
                        onClick={(e) => handleDeleteMessage(msg.id, e)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </Stack>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      {showDetail && selectedMessage && (
        <MessageDetail 
          message={selectedMessage} 
          handleClose={() => setShowDetail(false)} 
          currentUser={socioActual} 
        />
      )}
    </Container>
  );
};