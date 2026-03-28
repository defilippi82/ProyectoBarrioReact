import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Row, Col, Card, Button, Table, Badge, 
  InputGroup, Form, Tab, Tabs, Modal 
} from 'react-bootstrap';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, 
  serverTimestamp, getDoc, addDoc, getDocs, deleteDoc 
} from 'firebase/firestore';
import { db } from "../../firebaseConfig/firebase";
import { UserContext } from '../Services/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faCamera, faClock, faUserPlus, faTimes 
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

export const SeguridadDashboard = () => {
  const { userData } = useContext(UserContext);
  const [invitados, setInvitados] = useState([]);
  const [stats, setStats] = useState({ autorizados: 0, adentro: 0, salieron: 0 });
  const [filtro, setFiltro] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [ahora, setAhora] = useState(new Date());

  const [manualData, setManualData] = useState({
    nombre: '', dni: '', patente: '', lote: '', invitador: ''
  });

  // 1. LIMPIEZA AUTOMÁTICA (Registros > 30 días)
  useEffect(() => {
    const limpiarHistorialViejo = async () => {
      if (!userData?.barrioId) return;
      const treintaDiasAtras = new Date();
      treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

      const q = query(
        collection(db, "invitados"),
        where("barrioId", "==", userData.barrioId),
        where("estado", "==", "retirado")
      );

      const snapshot = await getDocs(q);
      snapshot.forEach(async (documento) => {
        const data = documento.data();
        if (data.fechaSalida && data.fechaSalida.toDate() < treintaDiasAtras) {
          await deleteDoc(doc(db, "invitados", documento.id));
        }
      });
    };
    limpiarHistorialViejo();
  }, [userData]);

  // 2. ESCUCHA EN TIEMPO REAL
  useEffect(() => {
    if (!userData?.barrioId) return;

    const q = query(
      collection(db, "invitados"),
      where("barrioId", "==", userData.barrioId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvitados(docs);
      
      const autorizados = docs.filter(i => !i.ingresado && i.estado !== 'retirado').length;
      const adentro = docs.filter(i => i.ingresado && i.estado !== 'retirado').length;
      const salieron = docs.filter(i => i.estado === 'retirado').length;

      setStats({ autorizados, adentro, salieron });
    });

    const timer = setInterval(() => setAhora(new Date()), 60000);
    return () => { unsubscribe(); clearInterval(timer); };
  }, [userData]);

  // 3. LÓGICA DEL ESCÁNER (CDN / GLOBAL)
  useEffect(() => {
    let scanner = null;

    if (showScanner) {
      // Usamos un pequeño delay para asegurar que el div "reader" esté renderizado
      const initScanner = setTimeout(() => {
        if (window.Html5QrcodeScanner) {
          scanner = new window.Html5QrcodeScanner("reader", { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          });

          scanner.render((id) => {
            procesarAcceso(id);
            setShowScanner(false);
          }, (error) => { /* Errores de lectura silenciosos */ });
        } else {
          Swal.fire("Error", "La librería de la cámara no cargó correctamente.", "error");
        }
      }, 300);

      return () => {
        clearTimeout(initScanner);
        if (scanner) {
          scanner.clear().catch(err => console.error("Error cleanup:", err));
        }
      };
    }
  }, [showScanner]);

  const procesarAcceso = async (idInvitado) => {
    try {
      const docRef = doc(db, "invitados", idInvitado);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        Swal.fire("No encontrado", "El código QR es inválido.", "error");
        return;
      }

      const inv = docSnap.data();

      if (inv.estado === 'retirado') {
        Swal.fire("Alerta", "Este QR ya fue utilizado para salida.", "warning");
        return;
      }

      if (!inv.ingresado) {
        await updateDoc(docRef, {
          ingresado: true,
          fechaIngreso: serverTimestamp(),
          estado: 'adentro'
        });
        Swal.fire("¡ENTRADA!", `${inv.nombre} ingresó.`, "success");
      } else {
        await updateDoc(docRef, {
          ingresado: false,
          fechaSalida: serverTimestamp(),
          estado: 'retirado'
        });
        Swal.fire("SALIDA", `Salida de ${inv.nombre} registrada.`, "info");
      }
    } catch (error) {
      Swal.fire("Error", "Problema al procesar acceso.", "error");
    }
  };

  const handleManualEntry = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "invitados"), {
        ...manualData,
        barrioId: userData.barrioId,
        ingresado: true,
        fechaIngreso: serverTimestamp(),
        estado: 'adentro'
      });
      setShowManualModal(false);
      setManualData({ nombre: '', dni: '', patente: '', lote: '', invitador: '' });
      Swal.fire("Éxito", "Ingreso manual registrado", "success");
    } catch (e) { Swal.fire("Error", "No se pudo registrar", "error"); }
  };

  const calcularPermanencia = (fecha) => {
    if (!fecha) return { texto: "---", exceso: false };
    const horas = Math.floor((ahora - fecha.toDate()) / 3600000);
    return { texto: `${horas}h`, exceso: horas >= 12 };
  };

  const invitadosFiltrados = invitados.filter(i => i.estado !== 'retirado').filter(i => 
    i.nombre?.toLowerCase().includes(filtro.toLowerCase()) || i.dni?.includes(filtro)
  );

  return (
    <Container fluid className="py-4 mt-5 bg-light">
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm bg-info text-white py-2">
            <Card.Body>
              <h6 className="text-uppercase small fw-bold opacity-75">En Espera</h6>
              <h2 className="display-6 fw-bold mb-0">{stats.autorizados}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm bg-primary text-white py-2">
            <Card.Body>
              <h6 className="text-uppercase small fw-bold opacity-75">En el Predio</h6>
              <h2 className="display-6 fw-bold mb-0">{stats.adentro}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm bg-secondary text-white py-2">
            <Card.Body>
              <h6 className="text-uppercase small fw-bold opacity-75">Salieron</h6>
              <h2 className="display-6 fw-bold mb-0">{stats.salieron}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="d-flex align-items-center">
          <Button variant="success" size="lg" className="w-100 shadow-sm" onClick={() => setShowManualModal(true)}>
            <FontAwesomeIcon icon={faUserPlus} className="me-2"/> Ingreso Manual
          </Button>
        </Col>
      </Row>

      <Row>
        <Col lg={4}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white py-3 fw-bold">Escáner de Acceso</Card.Header>
            <Card.Body>
              <Button 
                variant={showScanner ? "danger" : "outline-dark"} 
                className="w-100 mb-3 py-2 fw-bold"
                onClick={() => setShowScanner(!showScanner)}
              >
                <FontAwesomeIcon icon={showScanner ? faTimes : faCamera} className="me-2"/>
                {showScanner ? "DETENER ESCÁNER" : "INICIAR CÁMARA"}
              </Button>
              {showScanner && <div id="reader" className="rounded overflow-hidden border"></div>}
              <hr />
              <Form.Label className="small text-muted fw-bold">Búsqueda rápida</Form.Label>
              <InputGroup>
                <Form.Control placeholder="DNI o Nombre..." onChange={(e) => setFiltro(e.target.value)} />
                <Button variant="light border"><FontAwesomeIcon icon={faSearch} /></Button>
              </InputGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow-sm border-0">
            <Tabs defaultActiveKey="presentes" className="custom-tabs border-bottom-0">
              <Tab eventKey="presentes" title={`Adentro (${stats.adentro})`} className="p-3">
                <Table responsive hover className="align-middle">
                  <thead>
                    <tr className="small text-muted">
                      <th>Invitado / Patente</th>
                      <th>Lote / Quien Invita</th>
                      <th>Permanencia</th>
                      <th className="text-end">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitadosFiltrados.filter(i => i.ingresado).map(inv => {
                      const p = calcularPermanencia(inv.fechaIngreso);
                      return (
                        <tr key={inv.id} className={p.exceso ? 'table-danger' : ''}>
                          <td>
                            <div className="fw-bold">{inv.nombre}</div>
                            <small className="text-muted">{inv.dni} | {inv.patente || 'S/P'}</small>
                          </td>
                          <td>
                            <div className="fw-bold">Lote: {inv.lote}</div>
                            <small className="text-muted">Invita: {inv.invitador}</small>
                          </td>
                          <td className={p.exceso ? 'text-danger fw-bold' : ''}>
                            <FontAwesomeIcon icon={faClock} className="me-1 opacity-50"/> {p.texto}
                          </td>
                          <td className="text-end">
                            <Button size="sm" variant="danger" onClick={() => procesarAcceso(inv.id)}>
                              Marcar Salida
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Tab>
              
              <Tab eventKey="autorizados" title={`En Espera (${stats.autorizados})`} className="p-3">
                <Table responsive hover>
                  <tbody>
                    {invitadosFiltrados.filter(i => !i.ingresado).map(inv => (
                      <tr key={inv.id}>
                        <td><strong>{inv.nombre}</strong> (DNI: {inv.dni})</td>
                        <td>Lote: {inv.lote}</td>
                        <td className="text-end">
                          <Button size="sm" variant="success" onClick={() => procesarAcceso(inv.id)}>Dar Entrada</Button>
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

      {/* MODAL INGRESO MANUAL */}
      <Modal show={showManualModal} onHide={() => setShowManualModal(false)} centered>
        <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">Ingreso de Emergencia</Modal.Title></Modal.Header>
        <Modal.Body className="pt-0">
          <Form onSubmit={handleManualEntry}>
            <Row className="g-2">
              <Col md={12}><Form.Group className="mb-2"><Form.Label className="small fw-bold">Nombre</Form.Label><Form.Control required onChange={e => setManualData({...manualData, nombre: e.target.value})}/></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-2"><Form.Label className="small fw-bold">DNI</Form.Label><Form.Control required onChange={e => setManualData({...manualData, dni: e.target.value})}/></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-2"><Form.Label className="small fw-bold">Patente</Form.Label><Form.Control onChange={e => setManualData({...manualData, patente: e.target.value})}/></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-2"><Form.Label className="small fw-bold">Lote</Form.Label><Form.Control required onChange={e => setManualData({...manualData, lote: e.target.value})}/></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="small fw-bold">¿Quién invita?</Form.Label><Form.Control required onChange={e => setManualData({...manualData, invitador: e.target.value})}/></Form.Group></Col>
            </Row>
            <Button variant="primary" type="submit" className="w-100 py-2 fw-bold">REGISTRAR E INGRESAR</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};