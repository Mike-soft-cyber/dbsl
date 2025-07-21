import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircleCheckBig } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import Navbar from "@/components/ui/dashboard/NavBar";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;
  const userData = JSON.parse(localStorage.getItem('userData'));

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    const userPhone = localStorage.getItem("phone");
    if (userPhone) setPhone(userPhone);
  }, []);

  const handlePayment = async () => {
    if (!phone) {
      toast.error("Phone number not found");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payments/mpesa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: data?.amount || 50,
          phone,
          documentId: data?.documentId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Payment initiated. Check your phone for M-Pesa prompt.");
        setPolling(true);
        pollPaymentStatus(result.checkoutRequestID);
      } else {
        toast.error("Payment initiation failed. Try again.");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error initiating payment. Please try again.");
      setLoading(false);
    }
  };

  const pollPaymentStatus = (checkoutRequestID) => {
    let attempts = 0;
    const maxAttempts = 12; // ~1 minute if polling every 5 seconds

    const interval = setInterval(async () => {
      attempts++;
      console.log(`Polling payment status... attempt ${attempts}`);

      try {
        const response = await fetch("/api/payments/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutRequestID }),
        });

        const result = await response.json();

        if (result.success && result.paid) {
          clearInterval(interval);
          setPolling(false);
          setLoading(false);

          toast.success("Payment confirmed. Download starting...");
          window.open(result.downloadUrl, "_blank");
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPolling(false);
          setLoading(false);
          toast.error("Payment verification timed out. Please try again.");
        }
      } catch (error) {
        console.error("Error polling payment status:", error);
        clearInterval(interval);
        setPolling(false);
        setLoading(false);
        toast.error("Error verifying payment. Please try again.");
      }
    }, 5000); // poll every 5 seconds
  };

  if (!data) {
    return (
      <div className="p-6 text-center text-red-500">
        <Navbar />
        <Toaster richColors position="top-center" />
        <p>No document data found. Return to <a href="/dashboard" className="underline text-blue-600">Dashboard</a>.</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar userData={userData}/>
      <Toaster richColors position="top-center" />

      <Card className="m-8 p-4 bg-white shadow-md rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CircleCheckBig className="text-green-600" />
            Document Generated Successfully
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <p><strong>Document:</strong> {data?.type}</p>
          <p><strong>Term:</strong> {data?.term}</p>
          <p><strong>Grade:</strong> {data?.grade}</p>
          <p><strong>Learning Area:</strong> {data?.learningAreaName}</p>
          <p><strong>Strand:</strong> {data?.strandName}</p>
          <p><strong>Substrand:</strong> {data?.substrandsName}</p>
          <p><strong>Price:</strong> KES {Number(data?.amount || 50).toLocaleString()}</p>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Phone Number</label>
            <Input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="border px-2 py-1 rounded w-full"
            />
          </div>

          <Button
            onClick={handlePayment}
            disabled={loading || polling}
            className={`w-full ${loading ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"}`}
          >
            {loading ? "Processing..." : "Pay with M-Pesa"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
