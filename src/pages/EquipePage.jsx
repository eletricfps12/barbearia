import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Pencil, Trash2, MoreVertical } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

/**
 * EquipePage Component
 * 
 * Página administrativa para gerenciar a equipe de barbeiros.
 * Permite visualizar, adicionar e gerenciar colaboradores da barbearia.
 */
export default function EquipePage() {
  const [barbers, setBarbers] = useState([])
  const [barbershopId, setBarbershopId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingBarber, setEditingBarber] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    color: '#3b82f6', // Default blue
    commission_percentage: 50 // Default 50%
  })

  // Premium color palette
  const COLOR_PALETTE = [
    { name: 'Azul', value: '#3b82f6', bg: 'bg-blue-500' },
    { name: 'Esmeralda', value: '#10b981', bg: 'bg-emerald-500' },
    { name: 'Violeta', value: '#8b5cf6', bg: 'bg-violet-500' },
    { name: 'Âmbar', value: '#f59e0b', bg: 'bg-amber-500' },
    { name: 'Rosa', value: '#ec4899', bg: 'bg-pink-500' },
    { name: 'Ciano', value: '#06b6d4', bg: 'bg-cyan-500' },
    { name: 'Índigo', value: '#6366f1', bg: 'bg-indigo-500' },
    { name: 'Laranja', value: '#f97316', bg: 'bg-orange-500' }
  ]

  useEffect(() => {
    loadTeamData()
  }, [])

  /**
   * Carrega dados da equipe
   */
  const loadTeamData = async () => {
    try {
      setIsLoading(true)
      
      // Buscar usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Usuário não autenticado')
        return
      }

      // Buscar barbershop_id do usuário logado
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select('barbershop_id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (barberError) throw barberError

      if (!barberData) {
        toast.error('Seu usuário não está vinculado a uma barbearia.')
        setIsLoading(false)
        return
      }

      setBarbershopId(barberData.barbershop_id)

      // Buscar todos os barbeiros da barbearia
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('id, name, bio, avatar_url, color, commission_percentage')
        .eq('barbershop_id', barberData.barbershop_id)
        .order('name', { ascending: true })

      if (barbersError) throw barbersError

      setBarbers(barbersData || [])
    } catch (error) {
      console.error('Error loading team:', error)
      toast.error('Erro ao carregar equipe')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Abre modal de novo colaborador
   */
  const openModal = () => {
    setEditingBarber(null)
    setFormData({ name: '', bio: '', color: '#3b82f6', commission_percentage: 50 })
    setSelectedFile(null)
    setPreviewUrl(null)
    setIsModalOpen(true)
  }

  /**
   * Abre modal de edição
   */
  const openEditModal = (barber) => {
    setEditingBarber(barber)
    setFormData({ 
      name: barber.name, 
      bio: barber.bio || '', 
      color: barber.color || '#3b82f6',
      commission_percentage: barber.commission_percentage || 50
    })
    setSelectedFile(null)
    setPreviewUrl(barber.avatar_url || null)
    setIsModalOpen(true)
    setActiveMenu(null)
  }

  /**
   * Fecha modal
   */
  const closeModal = () => {
    setIsModalOpen(false)
    setEditingBarber(null)
    setFormData({ name: '', bio: '', color: '#3b82f6', commission_percentage: 50 })
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  /**
   * Handle file selection
   */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  /**
   * Upload image to Supabase Storage
   */
  const uploadImage = async (file) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `barbers/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('barbershop-media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('barbershop-media')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  /**
   * Salva novo colaborador ou atualiza existente
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (!barbershopId) {
      toast.error('Barbearia não identificada')
      return
    }

    try {
      setIsSaving(true)

      let avatarUrl = editingBarber?.avatar_url || null

      // Upload image if selected
      if (selectedFile) {
        avatarUrl = await uploadImage(selectedFile)
      }

      const barberData = {
        name: formData.name.trim(),
        bio: formData.bio.trim() || null,
        color: formData.color,
        commission_percentage: parseFloat(formData.commission_percentage) || 50,
        barbershop_id: barbershopId,
        avatar_url: avatarUrl
      }

      if (editingBarber) {
        // UPDATE existing barber
        const { error } = await supabase
          .from('barbers')
          .update(barberData)
          .eq('id', editingBarber.id)

        if (error) throw error

        toast.success('Colaborador atualizado com sucesso!')
      } else {
        // INSERT new barber
        const { error } = await supabase
          .from('barbers')
          .insert(barberData)
          .select()

        if (error) throw error

        toast.success('Colaborador adicionado com sucesso!')
      }
      
      // Recarregar lista
      await loadTeamData()
      
      // Fechar modal
      closeModal()
    } catch (error) {
      console.error('Error saving barber:', error)
      toast.error('Erro ao salvar colaborador: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Exclui colaborador
   */
  const handleDelete = async (barber) => {
    // Close menu first
    setActiveMenu(null)

    // Use toast for confirmation instead of window.confirm
    const confirmDelete = () => {
      return new Promise((resolve) => {
        toast((t) => (
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Confirmar exclusão</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Tem certeza que deseja excluir {barber.name}? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id)
                  resolve(false)
                }}
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id)
                  resolve(true)
                }}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        ), {
          duration: Infinity,
          style: {
            maxWidth: '400px',
          }
        })
      })
    }

    const confirmed = await confirmDelete()
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('barbers')
        .delete()
        .eq('id', barber.id)

      if (error) throw error

      toast.success('Colaborador excluído com sucesso!')
      
      // Recarregar lista
      await loadTeamData()
    } catch (error) {
      console.error('Error deleting barber:', error)
      toast.error('Erro ao excluir colaborador: ' + (error.message || 'Erro desconhecido'))
    }
  }

  /**
   * Copia link de agendamento
   */
  const copyBookingLink = async (barberId) => {
    const link = `${window.location.origin}/booking/${barberId}`
    
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Link copiado!')
      setActiveMenu(null)
    } catch (error) {
      console.error('Error copying link:', error)
      toast.error('Erro ao copiar link')
    }
  }

  /**
   * Toggle menu dropdown
   */
  const toggleMenu = (barberId) => {
    setActiveMenu(activeMenu === barberId ? null : barberId)
  }

  /**
   * Gera iniciais do nome
   */
  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando equipe...</p>
          </div>
        </div>
      </div>
    )
  }

  // Stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen">
      {/* Floating Header Card */}
      <div className="mx-6 mt-4 mb-6 bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl rounded-[2rem] border border-gray-200/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] transition-colors duration-500">
        <div className="px-8 py-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Minha Equipe</h1>
          <button
            onClick={openModal}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-semibold rounded-full shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Colaborador
          </button>
        </div>
      </div>

      {/* Team Grid - Bento Style */}
      <div className="px-6 pb-6">
        {barbers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl rounded-[2.5rem] border border-gray-200/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]"
          >
            <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">Nenhum colaborador cadastrado</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Comece adicionando seu primeiro membro da equipe.</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {barbers.map((barber) => (
              <motion.div
                key={barber.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className="group relative bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] hover:shadow-2xl p-8 transition-all duration-300"
              >
                {/* Three-dot Menu */}
                <div className="absolute top-6 right-6">
                  <button
                    onClick={() => toggleMenu(barber.id)}
                    className="p-2 bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {activeMenu === barber.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-10"
                    >
                      <button
                        onClick={() => openEditModal(barber)}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="text-sm font-medium">Editar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(barber)}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Excluir</span>
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Avatar with Border and Shadow */}
                <div className="flex justify-center mb-6">
                  {barber.avatar_url ? (
                    <div className="relative">
                      <img
                        src={barber.avatar_url}
                        alt={barber.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-white/10 shadow-lg"
                      />
                      {/* Color indicator ring */}
                      <div 
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-white dark:border-[#0A0A0A]"
                        style={{ backgroundColor: barber.color || '#3b82f6' }}
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <div 
                        className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-white dark:border-white/10 shadow-lg"
                        style={{ backgroundColor: barber.color || '#3b82f6' }}
                      >
                        <span className="text-3xl font-bold text-white">
                          {getInitials(barber.name)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  {barber.name}
                </h3>

                {/* Bio */}
                {barber.bio && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm text-center line-clamp-3">
                    {barber.bio}
                  </p>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Modal - Apple Style */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop com blur (vidro fosco) */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={closeModal}
          />
          
          {/* Modal Card */}
          <div className="relative bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-xl rounded-[2rem] w-full max-w-md border border-white/10 dark:border-white/5 shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingBarber ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
                disabled={isSaving}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
              {/* Photo Upload - Apple Style */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-3">
                  Foto de Perfil
                </label>
                <div className="flex items-center gap-4">
                  {/* Preview Circle with Camera Overlay */}
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/20 dark:to-indigo-800/20">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {formData.name ? getInitials(formData.name) : '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Camera Icon Overlay */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <input
                      type="file"
                      id="avatar"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isSaving}
                    />
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1">
                    <label 
                      htmlFor="avatar"
                      className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full cursor-pointer transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Escolher arquivo
                    </label>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">PNG, JPG até 5MB</p>
                  </div>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label htmlFor="name" className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Ex: João Silva"
                  required
                  disabled={isSaving}
                />
              </div>

              {/* Biografia */}
              <div>
                <label htmlFor="bio" className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  Biografia
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                  placeholder="Ex: Barbeiro com 10 anos de experiência..."
                  rows={3}
                  disabled={isSaving}
                />
              </div>

              {/* Color Picker - Apple Style */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-3">
                  Cor de Identificação
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PALETTE.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: colorOption.value })}
                      className={`relative h-14 rounded-2xl transition-all ${colorOption.bg} ${
                        formData.color === colorOption.value
                          ? 'ring-4 ring-offset-2 ring-offset-white dark:ring-offset-[#1A1A1A] scale-105 shadow-lg'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        ringColor: formData.color === colorOption.value ? colorOption.value : undefined
                      }}
                      title={colorOption.name}
                      disabled={isSaving}
                    >
                      {formData.color === colorOption.value && (
                        <svg className="absolute inset-0 m-auto w-7 h-7 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Commission Percentage - Apple Control Center Style */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  Porcentagem de Comissão
                </label>
                <div className="flex items-center gap-3">
                  {/* Minus Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newValue = Math.max(0, parseFloat(formData.commission_percentage || 0) - 5)
                      setFormData({ ...formData, commission_percentage: newValue })
                    }}
                    className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all active:scale-95"
                    disabled={isSaving}
                  >
                    <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                    </svg>
                  </button>

                  {/* Input with Percentage Icon */}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      id="commission"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.commission_percentage}
                      onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                      className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white text-center text-lg font-semibold focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      disabled={isSaving}
                    />
                    {/* Percentage Icon */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Plus Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newValue = Math.min(100, parseFloat(formData.commission_percentage || 0) + 5)
                      setFormData({ ...formData, commission_percentage: newValue })
                    }}
                    className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all active:scale-95"
                    disabled={isSaving}
                  >
                    <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                  Valor que o profissional recebe sobre cada serviço
                </p>
              </div>

              {/* Action Buttons - Apple Style */}
              <div className="flex gap-3 pt-4">
                {/* Cancel Button - Ghost Style */}
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-full transition-all active:scale-95"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                
                {/* Save Button - Vibrant & Rounded */}
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-semibold rounded-full shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </span>
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
