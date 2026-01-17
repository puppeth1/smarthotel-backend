import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 }
      )
    }

    const body = await req.json()

    const res = await fetch(
      'https://smarthotel-back-984031420056.asia-south1.run.app/subscriptions/create',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      }
    )

    const text = await res.text()

    // If backend didn't return JSON, surface it
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    console.error('API proxy error:', err)
    return NextResponse.json(
      { error: 'Proxy failed', message: err?.message },
      { status: 500 }
    )
  }
}

