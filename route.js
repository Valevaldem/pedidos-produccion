import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const asesora = searchParams.get('asesora')
    const soloActivos = searchParams.get('activos') !== 'false'

    const where = {}
    if (soloActivos) where.activo = true
    if (asesora) where.asesora = asesora

    const pedidos = await prisma.pedido.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
    })
    return NextResponse.json(pedidos)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const pedido = await prisma.pedido.create({
      data: {
        taller:           body.taller,
        fechaConfirmacion: body.fechaConfirmacion,
        nombreCliente:    body.nombreCliente,
        tituloPedido:     body.tituloPedido,
        descripcionPieza: body.descripcionPieza || null,
        fechaCompromiso:  body.fechaCompromiso  || null,
        asesora:          body.asesora,
        etapa:            1,
      },
    })
    return NextResponse.json(pedido)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
