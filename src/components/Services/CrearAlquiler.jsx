import React, { useState, useContext } from "react";
import { Form, Button, Card, Row, Col, Badge } from "react-bootstrap";
import { addDoc, collection } from "firebase/firestore";
import { db } from "/src/firebaseConfig/firebase";
import { UserContext } from "./UserContext";

export const CrearAlquiler = () => {
  const { userData } = useContext(UserContext);

  const [nuevaAmenity, setNuevaAmenity] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    valor: "",
    moneda: "ARS",
    tipoPrecio: "dia",
    capacidad: "",
    mascotas: false,
    telefono: "",
    amenities: [
      "Pileta",
      "Playroom",
      "Jacuzzi",
      "Internet",
      "Cable",
      "Parrilla",
      "Cama Elástica"
    ],
    amenitiesSeleccionadas: [],
    modoDisponibilidad: "disponiblePorDefecto"
  });

  const toggleAmenity = (amenity) => {
    setForm({
      ...form,
      amenitiesSeleccionadas: form.amenitiesSeleccionadas.includes(amenity)
        ? form.amenitiesSeleccionadas.filter(a => a !== amenity)
        : [...form.amenitiesSeleccionadas, amenity]
    });
  };

  const agregarAmenity = () => {
    if (!nuevaAmenity.trim()) return;

    setForm({
      ...form,
      amenities: [...form.amenities, nuevaAmenity]
    });

    setNuevaAmenity("");
  };

  const handleCrear = async () => {
    if (!userData) return alert("Debes iniciar sesión");

    const nuevo = {
      propietarioId: userData.id,
      propietarioNombre: userData.nombre,
      isla: userData.isla,
      manzana: userData.manzana,
      lote: userData.lote,

      titulo: form.titulo,
      descripcion: form.descripcion,

      precio: {
        valor: Number(form.valor),
        moneda: form.moneda,
        tipo: form.tipoPrecio
      },

      capacidad: Number(form.capacidad),
      mascotas: form.mascotas,

      contacto: {
        email: userData.email || "",
        telefono: form.telefono
      },

      amenities: form.amenitiesSeleccionadas,

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
  };

  return (
    <Card className="p-4 mt-4 shadow-sm">
      <h3 className="mb-4 text-center border-bottom pb-2">
        Crear Nueva Publicación
      </h3>

      {/* DATOS PRINCIPALES */}
      <h5 className="mt-3 border-bottom pb-1">Información General</h5>

      <Form.Control
        placeholder="Título"
        className="mb-3"
        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
      />

      <Form.Control
        as="textarea"
        rows={3}
        placeholder="Descripción"
        className="mb-3"
        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
      />

      {/* PRECIO */}
      <h5 className="mt-4 border-bottom pb-1">Precio</h5>

      <Row className="mb-3">
        <Col md={4}>
          <Form.Control
            type="number"
            placeholder="Valor"
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
          />
        </Col>

        <Col md={4}>
          <Form.Select
            onChange={(e) => setForm({ ...form, moneda: e.target.value })}
          >
            <option value="ARS">Pesos ($)</option>
            <option value="USD">Dólares (U$S)</option>
          </Form.Select>
        </Col>

        <Col md={4}>
          <Form.Select
            onChange={(e) => setForm({ ...form, tipoPrecio: e.target.value })}
          >
            <option value="dia">
              Por Día (10:00 a 20:00)
            </option>
            <option value="noche">
              Por Noche (Check-in 11hs / Check-out 17hs)
            </option>
          </Form.Select>
        </Col>
      </Row>

      {/* CAPACIDAD Y MASCOTAS */}
      <h5 className="mt-4 border-bottom pb-1">Detalles</h5>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Control
            type="number"
            placeholder="Capacidad de personas"
            onChange={(e) =>
              setForm({ ...form, capacidad: e.target.value })
            }
          />
        </Col>

        <Col md={6} className="d-flex align-items-center">
          <Form.Check
            label="Acepta Mascotas"
            onChange={(e) =>
              setForm({ ...form, mascotas: e.target.checked })
            }
          />
        </Col>
      </Row>

      <Form.Control
        placeholder="Teléfono de contacto"
        className="mb-3"
        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
      />

      {/* AMENITIES */}
      <h5 className="mt-4 border-bottom pb-1">Amenities</h5>

      <Row>
        {form.amenities.map((amenity, index) => (
          <Col xs={6} md={4} key={index} className="mb-2">
            <Form.Check
              type="checkbox"
              label={amenity}
              checked={form.amenitiesSeleccionadas.includes(amenity)}
              onChange={() => toggleAmenity(amenity)}
            />
          </Col>
        ))}
      </Row>

      <Row className="mt-3">
        <Col md={8}>
          <Form.Control
            placeholder="Agregar nueva amenity"
            value={nuevaAmenity}
            onChange={(e) => setNuevaAmenity(e.target.value)}
          />
        </Col>
        <Col md={4}>
          <Button variant="secondary" onClick={agregarAmenity} className="w-100">
            Agregar
          </Button>
        </Col>
      </Row>

      {/* DISPONIBILIDAD */}
      <h5 className="mt-4 border-bottom pb-1">Disponibilidad</h5>

      <Form.Select
        onChange={(e) =>
          setForm({ ...form, modoDisponibilidad: e.target.value })
        }
      >
        <option value="disponiblePorDefecto">
          Disponible por defecto (bloquear fechas luego)
        </option>
        <option value="bloqueadoPorDefecto">
          Bloqueado por defecto (habilitar fechas luego)
        </option>
      </Form.Select>

      <Button className="mt-4 w-100" onClick={handleCrear}>
        Publicar
      </Button>
    </Card>
  );
};