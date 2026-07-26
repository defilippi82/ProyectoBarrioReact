import React, { useState, useEffect, useContext } from 'react';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';
import { UserContext } from '../Services/UserContext';
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

export const RegistrarReserva = () => {
  const { userData } = useContext(UserContext);
  
  // Cambiamos 'config' por 'amenities' y dejamos los horarios fijos temporalmente
  const [amenities, setAmenities] = useState([]);
  const [horarios] = useState({ inicio: 8, fin: 23 }); 
  
  const [formData, setFormData] = useState({ cancha: '', fecha: '', hora: '', apellido: userData?.apellido || '' });
  
  const navigate = useNavigate();

  // 1. CARGAR CONFIGURACIÓN DEL BARRIO
  useEffect(() => {
    if (!userData?.barrioId) return;

    const fetchConfig = async () => {
      const q = query(collection(db, 'configuracionBarrios'), where('barrioId', '==', userData.barrioId));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const data = snap.docs[0].data();
        // Guardamos el array 'amenities' de la base de datos
        // Filtramos para que solo muestre las que están "activo: true"
        if (data.amenities) {
          const amenitiesActivos = data.amenities.filter(a => a.activo === true);
          setAmenities(amenitiesActivos);
        }
      }
    };
    fetchConfig();
  }, [userData]);

  const generarIntervalos = () => {
    const intervalos = [];
    for (let h = horarios.inicio; h <= horarios.fin; h++) {
      intervalos.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return intervalos;
  };

  const crearReserva = async (e) => {
    e.preventDefault();
    const { cancha, fecha, hora, apellido } = formData;
    const fechaReserva = new Date(`${fecha}T${hora}`);

    try {
      // 2. VALIDACIÓN DE DISPONIBILIDAD
      const q = query(collection(db, 'reservas'), 
        where('barrioId', '==', userData.barrioId),
        where('cancha', '==', cancha),
        where('fecha', '==', Timestamp.fromDate(fechaReserva))
      );
      
      if (!(await getDocs(q)).empty) {
        return Swal.fire('No disponible', 'El turno ya está ocupado.', 'error');
      }

      // 3. ADICIONAL DE LUZ
      if (fechaReserva.getHours() >= 20) {
        const confirm = await Swal.fire({ title: 'Aviso de luz', text: 'Se cobrará adicional por luz.', icon: 'info', showCancelButton: true });
        if (!confirm.isConfirmed) return;
      }

      // 4. GUARDADO
      await addDoc(collection(db, 'reservas'), {
        cancha,
        fecha: Timestamp.fromDate(fechaReserva),
        apellido,
        barrioId: userData.barrioId,
        usuarioId: userData.uid || userData.id,
        fechaRegistro: Timestamp.now()
      });

      Swal.fire('Éxito', 'Reserva confirmada', 'success').then(() => navigate('/novedades'));

    } catch (error) {
      Swal.fire('Error', 'No se pudo registrar.', 'error');
    }
  };

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4">Nueva Reserva</h2>
      <form onSubmit={crearReserva} className="card card-body shadow-sm border-0 p-4">
        
        {/* Canchas dinámicas (Amenities) */}
        <div className='mb-3'>
          <label className="small fw-bold text-muted">CANCHA</label>
          <select className="form-select" onChange={(e) => setFormData({...formData, cancha: e.target.value})} required>
            <option value="">Seleccionar...</option>
            {/* Iteramos sobre el array de objetos y usamos a.nombre */}
            {amenities.map(a => (
              <option key={a.id} value={a.nombre}>{a.nombre}</option>
            ))}
          </select>
        </div>

        <div className='mb-3'>
          <label className="small fw-bold text-muted">FECHA</label>
          <input className='form-control' type="date" onChange={(e) => setFormData({...formData, fecha: e.target.value})} required />
        </div>

        <div className='mb-3'>
          <label className="small fw-bold text-muted">HORARIO</label>
          <select className="form-select" onChange={(e) => setFormData({...formData, hora: e.target.value})} required>
            <option value="">Seleccionar...</option>
            {generarIntervalos().map(int => <option key={int} value={int}>{int} hs</option>)}
          </select>
        </div>

        <button type="submit" className="btn btn-primary w-100">CONFIRMAR</button>
      </form>
    </div>
  );
};