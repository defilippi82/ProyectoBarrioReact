import React, { useState, useEffect, useContext } from 'react';
import { 
    collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp, updateDoc 
} from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import { UserContext } from '../Services/UserContext';
import { Button, Tabs, Tab, Row, Col, Container, Badge, InputGroup, Form, Modal } from 'react-bootstrap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { 
    FaTrashAlt, FaPhoneAlt, FaClock, FaBullhorn, FaSearch, 
    FaMapMarkerAlt, FaUserCircle, FaFilter, FaPlus, FaTag, FaStar 
} from 'react-icons/fa';
import '../css/Novedades.css';

const MySwal = withReactContent(Swal);

const postItPalettes = [
    { bg: '#fffdf2', border: '#fcc419', titleColor: '#856404' }, 
    { bg: '#f0f7ff', border: '#2196f3', titleColor: '#004a99' }, 
    { bg: '#f2fcfb', border: '#38b2ac', titleColor: '#00695c' }, 
    { bg: '#fff8f8', border: '#ff6b6b', titleColor: '#a52a2a' }, 
    { bg: '#fbf7fd', border: '#9c27b0', titleColor: '#4a148c' }, 
    { bg: '#f7fdf2', border: '#8bc34a', titleColor: '#33691e' }
];

export const Novedades = () => {
    const { userData } = useContext(UserContext);
    const [novedades, setNovedades] = useState([]);
    const [telefonosUtiles, setTelefonosUtiles] = useState([]);
    const [campanasActivas, setCampanasActivas] = useState([]);
    const [key, setKey] = useState('novedades');
    
    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');

    // Modales
    const [showModalNov, setShowModalNov] = useState(false);
    const [showModalTel, setShowModalTel] = useState(false);
    const [isNuevaCat, setIsNuevaCat] = useState(false);
    
    // Formularios
    const [nuevaNov, setNuevaNov] = useState({ titulo: '', contenido: '' });
    const [nuevoTel, setNuevoTel] = useState({ nombre: '', telefono: '', categoria: '' });

    useEffect(() => {
        if (!userData) return;

        // Escucha Campañas (Alertas Admin)
        const unsubCampanas = onSnapshot(query(collection(db, 'campanas'), orderBy('timestamp', 'desc')), (snapshot) => {
            const filtradas = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(c => (c.islasDestino?.includes(userData.isla)) || (c.manzanasDestino?.includes(userData.manzana)));
            setCampanasActivas(filtradas);
        });

        // Escucha Novedades (Post-its)
        const unsubNovedades = onSnapshot(query(collection(db, 'novedades'), orderBy('createdAt', 'desc')), (snapshot) => {
            setNovedades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Escucha Teléfonos (Guía)
        const unsubTels = onSnapshot(query(collection(db, 'telefonosUtiles')), (snapshot) => {
            setTelefonosUtiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => { unsubCampanas(); unsubNovedades(); unsubTels(); };
    }, [userData]);

    const categoriasExistentes = [...new Set(telefonosUtiles.map(t => t.categoria).filter(Boolean))].sort();

    // --- LÓGICA DE RATING ---
    const handleRate = async (id, stars) => {
        if (!userData) return;
        const telRef = doc(db, 'telefonosUtiles', id);
        const tel = telefonosUtiles.find(t => t.id === id);
        const userId = `${userData.manzana}-${userData.lote}`;
        
        const ratings = tel.ratings || {};
        ratings[userId] = stars;

        const allStars = Object.values(ratings);
        const promedio = allStars.reduce((a, b) => a + b, 0) / allStars.length;

        try {
            await updateDoc(telRef, { ratings, promedioRating: promedio });
        } catch (error) { console.error("Error rating:", error); }
    };

    // --- ACCIONES FIREBASE ---
    const handleAddNovedad = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'novedades'), {
                ...nuevaNov,
                nombreAutor: userData.nombre || 'Vecino',
                manzana: userData.manzana,
                lote: userData.lote,
                autorId: `${userData.manzana}-${userData.lote}`,
                createdAt: serverTimestamp()
            });
            setShowModalNov(false);
            setNuevaNov({ titulo: '', contenido: '' });
            MySwal.fire('¡Éxito!', 'Tu anuncio está en el tablero.', 'success');
        } catch (e) { MySwal.fire('Error', 'No se pudo publicar', 'error'); }
    };

    const handleAddTelefono = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'telefonosUtiles'), {
                ...nuevoTel,
                promedioRating: 0,
                ratings: {},
                autorId: `${userData.manzana}-${userData.lote}`
            });
            setShowModalTel(false);
            setNuevoTel({ nombre: '', telefono: '', categoria: '' });
            setIsNuevaCat(false);
            MySwal.fire('¡Guardado!', 'Contacto añadido.', 'success');
        } catch (e) { MySwal.fire('Error', 'No se pudo guardar', 'error'); }
    };

    const handleDelete = async (id, col) => {
        const res = await MySwal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, borrar'
        });
        if (res.isConfirmed) await deleteDoc(doc(db, col, id));
    };

    const telefonosFiltrados = telefonosUtiles.filter(t => {
        const matchSearch = t.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = categoriaFiltro === 'Todas' || t.categoria === categoriaFiltro;
        return matchSearch && matchCat;
    });

    return (
        <Container className="py-5 mt-4 board-container">
            {/* Campañas Críticas */}
            {campanasActivas.map(c => (
                <div key={c.id} className="modern-announcement shadow-sm mb-3">
                    <div className="announcement-icon"><FaBullhorn /> Alerta de Administración</div>
                    <div className="announcement-body">
                        <h6>{c.title}</h6>
                        <p>{c.body}</p>
                    </div>
                </div>
            ))}

            <div className="text-center mb-5 board-header">
                <h1 className="display-3 main-board-title">Tablero de la Comunidad</h1>
                <p className="lead text-muted">CUBE: Escobar, Buenos Aires</p>
            </div>

            <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="custom-board-tabs mb-4 shadow-sm" fill>
                
                {/* TAB NOVEDADES */}
                <Tab eventKey="novedades" title="📢 ANUNCIOS" className='titulo-novedades'>
                    <div className="d-flex justify-content-end my-3">
                        <Button variant="primary" className="btn-add-modern shadow btn-agregar-novedad" onClick={() => setShowModalNov(true)}>
                            <FaPlus className="me-2"/> Nuevo Anuncio
                        </Button>
                    </div>
                    <Row className="g-4">
                       {novedades.map((n, index) => {
                            const palette = postItPalettes[index % postItPalettes.length];
                            const canDelete = userData?.rol?.administrador || n.autorId === `${userData?.manzana}-${userData?.lote}`;
                            
                            return (
                                <Col key={n.id} xs={12} md={6} lg={4}>
                                    <div className="post-it-card shadow-sm" style={{ backgroundColor: palette.bg, borderLeft: `8px solid ${palette.border}` }}>
                                        <div className="post-it-header">
                                            {/* Soporte para datos viejos y nuevos de manzana/lote */}
                                            <span className="post-it-tag text-muted">
                                                <FaMapMarkerAlt /> Mnz {n.manzana || 'S/D'} - Lote {n.lote || 'S/D'}
                                            </span>
                                            {canDelete && <FaTrashAlt className="delete-btn text-danger" onClick={() => handleDelete(n.id, 'novedades')} />}
                                        </div>
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <FaUserCircle size={20} className="text-secondary" />
                                            {/* Compatibilidad: busca titulo o nombre */}
                                            <h5 className="post-it-title mb-0" style={{ color: palette.titleColor }}>
                                                {n.titulo || n.nombre || "Anuncio"}
                                            </h5>
                                        </div>
                                        {/* Compatibilidad: busca contenido o descripcion */}
                                        <div className="post-it-text text-dark mb-3">
                                            {n.contenido || n.descripcion}
                                        </div>
                                        <div className="post-it-footer text-muted small mt-auto pt-2 border-top d-flex justify-content-between">
                                            <span>
                                                <FaClock className="me-1" /> 
                                                {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : 'Anterior'}
                                            </span>
                                            <span className="fw-bold">{n.nombreAutor || n.nombre || 'Vecino'}</span>
                                        </div>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                </Tab>

                {/* TAB TELÉFONOS */}
                <Tab eventKey="telefonos" title="📞 GUÍA ÚTIL">
                    <div className="d-flex justify-content-end my-3">
                        <Button variant="success" className="btn-add-modern shadow" onClick={() => setShowModalTel(true)}>
                            <FaPlus className="me-2"/> Sugerir Contacto
                        </Button>
                    </div>
                    <Row className="mb-4 g-3">
                        <Col xs={12} md={7}>
                            <InputGroup className="modern-search shadow-sm">
                                <InputGroup.Text className="bg-white"><FaSearch/></InputGroup.Text>
                                <Form.Control placeholder="Buscar jardinero, electricista..." onChange={(e) => setSearchTerm(e.target.value)} />
                            </InputGroup>
                        </Col>
                        <Col xs={12} md={5}>
                            <InputGroup className="modern-search shadow-sm">
                                <InputGroup.Text className="bg-white"><FaFilter/></InputGroup.Text>
                                <Form.Select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
                                    <option value="Todas">Todas las categorías</option>
                                    {categoriasExistentes.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </Form.Select>
                            </InputGroup>
                        </Col>
                    </Row>
                    <Row className="g-3">
                        {telefonosFiltrados.map((t) => (
                            <Col key={t.id} xs={12} md={6} lg={4}>
                                <div className="contact-card shadow-sm h-100">
                                    <div className="contact-info flex-grow-1">
                                        <Badge bg="primary" className="mb-2 badge-category">{t.categoria}</Badge>
                                        <h5 className="fw-bold text-dark mb-1">{t.nombre}</h5>
                                        <div className="mb-2 rating-display">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <FaStar 
                                                    key={s} 
                                                    size={16} 
                                                    color={ (t.promedioRating || 0) >= s ? "#ffc107" : "#e4e5e9"} 
                                                    onClick={() => handleRate(t.id, s)} 
                                                    className="star-icon"
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            ))}
                                            <small className="ms-2 fw-bold text-muted">({(t.promedioRating || 0).toFixed(1)})</small>
                                        </div>
                                        <p className="phone-number h5 fw-bold text-success mb-0">{t.telefono}</p>
                                    </div>
                                    <div className="d-flex flex-column gap-3 align-items-center">
                                        <Button variant="success" href={`tel:${t.telefono}`} className="call-btn rounded-circle shadow"><FaPhoneAlt/></Button>
                                        {(userData?.rol?.administrador || t.autorId === `${userData.manzana}-${userData.lote}`) && (
                                            <FaTrashAlt className="text-danger cursor-pointer" size={14} onClick={() => handleDelete(t.id, 'telefonosUtiles')} />
                                        )}
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Tab>
            </Tabs>

            {/* MODAL NOVEDADES */}
            <Modal show={showModalNov} onHide={() => setShowModalNov(false)} centered>
                <Modal.Header closeButton><Modal.Title className="main-board-title h3">Nuevo Anuncio</Modal.Title></Modal.Header>
                <Form onSubmit={handleAddNovedad}>
                    <Modal.Body>
                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Asunto</Form.Label><Form.Control required placeholder="Ej: Vendo Bicicleta" onChange={e => setNuevaNov({...nuevaNov, titulo: e.target.value})} /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Descripción</Form.Label><Form.Control as="textarea" rows={4} required placeholder="Escribe los detalles aquí..." onChange={e => setNuevaNov({...nuevaNov, contenido: e.target.value})} /></Form.Group>
                    </Modal.Body>
                    <Modal.Footer><Button variant="light" onClick={() => setShowModalNov(false)}>Cerrar</Button><Button variant="primary" type="submit">Publicar</Button></Modal.Footer>
                </Form>
            </Modal>

            {/* MODAL TELÉFONOS */}
            <Modal show={showModalTel} onHide={() => {setShowModalTel(false); setIsNuevaCat(false);}} centered>
                <Modal.Header closeButton><Modal.Title className="main-board-title h3">Sugerir Contacto</Modal.Title></Modal.Header>
                <Form onSubmit={handleAddTelefono}>
                    <Modal.Body>
                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Nombre o Servicio</Form.Label><Form.Control required placeholder="Ej: Pedro Gasista" onChange={e => setNuevoTel({...nuevoTel, nombre: e.target.value})} /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Teléfono</Form.Label><Form.Control required placeholder="11 2345 6789" onChange={e => setNuevoTel({...nuevoTel, telefono: e.target.value})} /></Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Categoría</Form.Label>
                            {!isNuevaCat ? (
                                <div className="d-flex gap-2">
                                    <Form.Select required onChange={e => setNuevoTel({...nuevoTel, categoria: e.target.value})}>
                                        <option value="">Seleccionar...</option>
                                        {categoriasExistentes.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </Form.Select>
                                    <Button variant="outline-primary" onClick={() => setIsNuevaCat(true)}><FaPlus /></Button>
                                </div>
                            ) : (
                                <InputGroup>
                                    <Form.Control required placeholder="Escribe el rubro" onChange={e => setNuevoTel({...nuevoTel, categoria: e.target.value})} />
                                    <Button variant="outline-secondary" onClick={() => setIsNuevaCat(false)}>Listado</Button>
                                </InputGroup>
                            )}
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer><Button variant="light" onClick={() => setShowModalTel(false)}>Cancelar</Button><Button variant="success" type="submit">Guardar</Button></Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};