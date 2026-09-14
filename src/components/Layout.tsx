import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  FileBarChart,
  Download,
  LogOut,
  Bell,
  Menu,
  X,
  Store,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchAlertes } from '@/lib/db';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/produits', label: 'Produits', icon: Package },
  { to: '/mouvements', label: 'Mouvements', icon: ArrowLeftRight },
  { to: '/rapports', label: 'Rapports', icon: FileBarChart },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { session, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const alertes = await fetchAlertes();
        if (active) setAlertCount(alertes.length);
      } catch {
        /* ignore */
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-stone-900 text-stone-100 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-6 h-16 border-b border-stone-800">
          <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
            <Store className="w-5 h-5 text-stone-900" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Épicerie Fine</p>
            <p className="text-xs text-stone-400">Gestion de stock</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? 'bg-amber-500 text-stone-900'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                {item.label}
                {item.to === '/' && alertCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {alertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-stone-800 space-y-1">
          <Link
            to="/produits"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
          >
            <Download className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            Export CSV
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-stone-200 h-16 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-stone-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-semibold text-stone-800 capitalize">
              {navItems.find((n) => isActive(n.to))?.label ?? 'Inventaire'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="relative p-2 rounded-lg hover:bg-stone-100 transition-colors"
              title="Alertes"
            >
              <Bell className="w-5 h-5 text-stone-600" />
              {alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {alertCount}
                </span>
              )}
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-sm text-stone-600">
              <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-semibold text-stone-700">
                {(session?.user?.email ?? 'A')[0].toUpperCase()}
              </div>
              <span className="max-w-[160px] truncate">{session?.user?.email}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
