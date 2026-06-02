import { useState } from 'react'

const HELP = {
  '/dashboard':    { title:'Panel principal',   text:'Resumen del día: citas programadas, pendientes y confirmadas. El banner dorado te avisa cuántos días quedan de prueba gratuita.' },
  '/appointments': { title:'Citas',             text:'Gestioná todas las citas. Filtrá por fecha o estado, creá nuevas y cambiá el estado con el selector de colores en cada fila.' },
  '/barbers':      { title:'Barberos',          text:'Administrá tu equipo. Podés activar o desactivar barberos sin eliminarlos. No se pueden eliminar si tienen citas activas.' },
  '/services':     { title:'Servicios',         text:'Configurá los servicios con precio y duración. Los clientes los verán al momento de reservar su cita.' },
  '/hours':        { title:'Horarios',          text:'Definí los días y horarios de atención. Los clientes solo podrán reservar dentro de estos horarios.' },
  '/reports':      { title:'Reportes',          text:'Analizá tu negocio: ingresos del mes, citas completadas, mejor barbero y cliente que más ha gastado.' },
  '/subscription': { title:'Suscripción',       text:'Gestioná tu plan. Con 14 días de prueba gratis podés probar todas las funciones sin necesitar tarjeta.' },
  '/settings':     { title:'Configuración',     text:'Editá la información de tu barbería, métodos de pago aceptados y datos de contacto que ven tus clientes.' },
}

export default function HelpButton({ path }) {
  const [open, setOpen] = useState(false)
  const content = HELP[path] || { title:'Ayuda', text:'Navegá por el menú para gestionar tu barbería.' }

  return (
    <>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:89 }} />
      )}
      <div style={{ position:'fixed', bottom:28, right:28, zIndex:90 }}>
        {open && (
          <div className="animate-fade-up" style={{ position:'absolute', bottom:58, right:0, background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:14, padding:'18px 20px', width:280, boxShadow:'0 8px 32px rgba(0,0,0,0.6)' }}>
            <p style={{ color:'var(--gold)', fontSize:11, fontWeight:700, letterSpacing:'0.08em', marginBottom:8 }}>
              {content.title.toUpperCase()}
            </p>
            <p style={{ color:'var(--cream-dim)', fontSize:13, lineHeight:1.7 }}>
              {content.text}
            </p>
            <div style={{ position:'absolute', bottom:-6, right:19, width:12, height:12, background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderTop:'none', borderLeft:'none', transform:'rotate(45deg)' }} />
          </div>
        )}
        <button
          onClick={() => setOpen(prev => !prev)}
          style={{ width:44, height:44, borderRadius:'50%', background: open ? 'var(--gold)' : 'var(--dark-2)', border:'1px solid ' + (open ? 'var(--gold)' : 'var(--dark-4)'), color: open ? 'var(--dark)' : 'var(--cream-dim)', fontSize:20, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.4)', transition:'all 0.2s', fontFamily:'Playfair Display', lineHeight:1 }}
        >
          ?
        </button>
      </div>
    </>
  )
}