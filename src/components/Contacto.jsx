import React, { useState } from 'react';

export const Contacto = () => {
    const [nombre, setNombre] = useState('');
    const [lote, setLote] = useState('');
    const [consulta, setConsulta] = useState('');
    const [destino, setDestino] = useState('administracion');
    const [whatsapp, setWhatsapp] = useState(false);
    const [correo, setCorreo] = useState(false);
    

   

    const handleSubmit = (e) => {
        e.preventDefault();
        let msj = `Soy del ${lote}, quiero ${consulta}. Desde ya, muchas gracias, ${nombre}`;

        if (destino === 'administracion' && whatsapp) {
            var whatsappUrl = `whatsapp://send?text=${encodeURIComponent(msj)}`;
            window.location.href = whatsappUrl;
        } else if (destino === 'administracion' && correo) {
            var emailSubject = `Consulta del lote ${lote}`;
            var emailLink = `mailto:f.defilippi@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(msj)}`;
            window.location.href = emailLink;
        }
        if (destino === 'facturacion' && whatsapp) {
            var whatsappUrl = `whatsapp://send?text=${encodeURIComponent(msj)}`;
            window.location.href = whatsappUrl;
        } else if (destino === 'facturacion' && correo) {
            var emailSubject = `Consulta del lote ${lote}`;
            var emailLink = `mailto:f.defilippi@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(msj)}`;
            window.location.href = emailLink;
        }
        if (destino === 'controlDeObras' && whatsapp) {
            var whatsappUrl = `whatsapp://send?text=${encodeURIComponent(msj)}`;
            window.location.href = whatsappUrl;
        } else if (destino === 'controlDeObras' && correo) {
            var emailSubject = `Consulta del lote ${lote}`;
            var emailLink = `mailto:f.defilippi@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(msj)}`;
            window.location.href = emailLink;
        }

        setNombre('');
        setLote('');
        setConsulta('');
    };

    return (
        <main className="container">
            <a href="https://api.whatsapp.com/send?phone=+5491154939423&text=hola%20hebert" target="_blank" rel="noopener noreferrer"></a>
            <form onSubmit={handleSubmit}>
                <br />
                <label htmlFor="nombre">Nombre y Apellido</label><br />
                <input
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
                    rows="5"
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
                    id="correo"
                    name="correo"
                    checked={correo}
                    onChange={() => setCorreo(!correo)}
                />
                <label htmlFor="correo">Consultar por correo electrónico</label><br />

                <input type="submit" value="Enviar consulta" id="enviarConsulta" className="btn btn-primary" />
            </form>
        </main>
    );
};

