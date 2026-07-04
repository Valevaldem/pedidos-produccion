'use client'
import { useState, useEffect } from 'react'
import {
  ASESORAS, getEtapas, getEtapaLabel, getMaxEtapa,
  getSemaforo, semaforoColor, diasHabiles,
  getLunesDe, formatFecha,
} from '@/lib/etapas'
import ModalNuevoPedido from '@/app/components/ModalNuevoPedido'

const SEMANA_ACTUAL = getLunesDe()

// ─── helpers UI ───────────────────────────────────────────────────────────────

function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

function TallerBadge({ taller }) {
  return taller === 'MX'
    ? <Badge className="bg-amber-50 text-amber-800">🇲🇽 MX</Badge>
    : <Badge className="bg-blue-50 text-blue-800">🇺🇸 EU</Badge>
}

function SemaforoBadge({ taller, fechaConfirmacion, etapa }) {
  const s = getSemaforo(taller, fechaConfirmacion, etapa)
  const { bg, text, dot } = semaforoColor(s)
  const dias = diasHabiles(fechaConfirmacion)
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: dot }} />
      {dias} días háb.
    </span>
  )
}

function EtapaBar({ taller, etapa }) {
  const max = getMaxEtapa(taller)
  const label = getEtapaLabel(taller, etapa)
  return (
    <div>
      <div className="flex gap-0.5 mb-1">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all"
            style={{ backgroundColor: i < etapa ? '#A8842B' : '#E5E5E3' }}
          />
        ))}
      </div>
      <span className="text-xs text-ink/50">{label} ({etapa}/{max})</span>
    </div>
  )
}

// ─── Card pedido (vista asesora) ─────────────────────────────────────────────

function PedidoCard({ pedido, seleccionado, onToggleSeleccion, yaReportado }) {
  return (
    <div className={`card p-5 transition ${seleccionado ? 'ring-2 ring-gold' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <TallerBadge taller={pedido.taller} />
          <SemaforoBadge
            taller={pedido.taller}
            fechaConfirmacion={pedido.fechaConfirmacion}
            etapa={pedido.etapa}
          />
          {yaReportado && (
            <Badge className="bg-green-50 text-green-700">✓ Reportado esta semana</Badge>
          )}
        </div>
        {/* Checkbox selección */}
        {!yaReportado && (
          <button
            onClick={() => onToggleSeleccion(pedido.id)}
            className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
              seleccionado ? 'bg-gold border-gold' : 'border-black/20 hover:border-gold'
            }`}
          >
            {seleccionado && <span className="text-white text-xs">✓</span>}
          </button>
        )}
      </div>

      {/* Datos */}
      <div className="mb-3">
        <p className="font-semibold text-ink">{pedido.nombreCliente}</p>
        <p className="text-sm text-ink/70">{pedido.tituloPedido}</p>
        {pedido.descripcionPieza && (
          <p className="text-xs text-ink/50 mt-0.5 italic">{pedido.descripcionPieza}</p>
        )}
      </div>

      {/* Fechas */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/50 mb-3">
        <span>Confirmado: {formatFecha(pedido.fechaConfirmacion)}</span>
        {pedido.fechaCompromiso && (
          <span className="text-amber-700 font-medium">⚑ Compromiso: {formatFecha(pedido.fechaCompromiso)}</span>
        )}
      </div>

      {/* Etapa */}
      <EtapaBar taller={pedido.taller} etapa={pedido.etapa} />

      {/* Comentarios de Vale */}
      {pedido.comentarios && (
        <div className="mt-3 bg-gold/5 border border-gold/20 rounded-lg px-3 py-2">
          <p className="text-xs text-gold font-medium mb-0.5">Nota de gerencia</p>
          <p className="text-sm text-ink/80">{pedido.comentarios}</p>
        </div>
      )}
    </div>
  )
}

// ─── Vista asesora ────────────────────────────────────────────────────────────

