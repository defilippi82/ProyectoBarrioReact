import React, { useState, useEffect, useContext } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import { UserContext } from '../Services/UserContext';
import { Card, Button, Tabs, Tab, Row, Col, Form } from 'react-bootstrap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { FaStar } from 'react-icons/fa';

const MySwal = withReactContent(Swal);

const getRandomColor = () => {
    const colors = ['#FFB6C1', '#ADD8E6', '#90EE90', '#FFD700', '#FF6347'];
    return colors[Math.floor(Math.random() * colors.length)];
};

export const Novedades = () => {
    const { userData } = useContext(UserContext);
    const [novedades, setNovedades] = useState([]);
    const [telefonosUtiles, setTelefonosUtiles] = useState([]);
    const [key, setKey] = useState('novedades');
    const [rating, setRating] = useState({});
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
    const [categorias, setCategorias] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Cargar novedades
                const novedadesSnapshot = await getDocs(collection(db, 'novedades'));
                setNovedades(novedadesSnapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    color: getRandomColor(), 
                    ...doc.data() 
                })));
                
                // Cargar teléfonos útiles
                const telefonosSnapshot = await getDocs(collection(db, 'telefonosUtiles'));
                setTelefonosUtiles(telefonosSnapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data() 
                })));
                
                // Cargar categorías
                const categoriasSnapshot = await getDocs(collection(db, 'categoriasTelefonos'));
                
                if (categoriasSnapshot.empty) {
                    // Si no hay categorías, inicializar con las predeterminadas
                    const categoriasIniciales = [
                        "Jardinero", "Piletero", "Plomero", "Electricista", 
                        "Técnico informático", "Sodero", "Cable e internet", 
                        "Veterinarias", "Pozero"
                    ];
                    
                    // Guardar categorías iniciales en Firestore
                    const batch = writeBatch(db);
                    categoriasIniciales.forEach(cat => {
                        const docRef = doc(collection(db, 'categoriasTelefonos'));
                        batch.set(docRef, { nombre: cat });
                    });
                    await batch.commit();
                    
                    // Ordenar alfabéticamente y establecer estado
                    const categoriasOrdenadas = [...categoriasIniciales].sort((a, b) => a.localeCompare(b));
                    setCategorias(categoriasOrdenadas);
                    setCategoriaSeleccionada(categoriasOrdenadas[0]);
                } else {
                    // Obtener y ordenar categorías existentes
                    const categoriasFirestore = categoriasSnapshot.docs.map(doc => doc.data().nombre);
                    const categoriasOrdenadas = [...categoriasFirestore].sort((a, b) => a.localeCompare(b));
                    setCategorias(categoriasOrdenadas);
                    if (categoriasOrdenadas.length > 0) {
                        setCategoriaSeleccionada(categoriasOrdenadas[0]);
                    }
                }
            } catch (error) {
                console.error("Error al cargar datos:", error);
                MySwal.fire({
                    title: 'Error',
                    text: 'No se pudieron cargar los datos',
                    icon: 'error'
                });
            }
        };
        
        fetchData();
    }, []);

    const handleAddNovedad = async () => {
        const { value } = await MySwal.fire({
            title: 'Agregar Novedad',
            html: `<textarea id="swal-novedad" class="swal2-textarea" placeholder="Novedad"></textarea>`,
            preConfirm: () => ({
                nombre: userData.nombre,
                lote: `${userData.manzana}-${userData.lote}`,
                novedad: document.getElementById('swal-novedad').value,
                color: getRandomColor()
            })
        });

        if (value) {
            try {
                const docRef = await addDoc(collection(db, 'novedades'), value);
                setNovedades(prevNovedades => [...prevNovedades, { id: docRef.id, ...value }]);
            } catch (error) {
                console.error("Error al agregar novedad:", error);
                MySwal.fire({
                    title: 'Error',
                    text: 'No se pudo agregar la novedad',
                    icon: 'error'
                });
            }
        }
    };

    const handleAddTelefono = async () => {
        const { value } = await MySwal.fire({
            title: 'Agregar Teléfono',
            html: `
                <select id="swal-categoria" class="swal2-input">
                    ${categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    <option value="nueva">Nueva Categoría</option>
                </select>
                <input id="swal-nueva-categoria" class="swal2-input" placeholder="Nueva Categoría" style="display: none;">
                <input id="swal-nombre" class="swal2-input" placeholder="Nombre">
                <input id="swal-telefono" class="swal2-input" placeholder="Teléfono">
                <input id="swal-email" class="swal2-input" placeholder="Email">
            `,
            didOpen: () => {
                const selectCategoria = document.getElementById('swal-categoria');
                const inputNuevaCategoria = document.getElementById('swal-nueva-categoria');
                selectCategoria.addEventListener('change', (e) => {
                    inputNuevaCategoria.style.display = e.target.value === 'nueva' ? 'block' : 'none';
                });
            },
            preConfirm: async () => {
                const categoriaSelect = document.getElementById('swal-categoria').value;
                let categoriaFinal = categoriaSelect;
                
                if (categoriaSelect === 'nueva') {
                    categoriaFinal = document.getElementById('swal-nueva-categoria').value.trim();
                    if (!categoriaFinal) {
                        MySwal.showValidationMessage('Debes ingresar un nombre para la nueva categoría');
                        return false;
                    }
                    
                    if (categorias.includes(categoriaFinal)) {
                        MySwal.showValidationMessage('Esta categoría ya existe');
                        return false;
                    }
                    
                    // Guardar nueva categoría en Firestore
                    try {
                        await addDoc(collection(db, 'categoriasTelefonos'), { nombre: categoriaFinal });
                        // Actualizar y ordenar categorías
                        const nuevasCategorias = [...categorias, categoriaFinal].sort((a, b) => a.localeCompare(b));
                        setCategorias(nuevasCategorias);
                        setCategoriaSeleccionada(categoriaFinal);
                    } catch (error) {
                        console.error("Error al guardar categoría:", error);
                        MySwal.showValidationMessage('Error al guardar la categoría');
                        return false;
                    }
                }
                
                const nombre = document.getElementById('swal-nombre').value;
                const telefono = document.getElementById('swal-telefono').value;
                
                if (!nombre || !telefono) {
                    MySwal.showValidationMessage('Nombre y teléfono son obligatorios');
                    return false;
                }
                
                return {
                    categoria: categoriaFinal,
                    nombre: nombre,
                    telefono: telefono,
                    email: document.getElementById('swal-email').value || ''
                };
            }
        });

        if (value) {
            try {
                const docRef = await addDoc(collection(db, 'telefonosUtiles'), value);
                setTelefonosUtiles(prev => [...prev, { id: docRef.id, ...value }]);
            } catch (error) {
                console.error("Error al agregar teléfono:", error);
                MySwal.fire({
                    title: 'Error',
                    text: 'No se pudo agregar el teléfono',
                    icon: 'error'
                });
            }
        }
    };

    const handleDelete = async (id, type) => {
        const result = await MySwal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        });
        
        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, type, id));
                if (type === 'novedades') {
                    setNovedades(prevNovedades => prevNovedades.filter(novedad => novedad.id !== id));
                } else {
                    setTelefonosUtiles(prevTelefonos => prevTelefonos.filter(telefono => telefono.id !== id));
                }
                MySwal.fire('Eliminado!', 'El elemento ha sido eliminado.', 'success');
            } catch (error) {
                console.error("Error al eliminar:", error);
                MySwal.fire({
                    title: 'Error',
                    text: 'No se pudo eliminar el elemento',
                    icon: 'error'
                });
            }
        }
    };

    return (
        <div className="container mt-4">
            <h2>Tablero de Información</h2>
            <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
                <Tab eventKey="novedades" title="Novedades">
                    <Button variant="success" className="mb-3" onClick={handleAddNovedad}>Agregar Novedad</Button>
                    <Row xs={1} md={4} className="g-4">
                        {novedades.map(({ id, nombre, lote, novedad, color }) => (
                            <Col key={id}>
                                <Card className="shadow-sm" style={{ backgroundColor: color }}>
                                    <Card.Body>
                                        <Card.Title>{nombre} - Lote: {lote}</Card.Title>
                                        <Card.Text>{novedad}</Card.Text>
                                        <Button variant="danger" size="sm" onClick={() => handleDelete(id, 'novedades')}>Eliminar</Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Tab>
                <Tab eventKey="telefonos" title="Teléfonos Útiles">
                    <Button variant="success" className="mb-3" onClick={handleAddTelefono}>Agregar Teléfono</Button>
                    <Form.Select 
                        className="mb-3" 
                        value={categoriaSeleccionada}
                        onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                    >
                        {categorias.map(categoria => (
                            <option key={categoria} value={categoria}>{categoria}</option>
                        ))}
                    </Form.Select>
                    <Row xs={1} md={4} className="g-4">
                        {telefonosUtiles
                            .filter(t => t.categoria === categoriaSeleccionada)
                            .map(({ id, nombre, telefono, email }) => (
                                <Col key={id}>
                                    <Card className="shadow-sm">
                                        <Card.Body>
                                            <Card.Title>{nombre}</Card.Title>
                                            <Card.Text>
                                                Teléfono: {telefono}
                                                {email && <><br />Email: {email}</>}
                                            </Card.Text>
                                            <div className="mb-2">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <FaStar 
                                                        key={star} 
                                                        color={rating[id] >= star ? "gold" : "gray"} 
                                                        onClick={() => setRating({ ...rating, [id]: star })} 
                                                        style={{ cursor: 'pointer', marginRight: '2px' }}
                                                    />
                                                ))}
                                            </div>
                                            <Button variant="danger" size="sm" onClick={() => handleDelete(id, 'telefonosUtiles')}>
                                                Eliminar
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                    </Row>
                </Tab>
            </Tabs>
        </div>
    );
};