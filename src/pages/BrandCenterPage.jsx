import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { 
  Upload, Save, Loader2, Image as ImageIcon, X, Clock, 
  Copy, Check, Instagram, Facebook, MapPin, Share2, Palette, Eye, MessageCircle
} from 'lucide-react'
import Cropper from 'react-easy-crop'

/**
 * Utility function to create an image element from a URL
 */
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

/**
 * Utility function to get cropped image as Blob
 */
const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  // Set canvas size to match the crop area
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // Convert canvas to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/jpeg', 0.95)
  })
}

export default function ConfiguracoesPage() {
  const [barbershopId, setBarbershopId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    logo_url: '',
    banner_url: '',
    instagram_url: '',
    facebook_url: '',
    whatsapp_number: '',
    brand_color: '#3b82f6'
  })

  // CEP loading state
  const [loadingCep, setLoadingCep] = useState(false)

  // Copy link state
  const [copied, setCopied] = useState(false)

  // File previews
  const [logoPreview, setLogoPreview] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)

  // Crop modal states
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isCropping, setIsCropping] = useState(false)

  useEffect(() => {
    fetchBarbershopData()
  }, [])

  const fetchBarbershopData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('🔍 User:', user?.id)
      
      if (!user) {
        setError('Usuário não autenticado')
        return
      }

      // Get barber data to find barbershop_id
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select('barbershop_id')
        .eq('profile_id', user.id)
        .maybeSingle()

      console.log('🔍 Barber data:', barberData)
      console.log('🔍 Barber error:', barberError)

      if (barberError) throw barberError

      if (!barberData) {
        setError('Seu usuário não está vinculado a uma barbearia')
        showToast.error(
          'Seu usuário não está vinculado a uma barbearia. Entre em contato com o suporte.',
          'Erro'
        )
        return
      }

      console.log('🔍 Barbershop ID:', barberData.barbershop_id)
      setBarbershopId(barberData.barbershop_id)

      // Get barbershop data
      const { data: barbershopData, error: barbershopError } = await supabase
        .from('barbershops')
        .select('*')
        .eq('id', barberData.barbershop_id)
        .single()

      console.log('🔍 Barbershop data:', barbershopData)
      console.log('🔍 Barbershop error:', barbershopError)

      if (barbershopError) throw barbershopError

      if (barbershopData) {
        // Parse address if it exists to fill individual fields
        let parsedAddress = {
          cep: '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: ''
        }
        
        // Try to parse existing address (basic parsing)
        if (barbershopData.address) {
          const addressParts = barbershopData.address.split(',').map(p => p.trim())
          if (addressParts.length > 0) parsedAddress.street = addressParts[0] || ''
          if (addressParts.length > 1) parsedAddress.number = addressParts[1] || ''
          if (addressParts.length > 2) parsedAddress.neighborhood = addressParts[2] || ''
          if (addressParts.length > 3) {
            const cityState = addressParts[3].split('-').map(p => p.trim())
            parsedAddress.city = cityState[0] || ''
            parsedAddress.state = cityState[1] || ''
          }
        }
        
        setFormData({
          name: barbershopData.name || '',
          contact_phone: barbershopData.contact_phone || '',
          contact_email: barbershopData.contact_email || '',
          address: barbershopData.address || '',
          cep: parsedAddress.cep,
          street: parsedAddress.street,
          number: parsedAddress.number,
          complement: parsedAddress.complement,
          neighborhood: parsedAddress.neighborhood,
          city: parsedAddress.city,
          state: parsedAddress.state,
          logo_url: barbershopData.logo_url || '',
          banner_url: barbershopData.banner_url || '',
          instagram_url: barbershopData.instagram_url || '',
          facebook_url: barbershopData.facebook_url || '',
          whatsapp_number: barbershopData.whatsapp_number || '',
          brand_color: barbershopData.brand_color || '#3b82f6'
        })
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Erro ao carregar dados da barbearia')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Buscar CEP via ViaCEP
  const handleCepChange = async (e) => {
    const cep = e.target.value.replace(/\D/g, '') // Remove não-números
    
    setFormData(prev => ({ ...prev, cep: e.target.value }))
    
    if (cep.length === 8) {
      try {
        setLoadingCep(true)
        
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        
        if (data.erro) {
          showToast.error('CEP não encontrado', 'Erro')
          return
        }
        
        // Preencher campos automaticamente
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
          // Montar endereço completo (sem número ainda)
          address: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`
        }))
        
        showToast.success('CEP encontrado! Preencha o número.', 'Sucesso')
        
        // Focar no campo de número
        setTimeout(() => {
          document.getElementById('number')?.focus()
        }, 100)
        
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
        showToast.error('Erro ao buscar CEP. Tente novamente.', 'Erro')
      } finally {
        setLoadingCep(false)
      }
    }
  }

  // Atualizar endereço completo quando número ou complemento mudarem
  const handleAddressFieldChange = (e) => {
    const { name, value } = e.target
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      
      // Reconstruir endereço completo
      if (updated.street) {
        const parts = [updated.street]
        if (updated.number) parts.push(updated.number)
        if (updated.complement) parts.push(updated.complement)
        if (updated.neighborhood) parts.push(updated.neighborhood)
        if (updated.city && updated.state) parts.push(`${updated.city} - ${updated.state}`)
        
        updated.address = parts.join(', ')
      }
      
      return updated
    })
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione uma imagem válida')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB')
        return
      }

      // Open crop modal instead of direct preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageToCrop(reader.result)
        setIsCropModalOpen(true)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione uma imagem válida')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB')
        return
      }

      setBannerFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCropConfirm = async () => {
    try {
      setIsCropping(true)
      
      // Get cropped image as blob
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels)
      
      if (!croppedBlob) {
        setError('Erro ao processar imagem')
        return
      }

      // Convert blob to File
      const croppedFile = new File([croppedBlob], 'logo.jpg', { type: 'image/jpeg' })
      
      // Set as logo file and preview
      setLogoFile(croppedFile)
      
      // Create preview URL from blob
      const previewUrl = URL.createObjectURL(croppedBlob)
      setLogoPreview(previewUrl)
      
      // Close modal
      setIsCropModalOpen(false)
      setImageToCrop(null)
    } catch (err) {
      console.error('Erro ao cortar imagem:', err)
      setError('Erro ao processar imagem cortada')
    } finally {
      setIsCropping(false)
    }
  }

  const handleCropCancel = () => {
    setIsCropModalOpen(false)
    setImageToCrop(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  const uploadImage = async (file, folder) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${barbershopId}-${folder}-${Date.now()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('barbershop-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('barbershop-media')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (err) {
      console.error('Erro ao fazer upload:', err)
      throw new Error('Erro ao fazer upload da imagem')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validação: verificar se barbershopId existe
    if (!barbershopId) {
      showToast.error(
        'Barbearia não identificada. Recarregue a página e tente novamente.',
        'Erro'
      )
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      let logoUrl = formData.logo_url
      let bannerUrl = formData.banner_url

      // Upload logo if new file selected (cropped file)
      if (logoFile) {
        logoUrl = await uploadImage(logoFile, 'logos')
      }

      // Upload banner if new file selected
      if (bannerFile) {
        bannerUrl = await uploadImage(bannerFile, 'banners')
      }

      // Update barbershop data
      const { error: updateError } = await supabase
        .from('barbershops')
        .update({
          name: formData.name,
          contact_phone: formData.contact_phone,
          contact_email: formData.contact_email,
          address: formData.address,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          instagram_url: formData.instagram_url,
          facebook_url: formData.facebook_url,
          whatsapp_number: formData.whatsapp_number,
          brand_color: formData.brand_color
        })
        .eq('id', barbershopId)

      if (updateError) throw updateError

      // Update form data with new URLs
      setFormData(prev => ({
        ...prev,
        logo_url: logoUrl,
        banner_url: bannerUrl
      }))

      // Clear file inputs
      setLogoFile(null)
      setBannerFile(null)
      setLogoPreview(null)
      setBannerPreview(null)

      showToast.success(
        'Configurações da barbearia atualizadas com sucesso!',
        'Configurações Salvas'
      )
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Erro ao salvar:', err)
      showToast.error(
        err.message || 'Não foi possível salvar as configurações. Tente novamente.',
        'Erro ao Salvar'
      )
      setError(err.message || 'Erro ao salvar dados da barbearia')
    } finally {
      setSaving(false)
    }
  }

  const copyBookingLink = async () => {
    try {
      // Use the same format as "View as Client" button
      const barbershopSlug = formData.name?.toLowerCase().replace(/\s+/g, '-') || 'barbearia'
      const bookingUrl = `${window.location.origin}/${barbershopSlug}`
      
      await navigator.clipboard.writeText(bookingUrl)
      setCopied(true)
      showToast.success(
        'Link copiado para a área de transferência!',
        'Link Copiado'
      )
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Erro ao copiar link:', err)
      showToast.error(
        'Não foi possível copiar o link. Tente novamente.',
        'Erro ao Copiar'
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Identidade Visual
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie a identidade visual e informações da sua barbearia
            </p>
          </div>
          
          {/* Visualizar como Cliente Button */}
          <a
            href={`/${formData.name?.toLowerCase().replace(/\s+/g, '-') || 'barbearia'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))',
              color: 'rgb(59, 130, 246)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <Eye className="w-4 h-4" />
            Visualizar como Cliente
          </a>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Share Center - Full Width Top */}
            <div className="lg:col-span-12 bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 dark:border-white/10 rounded-[2.5rem] p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                    Link de Agendamento Público
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                    Compartilhe este link com seus clientes
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                  <p className="text-xs md:text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                    {window.location.origin}/{formData.name?.toLowerCase().replace(/\s+/g, '-') || 'barbearia'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyBookingLink}
                  className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 md:w-5 h-4 md:h-5" />
                      <span className="text-sm md:text-base">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 md:w-5 h-4 md:h-5" />
                      <span className="text-sm md:text-base">Copiar Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {/* Logo Upload */}
            <div className="lg:col-span-4 bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 dark:border-white/10 rounded-[2.5rem] p-6 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Logo da Barbearia
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                Recomendado: 400x400px (1:1)
              </p>

              <div className="space-y-4">
                {/* Preview */}
                <div className="aspect-square w-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden group hover:border-blue-500 dark:hover:border-blue-400 transition-all">
                  {(logoPreview || formData.logo_url) ? (
                    <div className="relative w-full h-full">
                      <img
                        src={logoPreview || formData.logo_url}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                      {saving && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Nenhuma logo
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer transition-all font-semibold border border-gray-200 dark:border-gray-600">
                    <Upload className="w-5 h-5" />
                    Escolher Logo
                  </div>
                </label>
              </div>
            </div>

            {/* Banner Upload - Wider */}
            <div className="lg:col-span-8 bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 dark:border-white/10 rounded-[2.5rem] p-6 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Banner da Barbearia
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                Recomendado: 1200x400px (16:9)
              </p>

              <div className="space-y-4">
                {/* Preview */}
                <div className="aspect-video w-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden group hover:border-blue-500 dark:hover:border-blue-400 transition-all">
                  {(bannerPreview || formData.banner_url) ? (
                    <div className="relative w-full h-full">
                      <img
                        src={bannerPreview || formData.banner_url}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                      {saving && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Nenhum banner
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer transition-all font-semibold border border-gray-200 dark:border-gray-600">
                    <Upload className="w-5 h-5" />
                    Escolher Banner
                  </div>
                </label>
              </div>
            </div>

            {/* Informações Básicas */}
            <div className="lg:col-span-6 bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 dark:border-white/10 rounded-[2.5rem] p-6 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                Informações Básicas
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Nome da Barbearia *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="Ex: Barbearia Premium"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="contact_phone" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Telefone de Contato *
                  </label>
                  <input
                    type="tel"
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="contact_email" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Email de Contato *
                  </label>
                  <input
                    type="email"
                    id="contact_email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="contato@barbearia.com"
                  />
                </div>

                {/* Address - Apple Style with CEP */}
                <div className="space-y-4">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Endereço *
                  </label>
                  
                  {/* CEP */}
                  <div className="relative">
                    <input
                      type="text"
                      id="cep"
                      name="cep"
                      value={formData.cep}
                      onChange={handleCepChange}
                      maxLength={9}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                      placeholder="CEP (ex: 12345-678)"
                    />
                    {loadingCep && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>

                  {/* Street (auto-filled) */}
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleAddressFieldChange}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="Rua (preenchido automaticamente)"
                    readOnly
                  />

                  {/* Number and Complement */}
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      id="number"
                      name="number"
                      value={formData.number}
                      onChange={handleAddressFieldChange}
                      required
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                      placeholder="Número *"
                    />
                    <input
                      type="text"
                      id="complement"
                      name="complement"
                      value={formData.complement}
                      onChange={handleAddressFieldChange}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                      placeholder="Complemento"
                    />
                  </div>

                  {/* Neighborhood, City, State (auto-filled) */}
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      id="neighborhood"
                      name="neighborhood"
                      value={formData.neighborhood}
                      onChange={handleAddressFieldChange}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                      placeholder="Bairro"
                      readOnly
                    />
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                      placeholder="Cidade"
                      readOnly
                    />
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                      placeholder="UF"
                      readOnly
                    />
                  </div>

                  {/* Hidden full address field for database */}
                  <input type="hidden" name="address" value={formData.address} />
                </div>
              </div>
            </div>

            {/* Links Sociais */}
            <div className="lg:col-span-6 bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 dark:border-white/10 rounded-[2.5rem] p-6 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                Redes Sociais
              </h2>

              <div className="space-y-4">
                {/* Instagram */}
                <div>
                  <label htmlFor="instagram_url" className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    <Instagram className="w-4 h-4 text-pink-500" />
                    Instagram
                  </label>
                  <input
                    type="url"
                    id="instagram_url"
                    name="instagram_url"
                    value={formData.instagram_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 focus:border-transparent transition-all"
                    placeholder="https://instagram.com/suabarbearia"
                  />
                </div>

                {/* Facebook */}
                <div>
                  <label htmlFor="facebook_url" className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    Facebook
                  </label>
                  <input
                    type="url"
                    id="facebook_url"
                    name="facebook_url"
                    value={formData.facebook_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    placeholder="https://facebook.com/suabarbearia"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label htmlFor="whatsapp_number" className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    id="whatsapp_number"
                    name="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent transition-all"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                {/* Google Maps */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Google Maps
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                    Use o endereço completo acima para localização
                  </p>
                </div>
              </div>
            </div>

            {/* Brand Color + Live Preview */}
            <div className="lg:col-span-12 bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 dark:border-white/10 rounded-[2.5rem] p-6 shadow-lg">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Brand Color Selector */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/30">
                      <Palette className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Cor da Marca
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Personalize a identidade visual
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="brand_color" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                        Escolha sua cor
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          id="brand_color"
                          name="brand_color"
                          value={formData.brand_color}
                          onChange={handleInputChange}
                          className="w-20 h-20 rounded-2xl cursor-pointer border-4 border-gray-200 dark:border-gray-700 shadow-lg"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.brand_color}
                            onChange={(e) => setFormData(prev => ({ ...prev, brand_color: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                            placeholder="#3b82f6"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            Código hexadecimal da cor
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Color Presets */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                        Cores Sugeridas
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6366f1'].map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, brand_color: color }))}
                            className="w-12 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform shadow-md"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg shadow-blue-500/30">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Preview da Página Pública
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Como seus clientes verão
                      </p>
                    </div>
                  </div>

                  {/* Mobile Preview Frame */}
                  <div className="bg-gray-900 rounded-[3rem] p-4 shadow-2xl max-w-sm mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden">
                      {/* Banner */}
                      <div className="relative h-32 bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                        {(bannerPreview || formData.banner_url) && (
                          <img
                            src={bannerPreview || formData.banner_url}
                            alt="Banner"
                            className="w-full h-full object-cover"
                          />
                        )}
                        {/* Logo Overlay */}
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                          <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-700 overflow-hidden shadow-xl">
                            {(logoPreview || formData.logo_url) ? (
                              <img
                                src={logoPreview || formData.logo_url}
                                alt="Logo"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="pt-16 px-6 pb-6">
                        <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
                          {formData.name || 'Nome da Barbearia'}
                        </h3>
                        <div 
                          className="h-10 rounded-xl mx-auto max-w-[200px] flex items-center justify-center text-white font-semibold text-sm shadow-lg"
                          style={{ backgroundColor: formData.brand_color }}
                        >
                          Agendar Horário
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="lg:col-span-12 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                  color: 'rgb(99, 102, 241)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  backdropFilter: 'blur(12px)'
                }}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>

          </div>
        </form>

        {/* Crop Modal - Apple Style */}
        {isCropModalOpen && (
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={handleCropCancel}
          >
            <div 
              className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-2xl border border-white/10 dark:border-white/5 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Minimal Apple Style */}
              <div className="flex items-center justify-between px-6 py-4">
                <button
                  onClick={handleCropCancel}
                  disabled={isCropping}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold text-[17px] hover:opacity-70 transition-opacity disabled:opacity-30"
                >
                  Cancelar
                </button>
                <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white">
                  Ajustar Foto
                </h3>
                <button
                  onClick={handleCropConfirm}
                  disabled={isCropping}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold text-[17px] hover:opacity-70 transition-opacity disabled:opacity-30 min-w-[70px] text-right"
                >
                  {isCropping ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </span>
                  ) : (
                    'Escolher'
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-200/50 dark:bg-white/10" />

              {/* Cropper Area - Full Bleed */}
              <div className="relative w-full aspect-square bg-black touch-none">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{
                    containerStyle: {
                      backgroundColor: '#000',
                    },
                    cropAreaStyle: {
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                    },
                  }}
                />
              </div>

              {/* Zoom Control - Apple Style */}
              <div className="px-6 py-6">
                <div className="flex items-center gap-4">
                  {/* Minus Icon */}
                  <button
                    onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                    </svg>
                  </button>

                  {/* Slider - iOS Style */}
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer slider-thumb"
                      style={{
                        background: `linear-gradient(to right, rgb(99, 102, 241) 0%, rgb(99, 102, 241) ${((zoom - 1) / 2) * 100}%, rgb(229, 231, 235) ${((zoom - 1) / 2) * 100}%, rgb(229, 231, 235) 100%)`
                      }}
                    />
                  </div>

                  {/* Plus Icon */}
                  <button
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
