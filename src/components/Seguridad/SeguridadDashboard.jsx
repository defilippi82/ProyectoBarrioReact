import React from 'react';
import {MapaSeguridad2} from './MapaSeguridad21';
import {DashboardSeguridad} from './MapaSeguridad22';
import  { Mensajeria} from "../Services/Mensajeria";

export const SeguridadDashboard = () => {
  return (
    <div>
      <DashboardSeguridad/>
              
      <MapaSeguridad2/>
      <h3>Unidad Funcionales</h3>
      <h3>.</h3>
      
      <Mensajeria/>
      </div>
  );
};

