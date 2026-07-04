import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const rows = await prisma.consulta.groupBy({
      by: ['semanaLunes'],
      orderBy: { semanaLunes: 'desc' },
    })
    return NextResponse.json(rows.map(r => r.semanaLunes))
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
