import React, { useEffect, useState } from "react";
import { Form, Button, Card, Row, Col, Badge } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "/src/firebaseConfig/firebase";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export const EditarPublicacion = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [range, setRange] = useState();

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, "alquileres", id));
      if (snap.exists()) {
        setForm({ id: snap.id, ...snap.data() });
      }
    };

    fetch();
  }, [id]);

  if (!form) return <p className="mt-4 text-center">Cargando...</p>;

  const handleGuardar = async () => {
    await updateDoc(doc(db, "alquileres", id), form);
    alert("Cambios guardados correctamente");
  };

  const handleEliminar = async () => {
    if (!window.confirm("¿Eliminar esta publicación?")) return;
    await deleteDoc(doc(db, "alquileres", id));
    navigate("/alquileres");
  };

  const toggleEstado = async () => {
    const nuevoEstado = form.estado === "disponible" ? "pausado" : "disponible";

    await updateDoc(doc(db, "alquileres", id), {
      estado: nuevoEstado
    });

    setForm({ ...form, estado: nuevoEstado });
  };

  const bloquearRango = async () => {
    if (!range?.from || !range?.to) return;

    const fechas = [];
    let current = new Date(range.from);

    while (current <= range.to) {
      fechas.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    const nuevasFechas = [...new Set([...(form.fechas || []), ...fechas])];

    await updateDoc(doc(db, "alquileres", id), {
      fechas: nuevasFechas
    });

    setForm({ ...form, fechas: nuevasFechas });
    setRange(null);
  };

  return (
    <Card className="p-4 mt-4 shadow-sm">
      <h3 className="mb-4 text-center border-bottom pb-2">
        Editar Publicación
      </h3>

      <Badge bg={form.estado === "pausado" ? "secondary" : "success"}>
        {form.estado}
      </Badge>

      <Button
        variant="outline-dark"
        className="mt-2 mb-4"
        onClick={toggleEstado}
      >
        {form.estado === "disponible"
          ? "Pausar Publicación"
          : "Activar Publicación"}
      </Button>

      <h5 className="border-bottom pb-1">Información General</h5>

      <Form.Control
        className="mb-3"
        value={form.titulo}
        onChange={e => setForm({ ...form, titulo: e.target.value })}
      />

      <Form.Control
        as="textarea"
        rows={3}
        className="mb-3"
        value={form.descripcion}
        onChange={e => setForm({ ...form, descripcion: e.target.value })}
      />

      <h5 className="border-bottom pb-1 mt-4">Disponibilidad</h5>

      <DayPicker
        mode="range"
        selected={range}
        onSelect={setRange}
      />

      <Button
        variant="outline-danger"
        className="mt-3"
        onClick={bloquearRango}
      >
        Bloquear rango seleccionado
      </Button>

      <div className="mt-4 d-flex gap-2">
        <Button variant="success" onClick={handleGuardar}>
          Guardar Cambios
        </Button>

        <Button variant="danger" onClick={handleEliminar}>
          Eliminar Publicación
        </Button>
      </div>
    </Card>
  );
};
