import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import Swal from 'sweetalert2';
import { Button, Card, Table, Form, Modal, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { FaSearch, FaHistory, FaFileExcel, FaSignOutAlt, FaSignInAlt, FaTrash, FaSyncAlt } from 'react-icons/fa';
import { Html5QrcodeScanner } from 'html5-qrcode';

export const DashboardSeguridad = () => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    showScanner: false,
    scanAction: 'ingreso',
    registros: [],
    invitadosActivos: [],
    filtro: {
      dni: '',
      nombre: ''
    }
  });

  const scannerRef = useRef(null);
  const { loading, error, showScanner, scanAction, registros, invitadosActivos, filtro } = state;

  useEffect(() => {
    cargarRegistros();
    cargarInvitadosActivos();
  }, []);

  useEffect(() => {
    if (showScanner) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [showScanner]);

  const startScanner = () => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => handleScanSuccess(decodedText),
      (error) => console.warn(error)
    );

    scannerRef.current = scanner;
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
  };

  const handleScanSuccess = async (decodedText) => {
    try {
      const datosInvitado = JSON.parse(decodedText);
      if (!datosInvitado.nombre || !datosInvitado.dni) {
        throw new Error('QR inválido: faltan datos requeridos');
      }

      if (scanAction === 'ingreso') {
        await registrarIngreso(datosInvitado);
      } else {
        await registrarEgreso(datosInvitado);
      }

      stopScanner();
      setState(prev => ({ ...prev, showScanner: false }));
      
    } catch (error) {
      console.error("Error al procesar QR:", error);
      setState(prev => ({ ...prev, error: error.message, showScanner: false }));
    }
  };

  const registrarIngreso = async (invitado) => {
    try {
      const registro = {
        ...invitado,
        fechaIngreso: new Date().toISOString(),
        hora: new Date().toLocaleTimeString(),
        estado: 'presente'
      };

      await addDoc(collection(db, 'registrosIngresos'), registro);

      Swal.fire({
        icon: 'success',
        title: 'Ingreso registrado',
        text: `${invitado.nombre} ha ingresado correctamente`,
        timer: 2000
      });

      cargarInvitadosActivos();
      cargarRegistros();

    } catch (error) {
      console.error("Error al registrar ingreso:", error);
      throw error;
    }
  };

  const registrarEgreso = async (invitado) => {
    try {
      const q = query(
        collection(db, 'registrosIngresos'),
        where('dni', '==', invitado.dni),
        where('estado', '==', 'presente')
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('No se encontró al invitado o ya egresó');
      }

      const docRef = querySnapshot.docs[0].ref;
      await deleteDoc(docRef);

      await addDoc(collection(db, 'historialIngresos'), {
        ...querySnapshot.docs[0].data(),
        fechaEgreso: new Date().toISOString(),
        estado: 'egresado'
      });

      Swal.fire({
        icon: 'success',
        title: 'Egreso registrado',
        text: `${invitado.nombre} ha egresado correctamente`,
        timer: 2000
      });

      cargarInvitadosActivos();
      cargarRegistros();

    } catch (error) {
      console.error("Error al registrar egreso:", error);
      throw error;
    }
  };

  const cargarInvitadosActivos = async () => {
    try {
      const q = query(
        collection(db, 'registrosIngresos'),
        where('estado', '==', 'presente')
      );

      const querySnapshot = await getDocs(q);
      const datos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setState(prev => ({ ...prev, invitadosActivos: datos }));
    } catch (error) {
      console.error("Error al cargar invitados activos:", error);
      setState(prev => ({ ...prev, error: 'Error al cargar invitados' }));
    }
  };

  const cargarRegistros = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const q = query(collection(db, 'historialIngresos'), orderBy('fechaIngreso', 'desc'));
      const querySnapshot = await getDocs(q);

      const datos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaFormateada: new Date(doc.data().fechaIngreso).toLocaleDateString()
      }));

      setState(prev => ({ ...prev, registros: datos, loading: false }));
    } catch (error) {
      console.error("Error al cargar registros:", error);
      setState(prev => ({ ...prev, error: 'Error al cargar registros', loading: false }));
    }
  };

  const filtrarInvitados = () => {
    return invitadosActivos.filter(invitado => {
      const matchDni = filtro.dni ? invitado.dni.includes(filtro.dni) : true;
      const matchNombre = filtro.nombre ? 
        invitado.nombre.toLowerCase().includes(filtro.nombre.toLowerCase()) : true;
      return matchDni && matchNombre;
    });
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      filtro: {
        ...prev.filtro,
        [name]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container mt-4 bg-transparent">
      <h2 className="mb-4">Control de Accesos</h2>

      {error && (
        <Alert variant="danger" onClose={() => setState(prev => ({ ...prev, error: null }))} dismissible>
          {error}
        </Alert>
      )}

      <Card className="mb-4 shadow-sm bg-transparent">
        <Card.Body>
          <Card.Title>Registro QR</Card.Title>
          <div className="d-flex gap-2 mb-3">
            <Button variant="primary" onClick={() => setState(prev => ({ ...prev, showScanner: true, scanAction: 'ingreso' }))}>
              <FaSignInAlt className="me-2" /> Registrar Ingreso
            </Button>
            <Button variant="warning" onClick={() => setState(prev => ({ ...prev, showScanner: true, scanAction: 'egreso' }))}>
              <FaSignOutAlt className="me-2" /> Registrar Egreso
            </Button>
          </div>

          {showScanner && (
            <Modal show={showScanner} onHide={() => setState(prev => ({ ...prev, showScanner: false }))} centered>
              <Modal.Header closeButton>
                <Modal.Title>Escanear QR - {scanAction === 'ingreso' ? 'Ingreso' : 'Egreso'}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div id="qr-reader" style={{ width: '100%' }}></div>
              </Modal.Body>
            </Modal>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4 shadow-sm bg-transparent">
        <Card.Body>
          <Card.Title>Invitados Presentes ({filtrarInvitados().length})</Card.Title>

          <Form className="mb-3">
            <Row>
              <Col md={6}>
                <Form.Control
                  type="text"
                  name="nombre"
                  placeholder="Filtrar por nombre"
                  value={filtro.nombre}
                  onChange={handleFiltroChange}
                />
              </Col>
              <Col md={6}>
                <Form.Control
                  type="text"
                  name="dni"
                  placeholder="Filtrar por DNI"
                  value={filtro.dni}
                  onChange={handleFiltroChange}
                />
              </Col>
            </Row>
          </Form>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table responsive bordered striped hover size="sm" variant="warning">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>DNI</th>
                  <th>Hora Ingreso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrarInvitados().length > 0 ? (
                  filtrarInvitados().map(invitado => (
                    <tr key={invitado.id}>
                      <td>{invitado.nombre}</td>
                      <td>{invitado.dni}</td>
                      <td>{new Date(invitado.fechaIngreso).toLocaleTimeString()}</td>
                      <td>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => registrarEgreso(invitado)}
                        >
                          <FaTrash /> Marcar Egreso
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center">No hay invitados presentes</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm bg-info">
        <Card.Body>
          <Card.Title>Historial de Accesos</Card.Title>
          <Button variant="secondary" className="mb-3" onClick={cargarRegistros}>
            <FaSyncAlt className="me-2" /> Actualizar
          </Button>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table responsive bordered striped hover size="sm" variant="warning">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Nombre</th>
                  <th>DNI</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {registros.map(registro => (
                  <tr key={registro.id}>
                    <td>{registro.fechaFormateada}</td>
                    <td>{registro.nombre}</td>
                    <td>{registro.dni}</td>
                    <td>{registro.estado === 'presente' ? 
                      <span className="text-success">Presente</span> : 
                      <span className="text-secondary">Egresado</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
