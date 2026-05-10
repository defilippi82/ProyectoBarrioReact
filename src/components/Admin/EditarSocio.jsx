import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig/firebase";
import { Row, Col } from 'react-bootstrap';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export const EditarSocio = () => {
    const { id } = useParams();
    const navigate = useNavigate();

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
        idPublico: "",
        barrioId: "", // Incorporado al estado inicial
        rol: { valor: 'propietario', administrador: false, propietario: true, inquilino: false, seguridad: false }
    });

    const roles = new Map([
        ['administrador', { valor: 'administrador', administrador: true, propietario: true, inquilino: true, seguridad: true }],
        ['propietario', { valor: 'propietario', administrador: false, propietario: true, inquilino: false, seguridad: false }],
        ['inquilino', { valor: 'inquilino', administrador: false, propietario: false, inquilino: true, seguridad: false }],
        ['seguridad', { valor: 'seguridad', administrador: false, propietario: false, inquilino: false, seguridad: true }],
    ]);

    useEffect(() => {
        const fetchSocio = async () => {
            try {
                const docRef = doc(db, "usuarios", id);
                const docSocio = await getDoc(docRef);
                if (docSocio.exists()) {
                    setSocio(docSocio.data());
                } else {
                    MySwal.fire("Error", "No se encontró el socio", "error");
                    navigate('/administracion');
                }
            } catch (error) {
                console.error("Error al traer documento", error);
            }
        };
        fetchSocio();
    }, [id, navigate]);

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
            // Firestore actualizará todo el objeto. 
            // Como no hay un input que modifique socio.barrioId, este se mantendrá intacto.
            await updateDoc(doc(db, "usuarios", id), socio);
            
            MySwal.fire({
                title: 'Socio actualizado',
                text: 'El perfil del socio ha sido actualizado correctamente.',
                icon: 'success',
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                navigate('/administracion');
            });
        } catch (error) {
            MySwal.fire('Error', error.message, 'error');
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
            <div className="form mb-3">
                <select
                    name="rol"
                    id="rol"
                    value={socio.rol?.valor || 'propietario'}
                    onChange={handleRolChange}
                    className="form-select"
                >
                    {Array.from(roles.keys()).map((key) => (
                        <option key={key} value={key}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                        </option>
                    ))}
                </select>
                <label htmlFor="rol">Rol del Sistema</label>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className='card text-bg-primary mb-4 shadow-sm'>
                <h2 className='card-header text-center py-3'>Editar Perfil de Socio</h2>
            </div>
          
            <form onSubmit={editarSubmit} className="card card-body shadow-sm border-0 p-4 bg-light">
                
                {/* INDICADOR DE BARRIO - AUDITORÍA */}
                <Row className="mb-4">
                    <Col md={12}>
                        <div className="alert alert-secondary d-flex align-items-center mb-0 border-secondary">
                            <strong className="me-2">Comunidad / Barrio actual:</strong> 
                            <span className="badge bg-dark fs-6 text-uppercase">
                                {socio.barrioId || 'No asignado'}
                            </span>
                            <small className="ms-auto text-muted fst-italic">Dato no modificable</small>
                        </div>
                    </Col>
                </Row>

                <h5 className="mb-3 border-bottom pb-2 text-primary">Datos Personales</h5>
                <Row>
                    <Col md={6} className="mb-3">
                        <div className="form">
                            <input type="text" className="form-control" id="nombre" name="nombre" value={socio.nombre} onChange={actualizarSocio} required />
                            <label htmlFor="nombre">Nombre</label>
                        </div>
                    </Col>
                    <Col md={6} className="mb-3">
                        <div className="form">
                            <input type="text" className="form-control" id="apellido" name="apellido" value={socio.apellido} onChange={actualizarSocio} required />
                            <label htmlFor="apellido">Apellido</label>
                        </div>
                    </Col>
                    <Col md={6} className="mb-3">
                        <div className="form">
                            <input type="email" className="form-control" id="email" name="email" value={socio.email} onChange={actualizarSocio} required />
                            <label htmlFor="email">Email</label>
                        </div>
                    </Col>
                    <Col md={6} className="mb-3">
                        <div className="form">
                            <input type="text" className="form-control" id="numerotelefono" name="numerotelefono" value={socio.numerotelefono} onChange={actualizarSocio} required />
                            <label htmlFor="numerotelefono">Teléfono</label>
                        </div>
                    </Col>
                </Row>

                <h5 className="mb-3 mt-4 border-bottom pb-2 text-primary">Ubicación en el Barrio</h5>
                <Row>
                    <Col md={4} className="mb-3">
                        <div className="form">
                            <input type="number" className="form-control" id="manzana" name="manzana" value={socio.manzana} onChange={actualizarSocio} required />
                            <label htmlFor="manzana">Manzana</label>
                        </div>
                    </Col>
                    <Col md={4} className="mb-3">
                        <div className="form">
                            <input type="number" className="form-control" id="lote" name="lote" value={socio.lote} onChange={actualizarSocio} required />
                            <label htmlFor="lote">Lote</label>
                        </div>
                    </Col>
                    <Col md={4} className="mb-3">
                        <div className="form">
                            <input type="number" className="form-control" id="isla" name="isla" value={socio.isla} onChange={actualizarSocio} required />
                            <label htmlFor="isla">Isla</label>
                        </div>
                    </Col>
                </Row>

                <h5 className="mb-3 mt-4 border-bottom pb-2 text-primary">Seguridad y Acceso</h5>
                <Row>
                    <Col md={4} className="mb-3">
                        <div className="form">
                            <input type="text" className="form-control" id="contrasena" name="contrasena" value={socio.contrasena} onChange={actualizarSocio} required />
                            <label htmlFor="contrasena">Contraseña</label>
                        </div>
                    </Col>
                    <Col md={4} className="mb-3">
                        <div className="form">
                            <input type="text" className="form-control" id="idPublico" name="idPublico" value={socio.idPublico} onChange={actualizarSocio} required />
                            <label htmlFor="idPublico">ID Público (QR)</label>
                        </div>
                    </Col>
                    <Col md={4} className="mb-3">
                        <RolSelect />
                    </Col>
                </Row>

                <div className="d-flex gap-3 mt-4">
                    <button type="button" className="btn btn-secondary btn-lg flex-grow-1 shadow-sm" onClick={() => navigate('/administracion')}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary btn-lg flex-grow-1 shadow-sm">
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
};