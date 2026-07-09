import { Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const PAGES = {
  '/terms': {
    title: 'Terms of Service',
    description: 'Rules for using Periscope and contributing apartment content.',
    sections: [
      ['Purpose', 'Periscope helps renters, residents, property staff, and creators understand apartment living through resident experiences, official/public sources, and clearly labeled evidence.'],
      ['User content', 'By submitting content, you confirm you have the right to share it and grant Periscope permission to display, moderate, transform for display, and distribute it as part of the service.'],
      ['No review suppression', 'Property managers may claim pages, respond, and add official context. They may not pay to suppress, delete, or hide honest resident content.'],
      ['Prohibited content', 'Do not post threats, harassment, hate, nudity, sexual content, doxxing, private personal information, unit numbers tied to private people, or content that violates law or platform rules.'],
      ['No tenant screening', 'Periscope is not a tenant-screening, credit, FCRA, legal, or leasing-decision service. Do not use resident profiles or contributions for tenant eligibility decisions.'],
      ['Accuracy and sources', 'Content may be resident-reported, official, public-source, creator, or imported. Source labels and confidence matter; no page is a guarantee of current property conditions.'],
      ['Moderation', 'Periscope may hold, remove, label, or limit content to protect safety, privacy, copyright, and platform integrity. Moderation decisions do not create an endorsement of any party.'],
    ],
  },
  '/privacy': {
    title: 'Privacy Policy',
    description: 'How Periscope handles account, verification, contact, and contribution data.',
    sections: [
      ['Data we collect', 'We collect account details, contributions, reports, claim submissions, contact messages, usage events, and source metadata needed to operate the service.'],
      ['Resident verification', 'Verification is designed to prove residency, not public identity. Lease/utility evidence should be redacted where possible and is not displayed publicly.'],
      ['Property emails', 'Property/staff emails may be used for claim outreach, support, and verification. Raw property emails are not displayed publicly unless explicitly approved as public contact information.'],
      ['Social embeds', 'Public social content may be displayed through embeds or links. Embedded platforms may process viewer data under their own policies.'],
      ['Reports and safety', 'Safety, privacy, copyright, and abuse reports are routed to admins. Reporter details are used for follow-up and investigation, not public display.'],
      ['Analytics', 'We may use privacy-conscious analytics to understand search, sharing, contribution, claim, and retention flows.'],
      ['Requests', 'Use the contact page for privacy, deletion, correction, or access requests. We may retain records needed for safety, fraud prevention, and legal compliance.'],
    ],
  },
  '/dmca': {
    title: 'Copyright / DMCA Policy',
    description: 'How to report copyright concerns involving videos, images, embeds, or other content.',
    sections: [
      ['Embed-first approach', 'Periscope prefers official embeds and source links over downloading or rehosting third-party social media. User uploads must be owned or authorized by the contributor.'],
      ['Submitting a notice', 'Use the report form and select Copyright / DMCA. Include the copyrighted work, the URL on Periscope, your contact information, and a good-faith statement that use is unauthorized.'],
      ['Counter-notices', 'If your content was removed and you believe it was misidentified, contact us with the removed URL, your rights basis, and a statement under penalty of perjury where required.'],
      ['Repeat issues', 'Accounts or sources with repeated copyright, privacy, or safety violations may be restricted or removed.'],
    ],
  },
} as const;

const Legal = () => {
  const location = useLocation();
  const page = PAGES[location.pathname as keyof typeof PAGES] ?? PAGES['/terms'];
  useDocumentTitle(`${page.title} — Periscope`, page.description);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">{page.title}</h1>
          <p className="text-muted-foreground">{page.description}</p>
          <p className="text-xs text-muted-foreground">
            Last updated: July 9, 2026 · Questions? <Link to="/contact" className="underline">Contact us</Link> or email{' '}
            <a href="mailto:legal@joinperiscope.com" className="underline">legal@joinperiscope.com</a>.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {page.sections.map(([title, body]) => (
              <section key={title} className="space-y-2">
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="text-muted-foreground">{body}</p>
              </section>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Need help?</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="hero" asChild><Link to="/contact">Contact Periscope</Link></Button>
            <Button variant="outline" asChild><Link to="/report">Report content</Link></Button>
            <Button variant="outline" asChild><Link to="/terms">Terms</Link></Button>
            <Button variant="outline" asChild><Link to="/privacy">Privacy</Link></Button>
            <Button variant="outline" asChild><Link to="/dmca">DMCA</Link></Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Legal;
