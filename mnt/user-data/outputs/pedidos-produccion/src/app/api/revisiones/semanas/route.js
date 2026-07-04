import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const rows = await prisma.revision.groupBy({
      by: ['semanaLunes'],
      orderBy: { semanaLunes: 'desc' },
    })
    const semanas = rows.map(r => r.semanaLunes)
    return NextResponse.json(semanas)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
