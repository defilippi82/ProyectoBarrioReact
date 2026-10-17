
import React, { useEffect, useState } from "react";

const INA_BASE = "https://alerta.ina.gob.ar/pub/datos";

// Estaciones del INA
const ESTACION_PRINCIPAL = {
  siteCode: 42,
  nombre: "Escobar",
};

const ESTACION_RESPALDO = {
  siteCode: 50,
  nombre: "Dique Luján",
};

// Actualización automática
const INTERVALO_NORMAL = 6 * 60 * 60 * 1000; // 6 horas
const INTERVALO_ALERTA = 60 * 60 * 1000; // 1 hora
const INTERVALO_CRITICO = 30 * 60 * 1000; // 30 minutos
const INTERVALO_ERROR = 15 * 60 * 1000; // 15 minutos

// Umbrales operativos del banner, no niveles oficiales de evacuación
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

  // Algunos servicios expresan los timestamps en segundos.
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
// ESTADO DEL RÍO E INTERVALO DE ACTUALIZACIÓN
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
// CONSULTA DE UNA ESTACIÓN AL INA
// --------------------------------------------------

async function consultarEstacion(estacion) {
  const urlSeries =
    `${INA_BASE}/series&siteCode=${estacion.siteCode}&format=json`;

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

  // Preferimos identificar la serie por estación y variable.
  // Para Escobar conservamos la selección que ya utilizaba el proyecto.
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
          (item) =>
            Number(item.seriesid ?? item.seriesId) === 42
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
// COMPONENTE DEL BANNER
// --------------------------------------------------

export const RiverNavbarBanner = () => {
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

      let nuevaLectura = null;
      let respaldo = false;
      let siguienteIntervalo = INTERVALO_ERROR;
      let mensajeError = "";

      try {
        try {
          nuevaLectura = await consultarEstacion(ESTACION_PRINCIPAL);
        } catch (errorPrincipal) {
          console.warn(
            "Falló Escobar. Intentando estación de respaldo:",
            errorPrincipal
          );

          nuevaLectura = await consultarEstacion(ESTACION_RESPALDO);
          respaldo = true;

          mensajeError =
            "Escobar no respondió. Se muestra Dique Luján como respaldo.";
        }

        if (cancelado) return;

        setLectura(nuevaLectura);
        setEsRespaldo(respaldo);
        setHoraConsulta(new Date());
        setError(mensajeError);

        // El próximo intervalo depende de la última lectura válida.
        siguienteIntervalo = nuevaLectura.estado.intervalo;
      } catch (errorConsulta) {
        if (cancelado) return;

        console.error(
          "Error al actualizar la altura del río:",
          errorConsulta
        );

        // No se borra la última medición válida.
        setError(
          "No se pudo actualizar. Se conserva la última medición válida."
        );

        siguienteIntervalo = INTERVALO_ERROR;
      } finally {
        if (!cancelado) {
          setConsultando(false);

          temporizador = setTimeout(
            actualizar,
            siguienteIntervalo
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

  const colorBanner =
    lectura?.altura > UMBRAL_CRITICO
      ? "#fee2e2"
      : lectura?.altura > UMBRAL_ALERTA
        ? "#fef3c7"
        : "#f1f5f9";

  const colorTexto =
    lectura?.altura > UMBRAL_CRITICO
      ? "#991b1b"
      : lectura?.altura > UMBRAL_ALERTA
        ? "#92400e"
        : "#1e293b";

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
        fontSize: "0.85rem",
      }}
    >
      <div style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
        🌊 Altura Ríos CUBE
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span>{lectura?.estacion ?? "Escobar"}:</span>

        <strong style={{ fontSize: "1.05rem" }}>
          {lectura ? `${lectura.altura.toFixed(2)} m` : "-- m"}
        </strong>

        {estado && (
          <span style={{ color: estado.color, fontWeight: 700 }}>
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

      <div style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
        <div>
          Medición:{" "}
          {lectura ? formatearFecha(lectura.fechaMedicion) : "Sin datos"}
          {lectura
            ? ` · ${formatearHora(lectura.fechaMedicion)}`
            : ""}
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
          <div style={{ color: "#b91c1c", fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiverNavbarBanner;
