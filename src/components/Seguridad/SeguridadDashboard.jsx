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
  faSearch, faCamera, faClock, faUserPlus, faTimes, faShieldAlt
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

export const SeguridadDashboard = () => {
  const { userData } = useContext(UserContext);
  const [invitados, setInvitados] = useState([]);
  const [stats, setStats] = useState({ enEspera: 0, adentro: 0, ingresaronHoy: 0, salieronHoy: 0 });
  const [filtro, setFiltro] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [ahora, setAhora] = useState(new Date());

  const [manualData, setManualData] = useState({
    nombre: '', dni: '', patente: '', lote: '', invitador: ''
  });

  // 1. LIMPIEZA AUTOMÁTICA MENSUAL (Registros > 30 días)
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

      try {
        const snapshot = await getDocs(q);
        snapshot.forEach(async (documento) => {
          const data = documento.data();
          if (data.fechaSalida && data.fechaSalida.toDate() < treintaDiasAtras) {
            await deleteDoc(doc(db, "invitados", documento.id));
          }
        });
      } catch (error) {
        console.error("Error en limpieza mensual:", error);
      }
    };
    limpiarHistorialViejo();
  }, [userData]);

  // 2. ESCUCHA EN TIEMPO REAL Y CÁLCULO DE MÉTRICAS (MÁS DIARIAS)
  useEffect(() => {
    if (!userData?.barrioId) return;

    const q = query(
      collection(db, "invitados"),
      where("barrioId", "==", userData.barrioId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvitados(docs);
      
      const hoy = new Date();
      
      // Función para verificar si un timestamp es de HOY
      const esHoy = (timestamp) => {
        if (!timestamp || !timestamp.toDate) return false;
        const fecha = timestamp.toDate();
        return fecha.getDate() === hoy.getDate() &&
               fecha.getMonth() === hoy.getMonth() &&
               fecha.getFullYear() === hoy.getFullYear();
      };

      // Cálculo de las 4 tarjetas
      const enEspera = docs.filter(i => !i.ingresado && i.estado !== 'retirado').length;
      const adentro = docs.filter(i => i.estado === 'adentro').length;
      
      // Contadores diarios (se "borran" visualmente al día siguiente)
      const ingresaronHoy = docs.filter(i => esHoy(i.fechaIngreso)).length;
      const salieronHoy = docs.filter(i => esHoy(i.fechaSalida)).length;

      setStats({ enEspera, adentro, ingresaronHoy, salieronHoy });
    });

    // Reloj interno para calcular permanencias
    const timer = setInterval(() => setAhora(new Date()), 60000);
    return () => { unsubscribe(); clearInterval(timer); };
  }, [userData]);

  // 3. LÓGICA DEL ESCÁNER QR
  useEffect(() => {
    let scanner = null;

    if (showScanner) {
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
          }, (error) => { 
            // Errores de lectura continuos se ignoran para no saturar la consola
          });
        } else {
          Swal.fire("Error", "La librería de la cámara no cargó.", "error");
        }
      }, 300);

      return () => {
        clearTimeout(initScanner);
        if (scanner) {
          scanner.clear().catch(err => console.error("Error al limpiar el scanner:", err));
        }
      };
    }
  }, [showScanner]);

  const procesarAcceso = async (idInvitado) => {
    try {
      const docRef = doc(db, "invitados", idInvitado);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        Swal.fire("No encontrado", "QR inválido o invitado eliminado.", "error");
        return;
      }

      const inv = docSnap.data();

      if (inv.estado === 'retirado') {
        Swal.fire("Alerta", "Este código QR ya fue utilizado para salir.", "warning");
        return;
      }

      // Si no ha ingresado -> DA ENTRADA
      if (!inv.ingresado) {
        await updateDoc(docRef, {
          ingresado: true,
          fechaIngreso: serverTimestamp(),
          estado: 'adentro'
        });
        Swal.fire({
          title: "¡ACCESO PERMITIDO!",
          text: `Ingresando: ${inv.nombre} | Lote: ${inv.lote}`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
      } 
      // Si ya está adentro -> DA SALIDA
      else {
        await updateDoc(docRef, {
          ingresado: false,
          fechaSalida: serverTimestamp(),
          estado: 'retirado'
        });
        Swal.fire({
          title: "SALIDA REGISTRADA",
          text: `${inv.nombre} se retiró del predio.`,
          icon: "info",
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      Swal.fire("Error", "Problema al comunicar con la base de datos.", "error");
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
      Swal.fire("Éxito", "Ingreso manual autorizado y registrado.", "success");
    } catch (e) { 
      Swal.fire("Error", "No se pudo registrar.", "error"); 
    }
  };

  const calcularPermanencia = (fecha) => {
    if (!fecha || !fecha.toDate) return { texto: "Recién...", exceso: false };
    const horas = Math.floor((ahora - fecha.toDate()) / 3600000);
    return { texto: `${horas}h`, exceso: horas >= 12 };
  };

  // Filtrado para la tabla de búsquedas
  const invitadosFiltrados = invitados.filter(i => 
    i.nombre?.toLowerCase().includes(filtro.toLowerCase()) || 
    i.dni?.includes(filtro) || 
    i.lote?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <Container fluid className="py-4 mt-5 bg-light min-vh-100">
      
      {/* CABECERA Y BOTÓN MANUAL */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark m-0">
            <FontAwesomeIcon icon={faShieldAlt} className="me-2 text-primary"/>
            Control de Accesos
          </h2>
          <p className="text-muted small m-0">Supervisión en tiempo real del predio</p>
        </div>
        <Button variant="success" size="lg" className="fw-bold px-4 shadow-sm" onClick={() => setShowManualModal(true)}>
          <FontAwesomeIcon icon={faUserPlus} className="me-2"/> INGRESO MANUAL
        </Button>
      </div>

      {/* LAS 4 TARJETAS TÁCTICAS */}
      <Row className="mb-4 g-3">
        <Col md={6} lg={3}>
          <Card className="text-center border-0 shadow-sm py-2 h-100" style={{ backgroundColor: '#e0f2fe' }}>
            <Card.Body>
              <h6 className="text-uppercase small fw-bold text-secondary opacity-75">En Espera (Por venir)</h6>
              <h2 className="display-5 fw-bold text-primary mb-0">{stats.enEspera}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="text-center border-0 shadow-sm py-2 h-100 bg-primary text-white">
            <Card.Body>
              <h6 className="text-uppercase small fw-bold opacity-75">En el Predio (Adentro)</h6>
              <h2 className="display-5 fw-bold mb-0">{stats.adentro}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="text-center border-0 shadow-sm py-2 h-100" style={{ backgroundColor: '#fef08a' }}>
            <Card.Body>
              <h6 className="text-uppercase small fw-bold text-dark opacity-75">Ingresaron Hoy</h6>
              <h2 className="display-5 fw-bold text-dark mb-0">{stats.ingresaronHoy}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="text-center border-0 shadow-sm py-2 h-100 bg-secondary text-white">
            <Card.Body>
              <h6 className="text-uppercase small fw-bold opacity-75">Salieron Hoy</h6>
              <h2 className="display-5 fw-bold mb-0">{stats.salieronHoy}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* PANEL LATERAL: ESCÁNER Y BÚSQUEDA */}
        <Col lg={4}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white py-3 border-bottom-0">
              <h5 className="fw-bold m-0">Terminal de Control</h5>
            </Card.Header>
            <Card.Body>
              <Button 
                variant={showScanner ? "danger" : "dark"} 
                size="lg"
                className="w-100 mb-4 py-3 fw-bold shadow-sm"
                onClick={() => setShowScanner(!showScanner)}
              >
                <FontAwesomeIcon icon={showScanner ? faTimes : faCamera} className="me-2"/>
                {showScanner ? "CERRAR CÁMARA" : "ESCANEAR CÓDIGO QR"}
              </Button>
              
              {showScanner && (
                <div id="reader" className="rounded-4 overflow-hidden border shadow-sm mb-4"></div>
              )}
              
              <div className="bg-light p-3 rounded-3 border">
                <Form.Label className="small text-muted fw-bold">Buscar manualmente</Form.Label>
                <InputGroup>
                  <Form.Control 
                    placeholder="DNI, Nombre o Lote..." 
                    onChange={(e) => setFiltro(e.target.value)} 
                  />
                  <Button variant="outline-secondary"><FontAwesomeIcon icon={faSearch} /></Button>
                </InputGroup>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* PANEL PRINCIPAL: TABLAS */}
        <Col lg={8}>
          <Card className="shadow-sm border-0 h-100">
            <Tabs defaultActiveKey="adentro" className="custom-tabs border-bottom-0 pt-2 px-2">
              
              {/* PESTAÑA 1: GENTE EN EL PREDIO */}
              <Tab eventKey="adentro" title={`Adentro (${stats.adentro})`} className="p-0">
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead className="bg-light">
                      <tr className="small text-muted text-uppercase">
                        <th className="ps-4 py-3">Invitado / Vehículo</th>
                        <th className="py-3">Destino</th>
                        <th className="py-3">Permanencia</th>
                        <th className="text-end pe-4 py-3">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitadosFiltrados.filter(i => i.estado === 'adentro').length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-5 text-muted">
                            No hay personas en el predio que coincidan con la búsqueda.
                          </td>
                        </tr>
                      ) : (
                        invitadosFiltrados.filter(i => i.estado === 'adentro').map(inv => {
                          const p = calcularPermanencia(inv.fechaIngreso);
                          return (
                            <tr key={inv.id} className={p.exceso ? 'table-danger' : ''}>
                              <td className="ps-4">
                                <div className="fw-bold text-dark">{inv.nombre}</div>
                                <small className="text-muted">
                                  <Badge bg="light" text="dark" className="border">DNI: {inv.dni}</Badge> | {inv.patente || 'S/Patente'}
                                </small>
                              </td>
                              <td>
                                <div className="fw-bold">Lote {inv.lote}</div>
                                <small className="text-muted">Por: {inv.invitador}</small>
                              </td>
                              <td className={p.exceso ? 'text-danger fw-bold' : 'text-secondary'}>
                                <FontAwesomeIcon icon={faClock} className="me-1 opacity-75"/> {p.texto}
                                {p.exceso && <small className="d-block text-danger mt-1" style={{fontSize: '0.75rem'}}>¡Alerta Exceso!</small>}
                              </td>
                              <td className="text-end pe-4">
                                <Button size="sm" variant="outline-danger" className="fw-bold px-3" onClick={() => procesarAcceso(inv.id)}>
                                  REGISTRAR SALIDA
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </div>
              </Tab>
              
              {/* PESTAÑA 2: GENTE EN ESPERA */}
              <Tab eventKey="espera" title={`En Espera (${stats.enEspera})`} className="p-0">
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead className="bg-light">
                      <tr className="small text-muted text-uppercase">
                        <th className="ps-4 py-3">Datos del Invitado</th>
                        <th className="py-3">Destino</th>
                        <th className="text-end pe-4 py-3">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitadosFiltrados.filter(i => i.estado !== 'retirado' && !i.ingresado).length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-5 text-muted">
                            No hay invitados en espera.
                          </td>
                        </tr>
                      ) : (
                        invitadosFiltrados.filter(i => i.estado !== 'retirado' && !i.ingresado).map(inv => (
                          <tr key={inv.id}>
                            <td className="ps-4">
                              <div className="fw-bold text-dark">{inv.nombre}</div>
                              <small className="text-muted">DNI: {inv.dni}</small>
                            </td>
                            <td>
                              <div className="fw-bold">Lote {inv.lote}</div>
                              <small className="text-muted">Por: {inv.invitador}</small>
                            </td>
                            <td className="text-end pe-4">
                              <Button size="sm" variant="success" className="fw-bold px-3 shadow-sm" onClick={() => procesarAcceso(inv.id)}>
                                DAR INGRESO
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Tab>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* MODAL INGRESO MANUAL */}
      <Modal show={showManualModal} onHide={() => setShowManualModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-0 bg-success text-white">
          <Modal.Title className="fw-bold">
            <FontAwesomeIcon icon={faUserPlus} className="me-2"/> Ingreso Excepcional
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 bg-light">
          <Form onSubmit={handleManualEntry}>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label className="small fw-bold text-muted text-uppercase">Nombre Completo</Form.Label>
                <Form.Control size="lg" required placeholder="Ej: Juan Pérez" value={manualData.nombre} onChange={e => setManualData({...manualData, nombre: e.target.value})}/>
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold text-muted text-uppercase">DNI</Form.Label>
                <Form.Control required placeholder="Sin puntos" value={manualData.dni} onChange={e => setManualData({...manualData, dni: e.target.value})}/>
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold text-muted text-uppercase">Patente</Form.Label>
                <Form.Control placeholder="Opcional" value={manualData.patente} onChange={e => setManualData({...manualData, patente: e.target.value})}/>
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold text-muted text-uppercase">Lote Destino</Form.Label>
                <Form.Control required placeholder="Ej: 14B" value={manualData.lote} onChange={e => setManualData({...manualData, lote: e.target.value})}/>
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold text-muted text-uppercase">¿Quién autoriza?</Form.Label>
                <Form.Control required placeholder="Nombre del propietario" value={manualData.invitador} onChange={e => setManualData({...manualData, invitador: e.target.value})}/>
              </Col>
            </Row>
            <Button variant="success" type="submit" className="w-100 mt-4 py-3 fw-bold shadow">
              REGISTRAR Y PERMITIR ACCESO
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

    </Container>
  );
};