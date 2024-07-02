import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { db } from '../../firebaseConfig/firebase'; // Importa tu configuración de Firebase

const iconUrl = 'public/img/house.png'; // Reemplaza con la ruta correcta a tu icono
const customIcon = new L.Icon({
  iconUrl: iconUrl,
  iconSize: [25, 41], // Tamaño del icono
  iconAnchor: [12, 41], // Punto de anclaje del icono
  popupAnchor: [1, -34], // Punto de anclaje del popup
  shadowSize: [41, 41] // Tamaño de la sombra del icono
});
export const MapaSeguridad = () => {
  const [unidades, setUnidades] = useState([]);
  const [manzana, setManzana] = useState('');
  const [lote, setLote] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [filteredUnidades, setFilteredUnidades] = useState([]);

  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'unidades'));
        const unidadesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUnidades(unidadesList);
      } catch (error) {
        console.error("Error cargando unidades funcionales: ", error);
      }
    };
    fetchUnidades();
  }, []);

  const handleSearch = () => {
    const filtered = unidades.filter(unidad =>
      unidad.manzana === manzana && unidad.lote === lote
    );
    setFilteredUnidades(filtered);
  };

  const handleAddUnidad = async () => {
    if (!manzana || !lote || !lat || !lng) {
      alert("Todos los campos son obligatorios");
      return;
    }

    try {
      const nuevaUnidad = {
        manzana,
        lote,
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };

      await addDoc(collection(db, 'unidades'), nuevaUnidad);
      setUnidades([...unidades, nuevaUnidad]);
      setManzana('');
      setLote('');
      setLat('');
      setLng('');
      alert("Unidad funcional agregada exitosamente");
    } catch (error) {
      console.error("Error agregando unidad funcional: ", error);
    }
  };

  return (
    <div>
      <div>
        <h2>Buscar Unidad Funcional</h2>
        <input
          type="text"
          placeholder="Manzana"
          value={manzana}
          onChange={(e) => setManzana(e.target.value)}
        />
        <input
          type="text"
          placeholder="Lote"
          value={lote}
          onChange={(e) => setLote(e.target.value)}
        />
        <button onClick={handleSearch}>Buscar</button>
      </div>

      <div>
        <h2>Agregar Unidad Funcional</h2>
        <input
          type="text"
          placeholder="Manzana"
          value={manzana}
          onChange={(e) => setManzana(e.target.value)}
        />
        <input
          type="text"
          placeholder="Lote"
          value={lote}
          onChange={(e) => setLote(e.target.value)}
        />
        <input
          type="text"
          placeholder="Latitud"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
        />
        <input
          type="text"
          placeholder="Longitud"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
        />
        <button onClick={handleAddUnidad}>Agregar</button>
      </div>

      <MapContainer center={[-34.285767, -58.782887]} zoom={13} style={{ height: "400px", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredUnidades.map(unidad => (
          <Marker key={unidad.id} position={[unidad.lat, unidad.lng]} icon={customIcon}>
            <Popup>
              {`Manzana: ${unidad.manzana}, Lote: ${unidad.lote}`}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

