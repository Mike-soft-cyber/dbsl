import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from "sonner";
import { Card, CardFooter, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { User, Lock, Mail, Phone, School, Eye, EyeOff, BookOpen } from 'lucide-react';
import { FcGoogle} from 'react-icons/fc'
import API from '../api';

export default function Signup() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        role: '',
        schoolName: '',
        schoolCode: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const res = await API.post('/user/register', formData);
            const { user, message } = res.data;

            toast.success(message || "Account created! Please check your email to verify your account.");
            navigate('/login');
            
        } catch (err) {
            console.error("Signup error:", err.response ? err.response.data : err.message);
            toast.error("Signup Failed: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // ✅ ADD: Google Signup Handler
    const handleGoogleSignup = () => {
        const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
        window.location.href = `${backendUrl}/api/user/google`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-24 h-24 bg-purple-200/30 rounded-full blur-xl"></div>
            
            <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 w-full"></div>
                
                <CardHeader className="text-center pb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="text-white w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Create Account
                    </CardTitle>
                    <p className="text-gray-600 text-sm mt-2">Join thousands of educators using DBSL</p>
                </CardHeader>
                
                <CardContent>
                    {/* ✅ ADD: Google Signup Button */}
                    <Button
                        type="button"
                        onClick={handleGoogleSignup}
                        className="w-full bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 py-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 mb-4"
                    >
                        <FcGoogle/>
                        <span className="ml-2 font-semibold">Sign up with Google</span>
                    </Button>

                    {/* ✅ ADD: Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">Or sign up with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                <Input 
                                    name="firstName"
                                    placeholder="First name"
                                    onChange={handleChange}
                                    className="pl-10 bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                    required
                                />
                            </div>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                <Input 
                                    name="lastName"
                                    placeholder="Last name"
                                    onChange={handleChange}
                                    className="pl-10 bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                            <Input 
                                name="phone"
                                placeholder="Phone number"
                                onChange={handleChange}
                                className="pl-10 bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                required
                            />
                        </div>

                        {/* Role Select */}
                        <Select onValueChange={(value) => setFormData({ ...formData, role: value })}>
                            <SelectTrigger className="w-full bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                                <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                                <SelectItem value="Admin" className="cursor-pointer hover:bg-blue-50 rounded-lg py-3">
                                    Administrator
                                </SelectItem>
                                <SelectItem value="Teacher" className="cursor-pointer hover:bg-blue-50 rounded-lg py-3">
                                    Teacher
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* School Info */}
                        <div className="relative">
                            <School className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                            <Input 
                                name="schoolName"
                                placeholder="School name"
                                onChange={handleChange}
                                className="pl-10 bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                required
                            />
                        </div>

                        <div className="relative">
                            <School className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                            <Input 
                                name="schoolCode"
                                placeholder="School code"
                                onChange={handleChange}
                                className="pl-10 bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                            <Input 
                                name="email"
                                type="email"
                                placeholder="Email address"
                                onChange={handleChange}
                                className="pl-10 bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                            <Input 
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Create password"
                                onChange={handleChange}
                                className="pl-10 bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
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

                        {/* Confirm Password */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                            <Input 
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm password"
                                onChange={handleChange}
                                className="pl-10 bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                required
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? (
                                    <EyeOff className="text-gray-400 hover:text-gray-600 transition-colors" />
                                ) : (
                                    <Eye className="text-gray-400 hover:text-gray-600 transition-colors" />
                                )}
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-5 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:transform-none disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Creating account...
                                </div>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>
                </CardContent>
                
                <CardFooter className="text-center pt-4 pb-6">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <a 
                            href="/login" 
                            className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all"
                        >
                            Sign in here
                        </a>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}