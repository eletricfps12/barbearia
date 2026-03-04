import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { sendInviteEmail } from '../utils/emailService'
import { Mail, User, Building, Loader2, Send, X, Link as LinkIcon, Copy, Check } from 'lucide-react'

export default function InviteBarberModal({ isOpen, onClose, onInviteSent }) {
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    barberName: '',
    barbershopName: '',
    phone: ''
  })

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .trim()
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Gerar slug único
      const slug = generateSlug(formData.barbershopName)

      // 2. Verificar se slug já existe
      const { data: existingBarbershop } = await supabase
        .from('barbershops')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle()

      if (existingBarbershop) {
        showToast.error('Já existe uma barbearia com este nome', 'Nome Duplicado')
        setLoading(false)
        return
      }

      // 3. Gerar token único
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_invite_token')

      if (tokenError) throw tokenError

      const token = tokenData

      // 4. Salvar convite na tabela
      const { data: { user } } = await supabase.auth.getUser()

      const { error: insertError } = await supabase
        .from('invites')
        .insert([{
          email: formData.email.trim().toLowerCase(),
          barber_name: formData.barberName.trim(),
          barbershop_name: formData.barbershopName.trim(),
          barbershop_slug: slug,
          phone: formData.phone.trim() || null,
          token: token,
          invited_by: user?.id
        }])

      if (insertError) {
        if (insertError.code === '23505') {
          showToast.error('Este email já foi convidado', 'Email Duplicado')
        } else {
          throw insertError
        }
        setLoading(false)
        return
      }

      // 5. Gerar link de convite
      const link = `${window.location.origin}/register?invite=${token}`
      setInviteLink(link)

      // 6. Enviar email automaticamente
      const emailResult = await sendInviteEmail({
        to: formData.email.trim().toLowerCase(),
        barberName: formData.barberName.trim(),
        barbershopName: formData.barbershopName.trim(),
        inviteLink: link
      })

      if (emailResult.success) {
        showToast.success('Convite gerado e email enviado com sucesso!', '✅ Email Enviado')
      } else {
        showToast.warning('Convite gerado, mas houve erro ao enviar o email', '⚠️ Email não enviado')
        console.error('Erro ao enviar email:', emailResult.error)
      }

      if (onInviteSent) {
        onInviteSent(link)
      }

    } catch (error) {
      console.error('Error creating invite:', error)
      showToast.error('Erro ao gerar convite', 'Erro')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    showToast.success('Link copiado!', 'Sucesso')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setFormData({ email: '', barberName: '', barbershopName: '', phone: '' })
    setInviteLink(null)
    setCopied(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 overflow-y-auto">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-xl p-4 shadow-2xl my-4 max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Send className="text-green-500 w-5 h-5" />
            Convidar Barbeiro
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State - Show Link */}
        {inviteLink ? (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-green-400 text-xs mb-1 font-semibold">
                ✅ Convite criado e email enviado!
              </p>
              <p className="text-gray-400 text-xs">
                {formData.barberName} receberá um email em {formData.email}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-black/50 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400 font-semibold">Link de Convite</span>
              </div>
              <p className="text-white text-xs break-all mb-2">
                {inviteLink}
              </p>
              <button
                onClick={handleCopyLink}
                className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar Link
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-lg bg-green-500 hover:bg-green-400 text-black font-bold transition-all"
            >
              Fechar
            </button>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleInvite} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Nome do Barbeiro
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="João Silva"
                  value={formData.barberName}
                  onChange={(e) => setFormData({ ...formData, barberName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Email de Acesso
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  placeholder="joao@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Nome da Barbearia
              </label>
              <div className="relative">
                <Building className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Barbearia do João"
                  value={formData.barbershopName}
                  onChange={(e) => setFormData({ ...formData, barbershopName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              {formData.barbershopName && (
                <p className="text-xs text-gray-500 mt-1">
                  URL: brioapp.com/<span className="text-green-400">{generateSlug(formData.barbershopName)}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                WhatsApp (opcional)
              </label>
              <input
                type="tel"
                placeholder="44999999999"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Gerar Convite
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full text-gray-500 text-xs hover:text-white transition-colors py-1"
            >
              Cancelar
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
