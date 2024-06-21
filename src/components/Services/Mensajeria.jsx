import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import { UserContext } from '../Services/UserContext';
import { Form, Table, Button, FloatingLabel, Row, Col, Pagination } from 'react-bootstrap';
import ListGroup from 'react-bootstrap/ListGroup';
import { MessageDetail } from './MessageDetail';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const Mensajeria = () => {
  const { userData } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [receiverManzana, setReceiverManzana] = useState('');
  const [receiverLote, setReceiverLote] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const fetchMessages = () => {
      if (userData && userData.manzana && userData.lote) {
        const socioNumber = `${userData.manzana}-${userData.lote}`;
        const q = query(
          collection(db, 'mensajes'),
          where('receiver', '==', socioNumber),
          orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const messagesData = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            messagesData.push({ id: doc.id, ...data });
          });
          setMessages(messagesData);
        });

        return () => unsubscribe();
      }
    };

    fetchMessages();
  }, [userData]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (newMessage.trim() === '' || receiverManzana.trim() === '' || receiverLote.trim() === '') return;

    const receiver = `${receiverManzana}-${receiverLote}`;
    const currentDate = new Date();

    const newEntry = {
      sender: `${userData.manzana}-${userData.lote}`,
      receiver: receiver,
      content: newMessage,
      timestamp: currentDate,
      read: false
    };

    try {
      await addDoc(collection(db, 'mensajes'), newEntry);
      setNewMessage('');
      setReceiverManzana('');
      setReceiverLote('');
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };

  const handleShowDetail = async (message) => {
    setSelectedMessage(message);
    setShowDetail(true);
    if (!message.read) {
      try {
        await updateDoc(doc(db, 'mensajes', message.id), { read: true });
        setMessages(messages.map(msg => msg.id === message.id ? { ...msg, read: true } : msg));
      } catch (error) {
        console.error('Error marking message as read: ', error);
      }
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedMessage(null);
  };

  const handleDeleteMessage = async (id) => {
    MySwal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esto',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, bórralo',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, 'mensajes', id));
          setMessages(messages.filter(message => message.id !== id));
          MySwal.fire('Borrado', 'El mensaje ha sido borrado', 'success');
        } catch (error) {
          console.error('Error deleting message: ', error);
          MySwal.fire('Error', 'Hubo un problema al borrar el mensaje', 'error');
        }
      }
    });
  };

  return (
    <div className="container mt-4">
      <h2>Mensajería</h2>
      <ListGroup>
        {messages.map((message) => (
          <ListGroup.Item key={message.id} action onClick={() => handleShowDetail(message)}>
            <strong>{message.sender}</strong>: {message.content}
            <br />
            <small>{new Date(message.timestamp.seconds * 1000).toLocaleString()}</small>
            <Button variant="danger" size="sm" className="float-end" onClick={() => handleDeleteMessage(message.id)}>
              Eliminar
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>

      {showDetail && selectedMessage && (
        <MessageDetail message={selectedMessage} handleCloseDetail={handleCloseDetail} />
      )}

      <Form onSubmit={handleSendMessage} className="mt-3">
      <Row className="align-items-center">
          <Col xs="auto">

        <Form.Group  className="mb-3" controlId="formManzana">
          <Form.Label >Manzana:</Form.Label>
            <Form.Control
              type="number"
              value={receiverManzana}
              onChange={(e) => setReceiverManzana(e.target.value)}
              required
            />
          
        </Form.Group>
        </Col>
        <Col xs="auto">

        <Form.Group  className="mb-3" controlId="formLote">
          <Form.Label >Lote:</Form.Label>
          
            <Form.Control
              type="number"
              value={receiverLote}
              onChange={(e) => setReceiverLote(e.target.value)}
              required
            />
        </Form.Group>
          </Col>
        <Col xs="auto">

        <FloatingLabel controlId="floatingTextarea" label="Mensaje" className="mb-3">
          <Form.Control
            as="textarea"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{ height: '100px' }}
            required
            />
        </FloatingLabel>
            </Col>
            </Row>

        <Button variant="primary" type="submit">Enviar</Button>
      </Form>
    </div>
  );
};
