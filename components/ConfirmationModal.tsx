'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Trash2, LogOut, Loader2, Info, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ConfirmationType = 'delete' | 'logout' | 'warning' | 'danger' | 'default' | 'success'

interface ConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  type?: ConfirmationType
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

const typeConfig: Record<ConfirmationType, { icon: React.ReactNode; iconBg: string; buttonColor: string }> = {
  delete: {
    icon: <Trash2 className="w-5 h-5" />,
    iconBg: 'bg-destructive/10 border-destructive/20 text-destructive',
    buttonColor: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
  },
  logout: {
    icon: <LogOut className="w-5 h-5" />,
    iconBg: 'bg-primary/10 border-primary/20 text-primary',
    buttonColor: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    iconBg: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-500',
    buttonColor: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  },
  danger: {
    icon: <AlertTriangle className="w-5 h-5" />,
    iconBg: 'bg-red-500/20 border-red-500/30 text-red-500',
    buttonColor: 'bg-red-500 hover:bg-red-600 text-white',
  },
  default: {
    icon: <Info className="w-5 h-5" />,
    iconBg: 'bg-blue-500/20 border-blue-500/30 text-blue-500',
    buttonColor: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  },
  success: {
    icon: <CheckCircle className="w-5 h-5" />,
    iconBg: 'bg-green-500/20 border-green-500/30 text-green-500',
    buttonColor: 'bg-green-500 hover:bg-green-600 text-white',
  },
}

export function ConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  type = 'delete',
  confirmText,
  cancelText = 'Cancel',
  loading = false,
}: ConfirmationModalProps) {
  const config = typeConfig[type]
  const finalConfirmText = confirmText || (type === 'delete' ? 'Delete' : type === 'logout' ? 'Log Out' : 'Confirm')

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border", config.iconBg)}>
              {config.icon}
            </div>
            <AlertDialogTitle className="text-xl text-foreground">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="border-border text-muted-foreground hover:text-foreground">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(config.buttonColor, "disabled:opacity-50")}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              finalConfirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
