import React, { useEffect, useState, useContext } from "react";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig/firebase";
import { UserContext } from "./UserContext";
import { Card, Button, Badge, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { formatPrecio } from "/src/utils/formatters"; 

export const MisPublicaciones = () => {
  const { userData } = useContext(UserContext);
  const [mis, setMis] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Es vital filtrar por propietario Y barrio para mayor seguridad y velocidad
    if (!userData?.id || !userData?.barrioId) return;

    const fetchPublicaciones = async () => {
      const q = query(
        collection(db, "alquileres"),
        where("propietarioId", "==", userData.id),
        where("barrioId", "==", userData.barrioId)
      );
      const snap = await getDocs(q);
      setMis(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchPublicaciones();
  }, [userData]);

  const handleDelete = async (id) => {
    // Usamos el hook de SweetAlert (MySwal) si lo tenés configurado globalmente,
    // o confirm estándar como tenías.
    if (!window.confirm("¿Seguro que deseas eliminar esta publicación?")) return;
    try {
      await deleteDoc(doc(db, "alquileres", id));
      setMis(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error("Error eliminando:", e);
    }
  };

  if (!mis.length) return <p className="mt-4 text-center text-muted">Aún no has realizado ninguna publicación.</p>;

  return (
    <div className="mt-4">
      {/* --- VISTA ESCRITORIO --- */}
      <div className="d-none d-md-block shadow-sm rounded overflow-hidden">
        <Table hover responsive className="bg-white align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Aviso</th>
              <th>Estado</th>
              <th>Precio</th>
              <th>Capacidad</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mis.map(a => (
              <tr key={a.id}>
                <td className="fw-bold">{a.titulo}</td>
                <td>
                  <Badge bg={a.estado === "pausado" ? "secondary" : "success"}>
                    {a.estado}
                  </Badge>
                </td>
                <td>{formatPrecio(a.precio)}</td>
                <td>{a.capacidad} pers.</td>
                <td className="text-end">
                  <Button variant="outline-primary" size="sm" className="me-2" onClick={() => navigate(`/editar-publicacion/${a.id}`)}>Editar</Button>
                  <Button variant="outline-danger" size="sm" onClick={() => handleDelete(a.id)}>Eliminar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* --- VISTA MÓVIL --- */}
      <div className="d-md-none">
        {mis.map(a => (
          <Card key={a.id} className="mb-3 border-0 shadow-sm border-start border-4 border-primary rounded-0 mx-n3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="fw-bold mb-0">{a.titulo}</h6>
                <Badge bg={a.estado === "pausado" ? "secondary" : "success"}>{a.estado}</Badge>
              </div>
              <div className="small text-muted mb-3">
                <p className="mb-1">💰 {formatPrecio(a.precio)}</p>
                <p className="mb-1">👥 Capacidad: {a.capacidad} personas</p>
              </div>
              <div className="d-flex gap-2">
                <Button variant="primary" size="sm" className="w-100" onClick={() => navigate(`/editar-publicacion/${a.id}`)}>Editar</Button>
                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(a.id)}>Eliminar</Button>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
};