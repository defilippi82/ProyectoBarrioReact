
import React, { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const RegistrarReserva = () => {
  const [userData, setUserData] = useState(null);
  const [cancha, setCancha] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [apellido, setApellido] = useState('');

  const navigate = useNavigate();
  const reservasCollection = collection(db, 'reservas');

  // 1. Cargar datos del usuario al montar el componente
  useEffect(() => {
    const data = localStorage.getItem('userData') || localStorage.getItem('user');
    if (data) {
      const parsedData = JSON.parse(data);
      setUserData(parsedData);
      // Seteamos el apellido inicialmente si existe
      if (parsedData.apellido) setApellido(parsedData.apellido);
    }
  }, []);

  // Rango horario
  const horaInicio = 8;
  const horaFin = 23;

  const generarIntervalos = () => {
    const intervalos = [];
    for (let h = horaInicio; h <= horaFin; h++) {
      const horaFormateada = `${h.toString().padStart(2, '0')}:00`;
      intervalos.push(horaFormateada);
    }
    return intervalos;
  };

  const intervalos = generarIntervalos();

  const crearReserva = async (e) => {
    e.preventDefault();

    // Verificación de seguridad: si no hay barrioId, no podemos reservar
    if (!userData?.barrioId) {
      MySwal.fire("Error", "No se detectó el ID del barrio. Por favor, reingresa al sistema.", "error");
      return;
    }

    const fechaReserva = new Date(`${fecha}T${hora}`);
    const barrioIdNormalizado = String(userData.barrioId).toLowerCase().trim();

    try {
      // 2. BUSQUEDA DE DISPONIBILIDAD (Filtrada por BARRIO)
      // Agregamos el filtro de barrioId para que las canchas sean independientes por comunidad
      const q = query(reservasCollection, 
        where('barrioId', '==', barrioIdNormalizado),
        where('cancha', '==', cancha),
        where('fecha', '==', Timestamp.fromDate(fechaReserva))
      );
      
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        MySwal.fire({
          title: 'No disponible',
          text: 'Ya existe una reserva para esta cancha y horario en tu barrio.',
          icon: 'error',
        });
        return;
      }

      // 3. Alerta de luz (después de las 20hs)
      if (fechaReserva.getHours() >= 20) {
        const confirmacion = await MySwal.fire({
          title: 'Aviso de iluminación',
          text: 'Se cobrará el adicional de luz por reservar después de las 20hs.',
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Aceptar',
          cancelButtonText: 'Cancelar',
        });
        if (confirmacion.isDismissed) return;
      }

      // 4. GUARDAR RESERVA CON barrioId
      await addDoc(reservasCollection, {
        cancha: cancha,
        fecha: Timestamp.fromDate(fechaReserva),
        apellido: apellido || userData.apellido, // Fallback al del storage
        barrioId: barrioIdNormalizado, // <--- CAMPO CLAVE
        usuarioId: userData.id || '', // Útil para que el usuario vea sus propias reservas luego
        fechaRegistro: Timestamp.now()
      });

      MySwal.fire({
        title: 'Reserva exitosa',
        text: 'Tu turno ha sido registrado.',
        icon: 'success',
      }).then(() => {
        navigate('/novedades'); // O la ruta que prefieras
      });

      // Reset
      setCancha('');
      setFecha('');
      setHora('');

    } catch (error) {
      console.error("Error al reservar:", error);
      MySwal.fire("Error", "No se pudo registrar la reserva", "error");
    }
  };

  return (
    <div className="container py-4">
      <div className='card text-bg-primary mb-4 shadow-lg'>
        <h2 className='card-header text-center py-3'>Nueva Reserva</h2>
      </div>

      <form onSubmit={crearReserva} className="card card-body shadow-lg border-0 p-4">
        
        {/* Selección de Cancha */}
        <div className='form mb-3'>
          <select 
            className="form-select"
            id="cancha"
            value={cancha}
            onChange={(e) => setCancha(e.target.value)}
            required
          >
            <option value="">Seleccionar cancha...</option>
            <option value="Tenis 1">Tenis 1</option>
            <option value="Tenis 2">Tenis 2</option>
            <option value="Futbol">Fútbol</option>
          </select>
          <label htmlFor="cancha">Cancha</label>
        </div>

        {/* Fecha */}
        <div className='form mb-3'>
          <input 
            className='form-control'
            type="date"
            id="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
          <label htmlFor="fecha">Fecha</label>
        </div>

        {/* Hora */}
        <div className='form mb-3'>
          <select 
            className="form-select"
            id="hora"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            required
          >
            <option value="">Seleccionar horario...</option>
            {intervalos.map((int, index) => (
              <option key={index} value={int}>{int} hs</option>
            ))}
          </select>
          <label htmlFor="hora">Hora</label>
        </div>

        {/* Responsable (Apellido) */}
        <div className='form mb-3'>
          <input 
            className='form-control'
            type="text"
            id="apellido"
            placeholder="Responsable"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            required
          />
          <label htmlFor="apellido">Responsable de la Reserva</label>
        </div>

        {/* Mensajes de advertencia */}
        <div className="alert alert-danger d-flex flex-column gap-1 small">
          <span className="fw-bold">⚠️ Importante:</span>
          <span>• Máximo 1 hora por reserva por socio.</span>
          <span>• Se cobrará ficha de luz a partir de las 20:00 hs.</span>
        </div>

        <button type="submit" className="btn btn-primary btn-lg w-100 mt-3 shadow-sm">
          CONFIRMAR RESERVA
        </button>
      </form>
    </div>
  );
};