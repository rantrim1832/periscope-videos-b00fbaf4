import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreatePropertyDialog } from "@/components/CreatePropertyDialog";
import { useState } from "react";
import { Upload, Search, Check, MapPin, Home, Video, FileText, Award } from "lucide-react";

const PostReview = () => {
  const [step, setStep] = useState(1);

  const steps = [
    { number: 1, title: "Find Property", icon: Search },
    { number: 2, title: "Upload Video", icon: Video },
    { number: 3, title: "Add Details", icon: FileText },
    { number: 4, title: "Verify (Optional)", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Stepper */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              {steps.map((s, idx) => (
                <div key={s.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        step > s.number
                          ? "bg-success border-success text-success-foreground"
                          : step === s.number
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-border text-muted-foreground"
                      }`}
                    >
                      {step > s.number ? <Check className="w-6 h-6" /> : <s.icon className="w-6 h-6" />}
                    </div>
                    <span
                      className={`text-sm mt-2 font-medium ${
                        step >= s.number ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-4 ${
                        step > s.number ? "bg-success" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-6 h-6 text-primary" />
                  Find Your Property
                </CardTitle>
                <CardDescription>
                  Search for your apartment or add a new property if it doesn't exist
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="property-search">Search by address or property name</Label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                    <Input
                      id="property-search"
                      placeholder="e.g., 123 Main St, New York, NY or Metropolitan Apartments"
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                {/* Mock search results */}
                <div className="space-y-2 pt-4">
                  <p className="text-sm text-muted-foreground">Suggested properties:</p>
                  {[
                    { name: "Sunset Apartments", address: "123 Main St, Brooklyn, NY 11201" },
                    { name: "Metropolitan Towers", address: "456 5th Ave, New York, NY 10001" },
                  ].map((property) => (
                    <Card
                      key={property.name}
                      className="cursor-pointer hover:bg-muted/50 transition-colors border-border/50"
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">{property.name}</p>
                            <p className="text-sm text-muted-foreground">{property.address}</p>
                          </div>
                        </div>
                        <Badge variant="outline">Select</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="pt-4">
                  <CreatePropertyDialog 
                    trigger={
                      <Button variant="outline" className="w-full">
                        + Create New Property
                      </Button>
                    }
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="hero" onClick={() => setStep(2)}>
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-6 h-6 text-primary" />
                  Upload Your Video Review
                </CardTitle>
                <CardDescription>
                  Show the real story - upload a video of your apartment experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer bg-muted/20">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-foreground font-medium mb-2">Drag & drop your video here</p>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                  <Button variant="outline">Choose File</Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Maximum file size: 100MB | Formats: MP4, MOV, AVI
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 text-foreground">Pro Tips:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Keep it under 3 minutes for best engagement</li>
                    <li>Show specific areas: kitchen, bathroom, common spaces</li>
                    <li>Point out both positives and negatives</li>
                    <li>Speak clearly about your experience</li>
                  </ul>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button variant="hero" className="flex-1" onClick={() => setStep(3)}>
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  Add Review Details
                </CardTitle>
                <CardDescription>Help others find your review with tags and descriptions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="review-title">Review Title *</Label>
                  <Input
                    id="review-title"
                    placeholder="e.g., Roach problem in kitchen - avoid!"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="review-description">Additional Details (Optional)</Label>
                  <Textarea
                    id="review-description"
                    placeholder="Add any extra context or tips for future renters..."
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                <div>
                  <Label>Tags (AI suggested based on your video)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Pests", "Kitchen", "Warning", "Maintenance"].map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        #{tag}
                      </Badge>
                    ))}
                    <Button variant="outline" size="sm">
                      + Add Tag
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="anonymous" className="rounded" />
                  <Label htmlFor="anonymous" className="cursor-pointer">
                    Post anonymously (your identity will be hidden)
                  </Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button variant="hero" className="flex-1" onClick={() => setStep(4)}>
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-primary" />
                  Verify Your Residency (Optional)
                </CardTitle>
                <CardDescription>
                  Get a verified badge and earn 50 bonus points by proving you lived there
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Why verify?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Your review will be marked as verified</li>
                    <li>✓ Earn 50 bonus points toward rewards</li>
                    <li>✓ Build trust with the community</li>
                    <li>✓ Takes less than 1 minute</li>
                  </ul>
                </div>

                <div>
                  <Label>Upload proof of residency (lease, utility bill - address will be redacted)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer mt-2 bg-muted/20">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-foreground font-medium">Upload document</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (max 5MB)</p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
                  🔒 Your document will be automatically processed and deleted. We only verify the
                  address matches your review.
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Skip for Now
                  </Button>
                  <Button variant="hero" className="flex-1">
                    Verify & Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostReview;
