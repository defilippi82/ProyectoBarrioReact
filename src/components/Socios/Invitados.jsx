import React, { useState, useEffect, useContext, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../../firebaseConfig/firebase'; 
import { UserContext } from '../Services/UserContext';
import Swal from 'sweetalert2';
import { Table, Button, Form, Modal, Row, Col, Card, Spinner, ListGroup, Badge } from 'react-bootstrap';
import { FaWhatsapp, FaCopy, FaList, FaPlusCircle, FaQrcode, FaTrash, FaEdit, FaUserMinus } from 'react-icons/fa';
import QRCode from 'qrcode';

const TELEFONO_GUARDIA = '5491149924327';
const COLECCIONES_VALIDAS = new Set(['invitados', 'listasInvitados']);

export const Invitados = () => {
  const { userData } = useContext(UserContext);
  const etiquetas = userData?.etiquetas || { distribucion: 'Isla', unidad: 'Lote', bloque: 'Manzana' };
  
  const [formData, setFormData] = useState({ nombre: '', dni: '', patente: '', email: '', telefono: '' });
  const [invitados, setInvitados] = useState([]);
  const [listas, setListas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verTodos, setVerTodos] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [isEditingList, setIsEditingList] = useState(false);
  const [editingListId, setEditingListId] = useState(null);
  const [nuevaLista, setNuevaLista] = useState({ nombre: '', invitados: [] });
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentQR, setCurrentQR] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState('');

  const getLoteCompleto = useCallback((user) => {
    if (!user?.manzana || !user?.lote) return "N/A";
    return `${user.manzana}-${user.lote}`;
  }, []);

  useEffect(() => {
    if (!userData?.barrioId) return;

    const userId = userData?.uid || userData?.id;
    const bId = userData.barrioId;

    const qInv = query(collection(db, 'invitados'), where('registradoPor', '==', userId), where('barrioId', '==', bId));
    const unsubInv = onSnapshot(qInv, (snap) => {
      setInvitados(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.nombre.localeCompare(b.nombre)));
    });

    const qList = query(collection(db, 'listasInvitados'), where('registradoPor', '==', userId), where('barrioId', '==', bId));
    const unsubList = onSnapshot(qList, (snap) => {
      setListas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    setLoading(false);
    return () => { unsubInv(); unsubList(); };
  }, [userData]);

  const agregarInvitado = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'invitados'), {
        ...formData,
        fechaCreacion: serverTimestamp(),
        lote: getLoteCompleto(userData),
        invitador: `${userData.nombre || ''} ${userData.apellido || ''}`,
        registradoPor: userData.uid || userData.id,
        barrioId: userData.barrioId,
        ingresado: false
      });
      setFormData({ nombre: '', dni: '', patente: '', email: '', telefono: '' });
      Swal.fire({ title: 'Invitado Agregado', icon: 'success', timer: 1500 });
    } catch (error) {
      Swal.fire('Error', 'No se pudo procesar el registro', 'error');
    }
  };

  const eliminarDoc = async (id, coleccion) => {
    if (!COLECCIONES_VALIDAS.has(coleccion)) return;
    const res = await Swal.fire({ title: '¿Confirmar eliminación?', icon: 'warning', showCancelButton: true });
    if (res.isConfirmed) await deleteDoc(doc(db, coleccion, id));
  };

  const enviarInvitadoAGuardia = (inv) => {
    const msg = `*AVISO DE INGRESO*\n\n*Invitado:* ${inv.nombre}\n*DNI:* ${inv.dni}\n*${etiquetas.bloque}:* ${userData.manzana}\n*${etiquetas.unidad}:* ${userData.lote}\n\nAutoriza: ${userData.apellido}`;
    window.open(`https://wa.me/${TELEFONO_GUARDIA}?text=${encodeURIComponent(msg)}`);
  };

  const mostrarQR = async (inv) => {
    try {
      const url = await QRCode.toDataURL(JSON.stringify({ n: inv.nombre, d: inv.dni, b: userData.barrioId }));
      setCurrentQR(inv);
      setQrImageUrl(url);
      setShowQRModal(true);
    } catch {
      Swal.fire('Error', 'No se pudo generar QR', 'error');
    }
  };

  const guardarLista = async () => {
    const data = {
      nombre: nuevaLista.nombre,
      invitados: nuevaLista.invitados,
      registradoPor: userData.uid || userData.id,
      barrioId: userData.barrioId,
      lote: getLoteCompleto(userData),
      ultimaModificacion: serverTimestamp()
    };
    if (isEditingList) await updateDoc(doc(db, 'listasInvitados', editingListId), data);
    else await addDoc(collection(db, 'listasInvitados'), data);
    setShowListModal(false);
    Swal.fire('Guardado', 'Lista actualizada', 'success');
  };

  const linkInvitacion = `${window.location.origin}/pages/invitacion.html?barrioId=${userData?.barrioId}&invitador=${userData?.apellido}&lote=${getLoteCompleto(userData)}&idPublico=${userData?.idPublico}`;

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="container mt-4 pb-5">
      {/* 1. LINK DE INVITACIÓN */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body className="text-center py-4">
          <h5 className="mb-3 fw-bold">Solicitar datos al invitado</h5>
          <Button variant="outline-primary" className="me-2" onClick={() => { navigator.clipboard.writeText(linkInvitacion); Swal.fire('Copiado', '', 'success'); }}>
            <FaCopy className="me-2"/>Copiar Link
          </Button>
          <Button variant="success" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Hola! Registrate aquí: ' + linkInvitacion)}`)}>
            <FaWhatsapp className="me-2"/>WhatsApp
          </Button>
        </Card.Body>
      </Card>

      {/* 2. FORMULARIO */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Form onSubmit={agregarInvitado}>
            <Row className="g-2">
              <Col md={4}><Form.Control placeholder="Nombre" name="nombre" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required /></Col>
              <Col md={3}><Form.Control placeholder="DNI" name="dni" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} required /></Col>
              <Col md={3}><Form.Control placeholder="Patente" name="patente" value={formData.patente} onChange={e => setFormData({...formData, patente: e.target.value})} /></Col>
              <Col md={2}><Button variant="primary" type="submit" className="w-100">Agregar</Button></Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* 3. TABLA */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0 fw-bold">Invitados Frecuentes</h5>
          <Button variant="info" size="sm" onClick={() => { setIsEditingList(false); setShowListModal(true); }}>
            <FaList className="me-2"/>Crear Lista
          </Button>
        </Card.Header>
        <Table responsive hover>
          <thead><tr><th>Nombre</th><th>DNI</th><th>Patente</th><th className="text-end">Acciones</th></tr></thead>
          <tbody>
            {(verTodos ? invitados : invitados.slice(0, 5)).map(inv => (
              <tr key={inv.id}>
                <td>{inv.nombre}</td>
                <td>{inv.dni}</td>
                <td>{inv.patente}</td>
                <td className="text-end">
                  <Button variant="link" className="text-success p-1" onClick={() => enviarInvitadoAGuardia(inv)}><FaWhatsapp size={20}/></Button>
                  <Button variant="link" className="text-primary p-1" onClick={() => mostrarQR(inv)}><FaQrcode size={18}/></Button>
                  <Button variant="link" className="text-danger p-1" onClick={() => eliminarDoc(inv.id, 'invitados')}><FaTrash size={18}/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      {/* ... Resto de modales (Lista y QR) igual al original ... */}
    </div>
  );
};