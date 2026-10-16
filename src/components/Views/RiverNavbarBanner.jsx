// src/components/Views/RiverNavbarBanner.jsx
import React, { useEffect, useState } from 'react';

export const RiverNavbarBanner = () => {
  const [inaData, setInaData] = useState(null);
  const [prefData, setPrefData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId;

    const fetchBothSources = async () => {
      try {
        // 1. Consultar fuente INA (Escobar - siteCode 42)
        const hoy = new Date().toISOString().split('T')[0];
        const haceUnaSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const resIna = await fetch(`https://alerta.ina.gob.ar/pub/datos/datos&timeStart=${haceUnaSemana}&timeEnd=${hoy}&seriesId=42&siteCode=42&varId=2&format=json`);
        
        if (resIna.ok) {
          const jsonIna = await resIna.json();
          const registros = Array.isArray(jsonIna) ? jsonIna : (jsonIna.data || []);
          const ultimo = registros[registros.length - 1];
          if (ultimo) {
            setInaData({
              altura: parseFloat(ultimo.valor),
              fecha: ultimo.timestart ? ultimo.timestart.split('T')[0] : 'Reciente'
            });
          }
        }
      } catch (e) {
        console.warn("Fuente INA no disponible:", e.message);
      }

      // 2. Fuente de Respaldo / Prefectura (Dique Luján)
      try {
        // Aquí podés conectar tu endpoint o dejar el mock seguro de respaldo
        setPrefData({
          nombre: 'Dique Luján (Prefectura)',
          altura: 1.70, 
          estado: 'CRECE',
          fecha: 'Actualizado'
        });
      } catch (e) {
        console.warn("Fuente Prefectura no disponible");
      }

      setLoading(false);

      // --- LÓGICA DE FRECUENCIA ADAPTATIVA ---
      // Determinamos la altura máxima actual entre las fuentes disponibles
      const alturaMax = Math.max(
        inaData ? inaData.altura : 0,
        prefData ? prefData.altura : 0
      );

      let intervaloMs = 2 * 60 * 60 * 1000; // Por defecto: Cada 2 horas

      if (alturaMax >= 2.50) {
        intervaloMs = 30 * 60 * 1000; // Crítico: Cada 30 minutos
      } else if (alturaMax >= 2.00) {
        intervaloMs = 60 * 60 * 1000; // Alerta: Cada 1 hora
      }

      // Programar la próxima recarga automática
      timeoutId = setTimeout(fetchBothSources, intervaloMs);
    };

    fetchBothSources();

    // Limpiar el temporizador al desmontar el componente
    return () => clearTimeout(timeoutId);
  }, []);

  if (loading) return null;

  const alturaInaVal = inaData ? inaData.altura : 0;
  const alturaPrefVal = prefData ? prefData.altura : 0;
  const alertaActiva = alturaInaVal >= 2.00 || alturaPrefVal >= 2.00;

  return (
    <div className={`d-flex flex-wrap align-items-center justify-content-center px-3 py-2 text-white ${alertaActiva ? 'bg-danger fw-bold' : 'bg-dark'}`} style={{ fontSize: '0.85rem', marginTop: '70px' }}>
      <span className="me-3">🌊 <strong>Monitoreo Ríos CUBE:</strong></span>
      
      {/* Referencia 1: INA */}
      <span className="me-3">
        INA (Escobar): {' '}
        {inaData ? (
          <span className={`badge ${inaData.altura >= 2.00 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
            {inaData.altura.toFixed(2)}m
          </span>
        ) : (
          <span className="badge bg-danger">Sin conexión</span>
        )}
      </span>

      {/* Referencia 2: Prefectura / Dique Luján */}
      <span className="me-3">
        Prefectura (Dique Luján): {' '}
        {prefData ? (
          <span className={`badge ${prefData.altura >= 2.00 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
            {prefData.altura.toFixed(2)}m ({prefData.estado})
          </span>
        ) : (
          <span className="badge bg-danger">Sin conexión</span>
        )}
      </span>
    </div>
  );
};