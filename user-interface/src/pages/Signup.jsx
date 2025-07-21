import { useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Toaster, toast } from "sonner";
import { Card, CardFooter, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { User, Lock, Mail, Phone, School, Eye, EyeOff } from 'lucide-react';
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
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

  const handleSubmit = async (e) => {
    setLoading(true)
  e.preventDefault();

  console.log("Sending signup payload:", formData);

  try {
    const res = await API.post('/user/register', formData);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('teacherId', res.data.user._id)
    localStorage.setItem('userData', JSON.stringify(res.data.user))
    localStorage.setItem('schoolId', user.schoolId);
    toast.success("Signup Successful")
    navigate('/dashboard');
  } catch (err) {
    console.error("Signup error:", err.response ? err.response.data : err.message);
    toast.error("SIgnup Failed: ", err.response ? err.response.data : err.message)
    setLoading(false)
  }
};

    const togglePasword = () => {
        setFormData((prev) => ({
            ...prev,
            password: prev.password ? '' : prev.password,
        }));
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-teal-900">
            <Toaster richColors position="top-center" />
              <Card className="w-96 bg-white shadow-lg ">
            <CardHeader>
                <CardTitle className="text-center">Signup</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <Input
                            name="firstName"
                            placeholder="First Name"
                            onChange={handleChange}
                            className="pl-10 bg-gray-50 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <Input
                            name="lastName"
                            placeholder="Last Name"
                            onChange={handleChange}
                            className="pl-10 bg-gray-50 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <Input
                            name="phone"
                            placeholder="Phone"
                            onChange={handleChange}
                            className="pl-10 bg-gray-50 border border-gray-300 rounded-md"
                        />
                    </div>
                    <Select onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger className="w-full cursor-pointer bg-gray-50 border border-gray-300 rounded-md">
                            <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent className={"bg-white"}>
                            <SelectItem value="Director" className={"hover:bg-teal-500 hover:text-white"}>Director</SelectItem>
                            <SelectItem value="Principal" className={"hover:bg-teal-500 hover:text-white"}>Principal</SelectItem>
                            <SelectItem value="Deputy Principal" className={"hover:bg-teal-500 hover:text-white"}>Deputy Principal</SelectItem>
                            <SelectItem value="Dean of Studies" className={"hover:bg-teal-500 hover:text-white"}>Dean of Studies</SelectItem>
                            <SelectItem value="Teacher" className={"hover:bg-teal-500 hover:text-white"}>Teacher</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="relative">
                        <School className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <Input
                            name="schoolName"
                            placeholder="School Name"
                            onChange={handleChange}
                            className="pl-10 bg-gray-50 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="relative">
                        <School className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <Input
                            name="schoolCode"
                            placeholder="School Code"
                            onChange={handleChange}
                            className="pl-10 bg-gray-50 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <Input
                            name="email"
                            placeholder="Email"
                            onChange={handleChange}
                            className="pl-10 bg-gray-50 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <Input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Set Password"
                            onChange={handleChange}
                            className="pl-10 bg-gray-50 border border-gray-300 rounded-md"
                        />
                        {showPassword ? (
                            <Eye className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer" onClick={() => setShowPassword(false)} />
                        ) : (
                            <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer" onClick={() => setShowPassword(true)} />
                        )}
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <Input
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            onChange={handleChange}
                            className="pl-10 bg-gray-50 border border-gray-300 rounded-md"
                        />
                        {showConfirmPassword ? (
                            <Eye className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer" onClick={() => setShowConfirmPassword(false)} />
                        ) : (
                            <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer" onClick={() => setShowConfirmPassword(true)} />
                        )}
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-teal-600 text-white hover:bg-teal-700 cursor-pointer">
                        {loading ? 'Signing up ...' : 'Signup'}
                        </Button>
                </form>
            </CardContent>
            <CardFooter className="text-center">
                <p>Already have an account? <a href="/login" className={"text-teal-600 hover:text-teal-700 font-bold"}>Login</a></p>
            </CardFooter>
        </Card>
        </div>
    );
}