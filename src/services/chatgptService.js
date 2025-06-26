export const generateSummary = async (fecha, mañana, tarde, noche) => {
  try {
    console.log('Generando resumen combinado de los turnos...');

    // Filtrar turnos que tienen contenido
    const turnosConContenido = [];
    if (mañana && mañana.trim()) turnosConContenido.push({ turno: 'Mañana', contenido: mañana.trim() });
    if (tarde && tarde.trim()) turnosConContenido.push({ turno: 'Tarde', contenido: tarde.trim() });
    if (noche && noche.trim()) turnosConContenido.push({ turno: 'Noche', contenido: noche.trim() });

    if (turnosConContenido.length === 0) {
      throw new Error('No hay contenido en ningún turno para generar resumen');
    }

    // Crear resumen combinado
    let resumen = `RESUMEN DEL DÍA ${fecha}\n\n`;

    turnosConContenido.forEach(({ turno, contenido }) => {
      resumen += `TURNO ${turno.toUpperCase()}:\n`;
      resumen += `${contenido}\n\n`;
    });

    // Agregar información adicional
    resumen += `---\n`;
    resumen += `Resumen generado automáticamente combinando ${turnosConContenido.length} turno(s).\n`;
    resumen += `Fecha de generación: ${new Date().toLocaleString('es-ES')}`;

    console.log('Resumen generado exitosamente');
    return resumen;

  } catch (error) {
    console.error('Error al generar resumen:', error);
    throw new Error(`No se pudo generar el resumen: ${error.message}`);
  }
}; 