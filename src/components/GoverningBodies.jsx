"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil, Trash2, FileText, X, FilePlus, Loader2, Building2
} from "lucide-react";
import DeleteModal from "./uic/deletemodal"; // Make sure path is correct for your project

const GoverningBodiesAdmin = () => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Drawer & Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [pdfFile, setPdfFile] = useState(null); 
  const [currentFileName, setCurrentFileName] = useState(""); 

  // Delete State
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // 🌟 Backend API endpoint for Governing Bodies 🌟
  const BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:4001";
  const API_ENDPOINT = `${BASE_URL}/api/governing-bodies`; // Backend me ye route banana hoga

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(API_ENDPOINT);
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();

      const formattedRecords = data.map((item) => ({
        id: item.id,
        title: item.title,
        pdfFile: item.pdf_path ? { name: item.pdf_name, url: item.pdf_path } : null,
      }));

      setRecords(formattedRecords);
    } catch (error) {
      console.error("Error loading governing bodies docs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDrawerToAdd = () => {
    setEditingId(null);
    setTitle("");
    setPdfFile(null);
    setCurrentFileName("");
    setIsDrawerOpen(true);
  };

  const openDrawerToEdit = (record) => {
    setEditingId(record.id);
    setTitle(record.title);
    setPdfFile(null);
    setCurrentFileName(record.pdfFile ? record.pdfFile.name : "");
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
    setTitle("");
    setPdfFile(null);
    setCurrentFileName("");
  };

  const handlePdfSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else if (file) {
      alert("Please upload a PDF file only.");
      e.target.value = "";
    }
  };

  const saveChanges = async () => {
    if (!title.trim() || title.trim().length < 3 || title.trim().length > 100) {
      return alert("Title must be between 3 and 100 characters.");
    }
    
    if (!pdfFile && !editingId) {
      return alert("Please select a PDF file to upload.");
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.append("title", title.trim());
    
    if (pdfFile) {
      // ✅ FIX: Changed from "pdfFile" to "file" to match backend Multer expectation
      formData.append("file", pdfFile);
    }

    try {
      let url = editingId ? `${API_ENDPOINT}/${editingId}` : API_ENDPOINT;
      let method = editingId ? "PUT" : "POST";

      const res = await fetch(url, { method, body: formData });
      if (res.ok) {
        await fetchRecords();
        closeDrawer();
      } else {
        alert("Failed to save data to server.");
      }
    } catch (error) {
      alert("Error connecting to server.");
    } finally {
      setIsSaving(false);
    }
  };

  const triggerDelete = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`${API_ENDPOINT}/${deleteId}`, { method: "DELETE" });
      await fetchRecords();
    } catch (error) {
      console.error(error);
    }
    setShowConfirm(false);
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-800">
              Governing Bodies
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage documents and PDFs for the Governing Bodies section.</p>
          </div>
          <button 
            onClick={openDrawerToAdd} 
            className="bg-[#dbeafe] hover:bg-blue-200 text-blue-900 px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <FilePlus size={20} /> Add New
          </button>
        </header>

        {/* Records List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-700">Uploaded Documents</h3>
          </div>
          
          <div className="p-6 space-y-4">
            {records.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-500 font-medium">No documents uploaded yet. Click "Add New" to start.</p>
              </div>
            ) : (
              records.map((record) => (
                <div key={record.id} className="group flex gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 items-center hover:border-blue-300 transition-colors">
                  <div className="p-3 bg-red-100 text-red-500 rounded-lg">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-800 truncate">{record.title}</p>
                    <p className="text-xs font-medium text-gray-500 mt-1 truncate max-w-[300px]">
                      {record.pdfFile?.name || "No File"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openDrawerToEdit(record)} className="p-2.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-full transition-colors shadow-sm">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => triggerDelete(record.id)} className="p-2.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-full transition-colors shadow-sm">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Side Panel (Drawer) for Adding/Editing */}
        <AnimatePresence>
          {isDrawerOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={closeDrawer} 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ x: "100%" }} 
                animate={{ x: 0 }} 
                exit={{ x: "100%" }} 
                transition={{ type: "spring", damping: 25, stiffness: 200 }} 
                className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10"
              >
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingId ? "Edit Document" : "Add New Document"}
                  </h2>
                  <button onClick={closeDrawer} className="p-2 hover:bg-gray-100 text-gray-500 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                  {/* Title Input */}
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">Document Title *</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      maxLength={100} 
                      className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700" 
                      placeholder="e.g., Annual Governing Body Meeting 2026" 
                      required 
                    />
                  </div>

                  {/* PDF Upload Section */}
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">Upload PDF *</label>
                    
                    {editingId && currentFileName && !pdfFile && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                        <FileText size={20} className="text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">CURRENT FILE</p>
                          <p className="text-sm font-semibold text-gray-700 truncate">{currentFileName}</p>
                        </div>
                      </div>
                    )}

                    {pdfFile ? (
                      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 p-2.5 rounded-lg"><FileText size={24} className="text-red-600" /></div>
                          <span className="text-sm font-bold text-gray-700 truncate max-w-[200px]">{pdfFile.name}</span>
                        </div>
                        <button onClick={() => setPdfFile(null)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer group">
                        <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                          <FilePlus size={24} className="text-blue-500" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {editingId ? "Upload New PDF (Optional)" : "Click to select PDF File"}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">PDF format only (Max 10MB)</span>
                        <input type="file" accept=".pdf" hidden onChange={handlePdfSelect} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                  <button onClick={closeDrawer} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">
                    Cancel
                  </button>
                  <button 
                    onClick={saveChanges} 
                    disabled={!title.trim() || title.trim().length < 3 || isSaving} 
                    className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all ${title.trim().length >= 3 ? "bg-[#dbeafe] hover:bg-blue-200 text-blue-900" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : (editingId ? "Update Document" : "Save Document")}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal show={showConfirm} onConfirm={handleConfirmDelete} onCancel={() => setShowConfirm(false)} />
    </div>
  );
};

export default GoverningBodiesAdmin;