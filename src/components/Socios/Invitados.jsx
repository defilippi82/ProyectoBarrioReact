import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore'; 
import { db } from '/src/firebaseConfig/firebase.js';
import Swal from 'sweetalert2';
import { Table, Button, Form, Modal, Row, Col, Card, Spinner } from 'react-bootstrap';
import {  FaWhatsapp, FaCopy, FaList, FaPlusCircle, FaEnvelope, FaQrcode, FaTrash, FaEdit, FaUserMinus } from 'react-icons/fa';
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
    nuevaLista: { nombre: 'Nueva Lista', invitados: [] },
    showQRModal: false,
    currentQR: null,
    qrImageUrl: ''
  });

  const {
    formData, userData, loading, invitados, listas, 
    verTodosLosInvitados, showListModal, isEditingList, 
    editingListId, nuevaLista, showQRModal, currentQR, qrImageUrl
  } = state;

  // 1. Carga de usuario y Listeners
 useEffect(() => {
  const userDataFromStorage = localStorage.getItem('userData');
  if (userDataFromStorage) {
    const user = JSON.parse(userDataFromStorage); // 1. Extraemos los datos
    setState(prev => ({ ...prev, userData: user, loading: false }));

    const userId = user.uid || user.id;
    const bId = user.barrioId; // 2. Usamos esta variable local

    // Escuchar Invitados Individuales
    const qInv = query(
      collection(db, 'invitados'), 
      where('registradoPor', '==', userId),
      where('barrioId', '==', bId) // <--- CAMBIO AQUÍ: bId en lugar de userData.barrioId
    );
    
    const unsubInv = onSnapshot(qInv, (snap) => {
      const ordenada = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setState(prev => ({ ...prev, invitados: ordenada }));
    });

    // Escuchar Listas
    const qList = query(
      collection(db, 'listasInvitados'), 
      where('registradoPor', '==', userId),
      where('barrioId', '==', bId) // <--- CAMBIO AQUÍ: bId en lugar de userData.barrioId
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

  // --- FUNCIONES DE ACCIÓN ---

  const enviarInvitadoAGuardia = (inv) => {
    const hoy = new Date().toLocaleDateString();
    const mensaje = `*AVISO DE INGRESO*\n\n*Invitado:* ${inv.nombre}\n*DNI:* ${inv.dni}\n*Patente:* ${inv.patente || 'No declara'}\n*Lote:* ${userData.manzana}-${userData.lote}\n*Fecha:* ${hoy}\n\nAutoriza: ${userData.nombre}`;
    window.open(`https://wa.me/5491149924327?text=${encodeURIComponent(mensaje)}`);
  };

  const eliminarInvitado = async (id) => {
    const res = await Swal.fire({ title: '¿Eliminar invitado?', icon: 'warning', showCancelButton: true });
    if (res.isConfirmed) await deleteDoc(doc(db, 'invitados', id));
  };

  const agregarInvitado = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'invitados'), {
        ...formData,
        fechaCreacion: serverTimestamp(),
        lote: `${userData.manzana}-${userData.lote}`,
        invitador: userData.nombre,
        registradoPor: userData.uid || userData.id,
        barrioId: userData.barrioId,
        ingresado: false
      });
      setState(prev => ({ ...prev, formData: { nombre: '', dni: '', patente: '', email: '', telefono: '' } }));
      Swal.fire('Agregado', '', 'success');
    } catch (err) { Swal.fire('Error', 'No se pudo guardar', 'error'); }
  };

  const manejarLista = {
    abrirNueva: () => setState(prev => ({
          ...prev, 
          isEditingList: false, 
          // Solo reseteamos el nombre, pero MANTENEMOS los invitados que ya clickeaste
          nuevaLista: { 
            nombre: `Evento ${new Date().toLocaleDateString()}`,
            barrioId: userData.barrioId, 
            invitados: prev.nuevaLista.invitados 
          },
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
      const data = {
        nombre: nuevaLista.nombre, invitados: invitadosLimpios,
        registradoPor: userData.uid || userData.id,
        barrioId: userData.barrioId,
        lote: `${userData.manzana}-${userData.lote}`,
        ultimaModificacion: serverTimestamp()
      };
      try {
        if (isEditingList) await updateDoc(doc(db, 'listasInvitados', editingListId), data);
        else await addDoc(collection(db, 'listasInvitados'), data);
        setState(prev => ({ ...prev, showListModal: false }));
        Swal.fire('Guardado', '', 'success');
      } catch (err) { Swal.fire('Error', 'Error al guardar lista', 'error'); }
    },
    eliminar: async (id) => {
      const res = await Swal.fire({ title: '¿Borrar lista?', icon: 'warning', showCancelButton: true });
      if (res.isConfirmed) await deleteDoc(doc(db, 'listasInvitados', id));
    }
  };

  const invitadosVisibles = verTodosLosInvitados ? invitados : invitados.slice(0, 5);

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;

  const agregarAListaTemporal = (invitado) => {
  // Verificamos si ya está para no repetir
  const existe = state.nuevaLista.invitados.some(i => i.dni === invitado.dni);
  
  if (existe) {
    return Swal.fire({
      icon: 'info',
      title: 'Ya está en la lista',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    });
  }

  // ACTUALIZACIÓN CLAVE: Agregamos el invitado Y abrimos el modal al mismo tiempo
  setState(prev => ({
    ...prev,
    showListModal: true, // Esto hace que el modal aparezca al tocar el botón
    nuevaLista: {
      ...prev.nuevaLista,
      invitados: [...(prev.nuevaLista.invitados || []), invitado]
    }
  }));

  // Aviso de éxito
  Swal.fire({
    icon: 'success',
    title: `Agregado: ${invitado.nombre}`,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000
  });
};

  return (
    <div className="container mt-4 pb-5">
      
      {/* 1. SECCIÓN LINK ACTUALIZADA */}
<Card className="mb-4 border-0 shadow-sm">
  <Card.Body className="text-center py-4">
    <h5 className="mb-3 fw-bold">Solicitar datos al invitado</h5>
    
    {/* Construimos la URL base con todos los parámetros necesarios */}
    {(() => {
      const baseUrl = `${window.location.origin}/pages/invitacion.html`;
      const params = new URLSearchParams({
        barrioId: userData?.barrioId || '', // Fundamental para la estética
        invitador: userData?.nombre || '',
        lote: userData?.lote || '',
        telefono: userData?.telefono || '' // Para que el invitado le responda al dueño
      }).toString();
      
      const fullLink = `${baseUrl}?${params}`;

      return (
        <div className="d-flex justify-content-center gap-3">
          <Button 
            variant="outline-primary" 
            onClick={() => {
              navigator.clipboard.writeText(fullLink);
              Swal.fire({
                title: '¡Enlace Copiado!',
                text: 'Ya podés pegarlo en cualquier chat.',
                icon: 'success',
                confirmButtonColor: userData?.colorPrincipal || '#308CA4'
              });
            }}
          >
            <FaCopy className="me-2"/>Copiar Link
          </Button>

          <Button 
            variant="success" 
            onClick={() => {
              const mensajeWA = encodeURIComponent(`¡Hola! 👋 Para agilizar tu ingreso, por favor registrate en este link: ${fullLink}`);
              window.open(`https://wa.me/?text=${mensajeWA}`);
            }}
          >
            <FaWhatsapp className="me-2"/>WhatsApp
          </Button>
        </div>
      );
    })()}
  </Card.Body>
</Card>

      {/* 2. FORMULARIO DE CARGA */}
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

      {/* 3. TABLA INVITADOS INDIVIDUALES (Máximo 5) */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0">Invitados Frecuentes</h5>
          <Button variant="info" size="sm" onClick={manejarLista.abrirNueva}><FaList className="me-2"/>Crear Lista</Button>
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
                    const url = await QRCode.toDataURL(JSON.stringify(inv));
                    setState(prev => ({ ...prev, currentQR: inv, qrImageUrl: url, showQRModal: true }));
                  }}><FaQrcode size={18}/></Button>
                  {/* Reemplaza esta fila en tu tabla */}
                    <Button 
                    variant="link" 
                    className="text-info p-1 me-2" 
                    title="Añadir a lista" 
                    onClick={() => agregarAListaTemporal(inv)} // <--- Ahora sí abre el modal y suma
                  >
                    <FaPlusCircle size={18}/>
                  </Button>
                  <Button variant="link" className="text-danger p-1" onClick={() => eliminarInvitado(inv.id)}><FaTrash size={18}/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {invitados.length > 5 && (
          <div className="text-center py-2 bg-light">
            <Button variant="link" size="sm" onClick={() => setState(prev => ({ ...prev, verTodosLosInvitados: !verTodosLosInvitados }))}>
              {verTodosLosInvitados ? "Ver menos" : `Mostrar ${invitados.length - 5} más...`}
            </Button>
          </div>
        )}
      </Card>

      {/* 4. LISTAS DE EVENTOS (Restaurado) */}
      <h5 className="mb-3">Listas de Eventos Guardadas</h5>
      <Row className="g-3">
        {listas.map(lista => (
          <Col md={6} key={lista.id}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">{lista.nombre}</h6>
                  <small className="text-muted">{lista.invitados.length} invitados</small>
                </div>
                <div className="btn-group">
                  <Button variant="light" onClick={() => {
                    const msg = `*LISTA:* ${lista.nombre}\n` + lista.invitados.map(i => `- ${i.nombre} (DNI: ${i.dni})`).join('\n');
                    window.open(`https://wa.me/5491149924327?text=${encodeURIComponent(msg)}`);
                  }}><FaWhatsapp className="text-success"/></Button>
                  <Button variant="light" onClick={() => manejarLista.editar(lista)}><FaEdit className="text-primary"/></Button>
                  <Button variant="light" onClick={() => manejarLista.eliminar(lista.id)}><FaTrash className="text-danger"/></Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* MODALES (Lista y QR) */}
      <Modal show={showListModal} onHide={() => setState(prev => ({ ...prev, showListModal: false }))}>
        <Modal.Header closeButton><Modal.Title>{isEditingList ? 'Editar' : 'Nueva'} Lista</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Control className="mb-3" value={nuevaLista.nombre} onChange={e => setState(prev => ({ ...prev, nuevaLista: { ...prev.nuevaLista, nombre: e.target.value } }))} />
          <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {nuevaLista.invitados.map((inv, i) => (
              <div key={i} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                <span>{inv.nombre}</span>
                <FaUserMinus className="text-danger" style={{ cursor: 'pointer' }} onClick={() => {
                   const filtrados = nuevaLista.invitados.filter((_, idx) => idx !== i);
                   setState(prev => ({ ...prev, nuevaLista: { ...prev.nuevaLista, invitados: filtrados } }));
                }}/>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer><Button variant="primary" className="w-100" onClick={manejarLista.guardar}>Guardar Lista</Button></Modal.Footer>
      </Modal>

      <Modal show={showQRModal} onHide={() => setState(prev => ({ ...prev, showQRModal: false }))} centered size="sm">
        <Modal.Body className="text-center p-4">
          <img src={qrImageUrl} alt="QR" className="img-fluid mb-3" />
          <h6>{currentQR?.nombre}</h6>
          <Button variant="primary" size="sm" className="w-100 mt-2" onClick={() => Swal.fire('Email enviado', '', 'success')}>Enviar por Email</Button>
        </Modal.Body>
      </Modal>

    </div>
  );
};