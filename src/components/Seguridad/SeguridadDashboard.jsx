import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Row, Col, Card, Button, Table, Badge, 
  InputGroup, Form, Spinner, Stack, Tab, Tabs 
} from 'react-bootstrap';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, 
  serverTimestamp, getDoc, orderBy, limit 
} from 'firebase/firestore';
import { db } from "../../firebaseConfig/firebase";
import { UserContext } from '../Services/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShieldAlt, faQrcode, faUserCheck, faUserMinus, 
  faSearch, faHistory, faExclamationTriangle 
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { Html5QrcodeScanner } from 'html5-qrcode'; // Usando la instalación local

export const SeguridadDashboard = () => {
  const { userData } = useContext(UserContext);
  const [invitados, setInvitados] = useState([]);
  const [stats, setStats] = useState({ adentro: 0, totalHoy: 0 });
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

  // 1. Escucha en tiempo real de invitados del barrio
  useEffect(() => {
    if (!userData?.barrioId) return;

    const q = query(
      collection(db, "invitados"),
      where("barrioId", "==", userData.barrioId),
      orderBy("fechaCreacion", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvitados(docs);
      
      // Cálculo rápido de estadísticas
      const adentro = docs.filter(i => i.ingresado === true).length;
      setStats({ adentro, totalHoy: docs.length });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  // 2. Lógica de Escaneo (Paso a paso)
  const procesarAcceso = async (idInvitado) => {
    try {
      const docRef = doc(db, "invitados", idInvitado);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) throw new Error("QR No válido");

      const inv = docSnap.data();

      // LÓGICA AUTOMÁTICA: Si no entró -> ENTRA. Si ya entró -> SALE.
      if (!inv.ingresado) {
        await updateDoc(docRef, {
          ingresado: true,
          fechaIngreso: serverTimestamp(),
          estado: 'adentro'
        });
        Swal.fire("ENTRADA", `${inv.nombre} ha ingresado.`, "success");
      } else {
        await updateDoc(docRef, {
          ingresado: false,
          fechaSalida: serverTimestamp(),
          estado: 'completado'
        });
        Swal.fire("SALIDA", `${inv.nombre} se ha retirado.`, "info");
      }
    } catch (error) {
      Swal.fire("Error", "Código no reconocido", "error");
    }
  };

  return (
    <Container fluid className="py-4 mt-5 bg-light">
      {/* ZONA 1: HEADER DE ESTADO RÁPIDO */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm bg-primary text-white">
            <Card.Body>
              <h6 className="text-uppercase small">Invitados Adentro</h6>
              <h2 className="fw-bold">{stats.adentro}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm bg-dark text-white">
            <Card.Body>
              <h6 className="text-uppercase small">Total Accesos Hoy</h6>
              <h2 className="fw-bold">{stats.totalHoy}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* ZONA 2: CONTROL DE ACCESO (IZQUIERDA) */}
        <Col lg={4}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white fw-bold">
              <FontAwesomeIcon icon={faQrcode} className="me-2" /> Scanner de Acceso
            </Card.Header>
            <Card.Body>
              <div id="reader" style={{ width: '100%' }}></div>
              <hr />
              <Form.Group className="mt-3">
                <Form.Label className="small fw-bold text-muted">Búsqueda Manual (DNI / Nombre)</Form.Label>
                <InputGroup>
                  <Form.Control 
                    placeholder="Buscar invitado..." 
                    onChange={(e) => setFiltro(e.target.value)}
                  />
                  <Button variant="outline-secondary"><FontAwesomeIcon icon={faSearch} /></Button>
                </InputGroup>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        {/* ZONA 3: MONITOR DE TRÁFICO (DERECHA) */}
        <Col lg={8}>
          <Card className="shadow-sm border-0">
            <Tabs defaultActiveKey="presentes" className="mb-0 custom-tabs">
              <Tab eventKey="presentes" title="Invitados en el Barrio">
                <Table responsive hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Invitado</th>
                      <th>Ubicación</th>
                      <th>Ingreso</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitados.filter(i => i.ingresado).map(inv => (
                      <tr key={inv.id}>
                        <td className="fw-bold">{inv.nombre}</td>
                        <td>{inv.manzana} - {inv.lote}</td>
                        <td>{inv.fechaIngreso?.toDate().toLocaleTimeString()}</td>
                        <td>
                          <Button size="sm" variant="outline-danger" onClick={() => procesarAcceso(inv.id)}>
                            Marcar Salida
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab>
              
              <Tab eventKey="historial" title="Últimos Movimientos">
                {/* Tabla de historial similar aquí */}
              </Tab>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};