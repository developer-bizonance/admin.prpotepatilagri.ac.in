"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  BookOpen,
  Image as ImageIcon,
  Link as LinkIcon,
  Building2,
  GripHorizontal // Drag karne ke icon ke liye add kiya hai
} from "lucide-react";

// SAHI BACKEND URL ADD KIYA GAYA HAI
const BACKEND_URL = "http://localhost:4001";

// URL ko sahi format me badalne ka helper
const getValidUrl = (url) => {
  if (!url) return null;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

// ✅ SAFE IMAGE URL COMBINER (Added to fix rendering issue)
const getFullImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_URL}${safePath}`;
};

const OurInstitutes = () => {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingInstitute, setEditingInstitute] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Drag and Drop Logic ke liye Refs
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    link: "",
    image: null,
    imagePreview: null,
  });

  // --- 1. FETCH DATA FROM BACKEND ---
  useEffect(() => {
    fetchInstitutes();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/institutes`);
      const data = await res.json();
      setInstitutes(data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  // --- DRAG AND DROP HANDLER ---
  const handleSort = () => {
    let _institutes = [...institutes];
    // Dragged item ko purani jagah se hataya
    const draggedItemContent = _institutes.splice(dragItem.current, 1)[0];
    // Nayi jagah (jahan drop kiya) wahan set kiya
    _institutes.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    setInstitutes(_institutes);
  };

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file (JPG, PNG, etc.)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: file,
          imagePreview: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: null, imagePreview: null });
  };

  const handleAddNew = () => {
    setEditingInstitute(null);
    setFormData({ title: "", link: "", image: null, imagePreview: null });
    setShowForm(true);
  };

  const handleEdit = (institute) => {
    setEditingInstitute(institute);
    setFormData({
      title: institute.title,
      link: institute.link || "", 
      image: null,
      imagePreview: institute.imageUrl || null,
    });
    setShowForm(true);
  };

  const handleDeleteClick = (institute) => {
    setEditingInstitute(institute);
    setShowDeleteConfirm(true);
  };

  // --- 2. DELETE FROM BACKEND ---
  const confirmDelete = async () => {
    if (editingInstitute) {
      try {
        await fetch(`${BACKEND_URL}/api/institutes/${editingInstitute.id}`, {
          method: "DELETE",
        });
        setInstitutes(
          institutes.filter((inst) => inst.id !== editingInstitute.id)
        );
        setShowDeleteConfirm(false);
        setEditingInstitute(null);
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  // --- 3. SAVE TO BACKEND ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("Please enter a title");
    if (!formData.imagePreview && !editingInstitute)
      return alert("Please select an image");

    setIsUploading(true);
    const apiData = new FormData();
    if (editingInstitute) apiData.append("id", editingInstitute.id);
    apiData.append("title", formData.title);
    apiData.append("link", formData.link); 

    if (formData.image) {
      apiData.append("imageFile", formData.image);
    } else {
      apiData.append("existingImage", formData.imagePreview);
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/institutes`, {
        method: "POST",
        body: apiData,
      });

      if (response.ok) {
        await fetchInstitutes();
        setShowForm(false);
        setEditingInstitute(null);
      }
    } catch (error) {
      alert("Operation failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- INSTITUTE CARD COMPONENT ---
  const InstituteCard = ({ institute, index }) => {
    const validLink = getValidUrl(institute.link);
    // ✅ FIXED: Using getFullImageUrl helper here
    const imageSrc = getFullImageUrl(institute.imageUrl);

    return (
      <div 
        draggable
        onDragStart={(e) => (dragItem.current = index)}
        onDragEnter={(e) => (dragOverItem.current = index)}
        onDragEnd={handleSort}
        onDragOver={(e) => e.preventDefault()}
        className="bg-white rounded-xl w-full shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group border border-gray-200 flex flex-col relative"
      >
        {/* DRAG HANDLE (Icon at Top Left) */}
        <div className="absolute top-2 left-2 z-20 p-1.5 bg-white/90 backdrop-blur-sm text-gray-400 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:text-gray-800 transition">
           <GripHorizontal size={18} />
        </div>

        <div className="relative w-full h-48 bg-gray-100 overflow-hidden flex items-center justify-center p-4">
          
          {/* IMAGE WITH REDIRECT LINK */}
          {imageSrc ? (
            validLink ? (
              <a href={validLink} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center z-10 cursor-pointer">
                <img
                  src={imageSrc}
                  alt={institute.title}
                  draggable={false} // Taki picture drag na ho balki card drag ho
                  className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </a>
            ) : (
              <img
                src={imageSrc}
                alt={institute.title}
                draggable={false}
                className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300 z-10"
              />
            )
          ) : (
            <Building2 className="w-12 h-12 text-gray-300" />
          )}
          
          {/* ACTION BUTTONS (Edit / Delete) */}
          <div className="absolute bottom-3 right-2 flex gap-2 z-20">
            <button
              onClick={() => handleEdit(institute)}
              className="p-2 bg-blue-200/90 text-blue-700 backdrop-blur-sm rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteClick(institute)}
              className="p-2 bg-red-200/90 text-red-700 backdrop-blur-sm rounded-xl hover:bg-red-100 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-gray-900 text-center leading-tight break-words flex items-center mb-2">
            {institute.title}
          </h3>
          {validLink && (
            <a 
              href={validLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md z-10"
            >
              <LinkIcon size={12} /> View Website
            </a>
          )}
        </div>
      </div>
    );
  };

  if (loading)
    return <div className="text-center py-20">Loading Institutes...</div>;

  return (
    <div className="w-full">
      <div className="mb-8 flex justify-end">
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-6 py-3 bg-blue-400/30 text-blue-950 rounded-3xl transition-colors font-medium shadow-md hover:bg-blue-400/40"
        >
          <Plus className="w-5 h-5" /> Add New
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {institutes.map((institute, index) => (
          // Index pass kar rahe hain Drag & Drop ke liye
          <InstituteCard key={institute.id} institute={institute} index={index} />
        ))}
      </div>

      {institutes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <BookOpen className="w-16 h-16 text-blue-100 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No institutes added yet
          </h3>
          <button
            onClick={handleAddNew}
            className="px-6 py-3 bg-blue-400/30 text-blue-950 rounded-3xl font-medium mt-4"
          >
            Add New
          </button>
        </div>
      )}

      {/* Sidebar Form Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl transform transition-transform duration-300 z-[60] ${showForm ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
            <h2 className="text-xl font-bold">
              {editingInstitute ? "Edit Institute" : "Add New Institute"}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              disabled={isUploading}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Institute Title *
                </label>
                <input
                  type="text"
                  name="title"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter institute title..."
                  value={formData.title}
                  onChange={handleInputChange}
                  disabled={isUploading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Website Link (Optional)
                </label>
                <input
                  type="url"
                  name="link"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://example.com"
                  value={formData.link}
                  onChange={handleInputChange}
                  disabled={isUploading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Institute Logo *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="institute-image-upload"
                    disabled={isUploading}
                  />
                  {formData.imagePreview ? (
                    <div className="relative">
                      <img
                        src={getFullImageUrl(formData.imagePreview)}
                        className="max-h-48 mx-auto rounded-lg w-full object-contain bg-gray-50 p-2"
                        alt="Preview"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-2xl hover:bg-red-700"
                        disabled={isUploading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="institute-image-upload"
                      className="cursor-pointer block py-4"
                    >
                      <ImageIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 font-medium">
                        Choose Image
                      </p>
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-5 py-3 border rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {isUploading
                    ? "Saving..."
                    : editingInstitute
                      ? "Save Changes"
                      : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-[50]"
          onClick={() => !isUploading && setShowForm(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 text-center">
            <Trash2 className="text-red-600 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{editingInstitute?.title}"?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-5 py-3 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-5 py-3 bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OurInstitutes;