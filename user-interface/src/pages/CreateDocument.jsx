import { React, useState, useEffect } from "react";
import { School, Users, Calendar, BookOpen, GraduationCap, Clock, FileText, MoveLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from "@/components/ui/dashboard/NavBar";
import API from "@/api";

export default function CreateDocument() {
  const location = useLocation();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('userData'));

  const [formData, setFormData] = useState({
    type: location.state?.type || '',
    term: "",
    learningArea: "",
    learningAreaName: "",
    grade: "",
    strand: "",
    strandName: "",
    substrands: "",
    substrandsName: "",
    school: "",
    teacher: "",
  });

  const [strandsOption, setStrandsOption] = useState([]);
  const [substrandsOption, setSubStrandsOption] = useState([]);
  const [document, setDocument] = useState([]);
  const [teacher, setTeacher] = useState(null);
  const [term, setTerm] = useState([]);
  const [learningArea, setLearningArea] = useState([]);
  const [grade, setGrade] = useState([]);
  const [schoolName, setSchoolName] = useState(null);
  const [loading, setLoading] = useState(false)

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

  // Fetch learning areas based on grade
  useEffect(() => {
    const fetchLearningAreas = async () => {
      try {
        const res = await API.get(`/learningareas/grade/${formData.grade}`);
        setLearningArea(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (formData.grade) fetchLearningAreas();
  }, [formData.grade]);

  // Fetch strands when grade and learning area are selected
  useEffect(() => {
    const fetchStrands = async () => {
      try {
        const res = await API.get(`/strands/${formData.grade}/${formData.learningArea}`);
        setStrandsOption(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (formData.grade && formData.learningArea) fetchStrands();
  }, [formData.grade, formData.learningArea]);

  // Fetch substrands when strand changes
  useEffect(() => {
    const fetchSubstrands = async () => {
      try {
        const res = await API.get(`/substrands/${formData.strand}`);
        setSubStrandsOption(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (formData.strand) fetchSubstrands();
  }, [formData.strand]);

  // Reset learning area, strand, and substrand when grade changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      learningArea: '',
      strand: '',
      substrands: ''
    }));
  }, [formData.grade]);

  // Reset strand and substrand when learning area changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      strand: '',
      substrands: ''
    }));
  }, [formData.learningArea]);

  const handleSubmit = (e) => {
  e.preventDefault();
  setLoading(true)

  const requiredFields = ['type', 'term', 'learningArea', 'grade', 'strand', 'substrands', 'teacher', 'school'];
  for (let field of requiredFields) {
    if (!formData[field]) {
      alert(`Please select or fill the ${field}`);
      return;
    }
  }
  navigate('/checkout', { state: formData });
};


  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="bg-teal-500 min-h-screen">
      <Navbar userData={userData} />

      <div className="flex flex-column gap-100 item-center">
        <Button onClick={handleBack} className="bg-pink-50 hover:bg-teal-600 hover:text-white m-3">
          <MoveLeft />
        </Button>
        <div className="flex-row">
          <h1 className="font-bold text-2xl">Create Document</h1>
          <p>Generate CBC-aligned educational documents</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mx-50 bg-pink-50 text-teal-900">
          <CardHeader>
            <CardTitle>
              <h1 className="flex flex-column gap-2 items-center text-2xl">
                <FileText /> Document Generation Form
              </h1>
            </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-column justify-between gap-3">
                <Input
                  type="text"
                  value={schoolName || ""}
                  readOnly
                  placeholder="School Name"
                />
                <Input
                  type="text"
                  value={teacher ? `${teacher.firstName} ${teacher.lastName}` : ""}
                  readOnly
                  placeholder="Teacher Name"
                />
              </div>

              <div className="flex flex-column gap-5 mt-5">
                {/* Term selection */}
                <label htmlFor="term" className="flex-row">Term
                  <Select
                  value= {formData.term}
                  onValueChange={(value) => handleChange("term", value)}
                  >
                    <SelectTrigger className="w-70">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent className="bg-pink-50">
                      {Array.isArray(term) && term.map((t) => (
                        <SelectItem key={t} value={t} className="hover:bg-teal-600 hover:text-white">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                {/* Grade selection */}
                <label htmlFor="grade" className="flex-row">Grade
                  <Select
                  value= {formData.grade}
                   onValueChange={(value) => handleChange("grade", value)}
                   >
                    <SelectTrigger className="w-70">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent className="bg-pink-50">
                      {Array.isArray(grade) && grade.map((g) => (
                        <SelectItem key={g} value={g} className="hover:bg-teal-600 hover:text-white">
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                {/* Learning Area selection */}
                <label htmlFor="learningArea" className="flex-row">Learning Area
                  <Select
                  value= {formData.learningArea}
                  onValueChange={(value) => {
                    handleChange("learningArea", value)
                    const selected = learningArea.find((l) => l._id === value);
                    if (selected) {
                      handleChange("learningAreaName", selected.name); // store name for UI
                      }
                  }}
                  >
                    <SelectTrigger className="w-70">
                      <SelectValue placeholder="Select Learning Area" />
                    </SelectTrigger>
                    <SelectContent className="bg-pink-50">
                      {Array.isArray(learningArea) && learningArea.map((l) => (
                        <SelectItem key={l._id} value={l._id} className="hover:bg-teal-600 hover:text-white">
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                </div>

                <div className="flex flex-column gap-5 mt-5">
                {/* Strands selection */}
                <label htmlFor="strands" className="flex-row gap-5">Strands
  <Select
    value={formData.strand}
    onValueChange={(value) => {
      handleChange("strand", value);
      const selected = strandsOption.find((s) => s._id === value);
      if (selected) handleChange("strandName", selected.strand); // use `.strand` not `.name`
    }}
  >
    <SelectTrigger className="w-100">
      <SelectValue placeholder="Select Strand" />
    </SelectTrigger>
    <SelectContent className="bg-pink-50">
      {Array.isArray(strandsOption) && strandsOption.map((s) => (
        <SelectItem
          key={s._id}
          value={s._id}
          className="hover:bg-teal-600 hover:text-white"
        >
          {s.strand}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</label>


                {/* Substrands selection */}
                <label htmlFor="substrands" className="flex-row gap-5">Substrands
  <Select
    value={formData.substrands}
    onValueChange={(value) => {
      handleChange("substrands", value);
      const selected = substrandsOption.find((ss) => ss._id === value);
      if (selected) handleChange("substrandsName", selected.name);
    }}
  >
    <SelectTrigger className="w-100">
      <SelectValue placeholder="Select Substrand" />
    </SelectTrigger>
    <SelectContent className="bg-pink-50">
      {Array.isArray(substrandsOption) && substrandsOption.map((sub) => (
        <SelectItem
          key={sub._id}
          value={sub._id}
          className="hover:bg-teal-600 hover:text-white"
        >
          {sub.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</label>

                </div>

              {/* Document type selection */}
              <div className="mt-5">
                <label htmlFor="document">Document Type</label>
                <Select
                  onValueChange={(value) => handleChange("type", value)}
                  value={formData.type}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent className="bg-pink-50">
                    {Array.isArray(document) && document.map((doc) => (
                      <SelectItem key={doc} value={doc} className="hover:bg-teal-600 hover:text-white">
                        {doc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading} className="w-full mt-10 bg-teal-600 text-white cursor-pointer hover:bg-teal-800">
                <FileText /> {loading ? "Generating..." : "Generate Document"}
              </Button>
            </CardContent>
        </Card>
      </form>
    </div>
  );
}
