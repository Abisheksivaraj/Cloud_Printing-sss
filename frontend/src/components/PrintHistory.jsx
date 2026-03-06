import React, { useState, useEffect } from "react";
import {
    Clock, CheckCircle, XCircle, AlertCircle, RefreshCw,
    Search, Calendar, Printer, FileText, ChevronRight, Filter,
    Play, Trash2, ChevronDown, AlertTriangle, Info, Zap,
    WifiOff, X
} from "lucide-react";
import { printService } from "../config/apiConfig";
import { useTheme } from "../ThemeContext";
import { useAlert } from "../AlertContext";
import GeneratedLabelsPreview from "./Models/GeneratedLabelsPreview";
import ImportDataModal from "./Models/ImportDataModal";

const PrintHistory = ({ labels = [] }) => {
    const { theme, isDarkMode } = useTheme();
    const { showAlert } = useAlert();
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [expandedJob, setExpandedJob] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // States for resuming a job
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [resumeData, setResumeData] = useState(null);
    const [resumeTemplate, setResumeTemplate] = useState(null);
    const [generatedLabels, setGeneratedLabels] = useState([]);
    const [showGeneratedPreview, setShowGeneratedPreview] = useState(false);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await printService.getHistory();
            if (data.success) {
                setHistory(data.jobs);
            }
        } catch (error) {
            console.error("Failed to fetch print history", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleDeleteJob = async (jobId, e) => {
        e.stopPropagation();
        if (deleteConfirm !== jobId) {
            setDeleteConfirm(jobId);
            // Auto-dismiss confirm after 3 seconds
            setTimeout(() => setDeleteConfirm(null), 3000);
            return;
        }
        setDeletingId(jobId);
        try {
            await printService.deleteJob(jobId);
            setHistory(prev => prev.filter(j => j._id !== jobId));
            setDeleteConfirm(null);
        } catch (error) {
            console.error("Failed to delete print job:", error);
            showAlert("Failed to delete print job. " + (error.message || ""), "Delete Failed");
        } finally {
            setDeletingId(null);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "completed":
                return {
                    bg: isDarkMode ? "rgba(34, 197, 94, 0.15)" : "#dcfce7",
                    text: isDarkMode ? "#4ade80" : "#15803d",
                    border: isDarkMode ? "rgba(34, 197, 94, 0.3)" : "#bbf7d0",
                };
            case "failed":
                return {
                    bg: isDarkMode ? "rgba(239, 68, 68, 0.15)" : "#fef2f2",
                    text: isDarkMode ? "#f87171" : "#dc2626",
                    border: isDarkMode ? "rgba(239, 68, 68, 0.3)" : "#fecaca",
                };
            case "pending":
                return {
                    bg: isDarkMode ? "rgba(245, 158, 11, 0.15)" : "#fffbeb",
                    text: isDarkMode ? "#fbbf24" : "#d97706",
                    border: isDarkMode ? "rgba(245, 158, 11, 0.3)" : "#fde68a",
                };
            case "printing":
                return {
                    bg: isDarkMode ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
                    text: isDarkMode ? "#60a5fa" : "#2563eb",
                    border: isDarkMode ? "rgba(59, 130, 246, 0.3)" : "#bfdbfe",
                };
            case "cancelled":
                return {
                    bg: isDarkMode ? "rgba(107, 114, 128, 0.15)" : "#f3f4f6",
                    text: isDarkMode ? "#9ca3af" : "#6b7280",
                    border: isDarkMode ? "rgba(107, 114, 128, 0.3)" : "#e5e7eb",
                };
            default:
                return {
                    bg: isDarkMode ? "rgba(107, 114, 128, 0.15)" : "#f3f4f6",
                    text: isDarkMode ? "#9ca3af" : "#6b7280",
                    border: isDarkMode ? "rgba(107, 114, 128, 0.3)" : "#e5e7eb",
                };
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed": return <CheckCircle size={14} />;
            case "failed": return <XCircle size={14} />;
            case "printing": return <RefreshCw size={14} className="animate-spin" />;
            case "pending": return <Clock size={14} />;
            case "cancelled": return <X size={14} />;
            default: return <AlertCircle size={14} />;
        }
    };

    const getErrorIcon = (errorType) => {
        switch (errorType) {
            case "printer_disconnected":
            case "printer_offline":
                return <WifiOff size={14} />;
            case "printer_error":
            case "paper_jam":
            case "out_of_paper":
            case "out_of_ribbon":
                return <AlertTriangle size={14} />;
            case "driver_error":
            case "connection_timeout":
                return <Zap size={14} />;
            default:
                return <Info size={14} />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case "critical": return { bg: "#fef2f2", text: "#dc2626", darkBg: "rgba(239,68,68,0.15)", darkText: "#f87171" };
            case "error": return { bg: "#fef2f2", text: "#ea580c", darkBg: "rgba(234,88,12,0.15)", darkText: "#fb923c" };
            case "warning": return { bg: "#fffbeb", text: "#d97706", darkBg: "rgba(217,119,6,0.15)", darkText: "#fbbf24" };
            case "info": return { bg: "#eff6ff", text: "#2563eb", darkBg: "rgba(37,99,235,0.15)", darkText: "#60a5fa" };
            default: return { bg: "#f3f4f6", text: "#6b7280", darkBg: "rgba(107,114,128,0.15)", darkText: "#9ca3af" };
        }
    };

    const getErrorTypeLabel = (errorType) => {
        const labels = {
            printer_disconnected: "Printer Disconnected",
            printer_offline: "Printer Offline",
            printer_error: "Printer Error",
            paper_jam: "Paper Jam",
            out_of_paper: "Out of Paper",
            out_of_ribbon: "Out of Ribbon",
            connection_timeout: "Connection Timeout",
            driver_error: "Driver Error",
            data_error: "Data Error",
            render_error: "Render Error",
            unknown: "Unknown Issue",
        };
        return labels[errorType] || errorType || "Unclassified Issue";
    };

    const filteredHistory = history.filter(job => {
        const matchesSearch = job.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.printerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.jobId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || job.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Direct reprint: generate labels from stored sourceData without re-uploading
    const handleDirectReprint = (job) => {
        const jobId = job.templateId ? job.templateId.toString() : "";
        let template = labels.find(l => {
            const l_id = l.id ? l.id.toString() : (l._id ? l._id.toString() : "");
            return l_id === jobId;
        });

        // Fallback: search by name if ID search fails (useful for older history entries)
        if (!template && job.documentName) {
            template = labels.find(l => job.documentName.includes(l.name));
        }

        if (!template) {
            showAlert("The original template for this job could not be found.", "Template Missing");
            return;
        }

        const sourceData = job.sourceData;
        const mappings = job.metadata?.mappings || {};
        const columnMapping = mappings.columnMapping || {};
        const barcodeMultiMapping = mappings.barcodeMultiMapping || {};
        const barcodeSeparators = mappings.barcodeSeparators || {};

        if (!sourceData || sourceData.length === 0) {
            showAlert("No source data found for this job. Please use 'Edit & Print' instead.", "Data Missing");
            return;
        }

        // Generate labels directly from stored data
        const getFieldName = (content) => {
            const match = content.match(/\{\{(.+?)\}\}/);
            return match ? match[1] : content;
        };

        const newLabels = sourceData.map((row, index) => {
            const clonedElements = template.elements.map((el) => {
                const columnName = columnMapping[el.id] || getFieldName(el.content);

                if (el.type === "barcode" && barcodeMultiMapping[el.id]) {
                    const selectedColumns = barcodeMultiMapping[el.id].filter(col => col !== "");
                    const separator = barcodeSeparators[el.id] || " ";

                    if (selectedColumns.length > 0) {
                        const combinedValue = selectedColumns
                            .map(col => row[col] || "")
                            .filter(val => val !== "")
                            .join(separator);
                        return { ...el, content: combinedValue };
                    }
                }

                if (el.type === "placeholder" && columnName) {
                    const importedValue = row[columnName] || "";
                    return { ...el, content: importedValue, type: "text" };
                }

                return { ...el };
            });

            return {
                labelSize: template.labelSize,
                elements: clonedElements,
                value: row[Object.keys(row)[0]] || `Row ${index + 1}`,
                templateName: template.name,
                importContext: {
                    totalAvailable: sourceData.length,
                    totalSelected: sourceData.length,
                    rowIndex: index + 1,
                    importMethod: "upload",
                    sourceData: sourceData,
                    mappings: { columnMapping, barcodeMultiMapping, barcodeSeparators },
                },
            };
        });

        setGeneratedLabels(newLabels);
        setShowGeneratedPreview(true);
    };

    // Edit & Reprint: open ImportDataModal with pre-loaded data
    const handleResumePrint = (job) => {
        const template = labels.find(l => (l.id === job.templateId || l._id === job.templateId));
        if (!template) {
            showAlert("The original template for this job could not be found.", "Template Missing");
            return;
        }
        setResumeTemplate(template);
        setResumeData(job);
        setShowResumeModal(true);
    };

    const handleLabelsGenerated = (lbls) => {
        setGeneratedLabels(lbls);
        setShowResumeModal(false);
        setShowGeneratedPreview(true);
    };

    const hasErrors = (job) => {
        // Only count actual errors, not info-level log entries
        const hasRealErrors = job.errorLog && job.errorLog.some(
            e => e.severity === "error" || e.severity === "critical" || e.severity === "warning"
        );
        return job.status === "failed" ||
            hasRealErrors ||
            (job.status === "failed" && job.errorMessage) ||
            (job.errorDetails && job.errorDetails.totalErrors > 0 && job.errorDetails.category !== null);
    };

    const toggleExpand = (jobId) => {
        setExpandedJob(expandedJob === jobId ? null : jobId);
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight" style={{ color: theme.text }}>
                        Print History
                    </h1>
                    <p className="text-sm font-medium mt-1" style={{ color: theme.textMuted }}>
                        Monitor and manage your print job status and logs.
                    </p>
                </div>
                <button
                    onClick={fetchHistory}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by document, printer, or job ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all outline-none"
                        style={{
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            color: theme.text
                        }}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all outline-none appearance-none cursor-pointer"
                        style={{
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            color: theme.text
                        }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="printing">Printing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* History Table */}
            <div className="rounded-2xl border-2 overflow-hidden shadow-xl" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b" style={{ borderColor: theme.border, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>Job ID</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>Document</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>Printer</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-center" style={{ color: theme.textMuted }}>Volume / Length</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>Status</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>Date</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-center" style={{ color: theme.textMuted }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ divideColor: theme.border }}>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCw size={32} className="animate-spin text-blue-500" />
                                            <p className="text-sm font-bold" style={{ color: theme.textMuted }}>Loading history...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                <Printer size={32} />
                                            </div>
                                            <p className="font-bold">No print jobs found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredHistory.map((job) => {
                                    const statusStyle = getStatusStyle(job.status);
                                    const jobHasErrors = hasErrors(job);
                                    const isExpanded = expandedJob === job._id;

                                    return (
                                        <React.Fragment key={job._id}>
                                            <tr
                                                className="transition-colors group cursor-pointer"
                                                onClick={() => toggleExpand(job._id)}
                                                style={{
                                                    backgroundColor: isExpanded
                                                        ? (jobHasErrors
                                                            ? (isDarkMode ? 'rgba(239,68,68,0.05)' : '#fef2f2')
                                                            : (isDarkMode ? 'rgba(34,197,94,0.04)' : '#f0fdf4'))
                                                        : undefined,
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isExpanded) e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc';
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isExpanded) e.currentTarget.style.backgroundColor = '';
                                                }}
                                            >
                                                <td className="px-6 py-4 font-mono text-[10px] font-bold" style={{ color: theme.text }}>
                                                    {job.jobId}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${jobHasErrors
                                                            ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                                                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                                                            }`}>
                                                            {jobHasErrors ? <AlertTriangle size={16} /> : <FileText size={16} />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold truncate" style={{ color: theme.text }}>{job.documentName}</p>
                                                            <p className="text-[10px] uppercase font-black opacity-50 tracking-wider">Type: {job.documentType}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium" style={{ color: theme.text }}>{job.printerName}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`flex items-center gap-1.5 font-black text-[11px] tracking-tight ${job.printedRecords < job.totalRecords && job.status === 'completed'
                                                            ? 'text-red-500'
                                                            : ''
                                                            }`}>
                                                            <span className={job.status === 'completed' ? 'text-green-500' : 'text-blue-500'}>
                                                                {job.printedRecords || 0}
                                                            </span>
                                                            <span className="opacity-30">/</span>
                                                            <span style={{ color: theme.text }}>{job.totalRecords || 1}</span>
                                                            <span className="ml-1 opacity-50 text-[9px] uppercase">Labels</span>
                                                        </div>
                                                        {job.printedLength > 0 && (
                                                            <div className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[9px] font-bold opacity-60">
                                                                <span>{job.printedLength} mm</span>
                                                                <span className="opacity-40">|</span>
                                                                <span>{(job.printedLength / 25.4).toFixed(2)} in</span>
                                                            </div>
                                                        )}
                                                        {job.totalRecords > (job.printedRecords || 0) && (
                                                            <div className="mt-1 text-[9px] font-bold text-red-500 uppercase tracking-wider">
                                                                Missing: {job.totalRecords - (job.printedRecords || 0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border"
                                                        style={{
                                                            backgroundColor: statusStyle.bg,
                                                            color: statusStyle.text,
                                                            borderColor: statusStyle.border,
                                                        }}
                                                    >
                                                        {getStatusIcon(job.status)}
                                                        {job.status}
                                                    </div>
                                                    {/* Error summary below status */}
                                                    {jobHasErrors && (
                                                        <div className="mt-1.5 flex items-center gap-1">
                                                            <AlertTriangle size={10} className="text-red-500 shrink-0" />
                                                            <p
                                                                className="text-[9px] font-medium max-w-[180px] truncate"
                                                                title={job.errorMessage}
                                                                style={{ color: isDarkMode ? '#f87171' : '#dc2626' }}
                                                            >
                                                                {job.errorMessage || "Error logged"}
                                                            </p>
                                                            {job.errorLog && job.errorLog.filter(e => e.severity !== "info").length > 0 && (
                                                                <span
                                                                    className="text-[8px] font-black px-1.5 py-0.5 rounded-full ml-1"
                                                                    style={{
                                                                        backgroundColor: isDarkMode ? 'rgba(239,68,68,0.2)' : '#fef2f2',
                                                                        color: isDarkMode ? '#f87171' : '#dc2626',
                                                                    }}
                                                                >
                                                                    {job.errorLog.filter(e => e.severity !== "info").length} {job.errorLog.filter(e => e.severity !== "info").length === 1 ? 'error' : 'errors'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-medium" style={{ color: theme.text }}>
                                                        <Calendar size={14} className="opacity-40" />
                                                        {new Date(job.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <p className="text-[10px] font-bold opacity-40 mt-0.5">
                                                        {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {job.sourceData && job.sourceData.length > 0 && (
                                                            <>
                                                                {/* Direct Reprint - no re-upload needed */}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDirectReprint(job); }}
                                                                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-green-500/20 active:scale-95"
                                                                    title="Reprint with same data (no re-upload needed)"
                                                                >
                                                                    <Play size={12} fill="currentColor" />
                                                                    Reprint
                                                                </button>
                                                                {/* Edit & Print - opens ImportDataModal */}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleResumePrint(job); }}
                                                                    className="px-3 py-1.5 border-2 border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
                                                                    title="Edit data before printing"
                                                                >
                                                                    Edit
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={(e) => handleDeleteJob(job._id, e)}
                                                            disabled={deletingId === job._id}
                                                            className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${deleteConfirm === job._id
                                                                ? 'bg-red-500 text-white hover:bg-red-600 px-3'
                                                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                                } ${deletingId === job._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            title={deleteConfirm === job._id ? "Click again to confirm" : "Delete job"}
                                                        >
                                                            {deletingId === job._id ? (
                                                                <RefreshCw size={14} className="animate-spin" />
                                                            ) : (
                                                                <Trash2 size={14} />
                                                            )}
                                                            {deleteConfirm === job._id && (
                                                                <span className="text-[10px] font-black uppercase">Confirm?</span>
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleExpand(job._id); }}
                                                            className={`p-2 rounded-lg transition-all ${isExpanded
                                                                ? (jobHasErrors ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-green-100 dark:bg-green-900/30 text-green-500')
                                                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                                }`}
                                                            title={isExpanded ? "Collapse details" : "View activity details"}
                                                        >
                                                            <ChevronDown
                                                                size={18}
                                                                style={{
                                                                    transition: 'transform 0.2s',
                                                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                }}
                                                            />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded Row */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan="7" className="px-0 py-0">
                                                        <div
                                                            className="px-8 py-5 border-t animate-in slide-in-from-top-2 duration-200"
                                                            style={{
                                                                backgroundColor: isExpanded
                                                                    ? (jobHasErrors
                                                                        ? (isDarkMode ? 'rgba(239,68,68,0.05)' : '#fef7f7')
                                                                        : (isDarkMode ? 'rgba(34,197,94,0.04)' : '#f0fdf4'))
                                                                    : undefined,
                                                                borderColor: jobHasErrors
                                                                    ? (isDarkMode ? 'rgba(239,68,68,0.15)' : '#fecaca')
                                                                    : (isDarkMode ? 'rgba(34,197,94,0.1)' : '#dcfce7'),
                                                            }}
                                                        >
                                                            {/* Activity or Error Header */}
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                                                        style={{
                                                                            backgroundColor: job.status === 'failed' || (job.errorLog && job.errorLog.some(e => e.severity === 'error' || e.severity === 'critical'))
                                                                                ? (isDarkMode ? 'rgba(239,68,68,0.2)' : '#fee2e2')
                                                                                : (isDarkMode ? 'rgba(34,197,94,0.2)' : '#dcfce7'),
                                                                        }}
                                                                    >
                                                                        {job.status === 'failed' ? (
                                                                            <AlertTriangle size={16} className="text-red-500" />
                                                                        ) : (
                                                                            <Info size={16} className={isDarkMode ? "text-green-400" : "text-green-600"} />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p
                                                                            className="text-sm font-black uppercase tracking-wider"
                                                                            style={{
                                                                                color: job.status === 'failed'
                                                                                    ? (isDarkMode ? '#f87171' : '#dc2626')
                                                                                    : (isDarkMode ? '#4ade80' : '#16a34a')
                                                                            }}
                                                                        >
                                                                            {job.status === 'failed' ? "Error Details" : "Job Activity Log"}
                                                                        </p>
                                                                        <p className="text-[10px] font-bold mt-0.5" style={{ color: theme.text, opacity: 0.6 }}>
                                                                            {job.errorMessage || (job.errorDetails?.category ? getErrorTypeLabel(job.errorDetails.category) : "Detailed log of print events")}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {job.errorLog && job.errorLog.filter(e => e.severity !== "info").length > 0 && (
                                                                    <div
                                                                        className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                                                                        style={{
                                                                            backgroundColor: isDarkMode ? 'rgba(239,68,68,0.2)' : '#fee2e2',
                                                                            color: isDarkMode ? '#f87171' : '#dc2626',
                                                                        }}
                                                                    >
                                                                        {job.errorLog.filter(e => e.severity !== "info").length} Unresolved Issue{job.errorLog.filter(e => e.severity !== "info").length > 1 ? 's' : ''}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Main Error Message */}
                                                            {job.errorMessage && (
                                                                <div
                                                                    className="mb-4 px-4 py-3 rounded-xl border text-sm font-medium"
                                                                    style={{
                                                                        backgroundColor: isDarkMode ? 'rgba(239,68,68,0.1)' : '#fff5f5',
                                                                        borderColor: isDarkMode ? 'rgba(239,68,68,0.2)' : '#fecaca',
                                                                        color: isDarkMode ? '#fca5a5' : '#991b1b',
                                                                    }}
                                                                >
                                                                    <div className="flex items-start gap-2">
                                                                        <XCircle size={16} className="shrink-0 mt-0.5" />
                                                                        <span>{job.errorMessage}</span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Error Log Entries */}
                                                            {job.errorLog && job.errorLog.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
                                                                        Error Log ({job.errorLog.length} entries)
                                                                    </p>
                                                                    {job.errorLog.map((err, idx) => {
                                                                        const sevColor = getSeverityColor(err.severity);
                                                                        return (
                                                                            <div
                                                                                key={idx}
                                                                                className="flex items-start gap-3 px-4 py-3 rounded-xl border transition-all hover:shadow-sm"
                                                                                style={{
                                                                                    backgroundColor: isDarkMode ? sevColor.darkBg : sevColor.bg,
                                                                                    borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                                                                }}
                                                                            >
                                                                                {/* Error Type Icon */}
                                                                                <div
                                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                                                                    style={{
                                                                                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                                                                        color: isDarkMode ? sevColor.darkText : sevColor.text,
                                                                                    }}
                                                                                >
                                                                                    {getErrorIcon(err.errorType)}
                                                                                </div>

                                                                                {/* Error Content */}
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                                        <span
                                                                                            className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                                                                                            style={{
                                                                                                backgroundColor: isDarkMode ? sevColor.darkBg : sevColor.bg,
                                                                                                color: isDarkMode ? sevColor.darkText : sevColor.text,
                                                                                                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                                                                                            }}
                                                                                        >
                                                                                            {err.severity}
                                                                                        </span>
                                                                                        <span
                                                                                            className="text-[10px] font-bold opacity-70"
                                                                                            style={{ color: theme.text }}
                                                                                        >
                                                                                            {getErrorTypeLabel(err.errorType)}
                                                                                        </span>
                                                                                        {err.labelName && (
                                                                                            <span
                                                                                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                                                                style={{
                                                                                                    backgroundColor: isDarkMode ? 'rgba(59,130,246,0.15)' : '#eff6ff',
                                                                                                    color: isDarkMode ? '#60a5fa' : '#2563eb',
                                                                                                }}
                                                                                            >
                                                                                                📋 Label: {err.labelName}
                                                                                                {err.labelIndex !== undefined && err.labelIndex !== null && ` (#${err.labelIndex + 1})`}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <p className="text-xs mt-1.5 font-medium" style={{ color: theme.text }}>
                                                                                        {err.message}
                                                                                    </p>
                                                                                    {err.timestamp && (
                                                                                        <p className="text-[9px] mt-1 opacity-50" style={{ color: theme.text }}>
                                                                                            {new Date(err.timestamp).toLocaleString()}
                                                                                        </p>
                                                                                    )}
                                                                                </div>

                                                                                {/* Resolved Badge */}
                                                                                {err.resolved && (
                                                                                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                                                                        Resolved
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            {/* Error Timestamps */}
                                                            {job.errorDetails?.firstErrorAt && (
                                                                <div className="mt-4 flex items-center gap-4 text-[9px] font-bold opacity-50" style={{ color: theme.text }}>
                                                                    <span>First error: {new Date(job.errorDetails.firstErrorAt).toLocaleString()}</span>
                                                                    {job.errorDetails.lastErrorAt && job.errorDetails.firstErrorAt !== job.errorDetails.lastErrorAt && (
                                                                        <span>Last error: {new Date(job.errorDetails.lastErrorAt).toLocaleString()}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals for Resuming */}
            {showResumeModal && resumeTemplate && (
                <ImportDataModal
                    label={resumeTemplate}
                    initialData={resumeData.sourceData}
                    initialMappings={resumeData.metadata?.mappings}
                    onClose={() => setShowResumeModal(false)}
                    onLabelsGenerated={handleLabelsGenerated}
                />
            )}

            {showGeneratedPreview && generatedLabels.length > 0 && (
                <GeneratedLabelsPreview
                    labels={generatedLabels}
                    onClose={() => {
                        setShowGeneratedPreview(false);
                        setGeneratedLabels([]);
                    }}
                />
            )}
        </div>
    );
};

export default PrintHistory;
