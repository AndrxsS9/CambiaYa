import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { ArrowLeftRight, Check, X, Ban, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

export default function ExchangeHistory() {
  const { user } = useAuth();
  
  // States
  const [proposals, setProposals] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // pending, accepted, closed
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // id de la propuesta procesándose

  const fetchProposals = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await apiClient.get('exchanges/proposals/');
      setProposals(response.data);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleAccept = async (id) => {
    if (!window.confirm('¿Estás seguro de aceptar este intercambio? Esta acción marcará tus productos como no disponibles y cancelará otras ofertas del mismo producto.')) return;
    
    setActionLoading(id);
    try {
      await apiClient.patch(`exchanges/proposals/${id}/accept/`);
      alert('¡Intercambio aceptado exitosamente!');
      fetchProposals();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'No se pudo aceptar la propuesta.';
      alert(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('¿Estás seguro de rechazar esta propuesta de intercambio?')) return;
    
    setActionLoading(id);
    try {
      await apiClient.patch(`exchanges/proposals/${id}/reject/`);
      fetchProposals();
    } catch (error) {
      alert('No se pudo rechazar la propuesta.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('¿Estás seguro de cancelar tu propuesta?')) return;
    
    setActionLoading(id);
    try {
      await apiClient.patch(`exchanges/proposals/${id}/cancel/`);
      fetchProposals();
    } catch (error) {
      alert('No se pudo cancelar la propuesta.');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtrar propuestas según la pestaña
  const getFilteredProposals = () => {
    if (activeTab === 'pending') {
      return proposals.filter(p => p.status === 'pending');
    }
    if (activeTab === 'accepted') {
      return proposals.filter(p => p.status === 'accepted');
    }
    // 'closed' incluye rechazadas y canceladas
    return proposals.filter(p => p.status === 'rejected' || p.status === 'cancelled');
  };

  const filteredList = getFilteredProposals();

  // Separar en enviadas y recibidas
  const receivedProposals = filteredList.filter(p => p.receiver === user.id);
  const sentProposals = filteredList.filter(p => p.proposer === user.id);

  // Formato de fecha
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Retorna el Badge de estado
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
            <Clock size={12} /> Pendiente
          </span>
        );
      case 'accepted':
        return (
          <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
            <CheckCircle2 size={12} /> Completado
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-bold">
            <XCircle size={12} /> Rechazado
          </span>
        );
      case 'cancelled':
      default:
        return (
          <span className="flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold">
            <Ban size={12} /> Cancelado
          </span>
        );
    }
  };

  const renderProposalCard = (prop, isReceived) => {
    const otherParty = isReceived ? prop.proposer_details : prop.receiver_details;
    const isPending = prop.status === 'pending';

    return (
      <div key={prop.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Cuerpo principal */}
        <div className="flex-grow flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          
          {/* Tu producto */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-1 min-w-[200px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tu producto</span>
            <h4 className="font-bold text-slate-800 text-sm truncate mt-1">
              {isReceived ? prop.requested_product_details?.title : prop.offered_product_details?.title || 'Intercambio directo (Sin ofrecer artículo)'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {isReceived ? prop.requested_product_details?.description : prop.offered_product_details?.description || 'Solicitud de donación o compra en trueque'}
            </p>
          </div>

          {/* Flechas de trueque */}
          <div className="flex items-center justify-center p-2 text-blue-600 bg-blue-50 rounded-full w-10 h-10 self-center">
            <ArrowLeftRight size={18} />
          </div>

          {/* Producto del otro */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-1 min-w-[200px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {isReceived ? 'Te ofrecen de' : 'Solicitas a'}: {otherParty?.name}
            </span>
            <h4 className="font-bold text-slate-800 text-sm truncate mt-1">
              {isReceived ? prop.offered_product_details?.title || 'Intercambio directo' : prop.requested_product_details?.title}
            </h4>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {isReceived ? prop.offered_product_details?.description || '' : prop.requested_product_details?.description}
            </p>
          </div>
        </div>

        {/* Info y Acciones */}
        <div className="flex flex-col items-end gap-3 justify-center min-w-[120px]">
          {getStatusBadge(prop.status)}
          
          <span className="text-[10px] text-slate-400 font-medium">
            Producido el {formatDate(prop.created_at)}
          </span>

          {isPending && (
            <div className="flex gap-2 w-full md:w-auto">
              {isReceived ? (
                <>
                  <button
                    onClick={() => handleReject(prop.id)}
                    disabled={actionLoading === prop.id}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <X size={14} /> Rechazar
                  </button>
                  <button
                    onClick={() => handleAccept(prop.id)}
                    disabled={actionLoading === prop.id}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-100 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Check size={14} /> Aceptar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleCancel(prop.id)}
                  disabled={actionLoading === prop.id}
                  className="w-full flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={14} /> Cancelar oferta
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Título de Sección */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Gestión de Intercambios</h1>
          <p className="text-slate-500 text-sm mt-1">Monitorea y responde a tus propuestas de trueque.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 gap-4">
        {[
          { key: 'pending', label: 'Pendientes', color: 'border-amber-500 text-amber-600' },
          { key: 'accepted', label: 'Completados', color: 'border-emerald-500 text-emerald-600' },
          { key: 'closed', label: 'Historial / Cerrados', color: 'border-slate-500 text-slate-600' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === tab.key
                ? `${tab.color} font-bold`
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-100 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* Sección de Recibidas */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Solicitudes Recibidas ({receivedProposals.length})
            </h3>
            {receivedProposals.length === 0 ? (
              <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-8 text-center text-slate-400 text-sm">
                No tienes solicitudes recibidas en esta pestaña.
              </div>
            ) : (
              <div className="space-y-4">
                {receivedProposals.map(p => renderProposalCard(p, true))}
              </div>
            )}
          </div>

          {/* Sección de Enviadas */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Ofertas Enviadas ({sentProposals.length})
            </h3>
            {sentProposals.length === 0 ? (
              <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-8 text-center text-slate-400 text-sm">
                No has realizado ofertas en esta pestaña.
              </div>
            ) : (
              <div className="space-y-4">
                {sentProposals.map(p => renderProposalCard(p, false))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
