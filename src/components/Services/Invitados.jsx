import React, { useState, useEffect } from 'react';
import { Tab } from 'react-bootstrap';
import Table from 'react-bootstrap/Table';


export const Invitados = () => {
  const [formData, setFormData] = useState({
    nombreapellido: '',
    dni: '',
    patente: '',
    mensaje: '',
    enviarCorreo: false,
  });
  const [userData, setUserData] = useState(null);
  const [invitados, setInvitados] = useState([]);
  
   useEffect(() => {
    const userDataFromStorage = localStorage.getItem('userData');

    if (userDataFromStorage) {
      setUserData(JSON.parse(userDataFromStorage));
    } else {
      // Obtener datos del usuario desde otra fuente (por ejemplo, una API o base de datos)
      const obtenerDatosUsuario = async () => {
        // ... (código existente para obtener datos del usuario)
        const datosUsuario = await obtenerDatosDesdeOtraFuente();
        setUserData(datosUsuario);
        localStorage.setItem('userData', JSON.stringify(datosUsuario));
      };

      obtenerDatosUsuario();
    }
  }, []); // Matriz

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleAgregar = (e) => {
    e.preventDefault();
    const { nombreapellido, dni, patente } = formData;
    if (nombreapellido && dni && patente) {
      setInvitados([...invitados, { nombre: nombreapellido, dni, patente }]);
      setFormData({ ...formData, nombreapellido: '', dni: '', patente: '' });
    } else {
      alert('Por favor complete todos los campos.');
    }
  };

  const handleEnviarGuardia = (e) => {
    e.preventDefault();
    const { nombreapellido, dni, patente, mensaje, enviarCorreo } = formData;
    const msj = `Soy del lote ${userData.manzana}-${userData.lote} y quiero autorizar para su ingreso a ${nombreapellido} D.N.I. ${dni}, patente del automóvil ${patente}. ${mensaje}`;

    if (enviarCorreo) {
      const destinatarioCorreo = "f.defilippi@gmail.com"; // modificar correo según corresponda
      const emailSubject = `Lista de Invitados del lote ${userData.manzana}-${userData.lote}`;
      let emailBody = `Soy del lote ${userData.manzana}-${userData.lote} y quiero autorizar para su ingreso a las siguientes personas:\n\nNombre\t\t\tD.N.I.\t\t\tPatente\n`;
      invitados.forEach(inv => {
        emailBody += `${inv.nombre}\t\t${inv.dni}\t\t${inv.patente}\n`;
      });
      const emailLink = `mailto:${encodeURIComponent(destinatarioCorreo)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = emailLink;
    } else {
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${userData.numerotelefono}&text=${encodeURIComponent(msj)}`;
      window.location.href = whatsappUrl;
    }
  };

  const handleEnviarInvitacion = (e) => {
    e.preventDefault();
    const urlInvitacion = 'https://defilippi82.github.io/SOS/invitacion.html'; // Reemplaza con la URL real
    const mensaje = `Te envío la invitación para autorizar el ingreso: ${urlInvitacion}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl);
  };

  return (
    <main className="container fluid">
      <form >
        <div className='container fluid justify-content-center'>

        <label htmlFor="nombreapellido">Nombre y Apellido</label><br />
        <input
          type="text"
          name="nombreapellido"
          id="nombreapellido"
          className="input-padron"
          value={formData.nombreapellido}
          onChange={handleChange}
          /><br />

        <label htmlFor="dni">D.N.I.</label><br />
        <input
          type="text"
          name="dni"
          id="dni"
          className="input-padron"
          placeholder="XX.XXXXXX"
          value={formData.dni}
          onChange={handleChange}
          /><br />

        <label htmlFor="patente">Patente</label><br />
        <input
          type="text"
          name="patente"
          id="patente"
          className="input-padron"
          placeholder="XX-XXX-XX o XXX-XXX"
          value={formData.patente}
          onChange={handleChange}
          /><br />

        <label htmlFor="mensaje">Mensaje</label><br />
        <textarea
          cols="auto"
          rows="auto"
          name="mensaje"
          id="mensaje"
          className="input-padron"
          placeholder="aclaraciones"
          value={formData.mensaje}
          onChange={handleChange}
          /><br />

          </div>
        <section>
          <h1>Lista de invitados</h1>
          <Table striped bordered hover size="sm" >
            <thead>
              <tr>
                <th>Nombre</th>
                <th>D.N.I.</th>
                <th>Patente</th>
              </tr>
            </thead>
            <tbody id="tabla">
              {invitados.map((invitado, index) => (
                <tr key={index}>
                  <td>{invitado.nombre}</td>
                  <td>{invitado.dni}</td>
                  <td>{invitado.patente}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>

        <div className='container fluid'>
          <input
            type="checkbox"
            id="enviarCorreo"
            name="enviarCorreo"
            checked={formData.enviarCorreo}
            onChange={handleChange}
          />
          <label htmlFor="enviarCorreo">Enviar Lista de Invitados</label>
              </div>
       <div className='container fluid col col-6 col-4'>
        <button onClick={handleAgregar} className="btn btn-success enviar">Agregar a la lista</button>
        <button onClick={handleEnviarGuardia} className="btn btn-primary enviar">Enviar a la Guardia</button><br />
        </div>
        <h1>Enviar invitación</h1>
        <div className='container fluid col col-6'>

        <button onClick={handleEnviarInvitacion} className="btn btn-danger enviar">Enviar Invitacion</button>
        </div>
      </form>
    </main>
  );
};

