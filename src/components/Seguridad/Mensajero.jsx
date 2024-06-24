import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export const Mensajero = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [receiver, setReceiver] = useState('');
  const db = getFirestore();

  const fetchMessages = async () => {
    const messagesRef = collection(db, 'mensajes');
    const messagesSnapshot = await getDocs(messagesRef);
    const messagesList = messagesSnapshot.docs.map(doc => doc.data());
    setMessages(messagesList);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const sendMessage = async () => {
    await addDoc(collection(db, 'mensajes'), {
      sender: 'seguridad',
      receiver: receiver,
      content: message,
      timestamp: new Date(),
      read: false,
    });
    setMessage('');
    fetchMessages();
  };

  return (
    <div>
      <h2>Mensajero</h2>
      <div>
        <input
          type="text"
          placeholder="Receptor"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
        />
        <input
          type="text"
          placeholder="Mensaje"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Enviar</button>
      </div>
      <div>
        <h3>Mensajes Recibidos</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg.content} - {msg.sender}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};


