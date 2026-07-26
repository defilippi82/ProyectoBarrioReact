import React, { useState, useEffect, useContext } from 'react';
import { Container, Form, Button, Row, Col, Card, Spinner } from 'react-bootstrap';
import { FaPaperPlane, FaUsersCog, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';
import { UserContext } from '../Services/UserContext';

export const Contacto = () => {
  const { userData } = useContext(UserContext);
  const etiquetas = userData?.etiquetas || { bloque: 'Manzana', unidad: 'Lote' };

  const [formData, setFormData] = useState({
    nombre: userData?.nombre || '',
    lote: `${userData?.manzana || ''}-${userData?.lote || ''}`,
    consulta: '',
    destino: '' // Acá se va a guardar el "departamento" (el ID que busca en usuarios)
  });
  
  const [destinos, setDestinos] = useState([]);
  const [contactoInfo, setContactoInfo] = useState({ email: '', numerotelefono: '' });
  const [loading, setLoading] = useState(true);
  const [metodosContacto, setMetodosContacto] = useState({ whatsapp: false, correo: false });

  // 1. CARGA DINÁMICA DE CONTACTOS DESDE EL BARRIO
  useEffect(() => {
    if (!userData?.barrioId) return;

    const fetchConfig = async () => {
      try {
        // Buscamos el documento del barrio directamente por su ID
        const docRef = doc(db, 'configuracionBarrios', userData.barrioId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const config = docSnap.data();
          // Traemos "contactos", filtramos solo los activos
          const contactosActivos = (config.contactos || []).filter(c => c.activo === true);
          setDestinos(contactosActivos);
        }
      } catch (error) {
        console.error("Error al cargar contactos del barrio:", error);
      }
      setLoading(false);
    };
    fetchConfig();
  }, [userData?.barrioId]);

  // 2. BÚSQUEDA DEL USUARIO QUE RECIBE LA CONSULTA
  const fetchContacto = async (departamentoSeleccionado) => {
    if (!userData?.barrioId || !departamentoSeleccionado) return;
    try {
      // Busca en la colección de usuarios al que tenga ese "departamento" (antes idPublico)
      const q = query(
        collection(db, 'usuarios'), 
        where('departamento', '==', departamentoSeleccionado),
        where("barrioId", "==", userData.barrioId)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const d = snap.docs[0].data();
        setContactoInfo({ email: d.email || '', numerotelefono: d.numerotelefono || '' });
        setMetodosContacto({ whatsapp: !!d.numerotelefono, correo: !!d.email });
      } else {
        // Si no encuentra el usuario, resetea
        setContactoInfo({ email: '', numerotelefono: '' });
        setMetodosContacto({ whatsapp: false, correo: false });
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  useEffect(() => {
    if (formData.destino) fetchContacto(formData.destino);
  }, [formData.destino]);

  // 3. ENVÍO DEL MENSAJE
  const handleSubmit = (e) => {
    e.preventDefault();
    const { nombre, lote, consulta, destino } = formData;
    
    // Buscamos el nombre lindo (Ej: "Obras") usando el departamento
    const destinoLabel = destinos.find(d => d.departamento === destino)?.nombre || 'Departamento';

    const mensaje = `*Consulta - ${userData?.nombreBarrio || 'Comunidad'}*\n\n` +
                    `👤 *Nombre:* ${nombre}\n` +
                    `🏡 *${etiquetas.bloque}-${etiquetas.unidad}:* ${lote}\n` +
                    `🏢 *Sector:* ${destinoLabel}\n` +
                    `💬 *Consulta:* ${consulta}`;

    if (metodosContacto.whatsapp && contactoInfo.numerotelefono) {
      window.open(`https://api.whatsapp.com/send?phone=${contactoInfo.numerotelefono.replace(/\D/g, '')}&text=${encodeURIComponent(mensaje)}`, '_blank');
    } else if (metodosContacto.correo && contactoInfo.email) {
      window.location.href = `mailto:${contactoInfo.email}?subject=Consulta de ${nombre}&body=${encodeURIComponent(mensaje.replace(/\*/g, ''))}`;
    }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>;

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} lg={7}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-success text-white py-4 text-center">
              <FaUsersCog size={40} className="mb-2" />
              <h3>Contacto</h3>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Col>
                    <Form.Label className="small fw-bold text-muted">NOMBRE</Form.Label>
                    <Form.Control value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required />
                  </Col>
                  <Col>
                    <Form.Label className="small fw-bold text-muted">{etiquetas.bloque}/{etiquetas.unidad}</Form.Label>
                    <Form.Control value={formData.lote} onChange={e => setFormData({...formData, lote: e.target.value})} required />
                  </Col>
                </Row>
                
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-muted">DEPARTAMENTO</Form.Label>
                  <Form.Select value={formData.destino} onChange={e => setFormData({...formData, destino: e.target.value})} required>
                    <option value="">Seleccione...</option>
                    {/* Renderizamos mapeando el array 'contactos' que trajimos del GodPanel */}
                    {destinos.map(d => (
                      <option key={d.id} value={d.departamento}>{d.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-muted">TU CONSULTA</Form.Label>
                  <Form.Control as="textarea" rows={4} value={formData.consulta} onChange={e => setFormData({...formData, consulta: e.target.value})} required />
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Form.Check 
                    type="switch" 
                    label={<><FaWhatsapp className="text-success me-1"/> WhatsApp</>}
                    checked={metodosContacto.whatsapp}
                    disabled={!contactoInfo.numerotelefono}
                    onChange={(e) => setMetodosContacto({...metodosContacto, whatsapp: e.target.checked})}
                  />
                  <Form.Check 
                    type="switch" 
                    label={<><FaEnvelope className="text-primary me-1"/> Correo</>}
                    checked={metodosContacto.correo}
                    disabled={!contactoInfo.email}
                    onChange={(e) => setMetodosContacto({...metodosContacto, correo: e.target.checked})}
                  />
                </div>

                <Button 
                  variant="success" 
                  type="submit" 
                  className="w-100 py-2 fw-bold"
                  disabled={!metodosContacto.whatsapp && !metodosContacto.correo}
                >
                  <FaPaperPlane className="me-2" /> Enviar Consulta
                </Button>
                
                {(!metodosContacto.whatsapp && !metodosContacto.correo && formData.destino) && (
                  <div className="text-danger text-center small mt-2">
                    Este departamento no tiene datos de contacto configurados.
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};