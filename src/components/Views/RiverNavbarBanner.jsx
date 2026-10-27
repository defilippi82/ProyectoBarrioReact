
import React, { useEffect, useState } from "react";

const INA_BASE = "https://alerta.ina.gob.ar/pub/datos";

const INTERVALO_NORMAL = 6 * 60 * 60 * 1000; // 6 horas
const INTERVALO_ALERTA = 60 * 60 * 1000; // 1 hora
const INTERVALO_CRITICO = 30 * 60 * 1000; // 30 minutos
const INTERVALO_ERROR = 15 * 60 * 1000; // 15 minutos

const UMBRAL_ALERTA = 2;
const UMBRAL_CRITICO = 2.5;

function formatearHora(fecha) {
  if (!fecha) return "--:--";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(fecha);
}

export const RiverNavbarBanner = () => {
  const [lecturaIna, setLecturaIna] = useState(null);
  const [lecturaPref, setLecturaPref] = useState(null);
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

      // 1. Consultar INA (Escobar - siteCode 42)
      try {
        const resSeries = await fetch(`${INA_BASE}/series&siteCode=42&format=json`);
        if (resSeries.ok) {
          const jsonSeries = await resSeries.json();
          const serieAltura = (Array.isArray(jsonSeries) ? jsonSeries : jsonSeries.data || [])
            .find(s => Number(s.seriesid ?? s.seriesId) === 42 || Number(s.varid ?? s.varId) === 2);

          if (serieAltura && serieAltura.to_date) {
            const fechaFin = serieAltura.to_date.slice(0, 10);
            const d = new Date(`${fechaFin}T12:00:00`);
            d.setDate(d.getDate() - 7);
            const fechaInicio = d.toISOString().split("T")[0];

            const resDatos = await fetch(
              `${INA_BASE}/datos&timeStart=${fechaInicio}&timeEnd=${fechaFin}&seriesId=42&siteCode=42&varId=2&format=json`
            );
            if (resDatos.ok) {
              const jsonDatos = await resDatos.json();
              const registros = Array.isArray(jsonDatos) ? jsonDatos : (jsonDatos.data || jsonDatos.datos || []);
              if (registros.length > 0) {
                const ultimo = registros[registros.length - 1];
                const alturaIna = parseFloat(ultimo.valor ?? ultimo.value);
                
                setLecturaIna({
                  estacion: "Escobar (INA)",
                  altura: alturaIna,
                  fuente: "INA"
                });

                if (alturaIna > UMBRAL_CRITICO) minIntervalo = Math.min(minIntervalo, INTERVALO_CRITICO);
                else if (alturaIna > UMBRAL_ALERTA) minIntervalo = Math.min(minIntervalo, INTERVALO_ALERTA);
              }
            }
          }
        }
      } catch (errIna) {
        console.warn("Error INA:", errIna);
        mensajeError += "INA sin conexión. ";
      }

      // 2. Consultar Prefectura ID 360 (A través de tu backend con Cheerio)
      try {
        const resPref = await fetch("/api/prefectura");
        if (resPref.ok) {
          const dataPref = await resPref.json();
          if (dataPref.success && dataPref.ultimo) {
            const alturaPref = parseFloat(dataPref.ultimo.altura);
            setLecturaPref({
              estacion: "Dique Luján (PNA 360)",
              altura: alturaPref,
              estado: dataPref.ultimo.estado,
              fechaHora: dataPref.ultimo.fechaHora,
              fuente: "Prefectura"
            });

            if (alturaPref > UMBRAL_CRITICO) minIntervalo = Math.min(minIntervalo, INTERVALO_CRITICO);
            else if (alturaPref > UMBRAL_ALERTA) minIntervalo = Math.min(minIntervalo, INTERVALO_ALERTA);
          }
        }
      } catch (errPref) {
        console.warn("Error Prefectura:", errPref);
        mensajeError += "Prefectura sin conexión.";
      }

      if (!cancelado) {
        setHoraConsulta(new Date());
        setError(mensajeError);
        setConsultando(false);
        temporizador = setTimeout(actualizar, minIntervalo);
      }
    }

    actualizar();

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, []);

  const alturaMax = Math.max(
    lecturaIna?.altura ?? 0,
    lecturaPref?.altura ?? 0
  );

  const colorBanner = alturaMax > UMBRAL_CRITICO ? "#fee2e2" : alturaMax > UMBRAL_ALERTA ? "#fef3c7" : "#f1f5f9";
  const colorTexto = alturaMax > UMBRAL_CRITICO ? "#991b1b" : alturaMax > UMBRAL_ALERTA ? "#92400e" : "#1e293b";

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
        🌊 Altura de Ríos||CUBE
      </div>

      {/* DATO 1: INA (Escobar) */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontWeight: 600 }}>INA (Escobar):</span>
        <strong style={{ fontSize: "1rem" }}>
          {lecturaIna ? `${lecturaIna.altura.toFixed(2)} m` : "-- m"}
        </strong>
      </div>

      {/* DATO 2: PREFECTURA (ID 360) */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontWeight: 600 }}>Prefectura (Escobar):</span>
        <strong style={{ fontSize: "1rem" }}>
          {lecturaPref ? `${lecturaPref.altura.toFixed(2)} m` : "-- m"}
        </strong>
        {lecturaPref?.estado && (
          <span style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.8 }}>
            ({lecturaPref.estado})
          </span>
        )}
      </div>

      {/* HORARIOS Y ESTADO */}
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