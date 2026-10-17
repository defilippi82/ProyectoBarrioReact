

import { useEffect, useState } from "react";

const INA_BASE = "https://alerta.ina.gob.ar/pub/datos";

// Estaciones del catálogo hidrológico del INA.
const ESTACION_PRINCIPAL = {
  siteCode: 42,
  nombre: "Escobar",
};

const ESTACION_RESPALDO = {
  siteCode: 50,
  nombre: "Dique Luján",
};

// Intervalos de actualización.
const INTERVALO_NORMAL = 6 * 60 * 60 * 1000;
const INTERVALO_ALERTA = 60 * 60 * 1000;
const INTERVALO_CRITICO = 30 * 60 * 1000;
const INTERVALO_ERROR = 15 * 60 * 1000;

const UMBRAL_ALERTA = 2;
const UMBRAL_CRITICO = 2.5;
const TOLERANCIA_ESTABLE = 0.005;

function fechaLocalISO(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function obtenerRegistros(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;

  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.datos)) return respuesta.datos;
  if (Array.isArray(respuesta?.results)) return respuesta.results;
  if (Array.isArray(respuesta?.resultados)) {
    return respuesta.resultados;
  }

  return [];
}

function obtenerFecha(registro) {
  const posibles = [
    registro?.fecha,
    registro?.fecha_hora,
    registro?.datetime,
    registro?.timestamp,
    registro?.time,
    registro?.date,
    registro?.timestart,
    registro?.obs_time,
  ];

  const valor = posibles.find(
    (item) => item !== undefined && item !== null && item !== ""
  );

  if (!valor) return null;

  const fecha = new Date(valor);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function obtenerValor(registro) {
  const posibles = [
    registro?.valor,
    registro?.value,
    registro?.dato,
    registro?.altura,
    registro?.nivel,
    registro?.obs_value,
    registro?.result,
  ];

  for (const valor of posibles) {
    if (valor === undefined || valor === null || valor === "") continue;

    const numero =
      typeof valor === "number"
        ? valor
        : Number(String(valor).replace(",", "."));

    if (Number.isFinite(numero)) return numero;
  }

  return null;
}

function formatearFecha(fecha) {
  if (!fecha) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fecha);
}

function formatearHora(fecha) {
  if (!fecha) return "--:--";

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(fecha);
}

function obtenerEstado(altura) {
  if (altura > UMBRAL_CRITICO) {
    return {
      texto: "CRÍTICO",
      color: "#dc2626",
      intervalo: INTERVALO_CRITICO,
    };
  }

  if (altura > UMBRAL_ALERTA) {
    return {
      texto: "ALERTA",
      color: "#d97706",
      intervalo: INTERVALO_ALERTA,
    };
  }

  return {
    texto: "Normal",
    color: "#16a34a",
    intervalo: INTERVALO_NORMAL,
  };
}

function obtenerTendencia(registros) {
  if (registros.length < 2) {
    return {
      texto: "SIN DATOS",
      flecha: "→",
      color: "#64748b",
      centimetros: null,
    };
  }

  const anterior = registros[registros.length - 2].valor;
  const ultimo = registros[registros.length - 1].valor;
  const diferencia = ultimo - anterior;
  const centimetros = Math.round(Math.abs(diferencia) * 100);

  if (Math.abs(diferencia) <= TOLERANCIA_ESTABLE) {
    return {
      texto: "ESTABLE",
      flecha: "→",
      color: "#64748b",
      centimetros: 0,
    };
  }

  if (diferencia > 0) {
    return {
      texto: "CRECE",
      flecha: "↑",
      color: "#16a34a",
      centimetros,
    };
  }

  return {
    texto: "BAJA",
    flecha: "↓",
    color: "#2563eb",
    centimetros,
  };
}

async function consultarEstacion(estacion) {
  const urlSeries =
    `${INA_BASE}/series&siteCode=${estacion.siteCode}&format=json`;

  const respuestaSeries = await fetch(urlSeries, {
    cache: "no-store",
  });

  if (!respuestaSeries.ok) {
    throw new Error(`No se pudieron consultar las series de ${estacion.nombre}`);
  }

  const jsonSeries = await respuestaSeries.json();
  const series = obtenerRegistros(jsonSeries);

  // Se elige una serie de altura hidrométrica observada,
  // evitando series simuladas o de traza.
  const serie = series.find(
    (item) =>
      Number(item.sitecode ?? item.siteCode) === estacion.siteCode &&
      Number(item.varid ?? item.varId) === 2 &&
      Number(item.procid ?? item.procId) === 1 &&
      item.to_date
  );

  if (!serie) {
    throw new Error(`No se encontró una serie observada para ${estacion.nombre}`);
  }

  const hoy = new Date();
  const fechaFin = fechaLocalISO(hoy);

  const inicio = new Date(hoy);
  inicio.setDate(inicio.getDate() - 7);
  const fechaInicio = fechaLocalISO(inicio);

  const seriesId = serie.seriesid ?? serie.seriesId;

  const urlDatos =
    `${INA_BASE}/datos&timeStart=${fechaInicio}` +
    `&timeEnd=${fechaFin}` +
    `&seriesId=${seriesId}` +
    `&siteCode=${estacion.siteCode}` +
    `&varId=2&format=json`;

  const respuestaDatos = await fetch(urlDatos, {
    cache: "no-store",
  });

  if (!respuestaDatos.ok) {
    throw new Error(`No se pudieron consultar las mediciones de ${estacion.nombre}`);
  }

  const jsonDatos = await respuestaDatos.json();

  const registros = obtenerRegistros(jsonDatos)
    .map((registro) => ({
      fecha: obtenerFecha(registro),
      valor: obtenerValor(registro),
    }))
    .filter(
      (registro) =>
        registro.fecha &&
        Number.isFinite(registro.valor) &&
        registro.valor >= -20 &&
        registro.valor <= 30
    )
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  if (registros.length === 0) {
    throw new Error(`La estación ${estacion.nombre} no devolvió mediciones válidas`);
  }

  const ultimo = registros[registros.length - 1];

  return {
    estacion: estacion.nombre,
    siteCode: estacion.siteCode,
    altura: ultimo.valor,
    fechaMedicion: ultimo.fecha,
    tendencia: obtenerTendencia(registros),
    estado: obtenerEstado(ultimo.valor),
    cantidadRegistros: registros.length,
    fuente: "INA",
  };
}

