import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarthotel-back-984031420056.asia-south1.run.app'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization')
    const body = await req.json()
    const id = params.id

    const headers: any = {
      'Content-Type': 'application/json',
    }
    if (authHeader) headers['Authorization'] = authHeader

    const res = await fetch(`${API_URL}/bookings/${id}`, {
      method: 'PUT', // Or PATCH depending on backend
      headers,
      body: JSON.stringify(body),
    })

    // If PUT fails with 404/405, try PATCH (common backend variance)
    if (res.status === 405) {
       const resPatch = await fetch(`${API_URL}/bookings/${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(body),
       })
       const text = await resPatch.text()
       let data
       try { data = JSON.parse(text) } catch { data = { message: text } }
       return NextResponse.json(data, { status: resPatch.status })
    }

    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    console.error('Booking ID proxy error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization')
    const id = params.id

    const headers: any = {
      'Content-Type': 'application/json',
    }
    if (authHeader) headers['Authorization'] = authHeader

    const res = await fetch(`${API_URL}/bookings/${id}`, {
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
    console.error('Booking ID GET proxy error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const authHeader = req.headers.get('authorization')
      const id = params.id
  
      const headers: any = {
        'Content-Type': 'application/json',
      }
      if (authHeader) headers['Authorization'] = authHeader
  
      const res = await fetch(`${API_URL}/bookings/${id}`, {
        method: 'DELETE',
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
      console.error('Booking ID DELETE proxy error:', err)
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }
