'use client'
import { useState, useEffect } from 'react'
import {
  ASESORAS, getEtapas, getEtapaLabel, getMaxEtapa,
  diasHabiles, getLunesDe, formatFecha,
} from '@/lib/etapas'
import ModalNuevoPedido from '@/app/components/ModalNuevoPedido'

const SEMANA_ACTUAL = getLunesDe()

function formatSemana(str) {
  if (!str) return ''
  const d = new Date(str + 'T12:00:00')
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Tab: Esta semana ─────────────────────────────────────────────────────────

function TabEstaSemana() {
  const [consultas, setConsultas]   = useState([])
  const [loading,   setLoading]     = useState(true)
  const [editando,  setEditando]    = useState({})
  const [guardando, setGuardando]   = useState(null)
  const [modal,     setModal]       = useState(false)
  const [toast,     setToast]       = useState(null)
  const [filtro,    setFiltro]      = useState('Todas')

  const mostrarToast = (msg, tipo = 'ok') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  const cargar = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/consultas?semana=${SEMANA_ACTUAL}`)
      const data = await res.json()
      setConsultas(data)
      const init = {}
      data.forEach(c => {
        init[c.id] = { etapa: c.etapa ?? '', comentarios: c.comentarios ?? '' }
      })
      setEditando(init)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const handleGuardar = async (id) => {
    const { etapa, comentarios } = editando[id] || {}
    if (etapa === '' || etapa === null || etapa === undefined) {
      mostrarToast('Selecciona una etapa', 'error')
      return
    }
    setGuardando(id)
    try {
      await fetch(`/api/consultas/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ etapa: parseInt(etapa), comentarios }),
      })
      mostrarToast('Guardado ✓')
      await cargar()
    } catch { mostrarToast('Error al guardar', 'error') }
    finally  { setGuardando(null) }
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta consulta?')) return
    try {
      await fetch(`/api/consultas/${id}`, { method: 'DELETE' })
      mostrarToast('Eliminado')
      await cargar()
    } catch { mostrarToast('Error', 'error') }
  }

  const setEdit = (id, campo, valor) =>
    setEditando(prev => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }))

  const consultasFiltradas = filtro === 'Todas'
    ? consultas
    : consultas.filter(c => c.asesora === filtro)

  // Agrupar por asesora
  const porAsesora = {}
  consultasFiltradas.forEach(c => {
    if (!porAsesora[c.asesora]) porAsesora[c.asesora] = []
    porAsesora[c.asesora].push(c)
  })

  const pendientes  = consultas.filter(c => c.etapa === null || c.etapa === undefined).length
  const contestados = consultas.filter(c => c.etapa !== null && c.etapa !== undefined).length

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.tipo === 'error' ? 'bg-red-500' : 'bg-ink'}`}>
          {toast.msg}
        </div>
      )}

      {/* Stats + toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-3">
          <div className="bg-white rounded-xl px-4 py-2 border border-black/5 text-center">
            <p className="text-xl font-semibold">{consultas.length}</p>
            <p className="text-xs text-ink/40">total</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-2 border border-black/5 text-center">
            <p className="text-xl font-semibold text-amber-600">{pendientes}</p>
            <p className="text-xs text-ink/40">pendientes</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-2 border border-black/5 text-center">
            <p className="text-xl font-semibold text-green-600">{contestados}</p>
            <p className="text-xs text-ink/40">contestados</p>
          </div>
        </div>

        <select
          className="border border-black/10 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none"
          value={filtro} onChange={e => setFiltro(e.target.value)}
        >
          <option value="Todas">Todas las asesoras</option>
          {ASESORAS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <button onClick={() => setModal(true)} className="btn-gold ml-auto">
          + Agregar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-ink/30 text-sm">Cargando...</div>
      ) : consultas.length === 0 ? (
        <div className="card p-12 text-center text-ink/30 text-sm border-dashed">
          Aún no hay pedidos esta semana
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(porAsesora).sort().map(([asesora, lista]) => {
            const pend = lista.filter(c => c.etapa === null || c.etapa === undefined).length
            return (
              <div key={asesora}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-ink/50 uppercase tracking-wider">{asesora}</h3>
                  <span className="text-xs text-ink/30">{lista.length} pedido{lista.length !== 1 ? 's' : ''}</span>
                  {pend > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-auto">
                      {pend} sin contestar
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {lista.map(c => {
                    const ed     = editando[c.id] || { etapa: '', comentarios: '' }
                    const etapas = getEtapas(c.taller)
                    const max    = getMaxEtapa(c.taller)
                    const yaContestado = c.etapa !== null && c.etapa !== undefined
                    const cambio = String(ed.etapa) !== String(c.etapa ?? '') || ed.comentarios !== (c.comentarios ?? '')

                    return (
                      <div key={c.id} className={`card p-5 ${!yaContestado ? 'border-amber-200' : ''}`}>
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.taller === 'MX' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
                          }`}>
                            {c.taller === 'MX' ? '🇲🇽 MX' : '🇺🇸 EU'}
                          </span>
                          {yaContestado ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">✓ Contestado</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Pendiente</span>
                          )}
                          <span className="text-xs text-ink/25 ml-auto">#{c.id}</span>
                        </div>

                        {/* Datos */}
                        <p className="font-semibold text-ink">{c.nombreCliente}</p>
                        <p className="text-sm text-ink/60 mb-1">{c.tituloPedido}</p>
                        {c.descripcionPieza && (
                          <p className="text-xs text-ink/40 italic mb-2">{c.descripcionPieza}</p>
                        )}
                        <div className="flex flex-wrap gap-x-4 text-xs text-ink/40 mb-4">
                          <span>Confirmado: {formatFecha(c.fechaConfirmacion)}</span>
                          <span>{diasHabiles(c.fechaConfirmacion)} días hábiles</span>
                          {c.fechaCompromiso && (
                            <span className="text-amber-700 font-medium">⚑ Compromiso: {formatFecha(c.fechaCompromiso)}</span>
                          )}
                        </div>

                        {/* Editor etapa + comentarios */}
                        <div className="grid sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="label">Etapa</label>
                            <select
                              className="input"
                              value={ed.etapa}
                              onChange={e => setEdit(c.id, 'etapa', e.target.value)}
                            >
                              <option value="">— Sin contestar —</option>
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
                              className="input resize-none" rows={2}
                              placeholder="Ej. Adrián dice que sale el viernes"
                              value={ed.comentarios}
                              onChange={e => setEdit(c.id, 'comentarios', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-2 pt-2 border-t border-black/5">
                          <button
                            onClick={() => handleGuardar(c.id)}
                            disabled={!cambio || guardando === c.id}
                            className={`text-sm px-4 py-1.5 rounded-lg font-medium transition disabled:opacity-50 ${
                              cambio ? 'bg-gold text-white hover:opacity-90' : 'bg-black/5 text-ink/30 cursor-not-allowed'
                            }`}
                          >
                            {guardando === c.id ? 'Guardando...' : cambio ? 'Guardar' : 'Sin cambios'}
                          </button>
                          <button
                            onClick={() => handleEliminar(c.id)}
                            className="text-xs text-ink/25 hover:text-red-500 ml-auto transition"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <ModalNuevoPedido
          asesora=""
          asesoraFija={false}
          onClose={() => setModal(false)}
          onSaved={async () => { setModal(false); mostrarToast('Pedido agregado ✓'); await cargar() }}
        />
      )}
    </div>
  )
}

