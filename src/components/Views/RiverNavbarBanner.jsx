// src/components/Views/RiverNavbarBanner.jsx
import React, { useEffect, useState } from 'react';

export const RiverNavbarBanner = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aquí podés conectar tu endpoint de backend que hace el scraping de Prefectura.
    // Usamos datos de ejemplo sincronizados con los que pasaste:
    const fetchData = async () => {
      try {
        // const res = await fetch('/api/rio-status');
        // const json = await res.json();
        // setData(json);
        
        setData([
          { id: '359', nombre: 'Campana', altura: 1.20, estado: 'CRECE', fecha: '16/OCT - 00:00' },
          { id: '360', nombre: 'Dique Luján', altura: 1.70, estado: 'CRECE', fecha: '16/OCT - 00:00' }
        ]);
      } catch (error) {
        console.error("Error al obtener estado del río", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return null;

  // Detecta si alguno supera o iguala el umbral de alerta de 2.00m
  const alertaActiva = data.some((p) => p.altura >= 2.00);

  return (
    <div className={`d-flex align-items-center justify-content-center px-3 py-2 text-white ${alertaActiva ? 'bg-danger fw-bold' : 'bg-dark'}`} style={{ fontSize: '0.85rem', marginTop: '70px' }}>
      <span className="me-2">🌊 <strong>Ríos CUBE:</strong></span>
      {data.map((puerto) => {
        const esAlerta = puerto.altura >= 2.00;
        return (
          <span key={puerto.id} className="me-3">
            {puerto.nombre}: <span className={esAlerta ? 'badge bg-warning text-dark' : 'badge bg-secondary'}>{puerto.altura.toFixed(2)}m</span> ({puerto.estado})
          </span>
        );
      })}
    </div>
  );
};