import React from 'react';
import {MapaSeguridad2} from './MapaSeguridad2';
import  { Mensajeria} from "../Services/Mensajeria";

export const SeguridadDashboard = () => {
  return (
    <div>
      <h1>Panel de Seguridad</h1>
      <MapaSeguridad2/>
      <Mensajeria/>
      </div>
  );
};

