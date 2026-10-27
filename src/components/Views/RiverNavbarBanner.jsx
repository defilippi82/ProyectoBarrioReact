
import React, { useEffect, useState } from "react";

const INA_BASE = "https://alerta.ina.gob.ar/pub/datos";

// Estaciones a consultar en paralelo
const ESTACION_PRINCIPAL = {
  siteCode: 42,
  nombre: "Escobar",
};

const ESTACION_RESPALDO = {
  siteCode: 50,
  nombre: "ESCOBAR",
};

// Actualización automática
const INTERVALO_NORMAL = 6 * 60 * 60 * 1000; // 6 horas
const INTERVALO_ALERTA = 60 * 60 * 1000; // 1 hora
const INTERVALO_CRITICO = 30 * 60 * 1000; // 30 minutos
const INTERVALO_ERROR = 15 * 60 * 1000; // 15 minutos

// Umbrales operativos del banner
const UMBRAL_ALERTA = 2;
const UMBRAL_CRITICO = 2.5;
const TOLERANCIA_ESTABLE = 0.005;

// --------------------------------------------------
// FUNCIONES AUXILIARES
// --------------------------------------------------

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
  if (Array.isArray(respuesta?.resultados)) return respuesta.resultados;

  return [];
}

function obtenerFecha(registro) {
  const posibles = [
    registro?.timestart,
    registro?.timeStart,
    registro?.timestamp,
    registro?.fecha_hora,
    registro?.datetime,
    registro?.fecha,
    registro?.time,
    registro?.date,
    registro?.obs_time,
  ];

  const valor = posibles.find(
    (item) => item !== undefined && item !== null && item !== ""
  );

  if (valor === undefined) return null;

  const fecha =
    typeof valor === "number"
      ? new Date(valor < 1e12 ? valor * 1000 : valor)
      : new Date(valor);

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

// --------------------------------------------------
// ESTADO E INTERVALO
// --------------------------------------------------

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

  if (Math.abs(diferencia) <= TOLERANCIA_ESTABLE) {
    return {
      texto: "ESTABLE",
      flecha: "→",
      color: "#64748b",
      centimetros: 0,
    };
  }

  const centimetros = Math.round(Math.abs(diferencia) * 100);

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

// --------------------------------------------------
// CONSULTA DE ESTACIÓN AL INA
// --------------------------------------------------

async function consultarEstacion(estacion) {
  const urlSeries = `${INA_BASE}/series&siteCode=${estacion.siteCode}&format=json`;

  const respuestaSeries = await fetch(urlSeries, {
    cache: "no-store",
  });

  if (!respuestaSeries.ok) {
    throw new Error(
      `Error al consultar las series de ${estacion.nombre}: HTTP ${respuestaSeries.status}`
    );
  }

  const jsonSeries = await respuestaSeries.json();
  const series = obtenerRegistros(jsonSeries);

  const seriesEstacion = series.filter((serie) => {
    const siteCode = serie.sitecode ?? serie.siteCode;
    const varId = serie.varid ?? serie.varId;

    return (
      Number(varId) === 2 &&
      (siteCode === undefined || Number(siteCode) === estacion.siteCode)
    );
  });

  const serie =
    (estacion.siteCode === 42
      ? seriesEstacion.find(
          (item) => Number(item.seriesid ?? item.seriesId) === 42
        )
      : null) ?? seriesEstacion[0];

  if (!serie) {
    throw new Error(
      `No se encontró una serie de altura para ${estacion.nombre}`
    );
  }

  const hoy = new Date();

  const fechaFin =
    typeof serie.to_date === "string" && serie.to_date.length >= 10
      ? serie.to_date.slice(0, 10)
      : fechaLocalISO(hoy);

  const fechaInicioDate = new Date(`${fechaFin}T12:00:00`);
  fechaInicioDate.setDate(fechaInicioDate.getDate() - 7);

  const fechaInicio = fechaLocalISO(fechaInicioDate);
  const seriesId = serie.seriesid ?? serie.seriesId;

  const urlDatos =
    `${INA_BASE}/datos&timeStart=${fechaInicio}` +
    `&timeEnd=${fechaFin}` +
    `&seriesId=${seriesId}` +
    `&siteCode=${estacion.siteCode}` +
    "&varId=2&format=json";

  const respuestaDatos = await fetch(urlDatos, {
    cache: "no-store",
  });

  if (!respuestaDatos.ok) {
    throw new Error(
      `Error al consultar las mediciones de ${estacion.nombre}: HTTP ${respuestaDatos.status}`
    );
  }

  const jsonDatos = await respuestaDatos.json();

  const registros = obtenerRegistros(jsonDatos)
    .map((registro) => ({
      fecha: obtenerFecha(registro),
      valor: obtenerValor(registro),
    }))
    .filter(
      (registro) =>
        registro.fecha !== null &&
        Number.isFinite(registro.valor) &&
        registro.valor >= -20 &&
        registro.valor <= 30
    )
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  if (registros.length === 0) {
    throw new Error(
      `No hay mediciones válidas disponibles para ${estacion.nombre}`
    );
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

// --------------------------------------------------
// COMPONENTE DEL BANNER (DOBLE MEDICIÓN)
// --------------------------------------------------

export const RiverNavbarBanner = () => {
  const [lecturaEscobar, setLecturaEscobar] = useState(null);
  const [lecturaDique, setLecturaDique] = useState(null);
  const [horaConsulta, setHoraConsulta] = useState(null);
  const [error, setError] = useState("");
  const [consultando, setConsultando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    let temporizador;

    async function actualizar() {
      if (cancelado) return;

      setConsultando(true);
      let mensajeError = "";
      let minIntervalo = INTERVALO_NORMAL;

      // 1. Consultar Escobar (Principal)
      try {
        const resEscobar = await consultarEstacion(ESTACION_PRINCIPAL);
        if (!cancelado) {
          setLecturaEscobar(resEscobar);
          if (resEscobar.estado.intervalo < minIntervalo) {
            minIntervalo = resEscobar.estado.intervalo;
          }
        }
      } catch (errEscobar) {
        console.warn("Error al consultar Escobar:", errEscobar);
        mensajeError += "Escobar sin conexión. ";
      }

      // 2. Consultar ESCOBAR (Secundaria / Respaldo)
      try {
        const resDique = await consultarEstacion(ESTACION_RESPALDO);
        if (!cancelado) {
          setLecturaDique(resDique);
          if (resDique.estado.intervalo < minIntervalo) {
            minIntervalo = resDique.estado.intervalo;
          }
        }
      } catch (errDique) {
        console.warn("Error al consultar ESCOBAR:", errDique);
        mensajeError += "ESCOBAR sin conexión.";
      }

      if (!cancelado) {
        setHoraConsulta(new Date());
        setError(mensajeError);
        setConsultando(false);

        // Programar próxima actualización según la criticidad de los ríos
        temporizador = setTimeout(actualizar, minIntervalo);
      }
    }

    actualizar();

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, []);

  // Evaluar si alguna de las dos estaciones supera los umbrales para colorear el banner
  const alturaMax = Math.max(
    lecturaEscobar?.altura ?? 0,
    lecturaDique?.altura ?? 0
  );

  const esCritico = alturaMax > UMBRAL_CRITICO;
  const esAlerta = alturaMax > UMBRAL_ALERTA;

  const colorBanner = esCritico ? "#fee2e2" : esAlerta ? "#fef3c7" : "#f1f5f9";
  const colorTexto = esCritico ? "#991b1b" : esAlerta ? "#92400e" : "#1e293b";

  return (
    <div
      className="river-navbar-banner"
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        padding: "8px 14px",
        marginTop: "70px",
        borderRadius: "10px",
        background: colorBanner,
        color: colorTexto,
        fontSize: "0.82rem",
      }}
    >
      <div style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
        🌊 Altura Ríos|| CUBE
      </div>

      {/* ESTACIÓN 1: ESCOBAR */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontWeight: 600 }}>Escobar:</span>
        <strong style={{ fontSize: "1rem" }}>
          {lecturaEscobar ? `${lecturaEscobar.altura.toFixed(2)} m` : "-- m"}
        </strong>
        {lecturaEscobar?.estado && (
          <span style={{ color: lecturaEscobar.estado.color, fontWeight: 700 }}>
            {lecturaEscobar.estado.texto}
          </span>
        )}
        {lecturaEscobar?.tendencia && (
          <span style={{ color: lecturaEscobar.tendencia.color, fontWeight: 700 }}>
            {lecturaEscobar.tendencia.flecha}
          </span>
        )}
      </div>

      {/* ESTACIÓN 2: Dique Lujan */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontWeight: 600 }}>Dique Luján:</span>
        <strong style={{ fontSize: "1rem" }}>
          {lecturaDique ? `${lecturaDique.altura.toFixed(2)} m` : "-- m"}
        </strong>
        {lecturaDique?.estado && (
          <span style={{ color: lecturaDique.estado.color, fontWeight: 700 }}>
            {lecturaDique.estado.texto}
          </span>
        )}
        {lecturaDique?.tendencia && (
          <span style={{ color: lecturaDique.tendencia.color, fontWeight: 700 }}>
            {lecturaDique.tendencia.flecha}
          </span>
        )}
      </div>

      {/* DETALLES Y HORARIOS */}
      <div style={{ fontSize: "0.75rem", lineHeight: 1.4, textAlign: "right" }}>
        <div>
          Actualizado: {horaConsulta ? formatearHora(horaConsulta) : "--:--"}
          {consultando ? " · Sincronizando…" : ""}
        </div>
        {error && (
          <div style={{ color: "#b91c1c", fontWeight: 600 }}>⚠️ {error}</div>
        )}
      </div>
    </div>
  );
};

export default RiverNavbarBanner;