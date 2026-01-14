import API from "@/api";
import { React, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Plus, Minus, Trash2, UserCog, Loader2, School, Search, Filter } from "lucide-react";

export default function AdminTeachers() {
    const [teachers, setTeachers] = useState([]);
    const [assigningTeacher, setAssigningTeacher] = useState(null);
    const [removingTeacher, setRemovingTeacher] = useState(null);
    const [formData, setFormData] = useState({ grade: '', stream: '', learningArea: '' });
    const [grades, setGrades] = useState([]);
    const [cbcEntries, setCbcEntries] = useState([]);
    const [filteredLearningAreas, setFilteredLearningAreas] = useState([]);
    const [streams, setStreams] = useState([]);
    const [selectedClassToRemove, setSelectedClassToRemove] = useState(null);
    const [roleStates, setRoleStates] = useState({});
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [schoolCode, setSchoolCode] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    // Load user and school code
    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('userData'));
        console.log("User data:", userData);
        
        if (!userData) {
            toast.error('Please login again');
            setLoading(false);
            return;
        }
        
        setUser(userData);
        
        let schoolCodeValue = '';
        
        if (userData.schoolCode) {
            schoolCodeValue = userData.schoolCode;
        } else if (localStorage.getItem('schoolCode')) {
            schoolCodeValue = localStorage.getItem('schoolCode');
        } else {
            const enteredSchoolCode = prompt('Please enter your school code:');
            if (enteredSchoolCode) {
                schoolCodeValue = enteredSchoolCode;
                localStorage.setItem('schoolCode', enteredSchoolCode);
            } else {
                toast.error('School code is required');
                setLoading(false);
                return;
            }
        }
        
        setSchoolCode(schoolCodeValue);
        fetchData(schoolCodeValue);
    }, []);

    const fetchData = async (schoolCode) => {
        setLoading(true);
        try {
            const teachersRes = await API.get(`/teachers/school/${schoolCode}`);
            setTeachers(teachersRes.data);

            const roleMap = {};
            teachersRes.data.forEach(t => roleMap[t._id] = t.role === "Admin");
            setRoleStates(roleMap);

            const streamsRes = await API.get(`/school-config/${schoolCode}/streams`);
            setStreams(streamsRes.data.streams || []);

            const [gradesRes, cbcRes] = await Promise.all([
                API.get('/documents/grades'),
                API.get('/cbc')
            ]);
            setGrades(gradesRes.data);
            setCbcEntries(cbcRes.data);

        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                toast.error('School not found. Please check your school code.');
            } else {
                toast.error('Failed to load data');
            }
        } finally {
            setLoading(false);
        }
    };

    // Filter teachers based on search and role filter
    const filteredTeachers = teachers.filter(teacher => {
        const matchesSearch = teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            teacher.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || teacher.role === filterRole;
        return matchesSearch && matchesRole;
    });

    // Update filtered learning areas when grade changes
    useEffect(() => {
        if (formData.grade && cbcEntries.length) {
            const learningAreas = [...new Set(
                cbcEntries.filter(entry => entry.grade === formData.grade)
                          .map(entry => entry.learningArea)
            )];
            setFilteredLearningAreas(learningAreas);
            setFormData(prev => ({ ...prev, learningArea: "" }));
        }
    }, [formData.grade, cbcEntries]);

    // Assign class
    const handleAssign = async () => {
        try {
            setLoading(true)
            await API.post(`/teachers/${assigningTeacher._id}/class`, formData);
            const res = await API.get(`/teachers/school/${schoolCode}`);
            setTeachers(res.data);
            toast.success("Class assigned successfully!");
            setAssigningTeacher(null);
            setFormData({ grade: '', stream: '', learningArea: '' });
        } catch (err) {
            console.error(err);
            toast.error("Failed to assign class");
        }finally{
            setLoading(false)
        }
    };

    // Remove class
    const handleRemoveClass = async (assignment) => {
        try {
            setLoading(true)
            await API.delete(`/teachers/${removingTeacher._id}/class`, { data: assignment });
            const res = await API.get(`/teachers/school/${schoolCode}`);
            setTeachers(res.data);
            toast.success("Class removed successfully");
            setRemovingTeacher(null);
            setSelectedClassToRemove(null);
        } catch (err) {
            console.error(err);
            toast.error("Failed to remove class");
        }finally{
            setLoading(false)
        }
    };

    // Toggle teacher role
    const handleRoleToggle = async (teacherId, newRole) => {
        try {
            await API.put(`/teachers/${teacherId}/role`, { role: newRole });
            const updated = teachers.map(t => t._id === teacherId ? { ...t, role: newRole } : t);
            setTeachers(updated);
            setRoleStates(prev => ({ ...prev, [teacherId]: newRole === "Admin" }));
            toast.success("Role updated successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update role");
        }
    };

    // Delete teacher
    const handleDelete = async (teacherId) => {
        if (!confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
            return;
        }
        
        try {
            await API.delete(`/teachers/${teacherId}`);
            setTeachers(prev => prev.filter(t => t._id !== teacherId));
            toast.success("Teacher deleted successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete teacher");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading teachers...</p>
                </div>
            </div>
        );
    }

    if (!schoolCode) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <School className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">School Code Required</h2>
                    <p className="text-gray-600 mb-4">Please provide your school code to continue</p>
                    <Button onClick={() => {
                        const enteredSchoolCode = prompt('Please enter your school code:');
                        if (enteredSchoolCode) {
                            setSchoolCode(enteredSchoolCode);
                            localStorage.setItem('schoolCode', enteredSchoolCode);
                            fetchData(enteredSchoolCode);
                        }
                    }}>
                        Enter School Code
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">👨‍🏫 Teachers Management</h1>
                            <p className="text-gray-600">Manage teachers and their class assignments for {schoolCode}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm">
                                {filteredTeachers.length} {filteredTeachers.length === 1 ? 'Teacher' : 'Teachers'}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <Card className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search teachers by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 bg-gray-50 border-gray-200"
                                    />
                                </div>
                            </div>
                            <div className="w-full sm:w-48">
                                <Select value={filterRole} onValueChange={setFilterRole}>
                                    <SelectTrigger className="bg-gray-50 border-gray-200">
                                        <SelectValue placeholder="Filter by role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="Teacher">Teacher</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Teachers Table */}
                <Card className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
                        <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            Teachers List
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredTeachers.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                <p className="text-lg font-medium text-gray-600 mb-2">No teachers found</p>
                                <p className="text-gray-500">
                                    {searchTerm || filterRole !== 'all' 
                                        ? 'Try adjusting your search or filters' 
                                        : `No teachers registered for school code: ${schoolCode}`
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow className="border-b border-gray-200 hover:bg-transparent">
                                            <TableHead className="font-semibold text-gray-700">Teacher</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Role</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Assigned Classes</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTeachers.map(teacher => (
                                            <TableRow key={teacher._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="font-medium">
                                                    <div>
                                                        <div className="text-gray-900">{teacher.firstName} {teacher.lastName}</div>
                                                        {teacher.role === "Admin" && (
                                                            <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                                                School Admin
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-gray-600">{teacher.email}</TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        variant={teacher.role === "Admin" ? "default" : "secondary"}
                                                        className={
                                                            teacher.role === "Admin" 
                                                                ? "bg-purple-100 text-purple-800 hover:bg-purple-200" 
                                                                : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                                        }
                                                    >
                                                        {teacher.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {teacher.assignedClasses?.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {teacher.assignedClasses.map((cls, idx) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0"></div>
                                                                    <span className="text-sm text-gray-700">
                                                                        {cls.grade} • {cls.stream} • {cls.learningArea}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm italic">No classes assigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => { 
                                                                setAssigningTeacher(teacher); 
                                                                setFormData({ grade: '', stream: '', learningArea: '' }); 
                                                            }}
                                                            className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                                                        >
                                                            <Plus className="h-4 w-4 mr-1" />
                                                            Assign
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => { 
                                                                setRemovingTeacher(teacher); 
                                                                setSelectedClassToRemove(''); 
                                                            }}
                                                            disabled={!teacher.assignedClasses || teacher.assignedClasses.length === 0}
                                                            className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800 disabled:opacity-50"
                                                        >
                                                            <Minus className="h-4 w-4 mr-1" />
                                                            Remove
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => handleRoleToggle(teacher._id, roleStates[teacher._id] ? "Teacher" : "Admin")}
                                                            className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                                                        >
                                                            <UserCog className="h-4 w-4 mr-1" />
                                                            {roleStates[teacher._id] ? "Make Teacher" : "Make Admin"}
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => handleDelete(teacher._id)}
                                                            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Assign Class Dialog */}
                <Dialog open={!!assigningTeacher} onOpenChange={() => {
                    setAssigningTeacher(null);
                    setFormData({ grade: '', stream: '', learningArea: '' });
                }}>
                    <DialogContent className="sm:max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl">
                        <DialogHeader className="space-y-3">
                            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <Plus className="h-5 w-5 text-blue-600" />
                                Assign Class
                            </DialogTitle>
                            <DialogDescription className="text-gray-600">
                                Assign a new class to {assigningTeacher?.firstName} {assigningTeacher?.lastName}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-5 py-4">
                            <div className="space-y-3">
                                <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                                    Grade Level *
                                </Label>
                                <Select value={formData.grade} onValueChange={v => setFormData(prev => ({ ...prev, grade: v }))}>
                                    <SelectTrigger className="w-full bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                        <SelectValue placeholder="Select grade level" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                                        {grades.map(g => (
                                            <SelectItem key={g} value={g} className="focus:bg-blue-50">
                                                {g}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="stream" className="text-sm font-medium text-gray-700">
                                    Stream *
                                </Label>
                                <Select value={formData.stream} onValueChange={v => setFormData(prev => ({ ...prev, stream: v }))}>
                                    <SelectTrigger className="w-full bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                        <SelectValue placeholder="Select stream" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                                        {streams.map(s => (
                                            <SelectItem key={s} value={s} className="focus:bg-blue-50">
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="learningArea" className="text-sm font-medium text-gray-700">
                                    Learning Area *
                                </Label>
                                <Select 
                                    value={formData.learningArea} 
                                    onValueChange={v => setFormData(prev => ({ ...prev, learningArea: v }))} 
                                    disabled={!formData.grade}
                                >
                                    <SelectTrigger className="w-full bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50">
                                        <SelectValue placeholder={formData.grade ? "Select learning area" : "Select grade first"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                                        {filteredLearningAreas.map(area => (
                                            <SelectItem key={area} value={area} className="focus:bg-blue-50">
                                                {area}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!formData.grade && (
                                    <p className="text-xs text-gray-500 mt-1">Please select a grade level first</p>
                                )}
                            </div>
                        </div>
                        
                        <DialogFooter className="flex gap-2 sm:gap-0">
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setAssigningTeacher(null);
                                    setFormData({ grade: '', stream: '', learningArea: '' });
                                }}
                                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleAssign} 
                                disabled={!formData.grade || !formData.stream || !formData.learningArea}
                                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                            {loading ? (
                                <>
                                <Loader2 />
                                </>
                            ): (
                                <>
                                <Plus className="h-4 w-4 mr-2" />
                                Assign Class
                                </>
                            )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Remove Class Dialog */}
                <Dialog open={!!removingTeacher} onOpenChange={() => { 
                    setRemovingTeacher(null); 
                    setSelectedClassToRemove(null); 
                }}>
                    <DialogContent className="sm:max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl">
                        <DialogHeader className="space-y-3">
                            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <Minus className="h-5 w-5 text-orange-600" />
                                Remove Class
                            </DialogTitle>
                            <DialogDescription className="text-gray-600">
                                Remove a class assignment from {removingTeacher?.firstName} {removingTeacher?.lastName}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                            <div className="space-y-3">
                                <Label htmlFor="class-to-remove" className="text-sm font-medium text-gray-700">
                                    Select Class to Remove *
                                </Label>
                                <Select value={selectedClassToRemove} onValueChange={v => setSelectedClassToRemove(v)}>
                                    <SelectTrigger className="w-full bg-gray-50 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                                        <SelectValue placeholder="Choose a class to remove" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                                        {removingTeacher?.assignedClasses.map((cls, idx) => (
                                            <SelectItem key={idx} value={JSON.stringify(cls)} className="focus:bg-orange-50">
                                                {cls.grade} • {cls.stream} • {cls.learningArea}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <DialogFooter className="flex gap-2 sm:gap-0">
                            <Button 
                                variant="outline" 
                                onClick={() => { 
                                    setRemovingTeacher(null); 
                                    setSelectedClassToRemove(null); 
                                }}
                                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={() => {
                                    if (selectedClassToRemove) {
                                        handleRemoveClass(JSON.parse(selectedClassToRemove));
                                    }
                                }} 
                                disabled={!selectedClassToRemove}
                                className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >

                                 {loading ? (
                                <>
                                <Loader2 />
                                </>
                            ): (
                                <>
                                <Minus className="h-4 w-4 mr-2" />
                                Remove Class
                                </>
                            )
                        }
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}