import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Card, Button, Form, Badge, ListGroup, 
  Row, Col, Spinner, Stack 
} from 'react-bootstrap';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, updateDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import { UserContext } from '../Services/UserContext';
import { MessageDetail } from './MessageDetail';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, faEnvelope, faEnvelopeOpen, faInbox, 
  faUserEdit, faMapMarkedAlt 
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
// IMPORTACIÓN CRÍTICA QUE FALTABA:
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

  useEffect(() => {
    if (!userData?.manzana || !userData?.lote) return;

    const socioNumber = `${userData.manzana}-${userData.lote}`;
    const q = query(
      collection(db, 'mensajes'),
      where('receiver', '==', socioNumber),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(docs);
      setLoading(false);
    }, (err) => {
      console.error("Error en onSnapshot:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !receiverManzana || !receiverLote) return;

    try {
      await addDoc(collection(db, 'mensajes'), {
        sender: `${userData.manzana}-${userData.lote}`,
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
      MySwal.fire({ icon: 'success', title: 'Enviado', timer: 1000, showConfirmButton: false });
    } catch (err) {
      MySwal.fire('Error', 'No se pudo enviar', 'error');
    }
  };

  const handleShowDetail = async (message) => {
    setSelectedMessage(message);
    setShowDetail(true);
    if (!message.read) {
      await updateDoc(doc(db, 'mensajes', message.id), { read: true });
    }
  };

  if (loading && messages.length === 0) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <Container className="py-4 px-2">
      <h2 className="text-center mb-4 fw-bold text-primary">Mensajería</h2>
      <Row className="g-4">
        <Col xs={12} lg={4}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-primary text-white">Nuevo Mensaje</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSendMessage}>
                <Row className="g-2 mb-3">
                  <Col><Form.Control type="number" placeholder="Manz." value={receiverManzana} onChange={e => setReceiverManzana(e.target.value)} required /></Col>
                  <Col><Form.Control type="number" placeholder="Lote" value={receiverLote} onChange={e => setReceiverLote(e.target.value)} required /></Col>
                </Row>
                <Form.Control as="textarea" rows={4} className="mb-3" placeholder="Mensaje..." value={newMessage} onChange={e => setNewMessage(e.target.value)} required />
                <Button variant="primary" type="submit" className="w-100 fw-bold py-2">
                  <FontAwesomeIcon icon={faPaperPlane} className="me-2" /> ENVIAR
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={8}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-primary">Bandeja de Entrada</h5>
              <Badge bg="primary">{messages.length}</Badge>
            </Card.Header>
            <ListGroup variant="flush">
              {messages.map((msg) => (
                <ListGroup.Item key={msg.id} action onClick={() => handleShowDetail(msg)} className={`py-3 ${!msg.read ? 'bg-light border-start border-primary border-4' : ''}`}>
                  <Stack direction="horizontal" gap={3}>
                    <div className={`rounded-circle p-2 ${msg.source === 'alerta' ? 'bg-danger-subtle' : 'bg-primary-subtle'}`}>
                      <FontAwesomeIcon icon={msg.source === 'alerta' ? faMapMarkedAlt : (msg.read ? faEnvelopeOpen : faEnvelope)} className={msg.source === 'alerta' ? 'text-danger' : 'text-primary'} />
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex justify-content-between">
                        <strong className="small">Lote {msg.sender}</strong>
                        <small className="text-muted" style={{fontSize: '10px'}}>
                          {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString() : ''}
                        </small>
                      </div>
                      <p className="mb-0 text-truncate small text-muted">{msg.content}</p>
                    </div>
                  </Stack>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
      </Row>
      {showDetail && selectedMessage && (
        <MessageDetail message={selectedMessage} handleClose={() => setShowDetail(false)} currentUser={`${userData.manzana}-${userData.lote}`} />
      )}
    </Container>
  );
};