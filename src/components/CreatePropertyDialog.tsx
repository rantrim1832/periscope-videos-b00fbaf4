import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2 } from "lucide-react";

interface CreatePropertyDialogProps {
  onPropertyCreated?: (propertyId: string) => void;
  trigger?: React.ReactNode;
}

export const CreatePropertyDialog = ({ onPropertyCreated, trigger }: CreatePropertyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    rent: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a property",
          variant: "destructive"
        });
        return;
      }

      // Enrich property data with RentCast
      console.log('Enriching property data...');
      const { data: enrichData, error: enrichError } = await supabase.functions.invoke('enrich-property', {
        body: {
          address: formData.address,
          city: formData.city,
          state: formData.state
        }
      });

      if (enrichError) {
        console.error('Enrichment error:', enrichError);
      }

      // Create property
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          rent: formData.rent ? parseFloat(formData.rent) : null,
          created_by_user_id: user.id,
          status: 'pending',
          verification_required: true,
          ...(enrichData?.success ? enrichData.data : {})
        })
        .select()
        .single();

      if (propertyError) throw propertyError;

      toast({
        title: "Property Created!",
        description: "Your property has been submitted for approval. Verify your ID to publish it immediately and earn 100 points!"
      });

      setOpen(false);
      setFormData({ name: "", address: "", city: "", state: "", rent: "" });
      
      if (onPropertyCreated && property) {
        onPropertyCreated(property.id);
      }

    } catch (error) {
      console.error('Error creating property:', error);
      toast({
        title: "Error",
        description: "Failed to create property. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Create New Property
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Property</DialogTitle>
          <DialogDescription>
            Add a new property to the database. ID verification is required to publish.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Property Name *</Label>
            <Input
              id="name"
              placeholder="e.g. The Grand Apartments"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              placeholder="123 Main St"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="New York"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                placeholder="NY"
                maxLength={2}
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rent">Monthly Rent (Optional)</Label>
            <Input
              id="rent"
              type="number"
              placeholder="1500"
              value={formData.rent}
              onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Property
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
