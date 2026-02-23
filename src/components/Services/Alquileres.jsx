import React, { useState } from "react";
import { Container, Tabs, Tab } from "react-bootstrap";
import { CrearAlquiler } from "./CrearAlquiler";
import { ExplorarAlquileres } from "./ExplorarAlquileres";
import { MisPublicaciones } from "./MisPublicaciones";

export const Alquileres = () => {
  const [key, setKey] = useState("explorar");

  return (
    <Container className="mt-4">
      <h2 className="text-center mb-4">Alquileres Internos</h2>

      <Tabs activeKey={key} onSelect={(k) => setKey(k)}>
        <Tab eventKey="explorar" title="Avisos">
          <ExplorarAlquileres />
        </Tab>

        <Tab eventKey="crear" title="Publicar">
          <CrearAlquiler />
        </Tab>

        <Tab eventKey="mis" title="Mis Publicaciones">
          <MisPublicaciones />
        </Tab>
      </Tabs>
    </Container>
  );
};