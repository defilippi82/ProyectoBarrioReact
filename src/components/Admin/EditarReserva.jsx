import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig/firebase";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const EditarReserva = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cancha, setCancha] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [apellido, setApellido] = useState('');
  const [barrioId, setBarrioId] = useState(''); // Estado para el barrio (solo lectura)

  const horaInicio = 8;
  const horaFin = 23;

  const generarIntervalos = () => {
    const intervalos = [];
    for (let h = horaInicio; h <= horaFin; h++) {
      for (let m = 0; m < 60; m += 30) {
        const horaFormateada = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        intervalos.push(horaFormateada);
      }
    }
    return intervalos;
  };

  const intervalos = generarIntervalos();

  useEffect(() => {
    const fetchReserva = async () => {
      try {
        const docRef = doc(db, "reservas", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCancha(data.cancha || '');
          setApellido(data.apellido || '');
          setBarrioId(data.barrioId || 'No asignado'); // Capturamos el barrio
          
          if (data.fecha) {
            const fechaHora = data.fecha.toDate();
            setFecha(fechaHora.toISOString().split('T')[0]);
            setHora(`${fechaHora.getHours().toString().padStart(2, '0')}:${fechaHora.getMinutes().toString().padStart(2, '0')}`);
          }
        } else {
          MySwal.fire("Error", "La reserva no existe", "error");
          navigate('/administracion');
        }
      } catch (error) {
        console.error("Error al obtener reserva:", error);
      }
    };
    fetchReserva();
  }, [id, navigate]);

  const editarSubmit = async (e) => {
    e.preventDefault();
    try {
      // NOTA: No incluimos barrioId en el updateDoc por seguridad. 
      // Solo actualizamos los campos modificables.
      await updateDoc(doc(db, "reservas", id), {
        cancha,
        fecha: new Date(`${fecha}T${hora}`),
        apellido,
      });

      MySwal.fire({
        title: 'Reserva actualizada',
        text: 'La reserva ha sido actualizada correctamente',
        icon: 'success',
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        navigate('/administracion');
      });
    } catch (error) {
      MySwal.fire('Error', error.message, 'error');
    }
  };

  return (
    <div className="container py-5">
      <div className='card text-bg-primary mb-4 shadow-sm'>
        <h2 className='card-header text-center py-3'>Editar Reserva</h2>
      </div>
      
      <form onSubmit={editarSubmit} className="card card-body shadow-sm border-0 p-4">
        
        {/* CAMPO DE SOLO LECTURA PARA AUDITORÍA */}
        <div className="form mb-3">
          <input 
            type="text" 
            className="form-control bg-light text-muted fw-bold" 
            id="barrioId" 
            value={barrioId.toUpperCase()} 
            disabled 
            readOnly 
          />
          <label htmlFor="barrioId">Comunidad / Barrio (Solo Lectura)</label>
        </div>

        <div className="form mb-3">
          <select
            className="form-select"
            id="cancha"
            value={cancha}
            onChange={(e) => setCancha(e.target.value)}
            required
          >
            <option value="">Seleccionar instalación</option>
            <option value="Tenis 1">Tenis 1</option>
            <option value="Tenis 2">Tenis 2</option>
            <option value="Paddle 1">Paddle 1</option>
            <option value="Paddle 2">Paddle 2</option>
            <option value="Futbol 1">Fútbol 1</option>
            <option value="Futbol 2">Fútbol 2</option>
          </select>
          <label htmlFor="cancha">Instalación</label>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <div className="form mb-3">
              <input
                type="date"
                className="form-control"
                id="fecha"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
              <label htmlFor="fecha">Fecha</label>
            </div>
          </div>
          <div className="col-md-6 mt-3 mt-md-0">
            <div className="form mb-3">
              <select
                className="form-select"
                id="hora"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
              >
                <option value="">Seleccionar hora</option>
                {intervalos.map((intervalo, index) => (
                  <option key={index} value={intervalo}>{intervalo} hs</option>
                ))}
              </select>
              <label htmlFor="hora">Horario</label>
            </div>
          </div>
        </div>

        <div className="form mb-4">
          <input
            type="text"
            className="form-control"
            id="apellido"
            placeholder="Apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            required
          />
          <label htmlFor="apellido">Apellido del Responsable</label>
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-secondary flex-grow-1" onClick={() => navigate('/administracion')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary flex-grow-1">
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};

