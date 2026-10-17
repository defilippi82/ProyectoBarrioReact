
import React, { useEffect, useState } from 'react';

const INA_BASE = 'https://alerta.ina.gob.ar/pub/datos';
const SITE_CODE = 42; // Escobar
const SERIES_ID = 42; // Serie observada: verificar en catálogo
const VAR_ID = 2;     // Altura hidrométrica
const UNIT_ID = 11;   // Metros

const INTERVALO_NORMAL = 60 * 60 * 1000;
const INTERVALO_ALERTA = 15 * 60 * 1000;

function fechaLocalISO(fecha) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function obtenerRegistros(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

function formatearFecha(fecha) {
  if (!fecha) return 'Fecha no informada';

  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;

  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const RiverNavbarBanner = () => {
  const [inaData, setInaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ultimaConsulta, setUltimaConsulta] = useState(null);

  useEffect(() => {
    let activo = true;
    let timeoutId;

    const consultarINA = async () => {
      let siguienteIntervalo = INTERVALO_NORMAL;

      try {
        const hoy = new Date();
        const haceSieteDias = new Date(hoy);
        haceSieteDias.setDate(hoy.getDate() - 7);

        // 1. Consultar el catálogo de series de Escobar.
        const paramsSeries = new URLSearchParams({
          unitId: String(UNIT_ID),
          siteCode: String(SITE_CODE),
          format: 'json',
        });

        const resSeries = await fetch(
          `${INA_BASE}/series?${paramsSeries.toString()}`,
          { cache: 'no-store' }
        );

        if (!resSeries.ok) {
          throw new Error(`Catálogo INA: HTTP ${resSeries.status}`);
        }

        const jsonSeries = await resSeries.json();
        const series = obtenerRegistros(jsonSeries);

        // Buscar altura observada en metros.
        const serieAltura = series.find((s) =>
          Number(s.sitecode ?? s.siteCode) === SITE_CODE &&
          Number(s.varid ?? s.varId) === VAR_ID &&
          Number(s.unitid ?? s.unitId) === UNIT_ID &&
          Number(s.seriesid ?? s.seriesId) === SERIES_ID
        );

        if (!serieAltura) {
          throw new Error(
            'No se encontró la serie esperada. Revisá el catálogo del INA.'
          );
        }

        // 2. Consultar los registros de los últimos siete días.
        const paramsDatos = new URLSearchParams({
          timeStart: fechaLocalISO(haceSieteDias),
          timeEnd: fechaLocalISO(hoy),
          seriesId: String(SERIES_ID),
          format: 'json',
        });

        const resDatos = await fetch(
          `${INA_BASE}/datos?${paramsDatos.toString()}`,
          { cache: 'no-store' }
        );

        if (!resDatos.ok) {
          throw new Error(`Datos INA: HTTP ${resDatos.status}`);
        }

        const jsonDatos = await resDatos.json();
        const registros = obtenerRegistros(jsonDatos);

        if (jsonDatos?.mensaje && registros.length === 0) {
          throw new Error(jsonDatos.mensaje);
        }

        const validos = registros
          .filter((r) => {
            const valor = Number(r.valor);
            const fecha = r.timestart ?? r.timeStart ?? r.fecha;

            return (
              Number.isFinite(valor) &&
              fecha &&
              !Number.isNaN(new Date(fecha).getTime())
            );
          })
          .sort((a, b) => {
            const fechaA = new Date(
              a.timestart ?? a.timeStart ?? a.fecha
            ).getTime();

            const fechaB = new Date(
              b.timestart ?? b.timeStart ?? b.fecha
            ).getTime();

            return fechaA - fechaB;
          });

        if (!validos.length) {
          throw new Error('El INA no devolvió mediciones válidas.');
        }

        const ultimo = validos[validos.length - 1];
        const anterior = validos.length > 1
          ? validos[validos.length - 2]
          : null;

        const altura = Number(ultimo.valor);
        const alturaAnterior = anterior
          ? Number(anterior.valor)
          : null;

        const diferencia = alturaAnterior !== null
          ? altura - alturaAnterior
          : null;

        const tendencia = diferencia === null
          ? 'SIN DATOS'
          : diferencia > 0.001
            ? 'CRECE'
            : diferencia < -0.001
              ? 'BAJA'
              : 'ESTABLE';

        if (!activo) return;

        setInaData({
          altura,
          fecha: ultimo.timestart ?? ultimo.timeStart ?? ultimo.fecha,
          tendencia,
          cantidadRegistros: validos.length,
        });

        setError('');
        setUltimaConsulta(new Date());

        // Actualizar más seguido si la altura alcanza 2 metros.
        if (altura >= 2) {
          siguienteIntervalo = INTERVALO_ALERTA;
        }
      } catch (e) {
        console.error('Error consultando el INA:', e);

        if (activo) {
          setError(e.message || 'No se pudieron obtener los datos.');
        }
      } finally {
        if (activo) {
          setLoading(false);
          timeoutId = setTimeout(consultarINA, siguienteIntervalo);
        }
      }
    };

    consultarINA();

    return () => {
      activo = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const altura = inaData?.altura;
  const alertaActiva = Number.isFinite(altura) && altura >= 2;

  const colorBanner = alertaActiva
    ? 'bg-danger'
    : 'bg-dark';

  return (
    <div
      className={`d-flex flex-wrap align-items-center justify-content-center gap-3 px-3 py-2 text-white ${colorBanner}`}
      style={{
        fontSize: '0.85rem',
        marginTop: '70px',
      }}
      role="status"
      aria-live="polite"
    >
      <span>
        🌊 <strong>Ríos CUBE | Escobar</strong>
      </span>

      {loading && !inaData ? (
        <span>
          <span className="spinner-border spinner-border-sm me-2" />
          Consultando INA...
        </span>
      ) : inaData ? (
        <>
          <span>
            Altura:{' '}
            <span
              className={`badge ${
                alertaActiva
                  ? 'bg-warning text-dark'
                  : 'bg-secondary'
              }`}
            >
              {altura.toFixed(2)} m
            </span>
          </span>

          <span>
            Tendencia:{' '}
            <strong>{inaData.tendencia}</strong>
          </span>

          <span>
            Medición: {formatearFecha(inaData.fecha)}
          </span>

          <span className="small">
            Actualizado: {ultimaConsulta?.toLocaleTimeString('es-AR')}
          </span>
        </>
      ) : (
        <span className="badge bg-danger">
          INA sin datos disponibles
        </span>
      )}

      {error && (
        <span className="small" title={error}>
          ⚠️ {error}
        </span>
      )}
    </div>
  );
};

export default RiverNavbarBanner;
