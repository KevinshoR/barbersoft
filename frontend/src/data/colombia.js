import colombia from './colombia.json'

// Devuelve los departamentos de Colombia (incluye Bogotá, D.C. como distrito capital) ordenados alfabéticamente.
export function getDepartments() {
  return Object.keys(colombia)
}

// Devuelve los municipios de un departamento. Si el departamento no existe, devuelve [].
export function getMunicipalities(department) {
  if (!department) return []
  return colombia[department] || []
}

export default colombia
