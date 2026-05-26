'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Megaphone, Image, MessageCircle,
  BarChart3, Settings, ChevronDown, LogOut, Zap, FileText,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campañas', href: '/campaigns', icon: Megaphone },
  { name: 'CRM', href: '/crm', icon: Users },
  { name: 'Biblioteca', href: '/media', icon: Image },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageCircle },
  { name: 'Automatización', href: '/automations', icon: Zap },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Reportes', href: '/reports', icon: FileText },
  { name: 'Usuarios', href: '/users', icon: UserCheck },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, tenant, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken') || undefined;
      await authApi.logout(refreshToken);
    } finally {
      logout();
      window.location.href = '/login';
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-gray-200 flex flex-col">
      {/* Logo / Tenant */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-200">
        {tenant?.logoUrl ? (
          <img src={tenant.logoUrl} alt={tenant.name} className="w-8 h-8 rounded-lg object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">{tenant?.name?.[0] || 'M'}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{tenant?.name || 'MLM SaaS'}</p>
          <p className="text-xs text-gray-500 capitalize">{tenant?.plan?.toLowerCase() || 'starter'}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.name}
              {item.name === 'WhatsApp' && (
                <span className="ml-auto bg-green-100 text-green-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  EN VIVO
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Usuario logueado */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.role?.toLowerCase().replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
