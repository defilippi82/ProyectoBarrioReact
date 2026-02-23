import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import "./alquileres.css";

export const CalendarioDisponibilidad = ({
  fechas,
  modo,
  onToggleFecha
}) => {

  const hoy = new Date();

  const estaBloqueada = (fecha) => {
    const fechaStr = fecha.toISOString().split("T")[0];

    if (modo === "disponiblePorDefecto") {
      return fechas.includes(fechaStr);
    } else {
      return !fechas.includes(fechaStr);
    }
  };

  const modifiers = {
    bloqueado: (date) => estaBloqueada(date),
    pasado: (date) => date < hoy
  };

  const modifiersStyles = {
    bloqueado: {
      backgroundColor: "#dc3545",
      color: "white"
    },
    pasado: {
      color: "#ccc"
    }
  };

  return (
    <DayPicker
      mode="single"
      onDayClick={(day) => {
        if (day < hoy) return;
        onToggleFecha(day);
      }}
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
    />
  );
};