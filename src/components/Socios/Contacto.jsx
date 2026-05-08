import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Card, Spinner } from 'react-bootstrap';
import { FaPaperPlane, FaUser, FaHome, FaCommentAlt, FaUsersCog, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';
import Swal from 'sweetalert2';

export const Contacto = () => {
  // 1. ESTADOS
  const [barrioId, setBarrioId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    lote: '',
    consulta: '',
    destino: 'AtencionAlPropietario' // Valor inicial que coincide con tu idPublico en DB
  });
  
  const [contacto, setContacto] = useState({ email: '', numerotelefono: '' });
  const [loading, setLoading] = useState(false);
  const [metodosContacto, setMetodosContacto] = useState({ whatsapp: false, correo: false });

  // 2. DESTINOS (IMPORTANTE: El 'value' debe ser idPublico de Firestore)
  const destinos = [
    { value: 'AtencionAlPropietario', label: '📂 Administración' },
    { value: 'Facturacion', label: '💳 Facturación' },
    { value: 'ControlDeObras', label: '🏗️ Control de Obras' }
  ];

 // 3. CARGA INICIAL DEL BARRIO (Mejorada para diagnóstico)
  useEffect(() => {
    const data = localStorage.getItem('userData');
    console.log("Contenido de localStorage.userData:", data); // Ver qué hay realmente

    if (data) {
      try {
        const storedUserData = JSON.parse(data);
        if (storedUserData && storedUserData.barrioId) {
          const idNormalizado = String(storedUserData.barrioId).toLowerCase().trim();
          setBarrioId(idNormalizado);
        } else {
          console.error("❌ El objeto 'userData' existe pero NO tiene la propiedad 'barrioId'");
        }
      } catch (e) {
        console.error("❌ Error al parsear el JSON de localStorage:", e);
      }
    } else {
      console.error("❌ No existe la clave 'user' en localStorage. El usuario no está logueado correctamente.");
    }
  }, []);

  // 4. FUNCIÓN DE BÚSQUEDA EN FIRESTORE
  const fetchContacto = async (idPublicoSeleccionado) => {
    if (!barrioId) return;

    setLoading(true);
    try {
      console.log(`🔍 Buscando en 'usuarios' donde idPublico == '${idPublicoSeleccionado}' y barrioId == '${barrioId}'`);
      
      const q = query(
        collection(db, 'usuarios'), 
        where('idPublico', '==', idPublicoSeleccionado),
        where("barrioId", "==", barrioId) 
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docEncontrado = querySnapshot.docs[0].data();
        console.log("✅ Datos encontrados:", docEncontrado);

        setContacto({ 
          email: docEncontrado.email || '', 
          numerotelefono: docEncontrado.numerotelefono || '' 
        });

        // Auto-activar métodos si existen los datos
        setMetodosContacto({
          whatsapp: !!docEncontrado.numerotelefono,
          correo: !!docEncontrado.email
        });

      } else {
        console.warn("⚠️ No se encontró ningún documento coincidente en Firestore.");
        setContacto({ email: '', numerotelefono: '' });
        setMetodosContacto({ whatsapp: false, correo: false });
      }
    } catch (err) {
      console.error("❌ Error de Firebase:", err);
      // Si ves un error de "index" aquí, haz clic en el link que te da la consola
    } finally {
      setLoading(false);
    }
  };

  // 5. DISPARADOR DE BÚSQUEDA
  useEffect(() => {
    if (barrioId && formData.destino) {
      fetchContacto(formData.destino);
    }
  }, [formData.destino, barrioId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    Swal.fire('Enviado', 'Tu consulta ha sido recibida.', 'success');
  };
  // 6. LÓGICA DE ENVÍO
  const handleSubmit = (e) => {
    e.preventDefault();

    const { nombre, lote, consulta, destino } = formData;
    const { email, numerotelefono } = contacto;

    // Obtener el label del destino para el cuerpo del mensaje
    const destinoLabel = destinos.find(d => d.value === destino)?.label || destino;

    // Construcción del mensaje base
    const mensajeBase = `*Nueva Consulta - Barrio Cube*\n\n` +
                        `👤 *Nombre:* ${nombre}\n` +
                        `🏡 *Lote/Unidad:* ${lote}\n` +
                        `🏢 *Sector:* ${destinoLabel}\n` +
                        `💬 *Consulta:* ${consulta}`;

    // A. LÓGICA WHATSAPP
    if (metodosContacto.whatsapp && numerotelefono) {
      // Limpiamos el número por si tiene espacios o caracteres raros
      const phoneClean = numerotelefono.replace(/\D/g, '');
      const waUrl = `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(mensajeBase)}`;
      window.open(waUrl, '_blank');
    }

    // B. LÓGICA CORREO (mailto)
    if (metodosContacto.correo && email) {
      const subject = `Consulta de ${nombre} - Lote ${lote}`;
      // Usamos %0D%0A para saltos de línea en mailto
      const bodyEmail = mensajeBase.replace(/\*/g, ''); // Quitamos los asteriscos de negrita de WhatsApp
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyEmail)}`;
      
      // Abrimos el correo (usamos un timeout pequeño por si se disparan ambos)
      setTimeout(() => {
        window.location.href = mailtoUrl;
      }, 500);
    }

    Swal.fire({
      title: '¡Procesado!',
      text: 'Se han abierto las aplicaciones de contacto seleccionadas.',
      icon: 'success',
      confirmButtonColor: '#198754'
    });
  };
// Agregá esto antes del return para ver la verdad en la consola
console.log("VALORES ACTUALES - Barrio:", barrioId, "| Destino:", formData.destino);
  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} lg={7}>
          <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
            <Card.Header className="bg-success text-white text-center py-4">
              <FaUsersCog size={40} className="mb-2" />
              <h3 className="fw-bold mb-0">Centro de Contacto</h3>
            </Card.Header>

            <Card.Body className="p-4 bg-white">
              <Form onSubmit={handleSubmit}>
                
                <Row className="g-3 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">NOMBRE</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        required 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">LOTE / UNIDAD</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={formData.lote}
                        onChange={(e) => setFormData({...formData, lote: e.target.value})}
                        required 
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">DEPARTAMENTO DESTINO</Form.Label>
                  <Form.Select 
                    className="form-select-lg"
                    value={formData.destino}
                    onChange={(e) => setFormData({...formData, destino: e.target.value})}
                  >
                    {destinos.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-muted">MENSAJE</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={4}
                    value={formData.consulta}
                    onChange={(e) => setFormData({...formData, consulta: e.target.value})}
                    required
                  />
                </Form.Group>

                <Card className="bg-light border-0 mb-4">
                  <Card.Body className="py-3">
                    <div className="d-flex justify-content-around align-items-center">
                      <Form.Check 
                        type="switch"
                        id="ws-switch"
                        label={<span><FaWhatsapp className="text-success me-1"/> WhatsApp</span>}
                        disabled={!contacto.numerotelefono || loading}
                        checked={metodosContacto.whatsapp}
                        onChange={(e) => setMetodosContacto({...metodosContacto, whatsapp: e.target.checked})}
                      />
                      <Form.Check 
                        type="switch"
                        id="mail-switch"
                        label={<span><FaEnvelope className="text-primary me-1"/> Correo</span>}
                        disabled={!contacto.email || loading}
                        checked={metodosContacto.correo}
                        onChange={(e) => setMetodosContacto({...metodosContacto, correo: e.target.checked})}
                      />
                    </div>
                  </Card.Body>
                </Card>

                {(!contacto.numerotelefono && !contacto.email && !loading) && (
                  <div className="alert alert-warning py-2 text-center small">
                    ⚠️ No se encontraron canales de contacto para este sector.
                  </div>
                )}

                <Button 
                  variant="success" 
                  type="submit" 
                  size="lg" 
                  className="w-100 fw-bold shadow-sm"
                  disabled={loading || (!metodosContacto.whatsapp && !metodosContacto.correo)}
                >
                  {loading ? <Spinner size="sm" /> : <><FaPaperPlane className="me-2" /> INICIAR CONTACTO</>}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};