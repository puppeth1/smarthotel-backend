export default async function OrdersPage() {
  const res = await fetch('http://localhost:3000/api/orders', { cache: 'no-store' })
  const json = await res.json()
  const orders = json.data || []
  return (
    <div style={{ padding: 24 }}>
      <h1>Orders</h1>
      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Room</th>
            <th>Status</th>
            <th>Items</th>
            <th>Total</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o: any) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.room_number}</td>
              <td style={{ fontWeight: 600 }}>{o.status}</td>
              <td>
                {o.items.map((i: any, idx: number) => (
                  <div key={idx}>{i.qty} × {i.name}</div>
                ))}
              </td>
              <td>₹{o.items.reduce((sum: number, i: any) => sum + i.qty * i.price, 0)}</td>
              <td>{new Date(o.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
