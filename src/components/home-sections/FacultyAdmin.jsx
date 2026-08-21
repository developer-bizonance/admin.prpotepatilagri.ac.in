"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Edit2, Trash2, X, Loader2, UploadCloud, User, ImageOff, FileText, Users, UserCog } from "lucide-react";
import axios from "axios";

const API_URL = "http://localhost:4001/api/faculties";
const MEDIA_UPLOAD = "https://media.bizonance.in/api/v1/image/upload/eca82cda-d4d7-4fe5-915a-b0880bb8de74/bizonance";
const MEDIA_DOWNLOAD = "https://media.bizonance.in/api/v1/image/download/eca82cda-d4d7-4fe5-915a-b0880bb8de74/bizonance";

// Helper to format image source properly
const getImageSrc = (imageName) => {
  if (!imageName || imageName === "null" || imageName === "undefined" || imageName === "[object Object]") return null;
  if (imageName.startsWith("http") || imageName.startsWith("blob:") || imageName.startsWith("data:") || imageName.startsWith("/assets/")) return imageName;
  const cleanName = imageName.split('/').pop();
  return `${MEDIA_DOWNLOAD}/${cleanName}`;
};

// Smart Helper to extract filename from any media server response format
const extractFilename = (resData) => {
  if (!resData) return null;
  if (typeof resData === "string") return resData.split("/").pop();

  if (typeof resData === "object") {
    const possibleKeys = ['filename', 'fileName', 'url', 'name', 'path', 'file', 'originalName'];
    for (const key of possibleKeys) {
      if (resData[key] && typeof resData[key] === "string") {
        return resData[key].split("/").pop();
      }
    }
    if (resData.uploadedImages && Array.isArray(resData.uploadedImages) && resData.uploadedImages.length > 0) {
      return extractFilename(resData.uploadedImages[0]);
    }
    if (resData.data && typeof resData.data === "object") {
      return extractFilename(resData.data);
    }
  }
  return null;
};

/* ---------------- MINIMAL FACULTY CARD ---------------- */
const FacultyCard = ({ faculty, onEdit, onDelete, onDragStart, onDragOver, onDrop, onDrag, index }) => {
  const [imgError, setImgError] = useState(false);
  const src = getImageSrc(faculty.imageUrl);
  const role = faculty.role || faculty.designation;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDrag={(e) => onDrag(e)}
      onDragOver={(e) => onDragOver(e)}
      onDrop={(e) => onDrop(e, index)}
      className="group relative flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-3 sm:p-4 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Icon actions */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        <button
          onClick={() => onEdit(faculty)}
          aria-label="Edit"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#dbeafe] text-[#2563eb] hover:bg-blue-200 transition-colors shadow-sm"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={() => onDelete(faculty.id)}
          aria-label="Delete"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#fee2e2] text-[#ef4444] hover:bg-red-200 transition-colors shadow-sm"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Avatar */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center ring-1 ring-gray-100">
        {src && !imgError ? (
          <img
            src={src}
            alt={faculty.name}
            className="w-full h-full object-cover object-top"
            onError={() => setImgError(true)}
          />
        ) : (
          <ImageOff className="text-gray-300" size={24} />
        )}
      </div>

      {/* Role + Name */}
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {role && (
            <span className="inline-block px-3 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold truncate max-w-full">
              {role}
            </span>
          )}
        </div>
        <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug break-words pr-16">{faculty.name}</h3>
      </div>
    </div>
  );
};

