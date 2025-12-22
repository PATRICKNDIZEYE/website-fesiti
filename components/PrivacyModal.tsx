'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PrivacyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrivacyModal({ open, onOpenChange }: PrivacyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
          <DialogDescription>
            Last updated: {new Date().toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
          <section>
            <h3 className="text-foreground font-semibold mb-2">1. Information We Collect</h3>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Account information (name, email address, password)</li>
              <li>Project data and content you create or upload</li>
              <li>Usage data and analytics</li>
              <li>Communication data when you contact support</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">2. How We Use Your Information</h3>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Provide, maintain, and improve our Service</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">3. Data Security</h3>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">4. Data Retention</h3>
            <p>
              We retain your personal information for as long as necessary to provide the Service and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">5. Your Rights</h3>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Access and receive a copy of your personal data</li>
              <li>Rectify inaccurate or incomplete data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">6. Third-Party Services</h3>
            <p>
              Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
            </p>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">7. Cookies and Tracking</h3>
            <p>
              We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">8. Children&apos;s Privacy</h3>
            <p>
              Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">9. Changes to This Privacy Policy</h3>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h3 className="text-foreground font-semibold mb-2">10. Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please contact us through the support channels provided in the application.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

