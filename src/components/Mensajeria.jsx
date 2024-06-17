import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig/firebase';
import { UserContext } from './UserContext';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import {MessageDetail} from './MessageDetail';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const Mensajeria = () => {
  const { userData } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [receiver, setReceiver] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const fetchMessages = () => {
      if (userData && userData.nombre) {
        const q = query(
          collection(db, 'mensajes'),
          where('receiver', '==', userData.nombre),
          orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const messagesData = [];
          querySnapshot.forEach(async (doc) => {
            messagesData.push({ id: doc.id, ...doc.data() });

            // Marcar mensaje como leído
            if (!doc.data().read) {
              await updateDoc(doc.ref, { read: true });
            }
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

    if (newMessage.trim() === '' || receiver.trim() === '') return;

    const currentDate = new Date();

    const newEntry = {
      sender: userData.nombre,
      receiver: receiver,
      content: newMessage,
      timestamp: currentDate,
      read: false
    };

    try {
      await addDoc(collection(db, 'mensajes'), newEntry);
      setNewMessage('');
      setReceiver('');
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
      <Form onSubmit={handleSendMessage} className="mt-4">
        <Form.Group controlId="receiverInput">
          <Form.Label>Para</Form.Label>
          <Form.Control
            type="text"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="messageInput" className="mt-2">
          <Form.Label>Mensaje</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
        </Form.Group>
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
