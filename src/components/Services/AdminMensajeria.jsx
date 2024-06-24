import React, { useState } from 'react';
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from '../../firebaseConfig/firebase';

export const AdminMensajeria = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isla, setIsla] = useState(''); // Comma-separated islands
  const [manzana, setManzana] = useState(''); // Comma-separated blocks
  const [rol, setRol] = useState(''); // Selected role

  const sendNotification = async () => {
    const functions = getFunctions();
    const sendNotification = httpsCallable(functions, 'sendNotification');

    const islaArray = isla.split(',').map(isla => isla.trim());
    const manzanaArray = manzana.split(',').map(manzana => manzana.trim());
    const rolArray = rol ? [rol] : [];

    try {
      const result = await sendNotification({ title, body, isla: islaArray, manzana: manzanaArray, rol: rolArray });
      console.log('Notificación enviada:', result);
    } catch (error) {
      console.error('Error al enviar la notificación:', error);
    }
  };

  return (
    <div m>
      <h1>Enviar Notificación</h1>
      <input
        type="text"
        placeholder="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        cols="auto"
          rows="auto"
        placeholder="Cuerpo"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <input
        type="text"
        placeholder="Isla (separados por comas)"
        value={isla}
        onChange={(e) => setIsla(e.target.value)}
      />
      <input
        type="text"
        placeholder="Manzana (separados por comas)"
        value={manzana}
        onChange={(e) => setManzana(e.target.value)}
      />
      <select value={rol} onChange={(e) => setRol(e.target.value)}>
        <option value="">Selecciona un rol</option>
        <option value="propietario">Propietario</option>
        <option value="inquilino">Inquilino</option>
        <option value="seguridad">Seguridad</option>
        <option value="empleados">Empleados</option>
      </select>
      <button className='btn btn-success' onClick={sendNotification}>Enviar</button>
    </div>
  );
};
