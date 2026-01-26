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
      <DialogContent className="sm:max-w-3xl bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center text-foreground">
            Welcome{userName ? `, ${userName}` : ''}! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            We&apos;re excited to have you on board. Let&apos;s take a quick tour to help you get started with PM Tool.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg border border-border">
            <Sparkles className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-base font-medium text-foreground mb-2">What you&apos;ll learn:</p>
              <div className="grid grid-cols-2 gap-2">
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    <span>Navigate the dashboard</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    <span>Create and manage projects</span>
                  </li>
                </ul>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    <span>Track progress and reports</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    <span>Communicate with your team</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onSkip}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-2" />
            Skip Tour
          </Button>
          <Button
            onClick={onStartTour}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Start Tour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
