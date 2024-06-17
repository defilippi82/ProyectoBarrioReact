import React, { useState, useEffect, useContext } from 'react';
import { collection, addDoc, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig/firebase';
import { UserContext } from './UserContext';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

export const Mensajeria = () => {
    const { userData } = useContext(UserContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [receiver, setReceiver] = useState('');

    useEffect(() => {
        const fetchMessages = () => {
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
        };
    
        fetchMessages();
    }, [userData.nombre]);
    

    const handleSendMessage = async (e) => {
        e.preventDefault();
    
        if (newMessage.trim() === '' || receiver.trim() === '') return;
    
        const currentDate = new Date();
    
        const newEntry = {
            sender: userData.nombre,
            receiver: receiver,
            content: newMessage,
            timestamp: currentDate,
            read: false // Añadimos el campo read
        };
    
        try {
            await addDoc(collection(db, 'mensajes'), newEntry);
            setNewMessage('');
            setReceiver('');
        } catch (error) {
            console.error('Error sending message: ', error);
        }
    };
    

    return (
        <div className="container mt-4">
            <h2>Mensajería Interna</h2>
            <Form onSubmit={handleSendMessage}>
                <Form.Group controlId="receiverInput">
                    <Form.Label>Destinatario</Form.Label>
                    <Form.Control
                        type="text"
                        value={receiver}
                        onChange={(e) => setReceiver(e.target.value)}
                        placeholder="Nombre del destinatario"
                    />
                </Form.Group>
                <Form.Group controlId="messageInput" className="mt-3">
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
            <h3 className="mt-4">Mensajes Recibidos</h3>
            <ListGroup>
                {messages.map(({ id, sender, content, timestamp }) => (
                    <ListGroup.Item key={id}>
                        <strong>{sender}</strong> <small>{timestamp.toDate().toLocaleString()}</small>
                        <p>{content}</p>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </div>
    );
};
