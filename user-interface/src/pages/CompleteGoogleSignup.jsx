import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { School, Phone, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import API from '../api';

export default function CompleteGoogleSignup() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    token: '',
    schoolName: '',
    schoolCode: '',
    role: 'Teacher',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setFormData(prev => ({ ...prev, token }));
      
      // Decode token to show user info
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
        toast.error('Invalid signup link. Please try signing up again.');
        navigate('/signup');
      }
    } else {
      toast.error('Missing signup token.');
      navigate('/signup');
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.schoolName || !formData.schoolCode) {
      toast.error('School name and code are required');
      return;
    }

    setLoading(true);

    try {
      const response = await API.post('/user/complete-google-signup', formData);
      const { token, user, message } = response.data;

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('teacherId', user._id);
      localStorage.setItem('userData', JSON.stringify(user));
      localStorage.setItem('schoolName', user.schoolName);

      toast.success(message || 'Signup completed successfully!');
      
      // Redirect based on role
      if (user.role === 'Admin') {
        navigate('/adminPages');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Complete signup error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete signup.');
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 w-full"></div>
        
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            {userInfo.profilePic ? (
              <img 
                src={userInfo.profilePic} 
                alt="Profile" 
                className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <BookOpen className="text-white w-8 h-8" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Complete Your Signup
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            Welcome, {userInfo.firstName} {userInfo.lastName}
          </p>
          <p className="text-gray-500 text-xs">{userInfo.email}</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* School Info */}
            <div className="relative">
              <School className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
              <Input 
                name="schoolName"
                placeholder="School name"
                value={formData.schoolName}
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
                value={formData.schoolCode}
                onChange={handleChange}
                className="pl-10 bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                required
              />
            </div>

            {/* Phone */}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
              <Input 
                name="phone"
                placeholder="Phone number (optional)"
                value={formData.phone}
                onChange={handleChange}
                className="pl-10 bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select your role</label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'Teacher' })}
                  className={`flex-1 ${formData.role === 'Teacher' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Teacher
                </Button>
                <Button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'Admin' })}
                  className={`flex-1 ${formData.role === 'Admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Administrator
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-5 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Completing Signup...
                </div>
              ) : (
                'Complete Signup'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}