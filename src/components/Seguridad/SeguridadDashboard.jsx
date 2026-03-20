import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { MapaSeguridad2 } from './MapaSeguridad21';
import { DashboardSeguridad } from './MapaSeguridad22';
import { Mensajeria } from "../Services/Mensajeria";
import { useMediaQuery } from 'react-responsive';

export const SeguridadDashboard = () => {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  return (
    <Container fluid className="py-3 px-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Row className="g-4">
        {/* Sección de Indicadores / Resumen */}
        <Col xs={12}>
          <DashboardSeguridad />
        </Col>

        {/* Mapa Interactivo */}
        <Col xs={12} lg={8}>
          <Card className="shadow-sm border-0 overflow-hidden">
            <Card.Header className="bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold text-dark">Mapa de Unidades Funcionales</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <MapaSeguridad2 />
            </Card.Body>
          </Card>
        </Col>

        {/* Mensajería Integrada para Guardia */}
        <Col xs={12} lg={4}>
          <div className="h-100">
            <Mensajeria />
          </div>
        </Col>
      </Row>
    </Container>
  );
};