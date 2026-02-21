import React, { useState, useContext } from "react";
import { Form, Button, Card, Row, Col, Alert } from "react-bootstrap";
import { addDoc, collection } from "firebase/firestore";
import { db } from "/src/firebaseConfig/firebase";
import { UserContext } from "./UserContext";

export const CrearAlquiler = () => {
  const { userData } = useContext(UserContext);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    valor: "",
    tipo: "dia",
    capacidad: "",
    mascotas: false,
    telefono: "",
    amenities: {
      pileta: false,
      playroom: false,
      jacuzzi: false,
      internet: false,
      cable: false,
      parrilla: false,
      camaElastica: false
    },
    modoDisponibilidad: "disponiblePorDefecto"
  });

  const handleCrear = async () => {
    try {
      if (!userData) {
        setError("Usuario no autenticado");
        return;
      }

      if (!form.titulo || !form.valor) {
        setError("Título y precio son obligatorios");
        return;
      }

      const nuevo = {
        propietarioId: userData.id || null,
        propietarioNombre: userData.nombre || "",
        isla: userData.isla || "",
        manzana: userData.manzana || "",
        lote: userData.lote || "",

        titulo: form.titulo,
        descripcion: form.descripcion,

        precio: {
          valor: Number(form.valor),
          tipo: form.tipo
        },

        capacidad: Number(form.capacidad) || 0,
        mascotas: form.mascotas,

        contacto: {
          email: userData.email || "",
          telefono: form.telefono || ""
        },

        amenities: form.amenities,

        estado: "disponible",
        modoDisponibilidad: form.modoDisponibilidad,
        fechas: [],

        ratings: [],
        promedioRating: 0,
        totalRatings: 0,

        createdAt: new Date()
      };

      await addDoc(collection(db, "alquileres"), nuevo);

      alert("Publicación creada correctamente");

      setForm({
        titulo: "",
        descripcion: "",
        valor: "",
        tipo: "dia",
        capacidad: "",
        mascotas: false,
        telefono: "",
        amenities: {
          pileta: false,
          playroom: false,
          jacuzzi: false,
          internet: false,
          cable: false,
          parrilla: false,
          camaElastica: false
        },
        modoDisponibilidad: "disponiblePorDefecto"
      });

      setError("");

    } catch (err) {
      console.error(err);
      setError("Error al crear la publicación");
    }
  };

  return (
    <Card className="p-4 mt-3">
      <h5>Crear Publicación</h5>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form.Control
        placeholder="Título"
        className="mb-2"
        value={form.titulo}
        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
      />

      <Form.Control
        as="textarea"
        placeholder="Descripción"
        className="mb-2"
        value={form.descripcion}
        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
      />

      <Row>
        <Col>
          <Form.Control
            type="number"
            placeholder="Precio"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
          />
        </Col>
        <Col>
          <Form.Select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="dia">Por Día</option>
            <option value="semana">Por Semana</option>
            <option value="quincena">Por Quincena</option>
          </Form.Select>
        </Col>
      </Row>

      <Form.Control
        type="number"
        placeholder="Capacidad"
        className="mt-2"
        value={form.capacidad}
        onChange={(e) => setForm({ ...form, capacidad: e.target.value })}
      />

      <Form.Check
        label="Acepta Mascotas"
        className="mt-2"
        checked={form.mascotas}
        onChange={(e) => setForm({ ...form, mascotas: e.target.checked })}
      />

      <Form.Control
        placeholder="Teléfono"
        className="mt-2"
        value={form.telefono}
        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
      />

      <hr />
      <h6>Amenities</h6>

      {Object.keys(form.amenities).map((key) => (
        <Form.Check
          key={key}
          label={key}
          checked={form.amenities[key]}
          onChange={(e) =>
            setForm({
              ...form,
              amenities: {
                ...form.amenities,
                [key]: e.target.checked
              }
            })
          }
        />
      ))}

      <hr />

      <Form.Select
        value={form.modoDisponibilidad}
        onChange={(e) =>
          setForm({ ...form, modoDisponibilidad: e.target.value })
        }
      >
        <option value="disponiblePorDefecto">
          Disponible por defecto
        </option>
        <option value="bloqueadoPorDefecto">
          Bloqueado por defecto
        </option>
      </Form.Select>

      <Button className="mt-3" onClick={handleCrear}>
        Publicar
      </Button>
    </Card>
  );
};