import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Sparkles, 
  Zap, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  Scissors,
  ArrowRight,
  Check,
  Star,
  ChevronDown
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const screenshots = [
    { src: '/landing page fotos/painel dashboard.png', title: 'Dashboard', rotation: -5 },
    { src: '/landing page fotos/painel agenda.png', title: 'Agenda', rotation: 3 },
    { src: '/landing page fotos/painel financeiro.png', title: 'Financeiro', rotation: -2 },
    { src: '/landing page fotos/cmr de clientes.png', title: 'CRM', rotation: 4 },
    { src: '/landing page fotos/minha equipe.png', title: 'Equipe', rotation: -3 },
  ]

  return (
    <div className="relative bg-black min-h-screen overflow-hidden">
      {/* Cursor Glow Effect */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(16, 185, 129, 0.15), transparent 40%)`
        }}
      />

      {/* Animated Grid Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: `translateY(${scrollY * 0.5}px)`
        }} />
      </div>

      {/* Floating Orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        
        {/* Navbar - Floating */}
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl">
          <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-full px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center font-bold text-black">
                B
              </div>
              <span className="font-bold text-white text-lg">Brio</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Preços</a>
              <a href="#screenshots" className="text-gray-400 hover:text-white transition-colors">App</a>
            </div>

            <button
              onClick={() => navigate('/register')}
              className="px-4 sm:px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold rounded-full hover:scale-105 transition-transform text-sm sm:text-base whitespace-nowrap"
            >
              Começar Grátis
            </button>
          </div>
        </nav>

        {/* Hero Section - Desconstruído */}
        <section className="min-h-screen flex items-center justify-center px-4 pt-32">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-8">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>O futuro da gestão de barbearias</span>
              </div>

              {/* Main Headline - Gigante e Desconstruído */}
              <h1 className="relative">
                <div className="text-[clamp(3rem,12vw,10rem)] font-black leading-[0.9] tracking-tighter">
                  <span className="block text-white" style={{ 
                    textShadow: '0 0 80px rgba(16, 185, 129, 0.5)'
                  }}>
                    REVOLUÇÃO
                  </span>
                  <span className="block bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 bg-clip-text text-transparent">
                    DIGITAL
                  </span>
                  <span className="block text-white/20 text-[clamp(2rem,8vw,6rem)]">
                    PARA BARBEARIAS
                  </span>
                </div>
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-light">
                Esqueça planilhas, cadernos e WhatsApp. 
                <span className="text-white font-semibold"> Gerencie tudo em um só lugar</span> com tecnologia de ponta.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                <button
                  onClick={() => navigate('/register')}
                  className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold rounded-2xl text-lg overflow-hidden hover:scale-105 transition-all shadow-2xl shadow-green-500/50"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Começar Grátis Agora
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 text-white font-semibold rounded-2xl text-lg hover:bg-white/10 transition-all">
                  Ver Demo
                </button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center justify-center gap-8 pt-12 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 border-2 border-black" />
                    ))}
                  </div>
                  <span className="text-gray-400">+50 barbearias</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-400">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                  <span className="text-gray-400 ml-2">5.0</span>
                </div>
              </div>

              {/* Scroll Indicator */}
              <div className="pt-16 animate-bounce">
                <ChevronDown className="w-8 h-8 text-gray-600 mx-auto" />
              </div>
            </div>
          </div>
        </section>


        {/* Screenshots Section - 3D Floating Mockups */}
        <section id="screenshots" className="py-32 px-4 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            
            {/* Section Header */}
            <div className="text-center mb-20">
              <h2 className="text-6xl md:text-8xl font-black text-white mb-6">
                VEJA O
                <span className="block bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                  PODER
                </span>
              </h2>
              <p className="text-xl text-gray-400">Interface moderna que seus clientes vão amar</p>
            </div>

            {/* Main Feature - Agendamento do Cliente (DESTAQUE) */}
            <div className="mb-32 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-[100px]" />
              
              <div className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-[3rem] p-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-green-500/10 to-transparent" />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                  
                  {/* Text Content */}
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-semibold">
                      <Sparkles className="w-4 h-4" />
                      Experiência do Cliente
                    </div>
                    
                    <h3 className="text-5xl font-black text-white leading-tight">
                      Agendamento
                      <span className="block bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                        Online 24/7
                      </span>
                    </h3>
                    
                    <p className="text-xl text-gray-400 leading-relaxed">
                      Seus clientes escolhem o barbeiro, serviço e horário direto pelo celular. 
                      Sem ligações, sem WhatsApp, sem confusão.
                    </p>

                    <ul className="space-y-4">
                      {[
                        'Interface intuitiva e rápida',
                        'Confirmação automática por email',
                        'Lembretes antes do horário',
                        'Reagendamento fácil'
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-300">
                          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-green-400" />
                          </div>
                          <span className="text-lg">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Screenshot - Mockup Style */}
                  <div className="relative">
                    {/* Phone Frame */}
                    <div className="relative mx-auto w-[320px] h-[650px] bg-zinc-950 rounded-[3rem] p-3 shadow-2xl border-8 border-zinc-800 transform hover:scale-105 transition-transform duration-500">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-zinc-950 rounded-b-3xl z-10" />
                      
                      {/* Screen */}
                      <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                        <img 
                          src="/landing page fotos/marcar horario.png" 
                          alt="Agendamento Online"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl animate-pulse delay-1000" />
                  </div>

                </div>
              </div>
            </div>

            {/* Desktop Screenshots Grid - Melhorado */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Dashboard */}
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden hover:-translate-y-2 transition-all duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">Dashboard</h4>
                      <p className="text-gray-500 text-sm">Visão completa</p>
                    </div>
                  </div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5">
                    <img 
                      src="/landing page fotos/dashboard.png" 
                      alt="Dashboard"
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>

              {/* Agenda */}
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden hover:-translate-y-2 transition-all duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">Agenda</h4>
                      <p className="text-gray-500 text-sm">Organização total</p>
                    </div>
                  </div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5">
                    <img 
                      src="/landing page fotos/agenda.png" 
                      alt="Agenda"
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>

              {/* Financeiro */}
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden hover:-translate-y-2 transition-all duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">Financeiro</h4>
                      <p className="text-gray-500 text-sm">Lucro real</p>
                    </div>
                  </div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5">
                    <img 
                      src="/landing page fotos/financeiro.png" 
                      alt="Financeiro"
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>

              {/* CRM */}
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden hover:-translate-y-2 transition-all duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">CRM</h4>
                      <p className="text-gray-500 text-sm">Fidelização</p>
                    </div>
                  </div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5">
                    <img 
                      src="/landing page fotos/crm clientes.png" 
                      alt="CRM"
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>

              {/* Equipe */}
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden hover:-translate-y-2 transition-all duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">Equipe</h4>
                      <p className="text-gray-500 text-sm">Gestão simples</p>
                    </div>
                  </div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5">
                    <img 
                      src="/landing page fotos/minha equipe.png" 
                      alt="Equipe"
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>

              {/* Serviços */}
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden hover:-translate-y-2 transition-all duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                      <Scissors className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">Serviços</h4>
                      <p className="text-gray-500 text-sm">Catálogo completo</p>
                    </div>
                  </div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5">
                    <img 
                      src="/landing page fotos/serviços.png" 
                      alt="Serviços"
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Features Section - Cards Flutuantes */}
        <section id="features" className="py-32 px-4 relative">
          <div className="max-w-7xl mx-auto">
            
            <div className="text-center mb-20">
              <h2 className="text-6xl md:text-8xl font-black text-white mb-6">
                TUDO QUE VOCÊ
                <span className="block bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                  PRECISA
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {[
                {
                  icon: Calendar,
                  title: 'Agenda Inteligente',
                  description: 'Sistema de agendamento online que funciona 24/7. Seus clientes marcam, você só atende.',
                  color: 'blue'
                },
                {
                  icon: DollarSign,
                  title: 'Financeiro Automático',
                  description: 'Controle de caixa, comissões e relatórios em tempo real. Saiba exatamente quanto você lucra.',
                  color: 'green'
                },
                {
                  icon: Users,
                  title: 'Gestão de Equipe',
                  description: 'Gerencie barbeiros, horários e comissões. Tudo organizado e transparente.',
                  color: 'purple'
                },
                {
                  icon: Scissors,
                  title: 'Catálogo de Serviços',
                  description: 'Crie seu menu de serviços com preços e durações. Profissional e organizado.',
                  color: 'orange'
                },
                {
                  icon: Sparkles,
                  title: 'Identidade Visual',
                  description: 'Personalize cores, logo e banner. Sua marca, seu estilo.',
                  color: 'pink'
                },
                {
                  icon: Zap,
                  title: 'Notificações Automáticas',
                  description: 'Lembretes por email e WhatsApp. Reduza faltas em até 80%.',
                  color: 'yellow'
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative p-8 rounded-3xl bg-zinc-900/50 border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2"
                  style={{
                    animation: `float ${3 + index * 0.5}s ease-in-out infinite`,
                    animationDelay: `${index * 0.2}s`
                  }}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-7 h-7 text-${feature.color}-400`} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}

            </div>
          </div>
        </section>


        {/* Pricing Section - INSANO */}
        <section id="pricing" className="py-32 px-4 relative">
          <div className="max-w-7xl mx-auto">
            
            <div className="text-center mb-20">
              <h2 className="text-6xl md:text-8xl font-black text-white mb-6">
                PREÇO
                <span className="block bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                  JUSTO
                </span>
              </h2>
              <p className="text-xl text-gray-400">Sem pegadinhas. Sem taxas escondidas.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              {/* Plano Mensal */}
              <div className="group relative">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                
                <div className="relative bg-zinc-900 border border-white/10 rounded-3xl p-10 hover:border-green-500/50 transition-all duration-500">
                  
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-semibold mb-6">
                    <Zap className="w-4 h-4" />
                    Mais Popular
                  </div>

                  {/* Título */}
                  <h3 className="text-3xl font-black text-white mb-2">Mensal</h3>
                  <p className="text-gray-400 mb-8">Flexibilidade total. Cancele quando quiser.</p>

                  {/* Preço */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black text-white">R$ 129</span>
                      <span className="text-2xl text-gray-500">,90</span>
                    </div>
                    <p className="text-gray-500 mt-2">por mês</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-10">
                    {[
                      'Agenda ilimitada',
                      'Gestão de equipe completa',
                      'Controle financeiro',
                      'CRM de clientes',
                      'Notificações automáticas',
                      'Identidade visual personalizada',
                      'Suporte prioritário',
                      'Atualizações gratuitas'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-gray-300">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-400" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => navigate('/register')}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold rounded-2xl text-lg hover:scale-105 transition-transform shadow-2xl shadow-green-500/50"
                  >
                    Começar Agora
                  </button>

                </div>
              </div>

              {/* Plano Anual */}
              <div className="group relative">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                
                <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-3xl p-10 hover:border-purple-500/50 transition-all duration-500">
                  
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-semibold mb-6">
                    <Sparkles className="w-4 h-4" />
                    Melhor Custo-Benefício
                  </div>

                  {/* Título */}
                  <h3 className="text-3xl font-black text-white mb-2">Anual</h3>
                  <p className="text-gray-400 mb-8">Economize R$ 668,80 por ano</p>

                  {/* Preço */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">R$ 890</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-gray-500">por ano</p>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
                        -43% OFF
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Equivale a <span className="text-white font-semibold">R$ 74,17/mês</span>
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-10">
                    {[
                      'Tudo do plano mensal',
                      '2 meses grátis',
                      'Prioridade no suporte',
                      'Acesso antecipado a novidades',
                      'Consultoria de onboarding',
                      'Treinamento da equipe',
                      'Relatórios avançados',
                      'API para integrações'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-gray-300">
                        <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-purple-400" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => navigate('/register')}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-2xl text-lg hover:scale-105 transition-transform shadow-2xl shadow-purple-500/50"
                  >
                    Assinar Anual
                  </button>

                </div>
              </div>

            </div>

            {/* Garantia */}
            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-zinc-900/50 border border-white/10 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold">Garantia de 7 dias</p>
                  <p className="text-gray-400 text-sm">Não gostou? Devolvemos 100% do seu dinheiro</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* CTA Final - Impactante */}
        <section className="py-32 px-4 relative overflow-hidden">
          {/* Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Pronto para
              <span className="block bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                REVOLUCIONAR
              </span>
              sua barbearia?
            </h2>
            
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Junte-se a centenas de barbeiros que já transformaram seus negócios com o Brio App
            </p>

            <button
              onClick={() => navigate('/register')}
              className="group relative px-12 py-6 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold rounded-2xl text-xl overflow-hidden hover:scale-105 transition-all shadow-2xl shadow-green-500/50"
            >
              <span className="relative z-10 flex items-center gap-3">
                Começar Grátis Agora
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <p className="text-gray-500 text-sm mt-6">
              Sem cartão de crédito. Sem compromisso.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center font-bold text-black">
                  B
                </div>
                <span className="font-bold text-white">Brio App</span>
              </div>

              <div className="flex items-center gap-8 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Termos</a>
                <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                <a href="#" className="hover:text-white transition-colors">Contato</a>
              </div>

              <p className="text-gray-500 text-sm">
                © 2024 Brio App. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>

      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}
