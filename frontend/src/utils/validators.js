// Validadores reutilizables para formularios. Cada uno devuelve un mensaje
// de error (string) o null si el valor es válido. Pensados para componerse
// dentro de un `validate(form)` por página y recalcularse en cada render
// (no se guardan en estado: así la validación es siempre en tiempo real).

export function isRequired(value) {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

export function requiredError(value, label = 'Este campo') {
  return isRequired(value) ? null : `${label} es obligatorio`
}

export function lengthError(value, { min, max, label = 'Este campo' } = {}) {
  const v = String(value ?? '').trim()
  if (!v) return null // lo obligatorio se valida aparte con requiredError
  if (min != null && v.length < min) return `${label} debe tener al menos ${min} caracteres`
  if (max != null && v.length > max) return `${label} no puede superar ${max} caracteres`
  return null
}

export function emailError(value, { required = false } = {}) {
  const v = String(value ?? '').trim()
  if (!v) return required ? 'El email es obligatorio' : null
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(v) ? null : 'Email inválido'
}

// Teléfono colombiano: entre 7 y 15 dígitos (se ignoran espacios, guiones, paréntesis, +).
export function phoneError(value, { required = false } = {}) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return required ? 'El teléfono es obligatorio' : null
  return /^[0-9]{7,15}$/.test(digits) ? null : 'Teléfono inválido (debe tener entre 7 y 15 dígitos)'
}

export function numberRangeError(value, { min, max, label = 'Este campo' } = {}) {
  const v = String(value ?? '').trim()
  if (!v) return null // lo obligatorio se valida aparte con requiredError
  const n = Number(v)
  if (Number.isNaN(n)) return `${label} debe ser un número`
  if (min != null && n < min) return `${label} debe ser al menos ${min}`
  if (max != null && n > max) return `${label} no puede ser mayor a ${max}`
  return null
}

// Compone varios validadores de un mismo campo; devuelve el primer error.
export function combine(...fns) {
  return (value, form) => {
    for (const fn of fns) {
      const err = fn(value, form)
      if (err) return err
    }
    return null
  }
}

// Arma el objeto de errores de un formulario a partir de un schema
// { campo: (valor, form) => error|null }. Se llama en cada render con el
// `form` actual, así errors siempre refleja el estado real (sin desincronía).
export function buildErrors(form, schema) {
  const errors = {}
  for (const field of Object.keys(schema)) {
    const err = schema[field](form[field], form)
    if (err) errors[field] = err
  }
  return errors
}

export function hasErrors(errors) {
  return Object.values(errors).some(Boolean)
}

// Marca todos los campos de un schema como "touched", útil al intentar
// enviar un formulario para que se muestren todos los errores pendientes.
export function touchAll(schema) {
  return Object.keys(schema).reduce((acc, field) => ({ ...acc, [field]: true }), {})
}
