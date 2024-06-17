import React, { useState, useEffect, useContext } from 'react';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig/firebase';
import { UserContext } from './UserContext';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const Novedades = () => {
    const { userData } = useContext(UserContext);
    const [novedades, setNovedades] = useState([]);
    const [newNovedad, setNewNovedad] = useState('');
    const [newImage, setNewImage] = useState(null);

    useEffect(() => {
        const fetchNovedades = async () => {
            const querySnapshot = await getDocs(collection(db, 'novedades'));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => new Date(a.fecha.split('/').reverse().join('-')) - new Date(b.fecha.split('/').reverse().join('-')));
            setNovedades(data);
        };

        fetchNovedades();
    }, []);

    const handleAddNovedad = async (e) => {
        e.preventDefault();
        const currentDate = new Date();
        const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;
        
        if (newNovedad.trim() === '') return;
        const newEntry = {
            operador: userData.nombre,
            fecha: formattedDate,
            novedad: newNovedad,
            imagen: newImage,
            likes: 0
        };
        try {
            const docRef = await addDoc(collection(db, 'novedades'), newEntry);
            setNovedades([...novedades, { id: docRef.id, ...newEntry }]);
            setNewNovedad('');
            setNewImage(null);
            MySwal.fire('Éxito', 'Novedad agregada correctamente', 'success');
        } catch (error) {
            console.error('Error adding document: ', error);
            MySwal.fire('Error', 'Hubo un problema al agregar la novedad', 'error');
        }
    };

    const handleDeleteNovedad = async (id) => {
        MySwal.fire({
            title: '¿Estás seguro?',
            text: 'No podrás revertir esto',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, bórralo',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteDoc(doc(db, 'novedades', id));
                    setNovedades(novedades.filter(novedad => novedad.id !== id));
                    MySwal.fire('Borrado', 'La novedad ha sido borrada', 'success');
                } catch (error) {
                    console.error('Error deleting document: ', error);
                    MySwal.fire('Error', 'Hubo un problema al borrar la novedad', 'error');
                }
            }
        });
    };

    const handleEditNovedad = (id, currentNovedad) => {
        MySwal.fire({
            title: 'Editar Novedad',
            input: 'textarea',
            inputLabel: 'Novedad',
            inputValue: currentNovedad,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            preConfirm: async (newNovedad) => {
                if (newNovedad.trim() === '') {
                    Swal.showValidationMessage('La novedad no puede estar vacía');
                    return false;
                }
                try {
                    const novedadDoc = doc(db, 'novedades', id);
                    await updateDoc(novedadDoc, { novedad: newNovedad });
                    setNovedades(novedades.map(n => n.id === id ? { ...n, novedad: newNovedad } : n));
                    MySwal.fire('Éxito', 'Novedad actualizada correctamente', 'success');
                } catch (error) {
                    console.error('Error updating document: ', error);
                    MySwal.fire('Error', 'Hubo un problema al actualizar la novedad', 'error');
                }
            }
        });
    };

    const handleLike = async (id, currentLikes) => {
        try {
            const novedadDoc = doc(db, 'novedades', id);
            await updateDoc(novedadDoc, { likes: currentLikes + 1 });
            setNovedades(novedades.map(n => n.id === id ? { ...n, likes: currentLikes + 1 } : n));
        } catch (error) {
            console.error('Error updating document: ', error);
            MySwal.fire('Error', 'Hubo un problema al dar like a la novedad', 'error');
        }
    };

    const handleContact = (operador) => {
        MySwal.fire({
            title: 'Contactar Operador',
            text: `Puedes contactar a ${operador} a través del sistema de mensajería interno.`,
            icon: 'info',
            confirmButtonText: 'Entendido'
        });
    };

    return (
        <div className="container mt-4">
            <h2>Novedades / Pendientes</h2>
            <div className="d-flex flex-wrap">
                {novedades.map(({ id, operador, fecha, novedad, imagen, likes }) => (
                    <Card key={id} style={{ width: '18rem', margin: '10px' }}>
                        {imagen && <Card.Img variant="top" src={imagen} />}
                        <Card.Body>
                            <Card.Title>{operador}</Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">{fecha}</Card.Subtitle>
                            <Card.Text>{novedad}</Card.Text>
                            <Button variant="primary" onClick={() => handleLike(id, likes)}>Like ({likes})</Button>
                            {' '}
                            <Button variant="info" onClick={() => handleContact(operador)}>Contactar</Button>
                            {' '}
                            {userData.nombre === operador && <Button variant="warning" onClick={() => handleEditNovedad(id, novedad)}>Editar</Button>}
                            {' '}
                            <Button variant="danger" onClick={() => handleDeleteNovedad(id)}>Borrar</Button>
                        </Card.Body>
                    </Card>
                ))}
            </div>
            <Form onSubmit={handleAddNovedad}>
                <Form.Group controlId="novedadInput">
                    <Form.Label>Agregar Novedad</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={newNovedad}
                        onChange={(e) => setNewNovedad(e.target.value)}
                    />
                </Form.Group>
                <Form.Group controlId="imageInput" className="mt-3">
                    <Form.Label>Agregar Imagen</Form.Label>
                    <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewImage(URL.createObjectURL(e.target.files[0]))}
                    />
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-3">
                    Agregar Novedad
                </Button>
            </Form>
        </div>
    );
};
