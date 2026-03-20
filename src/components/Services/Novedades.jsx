import React, { useState, useEffect, useContext } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, writeBatch, updateDoc, arrayUnion, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import { UserContext } from '../Services/UserContext';
import { Card, Button, Tabs, Tab, Row, Col, Form, Container, Badge, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { FaStar, FaPlus, FaTrashAlt, FaPhoneAlt, FaChevronDown, FaChevronUp, FaSearch, FaClock } from 'react-icons/fa';
import './Novedades.css';

const MySwal = withReactContent(Swal);

const getRandomColor = () => {
    const colors = ['#FFB6C1', '#ADD8E6', '#90EE90', '#FFD700', '#FF6347'];
    return colors[Math.floor(Math.random() * colors.length)];
};

export const Novedades = () => {
    const { userData } = useContext(UserContext);
    const [novedades, setNovedades] = useState([]);
    const [telefonosUtiles, setTelefonosUtiles] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [key, setKey] = useState('novedades');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // MEJORA 3: Buscador
    const [expandedNews, setExpandedNews] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Cargar Novedades ordenadas por fecha (MEJORA 2)
            const q = query(collection(db, 'novedades'), orderBy('fecha', 'desc'));
            const novSnap = await getDocs(q);
            setNovedades(novSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Cargar Teléfonos
            const telSnap = await getDocs(collection(db, 'telefonosUtiles'));
            setTelefonosUtiles(telSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    promedioRating: data.ratings?.length ? (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) : 0,
                    totalRatings: data.ratings?.length || 0
                };
            }));

            // Cargar Categorías
            const catSnap = await getDocs(collection(db, 'categoriasTelefonos'));
            if (catSnap.empty) {
                const catsPre = ["Jardinero", "Piletero", "Plomero", "Electricista", "Sodero", "Veterinarias"];
                const batch = writeBatch(db);
                catsPre.forEach(cat => batch.set(doc(collection(db, 'categoriasTelefonos')), { nombre: cat }));
                await batch.commit();
                setCategorias(catsPre.sort());
                setCategoriaSeleccionada(catsPre[0]);
            } else {
                const catsData = catSnap.docs.map(d => d.data().nombre).sort();
                setCategorias(catsData);
                setCategoriaSeleccionada(catsData[0]);
            }
        } catch (error) { console.error("Error fetching data:", error); }
    };

    const handleAddNovedad = async () => {
        const { value } = await MySwal.fire({
            title: 'Nueva Novedad',
            html: `<textarea id="swal-novedad" class="swal2-textarea" placeholder="¿Qué quieres contar a los vecinos?"></textarea>`,
            showCancelButton: true,
            confirmButtonText: 'Publicar',
            preConfirm: () => {
                const contenido = document.getElementById('swal-novedad').value;
                if (!contenido) return MySwal.showValidationMessage('El contenido es obligatorio');
                return {
                    titulo: `Aviso de Lote ${userData.manzana}-${userData.lote}`,
                    contenido: contenido,
                    nombre: userData.nombre,
                    autorId: `${userData.manzana}-${userData.lote}`, // Para MEJORA 4
                    lote: `${userData.manzana}-${userData.lote}`,
                    color: getRandomColor(),
                    fecha: serverTimestamp() // MEJORA 2
                };
            }
        });
        if (value) { await addDoc(collection(db, 'novedades'), value); fetchData(); }
    };

    const handleAddTelefono = async () => {
        const { value } = await MySwal.fire({
            title: 'Agregar Contacto',
            html: `
                <select id="swal-categoria" class="swal2-input">
                    ${categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    <option value="nueva">+ Nueva Categoría</option>
                </select>
                <input id="swal-nueva-cat" class="swal2-input" placeholder="Nombre categoría" style="display:none">
                <input id="swal-nombre" class="swal2-input" placeholder="Nombre">
                <input id="swal-tel" class="swal2-input" placeholder="Teléfono">
            `,
            didOpen: () => {
                const sel = document.getElementById('swal-categoria');
                const nCat = document.getElementById('swal-nueva-cat');
                sel.onchange = () => nCat.style.display = sel.value === 'nueva' ? 'block' : 'none';
            },
            preConfirm: async () => {
                const catSel = document.getElementById('swal-categoria').value;
                const nombre = document.getElementById('swal-nombre').value;
                const tel = document.getElementById('swal-tel').value;
                let catFinal = catSel;
                if (catSel === 'nueva') {
                    catFinal = document.getElementById('swal-nueva-cat').value;
                    if (!catFinal) return MySwal.showValidationMessage('Nombre de categoría obligatorio');
                    await addDoc(collection(db, 'categoriasTelefonos'), { nombre: catFinal });
                }
                if (!nombre || !tel) return MySwal.showValidationMessage('Nombre y teléfono obligatorios');
                return { categoria: catFinal, nombre, telefono: tel, ratings: [], autorId: `${userData.manzana}-${userData.lote}` };
            }
        });
        if (value) { await addDoc(collection(db, 'telefonosUtiles'), value); fetchData(); }
    };

    // MEJORA 1: Confirmación de borrado
    const handleDelete = async (id, coll) => {
        const res = await MySwal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (res.isConfirmed) {
            await deleteDoc(doc(db, coll, id));
            fetchData();
            MySwal.fire('Eliminado', 'El registro ha sido borrado.', 'success');
        }
    };

    const handleRate = async (id, val) => {
        await updateDoc(doc(db, 'telefonosUtiles', id), { ratings: arrayUnion(val) });
        fetchData();
    };

    // Lógica del Buscador (MEJORA 3)
    const telefonosFiltrados = telefonosUtiles.filter(t => 
        t.categoria === categoriaSeleccionada && 
        t.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Formatear Fecha (MEJORA 2)
    const formatFecha = (ts) => {
        if (!ts) return '';
        const date = ts.toDate();
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <h2 className="fw-bold text-primary m-0">Tablero Informativo</h2>
                <div className="d-flex gap-2">
                    <Button variant="success" onClick={handleAddNovedad}><FaPlus/> Novedad</Button>
                    <Button variant="outline-success" onClick={handleAddTelefono}><FaPlus/> Contacto</Button>
                </div>
            </div>

            <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-4 custom-tabs" fill>
                <Tab eventKey="novedades" title="NOTICIAS">
                    <Row className="g-3 mt-2">
                        {novedades.map((item) => {
                            // MEJORA 4: Solo admin o el autor pueden borrar
                            const canDelete = userData?.rol === 'admin' || item.autorId === `${userData?.manzana}-${userData?.lote}`;
                            
                            return (
                                <Col xs={12} md={6} lg={4} key={item.id}>
                                    <Card className="h-100 border-0 shadow-sm" style={{ borderTop: `5px solid ${item.color || '#0d6efd'}` }}>
                                        <Card.Body className="d-flex flex-column">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <Badge bg="light" className="text-dark border">Lote {item.lote}</Badge>
                                                {canDelete && <FaTrashAlt className="text-danger cursor-pointer" onClick={() => handleDelete(item.id, 'novedades')} />}
                                            </div>
                                            <Card.Title className="fw-bold small text-muted mb-1">{item.nombre}</Card.Title>
                                            <small className="text-muted mb-2 d-flex align-items-center gap-1" style={{fontSize: '0.75rem'}}>
                                                <FaClock size={12}/> {formatFecha(item.fecha)}
                                            </small>
                                            <div className={`news-text flex-grow-1 ${!expandedNews[item.id] ? "clamp-active" : ""}`}>
                                                {item.contenido}
                                            </div>
                                            {item.contenido?.length > 120 && (
                                                <Button variant="link" size="sm" className="p-0 mt-2 text-start text-decoration-none" onClick={() => setExpandedNews({...expandedNews, [item.id]: !expandedNews[item.id]})}>
                                                    {expandedNews[item.id] ? <><FaChevronUp/> Ver menos</> : <><FaChevronDown/> Leer más</>}
                                                </Button>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </Tab>

                <Tab eventKey="telefonos" title="TELÉFONOS">
                    <Row className="mb-4 g-2">
                        <Col sm={6}>
                            <Form.Select className="shadow-sm h-100" value={categoriaSeleccionada} onChange={(e) => setCategoriaSeleccionada(e.target.value)}>
                                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                            </Form.Select>
                        </Col>
                        <Col sm={6}>
                            <InputGroup className="shadow-sm">
                                <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted"/></InputGroup.Text>
                                <Form.Control 
                                    className="border-start-0" 
                                    placeholder="Buscar por nombre..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>
                    
                    <Row className="g-2">
                        {telefonosFiltrados.map((t) => {
                            const canDeleteTel = userData?.rol === 'admin' || t.autorId === `${userData?.manzana}-${userData?.lote}`;
                            return (
                                <Col xs={12} md={6} key={t.id}>
                                    <Card className="border-0 shadow-sm">
                                        <Card.Body className="d-flex justify-content-between align-items-center p-3">
                                            <div>
                                                <h6 className="fw-bold mb-1">{t.nombre}</h6>
                                                <div className="mb-2">
                                                    {[1,2,3,4,5].map(s => <FaStar key={s} size={14} color={t.promedioRating >= s ? "gold" : "#ddd"} onClick={() => handleRate(t.id, s)} style={{cursor:'pointer'}} />)}
                                                    <small className="ms-2 text-muted">{t.promedioRating.toFixed(1)}</small>
                                                </div>
                                                <div className="text-success fw-bold small"><FaPhoneAlt/> {t.telefono}</div>
                                            </div>
                                            <div className="d-flex flex-column gap-2 align-items-center">
                                                <Button variant="success" href={`tel:${t.telefono}`} className="rounded-circle p-2 shadow-sm"><FaPhoneAlt/></Button>
                                                {canDeleteTel && <FaTrashAlt className="text-danger cursor-pointer mt-1" onClick={() => handleDelete(t.id, 'telefonosUtiles')} />}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </Tab>
            </Tabs>
        </Container>
    );
};