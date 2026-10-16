// src/components/Views/RiverNavbarBanner.jsx
import React, { useEffect, useState } from 'react';

export const RiverNavbarBanner = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId;

    const fetchInaEscobar = async () => {
      try {
        // Obtenemos la fecha actual y de hace 7 días para armar dinámicamente el rango
        const hoy = new Date().toISOString().split('T')[0];
        const haceUnaSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const url = `https://alerta.ina.gob.ar/pub/datos/datos&timeStart=${haceUnaSemana}&timeEnd=${hoy}&seriesId=42&siteCode=42&varId=2&format=json`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al conectar con la API del INA');
        
        const json = await response.json();
        
        // El array de mediciones viene en la propiedad o como parte del JSON de datos
        // Tomamos el último registro de la lista (el más reciente)
        const registros = Array.isArray(json) ? json : (json.data || []);
        const ultimaMedicion = registros[registros.length - 1];

        if (!ultimaMedicion) throw new Error('Sin datos en la respuesta');

        const alturaActual = parseFloat(ultimaMedicion.valor);
        const fechaRegistro = ultimaMedicion.timestart ? ultimaMedicion.timestart.split('T')[0] : 'Hoy';

        setData([
          { 
            id: '42', 
            nombre: 'Escobar (Río Luján)', 
            altura: alturaActual, 
            estado: alturaActual >= 2.00 ? 'ALERTA' : 'Normal', 
            fecha: fechaRegistro 
          }
        ]);
        setLoading(false);

        // --- LÓGICA DE FRECUENCIA ADAPTATIVA ---
        let intervaloMs = 2 * 60 * 60 * 1000; // Por defecto: Cada 2 horas
        if (alturaActual >= 2.50) {
          intervaloMs = 30 * 60 * 1000; // Crítico: Cada 30 minutos
        } else if (alturaActual >= 2.00) {
          intervaloMs = 60 * 60 * 1000; // Alerta: Cada 1 hora
        }

        timeoutId = setTimeout(fetchInaEscobar, intervaloMs);

      } catch (error) {
        console.error("Error al obtener datos de Escobar desde el INA:", error);
        timeoutId = setTimeout(fetchInaEscobar, 15 * 60 * 1000); // Reintento en 15 min si falla
      } finally {
        setLoading(false);
      }
    };

    fetchInaEscobar();

    return () => clearTimeout(timeoutId);
  }, []);

  if (loading) return null;

  const alertaActiva = data.some((p) => p.altura >= 2.00);

  return (
    <div className={`d-flex align-items-center justify-content-center px-3 py-2 text-white ${alertaActiva ? 'bg-danger fw-bold' : 'bg-dark'}`} style={{ fontSize: '0.85rem', marginTop: '70px' }}>
      <span className="me-2">🌊 <strong>Ríos CUBE (INA):</strong></span>
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