function AsesoraView({ asesora, onBack }) {
  const [pedidos, setPedidos] = useState([])
  const [yaReportados, setYaReportados] = useState([]) // pedidoIds reportados esta semana
  const [seleccionados, setSeleccionados] = useState([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [toast, setToast] = useState(null)

  const mostrarToast = (msg, tipo = 'ok') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  const cargarDatos = async () => {
    try {
      const [pedRes, revRes] = await Promise.all([
        fetch(`/api/pedidos?asesora=${encodeURIComponent(asesora)}`),
        fetch(`/api/revisiones?semana=${SEMANA_ACTUAL}`),
      ])
      const pedidosData = await pedRes.json()
      const revisiones = await revRes.json()

      setPedidos(pedidosData)
      const idsReportados = revisiones
        .filter(r => r.asesora === asesora)
        .map(r => r.pedidoId)
      setYaReportados(idsReportados)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [asesora])

  const toggleSeleccion = (id) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleReportar = async () => {
    if (seleccionados.length === 0) return
    setEnviando(true)
    try {
      const res = await fetch('/api/revisiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asesora,
          semanaLunes: SEMANA_ACTUAL,
          pedidoIds: seleccionados,
        }),
      })
      const data = await res.json()
      mostrarToast(`${data.count} pedido${data.count !== 1 ? 's' : ''} reportado${data.count !== 1 ? 's' : ''} ✓`)
      setSeleccionados([])
      await cargarDatos()
    } catch (e) {
      mostrarToast('Error al reportar', 'error')
    } finally {
      setEnviando(false)
    }
  }

  const handlePedidoAgregado = async (pedido) => {
    setModalAbierto(false)
    mostrarToast('Pedido agregado ✓')
    await cargarDatos()
  }

  const pedidosNoReportados = pedidos.filter(p => !yaReportados.includes(p.id))
  const pedidosReportados   = pedidos.filter(p =>  yaReportados.includes(p.id))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-32">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.tipo === 'error' ? 'bg-red-500' : 'bg-ink'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-ink/40 hover:text-ink mb-6">
        ← Cambiar nombre
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-caslon">Hola, {asesora}</h1>
          <p className="text-sm text-ink/50 mt-0.5">
            {pedidos.length === 0
              ? 'Sin pedidos activos'
              : `${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''} en producción`}
          </p>
        </div>
        <button onClick={() => setModalAbierto(true)} className="btn-gold">
          + Agregar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-ink/30 text-sm">Cargando...</div>
      ) : pedidos.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-ink/30 text-sm mb-4">No tienes pedidos activos en producción</p>
          <button onClick={() => setModalAbierto(true)} className="btn-ink">
            Agregar primer pedido
          </button>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Pedidos pendientes de reportar esta semana */}
          {pedidosNoReportados.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-ink/40 uppercase tracking-wider">
                  Pendientes de reportar
                </p>
                <button
                  onClick={() => setSeleccionados(
                    seleccionados.length === pedidosNoReportados.length
                      ? []
                      : pedidosNoReportados.map(p => p.id)
                  )}
                  className="text-xs text-ink/40 hover:text-gold"
                >
                  {seleccionados.length === pedidosNoReportados.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
              {pedidosNoReportados.map(p => (
                <PedidoCard
                  key={p.id}
                  pedido={p}
                  seleccionado={seleccionados.includes(p.id)}
                  onToggleSeleccion={toggleSeleccion}
                  yaReportado={false}
                />
              ))}
            </div>
          )}

          {/* Ya reportados esta semana */}
          {pedidosReportados.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-medium text-ink/40 uppercase tracking-wider mb-3">
                Ya reportados esta semana
              </p>
              {pedidosReportados.map(p => (
                <PedidoCard
                  key={p.id}
                  pedido={p}
                  seleccionado={false}
                  onToggleSeleccion={() => {}}
                  yaReportado={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer sticky — reportar */}
      {seleccionados.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 p-4 z-40">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <p className="text-sm text-ink/60">
              {seleccionados.length} pedido{seleccionados.length !== 1 ? 's' : ''} seleccionado{seleccionados.length !== 1 ? 's' : ''}
            </p>
            <button onClick={handleReportar} disabled={enviando} className="btn-ink disabled:opacity-50">
              {enviando ? 'Enviando...' : 'Reportar esta semana →'}
            </button>
          </div>
        </div>
      )}

      {modalAbierto && (
        <ModalNuevoPedido
          asesora={asesora}
          onClose={() => setModalAbierto(false)}
          onSaved={handlePedidoAgregado}
          asesoraFija={true}
        />
      )}
    </div>
  )
}

// ─── Home — selector de asesora ──────────────────────────────────────────────

export default function Home() {
  const [asesora, setAsesora] = useState(null)

  if (asesora) {
    return <AsesoraView asesora={asesora} onBack={() => setAsesora(null)} />
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-12 h-12 rounded-2xl bg-ink flex items-center justify-center mx-auto mb-6">
        <span className="text-white text-xl">📦</span>
      </div>
      <h1 className="text-3xl font-caslon mb-2">Pedidos en Producción</h1>
      <p className="text-ink/50 text-sm mb-10">Selecciona tu nombre para ver tus pedidos</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ASESORAS.map(nombre => (
          <button
            key={nombre}
            onClick={() => setAsesora(nombre)}
            className="card p-4 text-sm font-medium hover:ring-2 hover:ring-gold hover:shadow-md transition text-left"
          >
            {nombre}
          </button>
        ))}
      </div>
    </div>
  )
}
