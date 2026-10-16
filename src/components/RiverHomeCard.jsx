// src/components/RiverHomeCard.jsx
import React, { useEffect, useState } from 'react';
import { getRiverStatus } from '../services/riverService';

export default function RiverHomeCard() {
  const [puertos, setPuertos] = useState([]);

  useEffect(() => {
    getRiverStatus().then(setPuertos);
  }, []);

  return (
    <div className="card shadow-sm my-3 border-0">
      <div className="card-header bg-primary text-white d-flex align-items-center justify-content-between">
        <h5 className="m-0">🌊 Monitoreo de Ríos - Prefectura Naval</h5>
        <small>Campana y Dique Luján</small>
      </div>
      <div className="card-body">
        <div className="row g-3">
          {puertos.map((p) => {
            const esAlerta = p.altura >= 2.00;
            return (
              <div key={p.id} className="col-md-6">
                <div className={`p-3 rounded border ${esAlerta ? 'border-danger bg-light-danger' : 'bg-light'}`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="m-0 fw-bold">{p.nombre}</h6>
                    <span className={`badge ${esAlerta ? 'bg-danger' : 'bg-success'}`}>
                      {esAlerta ? '⚠️ ALERTA' : 'NORMAL'}
                    </span>
                  </div>
                  <div className="mt-2 fs-4 fw-bold">
                    {p.altura ? `${p.altura.toFixed(2)} Mts` : 'Sin Dato'}
                    <small className="fs-6 text-muted ms-2">({p.estado})</small>
                  </div>
                  <small className="text-muted">Último registro: {p.fecha}</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}