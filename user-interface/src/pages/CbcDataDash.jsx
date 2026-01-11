import React, { useEffect, useState } from "react";
import API from "@/api";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Trash2, SquarePen, Save, Plus, Minus, BookOpen, Search, X, Clock, Users, Target, Heart, Globe, Link, Users2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const gradeOptions = [
  "PG",
  "PP 1",
  "PP 2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
];

export default function CbcDataDash() {
  const [cbcData, setCbcData] = useState([]);
  const [grade, setGrade] = useState("");
  const [learningArea, setLearningArea] = useState("");
  const [strand, setStrand] = useState("");
  const [substrand, setSubstrand] = useState("");
  const [noOfLessons, setNoOfLessons] = useState("");
  
  // Curriculum config fields
  const [ageRange, setAgeRange] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");
  const [lessonsPerWeek, setLessonsPerWeek] = useState("");
  
  // Core curriculum fields
  const [slo, setSlo] = useState([""]);
  const [learningExperiences, setLearningExperiences] = useState([""]);
  const [keyInquiryQuestions, setKeyInquiryQuestions] = useState([""]);
  const [resources, setResources] = useState([""]);
  const [assessment, setAssessment] = useState([{ skill: "", exceeds: "", meets: "", approaches: "", below: "" }]);
  
  // ✅ UPDATED: KICD curriculum fields as arrays
  const [coreCompetencies, setCoreCompetencies] = useState([""]);
  const [values, setValues] = useState([""]);
  const [pertinentIssues, setPertinentIssues] = useState([""]);
  const [linkToOtherSubjects, setLinkToOtherSubjects] = useState([""]);
  const [communityLinkActivities, setCommunityLinkActivities] = useState([""]);
  
  // UI states
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterLearningArea, setFilterLearningArea] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Config states
  const [levelConfig, setLevelConfig] = useState(null);
  const [subjectConfig, setSubjectConfig] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await API.get("/cbc");
      setCbcData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setCbcData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch level configuration when grade changes
  useEffect(() => {
    const fetchLevelConfig = async () => {
      if (!grade) return;

      try {
        const res = await API.get(`/curriculum-config/level/${grade}`);
        setLevelConfig(res.data);
        setAgeRange(res.data.ageRange);
        setLessonDuration(res.data.lessonDuration);
        console.log('✅ Level config loaded:', res.data);
      } catch (err) {
        console.error('Error fetching level config:', err);
        setAgeRange("");
        setLessonDuration("");
      }
    };

    fetchLevelConfig();
  }, [grade]);

  // Fetch subject configuration when grade and subject change
  useEffect(() => {
    const fetchSubjectConfig = async () => {
      if (!grade || !learningArea) return;

      try {
        const res = await API.get(`/curriculum-config/subject-config/${grade}/${learningArea}`);
        setSubjectConfig(res.data);
        setLessonsPerWeek(res.data.lessonsPerWeek);
        console.log('✅ Subject config loaded:', res.data);
      } catch (err) {
        console.warn('Subject config not found, using manual input');
        setLessonsPerWeek("");
      }
    };

    fetchSubjectConfig();
  }, [grade, learningArea]);

  const addItem = (setter, currentItems, template = "") => {
    setter([...currentItems, template]);
  };

  const removeItem = (setter, currentItems, index) => {
    if (currentItems.length === 1) return;
    const newItems = currentItems.filter((_, i) => i !== index);
    setter(newItems);
  };

  const updateItem = (setter, currentItems, index, value) => {
    const newItems = [...currentItems];
    newItems[index] = value;
    setter(newItems);
  };

  const addAssessment = () => {
    setAssessment([...assessment, { skill: "", exceeds: "", meets: "", approaches: "", below: "" }]);
  };

  const removeAssessment = (index) => {
    if (assessment.length === 1) return;
    const newAssessment = assessment.filter((_, i) => i !== index);
    setAssessment(newAssessment);
  };

  const updateAssessment = (index, field, value) => {
    const newAssessment = [...assessment];
    newAssessment[index][field] = value;
    setAssessment(newAssessment);
  };

  const handleSubmit = async () => {
  if (!grade || !learningArea || !strand || !substrand) return;
  
  const payload = {
    grade,
    learningArea,
    strand,
    substrand,
    noOfLessons: noOfLessons || null,
    ageRange: ageRange || undefined,
    lessonDuration: lessonDuration ? parseInt(lessonDuration) : null,
    lessonsPerWeek: lessonsPerWeek ? parseInt(lessonsPerWeek) : null,
    slo: slo.filter(item => item.trim() !== ""),
    learningExperiences: learningExperiences.filter(item => item.trim() !== ""),
    keyInquiryQuestions: keyInquiryQuestions.filter(item => item.trim() !== ""),
    resources: resources.filter(item => item.trim() !== ""),
    assessment: assessment.filter(item => item.skill.trim() !== ""),
    coreCompetencies: coreCompetencies.filter(item => item.trim() !== ""),
    values: values.filter(item => item.trim() !== ""),
    pertinentIssues: pertinentIssues.filter(item => item.trim() !== ""),
    linkToOtherSubjects: linkToOtherSubjects.filter(item => item.trim() !== ""),
    communityLinkActivities: communityLinkActivities.filter(item => item.trim() !== "")
  };
  
  // 🔍 Debug logging
  console.log('🚀 FRONTEND: Sending payload:', payload);
  console.log('📊 Age Range:', ageRange);
  console.log('📊 Lesson Duration:', lessonDuration);
  console.log('📊 Lessons/Week:', lessonsPerWeek);
  console.log('📊 Core Competencies:', coreCompetencies);
  console.log('📊 Values:', values);
  
  try {
    const response = await API.post("/cbc", payload);
    console.log('✅ FRONTEND: Server response:', response.data);
    fetchData();
    resetForm();
  } catch (err) {
    console.error("❌ FRONTEND: Submit error:", err);
    console.error("❌ Error response:", err.response?.data);
  }
};

  const resetForm = () => {
    setGrade("");
    setLearningArea("");
    setStrand("");
    setSubstrand("");
    setNoOfLessons("");
    setAgeRange("");
    setLessonDuration("");
    setLessonsPerWeek("");
    setSlo([""]);
    setLearningExperiences([""]);
    setKeyInquiryQuestions([""]);
    setResources([""]);
    setAssessment([{ skill: "", exceeds: "", meets: "", approaches: "", below: "" }]);
    setCoreCompetencies([""]);
    setValues([""]);
    setPertinentIssues([""]);
    setLinkToOtherSubjects([""]);
    setCommunityLinkActivities([""]);
    setIsDialogOpen(false);
  };

  const handleEditClick = (entry) => {
    setEditingRow(entry._id);
    setEditedRow({ 
      ...entry,
      noOfLessons: entry.noOfLessons || "",
      ageRange: entry.ageRange || "",
      lessonDuration: entry.lessonDuration || "",
      lessonsPerWeek: entry.lessonsPerWeek || "",
      slo: entry.slo || [""],
      learningExperiences: entry.learningExperiences || [""],
      keyInquiryQuestions: entry.keyInquiryQuestions || [""],
      resources: entry.resources || [""],
      assessment: entry.assessment || [{ skill: "", exceeds: "", meets: "", approaches: "", below: "" }],
      coreCompetencies: entry.coreCompetencies || [""],
      values: entry.values || [""],
      pertinentIssues: entry.pertinentIssues || [""],
      linkToOtherSubjects: entry.linkToOtherSubjects || [""],
      communityLinkActivities: entry.communityLinkActivities || [""]
    });
  };

  const handleFieldChange = (field, value) => {
    setEditedRow((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayFieldChange = (field, index, value) => {
    const newArray = [...editedRow[field]];
    newArray[index] = value;
    setEditedRow(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const handleAddArrayItem = (field) => {
    setEditedRow(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const handleRemoveArrayItem = (field, index) => {
    if (editedRow[field].length === 1) return;
    const newArray = editedRow[field].filter((_, i) => i !== index);
    setEditedRow(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const handleAssessmentChange = (index, field, value) => {
    const newAssessment = [...editedRow.assessment];
    newAssessment[index][field] = value;
    setEditedRow(prev => ({
      ...prev,
      assessment: newAssessment
    }));
  };

  const handleAddAssessment = () => {
    setEditedRow(prev => ({
      ...prev,
      assessment: [...prev.assessment, { skill: "", exceeds: "", meets: "", approaches: "", below: "" }]
    }));
  };

  const handleRemoveAssessment = (index) => {
    if (editedRow.assessment.length === 1) return;
    const newAssessment = editedRow.assessment.filter((_, i) => i !== index);
    setEditedRow(prev => ({
      ...prev,
      assessment: newAssessment
    }));
  };

  const handleSave = async () => {
    try {
      const payload = { ...editedRow };

      if (payload.noOfLessons === "") {
        payload.noOfLessons = null; 
      }

      if (payload.lessonDuration === "") {
        payload.lessonDuration = null;
      } else if (payload.lessonDuration) {
        payload.lessonDuration = parseInt(payload.lessonDuration);
      }

      if (payload.lessonsPerWeek === "") {
        payload.lessonsPerWeek = null;
      } else if (payload.lessonsPerWeek) {
        payload.lessonsPerWeek = parseInt(payload.lessonsPerWeek);
      }

      ["slo", "learningExperiences", "keyInquiryQuestions", "resources", "assessment", "coreCompetencies", "values", "pertinentIssues", "linkToOtherSubjects", "communityLinkActivities"].forEach(
        key => {
          if (payload[key] && !Array.isArray(payload[key])) {
            payload[key] = [payload[key]];
          }
        }
      );

      const res = await API.put(`/cbc/${editingRow}`, payload);
      console.log("Updated CBC entry:", res.data);

      setCbcData(prev =>
        prev.map(item =>
          item._id === editingRow ? res.data : item
        )
      );

      setEditingRow(null);
    } catch (error) {
      console.error("❌ Error saving CBC entry:", error.response?.data || error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/cbc/${id}`);
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filteredData = cbcData.filter((entry) => {
    return (
      (filterGrade === "all" || !filterGrade || entry.grade === filterGrade) &&
      (!filterLearningArea || entry.learningArea.toLowerCase().includes(filterLearningArea.toLowerCase()))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📚 CBC Data Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage Competency-Based Curriculum data for all grades and subjects</p>
        </div>

        <Card className="bg-white rounded-2xl shadow-xl overflow-hidden border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <CardTitle className="text-2xl font-bold text-white">CBC Entries</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-white text-blue-600 hover:bg-blue-50 border-0 font-semibold px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200">
                    <Plus className="h-5 w-5" /> Add New Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-5xl bg-white rounded-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="border-b border-gray-100 pb-4">
                    <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <Plus className="h-6 w-6 text-blue-600" />
                      Add New CBC Entry
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 text-base">
                      Fill in all the required fields to create a new CBC curriculum entry aligned with KICD standards.
                    </DialogDescription>
                    <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                      <X className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                    </DialogClose>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Grade Level *</Label>
                        <Select value={grade} onValueChange={setGrade}>
                          <SelectTrigger className="w-full h-11 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white">
                            <SelectValue placeholder="Select Grade" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border-0 shadow-lg bg-white">
                            {gradeOptions.map((g) => (
                              <SelectItem key={g} value={g} className="rounded-md hover:bg-blue-50">
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Learning Area *</Label>
                        <Input
                          placeholder="e.g., Mathematics, English"
                          value={learningArea}
                          onChange={(e) => setLearningArea(e.target.value)}
                          className="h-11 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Auto-populated curriculum config display */}
                    {(levelConfig || subjectConfig) && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Auto-Detected Curriculum Configuration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          {levelConfig && (
                            <>
                              <div>
                                <span className="text-gray-600">Age Range:</span>
                                <span className="ml-2 text-gray-900 font-bold">{levelConfig.ageRange}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Lesson Duration:</span>
                                <span className="ml-2 text-gray-900 font-bold">{levelConfig.lessonDuration} min</span>
                              </div>
                            </>
                          )}
                          {subjectConfig && (
                            <div>
                              <span className="text-gray-600">Lessons/Week:</span>
                              <span className="ml-2 text-gray-900 font-bold">{subjectConfig.lessonsPerWeek}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Strand *</Label>
                        <Input
                          placeholder="e.g., Numbers, Reading"
                          value={strand}
                          onChange={(e) => setStrand(e.target.value)}
                          className="h-11 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Substrand *</Label>
                        <Input
                          placeholder="e.g., Addition, Comprehension"
                          value={substrand}
                          onChange={(e) => setSubstrand(e.target.value)}
                          className="h-11 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Curriculum Configuration Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Age Range
                        </Label>
                        <Input
                          placeholder="e.g., 12-14 years"
                          value={ageRange}
                          onChange={(e) => setAgeRange(e.target.value)}
                          className="h-11 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                          disabled={levelConfig}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Lesson Duration (min)
                        </Label>
                        <Input
                          type="number"
                          placeholder="e.g., 40"
                          value={lessonDuration}
                          onChange={(e) => setLessonDuration(e.target.value)}
                          className="h-11 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                          disabled={levelConfig}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Lessons/Week</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 5"
                          value={lessonsPerWeek}
                          onChange={(e) => setLessonsPerWeek(e.target.value)}
                          className="h-11 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                          disabled={subjectConfig}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Number of Lessons</Label>
                        <Input
                          type="number"
                          placeholder="Optional"
                          value={noOfLessons}
                          onChange={(e) => setNoOfLessons(e.target.value)}
                          className="h-11 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* ✅ UPDATED: KICD Curriculum Integration Section with Inputs */}
                    <div className="space-y-6 pt-6 border-t border-gray-100">
                      <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5 text-green-600" />
                        KICD Curriculum Integration
                      </h3>

                      {/* Core Competencies */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-600" />
                            Core Competencies
                          </Label>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addItem(setCoreCompetencies, coreCompetencies)}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full"
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                        
                        {coreCompetencies.map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Input
                              placeholder="e.g., Communication and collaboration"
                              value={item}
                              onChange={(e) => updateItem(setCoreCompetencies, coreCompetencies, index, e.target.value)}
                              className="flex-1 border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                            />
                            {coreCompetencies.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeItem(setCoreCompetencies, coreCompetencies, index)}
                                className="border-red-200 text-red-600 hover:bg-red-50 rounded-full h-10 w-10"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Values */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-600" />
                            Values
                          </Label>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addItem(setValues, values)}
                            className="border-red-200 text-red-600 hover:bg-red-50 rounded-full"
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                        
                        {values.map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Input
                              placeholder="e.g., Respect, Unity"
                              value={item}
                              onChange={(e) => updateItem(setValues, values, index, e.target.value)}
                              className="flex-1 border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                            />
                            {values.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeItem(setValues, values, index)}
                                className="border-red-200 text-red-600 hover:bg-red-50 rounded-full h-10 w-10"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Pertinent and Contemporary Issues */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Globe className="h-4 w-4 text-purple-600" />
                            Pertinent and Contemporary Issues
                          </Label>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addItem(setPertinentIssues, pertinentIssues)}
                            className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-full"
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                        
                        {pertinentIssues.map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Input
                              placeholder="e.g., Financial literacy, Self-esteem"
                              value={item}
                              onChange={(e) => updateItem(setPertinentIssues, pertinentIssues, index, e.target.value)}
                              className="flex-1 border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                            />
                            {pertinentIssues.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeItem(setPertinentIssues, pertinentIssues, index)}
                                className="border-red-200 text-red-600 hover:bg-red-50 rounded-full h-10 w-10"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Specific Learning Outcomes */}
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-700">SLO</Badge>
                          Specific Learning Outcomes
                        </h3>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addItem(setSlo, slo)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                      
                      {slo.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Input
                            placeholder={`SLO #${index + 1}`}
                            value={item}
                            onChange={(e) => updateItem(setSlo, slo, index, e.target.value)}
                            className="flex-1 border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                          />
                          {slo.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeItem(setSlo, slo, index)}
                              className="border-red-200 text-red-600 hover:bg-red-50 rounded-full h-10 w-10"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Learning Experiences */}
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-700">LE</Badge>
                          Learning Experiences
                        </h3>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addItem(setLearningExperiences, learningExperiences)}
                          className="border-green-200 text-green-600 hover:bg-green-50 rounded-full"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                      
                      {learningExperiences.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Input
                            placeholder={`Learning experience #${index + 1}`}
                            value={item}
                            onChange={(e) => updateItem(setLearningExperiences, learningExperiences, index, e.target.value)}
                            className="flex-1 border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                          />
                          {learningExperiences.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeItem(setLearningExperiences, learningExperiences, index)}
                              className="border-red-200 text-red-600 hover:bg-red-50 rounded-full h-10 w-10"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Key Inquiry Questions */}
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                          <Badge className="bg-purple-100 text-purple-700">KIQ</Badge>
                          Key Inquiry Questions
                        </h3>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addItem(setKeyInquiryQuestions, keyInquiryQuestions)}
                          className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-full"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                      
                      {keyInquiryQuestions.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Input
                            placeholder={`Key inquiry question #${index + 1}`}
                            value={item}
                            onChange={(e) => updateItem(setKeyInquiryQuestions, keyInquiryQuestions, index, e.target.value)}
                            className="flex-1 border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                          />
                          {keyInquiryQuestions.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeItem(setKeyInquiryQuestions, keyInquiryQuestions, index)}
                              className="border-red-200 text-red-600 hover:bg-red-50 rounded-full h-10 w-10"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Resources */}
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                          <Badge className="bg-yellow-100 text-yellow-700">RES</Badge>
                          Learning Resources
                        </h3>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addItem(setResources, resources)}
                          className="border-yellow-200 text-yellow-600 hover:bg-yellow-50 rounded-full"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                      
                      {resources.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Input
                            placeholder={`Resource #${index + 1}`}
                            value={item}
                            onChange={(e) => updateItem(setResources, resources, index, e.target.value)}
                            className="flex-1 border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                          />
                          {resources.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeItem(setResources, resources, index)}
                              className="border-red-200 text-red-600 hover:bg-red-50 rounded-full h-10 w-10"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Links to Other Subjects */}
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                          <Link className="h-5 w-5 text-teal-600" />
                          Links to Other Subjects
                        </h3>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addItem(setLinkToOtherSubjects, linkToOtherSubjects)}
                          className="border-teal-200 text-teal-600 hover:bg-teal-50 rounded-full"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                      
                      {linkToOtherSubjects.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Input
                            placeholder={`Link to other subject #${index + 1}`}
                            value={item}
                            onChange={(e) => updateItem(setLinkToOtherSubjects, linkToOtherSubjects, index, e.target.value)}
                            className="flex-1 border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                          />
                          {linkToOtherSubjects.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeItem(setLinkToOtherSubjects, linkToOtherSubjects, index)}
                              className="border-red-200 text-red-600 hover:bg-red-50 rounded-full h-10 w-10"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Community Link Activities */}
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                          <Users2 className="h-5 w-5 text-orange-600" />
                          Community Link Activities
                        </h3>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addItem(setCommunityLinkActivities, communityLinkActivities)}
                          className="border-orange-200 text-orange-600 hover:bg-orange-50 rounded-full"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                      
                      {communityLinkActivities.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Input
                            placeholder={`Community activity #${index + 1}`}
                            value={item}
                            onChange={(e) => updateItem(setCommunityLinkActivities, communityLinkActivities, index, e.target.value)}
                            className="flex-1 border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                          />
                          {communityLinkActivities.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeItem(setCommunityLinkActivities, communityLinkActivities, index)}
                              className="border-red-200 text-red-600 hover:bg-red-50 rounded-full h-10 w-10"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Assessment */}
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                          <Badge className="bg-orange-100 text-orange-700">AS</Badge>
                          Assessment Rubrics
                        </h3>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={addAssessment}
                          className="border-orange-200 text-orange-600 hover:bg-orange-50 rounded-full"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                      
                      {assessment.map((item, index) => (
                        <div key={index} className="space-y-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-700">Assessment #{index + 1}</h4>
                            {assessment.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeAssessment(index)}
                                className="border-red-200 text-red-600 hover:bg-red-50 rounded-full"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <Input
                            placeholder="Skill being assessed"
                            value={item.skill}
                            onChange={(e) => updateAssessment(index, 'skill', e.target.value)}
                            className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                              placeholder="Exceeds expectations"
                              value={item.exceeds}
                              onChange={(e) => updateAssessment(index, 'exceeds', e.target.value)}
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                            />
                            <Input
                              placeholder="Meets expectations"
                              value={item.meets}
                              onChange={(e) => updateAssessment(index, 'meets', e.target.value)}
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                            />
                            <Input
                              placeholder="Approaches expectations"
                              value={item.approaches}
                              onChange={(e) => updateAssessment(index, 'approaches', e.target.value)}
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                            />
                            <Input
                              placeholder="Below expectations"
                              value={item.below}
                              onChange={(e) => updateAssessment(index, 'below', e.target.value)}
                              className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <DialogFooter className="border-t border-gray-100 pt-6">
                    <DialogClose asChild>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg px-6"
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={!grade || !learningArea || !strand || !substrand}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg px-8 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      Save Entry
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Filter by Grade</Label>
                <Select value={filterGrade} onValueChange={setFilterGrade}>
                  <SelectTrigger className="w-full h-11 border-gray-300 rounded-lg bg-white">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-0 shadow-lg bg-white">
                    <SelectItem value="all" className="rounded-md hover:bg-blue-50">All Grades</SelectItem>
                    {gradeOptions.map((g) => (
                      <SelectItem key={g} value={g} className="rounded-md hover:bg-blue-50">
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Filter by Learning Area</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search learning areas..."
                    value={filterLearningArea}
                    onChange={(e) => setFilterLearningArea(e.target.value)}
                    className="pl-10 h-11 border-gray-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading CBC data...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>No CBC entries found</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="font-semibold text-gray-700">Grade</TableHead>
                      <TableHead className="font-semibold text-gray-700">Learning Area</TableHead>
                      <TableHead className="font-semibold text-gray-700">Strand</TableHead>
                      <TableHead className="font-semibold text-gray-700">Substrand</TableHead>
                      <TableHead className="font-semibold text-gray-700">Age Range</TableHead>
                      <TableHead className="font-semibold text-gray-700">Duration</TableHead>
                      <TableHead className="font-semibold text-gray-700">Lessons/Week</TableHead>
                      <TableHead className="font-semibold text-gray-700">Total Lessons</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((entry) => (
                      <TableRow key={entry._id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                        {editingRow === entry._id ? (
                          <>
                            <TableCell>
                              <Select 
                                value={editedRow.grade} 
                                onValueChange={v => handleFieldChange('grade', v)}
                              >
                                <SelectTrigger className="w-full h-9 border-gray-300 rounded-md bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg bg-white">
                                  {gradeOptions.map((g) => (
                                    <SelectItem key={g} value={g}>
                                      {g}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editedRow.learningArea}
                                onChange={e => handleFieldChange('learningArea', e.target.value)}
                                className="h-9 border-gray-300 rounded-md"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editedRow.strand}
                                onChange={e => handleFieldChange('strand', e.target.value)}
                                className="h-9 border-gray-300 rounded-md"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editedRow.substrand}
                                onChange={e => handleFieldChange('substrand', e.target.value)}
                                className="h-9 border-gray-300 rounded-md"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                placeholder="e.g., 12-14 years"
                                value={editedRow.ageRange || ""}
                                onChange={e => handleFieldChange('ageRange', e.target.value)}
                                className="h-9 border-gray-300 rounded-md w-32"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                placeholder="40"
                                value={editedRow.lessonDuration || ""}
                                onChange={e => handleFieldChange('lessonDuration', e.target.value)}
                                className="h-9 border-gray-300 rounded-md w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                placeholder="5"
                                value={editedRow.lessonsPerWeek || ""}
                                onChange={e => handleFieldChange('lessonsPerWeek', e.target.value)}
                                className="h-9 border-gray-300 rounded-md w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={editedRow.noOfLessons || ""}
                                onChange={e => handleFieldChange('noOfLessons', e.target.value)}
                                className="h-9 border-gray-300 rounded-md w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={handleSave}
                                  className="bg-green-600 hover:bg-green-700 text-white rounded-md px-3"
                                >
                                  <Save className="h-4 w-4 mr-1" /> Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setEditingRow(null)}
                                  className="border-gray-300 text-gray-700 rounded-md"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium text-blue-700">{entry.grade}</TableCell>
                            <TableCell className="text-gray-800">{entry.learningArea}</TableCell>
                            <TableCell className="text-gray-700">{entry.strand}</TableCell>
                            <TableCell className="text-gray-700">{entry.substrand}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                {entry.ageRange || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                {entry.lessonDuration ? `${entry.lessonDuration} min` : "-"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {entry.lessonsPerWeek ? `${entry.lessonsPerWeek}/wk` : "-"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {entry.noOfLessons || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleEditClick(entry)}
                                  className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-md"
                                >
                                  <SquarePen className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleDelete(entry._id)}
                                  className="border-red-200 text-red-600 hover:bg-red-50 rounded-md"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {filteredData.length > 0 && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                Showing {filteredData.length} of {cbcData.length} entries
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}