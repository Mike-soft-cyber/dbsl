import React, { useState, useEffect, useMemo } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Save, Upload, User, School, Camera } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

// API base URL constant
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_BASE_URL = API_BASE_URL.replace("/api", "");

// API client
const API = axios.create({
  baseURL: API_BASE_URL,
});

export default function AdminSettings() {
  const [streams, setStreams] = useState([]);
  const [newStream, setNewStream] = useState('');
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    profilePic: '',
  });
  const [schoolData, setSchoolData] = useState({
    schoolName: '',
    schoolLogo: ''
  });
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [selectedSchoolLogo, setSelectedSchoolLogo] = useState(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState('');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const userData = useMemo(() => {
    const stored = localStorage.getItem("userData");
    return stored ? JSON.parse(stored) : null;
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);

        if (!userData?._id) {
          toast.error("User data not found. Please login again.");
          return;
        }

        const token = localStorage.getItem("token");

        // Fetch profile
        const res = await API.get(`/teachers/${userData._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProfile({
          firstName: res.data.firstName || "",
          lastName: res.data.lastName || "",
          email: res.data.email || "",
          password: "",
          profilePic: res.data.profilePic || "",
        });

        if (res.data.profilePic) {
          setProfilePreviewUrl(`${SERVER_BASE_URL}/uploads/profile-pics/${res.data.profilePic}`);
        }

        // Fetch school data (only if Admin)
        if (userData?.role === "Admin" && userData?.schoolCode) {
          try {
            const schoolRes = await API.get(`/school-config/${userData.schoolCode}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (schoolRes.data.success) {
              const school = schoolRes.data.school;
              setSchoolData({
                schoolName: school.schoolName || '',
                schoolLogo: school.schoolLogo || ''
              });

              if (school.schoolLogo) {
                setLogoPreviewUrl(`${SERVER_BASE_URL}/uploads/school-logos/${school.schoolLogo}`);
              }

              setStreams(school.streams || []);
            }
          } catch (schoolError) {
            console.log("School data not found, will create new:", schoolError);
          }
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
        if (error.response?.status !== 404) {
          toast.error("Failed to load profile data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [userData?._id, userData?.schoolCode, userData?.role]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSchoolDataChange = (e) => {
    const { name, value } = e.target;
    setSchoolData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      toast.error("Please select a JPG, PNG, or GIF image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB.");
      return;
    }

    setSelectedProfileImage(file);
    setProfilePreviewUrl(URL.createObjectURL(file));
  };

  const handleSchoolLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/gif", "image/svg+xml"].includes(file.type)) {
      toast.error("Please select a JPG, PNG, GIF, or SVG image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB.");
      return;
    }

    setSelectedSchoolLogo(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  // Upload profile picture
  const uploadProfilePic = async () => {
    if (!selectedProfileImage) {
      toast.error("Please select an image first");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("profilePic", selectedProfileImage);

      const token = localStorage.getItem("token");

      const response = await API.post(
        `/teachers/upload-profile-pic/${userData._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Profile picture updated successfully!");

        const newPic = response.data.profilePic;
        setProfile((prev) => ({ ...prev, profilePic: newPic }));
        setProfilePreviewUrl(`${SERVER_BASE_URL}/uploads/profile-pics/${newPic}`);

        const updatedUserData = { ...userData, profilePic: newPic };
        localStorage.setItem("userData", JSON.stringify(updatedUserData));

        window.dispatchEvent(
          new CustomEvent("profilePicUpdated", {
            detail: { profilePic: newPic },
          })
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload profile picture.");
    } finally {
      setSaving(false);
    }
  };

  // Upload school logo
  const uploadSchoolLogo = async () => {
    if (!selectedSchoolLogo) {
      toast.error("Please select a logo first");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("schoolLogo", selectedSchoolLogo);

      const token = localStorage.getItem("token");

      const response = await API.post(
        `/school-config/${userData.schoolCode}/upload-logo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("School logo updated successfully!");

        const newLogo = response.data.schoolLogo;
        setSchoolData((prev) => ({ ...prev, schoolLogo: newLogo }));
        setLogoPreviewUrl(`${SERVER_BASE_URL}/uploads/school-logos/${newLogo}`);

        window.dispatchEvent(
          new CustomEvent("schoolLogoUpdated", {
            detail: { 
              schoolLogo: newLogo,
              schoolName: schoolData.schoolName 
            },
          })
        );
      }
    } catch (error) {
      console.error("Logo upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload school logo.");
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = async () => {
    try {
      setSaving(true);
      const { firstName, lastName, password } = profile;
      const updateData = { firstName, lastName };
      if (password) updateData.password = password;

      const token = localStorage.getItem("token");

      await API.put(`/teachers/${userData._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Profile updated successfully!");

      const updatedUserData = { ...userData, firstName, lastName };
      localStorage.setItem("userData", JSON.stringify(updatedUserData));

      setProfile((prev) => ({ ...prev, password: "" }));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const updateSchoolInfo = async () => {
    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      const response = await API.put(
        `/school-config/${userData.schoolCode}`, 
        { schoolName: schoolData.schoolName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("School information updated successfully!");

        window.dispatchEvent(
          new CustomEvent("schoolLogoUpdated", {
            detail: { 
              schoolLogo: schoolData.schoolLogo,
              schoolName: schoolData.schoolName 
            },
          })
        );
      }
    } catch (error) {
      console.error("Error updating school info:", error);
      toast.error(error.response?.data?.message || "Failed to update school information");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStream = async (streamToRemove) => {
    try {
      setSaving(true);
      await API.delete(`/school-config/${userData.schoolCode}/streams?stream=${encodeURIComponent(streamToRemove)}`);
      
      setStreams(streams.filter(stream => stream !== streamToRemove));
      toast.success('Stream removed successfully!');
    } catch (error) {
      console.error('Failed to remove stream:', error);
      toast.error(error.response?.data?.message || 'Failed to remove stream');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStream = async () => {
    if (!newStream.trim()) {
      toast.error('Please enter a stream name');
      return;
    }

    if (streams.includes(newStream.trim())) {
      toast.error('This stream already exists');
      return;
    }

    try {
      setSaving(true);
      await API.post(`/school-config/${userData.schoolCode}/streams`, {
        streams: [newStream.trim()]
      });
      
      setStreams([...streams, newStream.trim()]);
      setNewStream('');
      toast.success('Stream added successfully!');
    } catch (error) {
      console.error('Failed to add stream:', error);
      toast.error(error.response?.data?.message || 'Failed to add stream');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">User Not Found</h2>
          <p className="text-gray-600">Please login again to access settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          {userData?.role === "Admin" ? (
            <>
              <h1 className="text-2xl font-bold text-gray-800">Admin Settings</h1>
              <p className="text-gray-600 mt-1">Manage your profile and school configuration</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
              <p className="text-gray-600 mt-1">Update your personal information</p>
            </>
          )}
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className={`grid w-full mb-6 bg-gray-100 p-1 rounded-lg ${userData?.role === "Admin" ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            {userData?.role === "Admin" && (
              <>
                <TabsTrigger value="school">School</TabsTrigger>
                <TabsTrigger value="streams">Streams</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-white rounded-xl shadow-md overflow-hidden border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50 p-6">
                <CardTitle className="text-xl font-semibold text-gray-800">Profile Settings</CardTitle>
                <CardDescription>Update your personal information and profile picture</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Profile Picture */}
                  <div>
                    <Label className="block mb-3 text-sm font-medium text-gray-700">Profile Picture</Label>
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        {profilePreviewUrl ? (
                          <img
                            src={profilePreviewUrl}
                            alt="Profile"
                            className="h-24 w-24 rounded-full object-cover border-2 border-white shadow-md"
                            onError={() => setProfilePreviewUrl('')}
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-md">
                            <User className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <label
                          htmlFor="profile-upload"
                          className="absolute bottom-0 right-0 bg-teal-600 rounded-full p-2 cursor-pointer shadow-md hover:bg-teal-700 transition-colors"
                        >
                          <Camera className="h-4 w-4 text-white" />
                          <input
                            id="profile-upload"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif"
                            onChange={handleProfileImageChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div className="text-center">
                        <Button 
                          onClick={uploadProfilePic} 
                          disabled={!selectedProfileImage || saving}
                          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
                        >
                          <Upload className="h-4 w-4" />
                          {saving ? 'Uploading...' : 'Upload Picture'}
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">
                          Max size: 5MB. Formats: JPG, PNG, GIF
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">First Name</Label>
                      <Input
                        name="firstName"
                        value={profile.firstName}
                        onChange={handleProfileChange}
                        className="mt-1 border-gray-300 rounded-lg"
                        placeholder="Enter first name"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                      <Input
                        name="lastName"
                        value={profile.lastName}
                        onChange={handleProfileChange}
                        className="mt-1 border-gray-300 rounded-lg"
                        placeholder="Enter last name"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <Input
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleProfileChange}
                        className="mt-1 border-gray-300 rounded-lg bg-gray-50"
                        disabled
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Change Password</Label>
                      <Input
                        type="password"
                        name="password"
                        value={profile.password}
                        onChange={handleProfileChange}
                        placeholder="Enter new password"
                        className="mt-1 border-gray-300 rounded-lg"
                      />
                    </div>

                    <Button 
                      onClick={updateProfile} 
                      disabled={saving}
                      className="w-full bg-blue-600 hover:bg-blue-700 mt-4 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* School Tab (Admin only) */}
          {userData?.role === "Admin" && (
            <TabsContent value="school">
              <Card className="bg-white rounded-xl shadow-md overflow-hidden border-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50 p-6">
                  <CardTitle className="text-xl font-semibold text-gray-800">School Settings</CardTitle>
                  <CardDescription>Manage your school's branding and information</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* School Logo */}
                    <div>
                      <Label className="block mb-3 text-sm font-medium text-gray-700">School Logo</Label>
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          {logoPreviewUrl ? (
                            <img
                              src={logoPreviewUrl}
                              alt="School Logo"
                              className="h-24 w-24 rounded-lg object-contain border-2 border-gray-200 shadow-md bg-white p-2"
                              onError={() => setLogoPreviewUrl('')}
                            />
                          ) : (
                            <div className="h-24 w-24 rounded-lg bg-gray-200 flex items-center justify-center border-2 border-gray-200 shadow-md">
                              <School className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          <label
                            htmlFor="logo-upload"
                            className="absolute bottom-0 right-0 bg-teal-600 rounded-full p-2 cursor-pointer shadow-md hover:bg-teal-700 transition-colors"
                          >
                            <Camera className="h-4 w-4 text-white" />
                            <input
                              id="logo-upload"
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/svg+xml"
                              onChange={handleSchoolLogoChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <div className="text-center">
                          <Button 
                            onClick={uploadSchoolLogo} 
                            disabled={!selectedSchoolLogo || saving}
                            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
                          >
                            <Upload className="h-4 w-4" />
                            {saving ? 'Uploading...' : 'Upload Logo'}
                          </Button>
                          <p className="text-xs text-gray-500 mt-1">
                            Max size: 5MB. Formats: JPG, PNG, GIF, SVG
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* School Information */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">School Name</Label>
                        <Input
                          name="schoolName"
                          value={schoolData.schoolName}
                          onChange={handleSchoolDataChange}
                          className="mt-1 border-gray-300 rounded-lg"
                          placeholder="Enter school name"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">School Code</Label>
                        <Input
                          value={userData?.schoolCode || ''}
                          className="mt-1 border-gray-300 rounded-lg bg-gray-50"
                          disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">School code cannot be changed</p>
                      </div>

                      <Button 
                        onClick={updateSchoolInfo} 
                        disabled={saving}
                        className="w-full bg-blue-600 hover:bg-blue-700 mt-4 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Updating...' : 'Update School Info'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Streams Tab (Admin only) */}
          {userData?.role === "Admin" && (
            <TabsContent value="streams">
              <Card className="bg-white rounded-xl shadow-md overflow-hidden border-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50 p-6">
                  <CardTitle className="text-xl font-semibold text-gray-800">Stream Management</CardTitle>
                  <CardDescription>Add and manage streams for your school</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <Label className="block mb-3 text-sm font-medium text-gray-700">Add New Stream</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newStream}
                          onChange={(e) => setNewStream(e.target.value)}
                          placeholder="e.g. North, Blue, A"
                          className="flex-1 border-gray-300 rounded-lg"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleAddStream();
                          }}
                        />
                        <Button 
                          onClick={handleAddStream} 
                          disabled={saving || !newStream.trim()}
                          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="block mb-3 text-sm font-medium text-gray-700">Current Streams</Label>
                      <div className="space-y-3">
                        {streams.length > 0 ? (
                          streams.map((stream, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200"
                            >
                              <span className="font-medium text-gray-800">{stream}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveStream(stream)}
                                disabled={saving}
                                className="border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <School className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                            <p>No streams configured yet</p>
                            <p className="text-sm mt-1">Add your first stream above</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}