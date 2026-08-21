"use client";
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, AlertTriangle, GripVertical, Building2 } from "lucide-react";
import axios from "axios";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const API_BASE_URL = "http://localhost:4001";
const API_BASE = `${API_BASE_URL}/api/facilities`;

const CATEGORIES = ["Campus", "Module", "Sport", "Cafeteria"];

const SortablePhotoCard = ({ photo, handleEdit, confirmDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id.toString() });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-2xl shadow-lg overflow-hidden w-64 h-full flex flex-col group border border-gray-100 relative">
      <div className="relative pt-[70%] bg-gray-100">
        <img src={photo.imageUrl} alt={photo.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute bottom-2 right-2 flex items-center gap-2 rounded-full p-1">
          <div {...attributes} {...listeners} className="p-2 bg-white/90 text-gray-600 hover:text-gray-900 cursor-grab active:cursor-grabbing hover:bg-white rounded-full transition-colors shadow-sm">
            <GripVertical size={16} />
          </div>
          <button onClick={(e) => { e.stopPropagation(); handleEdit(photo); }} className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 shadow-sm transition-colors">
            <Edit2 className="w-4 h-4 text-blue-700" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); confirmDelete(photo); }} className="p-2 bg-red-100 rounded-full hover:bg-red-200 shadow-sm transition-colors">
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
      <div className="pt-4 px-5 pb-5 flex-1 flex flex-col justify-end">
        <h3 className="text-sm font-bold line-clamp-2 text-gray-800">{photo.title || "Untitled"}</h3>
        <div className="flex gap-1 mt-2 flex-wrap">
          <span className="text-[10px] font-semibold bg-[#dbeafe] text-blue-800 px-2 py-0.5 rounded-md">
            {photo.category}
          </span>
          {photo.sub_category && (
            <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
              {photo.sub_category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const FacilitiesAdmin = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeId, setActiveId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [photoData, setPhotoData] = useState({ title: "", category: "", sub_category: "", imagePreviews: [], imageFiles: [] });
  const [photosByCategory, setPhotosByCategory] = useState({});
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_BASE);

      const grouped = response.data.reduce((acc, photo) => {
        const cat = photo.sub_category || photo.category || "General";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({
          id: photo.id,
          title: photo.title,
          category: photo.category || "Campus",
          sub_category: photo.sub_category || "General",
          imageUrl: photo.image_url?.startsWith("http") ? photo.image_url : `${API_BASE_URL}/${photo.image_url?.replace(/^\//, "")}`,
          sequence_order: photo.sequence_order || 0,
        });
        return acc;
      }, {});

      Object.keys(grouped).forEach((cat) => {
        grouped[cat].sort((a, b) => a.sequence_order - b.sequence_order);
      });

      setPhotosByCategory(grouped);
    } catch (error) {
      console.error("Error fetching facilities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPhotos(); }, []);

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      const currentList = [...currentPhotos];
      const oldIndex = currentList.findIndex((p) => p.id.toString() === active.id);
      const newIndex = currentList.findIndex((p) => p.id.toString() === over.id);
      const newItems = arrayMove(currentList, oldIndex, newIndex);
      const sequenceData = newItems.map((item, index) => ({ id: item.id, sequence_order: index }));

      try {
        await axios.post(`${API_BASE}/reorder`, { sequence: sequenceData });
        fetchPhotos();
      } catch (error) {
        console.error("Failed to update sequence");
      }
    }
  };

  const currentPhotos = activeCategory === "All"
    ? Object.values(photosByCategory).flat().sort((a, b) => a.sequence_order - b.sequence_order)
    : photosByCategory[activeCategory] || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoData.category) return alert("Category is required");

    const data = new FormData();
    data.append("title", photoData.title.trim());
    data.append("category", photoData.category);
    data.append("sub_category", photoData.sub_category ? photoData.sub_category.trim() : photoData.category);

    if (editingId) {
      if (photoData.imageFiles[0]) data.append("image", photoData.imageFiles[0]);
    } else {
      photoData.imageFiles.forEach((file) => {
        data.append("images", file);
      });
    }

    try {
      const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
      const method = editingId ? "put" : "post";
      await axios[method](url, data);
      fetchPhotos();
      resetForm();
      setShowForm(false);
    } catch (error) {
      alert("Save failed");
    }
  };

  const handleDelete = async () => {
    if (!photoToDelete) return;
    try {
      await axios.delete(`${API_BASE}/${photoToDelete.id}`);
      fetchPhotos();
      setPhotoToDelete(null);
    } catch (error) {
      alert("Delete failed");
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPhotoData(prev => ({
        ...prev,
        imageFiles: editingId ? [files[0]] : [...prev.imageFiles, ...files],
        imagePreviews: editingId ? newPreviews : [...prev.imagePreviews, ...newPreviews]
      }));
    }
  };

  const handleEdit = (photo) => {
    setPhotoData({
      title: photo.title,
      category: photo.category,
      sub_category: photo.sub_category,
      imagePreviews: [photo.imageUrl],
      imageFiles: []
    });
    setEditingId(photo.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setPhotoData({ title: "", category: "", sub_category: "", imagePreviews: [], imageFiles: [] });
    setEditingId(null);
  };

  const subCategoriesList = Object.keys(photosByCategory);
  const tabOptions = ["All", ...subCategoriesList];

  if (loading) return <div className="p-10 text-center text-blue-700 font-medium">Loading Facilities...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-6">
        <h1 className="text-xl md:text-3xl font-bold text-gray-800">
          Facilities Admin
        </h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-[#dbeafe] hover:bg-blue-200 text-blue-900 px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-sm transition-colors">
          <Plus size={20} /> Add Images
        </button>
      </header>

      <div className="max-w-6xl mx-auto flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabOptions.map((tab) => (
          <button key={tab} onClick={() => setActiveCategory(tab)} className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shadow-sm ${activeCategory === tab ? "bg-[#dbeafe] text-blue-950 font-bold border border-blue-200" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
            {tab}
          </button>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={currentPhotos.map((p) => p.id.toString())} strategy={rectSortingStrategy}>
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentPhotos.map((photo) => (
              <SortablePhotoCard key={photo.id} photo={photo} handleEdit={handleEdit} confirmDelete={setPhotoToDelete} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Delete Modal */}
      {photoToDelete && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center shadow-xl">
            <AlertTriangle className="text-red-500 w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800">Delete Image?</h3>
            <p className="text-sm text-gray-500 mt-2 truncate">{photoToDelete.title || "Untitled"}</p>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setPhotoToDelete(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Sliding Form */}
      <div className={`fixed inset-0 z-50 transition-all ${showForm ? "visible" : "invisible"}`}>
        <div className={`absolute inset-0 bg-black/50 transition-opacity ${showForm ? "opacity-100" : "opacity-0"}`} onClick={() => setShowForm(false)} />
        <div className={`absolute inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl transition-transform duration-300 ${showForm ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">{editingId ? "Edit Image" : "Add Images"}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-gray-100 text-gray-500"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="text-sm font-bold block mb-2 text-gray-700">Image Title (Optional)</label>
                <input type="text" placeholder="Enter title" className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300" value={photoData.title} onChange={(e) => setPhotoData({ ...photoData, title: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-bold block mb-2 text-gray-700">Main Category *</label>
                <select value={photoData.category} onChange={(e) => setPhotoData({ ...photoData, category: e.target.value })} className="p-3 border rounded-xl bg-white w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300" required>
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold block mb-2 text-gray-700">Sub-Category (e.g. Indoor, Outdoor) *</label>
                <input type="text" placeholder="Enter sub-category name" className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300" value={photoData.sub_category} onChange={(e) => setPhotoData({ ...photoData, sub_category: e.target.value })} required />
              </div>

              <div>
                <label className="text-sm font-bold block mb-2 text-gray-700">Upload Images (Multiple Allowed) *</label>
                <div className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-4 bg-gray-50">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {photoData.imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative h-24 rounded-lg overflow-hidden border">
                        <img src={src} className="w-full h-full object-cover" alt="preview" />
                        <button type="button" onClick={() => {
                          setPhotoData(prev => ({
                            ...prev,
                            imagePreviews: prev.imagePreviews.filter((_, i) => i !== idx),
                            imageFiles: prev.imageFiles.filter((_, i) => i !== idx)
                          }));
                        }} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => document.getElementById("img-up").click()} className="w-full py-3 bg-white border border-blue-300 text-blue-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-50">
                    <Plus size={18} /><span>Select Images</span>
                  </button>
                  <input type="file" id="img-up" hidden multiple accept="image/*" onChange={handleImageUpload} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">Cancel</button>
                <button type="submit" className="py-3 bg-[#dbeafe] hover:bg-blue-200 text-blue-900 rounded-xl font-bold shadow-sm transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilitiesAdmin;