import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
// Ruta corregida para el build
import { db } from "../firebaseConfig/firebase"; 
import { UserContext } from "../components/Services/UserContext";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [barrios, setBarrios] = useState([]);
  const [barrioSeleccionado, setBarrioSeleccionado] = useState('');
  const { setUserData } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerBarrios = async () => {
      try {
        const q = query(collection(db, "configuracionBarrios"), orderBy("nombre"));
        const snap = await getDocs(q);
        const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBarrios(lista);
      } catch (error) {
        console.error("Error barrios:", error);
      }
    };
    obtenerBarrios();
  }, []);

  const login = async (e) => {
    e.preventDefault();
    if (!barrioSeleccionado) {
      MySwal.fire("Atención", "Selecciona un barrio", "warning");
      return;
    }

    try {
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        let encontrado = false;
        
        querySnapshot.forEach((docSnap) => {
          const dataOriginal = docSnap.data();
          if (dataOriginal.contrasena === password) {
            encontrado = true;
            
            if (!dataOriginal.rol?.god && dataOriginal.barrioId !== barrioSeleccionado) {
               MySwal.fire("Error", "No perteneces a este barrio", "error");
               return;
            }

            const userData = { 
              id: docSnap.id, 
              ...dataOriginal,
              barrioId: dataOriginal.rol?.god ? barrioSeleccionado : dataOriginal.barrioId
            };

            setUserData(userData);
            // Guardamos como 'userData' para que sea consistente en toda la app
            localStorage.setItem('userData', JSON.stringify(userData));
            
            MySwal.fire({
              title: 'Ingreso exitoso',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
            }).then(() => {
              if (userData.rol?.seguridad) navigate('/seguridad');
              else navigate('/novedades');
            });
          }
        });
        if (!encontrado) MySwal.fire("Error", "Contraseña incorrecta", "error");
      } else {
        MySwal.fire("Error", "Usuario no encontrado", "error");
      }
    } catch (error) {
      MySwal.fire("Error", "Error de conexión", "error");
    }
  };

  return (
    <div className="login-master-wrapper" style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #375DDB 0%, #308CA4 50%, #F7FEFF 100%)', padding: '20px'
    }}>
      <div className="login-card text-center" style={{
        background: 'rgba(255, 255, 255, 0.95)', borderRadius: '15px', padding: '40px',
        width: '100%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
      }}>
        <div className="login-icon" style={{ color: '#1e3a8a', marginBottom: '20px' }}>
          <i className="fa fa-user-circle fa-5x"></i>
        </div>
        <h2 className="fw-bold mb-4" style={{ color: '#1e293b' }}>Ingresar</h2>
        <form onSubmit={login} className="text-start">
          <div className="mb-3">
            <label className="form-label fw-bold">Barrio o Comunidad</label>
            <select className="form-select" value={barrioSeleccionado} onChange={(e) => setBarrioSeleccionado(e.target.value)}>
              <option value="">Seleccione su barrio...</option>
              {barrios.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Correo electrónico</label>
            <input className='form-control' type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label className="form-label fw-bold">Contraseña</label>
            <input className='form-control' type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="d-grid gap-2">
            <button type="submit" className="btn btn-primary fw-bold py-2" style={{ backgroundColor: '#1e3a8a' }}>INGRESAR</button>
            <Link to="/socios/create" className="text-center text-muted text-decoration-none small mt-2">¿No tienes cuenta? Regístrate</Link>
          </div>
        </form>
      </div>
    </div>
  );
};