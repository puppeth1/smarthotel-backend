export default async function InventoryPage() {
  const res = await fetch('http://localhost:3000/api/inventory', { cache: 'no-store' })
  const json = await res.json()
  const items = json.data || []
  return (
    <div style={{ padding: 24 }}>
      <h1>Inventory</h1>
      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Unit</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i: any) => {
            const isLow = typeof i.min_stock !== 'undefined' && i.stock <= i.min_stock
            return (
            <tr key={i.id} style={isLow ? { backgroundColor: '#ffecec' } : undefined}>
              <td>{i.name}</td>
              <td>{i.unit}</td>
              <td>{i.stock}</td>
              <td>{isLow ? <span style={{ color: '#b00020', fontWeight: 700 }}>LOW</span> : '-'}</td>
              <td>{new Date(i.updated_at || i.created_at).toLocaleString()}</td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  )
}
