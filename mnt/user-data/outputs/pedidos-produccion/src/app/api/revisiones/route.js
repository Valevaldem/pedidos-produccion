import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/revisiones?semana=2026-06-30
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const semana = searchParams.get('semana')

    const revisiones = await prisma.revision.findMany({
      where: semana ? { semanaLunes: semana } : {},
      include: { pedido: true },
      orderBy: { creadoEn: 'asc' },
    })
    return NextResponse.json(revisiones)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/revisiones
// body: { asesora, semanaLunes, pedidoIds: [1,2,3] }
// Snapshot: captura la etapa actual de cada pedido al momento del submit
export async function POST(req) {
  try {
    const body = await req.json()
    const { asesora, semanaLunes, pedidoIds } = body

    // Evitar duplicados en la misma semana para el mismo pedido
    const existing = await prisma.revision.findMany({
      where: { semanaLunes, asesora, pedidoId: { in: pedidoIds } },
    })
    const yaReportados = existing.map(r => r.pedidoId)
    const nuevosIds = pedidoIds.filter(id => !yaReportados.includes(id))

    if (nuevosIds.length === 0) {
      return NextResponse.json({ count: 0, message: 'Ya reportados esta semana' })
    }

    // Capturar etapa y comentarios actuales de cada pedido
    const pedidos = await prisma.pedido.findMany({ where: { id: { in: nuevosIds } } })

    await prisma.revision.createMany({
      data: pedidos.map(p => ({
        pedidoId:   p.id,
        semanaLunes,
        asesora,
        etapa:      p.etapa,
        comentarios: p.comentarios,
      })),
    })

    return NextResponse.json({ count: nuevosIds.length })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
