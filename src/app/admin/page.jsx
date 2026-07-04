'use client'
import { useState, useEffect } from 'react'
import {
  ASESORAS, getEtapas, getEtapaLabel, getMaxEtapa,
  getSemaforo, semaforoColor, diasHabiles,
  getLunesDe, formatFecha,
} from '@/lib/etapas'
import ModalNuevoPedido from '@/app/components/ModalNuevoPedido'

// ─── helpers ──────────────────────────────────────────────────────────────────

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

function SemaforoDot({ taller, fechaConfirmacion, etapa }) {
  const s = getSemaforo(taller, fechaConfirmacion, etapa)
  const { dot } = semaforoColor(s)
  const dias = diasHabiles(fechaConfirmacion)
  const label = s === 'verde' ? 'En tiempo' : s === 'amarillo' ? 'En riesgo' : 'Atrasado'
  return (
    <span className="flex items-center gap-1.5 text-xs text-ink/50">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
      {label} · {dias} días háb.
    </span>
  )
}

// ─── Tab Activos ──────────────────────────────────────────────────────────────

function TabActivos({ onPedidoAgregado }) {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroTaller, setFiltroTaller] = useState('Todos')
  const [filtroAsesora, setFiltroAsesora] = useState('Todas')
  const [editando, setEditando] = useState({}) // { [pedidoId]: { etapa, comentarios } }
  const [guardando, setGuardando] = useState(null)
  const [toast, setToast] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [mostrarArchivados, setMostrarArchivados] = useState(false)

  const mostrarToast = (msg, tipo = 'ok') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  const cargarPedidos = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pedidos?activos=${!mostrarArchivados}`)
      const data = await res.json()
      setPedidos(data)
      // Inicializar estado de edición con valores actuales
      const initEdit = {}
      data.forEach(p => {
        initEdit[p.id] = { etapa: p.etapa, comentarios: p.comentarios || '' }
      })
      setEditando(initEdit)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarPedidos() }, [mostrarArchivados])

  const handleGuardar = async (pedidoId) => {
    const { etapa, comentarios } = editando[pedidoId] || {}
    setGuardando(pedidoId)
    try {
      await fetch(`/api/pedidos/${pedidoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa, comentarios }),
      })
      mostrarToast('Guardado ✓')
      await cargarPedidos()
    } catch (e) {
      mostrarToast('Error al guardar', 'error')
    } finally {
      setGuardando(null)
    }
  }

  const handleArchivar = async (pedidoId, archivar) => {
    if (!confirm(archivar ? '¿Archivar este pedido?' : '¿Reactivar este pedido?')) return
    try {
      await fetch(`/api/pedidos/${pedidoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !archivar }),
      })
      mostrarToast(archivar ? 'Pedido archivado' : 'Pedido reactivado')
      await cargarPedidos()
    } catch (e) {
      mostrarToast('Error', 'error')
    }
  }

  const setEdit = (pedidoId, campo, valor) => {
    setEditando(prev => ({
      ...prev,
      [pedidoId]: { ...prev[pedidoId], [campo]: valor },
    }))
  }

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroTaller !== 'Todos' && p.taller !== filtroTaller) return false
    if (filtroAsesora !== 'Todas' && p.asesora !== filtroAsesora) return false
    return true
  })

  // Agrupar por asesora
  const porAsesora = {}
  pedidosFiltrados.forEach(p => {
    if (!porAsesora[p.asesora]) porAsesora[p.asesora] = []
    porAsesora[p.asesora].push(p)
  })

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.tipo === 'error' ? 'bg-red-500' : 'bg-ink'}`}>
          {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Filtro taller */}
        <div className="flex rounded-lg border border-black/10 overflow-hidden text-sm">
          {['Todos', 'MX', 'EU'].map(t => (
            <button
              key={t}
              onClick={() => setFiltroTaller(t)}
              className={`px-3 py-1.5 transition ${filtroTaller === t ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-greige'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Filtro asesora */}
        <select
          className="border border-black/10 rounded-lg px-3 py-1.5 text-sm bg-white text-ink focus:outline-none"
          value={filtroAsesora}
          onChange={e => setFiltroAsesora(e.target.value)}
        >
          <option value="Todas">Todas las asesoras</option>
          {ASESORAS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <label className="flex items-center gap-2 text-sm text-ink/50 cursor-pointer">
          <input type="checkbox" checked={mostrarArchivados}
            onChange={e => setMostrarArchivados(e.target.checked)} />
          Ver archivados
        </label>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-ink/40">{pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? 's' : ''}</span>
          <button onClick={() => setModalAbierto(true)} className="btn-gold">+ Agregar</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-ink/30 text-sm">Cargando...</div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="card p-12 text-center text-ink/30 text-sm">
          No hay pedidos con los filtros seleccionados
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(porAsesora).sort().map(([asesora, peds]) => (
            <div key={asesora}>
              <h3 className="text-sm font-semibold text-ink/40 uppercase tracking-wider mb-3">{asesora}</h3>
              <div className="space-y-3">
                {peds.map(p => {
                  const ed = editando[p.id] || { etapa: p.etapa, comentarios: p.comentarios || '' }
                  const etapas = getEtapas(p.taller)
                  const max = getMaxEtapa(p.taller)
                  const cambio = ed.etapa !== p.etapa || ed.comentarios !== (p.comentarios || '')

                  return (
                    <div key={p.id} className="card p-5">
                      {/* Header */}
                      <div className="flex flex-wrap items-start gap-2 mb-3">
                        <TallerBadge taller={p.taller} />
                        <SemaforoDot taller={p.taller} fechaConfirmacion={p.fechaConfirmacion} etapa={p.etapa} />
                        <span className="text-xs text-ink/30 ml-auto">#{p.id}</span>
                      </div>

                      {/* Datos pedido */}
                      <div className="mb-4">
                        <p className="font-semibold">{p.nombreCliente}</p>
                        <p className="text-sm text-ink/60">{p.tituloPedido}</p>
                        {p.descripcionPieza && <p className="text-xs text-ink/40 italic mt-0.5">{p.descripcionPieza}</p>}
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-ink/40">
                          <span>Confirmado: {formatFecha(p.fechaConfirmacion)}</span>
                          {p.fechaCompromiso && (
                            <span className="text-amber-700 font-medium">⚑ Compromiso: {formatFecha(p.fechaCompromiso)}</span>
                          )}
                          <span>Asesora: {p.asesora}</span>
                        </div>
                      </div>

                      {/* Editor de etapa */}
                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="label">Etapa actual</label>
                          <select
                            className="input"
                            value={ed.etapa}
                            onChange={e => setEdit(p.id, 'etapa', parseInt(e.target.value))}
                          >
                            {etapas.map(e => (
                              <option key={e.id} value={e.id}>
                                {e.id}/{max} — {e.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label">Comentarios para la asesora</label>
                          <textarea
                            className="input resize-none"
                            rows={2}
                            placeholder="Ej. Adrián dice que sale el viernes"
                            value={ed.comentarios}
                            onChange={e => setEdit(p.id, 'comentarios', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2 pt-2 border-t border-black/5">
                        <button
                          onClick={() => handleGuardar(p.id)}
                          disabled={!cambio || guardando === p.id}
                          className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${
                            cambio
                              ? 'bg-gold text-white hover:opacity-90'
                              : 'bg-black/5 text-ink/30 cursor-not-allowed'
                          } disabled:opacity-50`}
                        >
                          {guardando === p.id ? 'Guardando...' : cambio ? 'Guardar cambios' : 'Sin cambios'}
                        </button>
                        <button
                          onClick={() => handleArchivar(p.id, p.activo)}
                          className="text-xs text-ink/30 hover:text-red-500 ml-auto transition"
                        >
                          {p.activo ? 'Archivar' : 'Reactivar'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAbierto && (
        <ModalNuevoPedido
          asesora=""
          asesoraFija={false}
          onClose={() => setModalAbierto(false)}
          onSaved={async () => {
            setModalAbierto(false)
            mostrarToast('Pedido agregado ✓')
            await cargarPedidos()
            onPedidoAgregado?.()
          }}
        />
      )}
    </div>
  )
}

// ─── Tab Historial ────────────────────────────────────────────────────────────

function TabHistorial() {
  const [semanas, setSemanas] = useState([])
  const [semanaSeleccionada, setSemanaSeleccionada] = useState('')
  const [revisiones, setRevisiones] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/revisiones/semanas')
      .then(r => r.json())
      .then(data => {
        setSemanas(data)
        if (data.length > 0) setSemanaSeleccionada(data[0])
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!semanaSeleccionada) return
    setLoading(true)
    fetch(`/api/revisiones?semana=${semanaSeleccionada}`)
      .then(r => r.json())
      .then(data => {
        setRevisiones(data)
        setLoading(false)
      })
      .catch(e => { console.error(e); setLoading(false) })
  }, [semanaSeleccionada])

  const formatSemana = (str) => {
    if (!str) return ''
    const d = new Date(str + 'T12:00:00')
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Agrupar revisiones por asesora
  const porAsesora = {}
  revisiones.forEach(r => {
    if (!porAsesora[r.asesora]) porAsesora[r.asesora] = []
    porAsesora[r.asesora].push(r)
  })

  return (
    <div>
      {semanas.length === 0 ? (
        <div className="card p-12 text-center text-ink/30 text-sm">
          Aún no hay semanas con revisiones
        </div>
      ) : (
        <div>
          {/* Selector de semana */}
          <div className="mb-6">
            <label className="label">Semana (lunes)</label>
            <select
              className="border border-black/10 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
              value={semanaSeleccionada}
              onChange={e => setSemanaSeleccionada(e.target.value)}
            >
              {semanas.map(s => (
                <option key={s} value={s}>Semana del {formatSemana(s)}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-ink/30 text-sm">Cargando...</div>
          ) : revisiones.length === 0 ? (
            <div className="card p-8 text-center text-ink/30 text-sm">Sin revisiones esta semana</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(porAsesora).sort().map(([asesora, revs]) => (
                <div key={asesora}>
                  <h3 className="text-sm font-semibold text-ink/40 uppercase tracking-wider mb-2">
                    {asesora} — {revs.length} pedido{revs.length !== 1 ? 's' : ''}
                  </h3>
                  <div className="card divide-y divide-black/5">
                    {revs.map(r => (
                      <div key={r.id} className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.pedido.taller === 'MX' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}`}>
                                {r.pedido.taller}
                              </span>
                              <span className="text-xs text-ink/40">Etapa {r.etapa}/{getMaxEtapa(r.pedido.taller)}</span>
                            </div>
                            <p className="font-medium text-sm">{r.pedido.nombreCliente}</p>
                            <p className="text-xs text-ink/50">{r.pedido.tituloPedido}</p>
                          </div>
                          <span className="text-xs text-ink/30 shrink-0">#{r.pedidoId}</span>
                        </div>
                        {r.comentarios && (
                          <p className="text-xs text-gold mt-2 bg-gold/5 rounded px-2 py-1">
                            {r.comentarios}
                          </p>
                        )}
                        <p className="text-xs text-ink/30 mt-1">{getEtapaLabel(r.pedido.taller, r.etapa)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page admin ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState('activos')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-caslon">Control de Producción</h1>
          <p className="text-sm text-ink/40 mt-0.5">Vista gerencia</p>
        </div>
        <a href="/" className="text-xs text-ink/30 hover:text-ink transition">Vista asesoras ↗</a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-black/5 rounded-xl p-1 mb-8 w-fit">
        {[
          { id: 'activos',   label: 'Pedidos activos' },
          { id: 'historial', label: 'Historial semanal' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id ? 'bg-white text-ink shadow-sm' : 'text-ink/40 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'activos'   && <TabActivos />}
      {tab === 'historial' && <TabHistorial />}
    </div>
  )
}
