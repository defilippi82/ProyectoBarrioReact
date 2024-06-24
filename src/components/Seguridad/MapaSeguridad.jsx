import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export const MapaSeguridad = () => {
  const unidades = [
    { id: 1, name: 'Unidad 1', position: [51.505, -0.09] },
    { id: 2, name: 'Unidad 2', position: [51.51, -0.1] },
    // Agrega más unidades según sea necesario
  ];

  return (
    <div>
      <h2>Mapa de Unidades Funcionales</h2>
      <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '400px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {unidades.map(unidad => (
          <Marker key={unidad.id} position={unidad.position}>
            <Popup>
              {unidad.name}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};


