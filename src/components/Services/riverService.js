// src/services/riverService.js
export async function getRiverStatus() {
  try {
    // Reemplazá este URL por tu endpoint de backend / Firebase Function
    const response = await fetch('/api/rio-lujan-status');
    if (!response.ok) throw new Error('Error al obtener datos');
    return await response.json();
  } catch (error) {
    console.error('Error fetching river status:', error);
    // Retorno fallback/mock para pruebas en local
    return [
      { id: '359', nombre: 'Campana', altura: 1.20, estado: 'CRECE', fecha: '16/OCT - 00:00' },
      { id: '360', nombre: 'Dique Luján', altura: 1.70, estado: 'CRECE', fecha: '16/OCT - 00:00' }
    ];
  }
}