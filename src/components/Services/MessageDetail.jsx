import React from 'react';
import { Button, Card, Modal, Stack } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

export const MessageDetail = ({ message, handleClose, currentUser, etiquetas }) => {
  // Manejo seguro de la fecha desde Firestore
  const fecha = message.timestamp?.toDate ? message.timestamp.toDate() : new Date(message.timestamp);

  // Parseo del remitente para mostrarlo según las etiquetas del barrio
  // Asumiendo formato "Manzana-Lote" guardado en el sender
  const [bloque, unidad] = message.sender ? message.sender.split('-') : ['?', '?'];

  return (
    <Modal show={true} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h6 text-primary fw-bold">
          Detalle del Mensaje
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Card border="light">
          <Card.Body>
            <Card.Subtitle className="mb-3 text-muted small">
              Enviado por: {etiquetas.bloque} {bloque} - {etiquetas.unidad} {unidad} 
              <br />
              {fecha.toLocaleString()}
            </Card.Subtitle>
            <div className="bg-light p-3 rounded mb-3">
              <Card.Text>{message.content}</Card.Text>
            </div>
          </Card.Body>
        </Card>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};