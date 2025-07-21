import { Button } from '../components/ui/button';
import { Card, CardFooter, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { User, Clock, BookOpen, Shield, Download, BookText, Medal, MoveRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Index() {
  const navigate = useNavigate();
  const handleLoginClick = () => navigate('/login');
  const handleSignupClick = () => navigate('/signup');

  return (
    <div className="min-h-screen text-teal-900 font-sans bg-white">
      <nav className="p-6 flex justify-between items-center bg-teal-900 text-white shadow-lg">
        <h2 className="text-2xl font-bold tracking-wide">DBSL</h2>
        <ul className="flex space-x-4">
          <li>
            <Button onClick={handleLoginClick} className="bg-transparent hover:bg-white hover:text-teal-900 border border-white transition rounded-full px-4 py-2">
              Login
            </Button>
          </li>
          <li>
            <Button onClick={handleSignupClick} className="bg-green-500 hover:bg-teal-600 text-white transition rounded-full px-4 py-2">
              Get Started
            </Button>
          </li>
        </ul>
      </nav>

      <section className="p-10 bg-pink-50 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
          Digital Blueprint for Smart Learning
        </h1>
        <p className="mt-6 text-xl max-w-2xl mx-auto">
          Automate your classroom document creation with CBC-aligned, professional PDFs. Save time and focus on teaching.
        </p>
        <Button onClick={handleLoginClick} className="mt-8 bg-teal-700 hover:bg-teal-900 text-white px-6 py-4 text-lg rounded-xl shadow-lg inline-flex items-center gap-2">
          Start Creating Documents <MoveRight />
        </Button>
      </section>

      <section className="py-16 px-8 bg-white">
        <h2 className="text-4xl font-bold text-center">Why Teachers Choose DBSL</h2>
        <p className="text-center text-xl mt-4 max-w-xl mx-auto">
          Join thousands of educators who have revolutionized their document creation process.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {[{
            icon: BookText,
            title: "CBC-Aligned Documents",
            description: "Generate professional lesson plans, schemes of work, and assessments that perfectly align with CBC standards.",
            bg: "bg-teal-900 text-white"
          }, {
            icon: Clock,
            title: "Save 90% Time",
            description: "Automate document creation and focus on what matters most - teaching and inspiring your students.",
            bg: "bg-pink-50"
          }, {
            icon: Shield,
            title: "Professional Quality",
            description: "Clean, formatted PDFs ready for printing or sharing with colleagues and administrators.",
            bg: "bg-pink-50"
          }, {
            icon: Download,
            title: "Instant Downloads",
            description: "Generate and download your documents in seconds, not hours of manual work.",
            bg: "bg-pink-50"
          }].map(({ icon: Icon, title, description, bg }, i) => (
            <div key={i} className={`${bg} p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow text-center`}>
              <Icon className="mx-auto mb-4" size={40} />
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-8 bg-teal-900 text-white">
        <h2 className="text-4xl font-bold text-center mb-6">Generate Any Document Type</h2>
        <p className="text-center text-lg mb-10 max-w-xl mx-auto">
          All aligned with current CBC standards and ready for professional use
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[{
            icon: BookOpen,
            title: "Lesson Plans",
            desc: "Detailed, structured lesson plans"
          }, {
            icon: User,
            title: "Schemes of Work",
            desc: "Comprehensive term planning"
          }, {
            icon: BookText,
            title: "Lesson Notes",
            desc: "Organized teaching notes"
          }, {
            icon: Medal,
            title: "Exercises",
            desc: "Practice and assessments"
          }].map(({ icon: Icon, title, desc }, i) => (
            <Card key={i} className="bg-pink-100 text-teal-900 rounded-xl shadow-lg hover:shadow-xl transition">
              <CardHeader>
                <CardTitle>
                  <Icon className="inline-block mb-2" size={48} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h4 className="text-lg font-semibold text-center">{title}</h4>
              </CardContent>
              <CardFooter>
                <p className="text-center text-sm">{desc}</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <footer className="bg-pink-50 text-teal-900 text-center p-10">
        <h1 className="text-2xl font-bold">DBSL</h1>
        <p className="mt-2 text-sm">Digital Blueprint for Smart Learning - Empowering educators with automated document creation.</p>
      </footer>
    </div>
  );
}
