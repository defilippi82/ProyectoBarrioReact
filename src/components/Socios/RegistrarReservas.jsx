
import React, { useState, useContext, useEffect } from 'react';
import { collection, addDoc, Timestamp,query,where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';
import {useNavigate} from "react-router-dom";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';




export const RegistrarReserva = () => {
  const [userData, setUserData]  = useState();
  
  console.log(userData);
  const [cancha, setCancha] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [apellido, setApellido] = useState(userData ? userData.apellido : '');

  const reservasCollection = collection(db, 'reservas');
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  useEffect(() => {
    const userDataFromStorage = localStorage.getItem('userData');
    if (userDataFromStorage) {
      setUserData(JSON.parse(userDataFromStorage));
    }
  }, []);

    useEffect(() => {
    if (userData && userData.nombre) {
      setNombre(userData.apellido);
    }
  }, [userData]);

  // Definir el rango horario permitido (de 8 am a 11 pm)
  const horaInicio = 8;
  const horaFin = 23;

  // Función para generar los intervalos de tiempo
  const generarIntervalos = () => {
    const intervalos = [];
    for (let hora = horaInicio; hora <= horaFin; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 60) {
        const horaFormateada = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        intervalos.push(horaFormateada);
      }
    }
    return intervalos;
  };

  const intervalos = generarIntervalos();

  const crearReserva = async (e) => {
    e.preventDefault();
    // Definir fechaReserva con la fecha y hora seleccionadas
  const fechaReserva = new Date(`${fecha}T${hora}`);

     // Verificar disponibilidad de la cancha en la fecha y hora seleccionadas
     const q = query(reservasCollection, 
      where('cancha', '==', cancha),
      where('fecha', '==', Timestamp.fromDate(fechaReserva))
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      MySwal.fire({
        title: 'Error',
        text: 'Ya existe una reserva para esa cancha en la fecha y hora seleccionadas',
        icon: 'error',
        showConfirmButton: true,
      });
      return;
    }
    // Verificar si la reserva se realiza después de las 20hs
    
  if (fechaReserva.getHours() >= 20) {
    // Mostrar alerta de cobro de ficha de luz
    const confirmacion = await MySwal.fire({
      title: 'Aviso',
      text: 'Se cobrará la ficha de luz por reservar después de las 20hs.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
    });

    // Si el usuario cancela, detener la creación de la reserva
    if (confirmacion.isDismissed) {
      return;
    }
  }

    try {
      // Agregar nueva reserva a la colección 'reservas' en Firestore
      await addDoc(reservasCollection, {
        cancha: cancha,
        fecha: Timestamp.fromDate(new Date(`${fecha}T${hora}`)),
        nombre: nombre,
      });

      // Mostrar alerta de éxito
      MySwal.fire({
        title: 'Reserva exitosa',
        text: 'La reserva ha sido registrada correctamente',
        icon: 'success',
        showConfirmButton: true,
      }).then(() => {
        // Redirigir al usuario a otra página después de la alerta
        navigate('/panico');
      });

      // Resetear los campos del formulario
      setCancha('');
      setFecha(null);
      setHora('');
      setNombre('');
    } catch (error) {
      // Mostrar alerta de error
      MySwal.fire({
        title: 'Error',
        text: error.message,
        icon: 'error',
        showConfirmButton: true,
      });
    }
  };
  
 
  return (
    <div className="container fluid">
      <div className='card text-bg-primary mb-3 shadow-lg style="max-width: 18rem;'>
        <h1 className='card-header'>Registrar Nueva Reserva</h1>
      </div>
      <form onSubmit={crearReserva} className="card card-body shadow-lg">
        <div className="elem-group">
          
          <div className='form-floating mb-3'>
            <select className="form-select"
            id="cancha"
            value={cancha}
            onChange={(e) => setCancha(e.target.value)}
            required>
            <option value="">Seleccionar cancha</option>
            <option value="Tenis 1">Tenis 1</option>
            <option value="Tenis 2">Tenis 2</option>
            <option value="Futbol">Fútbol </option>
            
          </select>
          <label htmlFor="floatingSelectDisabled cancha">Cancha</label>
            </div>
        </div>
        <div className="elem-group">
          <div className='form-floating mb-3'>
          <input className='form-control'
            type="date"
            id="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            />
          <label htmlFor="floatingInputDisabled fecha">Fecha</label>
            </div>
          <select className="form-select"
            id="hora"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            required
              >
            <option value="">Seleccionar hora</option>
            {intervalos.map((intervalo, index) => (
              <option key={index} value={intervalo}>{intervalo}</option>
            ))}
          </select>
        </div>
        <div className='form-floating mb-3'>
          <input className='form-control'
            type="text"
            id="apellido"
            placeholder="Nombre completo"
            value={userData ? userData.apellido : ''}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        <label htmlFor="floatingInputDisabled nombre">Resposnsable</label>
        </div>
        <div id="mensaje">
        <h6 style={{ backgroundColor: 'red', color: 'white', padding: '5px', borderRadius: '3px' }}>Recuerde que se puede reservar de 1 hora por vez por socio</h6><div className="float-right">
            <h6 style={{ backgroundColor: 'red', color: 'white', padding: '5px', borderRadius: '3px' }}>Se cobrará la ficha de luz despues de las 20hs.</h6>
        </div>
    </div>
        <button type="submit" className="btn btn-primary">
          Registrar
        </button>
      </form>
    </div>
  );
};
