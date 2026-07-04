// Reglas de fuerza de contraseña — deben coincidir con validatePassword() en
// backend/controllers/auth.controller.js para que el frontend y el backend
// nunca se desincronicen sobre qué es una contraseña válida.
export const PASSWORD_RULES = [
  { key: 'length',  label: 'Mínimo 8 caracteres',          test: (p) => p.length >= 8 },
  { key: 'upper',   label: 'Al menos 1 letra mayúscula',   test: (p) => /[A-Z]/.test(p) },
  { key: 'lower',   label: 'Al menos 1 letra minúscula',   test: (p) => /[a-z]/.test(p) },
  { key: 'number',  label: 'Al menos 1 número',            test: (p) => /[0-9]/.test(p) },
  { key: 'special', label: 'Al menos 1 carácter especial', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

// Devuelve el estado (cumple o no) de cada regla, para renderizar la checklist.
export function getPasswordChecklist(password) {
  return PASSWORD_RULES.map(rule => ({
    key: rule.key,
    label: rule.label,
    valid: rule.test(password || ''),
  }))
}

export function passwordMeetsRules(password) {
  return PASSWORD_RULES.every(rule => rule.test(password || ''))
}

// email es opcional: en el flujo de reset de contraseña el frontend no conoce
// el email asociado al token, así que esa regla solo se valida cuando se pasa.
export function isPasswordValid(password, email = '') {
  if (!passwordMeetsRules(password)) return false
  if (email && password.toLowerCase() === email.toLowerCase()) return false
  return true
}

export function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '', color: 'var(--dark-4)' }
  const passed = PASSWORD_RULES.filter(rule => rule.test(password)).length
  if (passed <= 2) return { level: 1, label: 'DÉBIL', color: 'var(--danger)' }
  if (passed <= 4) return { level: 2, label: 'MEDIA', color: 'var(--gold)' }
  return { level: 3, label: 'FUERTE', color: 'var(--success)' }
}
