

/**
 * Estandariza la visualización de precios en toda la app.
 * @param {Object} precio - Objeto con {valor, moneda, tipo}
 */
export const formatPrecio = (precio) => {
  if (!precio || !precio.valor) return "Consultar";
  const simbolo = precio.moneda === "USD" ? "U$S" : "$";
  return `${simbolo}${precio.valor} por ${precio.tipo}`;
};

/**
 * Aplica transformaciones de Cloudinary para mejorar el rendimiento.
 * @param {string} url - URL original de la imagen
 * @param {number} width - Ancho deseado
 */
export const getOptimizedImage = (url, width = 600) => {
  if (!url) return null;
  // Reemplaza /upload/ por la cadena de optimización (ajuste de ancho, formato automático y calidad automática)
  return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`);
};