

import React, { useEffect, useState } from 'react';

const INA_BASE = 'https://alerta.ina.gob.ar/pub/datos';

const INTERVALO_NORMAL = 2 * 60 * 60 * 1000; // 2 horas
const INTERVALO_ALERTA = 60 * 60 * 1000;     // 1 hora
const INTERVALO_CRITICO = 30 * 60 * 1000;    // 30 minutos
const INTERVALO_ERROR = 15 * 60 * 1000;      // 15 minutos

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

function obtenerFecha(registro) {
  return (
    registro.timestart ??
    registro.timeStart ??
    registro.timestamp ??
    registro.fecha ??
    null
  );
}

function formatearFecha(fecha) {
  if (!fecha) return 'Fecha no informada';

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) return String(fecha);

  return date.toLocaleString('es-AR', {
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
      let siguienteIntervalo = INTERVALO_ERROR;

      try {
        // 1. Consultar el catálogo de series de Escobar.
        // Se conserva el formato que funcionaba en tu código anterior.
        const urlSeries =
          `${INA_BASE}/series&siteCode=42&format=json`;

        const resSeries = await fetch(urlSeries, {
          cache: 'no-store',
        });

        if (!resSeries.ok) {
          throw new Error(
            `Error en catálogo INA: HTTP ${resSeries.status}`
          );
        }

        const jsonSeries = await resSeries.json();
        const series = obtenerRegistros(jsonSeries);

        console.log('Series disponibles del INA:', series);

        // Seleccionar la serie de altura hidrométrica.
        // Se prioriza la serie 42 y variable 2, como en tu código.
        const serieAltura =
          series.find(
            (s) =>
              Number(s.seriesid ?? s.seriesId) === 42 &&
              Number(s.varid ?? s.varId) === 2
          ) ??
          series.find(
            (s) => Number(s.varid ?? s.varId) === 2
          );

        if (!serieAltura) {
          throw new Error(
            'No se encontró la serie de altura de Escobar.'
          );
        }

        // 2. Calcular el período a consultar.
        const fechaFin =
          serieAltura.to_date?.split('T')[0] ||
          fechaLocalISO(new Date());

        const fechaInicioDate = new Date(`${fechaFin}T12:00:00`);
        fechaInicioDate.setDate(fechaInicioDate.getDate() - 7);

        const fechaInicio = fechaLocalISO(fechaInicioDate);

        // 3. Consultar las mediciones.
        // Conservamos la sintaxis de URL del código anterior.
        const urlDatos =
          `${INA_BASE}/datos&timeStart=${fechaInicio}` +
          `&timeEnd=${fechaFin}` +
          `&seriesId=${serieAltura.seriesid ?? serieAltura.seriesId}` +
          `&siteCode=42&varId=2&format=json`;

        console.log('URL consultada al INA:', urlDatos);

        const resDatos = await fetch(urlDatos, {
          cache: 'no-store',
        });

        if (!resDatos.ok) {
          throw new Error(
            `Error al obtener mediciones INA: HTTP ${resDatos.status}`
          );
        }

        const jsonDatos = await resDatos.json();

        console.log('Respuesta de mediciones INA:', jsonDatos);

        const registros = obtenerRegistros(jsonDatos);

        if (registros.length === 0) {
          throw new Error(
            jsonDatos?.mensaje ||
            jsonDatos?.message ||
            'El INA no devolvió mediciones para el período.'
          );
        }

        // 4. Filtrar mediciones válidas y ordenar por fecha.
        const validos = registros
          .filter((registro) => {
            const valor = Number(registro.valor);
            const fecha = obtenerFecha(registro);

            return (
              registro.valor !== null &&
              registro.valor !== undefined &&
              registro.valor !== '' &&
              Number.isFinite(valor) &&
              fecha &&
              !Number.isNaN(new Date(fecha).getTime())
            );
          })
          .sort((a, b) => {
            return (
              new Date(obtenerFecha(a)).getTime() -
              new Date(obtenerFecha(b)).getTime()
            );
          });

        if (validos.length === 0) {
          throw new Error(
            'La respuesta del INA no contiene mediciones válidas.'
          );
        }

        // 5. Obtener la última medición.
        const ultimo = validos[validos.length - 1];

        const anterior =
          validos.length > 1
            ? validos[validos.length - 2]
            : null;

        const altura = Number(ultimo.valor);

        const alturaAnterior = anterior
          ? Number(anterior.valor)
          : null;

        const diferencia =
          alturaAnterior !== null
            ? altura - alturaAnterior
            : null;

        const tendencia =
          diferencia === null
            ? 'SIN DATOS'
            : diferencia > 0.001
              ? 'CRECE'
              : diferencia < -0.001
                ? 'BAJA'
                : 'ESTABLE';

        if (!activo) return;

        setInaData({
          nombre: 'Escobar (INA)',
          altura,
          fecha: obtenerFecha(ultimo),
          tendencia,
          estado: altura >= 2.5
            ? 'CRÍTICO'
            : altura >= 2
              ? 'ALERTA'
              : 'Normal',
          cantidadRegistros: validos.length,
        });

        setError('');
        setUltimaConsulta(new Date());

        // 6. Frecuencia de actualización adaptativa.
        if (altura >= 2.5) {
          siguienteIntervalo = INTERVALO_CRITICO;
        } else if (altura >= 2) {
          siguienteIntervalo = INTERVALO_ALERTA;
        } else {
          siguienteIntervalo = INTERVALO_NORMAL;
        }
      } catch (e) {
        console.error('Error al obtener la altura del INA:', e);

        if (activo) {
          setError(e.message || 'No se pudieron obtener los datos.');
        }

        siguienteIntervalo = INTERVALO_ERROR;
      } finally {
        if (activo) {
          setLoading(false);
          timeoutId = setTimeout(
            consultarINA,
            siguienteIntervalo
          );
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

  const alertaActiva =
    Number.isFinite(altura) && altura >= 2;

  const estadoCritico =
    Number.isFinite(altura) && altura >= 2.5;

  const colorBanner = estadoCritico
    ? 'bg-danger fw-bold'
    : alertaActiva
      ? 'bg-warning text-dark fw-bold'
      : 'bg-dark text-white';

  return (
    <div
      className={`d-flex flex-wrap align-items-center justify-content-center gap-3 px-3 py-2 ${colorBanner}`}
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
                  ? 'bg-danger'
                  : 'bg-secondary'
              }`}
            >
              {altura.toFixed(2)} m
            </span>
          </span>

          <span>
            Estado: <strong>{inaData.estado}</strong>
          </span>

          <span>
            Tendencia: <strong>{inaData.tendencia}</strong>
          </span>

          <span>
            Medición: {formatearFecha(inaData.fecha)}
          </span>

          <span className="small">
            Consulta: {ultimaConsulta
              ? ultimaConsulta.toLocaleTimeString('es-AR')
              : '--:--'}
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