/* ---------------- FACULTY FORM MODAL ---------------- */
const FacultyFormModal = ({ faculty, onClose, onSuccess }) => {
  const isEditMode = Boolean(faculty);
  
  const [name, setName] = useState(faculty?.name || "");
  const [designation, setDesignation] = useState(faculty?.role || faculty?.designation || "");
  const [degree, setDegree] = useState(faculty?.degree || "");
  const [experience, setExperience] = useState(faculty?.experience || "");
  const [type, setType] = useState(faculty?.type || "Teaching"); 
  const [order] = useState(faculty?.order ?? 0); 
  
  const [imageFile, setImageFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(getImageSrc(faculty?.imageUrl));

  const getInitialResumeName = () => {
    if (!faculty?.resumeUrl || faculty.resumeUrl === "null" || faculty.resumeUrl === "[object Object]") return "";
    return faculty.resumeUrl.split('/').pop();
  };
  const [resumeName, setResumeName] = useState(getInitialResumeName());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFile(file);
    setResumeName(file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !designation.trim() || !degree.trim() || !experience.trim()) {
      setError("All fields are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let finalImageName = isEditMode ? faculty.imageUrl : null;
      let finalResumeName = isEditMode ? faculty.resumeUrl : null;

      if (finalResumeName === "[object Object]") finalResumeName = null;
      if (finalImageName === "[object Object]") finalImageName = null;

      if (imageFile) {
        const mediaForm = new FormData();
        mediaForm.append("file", imageFile);
        try {
          const mediaResponse = await axios.post(MEDIA_UPLOAD, mediaForm);
          const extracted = extractFilename(mediaResponse.data);
          if (extracted) finalImageName = extracted;
        } catch (mediaErr) {
          setError("Image Upload Error. Try again.");
          setSubmitting(false);
          return;
        }
      }

      if (resumeFile) {
        const resumeForm = new FormData();
        resumeForm.append("file", resumeFile);
        try {
          const resumeResponse = await axios.post(MEDIA_UPLOAD, resumeForm);
          const extracted = extractFilename(resumeResponse.data);
          finalResumeName = extracted ? extracted : resumeFile.name;
        } catch (resumeErr) {
          setError("Resume Upload Error. Try again.");
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        id: isEditMode ? faculty.id : undefined,
        name: name.trim(),
        designation: designation.trim(),
        degree: degree.trim(),
        experience: experience.trim(),
        order: faculty?.order ?? 0, 
        type: type, 
        existingImage: finalImageName,
        existingResume: finalResumeName
      };

      await axios.post(API_URL, payload, {
        headers: { "Content-Type": "application/json" }
      });

      onSuccess();
    } catch (err) {
      setError("Something went wrong saving to the database.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end items-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg h-[96vh] sm:h-[96vh] rounded-none sm:rounded-2xl shadow-2xl flex flex-col relative animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10 shrink-0">
          <h3 className="font-bold text-lg text-gray-800">{isEditMode ? "Edit Faculty" : "Add New Faculty"}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
          
          <div className="flex flex-col w-full gap-3">
            <label className="relative w-full h-44 rounded-xl bg-gray-50 border-2 border-dashed border-blue-300 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-blue-400 transition-all group">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain group-hover:opacity-40 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/60 text-white text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg">
                      <UploadCloud size={18} /> Change Photo
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-gray-400 flex flex-col items-center p-4">
                  <User className="text-gray-300 mb-2 group-hover:text-blue-500 transition-colors" size={40} />
                  <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">Click to Upload Profile Photo</span>
                  <span className="text-xs text-gray-400 mt-1">JPG, PNG (Max 5MB)</span>
                </div>
              )}
            </label>
          </div>

          <div className="flex flex-col gap-1.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <FileText size={16} className="text-blue-500" /> Faculty Resume (PDF / Doc)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeChange}
              className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
            />
            {resumeName && <span className="text-[11px] text-teal-600 font-medium truncate">Selected: {resumeName}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Faculty Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)} 
              className="w-full px-3 py-3 sm:py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none bg-white cursor-pointer"
            >
              <option value="Teaching">Teaching Staff</option>
              <option value="Non-Teaching">Non-Teaching Staff</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-3 sm:py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Designation / Role</label>
            <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full px-3 py-3 sm:py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Degree</label>
            <input type="text" value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="e.g. M.Sc, Ph.D" className="w-full px-3 py-3 sm:py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Experience</label>
            <input type="text" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 12 yrs" className="w-full px-3 py-3 sm:py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" required />
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-2 shrink-0">
            <button type="button" onClick={onClose} className="w-full sm:flex-1 py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition">Cancel</button>
            <button type="submit" disabled={submitting} className="w-full sm:flex-1 py-3 bg-[#dbeafe] text-[#1e3a8a] rounded-xl font-bold hover:bg-[#bfdbfe] transition flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting && <Loader2 className="animate-spin" size={16} />}
              {isEditMode ? "Save Changes" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- MAIN ADMIN DASHBOARD ---------------- */
export default function FacultyAdmin() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const fetchFaculties = useCallback(async () => {
    try {
      const res = await axios.get(API_URL);
      const sorted = res.data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setFaculties(sorted);
    } catch (error) {
      console.error("Error fetching faculties:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFaculties(); }, [fetchFaculties]);

  const handleDragStart = (e, globalIndex) => {
    dragItem.current = globalIndex;
  };

  const handleDragOver = (e) => {
    e.preventDefault(); 
  };

  const handleDrag = (e) => {
    const clientY = e.clientY;
    if (!clientY || clientY === 0) return;

    const threshold = 200;
    const maxSpeed = 35;

    if (clientY < threshold) {
      const factor = (threshold - clientY) / threshold;
      window.scrollBy({ top: -Math.max(8, maxSpeed * factor), behavior: 'auto' });
    } else if (clientY > window.innerHeight - threshold) {
      const distance = clientY - (window.innerHeight - threshold);
      const factor = distance / threshold;
      window.scrollBy({ top: Math.max(8, maxSpeed * factor), behavior: 'auto' });
    }
  };

  const handleDrop = async (e, globalIndex) => {
    e.preventDefault();
    if (dragItem.current === null || globalIndex === null) return; 

    dragOverItem.current = globalIndex;
    const copyListItems = [...faculties];
    const dragItemContent = copyListItems[dragItem.current];

    copyListItems.splice(dragItem.current, 1);
    copyListItems.splice(dragOverItem.current, 0, dragItemContent);

    dragItem.current = null;
    dragOverItem.current = null;

    setFaculties(copyListItems);

    try {
      const reorderPayload = copyListItems.map((faculty, index) => ({
        id: faculty.id,
        order: index
      }));
      await axios.post(`${API_URL}/reorder`, { items: reorderPayload });
      fetchFaculties(); 
    } catch (err) {
      alert("Failed to save new order!");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/${deleteId}`);
      await fetchFaculties();
      setDeleteId(null);
    } catch (error) {
      alert("Delete failed!");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-10 h-10 text-blue-600" /></div>;

  const teachingStaff = faculties
    .map((f, i) => ({ ...f, globalIndex: i }))
    .filter((f) => f.type !== "Non-Teaching");

  const nonTeachingStaff = faculties
    .map((f, i) => ({ ...f, globalIndex: i }))
    .filter((f) => f.type === "Non-Teaching");

  return (
    <div className="w-full max-w-7xl mx-auto pt-4 pb-8 px-4 sm:px-6 lg:px-8">
      
      {/* 🌟 POSITIONED "ADD NEW" BUTTON (TOP RIGHT) 🌟 */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setEditingFaculty(null); setIsFormOpen(true); }}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-5 bg-[#dbeafe] text-[#1e3a8a] font-semibold text-sm rounded-full hover:bg-[#bfdbfe] active:scale-[0.98] transition-all shadow-sm"
        >
          <Plus size={16} strokeWidth={2.5} /> Add New
        </button>
      </div>

      <div className="space-y-8">
        {/* SECTION 1: TEACHING STAFF */}
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
            <Users className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">Teaching Staff</h2>
          </div>

          {teachingStaff.length === 0 ? (
            <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed border-gray-200">No teaching staff added yet.</div>
          ) : (
            <div className="grid gap-3 grid-cols-1">
              {teachingStaff.map((f) => (
                <FacultyCard
                  key={`card-${f.id}`}
                  faculty={f}
                  index={f.globalIndex}
                  onEdit={(fac) => { setEditingFaculty(fac); setIsFormOpen(true); }}
                  onDelete={setDeleteId}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrag={handleDrag}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: NON-TEACHING STAFF */}
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
            <UserCog className="text-orange-500" size={20} />
            <h2 className="text-lg font-bold text-gray-800">Non-Teaching Staff</h2>
          </div>

          {nonTeachingStaff.length === 0 ? (
            <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed border-gray-200">No non-teaching staff added yet.</div>
          ) : (
            <div className="grid gap-3 grid-cols-1">
              {nonTeachingStaff.map((f) => (
                <FacultyCard
                  key={`card-${f.id}`}
                  faculty={f}
                  index={f.globalIndex}
                  onEdit={(fac) => { setEditingFaculty(fac); setIsFormOpen(true); }}
                  onDelete={setDeleteId}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrag={handleDrag}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <FacultyFormModal 
          faculty={editingFaculty} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => { fetchFaculties(); setIsFormOpen(false); }} 
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-2 text-gray-800">Confirm Delete?</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to remove this member?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition flex items-center justify-center gap-2" disabled={deleting}>
                {deleting && <Loader2 className="animate-spin" size={16} />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}