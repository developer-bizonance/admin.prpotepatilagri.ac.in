"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Trash2,
  Edit2,
  Plus,
  X,
  Image as ImageIcon,
  AlertTriangle,
  Link as LinkIcon,
  Sparkles,
  ExternalLink,
  Loader2,
} from "lucide-react";

const BACKEND_URL = "http://localhost:4001";
const API_URL = `${BACKEND_URL}/api/popup-events`;
const UPLOAD_URL = `${BACKEND_URL}/uploads/images/popups`;

const PopupEventsDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    link: "",
    buttonText: "",
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      if (Array.isArray(res.data)) {
        setEvents(res.data);
      }
    } catch (err) {
      console.error("Error fetching popups", err);
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = (urlString) => {
    const urlPattern = new RegExp(
      "^(https?:\\/\\/)?" +
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
      "((\\d{1,3}\\.){3}\\d{1,3}))" +
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
      "(\\?[;&a-z\\d%_.~+=-]*)?" +
      "(\\#[-a-z\\d_]*)?$",
      "i"
    );
    return !!urlPattern.test(urlString);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setPreviews(selectedFiles.map((f) => URL.createObjectURL(f)));
    }
  };

  const savePopup = async (e) => {
    if (e) e.preventDefault();
    if (files.length === 0 && !editingId) return alert("Banner Image is required!");

    if (formData.buttonText !== "" && formData.link.trim() === "") {
      return alert("Link URL is mandatory when a button is selected!");
    }

    if (formData.link.trim() !== "" && !isValidUrl(formData.link)) {
      return alert("Please enter a valid URL (e.g., https://www.example.com)");
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("link", formData.link.trim());
      data.append("buttonText", formData.buttonText);
      files.forEach((file) => data.append("images", file));

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(API_URL, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      resetForm();
      setShowForm(false);
      fetchEvents();
    } catch (error) {
      console.error("Error saving popup:", error);
      alert("Failed to save popup banner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`${API_URL}/${itemToDelete.id}`);
      setItemToDelete(null);
      fetchEvents();
    } catch (error) {
      console.error("Error deleting popup:", error);
      alert("Failed to delete popup banner.");
    }
  };

  const handleEdit = (ev) => {
    setFormData({
      title: ev.title || "",
      link: ev.link || "",
      buttonText: ev.buttonText || "",
    });
    setEditingId(ev.id);
    if (ev.images && ev.images.length > 0) {
      setPreviews(
        ev.images.map((img) =>
          img.startsWith("http") ? img : `${UPLOAD_URL}/${img}`
        )
      );
    } else {
      setPreviews([]);
    }
    setFiles([]);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ title: "", link: "", buttonText: "" });
    setEditingId(null);
    setFiles([]);
    setPreviews([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 animate-pulse">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-end">
            <div className="w-36 h-10 bg-gray-200 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4"
              >
                <div className="w-full h-48 bg-gray-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-8 bg-gray-200 rounded-lg w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Top Header Action */}
      <div className="max-w-6xl mx-auto flex justify-end items-center mb-6">
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-[#dbeafe] hover:bg-blue-200 text-blue-950 px-5 py-2.5 rounded-xl font-medium flex items-center gap-1.5 shadow-sm transition-all text-sm"
        >
          <Plus size={18} /> Add Banner
        </button>
      </div>

      {/* Grid of Popup Cards */}
      <div className="max-w-6xl mx-auto">
        {events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => {
              const imageSrc = ev.images?.[0]
                ? ev.images[0].startsWith("http")
                  ? ev.images[0]
                  : `${UPLOAD_URL}/${ev.images[0]}`
                : null;

              return (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col group border border-gray-100 relative hover:shadow-xl transition-all duration-300"
                >
                  {/* Banner Preview */}
                  <div className="relative pt-[60%] bg-gray-100 overflow-hidden">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={ev.title || "Popup Banner"}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon size={36} />
                        <span className="text-xs mt-1">No Image</span>
                      </div>
                    )}

                    {/* Action buttons on banner overlay */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(ev);
                        }}
                        className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 shadow-md transition-colors"
                        title="Edit Popup"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(ev);
                        }}
                        className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 shadow-md transition-colors"
                        title="Delete Popup"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Info Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 line-clamp-1">
                        {ev.title || "Untitled Announcement"}
                      </h3>

                      {ev.link ? (
                        <a
                          href={ev.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1.5 line-clamp-1"
                        >
                          <LinkIcon size={12} className="shrink-0" />
                          <span className="truncate">{ev.link}</span>
                          <ExternalLink size={10} className="shrink-0" />
                        </a>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1 italic">
                          No external link attached
                        </p>
                      )}
                    </div>

                    {/* Badge Row */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                      {ev.buttonText ? (
                        <span className="text-[10px] font-semibold bg-[#dbeafe] text-blue-900 px-2.5 py-1 rounded-md uppercase tracking-wider">
                          Button: {ev.buttonText}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md">
                          Banner Only
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-xl mx-auto">
            <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-700 mb-1">
              No Popup Banners Found
            </h3>
            <p className="text-xs text-gray-500">
              Create your first popup banner using the button above.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center shadow-xl">
            <AlertTriangle className="text-red-500 w-12 h-12 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-gray-800">Delete Popup Banner?</h3>
            <p className="text-sm text-gray-500 mt-2 truncate">
              {itemToDelete.title || "Untitled Popup Banner"}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors text-sm shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sliding Form Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-all ${showForm ? "visible" : "invisible"
          }`}
      >
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${showForm ? "opacity-100" : "opacity-0"
            }`}
          onClick={() => setShowForm(false)}
        />
        <div
          className={`absolute inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl transition-transform duration-300 ${showForm ? "translate-x-0" : "translate-x-full"
            }`}
        >
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? "Edit Popup Banner" : "Add New Banner"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-full p-2 hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Form */}
            <form onSubmit={savePopup} className="p-6 space-y-6 flex-1">
              <div>
                <label className="text-sm font-bold block mb-2 text-gray-700">
                  Popup Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter popup title or announcement heading"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm text-gray-800"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-bold block mb-2 text-gray-700">
                  Target Link / URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://www.example.com/admission"
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm text-gray-800 ${formData.buttonText !== "" && formData.link.trim() === ""
                      ? "border-red-500"
                      : "border-gray-300"
                    }`}
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                />
                {formData.buttonText !== "" && formData.link.trim() === "" && (
                  <p className="text-xs text-red-500 mt-1">
                    Link is required when action button is selected.
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-bold block mb-2 text-gray-700">
                  Action Button Label
                </label>
                <select
                  className="p-3 border border-gray-300 rounded-xl bg-white w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                  value={formData.buttonText}
                  onChange={(e) =>
                    setFormData({ ...formData, buttonText: e.target.value })
                  }
                >
                  <option value="">No Button (Banner Only)</option>
                  <option value="Learn More">Learn More</option>
                  <option value="Apply Now">Apply Now</option>
                  <option value="Register Now">Register Now</option>
                  <option value="Pay Now">Pay Now</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold block mb-2 text-gray-700">
                  Banner Image *
                </label>
                <div className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-4 bg-gray-50 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  {previews.length > 0 ? (
                    <div className="relative max-h-52 rounded-xl overflow-hidden border border-gray-200 mb-3 bg-white">
                      <img
                        src={previews[0]}
                        alt="Banner Preview"
                        className="w-full h-44 object-contain mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviews([]);
                          setFiles([]);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:scale-105 transition-transform"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="py-8 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="mx-auto w-10 h-10 text-blue-500 mb-2" />
                      <p className="text-sm font-medium text-gray-700">
                        Click to upload banner image
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Supports PNG, JPG, JPEG, WebP
                      </p>
                    </div>
                  )}

                  {previews.length > 0 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2 px-4 bg-white border border-blue-300 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-50 transition-colors"
                    >
                      Change Image
                    </button>
                  )}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-3 bg-[#dbeafe] hover:bg-blue-200 text-blue-900 rounded-xl font-bold shadow-sm transition-colors text-sm flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : editingId ? (
                    "Update Banner"
                  ) : (
                    "Save Banner"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupEventsDashboard;
