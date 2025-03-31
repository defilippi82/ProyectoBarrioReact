import React from 'react';
import { Button, Card, InputGroup, Form } from 'react-bootstrap';
import { FaWhatsapp, FaCopy } from 'react-icons/fa';
import Swal from 'sweetalert2';

export const InvitacionLink = ({ userData }) => {
  const generarEnlaceInvitacion = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/invitacion.html?lote=${userData.manzana}-${userData.lote}&invitador=${encodeURIComponent(userData.nombre)}`;
  };

  const compartirPorWhatsapp = () => {
    const enlace = generarEnlaceInvitacion();
    const mensaje = `Hola, ${userData.nombre} te está invitando. Por favor completa tus datos aquí: ${enlace}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`);
  };

  const copiarEnlace = () => {
    navigator.clipboard.writeText(generarEnlaceInvitacion());
    Swal.fire({
      title: 'Enlace copiado',
      text: 'El enlace ha sido copiado al portapapeles',
      icon: 'success',
      timer: 2000
    });
  };

  return (
    <Card className="mt-4 shadow-sm">
      <Card.Body>
        <Card.Title>Compartir formulario de invitación</Card.Title>
        <Card.Text className="mb-3">
          Envía este formulario a tus invitados para que completen sus datos:
        </Card.Text>
        
        <InputGroup className="mb-3">
          <Form.Control 
            value={generarEnlaceInvitacion()} 
            readOnly 
          />
          <Button 
            variant="outline-secondary" 
            onClick={copiarEnlace}
          >
            <FaCopy /> Copiar
          </Button>
        </InputGroup>
        
        <div className="d-grid gap-2">
          <Button 
            variant="success" 
            onClick={compartirPorWhatsapp}
            className="text-white"
          >
            <FaWhatsapp /> Compartir por WhatsApp
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};