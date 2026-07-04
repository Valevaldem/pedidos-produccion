import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/consultas?semana=2026-06-30&asesora=Fernanda
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const semana  = searchParams.get('semana')
    const asesora = searchParams.get('asesora')

    const where = {}
    if (semana)  where.semanaLunes = semana
    if (asesora) where.asesora     = asesora

    const consultas = await prisma.consulta.findMany({
      where,
      orderBy: { creadoEn: 'asc' },
    })
    return NextResponse.json(consultas)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/consultas
export async function POST(req) {
  try {
    const body = await req.json()
    const consulta = await prisma.consulta.create({
      data: {
        semanaLunes:       body.semanaLunes,
        taller:            body.taller,
        fechaConfirmacion: body.fechaConfirmacion,
        nombreCliente:     body.nombreCliente,
        tituloPedido:      body.tituloPedido,
        descripcionPieza:  body.descripcionPieza  || null,
        fechaCompromiso:   body.fechaCompromiso   || null,
        asesora:           body.asesora,
        // etapa y comentarios siempre null al crear — los pone Vale
      },
    })
    return NextResponse.json(consulta)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
