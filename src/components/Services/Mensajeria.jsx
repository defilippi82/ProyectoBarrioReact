import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import { UserContext } from '../Services/UserContext';
import { Form, Button, Row, Col, ListGroup } from 'react-bootstrap';
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
          let newUnreadMessage = false;
          let newAlertMessage = false;

          querySnapshot.forEach(async (doc) => {
            const data = doc.data();
            messagesData.push({ id: doc.id, ...data });

            // Detectar si hay un mensaje no leído
            if (!data.read) {
              newUnreadMessage = true;
              if (data.source === 'alerta') {
                newAlertMessage = true;
              }
              await updateDoc(doc.ref, { read: true });
            }
          });
          setMessages(messagesData);
          // Reproducir sonido si hay un nuevo mensaje no leído
          /*if (newUnreadMessage) {
            const audioSrc = newAlertMessage ? '/public/Sound/siren.mp3' : '/public/Sound/mensaje.mp3'; // Ajusta la ruta según la ubicación de tu archivo de sonido
            const audio = new Audio(audioSrc);
            audio.play();
          }*/
        });

        return () => unsubscribe();
      }
    };

    fetchMessages();
  }, [userData]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (newMessage.trim() === '' || receiverManzana.trim() === '' || receiverLote.trim() === '') return;

    const currentDate = new Date();
    const receiver = `${receiverManzana}-${receiverLote}`;

    const newEntry = {
      sender: `${userData.manzana}-${userData.lote}`,
      receiver: receiver,
      content: newMessage,
      timestamp: currentDate,
      read: false,
      source: 'mensaje' // Ajusta según sea necesario
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

  const handleShowDetail = (message) => {
    setSelectedMessage(message);
    setShowDetail(true);
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
              Borrar
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <Form Fluid onSubmit={handleSendMessage} className="xs mt-4" xs="auto">
        <Row className="align-items-center">
          <Col xs="auto">
            <Form.Group controlId="receiverManzanaInput">
              <Form.Label>Manzana</Form.Label>
              <Form.Control
                type="number"
                value={receiverManzana}
                onChange={(e) => setReceiverManzana(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col xs="auto">
            <Form.Group controlId="receiverLoteInput">
              <Form.Label>Lote</Form.Label>
              <Form.Control
                type="number"
                value={receiverLote}
                onChange={(e) => setReceiverLote(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col xs="auto">
            <Form.Group controlId="messageInput" className="mt-2">
              <Form.Label>Mensaje</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
        <Button variant="primary" type="submit" className="mt-3">
          Enviar Mensaje
        </Button>
      </Form>
      {selectedMessage && (
        <MessageDetail
          show={showDetail}
          handleClose={handleCloseDetail}
          message={selectedMessage}
          handleDelete={handleDeleteMessage}
        />
      )}
    </div>
  );
};
