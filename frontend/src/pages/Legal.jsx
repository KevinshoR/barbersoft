import { useLocation, Link } from 'react-router-dom'

/* ═══════════════════════════════════════════════════════════
   Páginas legales: Términos y Condiciones (/terminos) y
   Política de Privacidad (/privacidad). Contenido estático.
   Recuerda reemplazar [FECHA], [TU NOMBRE COMPLETO] y
   [TU NÚMERO DE CÉDULA] por tus datos reales.
═══════════════════════════════════════════════════════════ */

const CONTACT_EMAIL = 'noresponderjtools@gmail.com'
const UPDATED = '[05/08/2026]'
const OWNER = '[Kevin alejandro meneses sarria]'
const ID = '[1023637715]'

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {title && <h2 style={{ color: 'var(--cream)', fontSize: 19, fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-display)' }}>{title}</h2>}
      <div style={{ color: 'var(--cream-dim)', fontSize: 14, lineHeight: 1.75 }}>{children}</div>
    </div>
  )
}

function Terminos() {
  return (
    <>
      <Section>
        <p>Estos Términos y Condiciones (los "Términos") regulan el acceso y uso de <strong style={{ color: 'var(--cream)' }}>Barbersoft</strong> (la "Plataforma"), un software de gestión de citas y administración para barberías, ofrecido por <strong style={{ color: 'var(--cream)' }}>{OWNER}</strong>, persona natural, identificado con cédula de ciudadanía No. {ID}, con domicilio en Medellín, Antioquia, Colombia (el "Titular").</p>
        <p style={{ marginTop: 10 }}>Al registrarse, acceder o utilizar la Plataforma, usted declara haber leído, entendido y aceptado estos Términos. Si no está de acuerdo, no debe registrarse ni utilizar el Servicio.</p>
      </Section>

      <Section title="1. Objeto del Servicio">
        <p>Barbersoft permite a las barberías gestionar citas, barberos, servicios, precios y horarios; ofrecer una página pública de reservas; enviar recordatorios por correo; consultar reportes; y usar un asistente virtual con inteligencia artificial. El Titular provee únicamente la herramienta de software y no es parte de la relación comercial entre la Barbería y sus clientes, ni presta servicios de barbería.</p>
      </Section>

      <Section title="2. Registro de Cuenta">
        <p>Para usar el Servicio debe crear una cuenta con información veraz y actualizada. Usted es responsable de la confidencialidad de sus credenciales y de toda actividad bajo su cuenta. Debe ser mayor de edad y tener capacidad legal para contratar. El Titular puede suspender cuentas con información falsa o uso fraudulento.</p>
      </Section>

      <Section title="3. Período de Prueba">
        <p>La Plataforma ofrece un período de prueba gratuito de catorce (14) días desde el registro. Al finalizar, deberá adquirir una suscripción para continuar; de lo contrario, el acceso podrá suspenderse.</p>
      </Section>

      <Section title="4. Suscripción, Precios y Pagos">
        <p>El acceso continuado requiere una suscripción de <strong style={{ color: 'var(--cream)' }}>cincuenta mil pesos colombianos ($50.000 COP) mensuales</strong>. El Titular podrá modificar el precio con aviso previo razonable.</p>
        <p style={{ marginTop: 10 }}>Actualmente el pago se gestiona de forma manual: el Usuario contacta al Titular por WhatsApp para coordinar la transferencia (Nequi, Bancolombia u otro medio). Confirmado el pago, la cuenta se activa. La falta de pago podrá derivar en suspensión. Salvo disposición legal en contrario, los pagos no son reembolsables; en caso de cancelación, se conserva el acceso hasta el final del período pagado. El Titular podrá ofrecer beneficios por referidos según las condiciones vigentes.</p>
      </Section>

      <Section title="5. Obligaciones del Usuario">
        <p>El Usuario se compromete a: usar el Servicio de forma lícita; no darle usos fraudulentos o ilegales; no acceder sin autorización a otras cuentas o sistemas; no introducir código malicioso; no copiar, modificar ni realizar ingeniería inversa del software; ser responsable de la veracidad y legalidad de su contenido; y cumplir la normativa de protección de datos respecto de sus clientes, obteniendo las autorizaciones necesarias.</p>
      </Section>

      <Section title="6. Clientes Finales">
        <p>La Barbería es la única responsable frente a sus clientes por la prestación del servicio, el cumplimiento de las citas y los precios publicados. El Titular no interviene en esa relación ni responde por citas incumplidas, cancelaciones o disputas. Los recordatorios son un apoyo automatizado sin garantía de entrega en todos los casos.</p>
      </Section>

      <Section title="7. Propiedad Intelectual">
        <p>El software, código, diseño, marca y logotipos de Barbersoft son propiedad exclusiva del Titular. Estos Términos otorgan solo una licencia de uso limitada, revocable y no transferible mientras la suscripción esté activa. El contenido que el Usuario carga sigue siendo suyo; otorga al Titular una licencia limitada para almacenarlo y procesarlo con el fin de prestar el Servicio.</p>
      </Section>

      <Section title="8. Disponibilidad y Limitación de Responsabilidad">
        <p>El Servicio se ofrece "tal cual" y "según disponibilidad", sin garantía de estar libre de interrupciones o errores. Podrá suspenderse por mantenimiento o causas de fuerza mayor. En la máxima medida permitida por la ley colombiana, el Titular no será responsable por daños indirectos, lucro cesante o pérdida de datos. Su responsabilidad total no excederá el monto pagado por suscripción en los tres (3) meses anteriores al hecho que originó la reclamación.</p>
      </Section>

      <Section title="9. Suspensión y Terminación">
        <p>El Titular podrá suspender o cancelar el acceso por incumplimiento de estos Términos, falta de pago o uso ilegal. El Usuario puede cancelar cuando quiera dejando de renovar el pago; no hay cobros automáticos tras la cancelación.</p>
      </Section>

      <Section title="10. Modificaciones, Ley Aplicable y Jurisdicción">
        <p>El Titular podrá modificar estos Términos publicando la versión actualizada en la Plataforma. El uso continuado implica aceptación. Estos Términos se rigen por las leyes de la República de Colombia, y cualquier controversia se someterá a los jueces competentes de Medellín, Antioquia.</p>
      </Section>

      <Section title="11. Contacto">
        <p>Para consultas, reclamos o soporte: <a href={'mailto:' + CONTACT_EMAIL} style={{ color: 'var(--gold)' }}>{CONTACT_EMAIL}</a></p>
      </Section>
    </>
  )
}

