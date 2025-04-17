import React from 'react';
import {MapaSeguridad2} from './MapaSeguridad21';
import {DashboardSeguridad} from './MapaSeguridad22';
import  { Mensajeria} from "../Services/Mensajeria";

export const SeguridadDashboard = () => {
  return (
    <div>
      <DashboardSeguridad/>
      <h1>Panel de Seguridad</h1>
      <MapaSeguridad2/>
      <Mensajeria/>
      </div>
  );
};

