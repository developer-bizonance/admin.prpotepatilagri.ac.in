"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, X, Loader2, UploadCloud, User, ImageOff } from "lucide-react";
import axios from "axios";

const API_URL = "http://localhost:4001/api/eminent-guests";
const MEDIA_UPLOAD = "https://media.bizonance.in/api/v1/image/upload/eca82cda-d4d7-4fe5-915a-b0880bb8de74/bizonance";
const MEDIA_DOWNLOAD = "https://media.bizonance.in/api/v1/image/download/eca82cda-d4d7-4fe5-915a-b0880bb8de74/bizonance";

const getImageSrc = (imageName) => {
  if (!imageName || imageName === "null" || imageName === "undefined") return null;
  if (imageName.startsWith("http") || imageName.startsWith("blob:") || imageName.startsWith("data:")) return imageName;
  const cleanName = imageName.split('/').pop(); 
  return `${MEDIA_DOWNLOAD}/${cleanName}`;
};

// --- UPDATED GUEST CARD UI ---
const GuestCard = ({ guest, onEdit, onDelete }) => {
  const [imgError, setImgError] = useState(false);
  const src = getImageSrc(guest.imageUrl);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col w-full max-w-[320px] mx-auto group">
      
      {/* Image Section */}
      <div className="relative w-full bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100 min-h-[150px]">
        
        {/* Background Fallback */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 z-0">
          <ImageOff size={32} />
        </div>

        {/* Real Image */}
        {src && (
          <img
            key={`img-${guest.id}-${src}`}
            src={src}
            alt={guest.name}
            className={`w-full h-auto block z-10 transition-transform duration-500 group-hover:scale-105 ${imgError ? 'opacity-0' : 'opacity-100'}`}
            onError={() => setImgError(true)}
            onLoad={() => setImgError(false)}
          />
        )}

        {/* Floating Actions Buttons on Image */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
          <button 
            onClick={() => onEdit(guest)} 
            className="w-10 h-10 flex items-center justify-center bg-blue-50/90 backdrop-blur-sm text-blue-600 rounded-full hover:bg-blue-100 transition-colors shadow"
            title="Edit Guest"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={() => onDelete(guest.id)} 
            className="w-10 h-10 flex items-center justify-center bg-red-50/90 backdrop-blur-sm text-red-500 rounded-full hover:bg-red-100 transition-colors shadow"
            title="Delete Guest"
          >
            <Trash2 size={18} />
          </button>
        </div>

      </div>

      {/* 🌟 CONTENT SECTION: Name ka font size kam karke text-base kar diya hai 🌟 */}
      <div className="px-4 py-4 flex flex-col bg-white">
        <h3 className="font-bold text-gray-900 text-base leading-snug">
          {guest.name}
        </h3>
      </div>
    </div>
  );
};

const GuestFormModal = ({ guest, onClose, onSuccess }) => {
  const isEditMode = Boolean(guest);
  const [name, setName] = useState(guest?.name || "");
  const [designation, setDesignation] = useState(guest?.designation || "");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(getImageSrc(guest?.imageUrl));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (imageFile && previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [imageFile, previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file)); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !designation.trim()) {
      setError("Name and designation are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let finalImageName = isEditMode ? guest.imageUrl : null;

      // 1. Upload DIRECTLY to Media Server
      if (imageFile) {
        const mediaForm = new FormData();
        mediaForm.append("file", imageFile); 
        
        try {
          const mediaResponse = await axios.post(MEDIA_UPLOAD, mediaForm);
          const resData = mediaResponse.data;
          
          if (resData?.uploadedImages && resData.uploadedImages.length > 0) {
            finalImageName = resData.uploadedImages[0].filename;
          } else if (typeof resData === "string") {
            finalImageName = resData;
          } else if (resData?.fileName) {
            finalImageName = resData.fileName;
          }

          if (finalImageName && typeof finalImageName === "string") {
            finalImageName = finalImageName.split("/").pop();
          } else {
            throw new Error(`Could not find filename in: ${JSON.stringify(resData)}`);
          }

        } catch (mediaErr) {
          setError(`Media Upload Error: ${mediaErr.message}`);
          setSubmitting(false);
          return;
        }
      }

      // 2. Send JSON Data to Backend
      const payload = {
        id: isEditMode ? guest.id : undefined,
        name: name.trim(),
        designation: designation.trim(),
        existingImage: finalImageName
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
    <>
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditMode ? "Edit Guest" : "Add New Guest"}
          </h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* 🌟 FULL WIDTH RECTANGULAR/SQUARE UPLOAD UI 🌟 */}
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

          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
              placeholder="e.g. Hon. Dr. Vijay Bhatkar"
              required 
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Designation</label>
            <input 
              type="text" 
              value={designation} 
              onChange={(e) => setDesignation(e.target.value)} 
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
              placeholder="e.g. Chancellor of the Nalanda University"
              required 
            />
          </div>

          {error && <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-xl">{error}</p>}

          <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 py-3 bg-[#dbeafe] text-[#1e3a8a] rounded-xl font-bold hover:bg-[#bfdbfe] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {submitting && <Loader2 className="animate-spin" size={18} />}
              {isEditMode ? "Save Changes" : "Save"}
            </button>
          </div>
        </form>

      </div>

      <style jsx>{`
        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

const EminentGuestsAdmin = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingGuest, setEditingGuest] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchGuests = useCallback(async () => {
    try {
      const res = await axios.get(API_URL);
      setGuests(res.data);
    } catch (error) {
      console.error("Error fetching guests:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGuests(); }, [fetchGuests]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/${deleteId}`);
      await fetchGuests();
      setDeleteId(null);
    } catch (error) {
      alert("Delete failed!");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin w-10 h-10 text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex justify-center">
      
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this guest?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-5 py-2 bg-[#ef4444] text-white rounded-lg flex items-center gap-2 font-medium hover:bg-red-600 transition-colors" disabled={deleting}>
                {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} 
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-3xl">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#1f2937]">
          <br className="hidden sm:block" /> 
          </h1>
          <button 
            onClick={() => { setEditingGuest(null); setIsFormOpen(true); }} 
            className="px-6 py-2.5 bg-[#dbeafe] text-[#1e3a8a] font-semibold rounded-full flex items-center gap-2 hover:bg-[#bfdbfe] transition-colors"
          >
            <Plus size={20} /> Add New
          </button>
        </div>

        {/* Guest Cards Grid */}
        {guests.length === 0 ? (
          <div className="text-center text-gray-400 py-20 bg-white rounded-[24px] border border-gray-100 shadow-sm">
            <p className="font-medium text-lg">No guests added yet.</p>
            <p className="text-sm mt-1">Click the "Add New" button to add a prominent guest.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 justify-items-center">
            {guests.map((guest) => (
              <GuestCard 
                key={`card-${guest.id}`} 
                guest={guest} 
                onEdit={(g) => { setEditingGuest(g); setIsFormOpen(true); }} 
                onDelete={setDeleteId} 
              />
            ))}
          </div>
        )}

      </div>

      {/* Form Drawer */}
      {isFormOpen && (
        <GuestFormModal 
          guest={editingGuest} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => { fetchGuests(); setIsFormOpen(false); }} 
        />
      )}

    </div>
  );
};

export default EminentGuestsAdmin;