import { NavLink, Outlet } from 'react-router-dom'
import { Home, BarChart3, Users, User } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: '账单' },
  { to: '/stats', icon: BarChart3, label: '统计' },
  { to: '/family', icon: Users, label: '家庭' },
  { to: '/profile', icon: User, label: '我的' },
]

export default function Layout() {
  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      <main className="flex-1 pb-16 overflow-auto">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-14 safe-bottom z-10">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                isActive ? 'text-indigo-600' : 'text-gray-400'
              }`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
