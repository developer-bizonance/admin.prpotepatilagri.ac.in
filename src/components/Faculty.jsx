"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PencilRuler, Trash2, Loader2 } from "lucide-react";

const BACKEND_URL = "http://localhost:4001/api";

const GoverningBodyDashboard = () => {
  const [faculty, setFaculty] = useState([]);
  const [experts, setExperts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [activeSidebar, setActiveSidebar] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    degree: "",
    experience: "",
    role: "Assistant Professor",
    image: null,
    imagePreview: null,
  });

  const [expertForm, setExpertForm] = useState({
    name: "",
    subject: "",
    image: null,
    imagePreview: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [expertToDelete, setExpertToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(""); 

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${BACKEND_URL}/faculties`);
        if (!response.ok) throw new Error("Failed to fetch data");
        const data = await response.json();
        setFaculty(data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const openAddForm = () => {
    setFormData({
      name: "",
      degree: "",
      experience: "",
      role: "Assistant Professor",
      image: null,
      imagePreview: null,
    });
    setEditingId(null);
    setActiveSidebar("governing");
  };

  const openEditForm = (member) => {
    setFormData({
      name: member.name || "",
      degree: member.degree || "",
      experience: member.experience || "",
      role: member.role || "Assistant Professor",
      image: null,
      imagePreview: member.imageUrl || "",
    });
    setEditingId(member.id);
    setActiveSidebar("governing");
  };

  const closeSidebar = () => setActiveSidebar(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: previewUrl,
      }));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const saveMember = async () => {
    try {
      setIsLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("degree", formData.degree);
      formDataToSend.append("experience", formData.experience);
      formDataToSend.append("role", formData.role);

      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }
      if (editingId) {
        formDataToSend.append("id", editingId);
      }

      const response = await fetch(`${BACKEND_URL}/faculties`, {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) throw new Error("Failed to save faculty member");

      const res = await fetch(`${BACKEND_URL}/faculties`);
      const updatedData = await res.json();
      setFaculty(updatedData);

      closeSidebar();
    } catch (error) {
      console.error("Error saving faculty member:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMember = async (id) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/faculties/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete faculty member");

      setFaculty((prev) => prev.filter((member) => member.id !== id));
    } catch (error) {
      console.error("Error deleting faculty member:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    setShowConfirm(false);
    setIsLoading(true);
    try {
      if (deleteType === "faculty" && memberToDelete) {
        await deleteMember(memberToDelete);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
      setMemberToDelete(null);
      setDeleteType("");
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
    setMemberToDelete(null);
    setDeleteType("");
  };

  if (isLoading && faculty.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4 sm:px-6 overflow-y-auto"
      style={{ height: "calc(100vh - 80px)" }}
    >
      <div className="max-w-7xl mx-auto relative">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full md:w-auto text-center md:text-left">
            <h1 className="text-xl font-bold text-blue-800">Faculty Management</h1>
            <p className="text-gray-600 text-sm">Manage teaching faculty and their details</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openAddForm}
            className="w-full md:w-auto text-sm flex justify-center items-center gap-2 bg-gradient-to-r from-orange-300 to-orange-500 text-white font-medium py-2.5 px-4 rounded-lg shadow-md"
          >
            Add New Faculty
          </motion.button>
        </div>

        {/* Faculty Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
          {faculty.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-indigo-100 transition-all duration-300 hover:shadow-xl flex flex-col"
            >
              <div className="md:flex p-4 flex-1">
                <div className="md:w-2/5 flex flex-col items-center justify-center p-4 border-b border-orange-300 md:border-b-0 md:border-r-2 md:border-orange-300">
                  <div className="relative">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-48 h-48 flex items-center justify-center mb-4 overflow-hidden">
                      {member.imageUrl ? (
                        <img
                          src={member.imageUrl.startsWith("http") ? member.imageUrl : `http://localhost:4001${member.imageUrl}`}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-500">No Image</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:w-3/5 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-md font-bold text-orange-500">{member.name}</h3>
                    <p className="text-gray-600 text-sm font-medium mt-1">{member.role}</p>
                    <p className="text-gray-600 text-sm mt-1">🎓 {member.degree}</p>
                    <p className="text-gray-600 text-sm mt-1">💼 {member.experience}</p>
                  </div>

                  <div className="flex justify-end mt-4 pt-2 border-t">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditForm(member)}
                      className="text-blue-700 px-3 py-1 rounded-lg"
                    >
                      <PencilRuler className="inline-block w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setMemberToDelete(member.id);
                        setDeleteType("faculty");
                        setShowConfirm(true);
                      }}
                      className="text-red-700 px-3 py-1 rounded-lg"
                    >
                      <Trash2 className="inline-block w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* DELETE MODAL */}
        <AnimatePresence>
          {showConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md z-50"
              >
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Delete</h3>
                  <p className="text-gray-600 mb-6">Are you sure you want to delete this faculty member?</p>
                  <div className="flex justify-center gap-4">
                    <button onClick={cancelDelete} className="px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg">Cancel</button>
                    <button onClick={confirmDelete} className="px-6 py-2.5 bg-red-500 text-white font-medium rounded-lg shadow-md">Delete</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SIDEBAR FORM */}
        <AnimatePresence>
          {activeSidebar && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-40" onClick={closeSidebar} />
              <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed top-0 right-0 w-full max-w-xl h-full bg-white shadow-2xl z-50 overflow-y-auto">
                <div className="p-6 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-md font-medium">{editingId ? "Edit Faculty" : "Add New Faculty"}</h2>
                    <button onClick={closeSidebar} className="text-gray-500 hover:text-gray-700">✕</button>
                  </div>

                  <div className="flex-1 space-y-6 pb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Faculty Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full text-sm px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter full name" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role / Designation</label>
                      <input type="text" name="role" value={formData.role} onChange={handleInputChange} className="w-full text-sm px-4 py-3 border border-gray-300 rounded-lg" placeholder="e.g. Principal / Assistant Professor" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Degree / Qualification</label>
                      <input type="text" name="degree" value={formData.degree} onChange={handleInputChange} className="w-full text-sm px-4 py-3 border border-gray-300 rounded-lg" placeholder="e.g. M.Sc, Ph.D" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                      <input type="text" name="experience" value={formData.experience} onChange={handleInputChange} className="w-full text-sm px-4 py-3 border border-gray-300 rounded-lg" placeholder="e.g. 12 yrs" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 flex items-center justify-center overflow-hidden">
                          {formData.imagePreview ? (
                            <img src={formData.imagePreview.startsWith("blob:") ? formData.imagePreview : `http://localhost:4001${formData.imagePreview}`} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-gray-500 text-xs">No image</div>
                          )}
                        </div>
                        <div>
                          <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                          <button type="button" onClick={triggerFileInput} className="bg-orange-500 text-white text-sm font-medium py-2 px-4 rounded-lg shadow-md">
                            Upload Image
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4 border-t border-gray-200">
                    <button onClick={saveMember} disabled={isLoading} className="flex-1 text-sm bg-orange-500 text-white font-medium py-3 px-6 rounded-lg shadow-md">
                      {isLoading ? "Saving..." : editingId ? "Update Faculty" : "Add Faculty"}
                    </button>
                    <button onClick={closeSidebar} className="flex-1 text-sm bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg">Cancel</button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GoverningBodyDashboard;