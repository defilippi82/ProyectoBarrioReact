import {useState,useEffect} from "react";
import {Link, useNavigate} from "react-router-dom";
import {collection,getDocs,deleteDoc,doc, Timestamp} from "firebase/firestore";
import {db} from "../firebaseConfig/firebase";


/* SWEET ALERT*/
import Swal from "sweetalert2";
import whitReactContent from "sweetalert2-react-content";
import { get } from "firebase/database";
const mySwal = whitReactContent(Swal)

export const Administracion = ()=>{

    const [socios, setSocios] = useState([]);

    const sociosCollection = collection(db,"usuarios");
    const [reservas, setReservas] = useState([]);

    const reservasCollection = collection(db,"reservas");
    
    const navigate = useNavigate();

    
    useEffect(()=>{
        const getSocios = async()=>{
            const data = await getDocs(sociosCollection);
            //console.log(data);
            setSocios(
                data.docs.map((doc)=>({
                    ...doc.data(), id:doc.id
        }))
        );
        }; getSocios()
    },[])
    const confirmDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "socios", id));
            setSocios(socios.filter((socio) => socio.id !== id));
            mySwal.fire({

                title:"¡Borrado!",
                text:"Tu socio ha sido eliminada.",
                icon:"success",
                showConfirmButton: true
            });
        } catch (error) {
            mySwal.fire({
               title: "Error",
                text:"Ha ocurrido un error al intentar borrar la socio.",
                icon:"error"
        });
        }
    };
    useEffect(()=>{
        const getReservas = async()=>{
            const data = await getDocs(reservasCollection);
            //console.log(data);
            setReservas(
                data.docs.map((doc)=>({
                    ...doc.data(),
                     id:doc.id, 
                     fecha: doc.data().fecha instanceof Timestamp
            ? doc.data().fecha.toDate().toLocaleString()
            : new Date(doc.data().fecha).toLocaleString()
        }))
        );
        }; getReservas()
    },[])
    const confirmReservaDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "reservas", id));
            setReservas(reservas.filter((reserva) => reserva.id !== id));
            mySwal.fire({
               title: "¡Borrado!",
               text: "Tu reserva ha sido eliminada.",
                icon:"success",
                showConfirmButton: true
            }).then(() => {
        // Redirigir al usuario a otra página después de la alerta
        navigate('/administracion');
        //window.location = '/reservas';
      });
        } catch (error) {
            mySwal.fire(
                "Error",
                "Ha ocurrido un error al intentar borrar la reserva.",
                "error"
            );
        }
    };

    return (
        <>
        <div className="container">
            <div className="row">
                <div className="col">
                    <div className="d-grid gap-2 col-6 mx-auto">
                        
                        <Link to ="/socios/create" className="btn btn-secondary mt-2 mb-2"> CREAR </Link>

                    </div>
                    <table className="table table-dark table-hover">
                        <thead>
                            <tr>
                                <td>Nombre</td>
                                <td>Apellido</td>
                                <td>Email</td>
                                <td>Contraseña</td>
                                <td>Acciones</td>
                            </tr>
                        </thead>
                        <tbody>
                            {socios.map((socio) => (
                            <tr key={socio.id}>
                                <td>{socio.nombre}</td>
                                <td>{socio.apellido}</td>
                                <td>{socio.email}</td>
                                <td>{socio.contrasena}</td>
                                <td>
                                    <Link to ={`/socios/edit/${socio.id}`} className="btn btn-light"><i className="fa-solid fa-pen-to-square"></i></Link>
                                    <button className="btn btn-danger" onClick={()=>confirmDelete(socio.id)}><i className="fa-solid fa-trash"></i></button>
                                </td>
                                </tr>
                               )) }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div className="container">
            <div className="row">
                <div className="col">
                    <div className="d-grid gap-2 col-6 mx-auto">
                    <Link to="/reservas/create" className="btn btn-secondary mt-2 mb-2">Crear Reserva</Link>
                    
                    </div>
                    <table className="table table-dark table-hover">
                        <thead>
                            <tr>
                                <td>Socio</td>
                                <td>Fecha</td>
                                <td>Cancha</td>
                                <td>Acciones</td>
                            </tr>
                        </thead>
                        <tbody>
                            {reservas.map((reserva) => (
                            <tr key={reserva.id}>
                                <td>{reserva.apellido}</td>
                                <td>{reserva.fecha}</td>
                                <td>{reserva.cancha}</td>
                                <td>
                                    <Link to ={`/reservas/edit/${reserva.id}`} className="btn btn-light"><i className="fa-solid fa-pen-to-square"></i></Link>
                                    <button className="btn btn-danger" onClick={()=>confirmReservaDelete(reserva.id)}><i className="fa-solid fa-trash"></i></button>
                                </td>
                                </tr>
                               )) }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>



        </>
    )
}