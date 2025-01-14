import { useToast } from "@/components/ui/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className={`${
            props.variant === 'destructive' 
              ? 'bg-red-50 border-red-100 text-red-600' 
              : 'bg-green-50 border-green-100 text-green-600'
          } rounded-[8px] shadow-lg`}>
            <div className="grid gap-1">
              {title && <ToastTitle className="text-sm font-semibold">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-sm opacity-90">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="opacity-70 hover:opacity-100 transition-opacity" />
          </Toast>
        )
      })}
      <ToastViewport className="fixed top-4 right-4 flex flex-col gap-2 w-full max-w-[420px] m-0 z-[100] outline-none" />
    </ToastProvider>
  )
}
