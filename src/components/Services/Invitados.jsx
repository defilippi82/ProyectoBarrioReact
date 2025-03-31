import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import Swal from 'sweetalert2';
import { Table, Button, Form, Modal, Row, Col, InputGroup, Card, Spinner } from 'react-bootstrap';
import { FaWhatsapp, FaCopy, FaList, FaPlusCircle } from 'react-icons/fa';

export const Invitados = () => {
  // Estados
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    patente: '',
    email: '',
    telefono: '',
    mensaje: ''
  });
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invitados, setInvitados] = useState([]);
  const [showListModal, setShowListModal] = useState(false);
  const [listas, setListas] = useState([]);
  const [nuevaLista, setNuevaLista] = useState({
    nombre: '',
    invitados: []
  });

  // Cargar datos del usuario al iniciar
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userDataFromStorage = localStorage.getItem('userData');
        if (userDataFromStorage) {
          setUserData(JSON.parse(userDataFromStorage));
        } else {
          Swal.fire('Error', 'No se encontraron datos de usuario', 'error');
          // Redirigir a login si no hay datos
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Error al cargar userData:', error);
        Swal.fire('Error', 'Error al cargar datos de usuario', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Generar enlace de invitación (con protección contra userData null)
  const generarEnlaceInvitacion = () => {
    if (!userData) {
      console.error('userData no está disponible');
      return 'Cargando...';
    }
    const baseUrl = window.location.origin;
    return `${baseUrl}/invitacion.html?lote=${userData.manzana}-${userData.lote}&invitador=${encodeURIComponent(userData.nombre)}`;
  };

  // Resto de tus funciones (agregarInvitado, crearLista, etc.) permanecen igual
  // ... [aquí irían todas tus otras funciones]

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Cargando datos del usuario...</span>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="alert alert-danger">
        No se pudieron cargar los datos del usuario. Por favor inicia sesión nuevamente.
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Sistema de Invitaciones</h2>
      
      {/* Tarjeta para compartir formulario - Ahora seguro porque userData existe */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Card.Title>Compartir formulario de invitación</Card.Title>
          <Card.Text className="mb-3">
            Envía este enlace a tus invitados para que completen sus datos:
          </Card.Text>
          
          <InputGroup className="mb-3">
            <Form.Control 
              value={generarEnlaceInvitacion()} 
              readOnly 
            />
            <Button 
              variant="outline-secondary" 
              onClick={() => {
                navigator.clipboard.writeText(generarEnlaceInvitacion());
                Swal.fire('Copiado', 'El enlace ha sido copiado al portapapeles', 'success');
              }}
            >
              <FaCopy /> Copiar
            </Button>
          </InputGroup>
          
          <div className="d-grid gap-2">
            <Button 
              variant="success" 
              onClick={() => {
                const mensaje = `Hola, ${userData.nombre} te está invitando. Por favor completa tus datos aquí: ${generarEnlaceInvitacion()}`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`);
              }}
              className="text-white"
            >
              <FaWhatsapp /> Compartir por WhatsApp
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Resto de tu JSX... */}
      {/* ... [aquí iría el resto de tu interfaz] */}
    </div>
  );
};