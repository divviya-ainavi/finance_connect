import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle2, XCircle, Clock, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IdVerification {
  id: string;
  document_type: string;
  document_url: string;
  status: string;
  rejection_reason: string | null;
  is_insurance: boolean;
  created_at: string;
}

interface IdInsuranceUploadProps {
  workerProfileId: string;
  userId: string;
  idVerifications: IdVerification[];
  onRefresh: () => void;
}

const DOCUMENT_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "national_id", label: "National ID Card" },
];

export const IdInsuranceUpload = ({
  workerProfileId,
  userId,
  idVerifications,
  onRefresh,
}: IdInsuranceUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [idDocType, setIdDocType] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);

  const idDocs = idVerifications.filter((v) => !v.is_insurance);
  const insuranceDocs = idVerifications.filter((v) => v.is_insurance);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const handleViewDocument = async (documentUrl: string) => {
    try {
      // Extract the file path from the URL
      const urlParts = documentUrl.split('/storage/v1/object/public/cvs/');
      if (urlParts.length < 2) {
        throw new Error("Invalid document URL");
      }
      const filePath = urlParts[1];
      
      // Download the file
      const { data, error } = await supabase.storage.from("cvs").download(filePath);
      if (error) throw error;
      
      // Determine content type based on file extension
      const ext = filePath.split('.').pop()?.toLowerCase();
      let contentType = 'application/pdf';
      if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      else if (ext === 'png') contentType = 'image/png';
      
      // Create blob URL and open in new tab
      const blob = new Blob([data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (error: any) {
      console.error("Error viewing document:", error);
      toast({
        title: "Error",
        description: "Failed to open document",
        variant: "destructive",
      });
    }
  };

  const uploadDocument = async (file: File, isInsurance: boolean, docType: string) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${isInsurance ? "insurance" : "id"}_${Date.now()}.${fileExt}`;

      // Upload to storage (using cvs bucket for now, ideally would have dedicated bucket)
      const { error: uploadError } = await supabase.storage
        .from("cvs")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(fileName);

      // Create verification record
      const { error: insertError } = await supabase.from("id_verifications").insert({
        worker_profile_id: workerProfileId,
        document_type: isInsurance ? "insurance" : docType,
        document_url: urlData.publicUrl,
        is_insurance: isInsurance,
        status: "pending",
      });

      if (insertError) throw insertError;

      toast({
        title: "Document uploaded",
        description: `Your ${isInsurance ? "insurance" : "ID"} document has been submitted for review.`,
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setIdFile(null);
      setInsuranceFile(null);
      setIdDocType("");
    }
  };

  const handleIdUpload = () => {
    if (!idFile || !idDocType) {
      toast({
        title: "Missing information",
        description: "Please select a document type and file.",
        variant: "destructive",
      });
      return;
    }
    uploadDocument(idFile, false, idDocType);
  };

  const handleInsuranceUpload = () => {
    if (!insuranceFile) {
      toast({
        title: "Missing file",
        description: "Please select an insurance document.",
        variant: "destructive",
      });
      return;
    }
    uploadDocument(insuranceFile, true, "insurance");
  };

  return (
    <div className="space-y-6">
      {/* ID Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Government ID Verification</CardTitle>
          <CardDescription>
            Upload a valid government-issued ID document for identity verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {idDocs.length > 0 ? (
            <div className="space-y-3">
              {idDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.status)}
                    <div>
                      <p className="font-medium capitalize">{doc.document_type.replace("_", " ")}</p>
                      <p className="text-sm text-muted-foreground">
                        Submitted {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      {doc.rejection_reason && (
                        <p className="text-sm text-destructive mt-1">{doc.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDocument(doc.document_url)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {getStatusBadge(doc.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={idDocType} onValueChange={setIdDocType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Upload Document</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {idFile && <FileText className="h-5 w-5 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PDF, JPG, PNG. Max 10MB.
                </p>
              </div>

              <Button onClick={handleIdUpload} disabled={uploading || !idFile || !idDocType}>
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload ID Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insurance Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Insurance (Optional)</CardTitle>
          <CardDescription>
            Upload proof of professional indemnity insurance if applicable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insuranceDocs.length > 0 ? (
            <div className="space-y-3">
              {insuranceDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.status)}
                    <div>
                      <p className="font-medium">Insurance Document</p>
                      <p className="text-sm text-muted-foreground">
                        Submitted {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      {doc.rejection_reason && (
                        <p className="text-sm text-destructive mt-1">{doc.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDocument(doc.document_url)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {getStatusBadge(doc.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Insurance Certificate</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setInsuranceFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {insuranceFile && <FileText className="h-5 w-5 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PDF, JPG, PNG. Max 10MB.
                </p>
              </div>

              <Button onClick={handleInsuranceUpload} disabled={uploading || !insuranceFile} variant="outline">
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload Insurance Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
