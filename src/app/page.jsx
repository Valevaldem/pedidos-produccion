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
    <div className={`card p-5 ${contestado ? '' : 'border-dashed'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          c.taller === 'MX' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
        }`}>
          {c.taller === 'MX' ? '🇲🇽 MX' : '🇺🇸 EU'}
        </span>

        {contestado ? (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
            ✓ Contestado
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-stone-100 text-ink/40">
            Pendiente de respuesta
          </span>
        )}

        <span className="text-xs text-ink/25 ml-auto">#{c.id}</span>
      </div>

      {/* Datos del pedido */}
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

      {/* Respuesta de Vale */}
      {contestado ? (
        <div className="bg-gold/5 border border-gold/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gold">
              Etapa {c.etapa}/{getMaxEtapa(c.taller)} — {getEtapaLabel(c.taller, c.etapa)}
            </span>
          </div>
          {c.comentarios && (
            <p className="text-sm text-ink/70">{c.comentarios}</p>
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

// ─── Vista asesora ────────────────────────────────────────────────────────────

function AsesoraView({ asesora, onBack }) {
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
      setConsultas(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [asesora])

  const handleGuardado = async () => {
    setModal(false)
    mostrarToast('Pedido enviado ✓')
    await cargar()
  }

  const pendientes  = consultas.filter(c => c.etapa === null || c.etapa === undefined)
  const contestados = consultas.filter(c => c.etapa !== null && c.etapa !== undefined)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.tipo === 'error' ? 'bg-red-500' : 'bg-ink'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <button onClick={onBack} className="text-sm text-ink/40 hover:text-ink mb-6 flex items-center gap-1">
        ← Cambiar nombre
      </button>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-caslon">Hola, {asesora}</h1>
          <p className="text-xs text-ink/40 mt-0.5">Semana del {formatSemana(SEMANA_ACTUAL)}</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-gold shrink-0">
          + Agregar
        </button>
      </div>

      {/* Stats rápidos */}
      {consultas.length > 0 && (
        <div className="flex gap-3 mt-4 mb-6">
          <div className="bg-white rounded-xl px-4 py-2.5 border border-black/5 text-center flex-1">
            <p className="text-2xl font-semibold text-ink">{consultas.length}</p>
            <p className="text-xs text-ink/40">esta semana</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-2.5 border border-black/5 text-center flex-1">
            <p className="text-2xl font-semibold text-green-600">{contestados.length}</p>
            <p className="text-xs text-ink/40">contestados</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-2.5 border border-black/5 text-center flex-1">
            <p className="text-2xl font-semibold text-ink/30">{pendientes.length}</p>
            <p className="text-xs text-ink/40">pendientes</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-ink/30 text-sm">Cargando...</div>
      ) : consultas.length === 0 ? (
        <div className="card p-12 text-center border-dashed">
          <p className="text-ink/30 text-sm mb-4">No has agregado pedidos esta semana</p>
          <button onClick={() => setModal(true)} className="btn-ink">
            Agregar primer pedido
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pendientes primero */}
          {pendientes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink/40 uppercase tracking-wider mb-3">
                Pendientes de respuesta
              </p>
              {pendientes.map(c => <ConsultaCard key={c.id} c={c} />)}
            </div>
          )}

          {/* Contestados */}
          {contestados.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-medium text-ink/40 uppercase tracking-wider mb-3">
                Contestados
              </p>
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
