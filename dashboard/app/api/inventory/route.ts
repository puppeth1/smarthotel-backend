import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarthotel-back-984031420056.asia-south1.run.app'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const headers: any = {
      'Content-Type': 'application/json',
    }
    if (authHeader) headers['Authorization'] = authHeader

    const targetUrl = `${API_URL}/inventory`
    const res = await fetch(targetUrl, { headers })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
