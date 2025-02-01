import React, { useState } from 'react';
import { db } from '../../firebaseConfig/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { Form, Button, Spinner, Row, Col, Card } from 'react-bootstrap';
import Swal from 'sweetalert2';

export const AdminMensajeria = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [islas, setIslas] = useState(['1', '2', '3']);
  const [selectedIslas, setSelectedIslas] = useState([]);
  const [manzanas, setManzanas] = useState(Array.from({ length: 22 }, (_, i) => (i + 1).toString()));
  const [selectedManzanas, setSelectedManzanas] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCheckboxChange = (setState, value) => {
    setState(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const sendMessages = async () => {
    if (!title || !body || (selectedIslas.length === 0 && selectedManzanas.length === 0)) {
      Swal.fire('Error', 'Debes completar todos los campos y seleccionar al menos una isla o una manzana', 'error');
      return;
    }

    setLoading(true);
    try {
      // Obtener usuarios basados en las islas y manzanas seleccionadas
      const usuariosQuery = query(
        collection(db, 'usuarios'),
        where('isla', 'in', selectedIslas.length > 0 ? selectedIslas : islas),
        where('manzana', 'in', selectedManzanas.length > 0 ? selectedManzanas : manzanas)
      );

      const usuariosSnapshot = await getDocs(usuariosQuery);
      const usuarios = usuariosSnapshot.docs.map(doc => doc.data());

      if (usuarios.length === 0) {
        Swal.fire('Advertencia', 'No hay usuarios coincidentes', 'warning');
        setLoading(false);
        return;
      }

      // Enviar mensajes a los usuarios seleccionados
      const promesasMensajes = usuarios.map(async (usuario) => {
        await addDoc(collection(db, 'mensajes'), {
          sender: 'ADMIN', // El remitente es el administrador
          receiver: `${usuario.isla}-${usuario.manzana}`, // El receptor es el usuario específico
          content: `${title}: ${body}`, // El contenido del mensaje
          timestamp: Timestamp.now(), // Fecha y hora actual
          read: false, // El mensaje no ha sido leído
          source: 'admin' // Identificador de que el mensaje viene del administrador
        });
      });

      await Promise.all(promesasMensajes);

      Swal.fire('Éxito', 'Mensajes enviados correctamente', 'success');
      setTitle('');
      setBody('');
      setSelectedIslas([]);
      setSelectedManzanas([]);
    } catch (error) {
      Swal.fire('Error', 'No se pudieron enviar los mensajes', 'error');
      console.error('Error al enviar los mensajes:', error);
    }
    setLoading(false);
  };

  return (
    <div className="container mt-4">
      <Card className="p-3 shadow">
        <h2 className="text-center">Enviar Notificación</h2>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group controlId="title">
                <Form.Label>Título</Form.Label>
                <Form.Control type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="body">
                <Form.Label>Cuerpo</Form.Label>
                <Form.Control as="textarea" rows={2} value={body} onChange={(e) => setBody(e.target.value)} required />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group controlId="islas">
                <Form.Label>Islas</Form.Label>
                <div>
                  {islas.map(isla => (
                    <Form.Check
                      key={isla}
                      type="checkbox"
                      label={`Isla ${isla}`}
                      checked={selectedIslas.includes(isla)}
                      onChange={() => handleCheckboxChange(setSelectedIslas, isla)}
                    />
                  ))}
                </div>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="manzanas">
                <Form.Label>Manzanas</Form.Label>
                <div className="d-flex flex-wrap">
                  {manzanas.map(manzana => (
                    <Form.Check
                      key={manzana}
                      type="checkbox"
                      label={`Manzana ${manzana}`}
                      checked={selectedManzanas.includes(manzana)}
                      onChange={() => handleCheckboxChange(setSelectedManzanas, manzana)}
                    />
                  ))}
                </div>
              </Form.Group>
            </Col>
          </Row>

          <div className="text-center mt-3">
            <Button variant="success" onClick={sendMessages} disabled={loading}>
              {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Enviar'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};