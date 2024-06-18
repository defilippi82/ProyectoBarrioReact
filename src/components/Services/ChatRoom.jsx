import React, { useState, useEffect } from "react";

import { signOut } from "firebase/auth";
import { useUser } from "../Services/UserContext";  

export const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const user = useUser();  

  useEffect(() => {
    // No necesitamos subscribeToMessages para este componente, ya que solo estamos enviando mensajes
  }, []); // El useEffect no tiene ninguna dependencia, por lo que solo se ejecuta una vez al montar el componente

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() === "" || !user) return;
    const newMessage = {
      content: message,
      sender: user.email,
      timestamp: new Date(),
    };
   
    await addMessage(newMessage);
    setMessage("");
  };

  return (
    <div>
      <h1>ChatRoom</h1>
      <div style={{ height: "300px", overflowY: "auto", border: "1px solid black", padding: "10px" }}>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.sender}: </strong>{msg.content}
          </div>
        ))}
      </div>
      {user ? (
        <form onSubmit={handleSubmit}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje aquí" // Agregamos un placeholder para dar una pista al usuario sobre qué hacer
          />
          <br />
          <button type="submit">Enviar</button>
          <button onClick={() => signOut()}>Logout</button>
        </form>
      ) : (
        <p>Please login to send messages.</p>
      )}
    </div>
  );
};
