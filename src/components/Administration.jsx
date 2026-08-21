import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil,
  Trash2,
  FileText,
  X,
  FilePlus,
  Loader2,
  BookOpen,
  FileCheck,
  PhoneCall,
  IndianRupee,
  FileSignature
} from "lucide-react";
import DeleteModal from "./uic/deletemodal";

// Categories Define ki hain dashboard ke liye
const admissionCategories = [
  { id: "course-layout", title: "Course Layout", icon: BookOpen, desc: "Manage semester-wise course layouts and syllabus." },
  { id: "eligibility", title: "Eligibility Criteria", icon: FileCheck, desc: "Upload degree courses and eligibility criteria PDFs." },
  { id: "contact", title: "Admission Contact", icon: PhoneCall, desc: "Manage admission committee and contact details." },
  { id: "fee-structure", title: "Fee Structure", icon: IndianRupee, desc: "Manage FRA and college fee structure documents." },
  { id: "fra-proposal", title: "FRA Proposal 2026-27", icon: FileSignature, desc: "Upload FRA proposal and institute information." },
];

const Addmission = () => {
  const [tabs, setTabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Drawer State
  const [activeCategory, setActiveCategory] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form States
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Input States
  const [title, setTitle] = useState("");
  const [pdfFile, setPdfFile] = useState(null); 
  const [currentFileName, setCurrentFileName] = useState(""); 

  // Modal State
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // API Base URL
  const BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:4001";

  // --- 1. FETCH DATA ON LOAD ---
  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${BASE_URL}/api/admissions`);
      
      if (!res.ok) throw new Error("Failed to fetch data");
      
      const data = await res.json();

      const formattedTabs = data.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category || "course-layout", 
        pdfFile: item.pdf_path
          ? {
              name: item.pdf_name,
              uploadedDate: item.uploaded_date,
              url: item.pdf_path,
            }
          : null,
      }));

      setTabs(formattedTabs);
    } catch (error) {
      console.error("Error loading admissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const filteredTabs = tabs.filter(tab => tab.category === activeCategory?.id);

  // --- 2. HANDLERS ---
  const openDrawer = (category) => {
    setActiveCategory(category);
    setIsDrawerOpen(true);
    setShowForm(false);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setActiveCategory(null);
    setShowForm(false);
  };

  const startAddingTab = () => {
    setEditingId(null);
    setTitle("");
    setPdfFile(null);
    setCurrentFileName("");
    setShowForm(true);
  };

  const startEditing = (tab) => {
    setEditingId(tab.id);
    setTitle(tab.title);
    setPdfFile(null);
    setCurrentFileName(tab.pdfFile ? tab.pdfFile.name : "");
    setShowForm(true);
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

  const removeSelectedFile = () => setPdfFile(null);

  // --- 3. SAVE (CREATE OR UPDATE) ---
  const saveChanges = async () => {
    if (!title.trim() || title.trim().length < 5 || title.trim().length > 50) {
      return alert("Title must be between 5 and 50 characters.");
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("category", activeCategory.id);
    
    // 🌟 THE FIX: Backend ko batana zaroori hai ki type "pdf" hai 🌟
    formData.append("type", "pdf"); 

    if (pdfFile) {
      formData.append("pdfFile", pdfFile);
    } else if (!editingId) {
      alert("Please select a file to upload.");
      setIsSaving(false);
      return;
    }

    try {
      let url = `${BASE_URL}/api/admissions`;
      let method = "POST";

      if (editingId) {
        url = `${BASE_URL}/api/admissions/${editingId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method: method,
        body: formData,
      });

      if (res.ok) {
        await fetchAdmissions();
        setShowForm(false);
      } else {
        alert("Failed to save data to server.");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Error connecting to server.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- 4. DELETE FROM DATABASE ---
  const triggerDelete = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`${BASE_URL}/api/admissions/${deleteId}`, { method: "DELETE" });
      await fetchAdmissions();
    } catch (error) {
      console.error("Delete error:", error);
    }
    setShowConfirm(false);
    setDeleteId(null);
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        
        {/* DASHBOARD HEADER */}
        <div className="mb-10">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Admission Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Select a category below to manage its specific documents and PDFs.
          </p>
        </div>

        {/* 5 CATEGORY CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
          {admissionCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer group"
              onClick={() => openDrawer(cat)}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-blue-50 group-hover:bg-blue-100 p-4 rounded-2xl text-blue-600 transition-colors">
                  <cat.icon size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">
                    {cat.title}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-6 flex-1">
                {cat.desc}
              </p>
              <div className="mt-auto pt-4 border-t border-slate-100">
                <span className="text-orange-500 font-semibold text-sm group-hover:text-orange-600 transition-colors">
                  Manage Documents &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* SLIDING DRAWER */}
        <AnimatePresence>
          {isDrawerOpen && activeCategory && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeDrawer}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col"
              >
                
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-20">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                      <activeCategory.icon size={22} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {activeCategory.title}
                    </h2>
                  </div>
                  <button
                    onClick={closeDrawer}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
                  
                  {/* Action Header */}
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                      Uploaded Documents
                    </h4>
                    {!showForm && (
                      <button
                        onClick={startAddingTab}
                        className="bg-white border border-blue-200 text-blue-600 shadow-sm text-sm font-bold flex items-center gap-2 hover:bg-blue-50 px-5 py-2.5 rounded-xl transition-colors"
                      >
                        <FilePlus size={18} /> Upload PDF
                      </button>
                    )}
                  </div>

                  {/* FORM */}
                  {showForm && (
                    <div className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-md mb-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-semibold text-slate-800 mb-2 block">
                            {editingId ? `Edit ${activeCategory.title}` : `Add New ${activeCategory.title}`}
                          </label>
                          
                          {editingId && currentFileName && !pdfFile && (
                            <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
                              <FileText size={16} className="text-blue-500" />
                              <span className="text-xs font-medium text-slate-700">Current File:</span>
                              <span className="text-xs text-slate-600 truncate">{currentFileName}</span>
                            </div>
                          )}
                          
                          <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            maxLength={50}
                            className="w-full p-3 border border-slate-300 rounded-xl text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-medium" 
                            placeholder="Enter document title (5 to 50 characters)..." 
                            required 
                          />
                          <p className="text-xs text-gray-400 mb-4 text-right">
                            {title.length}/50 characters
                          </p>
                          
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                            {pdfFile ? (
                              <div className="flex-1 w-full flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-3">
                                  <div className="bg-red-100 p-2 rounded-lg"><FileText size={20} className="text-red-600" /></div>
                                  <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{pdfFile.name}</span>
                                </div>
                                <button onClick={removeSelectedFile} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors" type="button"><X size={16} /></button>
                              </div>
                            ) : (
                              <label className="flex-1 w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors group">
                                <span className="text-sm font-medium text-slate-600 group-hover:text-blue-600">{editingId ? "Choose a new PDF (Optional)" : "Click to select PDF File *"}</span>
                                <input type="file" accept=".pdf" hidden onChange={handlePdfSelect} />
                              </label>
                            )}
                            
                            <div className="flex gap-2 w-full md:w-auto">
                              <button 
                                onClick={saveChanges} 
                                disabled={!title.trim() || title.trim().length < 5 || isSaving} 
                                className={`px-6 py-3 rounded-xl font-semibold transition-colors w-full md:w-auto flex items-center justify-center gap-2 ${(title.trim() && title.trim().length >= 5) ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`} 
                                type="button"
                              >
                                {isSaving && <Loader2 size={16} className="animate-spin" />}
                                {editingId ? "Update" : "Upload"}
                              </button>
                              <button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors w-full md:w-auto" type="button">
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {filteredTabs.length === 0 && !showForm && (
                    <div className="text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
                      <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="text-slate-400" size={32} />
                      </div>
                      <p className="text-slate-600 font-medium mb-1">
                        No documents uploaded for {activeCategory.title} yet.
                      </p>
                      <p className="text-slate-400 text-sm mb-4">
                        Upload your first PDF to see it here.
                      </p>
                      <button
                        onClick={startAddingTab}
                        className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
                      >
                        Click here to Upload
                      </button>
                    </div>
                  )}

                  {/* List of Files */}
                  <div className="space-y-3">
                    {filteredTabs.map((tab) => (
                      <div
                        key={tab.id}
                        className="group relative flex gap-4 bg-white p-4 rounded-2xl border border-slate-200 items-center shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
                      >
                        <div className="p-3 bg-red-50 rounded-xl">
                          <FileText size={24} className="text-red-500" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-slate-800 truncate">
                            {tab.title}
                          </p>
                          <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                            {tab.pdfFile ? (
                              <>
                                <span className="truncate max-w-[150px] md:max-w-[250px] inline-block">
                                  {tab.pdfFile.name}
                                </span>
                                <span>•</span>
                                <span>{formatDate(tab.pdfFile.uploadedDate)}</span>
                              </>
                            ) : (
                              <span>No PDF uploaded</span>
                            )}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(tab)}
                            className="p-2.5 bg-slate-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => triggerDelete(tab.id)}
                            className="p-2.5 bg-slate-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <DeleteModal
        show={showConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};

export default Addmission;