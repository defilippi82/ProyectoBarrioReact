import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
// Cambiamos a rutas relativas para evitar errores en el build de Vercel/Vite
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

  // Carga inicial de barrios
  useEffect(() => {
    const obtenerBarrios = async () => {
      try {
        const q = query(collection(db, "configuracionBarrios"), orderBy("nombre"));
        const snap = await getDocs(q);
        const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBarrios(lista);
      } catch (error) {
        console.error("Error al obtener barrios:", error);
      }
    };
    obtenerBarrios();
  }, []);

  const login = async (e) => {
    e.preventDefault();

    if (!barrioSeleccionado) {
      MySwal.fire("Atención", "Selecciona un barrio para continuar", "warning");
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

            // Validación de pertenencia al barrio (excepto si es cuenta 'god')
            if (!dataOriginal.rol?.god && dataOriginal.barrioId !== barrioSeleccionado) {
              MySwal.fire("Error", "No tienes permisos para acceder a este barrio", "error");
              return;
            }

            // Consolidamos el objeto de usuario
            // Si es 'god', le asignamos el barrio que eligió en el select
            const userData = {
              id: docSnap.id,
              ...dataOriginal,
              barrioId: dataOriginal.rol?.god ? barrioSeleccionado : dataOriginal.barrioId
            };

            // Actualizamos Context y LocalStorage (Clave única: userData)
            setUserData(userData);
            localStorage.setItem('userData', JSON.stringify(userData));

            MySwal.fire({
              title: 'Ingreso exitoso',
              text: `Bienvenido, ${userData.nombre}`,
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
            }).then(() => {
              // Redirección por rol
              if (userData.rol?.seguridad) {
                navigate('/seguridad');
              } else {
                navigate('/novedades');
              }
            });
          }
        });

        if (!encontrado) {
          MySwal.fire("Error", "La contraseña es incorrecta", "error");
        }
      } else {
        MySwal.fire("Error", "El correo electrónico no está registrado", "error");
      }
    } catch (error) {
      console.error("Login Error:", error);
      MySwal.fire("Error", "Hubo un problema de conexión con la base de datos", "error");
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
          background: linear-gradient(135deg, #375DDB 0%, #308CA4 50%, #F7FEFF 100%);
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

          <h2 className="fw-bold mb-4" style={{ color: '#1e293b' }}>Bienvenido</h2>

          <form onSubmit={login} className="text-start">
            <div className="mb-3">
              <label className="form-label fw-bold small text-muted">BARRIO O COMUNIDAD</label>
              <select 
                className="form-select no-outline" 
                value={barrioSeleccionado}
                onChange={(e) => setBarrioSeleccionado(e.target.value)}
                required
              >
                <option value="">Seleccione un barrio...</option>
                {barrios.map(b => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold small text-muted">CORREO ELECTRÓNICO</label>
              <input 
                className='form-control no-outline' 
                type="email" 
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold small text-muted">CONTRASEÑA</label>
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
              <button type="submit" className="btn btn-primary btn-ingresar text-white shadow-sm">
                INGRESAR AL SISTEMA
              </button>
              <Link to="/socios/create" className="btn btn-link text-muted text-decoration-none small mt-2">
                ¿Sos nuevo? Regístrate acá
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};