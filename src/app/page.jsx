'use client'
import { useState, useEffect } from 'react'
import {
  ASESORAS, getEtapaLabel, getMaxEtapa,
  diasHabiles, getLunesDe, formatFecha,
} from '@/lib/etapas'
import ModalNuevoPedido from '@/app/components/ModalNuevoPedido'

const SEMANA_ACTUAL = getLunesDe()

function formatSemana(str) {
  if (!str) return ''
  const d = new Date(str + 'T12:00:00')
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Card de consulta ─────────────────────────────────────────────────────────

function ConsultaCard({ c }) {
  const contestado = c.etapa !== null && c.etapa !== undefined

  return (
    <div className={`card p-5 ${!contestado ? 'border-dashed' : ''}`}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          c.taller === 'MX' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
        }`}>
          {c.taller === 'MX' ? '🇲🇽 MX' : '🇺🇸 EU'}
        </span>
        {contestado ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
            ✓ Contestado
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-ink/40 font-medium">
            Pendiente de respuesta
          </span>
        )}
        <span className="text-xs text-ink/25 ml-auto">#{c.id}</span>
      </div>

      <p className="font-semibold text-ink">{c.nombreCliente}</p>
      <p className="text-sm text-ink/60 mb-1">{c.tituloPedido}</p>
      {c.descripcionPieza && (
        <p className="text-xs text-ink/40 italic mb-2">{c.descripcionPieza}</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink/40 mb-3">
        <span>Confirmado: {formatFecha(c.fechaConfirmacion)}</span>
        <span>{diasHabiles(c.fechaConfirmacion)} días hábiles en producción</span>
        {c.fechaCompromiso && (
          <span className="text-amber-700 font-medium">⚑ Compromiso: {formatFecha(c.fechaCompromiso)}</span>
        )}
      </div>

      {contestado ? (
        <div className="bg-gold/5 border border-gold/20 rounded-xl p-3">
          <p className="text-xs font-semibold text-gold mb-0.5">
            Etapa {c.etapa}/{getMaxEtapa(c.taller)} — {getEtapaLabel(c.taller, c.etapa)}
          </p>
          {c.comentarios && (
            <p className="text-sm text-ink/70 mt-1">{c.comentarios}</p>
          )}
        </div>
      ) : (
        <div className="bg-black/[0.03] rounded-xl p-3 text-xs text-ink/30 text-center">
          Gerencia responderá con la etapa de este pedido
        </div>
      )}
    </div>
  )
}

// ─── Tab Esta semana ──────────────────────────────────────────────────────────

function TabEstaSemana({ asesora, onAgregado }) {
  const [consultas, setConsultas] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [toast,     setToast]     = useState(null)

  const mostrarToast = (msg, tipo = 'ok') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  const cargar = async () => {
    try {
      const res = await fetch(`/api/consultas?semana=${SEMANA_ACTUAL}&asesora=${encodeURIComponent(asesora)}`)
      if (res.ok) setConsultas(await res.json())
      else setConsultas([])
    } catch { setConsultas([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [asesora])

  const handleGuardado = async () => {
    setModal(false)
    mostrarToast('Pedido enviado ✓')
    await cargar()
    onAgregado?.()
  }

  const pendientes  = consultas.filter(c => c.etapa === null || c.etapa === undefined)
  const contestados = consultas.filter(c => c.etapa !== null && c.etapa !== undefined)

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.tipo === 'error' ? 'bg-red-500' : 'bg-ink'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-ink/40">Semana del {formatSemana(SEMANA_ACTUAL)}</p>
        <button onClick={() => setModal(true)} className="btn-gold">+ Agregar</button>
      </div>

      {consultas.length > 0 && (
        <div className="flex gap-3 mb-5">
          <div className="bg-white rounded-xl px-4 py-2 border border-black/5 text-center flex-1">
            <p className="text-xl font-semibold">{consultas.length}</p>
            <p className="text-xs text-ink/40">esta semana</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-2 border border-black/5 text-center flex-1">
            <p className="text-xl font-semibold text-green-600">{contestados.length}</p>
            <p className="text-xs text-ink/40">contestados</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-2 border border-black/5 text-center flex-1">
            <p className="text-xl font-semibold text-ink/30">{pendientes.length}</p>
            <p className="text-xs text-ink/40">pendientes</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-ink/30 text-sm">Cargando...</div>
      ) : consultas.length === 0 ? (
        <div className="card p-12 text-center border-dashed">
          <p className="text-ink/30 text-sm mb-4">No has agregado pedidos esta semana</p>
          <button onClick={() => setModal(true)} className="btn-ink">Agregar primer pedido</button>
        </div>
      ) : (
        <div className="space-y-4">
          {pendientes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink/40 uppercase tracking-wider mb-3">Pendientes</p>
              {pendientes.map(c => <ConsultaCard key={c.id} c={c} />)}
            </div>
          )}
          {contestados.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-ink/40 uppercase tracking-wider mb-3">Contestados</p>
              {contestados.map(c => <ConsultaCard key={c.id} c={c} />)}
            </div>
          )}
        </div>
      )}

      {modal && (
        <ModalNuevoPedido
          asesora={asesora}
          asesoraFija={true}
          onClose={() => setModal(false)}
          onSaved={handleGuardado}
        />
      )}
    </div>
  )
}

// ─── Tab Historial (asesora) ──────────────────────────────────────────────────

function TabHistorial({ asesora }) {
  const [semanas,   setSemanas]   = useState([])
  const [semana,    setSemana]    = useState('')
  const [consultas, setConsultas] = useState([])
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    fetch('/api/consultas/semanas')
      .then(r => r.json())
      .then(data => {
        setSemanas(data)
        if (data.length > 0) setSemana(data[0])
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!semana) return
    setLoading(true)
    fetch(`/api/consultas?semana=${semana}&asesora=${encodeURIComponent(asesora)}`)
      .then(r => r.json())
      .then(data => { setConsultas(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setConsultas([]); setLoading(false) })
  }, [semana, asesora])

  return (
    <div>
      {semanas.length === 0 ? (
        <div className="card p-12 text-center text-ink/30 text-sm border-dashed">
          Aún no hay semanas en el historial
        </div>
      ) : (
        <>
          <div className="mb-5">
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
          ) : consultas.length === 0 ? (
            <div className="card p-8 text-center text-ink/30 text-sm border-dashed">
              No hay pedidos tuyos en esta semana
            </div>
          ) : (
            <div className="space-y-4">
              {consultas.map(c => <ConsultaCard key={c.id} c={c} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Vista asesora con tabs ───────────────────────────────────────────────────

function AsesoraView({ asesora, onBack }) {
  const [tab, setTab] = useState('semana')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={onBack} className="text-sm text-ink/40 hover:text-ink mb-6 flex items-center gap-1">
        ← Cambiar nombre
      </button>

      <h1 className="text-2xl font-caslon mb-1">Hola, {asesora}</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-black/5 rounded-xl p-1 mb-6 w-fit mt-4">
        {[
          { id: 'semana',    label: 'Esta semana' },
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

      {tab === 'semana'    && <TabEstaSemana asesora={asesora} />}
      {tab === 'historial' && <TabHistorial  asesora={asesora} />}
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
      <p className="text-ink/50 text-sm mb-10">
        Agrega los pedidos que quieres consultar esta semana
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ASESORAS.map(nombre => (
          <button key={nombre} onClick={() => setAsesora(nombre)}
            className="card p-4 text-sm font-medium hover:ring-2 hover:ring-gold hover:shadow-md transition text-left">
            {nombre}
          </button>
        ))}
      </div>
    </div>
  )
}
