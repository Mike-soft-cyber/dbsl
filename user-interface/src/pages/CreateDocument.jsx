import { React, useState, useEffect } from "react";
import { School, Users, Calendar, BookOpen, GraduationCap, Clock, FileText, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from "@/components/ui/dashboard/NavBar";
import API from "@/api";
import { toast } from "sonner";

export default function CreateDocument() {
  const location = useLocation();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('userData'));

  const [formData, setFormData] = useState({
    type: location.state?.type || '',
    term: "",
    learningArea: location.state?.learningArea || '',
    grade: location.state?.grade || '',
    stream: location.state?.stream || '',
    strand: "",
    substrand: "",
    school: "",
    teacher: "",
    weeks: "", // ✅ Will auto-populate
    lessonsPerWeek: "", // ✅ Will auto-populate
    lessonDuration: "", // ✅ NEW
    ageRange: "", // ✅ NEW
    time: "" // ✅ NEW: Add time field
  });

  const [cbcEntries, setCbcEntries] = useState([]);
  const [filteredLearningAreas, setFilteredLearningAreas] = useState([]);
  const [filteredStrands, setFilteredStrands] = useState([]);
  const [filteredSubstrands, setFilteredSubstrands] = useState([]);
  const [document, setDocument] = useState([]);
  const [teacher, setTeacher] = useState(null);
  const [term, setTerm] = useState([]);
  const [grade, setGrade] = useState([]);
  const [filteredStreams, setFilteredStreams] = useState([]);
  const [schoolName, setSchoolName] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ NEW: State for curriculum configuration
  const [levelConfig, setLevelConfig] = useState(null);
  const [subjectConfig, setSubjectConfig] = useState(null);
  const [autoCalculatedRows, setAutoCalculatedRows] = useState(0);

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Fetch document types
  useEffect(() => {
    API.get(`/documents/document`)
      .then((res) => setDocument(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Fetch teacher data
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const teacherId = localStorage.getItem('teacherId');
        if (!teacherId) return console.error("No teacherId found in localStorage");

        const res = await API.get(`/teacher/${teacherId}`);
        setTeacher(res.data);

        setFormData((prev) => ({
          ...prev,
          teacher: res.data._id,
        }));
      } catch (err) {
        console.error("Error fetching teacher:", err);
      }
    };
    fetchTeacher();
  }, []);

  // Fetch teacher school name
  useEffect(() => {
    const fetchTeacherSchool = async () => {
      try {
        const teacherId = localStorage.getItem('teacherId');
        if (!teacherId) return console.error("No teacherId found in localStorage");

        const res = await API.get(`/school/teacher/${teacherId}/schoolName`);
        setSchoolName(res.data.schoolName);

        setFormData((prev) => ({
          ...prev,
          school: res.data.schoolName,
        }));
      } catch (err) {
        console.error("Error fetching teacher school:", err);
      }
    };
    fetchTeacherSchool();
  }, []);

  // Fetch term options
  useEffect(() => {
    API.get(`/documents/terms`)
      .then((res) => setTerm(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Fetch grade options
  useEffect(() => {
    API.get(`/documents/grades`)
      .then((res) => setGrade(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    API.get('/cbc')
      .then((res) => setCbcEntries(res.data))
      .catch((err) => console.error(err));
  }, []);

  // fetch stream 
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const res = await API.get(`/documents/streams/${userData._id}`);
        setFilteredStreams(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStreams();
  }, []);

  // ✅ NEW: Fetch level configuration when grade changes
  useEffect(() => {
    const fetchLevelConfig = async () => {
      if (!formData.grade) return;

      try {
        const res = await API.get(`/curriculum-config/level/${formData.grade}`);
        setLevelConfig(res.data);
        
        // Auto-populate age range and lesson duration
        setFormData(prev => ({
          ...prev,
          ageRange: res.data.ageRange,
          lessonDuration: res.data.lessonDuration
        }));

        console.log('✅ Level config loaded:', res.data);
      } catch (err) {
        console.error('Error fetching level config:', err);
      }
    };

    fetchLevelConfig();
  }, [formData.grade]);

  // ✅ NEW: Fetch subject configuration when grade and subject change
  useEffect(() => {
    const fetchSubjectConfig = async () => {
      if (!formData.grade || !formData.learningArea) return;

      try {
        const res = await API.get(`/curriculum-config/subject-config/${formData.grade}/${formData.learningArea}`);
        setSubjectConfig(res.data);
        
        // Auto-populate lessons per week
        setFormData(prev => ({
          ...prev,
          lessonsPerWeek: res.data.lessonsPerWeek
        }));

        console.log('✅ Subject config loaded:', res.data);
      } catch (err) {
        console.warn('Subject config not found, using defaults');
        // Use defaults if not found
        setFormData(prev => ({
          ...prev,
          lessonsPerWeek: 5 // Default fallback
        }));
      }
    };

    fetchSubjectConfig();
  }, [formData.grade, formData.learningArea]);

  // ✅ NEW: Auto-calculate weeks based on term
  useEffect(() => {
    const fetchTermWeeks = async () => {
      if (!formData.term) return;

      try {
        const res = await API.get(`/curriculum-config/term-weeks/${formData.term}`);
        setFormData(prev => ({
          ...prev,
          weeks: res.data.weeks
        }));

        console.log(`✅ Term ${formData.term}: ${res.data.weeks} weeks`);
      } catch (err) {
        console.error('Error fetching term weeks:', err);
        // Fallback to manual calculation
        const termNumber = formData.term.replace('Term ', '');
        const weekMap = { '1': 10, '2': 11, '3': 6 };
        setFormData(prev => ({
          ...prev,
          weeks: weekMap[termNumber] || 10
        }));
      }
    };

    fetchTermWeeks();
  }, [formData.term]);

  // ✅ NEW: Calculate total rows when weeks and lessons per week are set
  useEffect(() => {
    if (formData.weeks && formData.lessonsPerWeek) {
      const totalRows = parseInt(formData.weeks) * parseInt(formData.lessonsPerWeek);
      setAutoCalculatedRows(totalRows);
      console.log(`📊 Total rows: ${formData.weeks} weeks × ${formData.lessonsPerWeek} lessons = ${totalRows} rows`);
    }
  }, [formData.weeks, formData.lessonsPerWeek]);

  useEffect(() => {
    if (formData.grade) {
      const learningAreas = [
        ...new Set(
          cbcEntries
            .filter(entry => entry.grade === formData.grade)
            .map(entry => entry.learningArea)
        ),
      ];
      setFilteredLearningAreas(learningAreas);
      handleChange("learningArea", "");
      handleChange("strand", "");
      handleChange("substrand", "");
    }
  }, [formData.grade, cbcEntries]);

  //fetching strands
  useEffect(() => {
    if (formData.grade && formData.learningArea) {
      const strands = [
        ...new Set(
          cbcEntries
            .filter(entry =>
              entry.grade === formData.grade &&
              entry.learningArea === formData.learningArea
            )
            .map(entry => entry.strand)
        ),
      ];
      setFilteredStrands(strands);
      handleChange("strand", "");
      handleChange("substrand", "");
    }
  }, [formData.learningArea, formData.grade, cbcEntries]);

  //fetching substrands from grade, strands and learning area
  useEffect(() => {
    if (formData.grade && formData.learningArea && formData.strand) {
      const matchingEntries = cbcEntries.filter(
        (entry) =>
          entry.grade === formData.grade &&
          entry.learningArea === formData.learningArea &&
          entry.strand === formData.strand
      );

      const substrands = [...new Set(matchingEntries.map(entry => entry.substrand))];

      setFilteredSubstrands(substrands);

      if (!substrands.includes(formData.substrand)) {
        setFormData((prev) => ({ ...prev, substrand: "" }));
      }
    }
  }, [formData.grade, formData.learningArea, formData.strand, cbcEntries]);

  useEffect(() => {
    if (location.state) {
      setFormData(prev => ({
        ...prev,
        grade: location.state.grade || '',
        stream: location.state.stream || '',
        learningArea: location.state.learningArea || '',
      }));
    }
  }, [location.state]);

  const handleSubmit = (e) => {
  e.preventDefault();
  setLoading(true);

  const requiredFields = [
    'type',
    'term',
    'learningArea',
    'grade',
    'stream',
    'strand',
    'substrand',
    'teacher',
    'school'
  ];

  for (let field of requiredFields) {
    if (!formData[field]) {
      toast.error(`Please select or fill the ${field}`);
      setLoading(false);
      return;
    }
  }

  console.log("📤 Form data being sent to checkout:", formData);

  navigate("/checkout", {
    state: {
      ...formData,
      teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : "",
      totalRows: autoCalculatedRows,
      // ✅ NEW: Pass data needed for breakdown detection
      teacherId: teacher?._id,
      canLinkDocuments: ['Schemes of Work', 'Lesson Plan', 'Lesson Notes'].includes(formData.type)
    },
  });
};

  const handleBack = () => {
    if (userData?.role === 'Admin') {
      navigate('/adminPages');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sticky Navbar */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <Navbar userData={userData} />
      </div>

      {/* Main Content with padding-top to account for sticky navbar */}
      <div className="p-4 md:p-8 pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={handleBack}
              className="bg-white text-gray-700 border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="bg-white p-6 rounded-2xl shadow-lg flex-1 border border-gray-100">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create Document
              </h1>
              <p className="text-gray-600 mt-2">
                Generate CBC-aligned educational documents with AI
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="p-6 md:p-8 w-full bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center gap-3">
                  <FileText className="text-blue-600 w-6 h-6" />
                  Document Generation Form
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* School and Teacher Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-semibold text-gray-700">School Name</Label>
                    <Input
                      readOnly
                      value={schoolName || ""}
                      className="bg-gray-50 border border-gray-200 rounded-xl py-5 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-gray-700">Teacher Name</Label>
                    <Input
                      readOnly
                      value={teacher ? `${teacher.firstName} ${teacher.lastName}` : ""}
                      className="bg-gray-50 border border-gray-200 rounded-xl py-5 font-medium"
                    />
                  </div>
                </div>

                {/* Term and Stream */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-semibold text-gray-700">Term</Label>
                    <Select
                      value={formData.term}
                      onValueChange={(value) => handleChange("term", value)}
                    >
                      <SelectTrigger className="w-full bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                        <SelectValue placeholder="Select Term" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                        {Array.isArray(term) && term.map((t) => (
                          <SelectItem key={t} value={t} className="py-3 hover:bg-blue-50 rounded-lg">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold text-gray-700">Stream (Roll)</Label>
                    <Select
                      value={formData.stream}
                      onValueChange={(value) => handleChange("stream", value)}
                    >
                      <SelectTrigger className="w-full bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                        <SelectValue placeholder="Select Stream" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                        {filteredStreams.map((s, idx) => (
                          <SelectItem key={idx} value={s} className="py-3 hover:bg-blue-50 rounded-lg">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Grade and Learning Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-semibold text-gray-700">Grade</Label>
                    <Select
                      value={formData.grade}
                      onValueChange={(value) => handleChange("grade", value)}
                    >
                      <SelectTrigger className="w-full bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                        {Array.isArray(grade) && grade.map((g) => (
                          <SelectItem key={g} value={g} className="py-3 hover:bg-blue-50 rounded-lg">
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold text-gray-700">Learning Area (Subject)</Label>
                    <Select
                      value={formData.learningArea}
                      onValueChange={(value) => handleChange("learningArea", value)}
                    >
                      <SelectTrigger className="w-full bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                        <SelectValue placeholder="Select Learning Area" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                        {filteredLearningAreas.map((la, idx) => (
                          <SelectItem key={idx} value={la} className="py-3 hover:bg-blue-50 rounded-lg">
                            {la}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Strand and Substrand */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-semibold text-gray-700">Strand</Label>
                    <Select
                      value={formData.strand}
                      onValueChange={(value) => handleChange("strand", value)}
                    >
                      <SelectTrigger className="w-full bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                        <SelectValue placeholder="Select Strand" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                        {filteredStrands.map((s, idx) => (
                          <SelectItem key={idx} value={s} className="py-3 hover:bg-blue-50 rounded-lg">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold text-gray-700">Substrand</Label>
                    <Select
                      value={formData.substrand}
                      onValueChange={(value) => handleChange("substrand", value)}
                    >
                      <SelectTrigger className="w-full bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                        <SelectValue placeholder="Select Substrand" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                        {filteredSubstrands.map((ss, index) => (
                          <SelectItem key={index} value={ss} className="py-3 hover:bg-blue-50 rounded-lg">
                            {ss}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ✅ NEW: Auto-calculated Configuration Info Display */}
                {(levelConfig || subjectConfig || formData.weeks) && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Curriculum Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {levelConfig && (
                        <>
                          <div>
                            <span className="text-gray-600 font-medium">Age Range:</span>
                            <span className="ml-2 text-gray-900 font-bold">{levelConfig.ageRange}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 font-medium">Lesson Duration:</span>
                            <span className="ml-2 text-gray-900 font-bold">{levelConfig.lessonDuration} minutes</span>
                          </div>
                        </>
                      )}
                      {formData.weeks && (
                        <div>
                          <span className="text-gray-600 font-medium">Weeks ({formData.term}):</span>
                          <span className="ml-2 text-gray-900 font-bold">{formData.weeks} weeks</span>
                        </div>
                      )}
                      {formData.lessonsPerWeek && (
                        <div>
                          <span className="text-gray-600 font-medium">Lessons/Week:</span>
                          <span className="ml-2 text-gray-900 font-bold">{formData.lessonsPerWeek} lessons</span>
                        </div>
                      )}
                      {autoCalculatedRows > 0 && (
                        <div className="md:col-span-2 mt-2 pt-4 border-t border-blue-200">
                          <span className="text-gray-600 font-medium">Total Lessons:</span>
                          <span className="ml-2 text-blue-600 font-bold text-lg">
                            {autoCalculatedRows} lessons
                          </span>
                          <span className="ml-2 text-gray-500 text-xs">
                            ({formData.weeks} weeks × {formData.lessonsPerWeek} lessons/week)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ✅ NEW: Time Field (Optional for Lesson Plans) */}
                {formData.type === 'Lesson Plan' && (
                  <div className="space-y-2">
                    <Label className="font-semibold text-gray-700">
                      Time (Optional)
                      <span className="text-gray-500 text-sm ml-2">e.g., 7:30 am - 8:10 am</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="7:30 am - 8:10 am"
                      value={formData.time}
                      onChange={(e) => handleChange("time", e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl py-5"
                    />
                  </div>
                )}

                {/* Document Type */}
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-700">Document Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange("type", value)}
                  >
                    <SelectTrigger className="w-full bg-white border border-gray-200 rounded-xl py-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                      {Array.isArray(document) && document.map((doc) => (
                        <SelectItem key={doc} value={doc} className="py-3 hover:bg-blue-50 rounded-lg">
                          {doc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-5 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:transform-none disabled:cursor-not-allowed mt-6"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Preparing...
                    </div>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Generate Document
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}