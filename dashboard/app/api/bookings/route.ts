import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarthotel-back-984031420056.asia-south1.run.app'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const headers: any = {
      'Content-Type': 'application/json',
    }
    if (authHeader) headers['Authorization'] = authHeader

    const url = new URL(req.url)
    const searchParams = url.searchParams.toString()
    const targetUrl = `${API_URL}/bookings${searchParams ? `?${searchParams}` : ''}`

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers,
    })

    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    console.error('Bookings GET proxy error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const body = await req.json()

    const headers: any = {
      'Content-Type': 'application/json',
    }
    if (authHeader) headers['Authorization'] = authHeader

    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    console.error('Booking proxy error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
