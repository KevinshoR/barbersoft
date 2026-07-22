// Colombia no tiene horario de verano: su offset es SIEMPRE -05:00.
//
// Un <input type="datetime-local"> del frontend manda un string "naive"
// como "2026-07-22T20:00" (sin zona horaria). El constructor Date de JS
// interpreta ese formato como HORA LOCAL DEL PROCESO, no como hora Colombia.
// En desarrollo (PC en Colombia) esto coincide por casualidad; en producción
// (Render y similares corren en UTC) "20:00" se lee como 20:00 UTC = 15:00
// Colombia — un desfase de 5 horas que rompía checkOpen() y el chequeo de
// día-que-trabaja-el-barbero.
//
// Esta función ancla el string a -05:00 ANTES de construir el Date, así el
// resultado es el mismo sin importar en qué zona horaria corra el proceso
// Node. Si el string YA trae zona horaria (termina en 'Z' o en un offset
// +hh:mm/-hh:mm), se deja intacto.
function toColombiaDate(scheduled_at) {
  if (scheduled_at instanceof Date) return scheduled_at

  const str = String(scheduled_at)
  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(str)
  return new Date(hasTimezone ? str : str + '-05:00')
}

// Día de la semana (0=Dom ... 6=Sáb) en hora Colombia, sin importar la zona
// horaria del servidor. Acepta el mismo tipo de string que toColombiaDate.
function getColombiaDayOfWeek(scheduled_at) {
  const date = toColombiaDate(scheduled_at)
  const diaCol = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota', weekday: 'short',
  }).format(date)
  const mapaDias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return mapaDias[diaCol]
}

module.exports = { toColombiaDate, getColombiaDayOfWeek }
