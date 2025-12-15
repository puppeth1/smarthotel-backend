const menu = ['Home', 'Rooms', 'Inventory', 'Orders', 'Billing']

export default function NavBar({ active }: { active?: string }) {
  return (
    <nav className="bg-bg border-b border-borderLight px-6 py-3">
      <ul className="flex gap-2">
        {menu.map((item) => (
          <li
            key={item}
            className={`px-4 py-2 rounded-lg cursor-pointer text-sm font-medium ${
              active === item
                ? 'bg-accentPrimary text-textPrimary'
                : 'bg-bgSoft text-textMuted hover:bg-accentSecondary'
            }`}
          >
            <a href={`/${item.toLowerCase() === 'home' ? '' : item.toLowerCase()}`}>{item}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