// ─── Tab: Historial ───────────────────────────────────────────────────────────

function TabHistorial() {
  const [semanas,   setSemanas]   = useState([])
  const [semana,    setSemana]    = useState('')
  const [consultas, setConsultas] = useState([])
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    fetch('/api/consultas/semanas')
      .then(r => r.json())
      .then(data => {
        // Excluir semana actual del historial
        const pasadas = data.filter(s => s < SEMANA_ACTUAL)
        setSemanas(pasadas)
        if (pasadas.length > 0) setSemana(pasadas[0])
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!semana) return
    setLoading(true)
    fetch(`/api/consultas?semana=${semana}`)
      .then(r => r.json())
      .then(data => { setConsultas(data); setLoading(false) })
      .catch(e => { console.error(e); setLoading(false) })
  }, [semana])

  // Agrupar por asesora
  const porAsesora = {}
  consultas.forEach(c => {
    if (!porAsesora[c.asesora]) porAsesora[c.asesora] = []
    porAsesora[c.asesora].push(c)
  })

  return (
    <div>
      {semanas.length === 0 ? (
        <div className="card p-12 text-center text-ink/30 text-sm border-dashed">
          Aún no hay semanas en el historial
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label className="label">Semana</label>
            <select
              className="border border-black/10 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
              value={semana} onChange={e => setSemana(e.target.value)}
            >
              {semanas.map(s => (
                <option key={s} value={s}>Semana del {formatSemana(s)}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-ink/30 text-sm">Cargando...</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(porAsesora).sort().map(([asesora, lista]) => (
                <div key={asesora}>
                  <h3 className="text-sm font-semibold text-ink/40 uppercase tracking-wider mb-2">
                    {asesora} — {lista.length} pedido{lista.length !== 1 ? 's' : ''}
                  </h3>
                  <div className="card divide-y divide-black/5">
                    {lista.map(c => (
                      <div key={c.id} className="p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.taller === 'MX' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
                          }`}>
                            {c.taller}
                          </span>
                          {c.etapa !== null && c.etapa !== undefined ? (
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                              Etapa {c.etapa}/{getMaxEtapa(c.taller)}
                            </span>
                          ) : (
                            <span className="text-xs bg-stone-100 text-ink/30 px-2 py-0.5 rounded-full">
                              Sin contestar
                            </span>
                          )}
                          <span className="text-xs text-ink/20 ml-auto">#{c.id}</span>
                        </div>

                        <p className="font-medium text-sm">{c.nombreCliente}</p>
                        <p className="text-xs text-ink/50 mb-1">{c.tituloPedido}</p>

                        {c.etapa !== null && c.etapa !== undefined && (
                          <p className="text-xs text-gold">{getEtapaLabel(c.taller, c.etapa)}</p>
                        )}
                        {c.comentarios && (
                          <p className="text-xs text-ink/50 mt-1 bg-gold/5 rounded px-2 py-1">{c.comentarios}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Page admin ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState('semana')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-caslon">Control de Producción</h1>
          <p className="text-xs text-ink/40 mt-0.5">Semana del {formatSemana(SEMANA_ACTUAL)}</p>
        </div>
        <a href="/" className="text-xs text-ink/30 hover:text-ink transition">Vista asesoras ↗</a>
      </div>

      <div className="flex gap-1 bg-black/5 rounded-xl p-1 mb-8 w-fit">
        {[
          { id: 'semana',   label: 'Esta semana' },
          { id: 'historial', label: 'Historial' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id ? 'bg-white text-ink shadow-sm' : 'text-ink/40 hover:text-ink'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'semana'   && <TabEstaSemana />}
      {tab === 'historial' && <TabHistorial />}
    </div>
  )
}
