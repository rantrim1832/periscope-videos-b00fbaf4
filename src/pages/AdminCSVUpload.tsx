import { useState } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";

const DB_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "former_name", label: "Former Name" },
  { key: "concessions", label: "Concessions" },
  { key: "market", label: "Market" },
  { key: "submarket", label: "Submarket" },
  { key: "management_company", label: "Management Company" },
  { key: "onsite_manager", label: "Onsite Manager" },
  { key: "address", label: "Address" },
  { key: "state", label: "State" },
  { key: "city", label: "City" },
  { key: "zip_code", label: "ZIP Code" },
  { key: "phone", label: "Phone" },
  { key: "neighborhood", label: "Neighborhood" },
  { key: "units", label: "Units" },
  { key: "stories", label: "Stories" },
  { key: "built_type", label: "Built Type" },
  { key: "year_built", label: "Year Built" },
  { key: "beds", label: "Beds" },
  { key: "baths", label: "Baths" },
  { key: "occupancy_percent", label: "Occupancy %" },
  { key: "avg_rent", label: "Average Rent" },
  { key: "avg_eff_rent", label: "Average Effective Rent" },
  { key: "avg_price_per_sqft", label: "Average $/SqFt" },
  { key: "avg_eff_price_per_sqft", label: "Average Effective $/SqFt" },
  { key: "min_lease_term", label: "Min Lease Term" },
  { key: "software_system", label: "Software System" },
  { key: "housing_type", label: "Housing Type" },
  { key: "total_rentable_sqft", label: "Total Rentable SqFt" },
  { key: "url", label: "URL" },
  { key: "classification", label: "Classification" },
  { key: "county", label: "County" },
  { key: "avg_sqft", label: "Average SqFt" },
];

const DEFAULT_MAPPING: Record<string, string> = {
  "Name": "name",
  "Former Name": "former_name",
  "Concessions": "concessions",
  "Market": "market",
  "Submarket": "submarket",
  "Management Company": "management_company",
  "Onsite Manager": "onsite_manager",
  "Address": "address",
  "State": "state",
  "City": "city",
  "ZIP": "zip_code",
  "Phone": "phone",
  "Neighborhood": "neighborhood",
  "Units": "units",
  "Stories": "stories",
  "Built Type": "built_type",
  "Built": "year_built",
  "Beds": "beds",
  "Baths": "baths",
  "Occ %": "occupancy_percent",
  "Avg Rent": "avg_rent",
  "Avg Eff Rent": "avg_eff_rent",
  "Avg $/Sqft": "avg_price_per_sqft",
  "Avg Eff $/Sqft": "avg_eff_price_per_sqft",
  "Min Lease Term": "min_lease_term",
  "Software System": "software_system",
  "Housing Type": "housing_type",
  "Total Rentable Sqft": "total_rentable_sqft",
  "URL": "url",
  "Classification": "classification",
  "County": "county",
  "Avg Sqft": "avg_sqft",
};

export default function AdminCSVUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ inserted: number; skipped: number; errors: string[] } | null>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);

    // Parse CSV headers
    const text = await selectedFile.text();
    const lines = text.split('\n');
    if (lines.length > 0) {
      const headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim());
      setCsvHeaders(headers);
      
      // Auto-map headers
      const autoMapping: Record<string, string> = {};
      headers.forEach(header => {
        if (DEFAULT_MAPPING[header]) {
          autoMapping[header] = DEFAULT_MAPPING[header];
        }
      });
      setFieldMapping(autoMapping);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    // Check if required field 'name' is mapped
    const hasNameMapping = Object.values(fieldMapping).includes('name');
    if (!hasNameMapping) {
      toast({
        title: "Missing required field",
        description: "Please map the 'Name' field",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const csvContent = event.target?.result as string;

        const { data, error } = await supabase.functions.invoke('import-csv-properties', {
          body: {
            csvContent,
            fieldMapping,
          },
        });

        if (error) {
          console.error('Upload error:', error);
          toast({
            title: "Upload failed",
            description: error.message || "Failed to process CSV file",
            variant: "destructive",
          });
        } else {
          setUploadResult(data);
          toast({
            title: "Upload complete",
            description: `Imported ${data.inserted} properties successfully`,
          });
        }
        setUploading(false);
      };

      reader.onerror = () => {
        toast({
          title: "File read error",
          description: "Failed to read the CSV file",
          variant: "destructive",
        });
        setUploading(false);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Import Properties from CSV</h1>

          {/* File Upload */}
          <div className="mb-8">
            <Label htmlFor="csv-file" className="mb-2 block">Upload CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          {/* Field Mapping */}
          {csvHeaders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Map CSV Columns to Database Fields</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {csvHeaders.map((header) => (
                  <div key={header} className="flex items-center gap-4">
                    <Label className="w-1/2 text-sm">{header}</Label>
                    <Select
                      value={fieldMapping[header] || ""}
                      onValueChange={(value) => {
                        setFieldMapping(prev => ({
                          ...prev,
                          [header]: value === "skip" ? "" : value,
                        }));
                      }}
                    >
                      <SelectTrigger className="w-1/2">
                        <SelectValue placeholder="Skip field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip field</SelectItem>
                        {DB_FIELDS.map(field => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          {csvHeaders.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={uploading || !file}
                size="lg"
              >
                {uploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Properties
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Upload Results */}
          {uploadResult && (
            <div className="mt-8 p-4 border rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Upload Results</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>Imported: {uploadResult.inserted} properties</span>
                </div>
                {uploadResult.skipped > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span>Skipped: {uploadResult.skipped} rows</span>
                  </div>
                )}
                {uploadResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-destructive mb-2">Errors:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {uploadResult.errors.slice(0, 10).map((error, index) => (
                        <li key={index} className="text-muted-foreground">{error}</li>
                      ))}
                      {uploadResult.errors.length > 10 && (
                        <li className="text-muted-foreground">
                          ... and {uploadResult.errors.length - 10} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
