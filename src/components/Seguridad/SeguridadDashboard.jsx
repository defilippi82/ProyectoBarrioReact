import React from 'react';
import Mensajero from './Mensajero';
import MapaSeguridad from './MapaSeguridad';

export const SeguridadDashboard = () => {
  return (
    <div>
      <h1>Panel de Seguridad</h1>
      <Mensajero />
      <MapaSeguridad />
    </div>
  );
};

