'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Rocket, X } from 'lucide-react'

interface WelcomeModalProps {
  open: boolean
  onStartTour: () => void
  onSkip: () => void
  userName?: string
}

export function WelcomeModal({ open, onStartTour, onSkip, userName }: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center border-2 border-gold-500/30">
              <Rocket className="w-8 h-8 text-gold-500" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center text-foreground">
            Welcome{userName ? `, ${userName}` : ''}! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            We&apos;re excited to have you on board. Let&apos;s take a quick tour to help you get started with PM Tool.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg border border-border">
            <Sparkles className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">What you&apos;ll learn:</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                <li>Navigate the dashboard</li>
                <li>Create and manage projects</li>
                <li>Track progress and reports</li>
                <li>Communicate with your team</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onSkip}
            className="w-full sm:w-auto border-border text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-2" />
            Skip Tour
          </Button>
          <Button
            onClick={onStartTour}
            className="w-full sm:w-auto bg-gold-500 hover:bg-gold-600 text-charcoal-900"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Start Tour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

