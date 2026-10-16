// src/components/Views/RiverNavbarBanner.jsx
import React, { useEffect, useState } from 'react';

export const RiverNavbarBanner = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId;

    const fetchData = async () => {
      try {
        // Consultamos la estación del INA (Dique Luján / Río Luján - ID 3275)
        const response = await fetch('https://alerta.ina.gob.ar/ws/bdhi/estaciones/3275/mediciones');
        if (!response.ok) throw new Error('Error al conectar con la API del INA');
        
        const json = await response.json();
        const ultimaMedicion = json[json.length - 1]; // Tomamos el registro más reciente

        const alturaActual = parseFloat(ultimaMedicion.valor);

        // Actualizamos el estado con los datos reales
        const puertosActualizados = [
          { 
            id: '3275', 
            nombre: 'Dique Luján (Escobar)', 
            altura: alturaActual, 
            estado: alturaActual >= 2.00 ? 'ALERTA' : 'Normal', 
            fecha: ultimaMedicion.fecha 
          }
        ];

        setData(puertosActualizados);
        setLoading(false);

        // --- LÓGICA DE FRECUENCIA ADAPTATIVA ---
        let intervaloMs = 4 * 60 * 60 * 1000; // Por defecto: Cada 4 horas

        if (alturaActual >= 2.50) {
          intervaloMs = 30 * 60 * 1000; // Crítico: Cada 30 minutos
        } else if (alturaActual >= 2.00) {
          intervaloMs = 60 * 60 * 1000; // Alerta: Cada 1 hora
        }

        // Programar la siguiente consulta dinámica
        timeoutId = setTimeout(fetchData, intervaloMs);

      } catch (error) {
        console.error("Error al obtener estado del río del INA:", error);
        // Si falla, reintentar en 15 minutos por seguridad
        timeoutId = setTimeout(fetchData, 15 * 60 * 1000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

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