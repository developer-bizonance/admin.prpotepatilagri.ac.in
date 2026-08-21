"use client";
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

// PORT 4001 WALA SAHI URL
const API_URL = "http://localhost:4001/api/gallery-videos";

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

export default function VideoGallery() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [newVideo, setNewVideo] = useState({ title: '', url: '', description: '', featured: false });
  const [editingVideo, setEditingVideo] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await axios.get(API_URL);
      setVideos(res.data);
    } catch (err) {
      console.error("Error fetching gallery videos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!newVideo.title.trim() || !newVideo.url.trim()) return;

    setSubmitting(true);
    try {
      // Yahan bhi API_URL (http://localhost:4001) jaruri hai
      await axios.post(API_URL, newVideo);
      await fetchVideos();
      setNewVideo({ title: '', url: '', description: '', featured: false });
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to add video:", err);
      alert("Failed to add video");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditVideo = async (e) => {
    e.preventDefault();
    if (!editingVideo.title.trim() || !editingVideo.url.trim()) return;

    setSubmitting(true);
    try {
      // Yahan bhi API_URL (http://localhost:4001) jaruri hai
      await axios.post(API_URL, editingVideo);
      await fetchVideos();
      setEditingVideo(null);
      setShowEditForm(false);
    } catch (err) {
      console.error("Failed to update video:", err);
      alert("Failed to update video");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (video) => {
    setEditingVideo({ ...video });
    setShowEditForm(true);
  };

  const handleFeaturedToggle = async (video) => {
    try {
      const updatedData = { ...video, featured: !video.featured };
      await axios.post(API_URL, updatedData);
      setVideos(videos.map(v => v.id === video.id ? updatedData : v));
    } catch (err) {
      console.error("Failed to toggle featured:", err);
    }
  };

  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;
    try {
      // Delete ke liye bhi absolute URL
      await axios.delete(`${API_URL}/${videoToDelete.id}`);
      setVideos(videos.filter((video) => video.id !== videoToDelete.id));
      setShowDeleteConfirm(false);
      setVideoToDelete(null);
    } catch (err) {
      console.error("Failed to delete video:", err);
      alert("Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Video Gallery</h1>
            <p className="text-gray-600 mt-1 text-sm">Manage your video collection dynamically</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition shadow-md"
          >
            + Add New Video
          </button>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-base">No videos added yet. Click "+ Add New Video" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onFeaturedToggle={() => handleFeaturedToggle(video)}
                onDelete={() => { setVideoToDelete(video); setShowDeleteConfirm(true); }}
                onEdit={() => handleStartEdit(video)}
              />
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">Add New Video</h2>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
              </div>
              <form onSubmit={handleAddVideo} className="space-y-4 mt-4 flex-1">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Video Title *</label>
                  <input
                    type="text"
                    value={newVideo.title}
                    onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter video title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">YouTube URL or Iframe Embed Code *</label>
                  <textarea
                    rows={3}
                    value={newVideo.url}
                    onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    placeholder="https://www.youtube.com/watch?v=... or <iframe ...></iframe>"
                    required
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="add-featured"
                    checked={newVideo.featured}
                    onChange={(e) => setNewVideo({ ...newVideo, featured: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="add-featured" className="text-sm font-medium text-gray-700">Mark as Highlighted / Featured</label>
                </div>
                <div className="flex gap-3 pt-6">
                  <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 flex justify-center items-center gap-2">
                    {submitting && <Loader2 className="animate-spin" size={16} />} Save Video
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditForm && editingVideo && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">Edit Video</h2>
                <button onClick={() => setShowEditForm(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
              </div>
              <form onSubmit={handleEditVideo} className="space-y-4 mt-4 flex-1">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Video Title *</label>
                  <input
                    type="text"
                    value={editingVideo.title}
                    onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">YouTube URL or Iframe Embed Code *</label>
                  <textarea
                    rows={3}
                    value={editingVideo.url}
                    onChange={(e) => setEditingVideo({ ...editingVideo, url: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    required
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="edit-featured"
                    checked={editingVideo.featured}
                    onChange={(e) => setEditingVideo({ ...editingVideo, featured: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="edit-featured" className="text-sm font-medium text-gray-700">Mark as Highlighted / Featured</label>
                </div>
                <div className="flex gap-3 pt-6">
                  <button type="button" onClick={() => setShowEditForm(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 flex justify-center items-center gap-2">
                    {submitting && <Loader2 className="animate-spin" size={16} />} Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && videoToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
              <h3 className="font-bold text-lg mb-2 text-gray-800">Confirm Delete?</h3>
              <p className="text-sm text-gray-500 mb-6">Are you sure you want to remove "{videoToDelete.title}"?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium">Cancel</button>
                <button onClick={handleDeleteVideo} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const VideoCard = ({ video, onFeaturedToggle, onDelete, onEdit }) => {
  const embedSrc = getEmbedSrc(video.url);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col">
      <div className="relative pt-[56.25%] bg-gray-100 overflow-hidden">
        {embedSrc ? (
          <iframe
            src={embedSrc}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">Invalid URL</div>
        )}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={onFeaturedToggle}
            className={`rounded-full p-2 shadow-lg transition-transform hover:scale-110 ${
              video.featured ? 'bg-yellow-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'
            }`}
          >
            ★
          </button>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <h3 className="font-bold text-gray-900 text-base line-clamp-1">{video.title}</h3>
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            video.featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {video.featured ? 'Highlighted' : 'Standard'}
          </span>
          <div className="flex gap-2">
            <button onClick={onEdit} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100">Edit</button>
            <button onClick={onDelete} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};