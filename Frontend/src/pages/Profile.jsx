import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, MapPin, Mail, Save, Loader2, Pencil, X,
  CheckCircle, AlertCircle, User, FileText, ImagePlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../api/profileApi';

/* Constantes de validación */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_NAME_LENGTH = 100;
const MIN_NAME_LENGTH = 2;
const MAX_LOCATION_LENGTH = 150;
const MAX_BIO_LENGTH = 500;

const Profile = () => {
  const { user, updateUser } = useAuth();

  /* Estado del formulario */
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  /* Estado de la UI */
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);

  /* Cargar datos frescos del backend al montar */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        updateUser(data);
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          location: data.location || '',
        });
        setPreview(data.profile_picture_url || null);
      } catch {
        setMsg({ type: 'error', text: 'Error al cargar los datos del perfil.' });
      } finally {
        setPageLoading(false);
      }
    };
    loadProfile();
  }, []);

  /* Auto-dismiss de mensajes después de 5 segundos */
  useEffect(() => {
    if (msg.text) {
      const timer = setTimeout(() => setMsg({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  /* Handlers del formulario */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setMsg({ type: 'error', text: 'Formato no permitido. Solo se aceptan imágenes JPEG, PNG o WebP.' });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setMsg({ type: 'error', text: 'La imagen no puede superar los 10MB.' });
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setMsg({ type: '', text: '' });
  };

  /* Validación frontend */
  const validate = () => {
    const newErrors = {};
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      newErrors.name = 'El nombre es obligatorio.';
    } else if (trimmedName.length < MIN_NAME_LENGTH) {
      newErrors.name = `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres.`;
    } else if (trimmedName.length > MAX_NAME_LENGTH) {
      newErrors.name = `El nombre no puede superar los ${MAX_NAME_LENGTH} caracteres.`;
    }

    if (formData.location.trim().length > MAX_LOCATION_LENGTH) {
      newErrors.location = `La ubicación no puede superar los ${MAX_LOCATION_LENGTH} caracteres.`;
    }

    if (formData.bio.length > MAX_BIO_LENGTH) {
      newErrors.bio = `La biografía no puede superar los ${MAX_BIO_LENGTH} caracteres.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* Enviar formulario */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('bio', formData.bio);
      data.append('location', formData.location.trim());
      if (selectedFile) data.append('profile_picture', selectedFile);

      const updatedData = await updateProfile(data);
      updateUser(updatedData);
      setSelectedFile(null);
      setPreview(updatedData.profile_picture_url || preview);
      setIsEditing(false);
      setMsg({ type: 'success', text: '¡Perfil actualizado correctamente!' });
    } catch (err) {
      const backendErrors = err.response?.data;
      if (backendErrors && typeof backendErrors === 'object') {
        const fieldErrors = {};
        Object.entries(backendErrors).forEach(([key, value]) => {
          fieldErrors[key] = Array.isArray(value) ? value[0] : value;
        });
        setErrors(fieldErrors);
        setMsg({ type: 'error', text: 'Corrige los errores para continuar.' });
      } else {
        setMsg({ type: 'error', text: 'Error al actualizar el perfil. Inténtalo de nuevo.' });
      }
    } finally {
      setLoading(false);
    }
  };

  /* Cancelar edición */
  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      bio: user?.bio || '',
      location: user?.location || '',
    });
    setSelectedFile(null);
    setPreview(user?.profile_picture_url || null);
    setErrors({});
    setMsg({ type: '', text: '' });
    setIsEditing(false);
  };

  /* Skeleton de carga */
  if (pageLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-pulse">
          <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-36" />
          <div className="p-8 -mt-16 flex items-end space-x-6">
            <div className="w-32 h-32 rounded-3xl bg-slate-200 border-4 border-white" />
            <div className="flex-1 space-y-3 pb-2">
              <div className="h-6 w-48 bg-slate-200 rounded-lg" />
              <div className="h-4 w-64 bg-slate-100 rounded-lg" />
            </div>
          </div>
          <div className="p-8 space-y-4">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-24 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100"
      >
                <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-36">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDgpIi8+PC9zdmc+')] opacity-50" />
        </div>

                <div className="px-8 -mt-16 pb-6 sm:flex sm:items-end sm:space-x-6">
                    <div className="relative inline-block flex-shrink-0">
            <motion.img
              key={preview || 'default'}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={preview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=3b82f6&color=fff&size=150&font-size=0.4&bold=true`}
              className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-lg bg-slate-100"
              alt="Foto de perfil"
              id="profile-avatar"
            />
            {isEditing && (
              <motion.label
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-1 right-1 bg-white p-2.5 rounded-xl shadow-md cursor-pointer hover:bg-blue-50 transition-colors border border-slate-100 group"
                id="profile-photo-upload-btn"
              >
                <Camera size={18} className="text-blue-600 group-hover:scale-110 transition-transform" />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  id="profile-photo-input"
                />
              </motion.label>
            )}
          </div>

                    <div className="mt-6 sm:mt-0 flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-800 truncate" id="profile-display-name">
              {user?.name || 'Usuario'}
            </h1>
            <div className="flex flex-wrap items-center text-slate-500 mt-1 gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center" id="profile-display-email">
                <Mail size={14} className="mr-1.5 flex-shrink-0" /> {user?.email}
              </span>
              {user?.location && (
                <span className="flex items-center" id="profile-display-location">
                  <MapPin size={14} className="mr-1.5 flex-shrink-0" /> {user?.location}
                </span>
              )}
            </div>
            {user?.bio && !isEditing && (
              <p className="mt-3 text-slate-600 text-sm leading-relaxed line-clamp-2" id="profile-display-bio">
                {user?.bio}
              </p>
            )}
          </div>

                    <div className="mt-4 sm:mt-0 flex-shrink-0">
            {!isEditing ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm"
                id="profile-edit-btn"
              >
                <Pencil size={16} />
                <span>Editar Perfil</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCancel}
                className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm"
                id="profile-cancel-btn"
              >
                <X size={16} />
                <span>Cancelar</span>
              </motion.button>
            )}
          </div>
        </div>

                <AnimatePresence>
          {msg.text && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-8"
            >
              <div
                className={`p-4 rounded-xl text-sm flex items-center space-x-3 ${
                  msg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-red-50 text-red-700 border border-red-100'
                }`}
                id="profile-feedback-msg"
              >
                {msg.type === 'success' ? (
                  <CheckCircle size={18} className="flex-shrink-0" />
                ) : (
                  <AlertCircle size={18} className="flex-shrink-0" />
                )}
                <span>{msg.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

                {!isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 pt-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center text-slate-400 mb-2">
                  <User size={14} className="mr-2" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Nombre</span>
                </div>
                <p className="text-slate-800 font-medium" id="profile-card-name">
                  {user?.name || '—'}
                </p>
              </div>

                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center text-slate-400 mb-2">
                  <MapPin size={14} className="mr-2" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Ubicación</span>
                </div>
                <p className="text-slate-800 font-medium" id="profile-card-location">
                  {user?.location || 'Sin especificar'}
                </p>
              </div>

                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center text-slate-400 mb-2">
                  <Mail size={14} className="mr-2" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Correo</span>
                </div>
                <p className="text-slate-800 font-medium truncate" id="profile-card-email">
                  {user?.email}
                </p>
              </div>
            </div>

                        <div className="mt-6 bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center text-slate-400 mb-2">
                <FileText size={14} className="mr-2" />
                <span className="text-xs font-semibold uppercase tracking-wider">Acerca de mí</span>
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap" id="profile-card-bio">
                {user?.bio || 'Sin descripción aún. ¡Cuéntanos qué ofreces y qué buscas para intercambiar!'}
              </p>
            </div>
          </motion.div>
        )}

                <AnimatePresence>
          {isEditing && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="p-8 border-t border-slate-50 space-y-6"
              id="profile-edit-form"
            >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-semibold text-slate-700 mb-2" htmlFor="profile-input-name">
                    <User size={14} className="mr-2 text-slate-400" />
                    Nombre Comercial / Personal
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="profile-input-name"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={MAX_NAME_LENGTH}
                    className={`w-full px-4 py-3 bg-slate-50 rounded-xl outline-none transition-all border-2 ${
                      errors.name ? 'border-red-300 focus:ring-2 focus:ring-red-200' : 'border-transparent focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
                    }`}
                    placeholder="Tu nombre o alias"
                  />
                  <div className="flex justify-between mt-1">
                    {errors.name && (
                      <p className="text-red-500 text-xs">{errors.name}</p>
                    )}
                    <p className="text-slate-400 text-xs ml-auto">
                      {formData.name.length}/{MAX_NAME_LENGTH}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-slate-700 mb-2" htmlFor="profile-input-location">
                    <MapPin size={14} className="mr-2 text-slate-400" />
                    Ubicación (Ciudad/Facultad)
                  </label>
                  <input
                    type="text"
                    name="location"
                    id="profile-input-location"
                    value={formData.location}
                    onChange={handleChange}
                    maxLength={MAX_LOCATION_LENGTH}
                    className={`w-full px-4 py-3 bg-slate-50 rounded-xl outline-none transition-all border-2 ${
                      errors.location ? 'border-red-300 focus:ring-2 focus:ring-red-200' : 'border-transparent focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
                    }`}
                    placeholder="Ej: Pasto, Facultad de Ingeniería"
                  />
                  <div className="flex justify-between mt-1">
                    {errors.location && (
                      <p className="text-red-500 text-xs">{errors.location}</p>
                    )}
                    <p className="text-slate-400 text-xs ml-auto">
                      {formData.location.length}/{MAX_LOCATION_LENGTH}
                    </p>
                  </div>
                </div>
              </div>

                            <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2" htmlFor="profile-input-bio">
                  <FileText size={14} className="mr-2 text-slate-400" />
                  Biografía / Acerca de ti
                </label>
                <textarea
                  name="bio"
                  id="profile-input-bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  maxLength={MAX_BIO_LENGTH}
                  className={`w-full px-4 py-3 bg-slate-50 rounded-xl outline-none transition-all resize-none border-2 ${
                    errors.bio ? 'border-red-300 focus:ring-2 focus:ring-red-200' : 'border-transparent focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
                  }`}
                  placeholder="Cuéntanos qué ofreces y qué buscas para intercambiar..."
                />
                <div className="flex justify-between mt-1">
                  {errors.bio && (
                    <p className="text-red-500 text-xs">{errors.bio}</p>
                  )}
                  <p className={`text-xs ml-auto ${formData.bio.length > MAX_BIO_LENGTH * 0.9 ? 'text-amber-500 font-medium' : 'text-slate-400'}`}>
                    {formData.bio.length}/{MAX_BIO_LENGTH}
                  </p>
                </div>
              </div>

                            <div className="bg-slate-50 rounded-2xl p-5 border-2 border-dashed border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2.5 rounded-xl">
                      <ImagePlus size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Foto de Perfil</p>
                      <p className="text-xs text-slate-400">JPEG, PNG o WebP — Máximo 10MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white hover:bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-semibold border border-blue-200 transition-all hover:border-blue-400"
                    id="profile-change-photo-btn"
                  >
                    {preview ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                </div>
                {selectedFile && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 text-xs text-emerald-600 flex items-center"
                  >
                    <CheckCircle size={12} className="mr-1" />
                    {selectedFile.name} — {(selectedFile.size / 1024 / 1024).toFixed(2)}MB lista para subir
                  </motion.p>
                )}
              </div>

                            <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 rounded-2xl text-slate-600 font-semibold hover:bg-slate-100 transition-all"
                  id="profile-cancel-form-btn"
                >
                  Descartar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  id="profile-save-btn"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Profile;
