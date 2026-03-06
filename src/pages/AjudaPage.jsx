import { useState } from 'react'
import { 
  Search, ChevronDown, ChevronRight, BookOpen, HelpCircle, 
  Settings, Users, Calendar, DollarSign, CreditCard, Clock,
  Image, Mail, Phone, AlertCircle, CheckCircle, ExternalLink
} from 'lucide-react'

/**
 * AjudaPage Component
 * 
 * Página de ajuda e FAQ integrada ao sistema.
 * Permite que barbeiros acessem o guia completo sem sair do app.
 */
export default function AjudaPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSections, setExpandedSections] = useState({})

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // FAQ organizado por categorias
  const faqCategories = [
    {
      id: 'primeiros-passos',
      title: 'Primeiros Passos',
      icon: BookOpen,
      color: 'blue',
      items: [
        {
          question: 'O que é o Brio App?',
          answer: 'O Brio App é um sistema completo de gestão para barbearias que inclui agendamento online, gestão de equipe, controle financeiro, CRM de clientes, sistema de assinaturas e muito mais.'
        },
        {
          question: 'Como fazer o primeiro acesso?',
          answer: 'Após receber o e-mail de aprovação, acesse https://brioapp.online/login com seu e-mail e senha cadastrados. No primeiro acesso, configure: 1) Identidade Visual, 2) Horários de Funcionamento, 3) Equipe, 4) Serviços.'
        },
        {
          question: 'Esqueci minha senha, o que fazer?',
          answer: 'Na tela de login, clique em "Esqueci minha senha", digite seu e-mail, verifique sua caixa de entrada (pode estar no spam), clique no link recebido e crie uma nova senha.'
        }
      ]
    },
    {
      id: 'identidade-visual',
      title: 'Identidade Visual',
      icon: Image,
      color: 'purple',
      items: [
        {
          question: 'Como adicionar logo e banner?',
          answer: 'Vá em "Identidade Visual" no menu lateral. Clique em "Escolher Logo" (recomendado 400x400px) ou "Escolher Banner" (recomendado 1200x400px). Ajuste o corte se necessário e clique em "Salvar Alterações".'
        },
        {
          question: 'Como preencher o endereço automaticamente?',
          answer: 'Digite apenas o CEP no campo correspondente. O sistema busca automaticamente rua, bairro, cidade e estado via ViaCEP. Você só precisa preencher o número e complemento.'
        },
        {
          question: 'Como copiar o link de agendamento?',
          answer: 'No topo da página "Identidade Visual", você verá seu link de agendamento. Clique no botão "Copiar Link" para copiar e compartilhar nas redes sociais, WhatsApp e Google Meu Negócio.'
        }
      ]
    },
    {
      id: 'equipe',
      title: 'Gerenciar Equipe',
      icon: Users,
      color: 'green',
      items: [
        {
          question: 'Como adicionar um barbeiro?',
          answer: 'Vá em "Minha Equipe", clique em "Novo Colaborador", preencha nome, foto (opcional), biografia, escolha uma cor de identificação e defina a porcentagem de comissão (ex: 50%). Clique em "Salvar".'
        },
        {
          question: 'Para que serve a cor de identificação?',
          answer: 'Cada barbeiro tem uma cor única que aparece na agenda, no card do barbeiro e nos relatórios. Isso facilita a identificação visual rápida. Use cores bem diferentes para cada um!'
        },
        {
          question: 'Como editar ou excluir um barbeiro?',
          answer: 'Passe o mouse sobre o card do barbeiro, clique nos 3 pontinhos no canto superior direito e escolha "Editar" ou "Excluir". Não é possível excluir barbeiros com agendamentos futuros.'
        }
      ]
    },
    {
      id: 'servicos',
      title: 'Serviços',
      icon: Settings,
      color: 'orange',
      items: [
        {
          question: 'Como cadastrar um serviço?',
          answer: 'Vá em "Serviços", clique em "Novo Serviço", preencha nome (ex: "Corte Masculino"), descrição, preço (ex: 50.00), duração em minutos (ex: 30) e selecione quais barbeiros fazem este serviço.'
        },
        {
          question: 'Quais são os serviços mais comuns?',
          answer: 'Corte Masculino (R$ 40-60, 30-45min), Barba (R$ 30-40, 20-30min), Corte + Barba (R$ 60-80, 50-60min), Sobrancelha (R$ 15-25, 10-15min), Pigmentação (R$ 50-80, 30-40min).'
        }
      ]
    },
    {
      id: 'agenda',
      title: 'Agenda',
      icon: Calendar,
      color: 'indigo',
      items: [
        {
          question: 'Como visualizar agendamentos?',
          answer: 'Vá em "Agenda" no menu lateral. Use os filtros para escolher data, barbeiro específico ou status (Confirmados, Pendentes, Cancelados). Você pode ver em lista ou calendário.'
        },
        {
          question: 'Como criar um agendamento manual?',
          answer: 'Na agenda, clique em "Novo Agendamento", preencha dados do cliente (nome, telefone, e-mail), escolha barbeiro, serviço, data e horário. Clique em "Confirmar".'
        },
        {
          question: 'O que significam os status dos agendamentos?',
          answer: '🟢 Confirmado: Cliente confirmou presença. 🟡 Pendente: Aguardando confirmação. 🔴 Cancelado: Agendamento cancelado. ✅ Concluído: Serviço realizado.'
        }
      ]
    },
    {
      id: 'financeiro',
      title: 'Financeiro',
      icon: DollarSign,
      color: 'emerald',
      items: [
        {
          question: 'Como funciona o controle financeiro?',
          answer: 'O sistema registra automaticamente receitas de agendamentos concluídos, comissões dos barbeiros e receitas de assinaturas. Você pode adicionar manualmente outras receitas e despesas.'
        },
        {
          question: 'Como adicionar uma despesa?',
          answer: 'Clique em "Nova Despesa", preencha descrição (ex: "Aluguel", "Produtos"), valor, data e forma de pagamento (Dinheiro, Cartão, PIX). Clique em "Salvar".'
        },
        {
          question: 'Quais formas de pagamento estão disponíveis?',
          answer: 'Dinheiro 💵, Cartão de Crédito 💳, Cartão de Débito 💳, PIX 📱 e Transferência 🔄.'
        }
      ]
    },
    {
      id: 'assinantes',
      title: 'Assinantes',
      icon: CreditCard,
      color: 'pink',
      items: [
        {
          question: 'O que são assinaturas?',
          answer: 'Assinaturas são planos mensais que seus clientes podem contratar. Exemplo: Plano Básico com 2 cortes por mês por R$ 80, ou Plano Premium com cortes ilimitados por R$ 150.'
        },
        {
          question: 'Quais as vantagens das assinaturas?',
          answer: 'Receita recorrente e previsível, fidelização de clientes, fluxo de caixa mais estável e clientes visitam com mais frequência.'
        }
      ]
    },
    {
      id: 'configuracoes',
      title: 'Configurações',
      icon: Clock,
      color: 'cyan',
      items: [
        {
          question: 'Como configurar horários de funcionamento?',
          answer: 'Vá em "Operacional" > "Horários". Para cada dia, ative/desative com o toggle, defina horário de abertura e fechamento. Use "Copiar" para aplicar o mesmo horário em todos os dias. Clique em "Salvar Alterações".'
        },
        {
          question: 'Como configurar lembretes por e-mail?',
          answer: 'Vá em "Operacional" > "E-mail". Ative lembretes, defina tempo de antecedência (ex: 24 horas antes) e personalize a mensagem. Clique em "Salvar Configurações".'
        }
      ]
    },
    {
      id: 'problemas',
      title: 'Problemas Comuns',
      icon: AlertCircle,
      color: 'red',
      items: [
        {
          question: 'Email já foi usado anteriormente',
          answer: 'Tente fazer login ou use "Esqueci minha senha". Se não funcionar, use outro e-mail ou entre em contato: suporte@brioapp.online'
        },
        {
          question: 'Erro ao salvar configurações',
          answer: 'Verifique sua conexão com internet, recarregue a página (F5) e tente novamente. Se persistir, limpe o cache do navegador.'
        },
        {
          question: 'Não consigo fazer upload de imagem',
          answer: 'Verifique o tamanho (máximo 5MB), use formatos JPG ou PNG, comprima a imagem se necessário ou tente outro navegador.'
        },
        {
          question: 'Horários não aparecem para agendamento',
          answer: 'Verifique se configurou horários em "Operacional" > "Horários", confirme que o dia não está marcado como fechado e verifique se o barbeiro tem serviços vinculados.'
        }
      ]
    }
  ]

  // Filtrar itens baseado na busca
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Central de Ajuda
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Encontre respostas para suas dúvidas sobre o Brio App
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por palavra-chave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <a
            href="mailto:suporte@brioapp.online"
            className="p-6 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl hover:shadow-lg transition-all group"
          >
            <Mail className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
              E-mail Suporte
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              suporte@brioapp.online
            </p>
          </a>

          <a
            href="https://brioapp.online"
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl hover:shadow-lg transition-all group"
          >
            <ExternalLink className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
              Site Oficial
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              brioapp.online
            </p>
          </a>

          <div className="p-6 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl">
            <Phone className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
              Horário
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Seg-Sex, 9h às 18h
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl">
            <CheckCircle className="w-8 h-8 text-emerald-500 mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
              Versão
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Brio App v2.0
            </p>
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tente buscar com outras palavras-chave
              </p>
            </div>
          ) : (
            filteredCategories.map((category) => {
              const Icon = category.icon
              const isExpanded = expandedSections[category.id]

              return (
                <div
                  key={category.id}
                  className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden"
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleSection(category.id)}
                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 bg-${category.color}-500/10 rounded-xl`}>
                        <Icon className={`w-6 h-6 text-${category.color}-500`} />
                      </div>
                      <div className="text-left">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          {category.title}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {category.items.length} {category.items.length === 1 ? 'pergunta' : 'perguntas'}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Category Items */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-800">
                      {category.items.map((item, index) => (
                        <div
                          key={index}
                          className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                        >
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">Q:</span>
                            {item.question}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed pl-6">
                            {item.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer Help */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl">
          <div className="flex gap-4">
            <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
                Não encontrou o que procura?
              </h3>
              <p className="text-blue-800 dark:text-blue-400 mb-4">
                Nossa equipe de suporte está pronta para ajudar! Entre em contato por e-mail e responderemos em até 24 horas.
              </p>
              <a
                href="mailto:suporte@brioapp.online"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                <Mail className="w-4 h-4" />
                Enviar E-mail
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
