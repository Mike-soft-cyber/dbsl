import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardFooter, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Toaster, toast } from "sonner";
import API from '@/api';
import React from 'react';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true)
        try {
            const response = await API.post('/user/login', { email, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('teacherId', response.data.user._id)
            localStorage.setItem('userData', JSON.stringify(response.data.user))
            localStorage.setItem('schoolName', response.data.user.schoolName);
            toast.success("Login Successful")
            navigate('/dashboard');
        } catch (error) {
            console.error('Login failed:', error);
            toast.error(error.response?.data?.message || "Login Failed")
        }
    };
    const togglePassword = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-teal-900">
            <Toaster richColors position="top-center" />
            <Card className="w-96 bg-white shadow-lg">
                <CardHeader>
                    <CardTitle className="text-center">Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-gray-50 border border-gray-300 rounded-md" />
                      </div>
                      <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-gray-50 border border-gray-300 rounded-md" />
                          {showPassword ? (
                              <Eye className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer" onClick={togglePassword} />
                          ) : (
                              <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer" onClick={togglePassword} />
                          )}
                      </div>
                        <Button type="submit" disabled={loading} className="w-full bg-teal-600 text-white hover:bg-teal-700 cursor-pointer disabled:cursor-not-allowed">
                            {loading ? 'Logging in...' : 'Login'}
                            </Button>
                    </form>
                </CardContent>
                <CardFooter className="text-center">
                    <p>Don't have an account? <a href="/signup" className="text-teal-600 hover:text-teal-700 font-bold cursor-pointer">Signup</a></p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default Login;
