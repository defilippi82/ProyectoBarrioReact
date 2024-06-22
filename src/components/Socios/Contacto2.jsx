import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebaseConfig/firebase';
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
    const [usuarios, setUsuarios] = useState([]);
    const [whatsapp, setWhatsapp] = useState(false);
    const [email, setemail] = useState(false);
    
    
   
    const fetchContacto = async (destino) => {
        try {
            const q = query(collection(db, "usuarios"), where('destino', '==', userData.nombre));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                setDestino({ email: userData.email, telefono: userData.numerotelefono });
            } else {
                setDestino({ email: '', telefono: '' });
            }
        } catch (error) {
            console.error("Error fetching contact:", error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        Swal.fire({
            title: 'Confirmar envío',
            text: `¿Deseas enviar el mensaje al departamento ${departamento}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, enviar',
            cancelButtonText: 'No, cancelar'
          }).then((result) => {
            if (result.isConfirmed) {
              // Aquí puedes realizar el envío del mensaje, por ejemplo, enviando un correo electrónico
              Swal.fire(
                'Enviado!',
                `Tu mensaje ha sido enviado a ${departamento} (${email}).`,
                'success'
              );
            }
          });
        let msj = `Soy del ${lote}, quiero ${consulta}. Desde ya, muchas gracias, ${nombre}`;

        if (destino === 'administracion' && whatsapp) {
            var whatsappUrl = `whatsapp://send?text=${encodeURIComponent(msj)}`;
            window.location.href = whatsappUrl;
        } else if (destino === 'Administracion' && email) {
            var emailSubject = `Consulta del lote ${lote}`;
            var emailLink = `mailto:${destino.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(msj)}`;
            window.location.href = emailLink;
        }
        if (destino === 'facturacion' && whatsapp) {
            var whatsappUrl = `whatsapp://send?text=${encodeURIComponent(msj)}`;
            window.location.href = whatsappUrl;
        } else if (destino === 'Facturacion' && email) {
            var emailSubject = `Consulta del lote ${lote}`;
            var emailLink = `mailto:f.defilippi@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(msj)}`;
            window.location.href = emailLink;
        }
        if (destino === 'controlDeObras' && whatsapp) {
            var whatsappUrl = `whatsapp://send?text=${encodeURIComponent(msj)}`;
            window.location.href = whatsappUrl;
        } else if (destino === 'ControlDeObras' && email) {
            var emailSubject = `Consulta del lote ${lote}`;
            var emailLink = `mailto:f.defilippi@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(msj)}`;
            window.location.href = emailLink;
        }

        setNombre('');
        setLote('');
        setConsulta('');
    };

    return (
        <main className="container col col-6">
            <a href="https://api.whatsapp.com/send?phone=+5491154939423&text=hola%20hebert" target="_blank" rel="noopener noreferrer"></a>
            <form onSubmit={handleSubmit}>
                <br />
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
                ></textarea>
                <fieldset>
                    <legend> ¿A quien le gustaría que lo enviemos?</legend>
                    <select
                        className="form-select"
                        aria-label="Default select example"
                        value={destino}
                        onChange={(e) => setDestino(e.target.value)}
                    >
                        <option value="administracion">Administración</option>
                        <option value="facturacion">Facturación</option>
                        <option value="controlDeObras">Control de Obras</option>
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
                    id="email"
                    name="email"
                    checked={email}
                    onChange={() => setemail(!email)}
                />
                <label htmlFor="email">Consultar por email electrónico</label><br />

                <input type="submit" value="Enviar consulta" id="enviarConsulta" className="btn btn-lg-primary"  />
            </form>
        </main>
    );
};

