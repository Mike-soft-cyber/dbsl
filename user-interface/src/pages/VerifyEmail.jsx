// Create a new VerifyEmail.jsx component
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import API from '../api';
import { toast } from 'sonner';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [verifying, setVerifying] = useState(!!token);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);
  const [resending, setResending] = useState(false);
  
  const stateEmail = location.state?.email || email || localStorage.getItem('pendingVerificationEmail');
  
  useEffect(() => {
    // Auto-verify if token is present
    if (token && email) {
      verifyEmail();
    }
  }, [token, email]);
  
  const verifyEmail = async () => {
    try {
      setVerifying(true);
      const response = await API.get(`/user/verify-email?token=${token}&email=${encodeURIComponent(email)}`);
      
      if (response.data.token) {
        // Save token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        localStorage.removeItem('pendingVerificationEmail');
        
        setVerified(true);
        toast.success(response.data.message || "Email verified successfully!");
        
        // Redirect to appropriate dashboard after 2 seconds
        setTimeout(() => {
          if (response.data.user.role === 'Admin') {
            navigate('/adminPages');
          } else {
            navigate('/dashboard');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError(error.response?.data?.message || "Invalid or expired verification link");
      toast.error("Verification failed");
    } finally {
      setVerifying(false);
    }
  };
  
  const handleResendVerification = async () => {
    if (!stateEmail) {
      toast.error("No email found to resend verification");
      return;
    }
    
    try {
      setResending(true);
      await API.post('/user/resend-verification', { email: stateEmail });
      toast.success("Verification email resent! Please check your inbox.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };
  
  const handleLoginRedirect = () => {
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 w-full"></div>
        
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {verified ? (
              <CheckCircle className="text-white w-8 h-8" />
            ) : error ? (
              <AlertCircle className="text-white w-8 h-8" />
            ) : (
              <Mail className="text-white w-8 h-8" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {verifying ? 'Verifying...' : verified ? 'Verified!' : error ? 'Verification Failed' : 'Verify Your Email'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {verifying ? (
            <div className="space-y-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Verifying your email address...</p>
            </div>
          ) : verified ? (
            <div className="space-y-4">
              <p className="text-green-600 font-semibold">Your email has been verified successfully!</p>
              <p className="text-gray-600">Redirecting to your dashboard...</p>
              <Button 
                onClick={() => {
                  if (JSON.parse(localStorage.getItem('userData')).role === 'Admin') {
                    navigate('/adminPages');
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                Go to Dashboard Now
              </Button>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <p className="text-red-600 font-semibold">{error}</p>
              <p className="text-gray-600">Please try resending the verification email or contact support.</p>
              {stateEmail && (
                <Button 
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </Button>
              )}
              <Button 
                onClick={handleLoginRedirect}
                variant="outline"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                We've sent a verification email to <span className="font-semibold">{stateEmail}</span>
              </p>
              <p className="text-gray-500 text-sm">
                Please check your inbox and click the verification link. Don't forget to check your spam folder!
              </p>
              {stateEmail && (
                <>
                  <Button 
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {resending ? 'Sending...' : 'Resend Verification Email'}
                  </Button>
                  <p className="text-xs text-gray-500">
                    Didn't receive the email? Click above to resend.
                  </p>
                </>
              )}
              <Button 
                onClick={handleLoginRedirect}
                variant="outline"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default VerifyEmail;