import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import API from "@/api";

export default function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState("Verifying...");

    // Extract query params from URL
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token || !email) {
                setStatus("Invalid verification link.");
                return;
            }

            try {
                const res = await API.get(`/user/verify-email?token=${token}&email=${email}`);
                toast.success(res.data.message || "Email verified successfully!");
                setStatus("Email verified successfully!");
                
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    navigate("/dashboard");
                }, 1500);
            } catch (err) {
                console.error("Verification failed:", err.response?.data?.message || err);
                setStatus(err.response?.data?.message || "Verification failed.");
            }
        };

        verifyEmail();
    }, [token, email, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <Card className="w-96 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 w-full"></div>
                <CardHeader className="text-center pb-6">
                    <CardTitle className="text-2xl font-bold text-gray-800">Email Verification</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-gray-700 mb-4">{status}</p>

                    {status.includes("failed") || status.includes("Invalid") ? (
                        <Button
                            onClick={() => navigate("/login")}
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2"
                        >
                            Go to Login
                        </Button>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
