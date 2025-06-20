import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, 
  Card, 
  Button, 
  Form, 
  Table, 
  Badge, 
  ListGroup, 
  FloatingLabel,
  Row, 
  Col,
  Spinner,
  Alert,
  Stack
} from 'react-bootstrap';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import { UserContext } from '../Services/UserContext';
import { MessageDetail } from './MessageDetail';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faTrash, 
  faEnvelope, 
  faEnvelopeOpen,
  faReply,
  faUserTag
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useMediaQuery } from 'react-responsive';

const MySwal = withReactContent(Swal);

export const Mensajeria = () => {
  const { userData } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [receiverManzana, setReceiverManzana] = useState('');
  const [receiverLote, setReceiverLote] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  useEffect(() => {
    const fetchMessages = () => {
      if (userData && userData.manzana && userData.lote) {
        const socioNumber = `${userData.manzana}-${userData.lote}`;
        const q = query(
          collection(db, 'mensajes'),
          where('receiver', '==', socioNumber),
          orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, 
          (querySnapshot) => {
            const messagesData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate()
            }));
            setMessages(messagesData);
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching messages: ', error);
            setError('Error al cargar los mensajes');
            setLoading(false);
          }
        );

        return () => unsubscribe();
      }
    };

    fetchMessages();
  }, [userData]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !receiverManzana.trim() || !receiverLote.trim()) {
      setError('Todos los campos son requeridos');
      return;
    }

    const receiver = `${receiverManzana}-${receiverLote}`;
    const currentDate = new Date();

    try {
      setLoading(true);
      await addDoc(collection(db, 'mensajes'), {
        sender: `${userData.manzana}-${userData.lote}`,
        senderName: userData.nombre || '',
        receiver,
        content: newMessage.trim(),
        timestamp: currentDate,
        read: false
      });
      setNewMessage('');
      setReceiverManzana('');
      setReceiverLote('');
      setError(null);
      MySwal.fire({
        title: 'Mensaje enviado',
        text: 'Tu mensaje ha sido enviado correctamente',
        icon: 'success',
        timer: 2000
      });
    } catch (error) {
      console.error('Error sending message: ', error);
      setError('Error al enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetail = async (message) => {
    setSelectedMessage(message);
    setShowDetail(true);
    if (!message.read) {
      try {
        await updateDoc(doc(db, 'mensajes', message.id), { read: true });
        setMessages(messages.map(msg => 
          msg.id === message.id ? { ...msg, read: true } : msg
        ));
      } catch (error) {
        console.error('Error marking message as read: ', error);
      }
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedMessage(null);
  };

  const handleDeleteMessage = async (id, e) => {
    e.stopPropagation();
    
    const result = await MySwal.fire({
      title: '¿Eliminar mensaje?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'mensajes', id));
        setMessages(messages.filter(message => message.id !== id));
        MySwal.fire('Eliminado', 'El mensaje ha sido eliminado', 'success');
      } catch (error) {
        console.error('Error deleting message: ', error);
        MySwal.fire('Error', 'No se pudo eliminar el mensaje', 'error');
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && messages.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Cargando mensajes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="justify-content-center align-items-center py-4 px-3 px-md-5">
      <Row className="justify-content-center align-items-center mb-4 text-center text-white">
        <Col md="auto">
          <Card className="shadow-sm bg-transparent justify-content-center align-items-center">
            <Card.Header className="bg-primary ">
              <h2 className="mb-0 d-flex align-items-center">
                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                Mensajería
              </h2>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSendMessage}>
                <Row className="g-3 ">
      <Col md="auto">
                 <Form.Group controlId="formManzana">
                <Form.Label className="fw-bold">Manzana N°</Form.Label>
                <Form.Control
                type="number"
                min="1"
                value={receiverManzana}
                onChange={(e) => setReceiverManzana(e.target.value)}
                required
                placeholder="Ej: 1"
              />
       
            </Form.Group>
    </Col>
    
    <Col md="auto">
      <Form.Group controlId="formLote">
        <Form.Label className="fw-bold">Lote N°</Form.Label>
        <Form.Control
          type="number"
          min="1"
          value={receiverLote}
          onChange={(e) => setReceiverLote(e.target.value)}
          required
          placeholder="Ej: 23"
        />
              </Form.Group>
    </Col>
                  </Row>
                  <Row className="g-3 mb-3">
                  <Col md="auto">
                    <FloatingLabel controlId="floatingMessage" label="Mensaje">
                      <Form.Control
                        as="textarea"
                        placeholder="Escribe tu mensaje"
                        style={{ height: '100px' }}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        required
                      />
                    </FloatingLabel>
                  </Col>
                  <Col md="auto" className="d-flex align-items-end">
                    <Button 
                      variant="success" 
                      type="submit"
                      className="w-100"
                      disabled={loading}
                    >
                      {loading ? (
                        <Spinner size="sm" animation="border" />
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                          Enviar
                        </>
                      )}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow-sm bg-info text-white">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Bandeja de entrada</h3>
              <Badge pill bg="light" text="dark">
                {messages.length} mensajes
              </Badge>
            </Card.Header>
            <Card.Body className="p-0">
              {messages.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  No hay mensajes recibidos
                </div>
              ) : (
                <ListGroup variant="flush">
                  {messages.map((message) => (
                    <ListGroup.Item 
                      key={message.id}
                      action 
                      onClick={() => handleShowDetail(message)}
                      className="py-3"
                    >
                      <Stack direction="horizontal" gap={3}>
                        <div className="d-flex align-items-center">
                          <FontAwesomeIcon 
                            icon={message.read ? faEnvelopeOpen : faEnvelope} 
                            className={`me-2 ${message.read ? 'text-secondary' : 'text-primary'}`}
                          />
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between">
                            <strong className={!message.read ? 'fw-bold' : ''}>
                              {message.senderName || message.sender}
                            </strong>
                            <small className="text-muted">
                              {formatDate(message.timestamp)}
                            </small>
                          </div>
                          <p className={`mb-0 text-truncate ${!message.read ? 'fw-bold' : ''}`}>
                            {message.content}
                          </p>
                        </div>
                        <Button 
                          variant="outline-danger"
                          size="sm"
                          onClick={(e) => handleDeleteMessage(message.id, e)}
                          title="Eliminar mensaje"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </Stack>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {showDetail && selectedMessage && (
        <MessageDetail 
          message={selectedMessage} 
          handleClose={handleCloseDetail}
          currentUser={`${userData.manzana}-${userData.lote}`}
        />
      )}
    </Container>
  );
};