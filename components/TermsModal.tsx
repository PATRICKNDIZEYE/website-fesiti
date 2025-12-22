'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TermsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsModal({ open, onOpenChange }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>
            Last updated: {new Date().toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
          <section>
            <h3 className="text-foreground font-semibold mb-2">1. Acceptance of Terms</h3>
            <p>
              By accessing and using the PM Tool platform (&quot;Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">2. Use License</h3>
            <p>
              Permission is granted to temporarily use the PM Tool for project management purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained in the Service</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">3. User Accounts</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password. You must notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">4. Project Data and Privacy</h3>
            <p>
              You retain all rights to your project data. We will not access, use, or disclose your project data except as necessary to provide the Service or as required by law. You are responsible for ensuring that your use of the Service complies with all applicable laws and regulations.
            </p>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">5. Prohibited Uses</h3>
            <p>You may not use the Service:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>In any way that violates any applicable law or regulation</li>
              <li>To transmit any malicious code or viruses</li>
              <li>To impersonate or attempt to impersonate another user or entity</li>
              <li>To interfere with or disrupt the Service or servers connected to the Service</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">6. Limitation of Liability</h3>
            <p>
              In no event shall PM Tool or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the Service.
            </p>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">7. Modifications</h3>
            <p>
              PM Tool may revise these terms of service at any time without notice. By using this Service you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">8. Contact Information</h3>
            <p>
              If you have any questions about these Terms of Service, please contact us through the support channels provided in the application.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

