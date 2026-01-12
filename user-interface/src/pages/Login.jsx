import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardFooter, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Lock, Mail, Eye, EyeOff, BookOpen } from 'lucide-react';
import { FcGoogle} from 'react-icons/fc'
import { toast } from "sonner";
import API from '@/api';
import React from 'react';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [unverified, setUnverified] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setUnverified(false);

        try {
            const response = await API.post('/user/login', { email, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('teacherId', response.data.user._id);
            localStorage.setItem('userData', JSON.stringify(response.data.user));
            localStorage.setItem('schoolName', response.data.user.schoolName);

            toast.success("Login Successful");

            if (response.data.user.role === 'Admin') {
                navigate('/adminPages');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Login failed:', error);

            if (error.response?.status === 403) {
                toast.error(error.response.data.message);
                setUnverified(true);
            } else {
                toast.error(error.response?.data?.message || "Login Failed");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        try {
            await API.post('/user/resend-verification', { email });
            toast.success("Verification email sent! Check your inbox.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to resend verification.");
        }
    };

    // ✅ ADD: Google Login Handler
    const handleGoogleLogin = () => {
        // Redirect to backend Google OAuth endpoint
        const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
        window.location.href = `${backendUrl}/api/user/google`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-24 h-24 bg-purple-200/30 rounded-full blur-xl"></div>
            
            <Card className="w-96 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 w-full"></div>
                
                <CardHeader className="text-center pb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="text-white w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Welcome Back
                    </CardTitle>
                    <p className="text-gray-600 text-sm mt-2">Sign in to your DBSL account</p>
                </CardHeader>
                
                <CardContent>
                    {/* ✅ ADD: Google Login Button */}
                    <Button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 py-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 mb-4"
                    >
                        <FcGoogle/>
                        <span className="ml-2 font-semibold">Continue with Google</span>
                    </Button>

                    {/* ✅ ADD: Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                            <Input 
                                type="email" 
                                placeholder="Email address" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                className="pl-10 bg-white border border-gray-200 rounded-xl py-6 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                required
                            />
                        </div>
                        
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                            <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="pl-10 bg-white border border-gray-200 rounded-xl py-6 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                required
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? (
                                    <EyeOff className="text-gray-400 hover:text-gray-600 transition-colors" />
                                ) : (
                                    <Eye className="text-gray-400 hover:text-gray-600 transition-colors" />
                                )}
                            </div>
                        </div>
                        
                        <Button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:transform-none disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Logging in...
                                </div>
                            ) : (
                                'Login to Dashboard'
                            )}
                        </Button>
                    </form>

                    {unverified && (
                        <div className="mt-4 text-center">
                            <p className="text-gray-600 text-sm mb-2">Didn't receive the email?</p>
                            <Button 
                                onClick={handleResendVerification} 
                                className="bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg px-4 py-2"
                            >
                                Resend Verification Email
                            </Button>
                        </div>
                    )}
                </CardContent>
                
                <CardFooter className="text-center pt-4 pb-6">
                    <p className="text-gray-600">
                        Don't have an account?{' '}
                        <a 
                            href="/signup" 
                            className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all"
                        >
                            Create account
                        </a>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default Login;