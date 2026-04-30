import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  collection, addDoc, serverTimestamp, query, 
  where, onSnapshot, deleteDoc, doc, updateDoc,  
} from 'firebase/firestore'; 
import { db } from '../../firebaseConfig/firebase'; 
import { UserContext } from '../Services/UserContext';
import Swal from 'sweetalert2';
import { 
  Table, Button, Form, Modal, Row, Col, 
  Card, Spinner, ListGroup, Badge 
} from 'react-bootstrap';
import { 
  FaWhatsapp, FaCopy, FaList, FaPlusCircle, 
  FaQrcode, FaTrash, FaEdit, FaUserMinus 
} from 'react-icons/fa';
import QRCode from 'qrcode';

// ─── Constante centralizada: único lugar donde actualizar el número ───
const TELEFONO_GUARDIA = '5491149924327';

// ─── Helper: construye lote completo desde userData ───────────────────
const getLoteCompleto = (user) =>
  user?.manzana ? `${user.manzana}-${user.lote}` : user?.lote ?? '';

// ─── Colecciones válidas permitidas en handleDelete ──────────────────
const COLECCIONES_VALIDAS = new Set(['invitados', 'listasInvitados']);

export const Invitados = () => {
  // ── Contexto: fuente de verdad única para userData ──────────────────
  const { userData } = useContext(UserContext);

  // ── Estado separado por responsabilidad ────────────────────────────
  const [formData, setFormData] = useState({
    nombre: '', dni: '', patente: '', email: '', telefono: ''
  });
  const [invitados, setInvitados]                   = useState([]);
  const [listas, setListas]                         = useState([]);
  const [loading, setLoading]                       = useState(true);
  const [verTodos, setVerTodos]                     = useState(false);

  // Modal lista
  const [showListModal, setShowListModal]           = useState(false);
  const [isEditingList, setIsEditingList]           = useState(false);
  const [editingListId, setEditingListId]           = useState(null);
  const [nuevaLista, setNuevaLista]                 = useState({ nombre: '', invitados: [] });

  // Modal QR
  const [showQRModal, setShowQRModal]               = useState(false);
  const [currentQR, setCurrentQR]                   = useState(null);
  const [qrImageUrl, setQrImageUrl]                 = useState('');

  // ── Suscripciones a Firestore ───────────────────────────────────────
  useEffect(() => {
    if (!userData) return;

    const userId = userData.uid || userData.id;
    const bId    = userData.barrioId;

    setLoading(false);

    const qInv = query(
      collection(db, 'invitados'),
      where('registradoPor', '==', userId),
      where('barrioId',      '==', bId)
    );

    const unsubInv = onSnapshot(qInv, (snap) => {
      const ordenada = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setInvitados(ordenada);
    });

    const qList = query(
      collection(db, 'listasInvitados'),
      where('registradoPor', '==', userId),
      where('barrioId',      '==', bId)
    );

    const unsubList = onSnapshot(qList, (snap) => {
      setListas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubInv(); unsubList(); };
  }, [userData]);

  // ── Handlers de formulario ──────────────────────────────────────────
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const agregarInvitado = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'invitados'), {
        ...formData,
        fechaCreacion: serverTimestamp(),
        lote:          getLoteCompleto(userData),
        invitador:     userData.nombre,
        registradoPor: userData.uid || userData.id,
        barrioId:      userData.barrioId,
        ingresado:     false
      });
      setFormData({ nombre: '', dni: '', patente: '', email: '', telefono: '' });
      Swal.fire('Agregado', 'Invitado guardado correctamente', 'success');
    } catch {
      Swal.fire('Error', 'No se pudo guardar', 'error');
    }
  };

  // ── Eliminar con validación de colección ────────────────────────────
  const eliminarDoc = async (id, coleccion) => {
    if (!COLECCIONES_VALIDAS.has(coleccion)) {
      console.error(`Colección no permitida: ${coleccion}`);
      return;
    }
    const res = await Swal.fire({
      title: coleccion === 'invitados' ? '¿Eliminar invitado?' : '¿Borrar lista?',
      text:  coleccion === 'invitados' ? 'Se quitará de tu lista de invitados frecuentes.' : '',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    });
    if (res.isConfirmed) await deleteDoc(doc(db, coleccion, id));
  };

  // ── WhatsApp a guardia ──────────────────────────────────────────────
  const enviarInvitadoAGuardia = (inv) => {
    const hoy    = new Date().toLocaleDateString();
    const lote   = getLoteCompleto(userData);
    const mensaje = `*AVISO DE INGRESO*\n\n*Invitado:* ${inv.nombre}\n*DNI:* ${inv.dni}\n*Patente:* ${inv.patente || 'No declara'}\n*Lote:* ${lote}\n*Fecha:* ${hoy}\n\nAutoriza: ${userData.nombre}`;
    window.open(`https://wa.me/${TELEFONO_GUARDIA}?text=${encodeURIComponent(mensaje)}`);
  };

  // ── QR ──────────────────────────────────────────────────────────────
  const mostrarQR = async (inv) => {
    try {
      const url = await QRCode.toDataURL(
        JSON.stringify({ n: inv.nombre, d: inv.dni, b: inv.barrioId })
      );
      setCurrentQR(inv);
      setQrImageUrl(url);
      setShowQRModal(true);
    } catch {
      Swal.fire('Error', 'No se pudo generar el QR', 'error');
    }
  };

  // ── Gestión de listas ───────────────────────────────────────────────
  const abrirNuevaLista = () => {
    setIsEditingList(false);
    setEditingListId(null);
    setNuevaLista({ nombre: `Evento ${new Date().toLocaleDateString()}`, invitados: [] });
    setShowListModal(true);
  };

  const editarLista = (lista) => {
    setIsEditingList(true);
    setEditingListId(lista.id);
    setNuevaLista({ nombre: lista.nombre, invitados: [...lista.invitados] });
    setShowListModal(true);
  };

  const guardarLista = async () => {
    const invitadosLimpios = nuevaLista.invitados.map(({ nombre, dni, patente }) => ({
      nombre, dni, patente: patente || ''
    }));
    const data = {
      nombre:             nuevaLista.nombre,
      invitados:          invitadosLimpios,
      registradoPor:      userData.uid || userData.id,
      barrioId:           userData.barrioId,
      lote:               getLoteCompleto(userData),
      ultimaModificacion: serverTimestamp()
    };
    try {
      if (isEditingList) {
        await updateDoc(doc(db, 'listasInvitados', editingListId), data);
      } else {
        await addDoc(collection(db, 'listasInvitados'), data);
      }
      setShowListModal(false);
      Swal.fire('Guardado', 'Lista de eventos actualizada', 'success');
    } catch {
      Swal.fire('Error', 'Error al guardar lista', 'error');
    }
  };

  const agregarAListaTemporal = (invitado) => {
    const existe = nuevaLista.invitados.some(i => i.dni === invitado.dni);
    if (existe) {
      return Swal.fire({
        icon: 'info', title: 'Ya está en la lista',
        toast: true, position: 'top-end', timer: 2000, showConfirmButton: false
      });
    }
    setNuevaLista(prev => ({
      ...prev,
      invitados: [...prev.invitados, invitado]
    }));
    setShowListModal(true);
    Swal.fire({
      icon: 'success', title: `Agregado: ${invitado.nombre}`,
      toast: true, position: 'top-end', timer: 2000, showConfirmButton: false
    });
  };

  const quitarDeListaTemporal = (idx) => {
    setNuevaLista(prev => ({
      ...prev,
      invitados: prev.invitados.filter((_, i) => i !== idx)
    }));
  };

  // ── Link de invitación ──────────────────────────────────────────────
  const linkInvitacion = (() => {
    const baseUrl   = `${window.location.origin}/pages/invitacion.html`;
    const loteFinal = getLoteCompleto(userData);
    const params    = new URLSearchParams({
      idPublico: userData?.idPublico || userData?.uid || userData?.id || '',
      barrioId:  userData?.barrioId  || '',
      invitador: userData?.nombre    || '',
      lote:      loteFinal,
      telefono:  userData?.telefono  || ''
    }).toString();
    return `${baseUrl}?${params}`;
  })();

  // ── Render ──────────────────────────────────────────────────────────
  const invitadosVisibles = verTodos ? invitados : invitados.slice(0, 5);

  if (loading) return (
    <div className="text-center mt-5">
      <Spinner animation="border" variant="primary" />
    </div>
  );

  return (
    <div className="container mt-4 pb-5">

      {/* 1. LINK DE INVITACIÓN */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body className="text-center py-4">
          <h5 className="mb-3 fw-bold">Solicitar datos al invitado</h5>
          <div className="d-flex justify-content-center gap-3">
            <Button variant="outline-primary" onClick={() => {
              navigator.clipboard.writeText(linkInvitacion);
              Swal.fire('Copiado', 'Enlace copiado al portapapeles', 'success');
            }}>
              <FaCopy className="me-2"/>Copiar Link
            </Button>
            <Button variant="success" onClick={() => {
              const msg = encodeURIComponent(`¡Hola! 👋 Para agilizar tu ingreso, por favor registrate aquí: ${linkInvitacion}`);
              window.open(`https://wa.me/?text=${msg}`);
            }}>
              <FaWhatsapp className="me-2"/>WhatsApp
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* 2. FORMULARIO DE CARGA RÁPIDA */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Form onSubmit={agregarInvitado}>
            <Row className="g-2">
              <Col md={4}>
                <Form.Control
                  placeholder="Nombre Completo"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </Col>
              <Col md={3}>
                <Form.Control
                  placeholder="DNI"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  required
                />
              </Col>
              <Col md={3}>
                <Form.Control
                  placeholder="Patente"
                  name="patente"
                  value={formData.patente}
                  onChange={handleChange}
                />
              </Col>
              <Col md={2}>
                <Button variant="primary" type="submit" className="w-100">Agregar</Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* 3. TABLA INVITADOS FRECUENTES */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0 fw-bold">Invitados Frecuentes</h5>
          <Button variant="info" size="sm" className="text-white" onClick={abrirNuevaLista}>
            <FaList className="me-2"/>Crear Lista de Evento
          </Button>
        </Card.Header>
        <Table responsive hover className="mb-0">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>DNI</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invitadosVisibles.map(inv => (
              <tr key={inv.id} className="align-middle">
                <td>{inv.nombre}</td>
                <td>{inv.dni}</td>
                <td className="text-end">
                  <Button
                    variant="link" className="text-success p-1 me-2"
                    title="WhatsApp Guardia"
                    onClick={() => enviarInvitadoAGuardia(inv)}
                  >
                    <FaWhatsapp size={20}/>
                  </Button>
                  <Button
                    variant="link" className="text-primary p-1 me-2"
                    title="Ver QR"
                    onClick={() => mostrarQR(inv)}
                  >
                    <FaQrcode size={18}/>
                  </Button>
                  <Button
                    variant="link" className="text-info p-1 me-2"
                    title="Añadir a lista"
                    onClick={() => agregarAListaTemporal(inv)}
                  >
                    <FaPlusCircle size={18}/>
                  </Button>
                  <Button
                    variant="link" className="text-danger p-1"
                    title="Eliminar"
                    onClick={() => eliminarDoc(inv.id, 'invitados')}
                  >
                    <FaTrash size={18}/>
                  </Button>
                </td>
              </tr>
            ))}
            {invitados.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-muted py-4">
                  Todavía no tenés invitados frecuentes guardados.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
        {invitados.length > 5 && (
          <div className="text-center py-2 bg-light">
            <Button variant="link" size="sm" onClick={() => setVerTodos(v => !v)}>
              {verTodos ? 'Ver menos' : `Mostrar todos (${invitados.length})`}
            </Button>
          </div>
        )}
      </Card>

      {/* 4. LISTAS DE EVENTOS */}
      <h5 className="mb-3 fw-bold">Eventos y Listas Guardadas</h5>
      <Row className="g-3">
        {listas.map(lista => (
          <Col md={6} key={lista.id}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1 fw-bold">{lista.nombre}</h6>
                  <Badge bg="secondary" pill>{lista.invitados.length} personas</Badge>
                </div>
                <div className="btn-group">
                  <Button
                    variant="outline-success" size="sm"
                    title="Enviar lista a guardia"
                    onClick={() => {
                      const msg = `*LISTA EVENTO:* ${lista.nombre}\n` +
                        lista.invitados.map(i => `- ${i.nombre} (DNI: ${i.dni})`).join('\n');
                      window.open(`https://wa.me/${TELEFONO_GUARDIA}?text=${encodeURIComponent(msg)}`);
                    }}
                  >
                    <FaWhatsapp />
                  </Button>
                  <Button
                    variant="outline-primary" size="sm"
                    onClick={() => editarLista(lista)}
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    variant="outline-danger" size="sm"
                    onClick={() => eliminarDoc(lista.id, 'listasInvitados')}
                  >
                    <FaTrash />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
        {listas.length === 0 && (
          <Col xs={12}>
            <p className="text-muted text-center">No hay listas de eventos guardadas.</p>
          </Col>
        )}
      </Row>

      {/* MODAL: LISTA DE EVENTO */}
      <Modal
        show={showListModal}
        onHide={() => setShowListModal(false)}
        centered
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="h6 fw-bold">
            {isEditingList ? 'Editar' : 'Configurar Nueva'} Lista
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Nombre del Evento</Form.Label>
            <Form.Control
              placeholder="Ej: Cumpleaños Lote 45"
              value={nuevaLista.nombre}
              onChange={e => setNuevaLista(prev => ({ ...prev, nombre: e.target.value }))}
            />
          </Form.Group>
          <label className="small fw-bold mb-2">Invitados en esta lista:</label>
          <ListGroup
            variant="flush"
            className="border rounded"
            style={{ maxHeight: '250px', overflowY: 'auto' }}
          >
            {nuevaLista.invitados.length === 0 && (
              <ListGroup.Item className="text-center text-muted small">
                No hay invitados seleccionados
              </ListGroup.Item>
            )}
            {nuevaLista.invitados.map((inv, i) => (
              <ListGroup.Item
                key={i}
                className="d-flex justify-content-between align-items-center py-2"
              >
                <span className="small">{inv.nombre}</span>
                <FaUserMinus
                  className="text-danger"
                  style={{ cursor: 'pointer' }}
                  onClick={() => quitarDeListaTemporal(i)}
                />
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            className="w-100 py-2"
            onClick={guardarLista}
            disabled={!nuevaLista.nombre}
          >
            Confirmar y Guardar Lista
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL: QR */}
      <Modal
        show={showQRModal}
        onHide={() => setShowQRModal(false)}
        centered
        size="sm"
      >
        <Modal.Body className="text-center p-4">
          <div className="bg-white p-3 rounded border mb-3">
            <img src={qrImageUrl} alt="QR del invitado" className="img-fluid" />
          </div>
          <h6 className="fw-bold mb-0">{currentQR?.nombre}</h6>
          <small className="text-muted">DNI: {currentQR?.dni}</small>
          <hr />
          <Button
            variant="primary" size="sm" className="w-100"
            onClick={() => Swal.fire('Función en desarrollo', 'Próximamente envío directo por email', 'info')}
          >
            Descargar QR
          </Button>
        </Modal.Body>
      </Modal>

    </div>
  );
};