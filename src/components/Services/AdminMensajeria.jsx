import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp 
} from 'firebase/firestore';
import { Form, Button, Spinner, Row, Col, Card, Container, Table } from 'react-bootstrap';
import { FaBullhorn, FaPaperPlane, FaTrashAlt, FaHistory } from 'react-icons/fa';
import Swal from 'sweetalert2';

export const AdminMensajeria = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedIslas, setSelectedIslas] = useState([]);
  const [selectedManzanas, setSelectedManzanas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [campanas, setCampanas] = useState([]);

  const islas = ['1', '2', '3'];
  const manzanas = Array.from({ length: 22 }, (_, i) => (i + 1).toString());

  // Escuchar las campañas existentes en tiempo real
  useEffect(() => {
    const q = query(collection(db, 'campanas'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCampanas(lista);
    });
    return () => unsubscribe();
  }, []);

  const handleCheckboxChange = (setState, value) => {
    setState(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const sendMessages = async () => {
    if (!title || !body || (selectedIslas.length === 0 && selectedManzanas.length === 0)) {
      Swal.fire('Error', 'Completá los campos y seleccioná destino', 'error');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'campanas'), {
        title,
        body,
        islasDestino: selectedIslas,
        manzanasDestino: selectedManzanas,
        timestamp: Timestamp.now(),
        sender: 'ADMIN',
        active: true
      });

      Swal.fire('Enviado', 'La campaña se registró correctamente', 'success');
      setTitle('');
      setBody('');
      setSelectedIslas([]);
      setSelectedManzanas([]);
    } catch (error) {
      Swal.fire('Error', 'No se pudo enviar', 'error');
    }
    setLoading(false);
  };

  const borrarCampana = async (id) => {
    const result = await Swal.fire({
      title: '¿Borrar campaña?',
      text: "Los vecinos dejarán de ver este mensaje.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, borrar'
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, 'campanas', id));
      Swal.fire('Borrada', 'El registro ha sido eliminado.', 'success');
    }
  };

  return (
    <Container className="py-4">
      {/* SECCIÓN DE ENVÍO */}
      <Card className="shadow-sm border-0 mb-5">
        <Card.Header className="bg-primary text-white py-3">
          <div className="d-flex align-items-center">
            <FaBullhorn className="me-2" />
            <h5 className="mb-0 fw-bold">Nueva Campaña</h5>
          </div>
        </Card.Header>
        <Card.Body className="p-4">
          <Form>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group className="form-floating">
                  <Form.Control type="text" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
                  <label>Título</label>
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group className="form-floating">
                  <Form.Control type="text" placeholder="Mensaje" value={body} onChange={(e) => setBody(e.target.value)} />
                  <label>Cuerpo del mensaje</label>
                </Form.Group>
              </Col>
              <Col md={3} className="d-grid">
                {/* BOTÓN HORIZONTAL */}
                <Button variant="primary" className="fw-bold h-100" onClick={sendMessages} disabled={loading}>
                  {loading ? <Spinner animation="border" size="sm" /> : <><FaPaperPlane className="me-2" /> ENVIAR</>}
                </Button>
              </Col>
            </Row>

            <Row className="mt-3">
              <Col md={4}>
                <label className="small fw-bold text-muted mb-2">ISLAS:</label>
                <div className="d-flex gap-3 p-2 border rounded bg-light">
                  {islas.map(isla => (
                    <Form.Check key={isla} type="checkbox" label={isla} checked={selectedIslas.includes(isla)} onChange={() => handleCheckboxChange(setSelectedIslas, isla)} />
                  ))}
                </div>
              </Col>
              <Col md={8}>
                <label className="small fw-bold text-muted mb-2">MANZANAS:</label>
                <div className="d-flex flex-wrap gap-2 p-2 border rounded bg-light" style={{ maxHeight: '80px', overflowY: 'auto' }}>
                  {manzanas.map(m => (
                    <Form.Check key={m} type="checkbox" label={m} checked={selectedManzanas.includes(m)} onChange={() => handleCheckboxChange(setSelectedManzanas, m)} />
                  ))}
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* SECCIÓN DE REGISTRO / HISTORIAL */}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-dark text-white py-3">
          <div className="d-flex align-items-center">
            <FaHistory className="me-2" />
            <h5 className="mb-0 fw-bold">Historial de Campañas Realizadas</h5>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4">Fecha</th>
                <th>Título</th>
                <th>Destinos</th>
                <th className="text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {campanas.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-4 text-muted">No hay campañas registradas</td></tr>
              ) : (
                campanas.map((c) => (
                  <tr key={c.id}>
                    <td className="ps-4 small">{c.timestamp?.toDate().toLocaleString()}</td>
                    <td className="fw-bold">{c.title}</td>
                    <td className="small">
                      {c.islasDestino?.length > 0 && `Islas: ${c.islasDestino.join(', ')} `}
                      {c.manzanasDestino?.length > 0 && `| Mnz: ${c.manzanasDestino.join(', ')}`}
                    </td>
                    <td className="text-center">
                      <Button variant="link" className="text-danger p-0" onClick={() => borrarCampana(c.id)}>
                        <FaTrashAlt />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};