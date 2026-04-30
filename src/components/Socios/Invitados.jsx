import React, { useState, useEffect } from 'react';
import { 
  collection, addDoc, serverTimestamp, query, 
  where, onSnapshot, deleteDoc, doc, updateDoc,  
} from 'firebase/firestore'; 
import { db } from '../../firebaseConfig/firebase'; 
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

export const Invitados = () => {
  const [state, setState] = useState({
    formData: { nombre: '', dni: '', patente: '', email: '', telefono: '' },
    userData: null,
    loading: true,
    invitados: [],
    listas: [],
    verTodosLosInvitados: false,
    showListModal: false,
    isEditingList: false,
    editingListId: null,
    nuevaLista: { nombre: '', invitados: [] },
    showQRModal: false,
    currentQR: null,
    qrImageUrl: ''
  });

  const {
    formData, userData, loading, invitados, listas, 
    verTodosLosInvitados, showListModal, isEditingList, 
    editingListId, nuevaLista, showQRModal, currentQR, qrImageUrl
  } = state;

  useEffect(() => {
    const userDataFromStorage = localStorage.getItem('userData');
    if (userDataFromStorage) {
      const user = JSON.parse(userDataFromStorage);
      const userId = user.uid || user.id;
      const bId = user.barrioId; 

      setState(prev => ({ ...prev, userData: user, loading: false }));

      const qInv = query(
        collection(db, 'invitados'), 
        where('registradoPor', '==', userId),
        where('barrioId', '==', bId)
      );
      
      const unsubInv = onSnapshot(qInv, (snap) => {
        const ordenada = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        setState(prev => ({ ...prev, invitados: ordenada }));
      });

      const qList = query(
        collection(db, 'listasInvitados'), 
        where('registradoPor', '==', userId),
        where('barrioId', '==', bId)
      );
      
      const unsubList = onSnapshot(qList, (snap) => {
        setState(prev => ({ ...prev, listas: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
      });

      return () => { unsubInv(); unsubList(); };
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({ ...prev, formData: { ...prev.formData, [name]: value } }));
  };

  const enviarInvitadoAGuardia = (inv) => {
    const hoy = new Date().toLocaleDateString();
    const loteCompleto = userData.manzana ? `${userData.manzana}-${userData.lote}` : userData.lote;
    const mensaje = `*AVISO DE INGRESO*\n\n*Invitado:* ${inv.nombre}\n*DNI:* ${inv.dni}\n*Patente:* ${inv.patente || 'No declara'}\n*Lote:* ${loteCompleto}\n*Fecha:* ${hoy}\n\nAutoriza: ${userData.nombre}`;
    window.open(`https://wa.me/5491149924327?text=${encodeURIComponent(mensaje)}`);
  };

  const eliminarInvitado = async (id) => {
    const res = await Swal.fire({ 
      title: '¿Eliminar invitado?', 
      text: "Se quitará de tu lista de invitados frecuentes.",
      icon: 'warning', 
      showCancelButton: true,
      confirmButtonColor: '#d33'
    });
    if (res.isConfirmed) await deleteDoc(doc(db, 'invitados', id));
  };

  const agregarInvitado = async (e) => {
    e.preventDefault();
    try {
      const loteCompleto = userData.manzana ? `${userData.manzana}-${userData.lote}` : userData.lote;
      await addDoc(collection(db, 'invitados'), {
        ...formData,
        fechaCreacion: serverTimestamp(),
        lote: loteCompleto,
        invitador: userData.nombre,
        registradoPor: userData.uid || userData.id,
        barrioId: userData.barrioId,
        ingresado: false
      });
      setState(prev => ({ ...prev, formData: { nombre: '', dni: '', patente: '', email: '', telefono: '' } }));
      Swal.fire('Agregado', 'Invitado guardado correctamente', 'success');
    } catch (err) { Swal.fire('Error', 'No se pudo guardar', 'error'); }
  };

  const manejarLista = {
    abrirNueva: () => setState(prev => ({
      ...prev, isEditingList: false, 
      nuevaLista: { nombre: `Evento ${new Date().toLocaleDateString()}`, invitados: [] },
      showListModal: true 
    })),
    editar: (lista) => setState(prev => ({
      ...prev, isEditingList: true, editingListId: lista.id,
      nuevaLista: { nombre: lista.nombre, invitados: [...lista.invitados] },
      showListModal: true
    })),
    guardar: async () => {
      const invitadosLimpios = nuevaLista.invitados.map(inv => ({
        nombre: inv.nombre, dni: inv.dni, patente: inv.patente || ''
      }));
      const loteCompleto = userData.manzana ? `${userData.manzana}-${userData.lote}` : userData.lote;
      const data = {
        nombre: nuevaLista.nombre, 
        invitados: invitadosLimpios,
        registradoPor: userData.uid || userData.id,
        barrioId: userData.barrioId,
        lote: loteCompleto,
        ultimaModificacion: serverTimestamp()
      };
      try {
        if (isEditingList) await updateDoc(doc(db, 'listasInvitados', editingListId), data);
        else await addDoc(collection(db, 'listasInvitados'), data);
        setState(prev => ({ ...prev, showListModal: false }));
        Swal.fire('Guardado', 'Lista de eventos actualizada', 'success');
      } catch (err) { Swal.fire('Error', 'Error al guardar lista', 'error'); }
    },
    eliminar: async (id) => {
      const res = await Swal.fire({ title: '¿Borrar lista?', icon: 'warning', showCancelButton: true });
      if (res.isConfirmed) await deleteDoc(doc(db, 'listasInvitados', id));
    }
  };

  const agregarAListaTemporal = (invitado) => {
    const existe = state.nuevaLista.invitados.some(i => i.dni === invitado.dni);
    if (existe) {
      return Swal.fire({ icon: 'info', title: 'Ya está en la lista', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    }
    setState(prev => ({
      ...prev, showListModal: true,
      nuevaLista: { ...prev.nuevaLista, invitados: [...(prev.nuevaLista.invitados || []), invitado] }
    }));
    Swal.fire({ icon: 'success', title: `Agregado: ${invitado.nombre}`, toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
  };

  const invitadosVisibles = verTodosLosInvitados ? invitados : invitados.slice(0, 5);

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="container mt-4 pb-5">
      
      {/* 1. SECCIÓN LINK ACTUALIZADA */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body className="text-center py-4">
          <h5 className="mb-3 fw-bold">Solicitar datos al invitado</h5>
          {(() => {
            const baseUrl = `${window.location.origin}/pages/invitacion.html`;
            // SOLUCIÓN AL LOTE: Unimos manzana y lote
            const loteFinal = userData?.manzana ? `${userData.manzana}-${userData.lote}` : userData?.lote;
            // SOLUCIÓN AL ID: Pasamos el idPublico explícitamente y como respaldo el uid
            const params = new URLSearchParams({
              idPublico: userData?.idPublico || userData?.uid || userData?.id || '',
              barrioId: userData?.barrioId || '',
              invitador: userData?.nombre || '',
              lote: loteFinal || '',
              telefono: userData?.telefono || ''
            }).toString();
            
            const fullLink = `${baseUrl}?${params}`;

            return (
              <div className="d-flex justify-content-center gap-3">
                <Button variant="outline-primary" onClick={() => {
                  navigator.clipboard.writeText(fullLink);
                  Swal.fire('Copiado', 'Enlace copiado al portapapeles', 'success');
                }}><FaCopy className="me-2"/>Copiar Link</Button>

                <Button variant="success" onClick={() => {
                  const msg = encodeURIComponent(`¡Hola! 👋 Para agilizar tu ingreso, por favor registrate aquí: ${fullLink}`);
                  window.open(`https://wa.me/?text=${msg}`);
                }}><FaWhatsapp className="me-2"/>WhatsApp</Button>
              </div>
            );
          })()}
        </Card.Body>
      </Card>

      {/* 2. FORMULARIO DE CARGA RÁPIDA */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Form onSubmit={agregarInvitado}>
            <Row className="g-2">
              <Col md={4}><Form.Control placeholder="Nombre Completo" name="nombre" value={formData.nombre} onChange={handleChange} required /></Col>
              <Col md={3}><Form.Control placeholder="DNI" name="dni" value={formData.dni} onChange={handleChange} required /></Col>
              <Col md={3}><Form.Control placeholder="Patente" name="patente" value={formData.patente} onChange={handleChange} /></Col>
              <Col md={2}><Button variant="primary" type="submit" className="w-100">Agregar</Button></Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* 3. TABLA INVITADOS FRECUENTES */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0 fw-bold">Invitados Frecuentes</h5>
          <Button variant="info" size="sm" className="text-white" onClick={manejarLista.abrirNueva}>
            <FaList className="me-2"/>Crear Lista de Evento
          </Button>
        </Card.Header>
        <Table responsive hover className="mb-0">
          <thead>
            <tr><th>Nombre</th><th>DNI</th><th className="text-end">Acciones</th></tr>
          </thead>
          <tbody>
            {invitadosVisibles.map(inv => (
              <tr key={inv.id} className="align-middle">
                <td>{inv.nombre}</td>
                <td>{inv.dni}</td>
                <td className="text-end">
                  <Button variant="link" className="text-success p-1 me-2" title="WhatsApp Guardia" onClick={() => enviarInvitadoAGuardia(inv)}><FaWhatsapp size={20}/></Button>
                  <Button variant="link" className="text-primary p-1 me-2" onClick={async () => {
                    const url = await QRCode.toDataURL(JSON.stringify({ n: inv.nombre, d: inv.dni, b: inv.barrioId }));
                    setState(prev => ({ ...prev, currentQR: inv, qrImageUrl: url, showQRModal: true }));
                  }}><FaQrcode size={18}/></Button>
                  <Button variant="link" className="text-info p-1 me-2" title="Añadir a lista" onClick={() => agregarAListaTemporal(inv)}><FaPlusCircle size={18}/></Button>
                  <Button variant="link" className="text-danger p-1" onClick={() => eliminarInvitado(inv.id)}><FaTrash size={18}/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {invitados.length > 5 && (
          <div className="text-center py-2 bg-light">
            <Button variant="link" size="sm" onClick={() => setState(prev => ({ ...prev, verTodosLosInvitados: !verTodosLosInvitados }))}>
              {verTodosLosInvitados ? "Ver menos" : `Mostrar todos (${invitados.length})`}
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
                  <Button variant="outline-success" size="sm" onClick={() => {
                    const msg = `*LISTA EVENTO:* ${lista.nombre}\n` + lista.invitados.map(i => `- ${i.nombre} (DNI: ${i.dni})`).join('\n');
                    window.open(`https://wa.me/5491149924327?text=${encodeURIComponent(msg)}`);
                  }}><FaWhatsapp /></Button>
                  <Button variant="outline-primary" size="sm" onClick={() => manejarLista.editar(lista)}><FaEdit /></Button>
                  <Button variant="outline-danger" size="sm" onClick={() => manejarLista.eliminar(lista.id)}><FaTrash /></Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* MODALES */}
      <Modal show={showListModal} onHide={() => setState(prev => ({ ...prev, showListModal: false }))} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="h6 fw-bold">{isEditingList ? 'Editar' : 'Configurar Nueva'} Lista</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Nombre del Evento</Form.Label>
            <Form.Control 
              placeholder="Ej: Cumpleaños Lote 45"
              value={nuevaLista.nombre} 
              onChange={e => setState(prev => ({ ...prev, nuevaLista: { ...prev.nuevaLista, nombre: e.target.value } }))} 
            />
          </Form.Group>
          <label className="small fw-bold mb-2">Invitados en esta lista:</label>
          <ListGroup variant="flush" className="border rounded" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {nuevaLista.invitados.length === 0 && <ListGroup.Item className="text-center text-muted small">No hay invitados seleccionados</ListGroup.Item>}
            {nuevaLista.invitados.map((inv, i) => (
              <ListGroup.Item key={i} className="d-flex justify-content-between align-items-center py-2">
                <span className="small">{inv.nombre}</span>
                <FaUserMinus className="text-danger" style={{ cursor: 'pointer' }} onClick={() => {
                   const filtrados = nuevaLista.invitados.filter((_, idx) => idx !== i);
                   setState(prev => ({ ...prev, nuevaLista: { ...prev.nuevaLista, invitados: filtrados } }));
                }}/>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" className="w-100 py-2" onClick={manejarLista.guardar} disabled={!nuevaLista.nombre}>
            Confirmar y Guardar Lista
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showQRModal} onHide={() => setState(prev => ({ ...prev, showQRModal: false }))} centered size="sm">
        <Modal.Body className="text-center p-4">
          <div className="bg-white p-3 rounded border mb-3">
            <img src={qrImageUrl} alt="QR" className="img-fluid" />
          </div>
          <h6 className="fw-bold mb-0">{currentQR?.nombre}</h6>
          <small className="text-muted">DNI: {currentQR?.dni}</small>
          <hr />
          <Button variant="primary" size="sm" className="w-100" onClick={() => Swal.fire('Función en desarrollo', 'Próximamente envío directo por email', 'info')}>
            Descargar QR
          </Button>
        </Modal.Body>
      </Modal>

    </div>
  );
};