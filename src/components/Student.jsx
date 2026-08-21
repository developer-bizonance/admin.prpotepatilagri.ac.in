import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil, Trash2, FileText, X, FilePlus, Loader2,
  Calendar, ShieldCheck, Users, FileBadge, ExternalLink
} from "lucide-react";
import DeleteModal from "./uic/deletemodal";

// Categories Define ki hain student dashboard ke liye
const studentCategories = [
  { id: "academic-calendar", title: "Academic Calendar", icon: Calendar, desc: "Manage general and agriculture academic calendars." },
  { id: "academic-discipline", title: "Academic Discipline", icon: ShieldCheck, desc: "Manage rules, regulations, and discipline guidelines." },
  { id: "nss", title: "National Service Scheme", icon: Users, desc: "Upload NSS reports and activity documents." },
  { id: "university-result", title: "University Result", icon: FileBadge, desc: "Manage semester-wise university results." },
];

const StudentDashboard = () => {
  const [tabs, setTabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState("");
  const [uploadType, setUploadType] = useState("pdf"); 
  const [pdfFile, setPdfFile] = useState(null); 
  const [currentFileName, setCurrentFileName] = useState(""); 
  const [linkUrl, setLinkUrl] = useState(""); 

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:4001";

  useEffect(() => {
    fetchStudentDocs();
  }, []);

  const fetchStudentDocs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${BASE_URL}/api/student`);
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();

      const formattedTabs = data.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category || "academic-calendar",
        type: item.link ? "link" : "pdf",
        linkUrl: item.link || "",
        pdfFile: item.pdf_path ? { name: item.pdf_name, uploadedDate: item.uploaded_date, url: item.pdf_path } : null,
      }));

      setTabs(formattedTabs);
    } catch (error) {
      console.error("Error loading student docs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const filteredTabs = tabs.filter(tab => tab.category === activeCategory?.id);

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
    setUploadType("pdf");
    setPdfFile(null);
    setCurrentFileName("");
    setLinkUrl("");
    setShowForm(true);
  };

  const startEditing = (tab) => {
    setEditingId(tab.id);
    setTitle(tab.title);
    setUploadType(tab.type);
    if (tab.type === "link") {
      setLinkUrl(tab.linkUrl);
      setPdfFile(null);
      setCurrentFileName("");
    } else {
      setLinkUrl("");
      setPdfFile(null);
      setCurrentFileName(tab.pdfFile ? tab.pdfFile.name : "");
    }
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

  const saveChanges = async () => {
    if (!title.trim() || title.trim().length < 5 || title.trim().length > 50) {
      return alert("Title must be between 5 and 50 characters.");
    }
    if (uploadType === "link" && !linkUrl.trim()) {
      return alert("Please enter a valid link URL.");
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("category", activeCategory.id);
    formData.append("type", uploadType);

    if (uploadType === "pdf") {
      if (pdfFile) {
        formData.append("pdfFile", pdfFile);
      } else if (!editingId || (editingId && !currentFileName)) {
        setIsSaving(false);
        return alert("Please select a file to upload.");
      }
    } else if (uploadType === "link") {
      formData.append("link", linkUrl.trim());
    }

    try {
      let url = editingId ? `${BASE_URL}/api/student/${editingId}` : `${BASE_URL}/api/student`;
      let method = editingId ? "PUT" : "POST";

      const res = await fetch(url, { method, body: formData });
      if (res.ok) {
        await fetchStudentDocs();
        setShowForm(false);
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
      await fetch(`${BASE_URL}/api/student/${deleteId}`, { method: "DELETE" });
      await fetchStudentDocs();
    } catch (error) {
      console.error(error);
    }
    setShowConfirm(false);
    setDeleteId(null);
  };

  if (isLoading) return <div className="min-h-screen flex justify-center items-center bg-slate-50"><Loader2 className="animate-spin w-10 h-10 text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Resources Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage Calendars, NSS Reports, Discipline Rules and Results.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
          {studentCategories.map((cat) => (
            <div key={cat.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer group" onClick={() => openDrawer(cat)}>
              {/* 🌟 ICON AUR TITLE BOX UPDATED YAHAN PAR HAI 🌟 */}
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-50 group-hover:bg-blue-100 p-3 rounded-xl text-blue-600 transition-colors">
                  <cat.icon size={22} />
                </div>
                <div><h3 className="text-lg font-bold text-slate-800 leading-tight">{cat.title}</h3></div>
              </div>
              <p className="text-sm text-slate-500 mb-6 flex-1">{cat.desc}</p>
              <div className="mt-auto pt-4 border-t border-slate-100">
                <span className="text-orange-500 font-semibold text-sm group-hover:text-orange-600 transition-colors">Manage Data &rarr;</span>
              </div>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {isDrawerOpen && activeCategory && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDrawer} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
              <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col">
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-20">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600"><activeCategory.icon size={22} /></div>
                    <h2 className="text-xl font-bold text-slate-800">{activeCategory.title}</h2>
                  </div>
                  <button onClick={closeDrawer} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-semibold text-slate-700 flex items-center gap-2">Uploaded Records</h4>
                    {!showForm && (
                      <button onClick={startAddingTab} className="bg-white border border-blue-200 text-blue-600 shadow-sm text-sm font-bold flex items-center gap-2 hover:bg-blue-50 px-5 py-2.5 rounded-xl transition-colors">
                        <FilePlus size={18} /> Add New
                      </button>
                    )}
                  </div>

                  {showForm && (
                    <div className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-md mb-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-6 pb-2 border-b border-slate-100">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="uploadType" checked={uploadType === "pdf"} onChange={() => setUploadType("pdf")} className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-bold text-slate-700">Upload PDF</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="uploadType" checked={uploadType === "link"} onChange={() => setUploadType("link")} className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-bold text-slate-700">Provide URL Link</span>
                          </label>
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-slate-800 mb-2 block">{editingId ? `Edit ${activeCategory.title}` : `Add New ${activeCategory.title}`}</label>
                          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50} className="w-full p-3 border border-slate-300 rounded-xl text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-medium" placeholder="Enter title (5 to 50 characters)..." required />
                          <p className="text-xs text-gray-400 mb-4 text-right">{title.length}/50 characters</p>

                          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                            {uploadType === "pdf" && (
                              <div className="flex-1 w-full">
                                {editingId && currentFileName && !pdfFile && (
                                  <div className="mb-2 p-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
                                    <FileText size={16} className="text-blue-500" />
                                    <span className="text-xs text-slate-600 truncate">Current: {currentFileName}</span>
                                  </div>
                                )}
                                {pdfFile ? (
                                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-3">
                                      <div className="bg-red-100 p-2 rounded-lg"><FileText size={20} className="text-red-600" /></div>
                                      <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">{pdfFile.name}</span>
                                    </div>
                                    <button onClick={() => setPdfFile(null)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"><X size={16} /></button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-blue-50 cursor-pointer">
                                    <span className="text-sm font-medium text-slate-600">{editingId ? "Choose a new PDF (Optional)" : "Click to select PDF File *"}</span>
                                    <input type="file" accept=".pdf" hidden onChange={handlePdfSelect} />
                                  </label>
                                )}
                              </div>
                            )}

                            {uploadType === "link" && (
                              <div className="flex-1 w-full">
                                <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="e.g. https://www.pdkv.ac.in/" className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-medium" />
                              </div>
                            )}

                            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                              <button onClick={saveChanges} disabled={!title.trim() || title.trim().length < 5 || isSaving} className={`px-6 py-3 rounded-xl font-semibold w-full md:w-auto flex items-center justify-center gap-2 ${title.trim().length >= 5 ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : (editingId ? "Update" : "Save")}
                              </button>
                              <button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 w-full md:w-auto">Cancel</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {filteredTabs.length === 0 && !showForm && (
                    <div className="text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
                      <p className="text-slate-600 font-medium">No records found for {activeCategory.title}.</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {filteredTabs.map((tab) => (
                      <div key={tab.id} className="group flex gap-4 bg-white p-4 rounded-2xl border border-slate-200 items-center shadow-sm hover:border-blue-200">
                        <div className={`p-3 rounded-xl ${tab.type === 'link' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
                          {tab.type === 'link' ? <ExternalLink size={24} /> : <FileText size={24} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-slate-800 truncate">{tab.title}</p>
                          {tab.type === 'link' ? (
                            <a href={tab.linkUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-500 hover:underline truncate block max-w-[250px] mt-1">{tab.linkUrl}</a>
                          ) : (
                            <p className="text-xs font-medium text-slate-500 mt-1 truncate max-w-[250px]">{tab.pdfFile?.name}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startEditing(tab)} className="p-2.5 bg-slate-50 text-blue-600 hover:bg-blue-100 rounded-xl"><Pencil size={16} /></button>
                          <button onClick={() => triggerDelete(tab.id)} className="p-2.5 bg-slate-50 text-red-500 hover:bg-red-100 rounded-xl"><Trash2 size={16} /></button>
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
      <DeleteModal show={showConfirm} onConfirm={handleConfirmDelete} onCancel={() => setShowConfirm(false)} />
    </div>
  );
};

export default StudentDashboard;