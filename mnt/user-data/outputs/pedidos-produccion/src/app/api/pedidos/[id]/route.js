import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(req, { params }) {
  try {
    const id = parseInt(params.id)
    const body = await req.json()

    const data = {}
    if (body.etapa      !== undefined) data.etapa      = body.etapa
    if (body.comentarios !== undefined) data.comentarios = body.comentarios
    if (body.activo      !== undefined) data.activo      = body.activo

    const pedido = await prisma.pedido.update({ where: { id }, data })
    return NextResponse.json(pedido)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
