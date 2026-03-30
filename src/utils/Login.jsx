import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "/src/firebaseConfig/firebase.js";
import { UserContext } from "/src/components/Services/UserContext.jsx";
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
    if (!barrioSeleccionado && email !== 'f.defilippi@gmail.com') {
      MySwal.fire("Atención", "Selecciona un barrio", "warning");
      return;
    }

    try {
      const usuariosRef = collection(db, "usuarios");
      let q = (email === 'f.defilippi@gmail.com') 
        ? query(usuariosRef, where('email', '==', email))
        : query(usuariosRef, where('email', '==', email), where('barrioId', '==', barrioSeleccionado));

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        let encontrado = false;
        querySnapshot.forEach((docSnap) => {
          const userData = { id: docSnap.id, ...docSnap.data() };
          if (userData.contrasena === password) {
            encontrado = true;
            setUserData(userData);
            localStorage.setItem('userData', JSON.stringify(userData));
            
            MySwal.fire({
              title: 'Ingreso exitoso',
              text: '¡Bienvenido!',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
            }).then(() => {
              if (userData.rol === 'seguridad') navigate('/seguridad');
              else navigate('/panico');
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
    <>
      <style>{`
        .login-master-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #8ea5da 0%, #1e3a8a 100%);
          padding: 20px;
        }
        .login-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 15px;
          padding: 40px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        }
        .login-icon {
          color: #1e3a8a;
          margin-bottom: 20px;
        }
        .no-outline:focus {
          box-shadow: none;
          border-color: #1e3a8a;
        }
        .form-label {
          font-size: 0.9rem;
          color: #475569;
        }
        .btn-ingresar {
          background-color: #1e3a8a;
          border: none;
          padding: 12px;
          font-weight: bold;
          transition: 0.3s;
        }
        .btn-ingresar:hover {
          background-color: #1e40af;
          transform: translateY(-1px);
        }
      `}</style>

      <div className="login-master-wrapper">
        <div className="login-card text-center">
          <div className="login-icon">
            <i className="fa fa-user-circle fa-5x" aria-hidden="true"></i>
          </div>
          
          <h2 className="fw-bold mb-4" style={{ color: '#1e293b' }}>Ingresar</h2>

          <form onSubmit={login} className="text-start">
            <div className="mb-3">
              <label className="form-label fw-bold">Barrio o Comunidad</label>
              <select 
                className="form-select no-outline" 
                value={barrioSeleccionado}
                onChange={(e) => setBarrioSeleccionado(e.target.value)}
              >
                <option value="">Seleccione su barrio...</option>
                {barrios.map(b => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Correo electrónico</label>
              <input 
                className='form-control no-outline' 
                type="email" 
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">Contraseña</label>
              <input 
                className='form-control no-outline' 
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="d-grid gap-2">
              <button type="submit" className="btn btn-primary btn-ingresar text-white">
                INGRESAR
              </button>
              <Link to="/socios/create" className="btn btn-link text-muted text-decoration-none small">
                ¿No tienes cuenta? Regístrate aquí
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};