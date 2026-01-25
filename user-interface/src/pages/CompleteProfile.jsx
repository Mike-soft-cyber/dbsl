import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { School, Phone, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import API from '../api';

export default function CompleteProfile() {
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        schoolName: '',
        schoolCode: '',
        phone: '',
        role: 'Teacher'
    });
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        
        if (!token) {
            toast.error('Invalid access. Please try signing up again.');
            navigate('/signup');
            return;
        }

        // Decode token to get user info
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserInfo({
                email: payload.email,
                firstName: payload.firstName,
                lastName: payload.lastName,
                profilePic: payload.profilePic
            });
        } catch (error) {
            console.error('Error decoding token:', error);
            toast.error('Invalid signup link.');
            navigate('/signup');
        }
    }, [searchParams, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.schoolName || !formData.schoolCode) {
            toast.error('School name and school code are required');
            return;
        }

        const token = searchParams.get('token');
        if (!token) {
            toast.error('Session expired. Please try again.');
            return;
        }

        setLoading(true);

        try {
            const response = await API.post('/user/complete-google-profile', {
                token,
                ...formData
            });

            const { token: newToken, user } = response.data;

            // Save to localStorage
            localStorage.setItem('token', newToken);
            localStorage.setItem('teacherId', user._id);
            localStorage.setItem('userData', JSON.stringify(user));
            localStorage.setItem('schoolName', user.schoolName);

            toast.success('Profile completed successfully!');
            
            // Redirect to dashboard
            if (user.role === 'Admin') {
                navigate('/adminPages');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Profile completion error:', error);
            toast.error(error.response?.data?.message || 'Failed to complete profile.');
        } finally {
            setLoading(false);
        }
    };

    if (!userInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 w-full"></div>
                
                <CardHeader className="text-center pb-6">
                    <div className="flex flex-col items-center mb-4">
                        {userInfo.profilePic ? (
                            <img 
                                src={userInfo.profilePic} 
                                alt="Profile" 
                                className="w-20 h-20 rounded-full border-4 border-white shadow-lg mb-4"
                            />
                        ) : (
                            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                                <User className="text-white w-10 h-10" />
                            </div>
                        )}
                        <h3 className="text-xl font-semibold text-gray-800">
                            {userInfo.firstName} {userInfo.lastName}
                        </h3>
                        <p className="text-gray-600 text-sm flex items-center mt-1">
                            <Mail className="w-4 h-4 mr-1" />
                            {userInfo.email}
                        </p>
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Complete Your Profile
                    </CardTitle>
                    <p className="text-gray-600 text-sm mt-2">
                        We need a few more details to set up your account
                    </p>
                </CardHeader>
                
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* School Information */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-700 flex items-center">
                                <School className="w-4 h-4 mr-2" />
                                School Information
                            </h4>
                            
                            <div className="relative">
                                <School className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                <Input 
                                    name="schoolName"
                                    placeholder="School name"
                                    value={formData.schoolName}
                                    onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                                    className="pl-10 bg-white border border-gray-200 rounded-xl py-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <School className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                <Input 
                                    name="schoolCode"
                                    placeholder="School code"
                                    value={formData.schoolCode}
                                    onChange={(e) => setFormData({...formData, schoolCode: e.target.value})}
                                    className="pl-10 bg-white border border-gray-200 rounded-xl py-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-700 flex items-center">
                                <Phone className="w-4 h-4 mr-2" />
                                Contact Information
                            </h4>
                            
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                <Input 
                                    name="phone"
                                    placeholder="Phone number"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="pl-10 bg-white border border-gray-200 rounded-xl py-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Select your role</label>
                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'Teacher' })}
                                    className={`flex-1 ${formData.role === 'Teacher' 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Teacher
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'Admin' })}
                                    className={`flex-1 ${formData.role === 'Admin' 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Administrator
                                </Button>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Completing Profile...
                                </div>
                            ) : (
                                'Complete Setup & Continue'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}