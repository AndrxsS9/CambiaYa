import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { Send, MessageCircle, AlertCircle, ArrowLeft, Check, CheckCheck } from 'lucide-react';

export default function Chats() {
  const { user } = useAuth();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  // States
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { id, name, email }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Parsear URL query params para nuevo chat
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const recipientId = query.get('recipient');
    const recipientName = query.get('name');

    if (recipientId && recipientName) {
      const targetUser = {
        id: parseInt(recipientId),
        name: recipientName,
        email: '' // No lo tenemos al inicio, pero sirve para empezar
      };
      
      // Activar el chat de una vez
      setActiveChat(targetUser);
    }
  }, [location]);

  // Cargar lista de conversaciones
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConversations(true);
    try {
      const response = await apiClient.get('chats/messages/conversations/');
      setConversations(response.data);

      // Si tenemos un activeChat pero no está en la lista de conversaciones (es un chat nuevo)
      // verificar si ya apareció en el backend tras el primer mensaje
      if (activeChat) {
        const exists = response.data.some(c => c.participant.id === activeChat.id);
        if (exists && !activeChat.email) {
          // Actualizar activeChat con la info completa del backend
          const found = response.data.find(c => c.participant.id === activeChat.id);
          setActiveChat(found.participant);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    
    // Polling de la lista de conversaciones cada 7 segundos
    const interval = setInterval(() => {
      fetchConversations(true);
    }, 7000);
    
    return () => clearInterval(interval);
  }, [activeChat]);

  // Cargar mensajes del chat activo
  const fetchMessages = async (silent = false) => {
    if (!activeChat) return;
    if (!silent) setLoadingMessages(true);
    try {
      const response = await apiClient.get(`chats/messages/?recipient=${activeChat.id}`);
      setMessages(response.data);
      
      // Marcar mensajes como leídos
      const hasUnread = conversations.some(c => c.participant.id === activeChat.id && c.unread_count > 0);
      if (hasUnread || response.data.some(m => !m.is_read && m.recipient === user.id)) {
        await apiClient.post('chats/messages/mark_read/', { sender: activeChat.id });
        fetchConversations(true); // Refrescar silenciosamente los contadores de la lista
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [activeChat]);

  // Polling de mensajes del chat activo cada 3.5 segundos
  useEffect(() => {
    if (!activeChat) return;

    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3500);

    return () => clearInterval(interval);
  }, [activeChat, conversations]);

  // Scroll al final al recibir nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      const response = await apiClient.post('chats/messages/', {
        recipient: activeChat.id,
        content: text
      });

      // Añadir localmente para fluidez visual inmediata
      setMessages(prev => [...prev, response.data]);
      fetchConversations(true);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('No se pudo enviar el mensaje.');
    }
  };

  // Formato de hora
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-8rem)] flex flex-col">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex-grow flex overflow-hidden">
        
        {/* Panel izquierdo: Lista de Chats */}
        <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MessageCircle className="text-blue-600" size={20} /> Mensajes
            </h2>
          </div>
          
          <div className="flex-grow overflow-y-auto divide-y divide-slate-100">
            {loadingConversations && conversations.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">Cargando chats...</div>
            ) : conversations.length === 0 && !activeChat ? (
              <div className="p-8 text-center text-slate-400">
                <AlertCircle className="mx-auto mb-2 text-slate-300" size={32} />
                <p className="text-sm">No tienes conversaciones activas.</p>
                <p className="text-xs mt-1 text-slate-400">Explora el catálogo para chatear con dueños de productos.</p>
              </div>
            ) : (
              <>
                {/* Si iniciamos un chat que aún no existe en el backend, mostrarlo al tope */}
                {activeChat && !conversations.some(c => c.participant.id === activeChat.id) && (
                  <button
                    onClick={() => setActiveChat(activeChat)}
                    className="w-full text-left p-4 flex gap-3 transition-colors bg-blue-50/40 border-l-4 border-blue-600"
                  >
                    <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                      {activeChat.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-slate-800 text-sm truncate">{activeChat.name}</span>
                        <span className="text-[10px] text-blue-600 font-semibold uppercase">Nuevo</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-1 italic">Escribe para iniciar conversación</p>
                    </div>
                  </button>
                )}

                {conversations.map((conv) => {
                  const isActive = activeChat?.id === conv.participant.id;
                  const isSentByMe = conv.last_message.sender_id === user.id;
                  return (
                    <button
                      key={conv.participant.id}
                      onClick={() => setActiveChat(conv.participant)}
                      className={`w-full text-left p-4 flex gap-3 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-blue-50/40 border-l-4 border-blue-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="bg-slate-100 text-slate-600 rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {conv.participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-slate-800 text-sm truncate">{conv.participant.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {conv.last_message.timestamp ? formatTime(conv.last_message.timestamp) : ''}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-slate-500 truncate flex-grow">
                            {isSentByMe ? 'Tú: ' : ''}{conv.last_message.content}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex-shrink-0">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Panel derecho: Mensajes */}
        <div className={`flex-grow flex flex-col bg-slate-50/30 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <>
              {/* Header de chat activo */}
              <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveChat(null)}
                    className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                    {activeChat.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{activeChat.name}</h3>
                    {activeChat.email && (
                      <span className="text-[11px] text-slate-400">{activeChat.email}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contenedor de burbujas */}
              <div className="flex-grow overflow-y-auto p-4 space-y-3 flex flex-col">
                {loadingMessages && messages.length === 0 ? (
                  <div className="text-center text-slate-400 text-xs py-8">Cargando conversación...</div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isMe = msg.sender === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                        >
                          <div
                            className={`p-3 rounded-2xl text-sm leading-relaxed ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-100'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 px-1">
                            <span>{formatTime(msg.timestamp)}</span>
                            {isMe && (
                              <span>
                                {msg.is_read ? (
                                  <CheckCheck size={12} className="text-blue-500" />
                                ) : (
                                  <Check size={12} />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input de envío */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-grow px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-100 cursor-pointer flex-shrink-0"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
              <MessageCircle size={48} className="stroke-1 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700">Tu bandeja de entrada</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Selecciona una conversación de la izquierda para comenzar a negociar intercambios.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
