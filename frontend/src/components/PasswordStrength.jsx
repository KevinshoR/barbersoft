import { getPasswordChecklist, getPasswordStrength } from '../utils/passwordValidation'

// Checklist de requisitos + barra de fuerza para el campo de contraseña.
// Si se pasa `email`, también valida que la contraseña no sea igual al email
// (en el flujo de reset de contraseña no se conoce el email del token, así
// que ese ítem se omite pasando email vacío/undefined).
export default function PasswordStrength({ password, email }) {
  if (!password) return null

  const strength  = getPasswordStrength(password)
  const checklist = getPasswordChecklist(password)
  const sameAsEmail = Boolean(email) && password.toLowerCase() === email.toLowerCase()

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1, 2, 3].map(level => (
          <div
            key={level}
            style={{
              flex: 1, height: 4, borderRadius: 2, transition: 'background 0.2s',
              background: strength.level >= level ? strength.color : 'var(--dark-4)',
            }}
          />
        ))}
      </div>

      {strength.label && (
        <p style={{ fontSize: 11, color: strength.color, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>
          {strength.label}
        </p>
      )}

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {checklist.map(rule => (
          <li
            key={rule.key}
            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: rule.valid ? 'var(--success)' : 'var(--cream-dim)' }}
          >
            <span style={{ color: rule.valid ? 'var(--success)' : 'var(--danger)' }}>{rule.valid ? '✓' : '✕'}</span>
            {rule.label}
          </li>
        ))}
        {email && (
          <li
            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: !sameAsEmail ? 'var(--success)' : 'var(--danger)' }}
          >
            <span>{!sameAsEmail ? '✓' : '✕'}</span>
            La contraseña no puede ser igual al email
          </li>
        )}
      </ul>
    </div>
  )
}
