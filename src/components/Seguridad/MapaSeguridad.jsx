import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { db } from '../../firebaseConfig/firebase'; // Ajusta la ruta según tu estructura de proyecto
import { collection, onSnapshot } from 'firebase/firestore';

//export const MapaSeguridad = () => {
  export const MapaSeguridad = () => {
    //const [unidades, setUnidades] = useState([]);
    const [unidades, setUnidades] = useState([
      { id: 1, name: 'Unidad 1', position: [-34.2883093, -58.77] },
      { id: 2, name: 'Unidad 2', position: [-34.2883593, -58.77] },
      { id: 3, name: 'Unidad 5-10', position: [-34.285767, -58.782887] },
      // Agrega más unidades según sea necesario
    ]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'mensajes'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newMessage = change.doc.data();
          const updatedUnidades = unidades.map((unidad) => 
            unidad.name === newMessage.unidad ? { ...unidad, position: newMessage.position } : unidad
          );
          setUnidades(updatedUnidades);
        }
      });
    });

    return () => unsubscribe();
  }, [unidades]);

  return (
    <div>
      <h2>Mapa de Unidades Funcionales</h2>
      <MapContainer center={[-34.2883093, -58.77]} zoom={13} style={{ height: '400px', width: '100%' }}>
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



