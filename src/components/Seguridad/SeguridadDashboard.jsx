import React from 'react';
import {MapaSeguridad} from './MapaSeguridad';
import  { Mensajeria} from "../Services/Mensajeria";

export const SeguridadDashboard = () => {
  return (
    <div>
      <h1>Panel de Seguridad</h1>
      <MapaSeguridad/>
      <Mensajeria/>
      </div>
  );
};

