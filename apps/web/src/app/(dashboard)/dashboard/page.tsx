'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, crmApi, campaignsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  Users, TrendingUp, DollarSign, Megaphone,
  ArrowUpRight, ArrowDownRight, MessageCircle, Target,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ── Tipos ─────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

// ── Componente Stat Card ───────────────────────────────────────
function StatCard({ title, value, change, icon, color }: StatCardProps) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{Math.abs(change)}% vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Datos de gráficas de ejemplo ───────────────────────────────
const leadsChartData = [
  { day: 'Lun', leads: 12, conversiones: 3 },
  { day: 'Mar', leads: 19, conversiones: 5 },
  { day: 'Mié', leads: 8, conversiones: 2 },
  { day: 'Jue', leads: 25, conversiones: 8 },
  { day: 'Vie', leads: 31, conversiones: 11 },
  { day: 'Sáb', leads: 17, conversiones: 4 },
  { day: 'Dom', leads: 9, conversiones: 2 },
];

const platformData = [
  { name: 'Meta Ads', value: 54, color: '#3b82f6' },
  { name: 'TikTok', value: 28, color: '#8b5cf6' },
  { name: 'WhatsApp', value: 12, color: '#22c55e' },
  { name: 'Otros', value: 6, color: '#f59e0b' },
];

// ── Página Principal ───────────────────────────────────────────
export default function DashboardPage() {
  const { user, tenant } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsApi.getDashboard,
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });

  const { data: recentLeads } = useQuery({
    queryKey: ['leads', { limit: 5 }],
    queryFn: () => crmApi.getLeads({ limit: 5 }),
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {user?.firstName} 👋
          </h1>
          <p className="text-gray-500 mt-0.5">
            Aquí está el resumen de {tenant?.name} — actualizado ahora mismo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            En tiempo real
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Leads Totales"
          value={isLoading ? '...' : stats?.leads?.total?.toLocaleString() || 0}
          change={12}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Leads Este Mes"
          value={isLoading ? '...' : stats?.leads?.thisMonth?.toLocaleString() || 0}
          change={8}
          icon={<Target className="w-5 h-5 text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          title="Ingresos (Ganados)"
          value={isLoading ? '...' : `$${(stats?.conversions?.value || 0).toLocaleString()}`}
          change={23}
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Tasa de Conversión"
          value={isLoading ? '...' : `${stats?.conversions?.rate || 0}%`}
          change={-2}
          icon={<TrendingUp className="w-5 h-5 text-orange-600" />}
          color="bg-orange-50"
        />
      </div>

      {/* Segunda fila de KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Campañas Activas"
          value={isLoading ? '...' : stats?.campaigns?.active || 0}
          icon={<Megaphone className="w-5 h-5 text-pink-600" />}
          color="bg-pink-50"
        />
        <StatCard
          title="Gasto en Ads"
          value={isLoading ? '...' : `$${(stats?.spend?.total || 0).toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5 text-red-600" />}
          color="bg-red-50"
        />
        <StatCard
          title="ROI"
          value={isLoading ? '...' : `${stats?.roi || 0}%`}
          change={5}
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
          color="bg-indigo-50"
        />
        <StatCard
          title="Contactos"
          value={isLoading ? '...' : stats?.contacts?.total?.toLocaleString() || 0}
          icon={<MessageCircle className="w-5 h-5 text-teal-600" />}
          color="bg-teal-50"
        />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads por día */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Leads vs Conversiones</h2>
              <p className="text-xs text-gray-500 mt-0.5">Últimos 7 días</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={leadsChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="leads" name="Leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="conversiones" name="Conversiones" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fuente de leads */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Fuente de Leads</h2>
          <p className="text-xs text-gray-500 mb-4">Este mes</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={platformData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {platformData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {platformData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de leads recientes */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Leads Recientes</h2>
          <a href="/crm" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver todos →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 uppercase">Contacto</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 uppercase">Estado</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 uppercase">Fuente</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 uppercase">Valor</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 uppercase">Asignado a</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads?.data?.map((lead: any) => (
                <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {lead.contact?.firstName?.[0]}{lead.contact?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {lead.contact?.firstName} {lead.contact?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{lead.contact?.email || lead.contact?.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <LeadStatusBadge status={lead.status} />
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-gray-600 capitalize">{lead.source?.toLowerCase().replace('_', ' ')}</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {lead.value ? `$${lead.value.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {lead.assignedTo
                      ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                      : <span className="text-gray-400">Sin asignar</span>}
                  </td>
                </tr>
              ))}
              {!recentLeads?.data?.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                    No hay leads aún. ¡Crea tu primera campaña!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LeadStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    NEW: 'bg-blue-50 text-blue-700',
    CONTACTED: 'bg-yellow-50 text-yellow-700',
    QUALIFIED: 'bg-purple-50 text-purple-700',
    PROPOSAL: 'bg-orange-50 text-orange-700',
    NEGOTIATION: 'bg-indigo-50 text-indigo-700',
    WON: 'bg-green-50 text-green-700',
    LOST: 'bg-red-50 text-red-700',
  };

  const labels: Record<string, string> = {
    NEW: 'Nuevo', CONTACTED: 'Contactado', QUALIFIED: 'Calificado',
    PROPOSAL: 'Propuesta', NEGOTIATION: 'Negociación', WON: 'Ganado', LOST: 'Perdido',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}
