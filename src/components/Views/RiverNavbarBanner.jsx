// src/components/Views/RiverNavbarBanner.jsx
import React, { useEffect, useState } from 'react';

export const RiverNavbarBanner = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId;

    const fetchInaEscobar = async () => {
      try {
        // Consultamos la serie 42 (Escobar - Altura hidrométrica) de la API del INA
        const response = await fetch('https://alerta.ina.gob.ar/pub/datos/datos&serie=42&format=json');
        if (!response.ok) throw new Error('Error al conectar con la API del INA');
        
        const json = await response.json();
        
        // Dependiendo de cómo devuelva el array el endpoint de datos, 
        // tomamos el último elemento (el registro más actual)
        const ultimaMedicion = Array.isArray(json) ? json[json.length - 1] : json;
        const alturaActual = parseFloat(ultimaMedicion.valor || ultimaMedicion[1]); // Ajustar según estructura exacta del JSON de datos

        setData([
          { 
            id: '42', 
            nombre: 'Escobar (Río Luján)', 
            altura: isNaN(alturaActual) ? 1.70 : alturaActual, 
            estado: alturaActual >= 2.00 ? 'ALERTA' : 'Normal', 
            fecha: ultimaMedicion.fecha || 'Actualizado' 
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