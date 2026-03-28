import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Row, Col, Card, Button, Table, Badge, 
  InputGroup, Form, Spinner, Tab, Tabs, Alert 
} from 'react-bootstrap';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, 
  serverTimestamp, getDoc, orderBy 
} from 'firebase/firestore';
import { db } from "../../firebaseConfig/firebase";
import { UserContext } from '../Services/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShieldAlt, faQrcode, faUserCheck, faSignOutAlt, 
  faSearch, faCamera, faClock, faExclamationTriangle, faTimes 
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { Html5QrcodeScanner } from 'html5-qrcode';

export const SeguridadDashboard = () => {
  const { userData } = useContext(UserContext);
  const [invitados, setInvitados] = useState([]);
  const [stats, setStats] = useState({ adentro: 0, totalHoy: 0 });
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [ahora, setAhora] = useState(new Date());

  // 1. Escucha en tiempo real y Reloj para permanencia
  useEffect(() => {
    if (!userData?.barrioId) return;

    const q = query(
      collection(db, "invitados"),
      where("barrioId", "==", userData.barrioId),
      orderBy("nombre", "asc") // Orden alfabético por defecto
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvitados(docs);
      
      const adentro = docs.filter(i => i.ingresado === true).length;
      setStats({ adentro, totalHoy: docs.length });
      setLoading(false);
    });

    // Actualizar el "ahora" cada minuto para el cálculo de 12hs
    const timer = setInterval(() => setAhora(new Date()), 60000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [userData]);

  // 2. Lógica del Escáner QR
  useEffect(() => {
    let scanner = null;
    if (showScanner) {
      scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true
      });

      scanner.render((decodedText) => {
        // Asumiendo que el QR contiene el ID del documento
        procesarAcceso(decodedText);
        setShowScanner(false);
        scanner.clear();
      }, (err) => { /* Errores de lectura silenciosos */ });
    }

    return () => {
      if (scanner) scanner.clear().catch(console.error);
    };
  }, [showScanner]);

  // 3. Función de Procesamiento (Entrada/Salida)
  const procesarAcceso = async (idInvitado) => {
    try {
      const docRef = doc(db, "invitados", idInvitado);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) throw new Error("Invitado no encontrado");

      const inv = docSnap.data();

      if (!inv.ingresado) {
        await updateDoc(docRef, {
          ingresado: true,
          fechaIngreso: serverTimestamp(),
          estado: 'adentro'
        });
        Swal.fire("ENTRADA", `${inv.nombre} ha ingresado correctamente.`, "success");
      } else {
        await updateDoc(docRef, {
          ingresado: false,
          fechaSalida: serverTimestamp(),
          estado: 'completado'
        });
        Swal.fire("SALIDA", `${inv.nombre} ha registrado su salida.`, "info");
      }
    } catch (error) {
      Swal.fire("Error", "El código escaneado no es válido o el invitado no existe.", "error");
    }
  };

  // 4. Cálculo de permanencia (Alerta 12 horas)
  const calcularPermanencia = (fechaIngreso) => {
    if (!fechaIngreso) return { texto: "---", exceso: false };
    const ingreso = fechaIngreso.toDate();
    const diffMs = ahora - ingreso;
    const diffHrs = diffMs / (1000 * 60 * 60);
    const horas = Math.floor(diffHrs);
    const minutos = Math.floor((diffHrs % 1) * 60);
    return {
      texto: `${horas}h ${minutos}m`,
      exceso: horas >= 12
    };
  };

  // Filtrado alfabético y por búsqueda
  const invitadosFiltrados = invitados.filter(i => 
    i.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
    i.dni?.includes(filtro)
  );

  return (
    <Container fluid className="py-4 mt-5 bg-light" style={{ minHeight: '100vh' }}>
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm bg-primary text-white">
            <Card.Body>
              <h6 className="text-uppercase small mb-1">En el predio</h6>
              <h2 className="fw-bold mb-0">{stats.adentro}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm bg-dark text-white">
            <Card.Body>
              <h6 className="text-uppercase small mb-1">Accesos Totales</h6>
              <h2 className="fw-bold mb-0">{stats.totalHoy}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={4}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white fw-bold d-flex justify-content-between align-items-center">
              <span><FontAwesomeIcon icon={faQrcode} className="me-2" /> Control de Acceso</span>
            </Card.Header>
            <Card.Body>
              <Button 
                variant={showScanner ? "danger" : "dark"} 
                className="w-100 mb-3 py-2"
                onClick={() => setShowScanner(!showScanner)}
              >
                <FontAwesomeIcon icon={showScanner ? faTimes : faCamera} className="me-2" />
                {showScanner ? "Cerrar Cámara" : "Abrir Cámara Escáner"}
              </Button>

              {showScanner && (
                <div id="reader" className="overflow-hidden rounded border"></div>
              )}

              <hr />
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">Búsqueda Manual</Form.Label>
                <InputGroup>
                  <Form.Control 
                    placeholder="DNI o Nombre..." 
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                  />
                  <Button variant="outline-secondary"><FontAwesomeIcon icon={faSearch} /></Button>
                </InputGroup>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow-sm border-0">
            <Tabs defaultActiveKey="presentes" className="custom-tabs">
              <Tab eventKey="presentes" title={`Presentes (${stats.adentro})`} className="p-3">
                <Table responsive hover className="align-middle">
                  <thead>
                    <tr className="small text-muted">
                      <th>Invitado</th>
                      <th>Lote</th>
                      <th>Permanencia</th>
                      <th className="text-end">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitadosFiltrados.filter(i => i.ingresado).map(inv => {
                      const tiempo = calcularPermanencia(inv.fechaIngreso);
                      return (
                        <tr key={inv.id} className={tiempo.exceso ? 'table-danger' : ''}>
                          <td>
                            <div className="fw-bold">{inv.nombre}</div>
                            <small className="text-muted">{inv.dni}</small>
                            {tiempo.exceso && (
                              <Badge bg="danger" className="ms-2">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" /> +12h
                              </Badge>
                            )}
                          </td>
                          <td>{inv.manzana} - {inv.lote}</td>
                          <td className={tiempo.exceso ? 'text-danger fw-bold' : ''}>
                            <FontAwesomeIcon icon={faClock} className="me-1 text-muted" /> {tiempo.texto}
                          </td>
                          <td className="text-end">
                            <Button size="sm" variant="danger" onClick={() => procesarAcceso(inv.id)}>
                              <FontAwesomeIcon icon={faSignOutAlt} className="me-1" /> Salida
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {stats.adentro === 0 && (
                      <tr><td colSpan="4" className="text-center py-4 text-muted">No hay invitados en el predio</td></tr>
                    )}
                  </tbody>
                </Table>
              </Tab>
              
              <Tab eventKey="autorizados" title="Lista de Autorizados" className="p-3">
                <Table responsive hover className="align-middle">
                  <thead>
                    <tr className="small text-muted">
                      <th>Nombre</th>
                      <th>DNI</th>
                      <th className="text-end">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitadosFiltrados.filter(i => !i.ingresado).map(inv => (
                      <tr key={inv.id}>
                        <td>{inv.nombre}</td>
                        <td>{inv.dni}</td>
                        <td className="text-end">
                          <Button size="sm" variant="success" onClick={() => procesarAcceso(inv.id)}>
                            <FontAwesomeIcon icon={faUserCheck} className="me-1" /> Registrar Entrada
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};