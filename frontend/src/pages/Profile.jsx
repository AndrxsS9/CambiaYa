/**
 * Página de Perfil de Usuario.
 * Permite ver y editar información, incluyendo la foto vía Cloudinary.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin, Mail, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

const Profile = () => {
  const { user, login } = useAuth(); // Re-usamos login para refrescar el estado del usuario tras el update
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(user?.profile_picture_url || null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setMsg({ type: 'error', text: 'La imagen no puede superar los 10MB.' });
        return;
      }
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('bio', formData.bio);
      data.append('location', formData.location);
      if (selectedFile) data.append('profile_picture', selectedFile);

      const response = await apiClient.put('users/me/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMsg({ type: 'success', text: 'Perfil actualizado correctamente.' });
      // El backend retorna el objeto actualizado, podríamos refrescar el contexto aquí si fuera necesario
      // pero el interceptor ya asegura que la siguiente petición GET me/ tendrá los datos nuevos.
    } catch (err) {
      setMsg({ type: 'error', text: 'Error al actualizar el perfil.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100"
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-32" />
        
        <div className="p-8 -mt-16 sm:flex sm:items-end sm:space-x-8">
          <div className="relative inline-block">
            <img 
              src={preview || 'https://via.placeholder.com/150'} 
              className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-lg bg-slate-100" 
              alt="Avatar"
            />
            <label className="absolute bottom-1 right-1 bg-white p-2 rounded-xl shadow-md cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100">
              <Camera size={18} className="text-blue-600" />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
          <div className="mt-6 sm:mt-0 flex-1">
            <h1 className="text-2xl font-bold text-slate-800">{user?.name}</h1>
            <div className="flex items-center text-slate-500 mt-1 space-x-4">
              <span className="flex items-center"><Mail size={14} className="mr-1"/> {user?.email}</span>
              {user?.location && <span className="flex items-center"><MapPin size={14} className="mr-1"/> {user?.location}</span>}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 border-t border-slate-50 space-y-6">
          {msg.text && (
            <div className={`p-4 rounded-xl text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {msg.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre Comercial / Personal</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Ubicación (Ciudad/Facultad)</label>
              <input 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ej: Bogotá, Facultad de Artes"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Biografía / Acerca de ti</label>
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              placeholder="Cuéntanos qué ofreces y qué buscas para intercambiar..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
