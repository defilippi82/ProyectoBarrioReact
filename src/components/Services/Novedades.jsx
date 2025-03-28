import React, { useState, useEffect, useContext } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
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
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Jardinero');
    const [categorias, setCategorias] = useState(["Jardinero", "Piletero", "Plomero", "Electricista", "Técnico informático", "Sodero", "Cable e internet", "Veterinarias", "Pozero"]);

    useEffect(() => {
        const fetchNovedades = async () => {
            const querySnapshot = await getDocs(collection(db, 'novedades'));
            setNovedades(querySnapshot.docs.map(doc => ({ id: doc.id, color: getRandomColor(), ...doc.data() })));
        };
        const fetchTelefonos = async () => {
            const querySnapshot = await getDocs(collection(db, 'telefonosUtiles'));
            setTelefonosUtiles(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchNovedades();
        fetchTelefonos();
    }, []);

    const handleAddTelefono = async () => {
        let nuevaCategoria = '';

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
                    if (e.target.value === 'nueva') {
                        inputNuevaCategoria.style.display = 'block';
                    } else {
                        inputNuevaCategoria.style.display = 'none';
                    }
                });
            },
            preConfirm: () => {
                const categoria = document.getElementById('swal-categoria').value;
                if (categoria === 'nueva') {
                    nuevaCategoria = document.getElementById('swal-nueva-categoria').value;
                    if (!categorias.includes(nuevaCategoria)) {
                        setCategorias([...categorias, nuevaCategoria]);
                    }
                }
                return {
                    categoria: categoria === 'nueva' ? nuevaCategoria : categoria,
                    nombre: document.getElementById('swal-nombre').value,
                    telefono: document.getElementById('swal-telefono').value,
                    email: document.getElementById('swal-email').value
                };
            }
        });

        if (value) {
            await addDoc(collection(db, 'telefonosUtiles'), value);
            setTelefonosUtiles([...telefonosUtiles, value]);
        }
    };

    const handleDelete = async (id, type) => {
        await deleteDoc(doc(db, type, id));
        if (type === 'novedades') {
            setNovedades(novedades.filter(novedad => novedad.id !== id));
        } else {
            setTelefonosUtiles(telefonosUtiles.filter(telefono => telefono.id !== id));
        }
    };

    return (
        <div className="container mt-4">
            <h2>Tablero de Información</h2>
            <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
                <Tab eventKey="novedades" title="Novedades">
                    <Row>
                        {novedades.map(({ id, nombre, lote, novedad, color }) => (
                            <Col key={id} md={3} className="mb-3">
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
                    <h5>Categorías</h5>
                    <Form.Select className="mb-3" onChange={(e) => setCategoriaSeleccionada(e.target.value)}>
                        {categorias.map(categoria => (
                            <option key={categoria} value={categoria}>{categoria}</option>
                        ))}
                    </Form.Select>
                    <h5 className="mt-3">Listado</h5>
                    <Row>
                        {telefonosUtiles.filter(({ categoria }) => categoria === categoriaSeleccionada).map(({ id, categoria, nombre, telefono, email }) => (
                            <Col key={id} md={3} className="mb-3">
                                <Card className="shadow-sm">
                                        <Card.Body>
                                        <Card.Title>{categoria} - {nombre}</Card.Title>
                                        <Card.Text>Teléfono: {telefono} - Email: {email}</Card.Text>
                                        <div>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <FaStar key={star} color={rating[id] >= star ? "gold" : "gray"} onClick={() => setRating({ ...rating, [id]: star })} />
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    <Button variant="success" className="mt-3" onClick={handleAddTelefono}>Agregar Teléfono</Button>
                </Tab>
            </Tabs>
        </div>
    );
};
