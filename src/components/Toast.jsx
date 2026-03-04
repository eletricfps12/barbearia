import toast, { Toaster } from 'react-hot-toast'

/**
 * Custom Toast Notifications - Apple Style
 * 
 * Usage:
 * import { showToast } from '../components/Toast'
 * 
 * showToast.success('Operação realizada com sucesso!')
 * showToast.error('Erro ao processar')
 * showToast.info('Informação importante')
 * showToast.warning('Atenção necessária')
 */

const toastStyles = {
  success: {
    icon: '✓',
    iconBg: 'bg-green-500',
    bg: 'bg-white dark:bg-[#1A1A1A]',
    border: 'border-green-500/20',
    text: 'text-gray-900 dark:text-white',
    shadow: 'shadow-lg shadow-green-500/20'
  },
  error: {
    icon: '✕',
    iconBg: 'bg-red-500',
    bg: 'bg-white dark:bg-[#1A1A1A]',
    border: 'border-red-500/20',
    text: 'text-gray-900 dark:text-white',
    shadow: 'shadow-lg shadow-red-500/20'
  },
  info: {
    icon: 'ℹ',
    iconBg: 'bg-blue-500',
    bg: 'bg-white dark:bg-[#1A1A1A]',
    border: 'border-blue-500/20',
    text: 'text-gray-900 dark:text-white',
    shadow: 'shadow-lg shadow-blue-500/20'
  },
  warning: {
    icon: '⚠',
    iconBg: 'bg-yellow-500',
    bg: 'bg-white dark:bg-[#1A1A1A]',
    border: 'border-yellow-500/20',
    text: 'text-gray-900 dark:text-white',
    shadow: 'shadow-lg shadow-yellow-500/20'
  }
}

const CustomToast = ({ type, message, title }) => {
  const style = toastStyles[type] || toastStyles.info

  return (
    <div className={`${style.bg} ${style.border} ${style.shadow} border backdrop-blur-xl rounded-2xl p-4 flex items-start gap-3 min-w-[300px] max-w-md`}>
      <div className={`${style.iconBg} w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}>
        <span className="text-white font-bold text-lg">{style.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`${style.text} font-bold text-sm mb-1`}>
            {title}
          </p>
        )}
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {message}
        </p>
      </div>
    </div>
  )
}

export const showToast = {
  success: (message, title = 'Sucesso') => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'}`}>
        <CustomToast type="success" message={message} title={title} />
      </div>
    ), {
      duration: 4000,
      position: 'top-right'
    })
  },

  error: (message, title = 'Erro') => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'}`}>
        <CustomToast type="error" message={message} title={title} />
      </div>
    ), {
      duration: 5000,
      position: 'top-right'
    })
  },

  info: (message, title = 'Informação') => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'}`}>
        <CustomToast type="info" message={message} title={title} />
      </div>
    ), {
      duration: 4000,
      position: 'top-right'
    })
  },

  warning: (message, title = 'Atenção') => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'}`}>
        <CustomToast type="warning" message={message} title={title} />
      </div>
    ), {
      duration: 4500,
      position: 'top-right'
    })
  }
}

// Toaster Component to be added to App.jsx
export function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerStyle={{
        top: 80,
        right: 20
      }}
      toastOptions={{
        className: '',
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0
        }
      }}
    />
  )
}
