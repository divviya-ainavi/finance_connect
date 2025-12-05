import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, Shield } from "lucide-react";

interface VerificationScoreBoxProps {
  testingStatus: string;
  referencesStatus: string;
  idVerificationStatus: string;
  insuranceStatus: string;
  approvalStatus: string;
}

export const VerificationScoreBox = ({
  testingStatus,
  referencesStatus,
  idVerificationStatus,
  insuranceStatus,
  approvalStatus,
}: VerificationScoreBoxProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
      case "passed":
      case "completed":
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "pending":
      case "in_progress":
      case "sent":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "declined":
      case "rejected":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      not_started: "Not Started",
      in_progress: "In Progress",
      pending: "Pending",
      completed: "Completed",
      verified: "Verified",
      passed: "Passed",
      sent: "Sent",
      declined: "Declined",
      rejected: "Rejected",
      failed: "Failed",
      active: "Active",
      not_submitted: "Not Submitted",
    };
    return labels[status] || status;
  };

  const calculateScore = () => {
    let score = 0;
    const total = 4;

    if (["verified", "passed", "completed"].includes(testingStatus)) score++;
    if (["verified", "completed"].includes(referencesStatus)) score++;
    if (["verified", "completed"].includes(idVerificationStatus)) score++;
    if (["verified", "completed"].includes(insuranceStatus)) score++;

    return Math.round((score / total) * 100);
  };

  const score = calculateScore();

  const getApprovalBadge = () => {
    switch (approvalStatus) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "declined":
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="secondary">Pending Review</Badge>;
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verification Score
          </div>
          {getApprovalBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span className="font-bold text-lg">{score}%</span>
          </div>
          <Progress value={score} className="h-3" />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(testingStatus)}
              <span className="text-sm">Skills Testing</span>
            </div>
            <span className="text-xs text-muted-foreground">{getStatusLabel(testingStatus)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(referencesStatus)}
              <span className="text-sm">References</span>
            </div>
            <span className="text-xs text-muted-foreground">{getStatusLabel(referencesStatus)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(idVerificationStatus)}
              <span className="text-sm">ID Verification</span>
            </div>
            <span className="text-xs text-muted-foreground">{getStatusLabel(idVerificationStatus)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(insuranceStatus)}
              <span className="text-sm">Insurance</span>
            </div>
            <span className="text-xs text-muted-foreground">{getStatusLabel(insuranceStatus)}</span>
          </div>
        </div>

        {approvalStatus === "pending" && score === 100 && (
          <p className="text-xs text-muted-foreground bg-muted p-2 rounded mt-2">
            All verifications complete! Your profile is awaiting admin review.
          </p>
        )}

        {approvalStatus === "declined" && (
          <p className="text-xs text-destructive bg-destructive/10 p-2 rounded mt-2">
            Your profile was declined. Please contact support for more information.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
