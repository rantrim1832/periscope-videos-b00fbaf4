import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gauge, ShieldCheck, ScanEye, Building2, Lock, Activity, Landmark } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const SECTIONS = [
  {
    icon: Gauge, title: "How the overall rating works",
    body: "The overall rating (0–100) is a trust-weighted, recency-decayed synthesis of resident ratings across 11 categories. Verified residents count far more than anonymous ones, recent experiences outweigh old ones, and we don't show a rating until there's enough signal — you'll see \u201cNot enough reviews yet\u201d instead of a fake number.",
  },
  {
    icon: Activity, title: "Rating vs. trajectory",
    body: "The rating is reputation (what residents think). The trajectory is direction — is the building getting better or worse? A place can have a decent rating but a declining trajectory after a management change. We show both.",
  },
  {
    icon: Landmark, title: "Deposit & maintenance intelligence",
    body: "Deposit return is the #1 silent grievance in renting, so we surface it prominently. Ratings for deposit return, maintenance responsiveness, safety, noise, and more are broken out — not hidden inside one star average.",
  },
  {
    icon: ScanEye, title: "Moderation & safety",
    body: "Every submission is screened before it appears. Our moderation fails closed: if we can't verify content is safe, it's held for human review rather than auto-published. We block hate, threats, doxxing, and spam — while protecting honest negative reviews.",
  },
  {
    icon: ShieldCheck, title: "Resident verification (and privacy)",
    body: "Verification proves you lived somewhere — not who you are. Tiers go Unverified → Likely Resident (GPS) → Verified Resident (lease/utility). Documents are matched then deleted. You can review pseudonymously; we protect renters from retaliation.",
  },
  {
    icon: Building2, title: "How property managers participate",
    body: "Managers can claim a property, add official content, and respond to reviews. They can never edit, delete, or suppress resident reviews — that's enforced at the database level. You'll always see resident experiences alongside official context.",
  },
  {
    icon: Lock, title: "What stays private",
    body: "Management/ownership relationships are private by default and only shown once a manager verifies control. We don't publish unverified factual claims about operators.",
  },
];

const FAQS = [
  { q: "Do I need to show my face in a video?", a: "No. Post anonymously — film the apartment, not yourself. Verification is about residency, not identity." },
  { q: "Can a landlord remove a negative review?", a: "No. Managers can respond and add context, but the platform never lets them delete or hide honest resident reviews." },
  { q: "Why is a rating missing on some properties?", a: "We only show a rating once there's enough verified resident input. Until then you'll see the property's page completeness and an option to add the first review." },
  { q: "Is this free for renters?", a: "Yes. Renters never pay to view property context or resident experiences. We monetize property-manager tools and aggregated, non-tenant-screening insights." },
];

const Help = () => {
  useDocumentTitle("How Periscope works — ratings, verification & safety", "How ratings, resident verification, and moderation work on Periscope.");
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold">How Periscope works</h1>
          <p className="text-lg text-muted-foreground">Clearer rental decisions — and how we keep sources separated and labeled.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><Icon className="w-5 h-5 text-primary" /> {s.title}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{s.body}</p></CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader><CardTitle>FAQ</CardTitle><CardDescription>Quick answers</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {FAQS.map((f) => (
              <div key={f.q} className="pb-4 border-b border-border/50 last:border-0">
                <h3 className="font-semibold mb-1">{f.q}</h3>
                <p className="text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Safety, privacy, and legal requests</CardTitle><CardDescription>Fast paths for issues that need review.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="hero" asChild><Link to="/report">Report content</Link></Button>
            <Button variant="outline" asChild><Link to="/contact">Contact support</Link></Button>
            <Button variant="outline" asChild><Link to="/privacy">Privacy</Link></Button>
            <Button variant="outline" asChild><Link to="/terms">Terms</Link></Button>
            <Button variant="outline" asChild><Link to="/dmca">DMCA</Link></Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-8 text-center space-y-4">
            <h3 className="text-2xl font-bold">Ready to help the next renter?</h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="hero" asChild><Link to="/contribute">Add a review</Link></Button>
              <Button variant="outline" asChild><Link to="/feed">Explore the feed</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Help;
