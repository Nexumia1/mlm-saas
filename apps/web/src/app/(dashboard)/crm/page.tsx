'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '@/lib/api';
import { Search, Plus, Filter, Phone, Mail, User, Kanban, List } from 'lucide-react';

type ViewMode = 'list' | 'kanban';

const LEAD_STATUSES = [
  { key: 'NEW', label: 'Nuevo', color: 'bg-blue-100 border-blue-300' },
  { key: 'CONTACTED', label: 'Contactado', color: 'bg-yellow-100 border-yellow-300' },
  { key: 'QUALIFIED', label: 'Calificado', color: 'bg-purple-100 border-purple-300' },
  { key: 'PROPOSAL', label: 'Propuesta', color: 'bg-orange-100 border-orange-300' },
  { key: 'NEGOTIATION', label: 'Negociación', color: 'bg-indigo-100 border-indigo-300' },
  { key: 'WON', label: 'Ganado', color: 'bg-green-100 border-green-300' },
  { key: 'LOST', label: 'Perdido', color: 'bg-red-100 border-red-300' },
];

export default function CrmPage() {
  const [view, setView] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const queryClient = useQueryClient();

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', { search, status: statusFilter }],
    queryFn: () => crmApi.getLeads({ search, status: statusFilter || undefined }),
  });

  const { data: pipeline } = useQuery({
    queryKey: ['pipeline'],
    queryFn: crmApi.getPipeline,
    enabled: view === 'kanban',
  });

  const { data: stats } = useQuery({
    queryKey: ['lead-stats'],
    queryFn: crmApi.getLeadStats,
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => crmApi.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM — Gestión de Leads</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {stats?.total?.toLocaleString() || 0} leads en total ·{' '}
            <span className="text-green-600 font-medium">{stats?.byStatus?.find((s: any) => s.status === 'WON')?._count?.id || 0} ganados</span>
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Lead
        </button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {LEAD_STATUSES.map((s) => {
          const stat = stats?.byStatus?.find((b: any) => b.status === s.key);
          return (
            <button
              key={s.key}
              onClick={() => setStatusFilter(statusFilter === s.key ? '' : s.key)}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                statusFilter === s.key ? s.color : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="text-lg font-bold text-gray-900">{stat?._count?.id || 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Controles */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
          >
            <List className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
          >
            <Kanban className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Vista Lista */}
      {view === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Contacto</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Estado</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Score</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Valor</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Fuente</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Asignado</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : leadsData?.data?.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {lead.contact?.firstName?.[0]}{lead.contact?.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{lead.contact?.firstName} {lead.contact?.lastName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {lead.contact?.phone && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <Phone className="w-3 h-3" />{lead.contact.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadMutation.mutate({ id: lead.id, data: { status: e.target.value } })}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {LEAD_STATUSES.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                            <div
                              className={`h-full rounded-full ${lead.score >= 70 ? 'bg-green-500' : lead.score >= 40 ? 'bg-yellow-500' : 'bg-red-400'}`}
                              style={{ width: `${lead.score}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{lead.score}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {lead.value ? `$${lead.value.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs capitalize">
                        {lead.source?.toLowerCase().replace('_', ' ')}
                      </td>
                      <td className="px-5 py-4">
                        {lead.assignedTo
                          ? <span className="text-sm text-gray-700">{lead.assignedTo.firstName} {lead.assignedTo.lastName}</span>
                          : <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Sin asignar</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Ver perfil">
                            <User className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors" title="WhatsApp">
                            <Phone className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors" title="Email">
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {leadsData?.meta && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <span>Mostrando {leadsData.data.length} de {leadsData.meta.total} leads</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                  ← Anterior
                </button>
                <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista Kanban */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STATUSES.map((col) => {
            const colData = pipeline?.find((p: any) => p.status === col.key);
            return (
              <div key={col.key} className="flex-shrink-0 w-64">
                <div className={`rounded-t-lg px-3 py-2 border-t-2 ${col.color} bg-opacity-30`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 uppercase">{col.label}</span>
                    <span className="text-xs bg-white/70 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                      {colData?.count || 0}
                    </span>
                  </div>
                  {colData?.totalValue > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">${colData.totalValue.toLocaleString()}</p>
                  )}
                </div>
                <div className="space-y-2 mt-2 min-h-[200px]">
                  {colData?.leads?.map((lead: any) => (
                    <div key={lead.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                      <p className="font-medium text-gray-900 text-sm">
                        {lead.contact?.firstName} {lead.contact?.lastName}
                      </p>
                      {lead.contact?.phone && (
                        <p className="text-xs text-gray-400 mt-1">{lead.contact.phone}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        {lead.value && (
                          <span className="text-xs font-medium text-green-600">${lead.value.toLocaleString()}</span>
                        )}
                        {lead.assignedTo && (
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-xs text-indigo-700 font-bold">
                              {lead.assignedTo.firstName?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