export default function RiverNavbarBanner() {
  const [lectura, setLectura] = useState(null);
  const [horaConsulta, setHoraConsulta] = useState(null);
  const [error, setError] = useState("");
  const [consultando, setConsultando] = useState(true);
  const [esRespaldo, setEsRespaldo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    let temporizador;

    async function actualizar() {
      if (cancelado) return;

      setConsultando(true);
      setError("");

      let nuevaLectura = null;
      let respaldo = false;

      try {
        try {
          nuevaLectura = await consultarEstacion(ESTACION_PRINCIPAL);
        } catch (errorPrincipal) {
          console.warn(
            "Falló la estación Escobar. Se intentará Dique Luján:",
            errorPrincipal
          );

          nuevaLectura = await consultarEstacion(ESTACION_RESPALDO);
          respaldo = true;
        }

        if (cancelado) return;

        setLectura(nuevaLectura);
        setEsRespaldo(respaldo);
        setHoraConsulta(new Date());
      } catch (errorConsulta) {
        if (cancelado) return;

        console.error("Error al actualizar la altura del río:", errorConsulta);

        setError(
          "No se pudo actualizar. Se conserva la última medición válida."
        );
      } finally {
        if (!cancelado) {
          setConsultando(false);

          const intervalo = error
            ? INTERVALO_ERROR
            : lectura?.estado?.intervalo ?? INTERVALO_NORMAL;

          // Se calcula el intervalo con la lectura más reciente
          // dentro de esta ejecución, no con el estado anterior.
          const intervaloSiguiente =
            nuevaLectura && !error
              ? nuevaLectura.estado.intervalo
              : INTERVALO_ERROR;

          temporizador = setTimeout(
            actualizar,
            nuevaLectura ? intervaloSiguiente : INTERVALO_ERROR
          );
        }
      }
    }

    actualizar();

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, []);

  const estado = lectura?.estado;
  const tendencia = lectura?.tendencia;

  return (
    <div
      className="river-navbar-banner"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
        padding: "8px 14px",
        borderRadius: "10px",
        background: "var(--bs-tertiary-bg, #f8fafc)",
        color: "var(--bs-body-color, #1e293b)",
        fontSize: "0.9rem",
      }}
      aria-live="polite"
    >
      <div style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
        🌊 Altura Ríos CUBE
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span>Escobar:</span>

        <strong style={{ fontSize: "1.05rem" }}>
          {lectura ? `${lectura.altura.toFixed(2)} m` : "-- m"}
        </strong>

        {estado && (
          <span
            style={{
              color: estado.color,
              fontWeight: 700,
            }}
          >
            {estado.texto}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          color: tendencia?.color ?? "#64748b",
          fontWeight: 700,
        }}
        title="Comparación con la medición anterior de la misma estación"
      >
        <span style={{ fontSize: "1.2rem" }}>
          {tendencia?.flecha ?? "→"}
        </span>

        <span>{tendencia?.texto ?? "SIN DATOS"}</span>

        {tendencia?.centimetros !== null &&
          tendencia?.centimetros !== undefined && (
            <span>
              {tendencia.centimetros === 0
                ? "0 cm"
                : `${tendencia.centimetros} cm`}
            </span>
          )}
      </div>

      <div style={{ fontSize: "0.78rem", lineHeight: 1.4 }}>
        <div>
          Medición:{" "}
          {lectura ? formatearFecha(lectura.fechaMedicion) : "Sin datos"}
          {lectura ? ` · ${formatearHora(lectura.fechaMedicion)}` : ""}
        </div>

        <div>
          Consulta: {horaConsulta ? formatearHora(horaConsulta) : "--:--"}
          {consultando ? " · Actualizando…" : ""}
        </div>

        {lectura && (
          <div>
            Fuente: INA · {lectura.estacion}
            {esRespaldo ? " (respaldo)" : ""}
          </div>
        )}

        {error && (
          <div style={{ color: "#dc2626", fontWeight: 600 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
