import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(req, { params }) {
  try {
    const id   = parseInt(params.id)
    const body = await req.json()

    const data = {}
    if (body.etapa      !== undefined) data.etapa      = body.etapa
    if (body.comentarios !== undefined) data.comentarios = body.comentarios

    const consulta = await prisma.consulta.update({ where: { id }, data })
    return NextResponse.json(consulta)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const id = parseInt(params.id)
    await prisma.consulta.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
