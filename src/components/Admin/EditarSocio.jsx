import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig/firebase";
import { Form, Table, Button, FloatingLabel, Row, Col, Pagination } from 'react-bootstrap';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export const EditarSocio = () => {
    const {id} = useParams();
    const [socio, setSocio] = useState({
        nombre: "",
        apellido: "",
        email: "",
        contrasena: "",
        administrador: "",
        manzana: "",
        lote: "",
        isla: "",
        numerotelefono: "",
        rol: { valor: 'propietario', administrador: false, propietario: true, inquilino: false, guardia: false }
    });
    const roles = new Map([
        ['administrador', { valor: 'administrador', administrador: true, propietario: true, inquilino: true, guardia: true }],
        ['propietario', { valor: 'propietario', administrador: false, propietario: true, inquilino: false, guardia: false }],
        ['inquilino', { valor: 'inquilino', administrador: false, propietario: false, inquilino: true, guardia: false }],
        ['guardia', { valor: 'guardia', administrador: false, propietario: false, inquilino: false, guardia: true }],
      ]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSocio = async () => {
            try {
                const docId = doc(db, "usuarios", id);
                const docSocio = await getDoc(docId);
                if (docSocio.exists()) {
                    setSocio(docSocio.data());
                } else {
                    console.log("No hay Socios requeridos!");
                }
            } catch (error) {
                console.error("Error al traer documento", error);
            }
        };
        fetchSocio();
    }, [id]);

    const actualizarSocio = (e) => {
        const { name, value } = e.target;
        setSocio({
            ...socio,
            [name]: value
        });
    };

    const editarSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateDoc(doc(db, "usuarios", id), socio)
            .then(() => {
                MySwal.fire({
                    title: 'Socio actualizado',
                    text: 'El Socio ha sido actualizado correctamente',
                    icon: 'success',
                    showConfirmButton: false,
                }).then(() => {
                    navigate('/administracion');
                });
            });
            console.log("Socio editado!");
        } catch (error) {
            MySwal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                showConfirmButton: true,
            });
            console.error("Error al editar el socio: ", error);
        }
    };
    const RolSelect = () => {
        const handleRolChange = (e) => {
          const nuevoRol = roles.get(e.target.value);
          setSocio({
            ...socio,
            rol: nuevoRol
          });
        };
      
        return (
          <div className="elem-group form-floating mb-3">
            <select
              name="rol"
              id="rol"
              value={socio.rol.valor}
              onChange={handleRolChange}
              className="form-select"
            >
              {Array.from(roles.keys()).map((key) => (
                <option key={key} value={key} >
                  {key}
                </option>
              ))}
            </select>
            <label htmlFor="rol">Rol</label>
          </div>
        );
    }

    return (
        <div className="container ">
            <h1>Editar Socio</h1>
          
            
            <form onSubmit={editarSubmit} style={{ backgroundColor: '#f0f0f0', padding: '20px', borderRadius: '10px' }}>
            <Row className="align-items-center">
            <Col xs="auto">
                <div className="form-group">
                    <label htmlFor="nombre">Nombre</label>
                    <input type="text" className="form-control" id="nombre" name="nombre" value={socio.nombre} onChange={actualizarSocio} required />
                </div>
                </Col>
                <Col xs="auto">

                <div className="form-group">
                    <label htmlFor="apellido">Apellido</label>
                    <input type="text" className="form-control" id="apellido" name="apellido" value={socio.apellido} onChange={actualizarSocio} required />
                </div>
                </Col>
                <Col xs="auto">
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="text" className="form-control" id="email" name="email" value={socio.email} onChange={actualizarSocio} required />
                </div>
                </Col>
                <Col xs="auto">
                <div className="form-group">
                    <label htmlFor="manzana">Manzana</label>
                    <input type="number" className="form-control" id="manzana" name="manzana" value={socio.manzana} onChange={actualizarSocio} required maxLength={2} />
                </div>
                </Col>
                <Col xs="auto">
                <div className="form-group">
                    <label htmlFor="lote">Lote</label>
                    <input type="number" className="form-control" id="lote" name="lote" value={socio.lote} onChange={actualizarSocio} required maxLength={3} />
                </div>
                </Col>
                <Col xs="auto">
                <div className="form-group">
                    <label htmlFor="isla">Isla</label>
                    <input type="number" className="form-control" id="isla" name="isla" value={socio.isla} onChange={actualizarSocio} required maxLength={3} />
                </div>
                </Col>
                </Row>
                <Row className="align-items-center">
                <Col xs="auto">
                <div className="form-group">
                    <label htmlFor="contrasena">Contraseña</label>
                    <input type="password" className="form-control" id="contrasena" name="contrasena" value={socio.contrasena} onChange={actualizarSocio} required />
                </div>
                </Col>
                <Col xs="auto">
                <div className="form-group">
                    <label htmlFor="numerotelefono">Número de teléfono</label>
                    <input type="text" className="form-control" id="numerotelefono" name="numerotelefono" value={socio.numerotelefono} onChange={actualizarSocio} required />
                </div>
                </Col>
                <Col xs="auto">
                <div className="form-group form-check">
                <RolSelect />
                </div>
                </Col>
                <Col xs="auto">
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                </Col>
                </Row>
            </form>
            
        </div>
           
    );
};