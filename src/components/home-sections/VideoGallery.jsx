import React, { useState, useRef, useEffect } from "react";
import {
  Video as VideoIcon,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  X,
  Star,
  Loader2,
} from "lucide-react";

// --- YAHAN API URL THEEK KIYA HAI ---
const BACKEND_URL = "http://localhost:4001";

// Embed URL nikalne ka function (taaki admin mein bhi video dikhe)
const getEmbedSrc = (input) => {
  if (!input) return null;
  const srcMatch = input.match(/src=["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1]) return srcMatch[1];
  
  if (input.includes('youtube.com/watch?v=')) {
    const videoId = input.split('v=')[1]?.split('&')[0];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  if (input.includes('youtu.be/')) {
    const videoId = input.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  return input;
};

const VideoGallery = () => {
  const [videos, setVideos] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [newVideo, setNewVideo] = useState({
    title: "",
    url: "",
    description: "",
  });
  const [editingVideo, setEditingVideo] = useState(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showVideoDeleteConfirm, setShowVideoDeleteConfirm] = useState(false);
  const [showImageDeleteConfirm, setShowImageDeleteConfirm] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [imageToDelete, setImageToDelete] = useState(null);
  const imageFileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("videos");

  // --- 1. FETCH DATA FROM BACKEND ---
  useEffect(() => {
    fetchGalleryData();
  }, []);

  const fetchGalleryData = async () => {
    setLoading(true);
    try {
      // Yahan Absolute URL use kiya hai
      const [vRes, iRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/gallery-videos`),
        fetch(`${BACKEND_URL}/api/gallery/images`),
      ]);

      if (!vRes.ok || !iRes.ok) throw new Error("Failed to fetch gallery data");

      const vData = await vRes.json();
      const iData = await iRes.json();

      setVideos(vData || []);
      setImages(iData || []);
    } catch (e) {
      console.error("Error fetching gallery:", e);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. IMAGE HANDLERS ---
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("imageFiles", file));

    try {
      const res = await fetch(`${BACKEND_URL}/api/gallery/images`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await fetchGalleryData(); 
        alert("Images uploaded successfully!");
      } else {
        alert("Server error during upload");
      }
    } catch (e) {
      alert("Network error: Could not reach backend");
    } finally {
      setIsProcessing(false);
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async (id) => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/gallery/images/${id}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== id));
        setShowImageDeleteConfirm(false);
        setImageToDelete(null);
      }
    } catch (e) {
      alert("Delete failed");
    }
  };

  // --- 3. VIDEO HANDLERS ---
  const handleAddVideo = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/gallery-videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newVideo, featured: false }),
      });
      if (res.ok) {
        await fetchGalleryData();
        setNewVideo({ title: "", url: "", description: "" });
        setShowVideoForm(false);
      }
    } catch (e) {
      alert("Error adding video");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteVideo = async (id) => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/gallery-videos/${id}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== id));
        setShowVideoDeleteConfirm(false);
        setVideoToDelete(null);
      }
    } catch (e) {
      alert("Delete failed");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Tab and Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveTab("videos")}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === "videos" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            Videos
          </button>
          <button
            onClick={() => setActiveTab("images")}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === "images" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            Images
          </button>
        </div>

        <button
          disabled={isProcessing}
          onClick={() =>
            activeTab === "videos"
              ? setShowVideoForm(true)
              : imageFileInputRef.current.click()
          }
          className="flex items-center gap-2 px-6 py-2.5 bg-[#dbeafe] text-[#1e3a8a] rounded-full font-bold shadow-sm hover:bg-[#bfdbfe] transition-colors disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus size={18} strokeWidth={2.5} />
          )}
          {activeTab === "videos" ? "Add Video" : "Upload Images"}
        </button>
        <input
          type="file"
          ref={imageFileInputRef}
          multiple
          hidden
          onChange={handleImageUpload}
          accept="image/*"
        />
      </div>

      {activeTab === "videos" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((v) => {
            const embedSrc = getEmbedSrc(v.url);
            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-lg transition-shadow duration-300"
              >
                {/* VIDEO IFRAME CONTAINER */}
                <div className="relative pt-[56.25%] bg-gray-100 overflow-hidden">
                  {embedSrc ? (
                    <iframe
                      src={embedSrc}
                      title={v.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute top-0 left-0 w-full h-full z-0"
                    ></iframe>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <VideoIcon className="text-gray-400 w-10 h-10" />
                    </div>
                  )}

                  {/* FLOATING DELETE BUTTON (Top Right) */}
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => {
                        setVideoToDelete(v);
                        setShowVideoDeleteConfirm(true);
                      }}
                      className="w-8 h-8 flex items-center justify-center bg-white/95 backdrop-blur-sm text-red-500 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors shadow-md border border-gray-100"
                      title="Delete Video"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                {/* COMPACT BOTTOM CONTENT */}
                <div className="px-5 py-4 flex flex-col bg-white border-t border-gray-50">
                  <h3 className="font-extrabold text-[#1f2937] text-[16px] truncate mb-1">
                    {v.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 truncate">
                    {v.url}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group bg-gray-50 shadow-sm hover:shadow-md transition-shadow"
            >
              <img
                src={img.imageUrl ? `${img.imageUrl}` : null}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                alt={img.title || "Gallery"}
              />
              
              {/* FLOATING DELETE BUTTON FOR IMAGES */}
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => {
                    setImageToDelete(img);
                    setShowImageDeleteConfirm(true);
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-white/95 backdrop-blur-sm text-red-500 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors shadow-md border border-gray-100"
                  title="Delete Image"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Sidebar Form */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-[60] transform transition-transform duration-300 ${showVideoForm ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-gray-800">Add New Video</h2>
            <button
              onClick={() => setShowVideoForm(false)}
              className="hover:bg-gray-100 p-2 rounded-full text-gray-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleAddVideo} className="p-6 space-y-5 overflow-y-auto flex-1">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Video Title
              </label>
              <input
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter title"
                value={newVideo.title}
                onChange={(e) =>
                  setNewVideo({ ...newVideo, title: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Video URL
              </label>
              <input
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste YouTube/Vimeo link"
                value={newVideo.url}
                onChange={(e) =>
                  setNewVideo({ ...newVideo, url: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter description"
                value={newVideo.description}
                onChange={(e) =>
                  setNewVideo({ ...newVideo, description: e.target.value })
                }
                rows="4"
              />
            </div>
            
            <div className="pt-4 border-t border-gray-100 flex gap-3">
               <button
                  type="button"
                  onClick={() => setShowVideoForm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 py-3 bg-[#dbeafe] text-[#1e3a8a] rounded-xl font-bold hover:bg-[#bfdbfe] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                {isProcessing ? "Saving..." : "Save Video"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modals */}
      {(showVideoDeleteConfirm || showImageDeleteConfirm) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-500" size={24} />
            </div>
            <h3 className="font-bold text-xl mb-2 text-gray-900">
              Delete {showVideoDeleteConfirm ? "Video" : "Image"}?
            </h3>
            <p className="text-gray-500 mb-6 text-sm">
              This action cannot be undone. The file will be removed permanently.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowVideoDeleteConfirm(false);
                  setShowImageDeleteConfirm(false);
                }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  showVideoDeleteConfirm
                    ? handleDeleteVideo(videoToDelete.id)
                    : handleDeleteImage(imageToDelete.id)
                }
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
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

export default VideoGallery;