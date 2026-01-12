// src/pages/AuthCallback.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import API from '../api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const email = searchParams.get('email');
        
        console.log('Auth Callback received:', { token: token?.substring(0, 20) + '...', email });

        if (!token) {
          console.error('❌ No token in callback URL');
          toast.error('Authentication failed - no token received');
          navigate('/login');
          return;
        }

        // ✅ Store the token first
        localStorage.setItem('token', token);
        console.log('✅ Token stored in localStorage');

        // ✅ CRITICAL: Fetch the COMPLETE user data from backend
        console.log('📡 Fetching complete user data from backend...');
        
        const response = await API.get('/teacher/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const userData = response.data;
        console.log('✅ User data fetched successfully:', {
          email: userData.email,
          profilePic: userData.profilePic,
          signupMethod: userData.signupMethod,
          role: userData.role
        });

        // ✅ Store COMPLETE user data including profilePic
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('teacherId', userData._id);
        localStorage.setItem('schoolName', userData.schoolName);

        console.log('✅ All user data stored in localStorage');
        console.log('📸 Profile pic in localStorage:', userData.profilePic);

        // ✅ Dispatch event to update UI components
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('profilePicUpdated'));

        toast.success('Login successful!');
        setStatus('success');

        // Navigate based on role
        setTimeout(() => {
          if (userData.role === 'Admin') {
            console.log('🔀 Redirecting to admin dashboard...');
            navigate('/adminPages');
          } else {
            console.log('🔀 Redirecting to teacher dashboard...');
            navigate('/dashboard');
          }
        }, 500);

      } catch (error) {
        console.error('❌ Auth callback error:', error);
        console.error('Error details:', error.response?.data);
        
        setStatus('error');
        toast.error(error.response?.data?.message || 'Authentication failed');
        
        // Clear any partial data
        localStorage.clear();
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Completing sign in...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait while we set up your account</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">Sign in successful!</p>
            <p className="text-gray-500 text-sm mt-2">Redirecting to dashboard...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">Authentication failed</p>
            <p className="text-gray-500 text-sm mt-2">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}