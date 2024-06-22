import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Swal from 'sweetalert2';

export const Contacto = () => {
    const [nombre, setNombre] = useState('');
    const [lote, setLote] = useState('');
    const [consulta, setConsulta] = useState('');
    const [destino, setDestino] = useState('');
    const [contacto, setContacto] = useState({ email: '', telefono: '' });
    const [whatsapp, setWhatsapp] = useState(false);
    const [correo, setCorreo] = useState(false);
    
    useEffect(() => {
        if (destino) {
            fetchContacto(destino);
        }
    }, [destino]);
   
    const fetchContacto = async (destino) => {
        try {
            const q = query(collection(db, "usuarios"), where('nombre', '==', destino));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                setContacto({ email: userData.email, telefono: userData.numerotelefono });
            } else {
                setContacto({ email: '', telefono: '' });
            }
        } catch (error) {
            console.error("Error fetching contact:", error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        Swal.fire({
            title: 'Confirmar envío',
            text: `¿Deseas enviar el mensaje para ${destino}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, enviar',
            cancelButtonText: 'No, cancelar'
          }).then((result) => {
            if (result.isConfirmed) {
                let msj = `Soy del ${lote}, quiero ${consulta}. Desde ya, muchas gracias, ${nombre}`;

                if (whatsapp) {
                    var whatsappUrl = `https://api.whatsapp.com/send?phone=${contacto.numerotelefono}&text=${encodeURIComponent(msj)}`;
                    window.open(whatsappUrl);
                }
                if (correo) {
                    var emailSubject = `Consulta del lote ${lote}`;
                    var emailLink = `mailto:${contacto.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(msj)}`;
                    window.open(emailLink);
                }

                Swal.fire(
                    'Enviado!',
                    `Tu mensaje ha sido enviado a ${destino}.`,
                    'success'
                );

                setNombre('');
                setLote('');
                setConsulta('');
            }
        });
    };

    return (
        <main className="container col col-auto">
            <a href="https://api.whatsapp.com/send?phone=+5491154939423&text=hola%20hebert" target="_blank" rel="noopener noreferrer"></a>
            <form onSubmit={handleSubmit}>
                <br />
                <Col sm="auto">
                <label htmlFor="nombre">Nombre y Apellido</label><br />
                <input
                    cols="auto"
                    type="text"
                    id="nombre"
                    name="nombre"
                    className="input-padron"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    /><br />

                <label htmlFor="lote">Lote</label><br />
                <input
                    cols="auto"
                    type="text"
                    id="lote"
                    name="lote"
                    className="input-padron"
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                    required
                    placeholder="ej. XX-XXX"
                    /><br />

                <label htmlFor="consulta">Mensaje</label><br />
                <textarea
                    cols="auto"
                    rows="2"
                    id="consulta"
                    name="consulta"
                    className="input-padron"
                    value={consulta}
                    onChange={(e) => setConsulta(e.target.value)}
                    required
                    >

                </textarea>
                    </Col>
                <fieldset>
                    <legend> ¿A quien le gustaría que lo enviemos?</legend>
                    <select
                        className="form-select"
                        aria-label="Default select example"
                        value={destino}
                        onChange={(e) => setDestino(e.target.value)}
                    >
                        <option value="Administracion">Administración</option>
                        <option value="Administracion">Facturación</option>
                        <option value="ControlDeObras">Control de Obras</option>
                    </select>
                </fieldset>
                <br />
                <input
                    type="checkbox"
                    id="whatsapp"
                    name="whatsapp"
                    checked={whatsapp}
                    onChange={() => setWhatsapp(!whatsapp)}
                />
                <label htmlFor="whatsapp">Contactar por Whatsapp</label><br />
                <input
                    type="checkbox"
                    id="correo"
                    name="correo"
                    checked={correo}
                    onChange={() => setCorreo(!correo)}
                />
                <label htmlFor="correo">Consultar por correo electrónico</label><br />

                <input type="submit" value="Enviar consulta" id="enviarConsulta" className="btn btn-secondary "  />
            </form>
        </main>
    );
};

