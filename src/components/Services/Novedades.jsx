import React, { useState, useEffect, useContext } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, writeBatch, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import { UserContext } from '../Services/UserContext';
import { Card, Button, Tabs, Tab, Row, Col, Form, Container } from 'react-bootstrap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { FaStar } from 'react-icons/fa';
import './Novedades.css'; // Archivo CSS adicional para estilos personalizados

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
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
    const [categorias, setCategorias] = useState([]);
    const [ratings, setRatings] = useState({}); // { telefonoId: { promedio: number, count: number } }

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
                
                // Cargar teléfonos útiles con sus ratings
                const telefonosSnapshot = await getDocs(collection(db, 'telefonosUtiles'));
                const telefonosData = telefonosSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return { 
                        id: doc.id, 
                        ...data,
                        promedioRating: data.ratings ? (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) : 0,
                        totalRatings: data.ratings ? data.ratings.length : 0
                    };
                });
                setTelefonosUtiles(telefonosData);
                
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
                    email: document.getElementById('swal-email').value || '',
                    ratings: [], // Inicializar array de ratings vacío
                    promedioRating: 0,
                    totalRatings: 0
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

    const handleRateTelefono = async (telefonoId, ratingValue) => {
        try {
            // Actualizar en Firestore
            const telefonoRef = doc(db, 'telefonosUtiles', telefonoId);
            await updateDoc(telefonoRef, {
                ratings: arrayUnion(ratingValue)
            });
            
            // Actualizar el estado local
            setTelefonosUtiles(prev => prev.map(telefono => {
                if (telefono.id === telefonoId) {
                    const newRatings = [...(telefono.ratings || []), ratingValue];
                    const promedio = newRatings.reduce((a, b) => a + b, 0) / newRatings.length;
                    return {
                        ...telefono,
                        ratings: newRatings,
                        promedioRating: promedio,
                        totalRatings: newRatings.length
                    };
                }
                return telefono;
            }));
            
            MySwal.fire({
                title: '¡Gracias!',
                text: `Has valorado con ${ratingValue} estrellas`,
                icon: 'success',
                timer: 1500
            });
        } catch (error) {
            console.error("Error al guardar la valoración:", error);
            MySwal.fire({
                title: 'Error',
                text: 'No se pudo guardar tu valoración',
                icon: 'error'
            });
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
        <Container fluid="md" className="mt-4 novedades-container">
            <h2 className="text-center mb-4">Tablero de Información</h2>
            <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3" id="novedades-tabs">
                <Tab eventKey="novedades" title="Novedades" className="p-2">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                        <Button variant="success" onClick={handleAddNovedad} className="mb-2">
                            Agregar Novedad
                        </Button>
                    </div>
                    <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                        {novedades.map(({ id, nombre, lote, novedad, color }) => (
                            <Col key={id}>
                                <Card className="shadow-sm h-100" style={{ backgroundColor: color }}>
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title>{nombre} - Lote: {lote}</Card.Title>
                                        <Card.Text className="flex-grow-1">{novedad}</Card.Text>
                                        {userData && (
                                            <Button 
                                                variant="danger" 
                                                size="sm" 
                                                onClick={() => handleDelete(id, 'novedades')}
                                                className="align-self-start"
                                            >
                                                Eliminar
                                            </Button>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Tab>
                <Tab eventKey="telefonos" title="Teléfonos Útiles" className="p-2">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                        <Button variant="success" onClick={handleAddTelefono} className="mb-2">
                            Agregar Teléfono
                        </Button>
                        <Form.Select 
                            className="mb-2 telefonos-select" 
                            value={categoriaSeleccionada}
                            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                            style={{ maxWidth: '300px' }}
                        >
                            {categorias.map(categoria => (
                                <option key={categoria} value={categoria}>{categoria}</option>
                            ))}
                        </Form.Select>
                    </div>
                    <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                        {telefonosUtiles
                            .filter(t => t.categoria === categoriaSeleccionada)
                            .map(({ id, nombre, telefono, email, promedioRating, totalRatings }) => (
                                <Col key={id}>
                                    <Card className="shadow-sm h-100">
                                        <Card.Body className="d-flex flex-column">
                                            <Card.Title>{nombre}</Card.Title>
                                            <Card.Text>
                                                <strong>Teléfono:</strong> {telefono}
                                                {email && <><br /><strong>Email:</strong> {email}</>}
                                            </Card.Text>
                                            
                                            <div className="mt-auto">
                                                <div className="mb-2 rating-container">
                                                    <div className="stars">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <FaStar 
                                                                key={star} 
                                                                color={promedioRating >= star ? "gold" : "gray"} 
                                                                onClick={() => handleRateTelefono(id, star)} 
                                                                style={{ cursor: 'pointer', marginRight: '2px' }}
                                                                size={window.innerWidth < 768 ? 16 : 20}
                                                            />
                                                        ))}
                                                    </div>
                                                    <small className="text-muted">
                                                        {promedioRating ? promedioRating.toFixed(1) : '0.0'} ({totalRatings || 0})
                                                    </small>
                                                </div>
                                                
                                                {userData && (
                                                    <Button 
                                                        variant="danger" 
                                                        size="sm" 
                                                        onClick={() => handleDelete(id, 'telefonosUtiles')}
                                                        className="align-self-start"
                                                    >
                                                        Eliminar
                                                    </Button>
                                                )}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                    </Row>
                </Tab>
            </Tabs>
        </Container>
    );
};