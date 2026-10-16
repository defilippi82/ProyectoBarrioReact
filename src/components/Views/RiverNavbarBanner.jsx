// src/components/Views/RiverNavbarBanner.jsx
import React, { useEffect, useState } from 'react';

export const RiverNavbarBanner = () => {
  const [inaData, setInaData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId;

    const fetchUltimoDatoIna = async () => {
      try {
        // PASO 1: Consultamos la serie 42 de Escobar para saber la fecha del último registro oficial
        const resSeries = await fetch('https://alerta.ina.gob.ar/pub/datos/series&siteCode=42&format=json');
        if (!resSeries.ok) throw new Error('Error al conectar con el catálogo del INA');
        
        const jsonSeries = await resSeries.json();
        // Buscamos la serie de altura hidrométrica (habitualmente la de ID 42 o varId 2)
        const serieAltura = jsonSeries.find(s => s.seriesid === 42 || s.varid === 2);
        
        if (!serieAltura || !serieAltura.to_date) throw new Error('No se encontró fecha de último registro');

        // Extraemos la fecha hasta el día de hoy (ej: "2026-10-16")
        const fechaFin = serieAltura.to_date.split('T')[0];
        
        // Calculamos una fecha de inicio de 5 días antes para asegurar tener un array de datos
        const d = new Date(fechaFin);
        d.setDate(d.getDate() - 5);
        const fechaInicio = d.toISOString().split('T')[0];

        // PASO 2: Consultamos los datos con el rango dinámico exacto
        const urlDatos = `https://alerta.ina.gob.ar/pub/datos/datos&timeStart=${fechaInicio}&timeEnd=${fechaFin}&seriesId=42&siteCode=42&varId=2&format=json`;
        
        const resDatos = await fetch(urlDatos);
        if (!resDatos.ok) throw new Error('Error al obtener los datos de altura');

        const jsonDatos = await resDatos.json();
        const registros = Array.isArray(jsonDatos) ? jsonDatos : (jsonDatos.data || []);

        if (registros.length === 0) throw new Error('Array de registros vacío');

        // PASO 3: Tomamos el ÚLTIMO elemento del array (el más fresco)
        const ultimoRegistro = registros[registros.length - 1];
        const alturaActual = parseFloat(ultimoRegistro.valor);
        const fechaRegistro = ultimoRegistro.timestart ? ultimoRegistro.timestart.split('T')[0] : fechaFin;

        setInaData({
          nombre: 'Escobar (INA)',
          altura: alturaActual,
          estado: alturaActual >= 2.00 ? 'ALERTA' : 'Normal',
          fecha: fechaRegistro
        });
        setLoading(false);

        // --- FRECUENCIA ADAPTATIVA ---
        let intervaloMs = 2 * 60 * 60 * 1000; // Cada 2 horas por defecto
        if (alturaActual >= 2.50) {
          intervaloMs = 30 * 60 * 1000; // Cada 30 min (Crítico)
        } else if (alturaActual >= 2.00) {
          intervaloMs = 60 * 60 * 1000; // Cada 1 hora (Alerta)
        }

        timeoutId = setTimeout(fetchUltimoDatoIna, intervaloMs);

      } catch (error) {
        console.error("Error al obtener la altura del INA:", error.message);
        // Reintentar en 15 minutos si falla
        timeoutId = setTimeout(fetchUltimoDatoIna, 15 * 60 * 1000);
      } finally {
        setLoading(false);
      }
    };

    fetchUltimoDatoIna();

    return () => clearTimeout(timeoutId);
  }, []);

  if (loading) return null;

  const alertaActiva = inaData && inaData.altura >= 2.00;

  return (
    <div className={`d-flex align-items-center justify-content-center px-3 py-2 text-white ${alertaActiva ? 'bg-danger fw-bold' : 'bg-dark'}`} style={{ fontSize: '0.85rem', marginTop: '70px' }}>
      <span className="me-2">🌊 <strong>Monitoreo Río Escobar (INA):</strong></span>
      {inaData ? (
        <span>
          {inaData.nombre}: <span className={`badge ${inaData.altura >= 2.00 ? 'bg-warning text-dark' : 'bg-secondary'}`}>{inaData.altura.toFixed(2)}m</span> ({inaData.estado}) - <small>{inaData.fecha}</small>
        </span>
      ) : (
        <span className="badge bg-danger">Sin conexión oficial</span>
      )}
    </div>
  );
};