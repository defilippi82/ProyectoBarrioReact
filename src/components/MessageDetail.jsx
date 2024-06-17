import React from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';

export const MessageDetail = ({ message, handleDelete, handleMarkAsRead }) => {
  return (
    <Card>
      <Card.Body>
        <Card.Title>{message.sender}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">{new Date(message.timestamp.seconds * 1000).toLocaleString()}</Card.Subtitle>
        <Card.Text>{message.content}</Card.Text>
        <Button variant="danger" onClick={() => handleDelete(message.id)}>Eliminar</Button>
        <Button variant="primary" onClick={() => handleMarkAsRead(message.id)}>Marcar como leído</Button>
      </Card.Body>
    </Card>
  );
};


