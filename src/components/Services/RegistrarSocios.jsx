import React, { useState, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig/firebase';
import { Form, Table, Button, FloatingLabel, Row, Col, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

/* SWEET ALERT*/
import Swal from "sweetalert2";
import whitReactContent from "sweetalert2-react-content";

const MySwal = whitReactContent(Swal)

export const RegistrarSocio = () => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [manzana, setManzana] = useState('');
  const [lote, setLote] = useState('');
  const [isla, setIsla] = useState('');
  const roles = new Map([
    
    ['propietario', { valor: 'propietario', administrador: false, propietario: true, inquilino: false, guardia: false }],
    ['inquilino', { valor: 'inquilino', administrador: false, propietario: false, inquilino: true, guardia: false }],
    
  ]);
  const [rol, setRol] = useState(roles.get('propietario')); // Valor inicial del rol
  const [tel, setTel] = useState('');
  const [codPais, setCodPais] = useState('');
  const [numerotelefono, setNumeroTelefono] = useState ('');
  const [contrasena, setContrasena] = useState('');
  const [repetirContrasena, setRepetirContrasena] = useState('');
 

  const auth = getAuth();
  const sociosCollection = collection(db, 'usuarios');
  const navigate = useNavigate()


  const MySwal = whitReactContent(Swal);

  useEffect(() => {
    setNumeroTelefono(`${codPais}${tel}`);
  }, [codPais, tel]);


  const crearSocio = async (e) => {
    e.preventDefault();
    // Validar que la contraseña tenga al menos 6 caracteres
  if (contrasena.length < 6) {
    MySwal.fire({
      title: 'Error',
      text: 'La contraseña debe tener al menos 6 caracteres',
      icon: 'error',
      showConfirmButton: true,
    });
    //return;  Salir de la función sin intentar crear el usuario
  }
  if (contrasena !== repetirContrasena) {
    MySwal.fire({
      title: 'Error',
      text: 'Las contraseñas no coinciden',
      icon: 'error',
      showConfirmButton: true,
    });
    return;
  }
  try {
    // Crear usuario en Firebase Authentication
    const { user } = await createUserWithEmailAndPassword(auth, email, contrasena);

    // Agregar datos del usuario a la colección 'usuarios' en Firestore
    await addDoc(sociosCollection, {
      nombre,
      apellido,
      email,
      manzana,
      lote,
      isla,
      rol: rol.valor,
      numerotelefono,
      contrasena,
      
    });

    // Mostrar alerta de éxito
    MySwal.fire({
      title: 'Registro exitoso',
      text: 'El socio ha sido registrado correctamente',
      icon: 'success',
      showConfirmButton: true,
    }).then(() => {
      // Redirigir al usuario a otra página después de la alerta
      navigate ('/#');
    });
    
    // Resetear los campos del formulario
    setNombre('');
    setApellido('');
    setEmail('');
    setContrasena('');
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
const RolSelect = () => {
  const [rol, setRol] = useState(roles.get('propietario'));

  const handleRolChange = (e) => {
    const nuevoRol = roles.get(e.target.value);
    setRol(nuevoRol);
  };

  return (
    <div className="container fluid elem-group form-floating mb-3">
      <select
        name="rol"
        id="rol"
        value={rol.valor}
        onChange={handleRolChange}
        className="form-select"
      >
        {Array.from(roles.keys()).map((key) => (
          <option key={key} value={key}  >
            {key}
          </option>
        ))}
      </select>
      <label htmlFor="rol">Rol</label>
    </div>
  );
};

    return (

      
       <div className="container">
        <div className='card text-bg-primary mb-3 shadow-lg" style="max-width: 18rem;"'>
         <h1 className='card-header'>Registrar Nueva Socio</h1>
       </div>
       <form onSubmit={crearSocio} className="card card-body shadow-lg">
       <Row className="align-items-center">
                            <Col xs="auto">
        <div className="elem-group">
         <div className='form-floating mb-3'>

          <input className='form-control'
            type="text"
            id="nombre"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required />
          <label for="floatingInputDisabled" htmlFor="nombre">Nombre</label>
         </div>
        </div>

        <div className="elem-group">
         <div className='form-floating mb-3'>

          <input className='form-control'
            type="text"
            id="apellido"
            placeholder="Apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            required />
          <label for="floatingInputDisabled" htmlFor="apellido">Apellido</label>
         </div>
        </div>
        </Col>
        </Row>
        <Row className="align-items-center">
                            <Col xs="auto">
        <div className="elem-group">
        <div className='form-floating mb-3'>

          <input className='form-control'
            type="email"
            id="email"
            placeholder="ejemplo@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required/>
          <label for="floatingInputDisabled" htmlFor="email">Correo electrónico</label>
            </div>
        </div>
            <div className="elem-group">
            <div className='form-floating mb-3'>
              

                <input type="number"required id="manzana" value={manzana} onChange={(e) => setManzana(e.target.value)} name="manzana" maxlength="2" className='form-control'/>
                <label for="floatingInputDisabled" htmlFor="manzana">Manzana</label>
              </div>
              </div>
              <div className="elem-group">
            <div className='form-floating mb-3'>
                <input type="number" id="lote" value={lote} onChange={(e) => setLote(e.target.value)} name="lote" maxlength="3" className='form-control'/>
                <label for="floatingInputDisabled" htmlFor="lote">Lote</label>
                </div>
                </div>
                <div className="elem-group">
            <div className='form-floating mb-3'>
                <input type="number" id="isla" value={isla} onChange={(e) => setIsla(e.target.value)} name="isla" maxlength="3" className='form-control'/>
                <label for="floatingInputDisabled" htmlFor="isla">Isla</label>
                </div>
                </div>
                </Col>
                </Row>
                <Row className="align-items-center">
                            <Col xs="auto">
                <div className="elem-group">
                <div className='form-floating mb-3'>
                    <select className="form-select"
                      id="codPais"
                      name="codPais"
                      value={codPais}
                      onChange={(e) => setCodPais(e.target.value)}
                      required>
                        <option value="">Código de País</option>  
                        <option value="+54">Argentina (+54)</option>
                        <option value="+598">Uruguay (+598)</option>
                        <option value="+55">Brasil (+55)</option>
                        <option value="+56">Chile (+56)</option>
                        <option value="+57">Colombia (+57)</option>
                        <option value="+1">EE. UU. (+1)</option>
                        <option value="+1">Canadá (+1)</option>
                        <option value="+52">México (+52)</option>
                        <option value="+34">España (+34)</option>
                        <option value="+44">Reino Unido (+44)</option>
                        <option value="+49">Alemania (+49)</option>
                        <option value="+33">Francia (+33)</option>
                        <option value="+39">Italia (+39)</option>
                        <option value="+41">Suiza (+41)</option>
                    </select> 

                <input type="text" id="tel" value={tel} onChange={(e) => setTel(e.target.value)} name="tel" placeholder="11-XXXX-XXXX" className="form-select"/>
                <label for="floatingInputDisabled" htmlFor="tel">Teléfono</label>
               </div>
                </div>
                <div className="elem-group form-floating mb-3">
                <RolSelect />
                
            </div>

            <div className='elem-group form-floating mb-3'>
          <input className='form-control'
            type="password"
            id="contrasena"
            placeholder="XXXXXXXX"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            minLength={6}
            required />
          <label for="floatingInputDisabled" htmlFor="contrasena">Contraseña</label>
        </div>
        <div className='elem-group form-floating mb-3'>
          <input className='form-control'
            type="password"
            id="repetirContrasena"
            placeholder="XXXXXXXX"
            value={repetirContrasena}
            onChange={(e) => setRepetirContrasena(e.target.value)}
            required />
          <label for="floatingInputDisabled" htmlFor="repetirContrasena">Repetir Contraseña</label>
        </div>
        </Col>
        </Row>
        <button type="submit" className="btn btn-primary">
          Registrar
        </button>
      </form>
    </div> 
    );
  }
