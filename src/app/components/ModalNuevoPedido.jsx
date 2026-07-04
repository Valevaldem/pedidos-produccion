'use client'
import { useState } from 'react'
import { ASESORAS } from '@/lib/etapas'

export default function ModalNuevoPedido({ asesora, asesoraFija = true, onClose, onSaved }) {
  const [form, setForm] = useState({
    taller: 'MX',
    fechaConfirmacion: '',
    nombreCliente: '',
    tituloPedido: '',
    descripcionPieza: '',
    fechaCompromiso: '',
    asesora: asesora || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.fechaConfirmacion || !form.nombreCliente || !form.tituloPedido || !form.asesora) {
      setError('Llena los campos obligatorios (*).')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const pedido = await res.json()
      onSaved(pedido)
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="p-6 border-b border-black/5">
          <h2 className="text-xl font-caslon">Agregar pedido</h2>
          <p className="text-sm text-ink/50 mt-0.5">Llena los datos del pedido en producción</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Taller */}
          <div>
            <label className="label">Taller *</label>
            <div className="flex gap-2">
              {['MX', 'EU'].map(t => (
                <button
                  key={t}
                  onClick={() => set('taller', t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${
                    form.taller === t
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-ink border-black/15 hover:border-ink/40'
                  }`}
                >
                  {t === 'MX' ? '🇲🇽 Taller MX' : '🇺🇸 Taller EU'}
                </button>
              ))}
            </div>
          </div>

          {/* Asesora */}
          {asesoraFija ? (
            <div>
              <label className="label">Asesora</label>
              <div className="input bg-greige text-ink/50 cursor-not-allowed">{asesora}</div>
            </div>
          ) : (
            <div>
              <label className="label">Asesora *</label>
              <select className="input" value={form.asesora} onChange={e => set('asesora', e.target.value)}>
                <option value="">Selecciona asesora</option>
                {ASESORAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}

          {/* Fecha confirmación */}
          <div>
            <label className="label">Fecha de confirmación del pedido *</label>
            <input type="date" className="input" value={form.fechaConfirmacion}
              onChange={e => set('fechaConfirmacion', e.target.value)} />
          </div>

          {/* Nombre cliente */}
          <div>
            <label className="label">Nombre de la clienta *</label>
            <input type="text" className="input" placeholder="Ej. Ana García"
              value={form.nombreCliente} onChange={e => set('nombreCliente', e.target.value)} />
          </div>

          {/* Título pedido */}
          <div>
            <label className="label">Título / referencia del pedido *</label>
            <input type="text" className="input" placeholder="Ej. Anillo solitario Orión"
              value={form.tituloPedido} onChange={e => set('tituloPedido', e.target.value)} />
          </div>

          {/* Descripción pieza */}
          <div>
            <label className="label">
              Descripción de la pieza
              <span className="text-ink/30 font-normal ml-1">(solo si no es de línea)</span>
            </label>
            <textarea
              className="input resize-none" rows={2}
              placeholder="Ej. Argolla 18K con piedra central oval 1.5ct y pavé en los lados"
              value={form.descripcionPieza} onChange={e => set('descripcionPieza', e.target.value)}
            />
          </div>

          {/* Fecha compromiso */}
          <div>
            <label className="label">
              Fecha compromiso con clienta
              <span className="text-ink/30 font-normal ml-1">(solo si acordaste una fecha fuera del tiempo estándar)</span>
            </label>
            <input type="date" className="input" value={form.fechaCompromiso}
              onChange={e => set('fechaCompromiso', e.target.value)} />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        <div className="p-6 border-t border-black/5 flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-ink flex-1 disabled:opacity-50">
            {loading ? 'Guardando...' : 'Agregar pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}
