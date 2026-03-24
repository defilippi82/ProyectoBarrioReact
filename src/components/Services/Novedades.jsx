import React, { useState, useEffect, useContext } from 'react';
import { 
    collection, 
    deleteDoc, 
    doc, 
    query, 
    orderBy, 
    onSnapshot 
} from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import { UserContext } from '../Services/UserContext';
import { Card, Button, Tabs, Tab, Row, Col, Container, Badge, Alert, InputGroup, Form } from 'react-bootstrap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { FaTrashAlt, FaPhoneAlt, FaClock, FaBullhorn, FaSearch, FaMapMarkerAlt, FaUserCircle } from 'react-icons/fa';
import './Novedades.css'; // Asegúrate de usar el CSS actualizado que te pasé antes

const MySwal = withReactContent(Swal);

// --- SOLUCIÓN DE COLORES: Paleta que asegura contraste total entre fondo y título ---
// Cada objeto define el fondo (bg), el color del borde (border) y el color del título (titleColor).
const postItPalettes = [
    { bg: '#fff9db', border: '#fcc419', titleColor: '#856404' }, // Amarillo Pastel
    { bg: '#e3f2fd', border: '#2196f3', titleColor: '#004a99' }, // Azul Pastel -> Título Azul Oscuro
    { bg: '#e6fffa', border: '#38b2ac', titleColor: '#00695c' }, // Menta Pastel
    { bg: '#fff5f5', border: '#ff6b6b', titleColor: '#a52a2a' }, // Rojizo Pastel
    { bg: '#f3e5f5', border: '#9c27b0', titleColor: '#4a148c' }, // Violeta Pastel
    { bg: '#f1f8e9', border: '#8bc34a', titleColor: '#33691e' }  // Verde Pastel
];

export const Novedades = () => {
    const { userData } = useContext(UserContext);
    const [novedades, setNovedades] = useState([]);
    const [telefonosUtiles, setTelefonosUtiles] = useState([]);
    const [campanasActivas, setCampanasActivas] = useState([]);
    const [key, setKey] = useState('novedades');
    const [searchTerm, setSearchTerm] = useState('');

    // Escuchar datos en tiempo real (Costo Cero)
    useEffect(() => {
        if (!userData) return;

        // 1. Campañas (Alertas urgentes)
        const qCampanas = query(collection(db, 'campanas'), orderBy('timestamp', 'desc'));
        const unsubCampanas = onSnapshot(qCampanas, (snapshot) => {
            const filtradas = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(c => 
                    (c.islasDestino?.includes(userData.isla)) || 
                    (c.manzanasDestino?.includes(userData.manzana))
                );
            setCampanasActivas(filtradas);
        });

        // 2. Novedades (Tablero de Vecinos)
        const qNovedades = query(collection(db, 'novedades')); 
        const unsubNovedades = onSnapshot(qNovedades, (snapshot) => {
            const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNovedades(lista.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        });

        // 3. Teléfonos
        const qTels = query(collection(db, 'telefonosUtiles'));
        const unsubTels = onSnapshot(qTels, (snapshot) => {
            setTelefonosUtiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => { unsubCampanas(); unsubNovedades(); unsubTels(); };
    }, [userData]);

    const handleDelete = async (id, col) => {
        const result = await MySwal.fire({
            title: '¿Quitar anuncio?',
            text: "Se borrará del tablero de todos los vecinos.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, borrar'
        });
        if (result.isConfirmed) {
            await deleteDoc(doc(db, col, id));
        }
    };

    return (
        <Container className="py-5 mt-4 board-container">
            {/* --- SECCIÓN DE COMUNICADOS CRÍTICOS (SIN CAMBIOS) --- */}
            {campanasActivas.length > 0 && (
                <div className="board-urgent-section mb-5">
                    {campanasActivas.map(c => (
                        <div key={c.id} className="modern-announcement shadow-sm">
                            <div className="announcement-icon"><FaBullhorn /></div>
                            <div className="announcement-body">
                                <h6>{c.title}</h6>
                                <p>{c.body}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- TÍTULO CENTRAL Y "DIVERTIDO" (Patrick Hand Font) --- */}
            <div className="text-center mb-5 board-header">
                <h1 className="display-4 fw-bold main-board-title">Tablero de la Comunidad</h1>
                <p className="lead text-muted">¿Qué está pasando en CUBE hoy?</p>
            </div>

            <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="custom-board-tabs mb-4 shadow-sm" fill>
                <Tab eventKey="novedades" title="📢 ANUNCIOS DE VECINOS">
                    <Row className="g-4 mt-2">
                        {novedades.map((n, index) => {
                            const canDelete = userData?.rol?.administrador || n.autorId === `${userData?.manzana}-${userData?.lote}`;
                            // Selección dinámica de paleta según el índice
                            const palette = postItPalettes[index % postItPalettes.length];

                            return (
                                <Col key={n.id} xs={12} md={6} lg={4}>
                                    {/* --- Post-it con color aleatorio y SIN CORTE DE TEXTO --- */}
                                    <div className="post-it-card shadow-sm" style={{ backgroundColor: palette.bg, borderLeft: `8px solid ${palette.border}` }}>
                                        <div className="post-it-header">
                                            <span className="post-it-tag text-muted"><FaMapMarkerAlt /> Mnz {n.manzana || 'S/D'}</span>
                                            {canDelete && <FaTrashAlt className="delete-btn text-danger" onClick={() => handleDelete(n.id, 'novedades')} />}
                                        </div>
                                        
                                        <div className="d-flex align-items-center gap-2 mb-3 post-it-author">
                                            <FaUserCircle size={22} className="text-secondary" />
                                            {/* SOLUCIÓN: El color del título ahora es específico para contrastar con el fondo */}
                                            <h5 className="post-it-title mb-0" style={{ color: palette.titleColor }}>
                                                {n.nombre || n.titulo || 'Vecino'}
                                            </h5>
                                        </div>
                                        
                                        {/* El texto ahora ocupa todo el espacio necesario */}
                                        <div className="post-it-text text-dark mb-3">
                                            {n.contenido || n.descripcion}
                                        </div>
                                        
                                        <div className="post-it-footer text-muted small mt-auto pt-2 border-top">
                                            <FaClock className="me-1" /> {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : 'Reciente'}
                                        </div>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                </Tab>

                <Tab eventKey="telefonos" title="📞 TELÉFONOS ÚTILES">
                    <div className="search-container mb-4 mt-3">
                        <InputGroup className="modern-search shadow-sm lg">
                            <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted"/></InputGroup.Text>
                            <Form.Control 
                                size="lg"
                                className="border-start-0"
                                placeholder="Buscar Jardinero, Electricista, Guardia..." 
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>
                    <Row className="g-3">
                        {telefonosUtiles.filter(t => 
                            t.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((t) => (
                            <Col key={t.id} xs={12} md={6} lg={4}>
                                {/* --- Tarjeta de Contacto con letra grande --- */}
                                <div className="contact-card shadow-sm h-100">
                                    <div className="contact-info">
                                        {t.categoria && <Badge bg="light" className="text-muted border mb-2 text-uppercase fw-bold" style={{fontSize: '11px'}}>{t.categoria}</Badge>}
                                        <h5 className="fw-bold text-dark mb-1 contact-name">{t.nombre}</h5>
                                        <p className="phone-number h5 fw-bold text-success mb-0">{t.telefono}</p>
                                    </div>
                                    <Button variant="success" href={`tel:${t.telefono}`} className="call-btn rounded-circle shadow">
                                        <FaPhoneAlt size={18} />
                                    </Button>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Tab>
            </Tabs>
        </Container>
    );
};