function Privacidad() {
  return (
    <>
      <Section>
        <p>Esta Política de Privacidad describe cómo <strong style={{ color: 'var(--cream)' }}>Barbersoft</strong>, operado por {OWNER} (cédula No. {ID}), recopila, usa y protege los datos personales, conforme a la <strong style={{ color: 'var(--cream)' }}>Ley 1581 de 2012</strong>, el Decreto 1377 de 2013 y demás normas colombianas de protección de datos.</p>
      </Section>

      <Section title="1. Datos que Recopilamos">
        <p>Recopilamos datos de dos tipos de titulares:</p>
        <p style={{ marginTop: 8 }}><strong style={{ color: 'var(--cream)' }}>De la Barbería:</strong> nombre del negocio, correo electrónico, teléfono, dirección y datos de la cuenta.</p>
        <p style={{ marginTop: 6 }}><strong style={{ color: 'var(--cream)' }}>De los Clientes que reservan:</strong> nombre, teléfono y, opcionalmente, correo electrónico, necesarios para agendar y gestionar las citas.</p>
      </Section>

      <Section title="2. Finalidad del Tratamiento">
        <p>Usamos los datos para: prestar el Servicio; gestionar citas y recordatorios; generar reportes; procesar pagos; brindar soporte; y cumplir obligaciones legales. No vendemos ni compartimos los datos con terceros para fines publicitarios.</p>
      </Section>

      <Section title="3. Responsabilidad sobre los Datos de los Clientes">
        <p>La Barbería es responsable del tratamiento de los datos de sus propios clientes y debe obtener sus autorizaciones. Barbersoft actúa como encargado del tratamiento, usando esos datos únicamente para prestar el Servicio y conforme a las instrucciones de la Barbería.</p>
      </Section>

      <Section title="4. Derechos de los Titulares">
        <p>Todo titular tiene derecho a conocer, actualizar, rectificar y suprimir sus datos, así como a revocar la autorización otorgada. Para ejercer estos derechos, puede escribir a <a href={'mailto:' + CONTACT_EMAIL} style={{ color: 'var(--gold)' }}>{CONTACT_EMAIL}</a>, y atenderemos su solicitud en los plazos que establece la ley.</p>
      </Section>

      <Section title="5. Seguridad de la Información">
        <p>Implementamos medidas razonables de seguridad para proteger los datos. No obstante, ningún sistema es completamente infalible, por lo que no garantizamos seguridad absoluta frente a accesos no autorizados derivados de causas ajenas a nuestro control.</p>
      </Section>

      <Section title="6. Terceros y Proveedores">
        <p>Para prestar el Servicio nos apoyamos en proveedores tecnológicos (correo, almacenamiento en la nube, inteligencia artificial), que tratan los datos bajo estándares de confidencialidad y solo para las finalidades descritas.</p>
      </Section>

      <Section title="7. Conservación y Cambios">
        <p>Conservamos los datos mientras la cuenta esté activa y por el tiempo que exijan las obligaciones legales; luego los eliminamos. Podemos actualizar esta Política publicando la nueva versión en la Plataforma con su fecha de actualización.</p>
      </Section>

      <Section title="8. Contacto">
        <p>Para cualquier solicitud sobre sus datos personales: <a href={'mailto:' + CONTACT_EMAIL} style={{ color: 'var(--gold)' }}>{CONTACT_EMAIL}</a></p>
      </Section>
    </>
  )
}

export default function Legal() {
  const { pathname } = useLocation()
  const isPrivacy = pathname.includes('privacidad')
  const title = isPrivacy ? 'Política de Privacidad' : 'Términos y Condiciones'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' }}>
      {/* Header simple */}
      <header style={{ borderBottom: '1px solid var(--dark-4)', padding: '18px 24px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, textDecoration: 'none' }}>Barbersoft</Link>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/terminos" style={{ color: isPrivacy ? 'var(--cream-dim)' : 'var(--gold)', fontSize: 12.5, textDecoration: 'none', fontWeight: 600 }}>Términos</Link>
            <Link to="/privacidad" style={{ color: isPrivacy ? 'var(--gold)' : 'var(--cream-dim)', fontSize: 12.5, textDecoration: 'none', fontWeight: 600 }}>Privacidad</Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px 80px', flex: 1, width: '100%' }}>
        <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase' }}>Legal</p>
        <h1 style={{ color: 'var(--cream)', fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-display)', marginTop: 6, marginBottom: 6 }}>{title}</h1>
        <p style={{ color: 'var(--cream-dim)', fontSize: 12.5, marginBottom: 36, opacity: 0.7 }}>Última actualización: {UPDATED}</p>

        {isPrivacy ? <Privacidad /> : <Terminos />}

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--dark-4)' }}>
          <Link to="/" style={{ color: 'var(--gold)', fontSize: 13, textDecoration: 'none' }}>← Volver al inicio</Link>
        </div>
      </main>
    </div>
  )
}
