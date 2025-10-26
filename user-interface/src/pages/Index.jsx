import { Button } from '../components/ui/button';
import { Card, CardFooter, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { User, Clock, BookOpen, Shield, Download, BookText, Medal, MoveRight, Star, Award, Lightbulb, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Index() {
  const navigate = useNavigate();
  const handleLoginClick = () => navigate('/login');
  const handleSignupClick = () => navigate('/signup');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans">
      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <BookOpen className="text-white w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            DBSL
          </h2>
        </div>
        <ul className="flex space-x-4">
          <li>
            <Button 
              onClick={handleLoginClick} 
              className="bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300 transition-all duration-300 rounded-xl px-6 py-2 hover:shadow-md"
            >
              Login
            </Button>
          </li>
          <li>
            <Button 
              onClick={handleSignupClick} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 rounded-xl px-6 py-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Get Started
            </Button>
          </li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-purple-200/30 rounded-full blur-xl"></div>
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Digital Blueprint
            </span>
            <br />
            <span className="text-gray-800">for Smart Learning</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Transform your teaching experience with AI-powered document creation. 
            Generate CBC-aligned, professional resources in seconds, not hours.
          </p>
          <Button 
            onClick={handleLoginClick} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 inline-flex items-center gap-3"
          >
            Start Creating Now
            <MoveRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Educators Love DBSL</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of teachers who have revolutionized their workflow with our intelligent platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[{
              icon: BookText,
              title: "CBC-Aligned Content",
              description: "Perfectly aligned with Kenyan curriculum standards",
              color: "from-blue-500 to-blue-600"
            }, {
              icon: Clock,
              title: "90% Time Saved",
              description: "Focus on teaching instead of paperwork",
              color: "from-purple-500 to-purple-600"
            }, {
              icon: Award,
              title: "Professional Quality",
              description: "Print-ready documents that impress",
              color: "from-green-500 to-green-600"
            }, {
              icon: Download,
              title: "Instant Access",
              description: "Generate and download in seconds",
              color: "from-orange-500 to-orange-600"
            }].map(({ icon: Icon, title, description, color }, i) => (
              <div key={i} className="group text-center p-8 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-transparent">
                <div className={`w-16 h-16 bg-gradient-to-r ${color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="text-white w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Document Types Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Comprehensive Document Solutions</h2>
            <p className="text-xl text-gray-600">Everything you need for effective lesson planning and delivery</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[{
              icon: BookOpen,
              title: "Lesson Plans",
              desc: "Detailed, structured teaching guides",
              color: "bg-gradient-to-br from-blue-500 to-blue-600"
            }, {
              icon: User,
              title: "Schemes of Work",
              desc: "Term-long planning made easy",
              color: "bg-gradient-to-br from-purple-500 to-purple-600"
            }, {
              icon: FileText,
              title: "Lesson Notes",
              desc: "Organized teaching materials",
              color: "bg-gradient-to-br from-green-500 to-green-600"
            }, {
              icon: Medal,
              title: "Assessments",
              desc: "Engaging exercises and tests",
              color: "bg-gradient-to-br from-orange-500 to-orange-600"
            }].map(({ icon: Icon, title, desc, color }, i) => (
              <Card key={i} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 group overflow-hidden">
                <div className={`${color} h-2 w-full`}></div>
                <CardHeader className="text-center pb-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="text-gray-700 w-7 h-7" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-800">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center text-sm">{desc}</p>
                </CardContent>
                <CardFooter className="justify-center pt-4">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial/CTA Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Star className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Join 5,000+ Educators Already Using DBSL
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            "This platform has transformed how I prepare for classes. I get back hours each week to focus on what really matters - my students."
          </p>
          <Button 
            onClick={handleSignupClick}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-5 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">DBSL</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Digital Blueprint for Smart Learning - Empowering educators with intelligent document creation
          </p>
          <p className="text-gray-500 text-sm">
            © 2024 DBSL. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}