import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CreditCard, CheckCircle, Lock, Shield } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workerName: string;
  hoursPerWeek: number;
  onPaymentComplete: () => void;
}

const PaymentDialog = ({ 
  open, 
  onOpenChange, 
  workerName, 
  hoursPerWeek,
  onPaymentComplete 
}: PaymentDialogProps) => {
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");

  const connectionFee = 49.99; // Dummy connection fee

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvv || !name) return;
    
    setProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setPaymentSuccess(true);
    setProcessing(false);
    
    // Wait a moment to show success, then complete
    setTimeout(() => {
      onPaymentComplete();
      setPaymentSuccess(false);
      setCardNumber("");
      setExpiry("");
      setCvv("");
      setName("");
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {!paymentSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Complete Payment
              </DialogTitle>
              <DialogDescription>
                Pay the connection fee to start messaging {workerName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Order Summary */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connection to {workerName}</span>
                      <span>£{connectionFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hours per week</span>
                      <span>{hoursPerWeek} hrs</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-primary">£{connectionFee}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card Details */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="John Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                    />
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      maxLength={4}
                      type="password"
                    />
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Secure payment - Your data is encrypted</span>
              </div>

              {/* Pay Button */}
              <Button 
                onClick={handlePayment} 
                disabled={processing || !cardNumber || !expiry || !cvv || !name}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Pay £{connectionFee}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                This is a demo payment. No real charges will be made.
              </p>
            </div>
          </>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground">
                You can now message {workerName}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;