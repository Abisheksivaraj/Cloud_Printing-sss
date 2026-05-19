import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Save,
  Minus,
  X,
  Grid,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  LayoutGrid,
  Check,
  File,
  FolderOpen,
  Printer,
  Scissors,
  Copy,
  Clipboard,
  Undo,
  Redo,
  MousePointer,
  Type,
  Barcode,
  Square,
  Grid3X3,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Superscript,
  Subscript,
  Pipette,
  Palette,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  ChevronDown,
  ChevronRight,
  Layers,
  Shield,
  Hash,
} from "lucide-react";

import DesignCanvas from "./DesignCanvas";
import PropertiesPanel from "./designer/PropertiesPanel";
import CreateLabelModal from "../components/Models/CreateLabelModal";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";
import { useAlert } from "../AlertContext";
import AIChatbot from "./designer/AIChatbot";

const BARCODE_ITEMS = [
  { type: "CODE128", name: "Code 128", desc: "High-density alphanumeric barcode" },
  { type: "CODE39", name: "Code 39", desc: "Variable-length industrial standard" },
  { type: "EAN13", name: "EAN-13", desc: "Standard European retail (13 digits)" },
  { type: "EAN8", name: "EAN-8", desc: "Short European retail (8 digits)" },
  { type: "UPC", name: "UPC-A", desc: "Standard US retail (12 digits)" },
  { type: "QR", name: "QR Code", desc: "2D high-capacity QR code matrix" },
  { type: "DATAMATRIX", name: "Data Matrix", desc: "Compact 2D industrial code" },
  { type: "PDF417", name: "PDF417", desc: "Stacked linear barcode standard" },
  { type: "AZTEC", name: "Aztec Code", desc: "Square high-density 2D code" }
];

const DROPDOWN_SHAPES = [
  {
    category: "Rectangles",
    items: [
      { type: "rectangle", name: "Rectangle", path: <rect x="5" y="5" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "rounded-rectangle", name: "Rounded Rect", path: <rect x="5" y="5" width="40" height="40" rx="8" ry="8" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "circle", name: "Circle/Ellipse", path: <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "dot", name: "Dot", path: <circle cx="25" cy="25" r="10" fill="currentColor" stroke="currentColor" strokeWidth="1" /> }
    ]
  },
  {
    category: "Basic Shapes",
    items: [
      { type: "triangle", name: "Triangle", path: <polygon points="25,5 45,45 5,45" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "right-triangle", name: "Right Triangle", path: <polygon points="5,5 5,45 45,45" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "parallelogram", name: "Parallelogram", path: <polygon points="15,5 45,5 35,45 5,45" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "trapezoid", name: "Trapezoid", path: <polygon points="12,5 38,5 45,45 5,45" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "diamond", name: "Diamond", path: <polygon points="25,5 45,25 25,45 5,25" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "cross", name: "Cross", path: <polygon points="18,5 32,5 32,18 45,18 45,32 32,32 32,45 18,45 18,32 5,32 5,18 18,18" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "heart", name: "Heart", path: <path d="M 25,12 C 20,2 7,2 2,12 C -2,22 10,37 25,48 C 40,37 52,22 48,12 C 43,2 30,2 25,12 Z" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "moon", name: "Moon", path: <path d="M 40,5 A 20,20 0 1,0 40,45 A 15,15 0 1,1 40,5 Z" fill="none" stroke="currentColor" strokeWidth="2" /> }
    ]
  },
  {
    category: "Arrows",
    items: [
      { type: "line-arrow-right", name: "Arrow Right", path: <path d="M 5,25 L 45,25 M 35,15 L 45,25 L 35,35" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "line-arrow-left", name: "Arrow Left", path: <path d="M 45,25 L 5,25 M 15,15 L 5,25 L 15,35" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "line-arrow-up", name: "Arrow Up", path: <path d="M 25,45 L 25,5 M 15,15 L 25,5 L 35,15" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "line-arrow-down", name: "Arrow Down", path: <path d="M 25,5 L 25,45 M 15,35 L 25,45 L 35,35" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "line-arrow-h", name: "Double H", path: <path d="M 5,25 L 45,25 M 15,15 L 5,25 L 15,35 M 35,15 L 45,25 L 35,35" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "line-arrow-v", name: "Double V", path: <path d="M 25,5 L 25,45 M 15,15 L 25,5 L 35,15 M 15,35 L 25,45 L 35,35" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "arrow-up-left", name: "Diag Up-Left", path: <path d="M 42,42 L 8,8 M 22,8 L 8,8 L 8,22" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "arrow-up-right", name: "Diag Up-Right", path: <path d="M 8,42 L 42,8 M 28,8 L 42,8 L 42,22" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "arrow-down-left", name: "Diag Dn-Left", path: <path d="M 42,8 L 8,42 M 8,28 L 8,42 L 22,42" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "arrow-down-right", name: "Diag Dn-Right", path: <path d="M 8,8 L 42,42 M 28,42 L 42,42 L 42,28" fill="none" stroke="currentColor" strokeWidth="2" /> }
    ]
  },
  {
    category: "Block Arrows",
    items: [
      { type: "arrow-right", name: "Arrow Right", path: <polygon points="2,15 30,15 30,5 48,25 30,45 30,35 2,35" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "arrow-left", name: "Arrow Left", path: <polygon points="48,15 20,15 20,5 2,25 20,45 20,35 48,35" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "arrow-up", name: "Arrow Up", path: <polygon points="15,48 15,20 5,20 25,2 45,20 35,20 35,48" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "arrow-down", name: "Arrow Down", path: <polygon points="15,2 15,30 5,30 25,48 45,30 35,30 35,2" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "arrow-left-right", name: "Left-Right", path: <polygon points="2,25 12,10 12,17 38,17 38,10 48,25 38,40 38,33 12,33 12,40" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "arrow-up-down", name: "Up-Down", path: <polygon points="25,2 10,12 17,12 17,38 10,38 25,48 40,38 33,38 33,12 40,12" fill="none" stroke="currentColor" strokeWidth="2" /> }
    ]
  },
  {
    category: "Arcs",
    items: [
      { type: "arc", name: "Arc", path: <path d="M 5,45 A 20,20 0 0,1 45,45" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "double-arc", name: "Double Arc", path: <path d="M 5,45 A 20,20 0 0,1 45,45 L 45,38 A 13,13 0 0,0 5,38 Z" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "wave", name: "Wave Banner", path: <path d="M 2,15 C 15,5 35,25 48,15 L 48,35 C 35,45 15,25 2,35 Z" fill="none" stroke="currentColor" strokeWidth="2" /> }
    ]
  },
  {
    category: "Regular Polygons",
    items: [
      { type: "pentagon", name: "Pentagon", path: <polygon points="25,5 45,20 37,45 13,45 5,20" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "hexagon", name: "Hexagon", path: <polygon points="25,5 45,15 45,35 25,45 5,35 5,15" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "octagon", name: "Octagon", path: <polygon points="17,5 33,5 45,17 45,33 33,45 17,45 5,33 5,17" fill="none" stroke="currentColor" strokeWidth="2" /> }
    ]
  },
  {
    category: "Stars and Banners",
    items: [
      { type: "star-4", name: "4-Point Star", path: <polygon points="25,2 31,19 48,25 31,31 25,48 19,31 2,25 19,19" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "star-5", name: "5-Point Star", path: <polygon points="25,2 32,17 48,17 35,28 40,45 25,35 10,45 15,28 2,17 18,17" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "star-6", name: "6-Point Star", path: <polygon points="25,2 31,14 47,14 37,25 47,36 31,36 25,48 19,36 3,36 13,25 3,14 19,14" fill="none" stroke="currentColor" strokeWidth="2" /> },
      { type: "star-8", name: "8-Point Star", path: <polygon points="25,2 30,17 42,8 33,20 48,25 33,30 42,42 30,33 25,48 20,33 8,42 17,30 2,25 17,20 8,8 20,17" fill="none" stroke="currentColor" strokeWidth="2" /> }
    ]
  }
];

const LabelDesigner = ({
  label,
  labels = [],
  user,
  onSave,
  onSelectLabel,
  onCreateLabel,
  onDeleteLabel,
  onNavigateToLibrary,
}) => {
  const { isDarkMode, theme } = useTheme();
  const { t } = useLanguage();
  const { showPrompt } = useAlert();

  const [elements, setElements] = useState(label?.elements || []);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [labelSize, setLabelSize] = useState(label?.labelSize || { width: 100, height: 80 });
  const [showGrid, setShowGrid] = useState(true);
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [isDrawingBarcode, setIsDrawingBarcode] = useState(false);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [isDrawingText, setIsDrawingText] = useState(false);
  const [currentShapeType, setCurrentShapeType] = useState(null);
  const [selectedBarcodeType, setSelectedBarcodeType] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [isPropertiesExpanded, setIsPropertiesExpanded] = useState(false);
  const [copiedElement, setCopiedElement] = useState(null);

  // Overlays / Dropdown menus state
  const [activeMenu, setActiveMenu] = useState(null); // 'file' | 'edit' | 'view' | 'create' | 'arrange' | 'help' | null
  const [showBarcodeDropdown, setShowBarcodeDropdown] = useState(false);
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [showRunningNumberDropdown, setShowRunningNumberDropdown] = useState(false);
  const [runningStart, setRunningStart] = useState(1);
  const [runningEnd, setRunningEnd] = useState(100);
  const [runningPad, setRunningPad] = useState(3);

  const menuContainerRef = useRef(null);
  const barcodeBtnRef = useRef(null);
  const shapeBtnRef = useRef(null);
  const runningNumBtnRef = useRef(null);
  const imageInputRef = useRef(null);
  const elementIdCounter = useRef(0);
  const canvasRef = useRef(null);
  const hasAiContent = useRef(false);

  const userRole = user?.role?.toLowerCase();
  const isOperator = userRole === "operator";

  // Sync state when label prop changes
  useEffect(() => {
    if (label) {
      setElements(label.elements || []);
      setLabelSize(label.labelSize || { width: 100, height: 80 });
      setSelectedElementId(null);
    }
  }, [label?.id]);

  // Click outside menus/dropdowns handlers
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
      if (barcodeBtnRef.current && !barcodeBtnRef.current.contains(e.target)) {
        setShowBarcodeDropdown(false);
      }
      if (shapeBtnRef.current && !shapeBtnRef.current.contains(e.target)) {
        setShowShapeDropdown(false);
      }
      if (runningNumBtnRef.current && !runningNumBtnRef.current.contains(e.target)) {
        setShowRunningNumberDropdown(false);
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const generateId = () => `element_${Date.now()}_${++elementIdCounter.current}`;

  const getBarcodeTypeName = (type) => {
    const names = {
      CODE128: "Code 128", CODE39: "Code 39", EAN13: "EAN-13",
      EAN8: "EAN-8", UPC: "UPC-A", QR: "QR Code",
      DATAMATRIX: "Data Matrix", PDF417: "PDF417", AZTEC: "Aztec Code",
    };
    return names[type] || type;
  };

  const cancelDrawingMode = () => {
    setIsDrawingText(false);
    setIsDrawingShape(false);
    setIsDrawingBarcode(false);
    setIsDrawingLine(false);
    setCurrentShapeType(null);
  };

  const activateTextDrawing = () => {
    setIsDrawingText(true);
    setIsDrawingShape(false);
    setIsDrawingBarcode(false);
    setIsDrawingLine(false);
    setSelectedElementId(null);
    setIsPropertiesExpanded(false);
  };

  const activateBarcodeDrawing = (barcodeType) => {
    if (!barcodeType) return;
    setSelectedBarcodeType(barcodeType);
    setIsDrawingBarcode(true);
    setIsDrawingShape(false);
    setIsDrawingText(false);
    setIsDrawingLine(false);
    setSelectedElementId(null);
    setIsPropertiesExpanded(false);
  };

  const activateShapeDrawing = (shapeType) => {
    setIsDrawingShape(true);
    setCurrentShapeType(shapeType);
    setIsDrawingBarcode(false);
    setIsDrawingText(false);
    setIsDrawingLine(false);
    setSelectedElementId(null);
    setIsPropertiesExpanded(false);
  };

  const activateLineDrawing = () => {
    setIsDrawingLine(true);
    setIsDrawingShape(false);
    setIsDrawingBarcode(false);
    setIsDrawingText(false);
    setSelectedElementId(null);
    setIsPropertiesExpanded(false);
  };

  const handleSave = async (status = null) => {
    let finalName = label?.name;

    if (hasAiContent.current || label?.name?.toLowerCase().includes("ai design") || label?.name === "Untitled Label") {
      const defaultName = label?.name && !label.name.includes("Untitled") ? label.name : `Design - ${new Date().toLocaleTimeString()}`;
      const newName = await showPrompt("Enter a name for this label:", defaultName);

      if (newName === null) return; 
      finalName = newName || defaultName;
    }

    if (onSave) {
      await onSave({
        name: finalName,
        elements,
        labelSize,
        status: status || label?.status
      });
      hasAiContent.current = false;
    }
  };

  const handleZoomChange = (newZoom) => setZoom(newZoom);

  // Copy / Paste / Cut
  const handleCopy = () => {
    if (selectedElementId) {
      const element = elements.find((el) => el.id === selectedElementId);
      if (element) {
        setCopiedElement({ ...element });
      }
    }
  };

  const handlePaste = () => {
    if (copiedElement) {
      const newEl = {
        ...copiedElement,
        id: generateId(),
        x: copiedElement.x + 15,
        y: copiedElement.y + 15,
        zIndex: elements.length,
      };
      setElements((prev) => [...prev, newEl]);
      setSelectedElementId(newEl.id);
      canvasRef.current?.saveToHistory([...elements, newEl]);
    }
  };

  const handleCut = () => {
    if (selectedElementId) {
      handleCopy();
      deleteElement();
    }
  };

  // Add elements
  const addElement = (type, extra = {}) => {
    if (type === "table") {
      const rows = extra.rows || 2;
      const cols = extra.cols || 2;
      const cellWidth = 60;
      const cellHeight = 25;
      const tableData = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => "")
      );
      const table = {
        id: generateId(),
        type: "table",
        x: 20,
        y: 20,
        rows,
        cols,
        cellWidth,
        cellHeight,
        width: cols * cellWidth,
        height: rows * cellHeight,
        tableData,
        borderColor: "#000000",
        borderWidth: 1,
        borderStyle: "solid",
        backgroundColor: "transparent",
        fontSize: 11,
        fontFamily: "Arial",
        rotation: 0,
        zIndex: elements.length,
      };
      const nextElements = [...elements, table];
      setElements(nextElements);
      setSelectedElementId(table.id);
      canvasRef.current?.saveToHistory(nextElements);
      return;
    }

    // Default element creation
    const element = {
      id: generateId(),
      type,
      x: 50,
      y: 50,
      width: type === "text" ? 120 : type === "barcode" ? 200 : 100,
      height: type === "text" ? 30 : type === "barcode" ? 80 : 100,
      content: type === "text" ? "Sample Text" : type === "barcode" ? "123456789" : "",
      barcodeType: type === "barcode" ? "CODE128" : undefined,
      barcodeWidth: 2,
      barcodeBarHeight: 70,
      showBarcodeText: true,
      fontSize: 14,
      fontFamily: "Arial",
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      textAlign: "left",
      letterSpacing: 0,
      lineHeight: 1.2,
      color: "#000000",
      backgroundColor: "transparent",
      borderWidth: (type === "text" || type === "barcode" || type === "image" || type === "placeholder") ? 0 : 2,
      borderColor: "#000000",
      borderStyle: "solid",
      borderRadius: 0,
      rotation: 0,
      opacity: 1,
      lockAspectRatio: true,
      zIndex: elements.length,
    };

    const nextElements = [...elements, element];
    setElements(nextElements);
    setSelectedElementId(element.id);
    canvasRef.current?.saveToHistory(nextElements);
  };

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const img = new Image();
      img.onload = () => {
        const MM_TO_PX = 3.7795275591;
        const canvasW = (labelSize?.width || 100) * MM_TO_PX;
        const canvasH = (labelSize?.height || 80) * MM_TO_PX;
        const maxW = 100;
        const ratio = img.height / img.width;
        const w = Math.min(maxW, img.width);
        const h = Math.round(w * ratio);
        const element = {
          id: generateId(),
          type: "image",
          x: Math.max(0, (canvasW - w) / 2),
          y: Math.max(0, (canvasH - h) / 2),
          width: w,
          height: h,
          src: dataUrl,
          opacity: 1,
          lockAspectRatio: true,
          rotation: 0,
          zIndex: elements.length,
        };
        const nextElements = [...elements, element];
        setElements(nextElements);
        setSelectedElementId(element.id);
        canvasRef.current?.saveToHistory(nextElements);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [elements, labelSize]);

  const handleAddPlaceholder = (placeholderName) => {
    const element = {
      id: generateId(),
      type: "placeholder",
      x: 50,
      y: 50,
      width: 150,
      height: 35,
      content: placeholderName,
      fontSize: 14,
      fontFamily: "Arial",
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      textAlign: "left",
      color: "#000000",
      backgroundColor: "transparent",
      borderWidth: 0,
      borderColor: "transparent",
      borderStyle: "solid",
      rotation: 0,
      zIndex: elements.length,
    };
    const nextElements = [...elements, element];
    setElements(nextElements);
    setSelectedElementId(element.id);
    canvasRef.current?.saveToHistory(nextElements);
  };

  const updateElement = (id, updates) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = () => {
    if (!selectedElementId) return;
    const idToDelete = selectedElementId;
    setSelectedElementId(null);
    setElements((prev) => {
      const nextElements = prev.filter((el) => el.id !== idToDelete);
      canvasRef.current?.saveToHistory(nextElements);
      return nextElements;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId) {
        // Only delete if user is not typing in an input or textarea
        if (
          e.target.tagName !== "INPUT" &&
          e.target.tagName !== "TEXTAREA" &&
          !e.target.isContentEditable
        ) {
          e.preventDefault();
          deleteElement();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId]);


  const handleBarcodeTypeChange = (newType) => {
    if (selectedElementId) {
      const element = elements.find((el) => el.id === selectedElementId);
      if (!element || element.type !== "barcode") return;
      setSelectedBarcodeType(newType);
      updateElement(selectedElementId, { barcodeType: newType });
    }
  };

  // Alignments logic
  const handleAlign = (alignment) => {
    if (!selectedElementId) return;
    const element = elements.find((el) => el.id === selectedElementId);
    if (!element) return;

    const MM_TO_PX = 3.7795275591;
    const canvasW = labelSize.width * MM_TO_PX;
    const canvasH = labelSize.height * MM_TO_PX;

    let updates = {};

    if (element.type === "line") {
      const x1 = element.x1 !== undefined ? element.x1 : element.x;
      const y1 = element.y1 !== undefined ? element.y1 : element.y;
      const x2 = element.x2 !== undefined ? element.x2 : element.x + element.width;
      const y2 = element.y2 !== undefined ? element.y2 : element.y + element.height;

      const minX = Math.min(x1, x2);
      const minY = Math.min(y1, y2);
      const w = Math.abs(x2 - x1);
      const h = Math.abs(y2 - y1);

      let deltaX = 0;
      let deltaY = 0;

      switch (alignment) {
        case "left":
          deltaX = 0 - minX;
          break;
        case "center":
          deltaX = (canvasW - w) / 2 - minX;
          break;
        case "right":
          deltaX = (canvasW - w) - minX;
          break;
        case "top":
          deltaY = 0 - minY;
          break;
        case "middle":
          deltaY = (canvasH - h) / 2 - minY;
          break;
        case "bottom":
          deltaY = (canvasH - h) - minY;
          break;
        default:
          return;
      }

      updates = {
        x: minX + deltaX,
        y: minY + deltaY,
        x1: x1 + deltaX,
        y1: y1 + deltaY,
        x2: x2 + deltaX,
        y2: y2 + deltaY,
      };
    } else {
      switch (alignment) {
        case "left":
          updates = { x: 0 };
          break;
        case "center":
          updates = { x: (canvasW - element.width) / 2 };
          break;
        case "right":
          updates = { x: canvasW - element.width };
          break;
        case "top":
          updates = { y: 0 };
          break;
        case "middle":
          updates = { y: (canvasH - element.height) / 2 };
          break;
        case "bottom":
          updates = { y: canvasH - element.height };
          break;
        default:
          return;
      }
    }

    const nextElements = elements.map((el) =>
      el.id === selectedElementId ? { ...el, ...updates } : el
    );
    setElements(nextElements);
    canvasRef.current?.saveToHistory(nextElements);
  };

  const handleBringForward = () => {
    if (!selectedElementId) return;
    setElements((prev) => {
      const idx = prev.findIndex((el) => el.id === selectedElementId);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const newArr = [...prev];
      const el = newArr[idx];
      const nextEl = newArr[idx + 1];
      const newZ = nextEl.zIndex !== undefined ? nextEl.zIndex + 1 : (el.zIndex || 0) + 1;
      newArr[idx] = { ...el, zIndex: newZ };
      newArr[idx + 1] = { ...nextEl, zIndex: el.zIndex !== undefined ? el.zIndex : 0 };
      const sorted = newArr.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      canvasRef.current?.saveToHistory(sorted);
      return sorted;
    });
  };

  const handleSendBackward = () => {
    if (!selectedElementId) return;
    setElements((prev) => {
      const idx = prev.findIndex((el) => el.id === selectedElementId);
      if (idx <= 0) return prev;
      const newArr = [...prev];
      const el = newArr[idx];
      const prevEl = newArr[idx - 1];
      const newZ = prevEl.zIndex !== undefined ? Math.max(0, prevEl.zIndex - 1) : 0;
      newArr[idx] = { ...el, zIndex: newZ };
      newArr[idx - 1] = { ...prevEl, zIndex: el.zIndex !== undefined ? el.zIndex : 0 };
      const sorted = newArr.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      canvasRef.current?.saveToHistory(sorted);
      return sorted;
    });
  };

  // Helper formatting styles toggle
  const toggleStyle = (key, valueOn, valueOff) => {
    if (!selectedElementId) return;
    const element = elements.find((el) => el.id === selectedElementId);
    if (!element) return;
    const currentVal = element[key];
    const updates = { [key]: currentVal === valueOn ? valueOff : valueOn };
    updateElement(selectedElementId, updates);
    const nextElements = elements.map((el) => (el.id === selectedElementId ? { ...el, ...updates } : el));
    canvasRef.current?.saveToHistory(nextElements);
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);
  const canvasBg = isDarkMode ? "#1e293b" : "#8fa8cf";

  return (
    <div
      className="fixed inset-0 top-12 md:top-14 flex flex-col transition-colors duration-200 select-none overflow-hidden"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Hidden image file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* ─── Ribbon Bar Container ─── */}
      <div className="flex flex-col border-b select-none shrink-0" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
        
        {/* Menu Bar Row */}
        <div ref={menuContainerRef} className="flex items-center gap-1.5 px-3 py-1 text-xs border-b relative" style={{ borderColor: theme.border }}>
          {[
            {
              id: "file",
              label: "File",
              items: [
                { label: "New Label...", icon: <File size={12} />, action: () => onCreateLabel && onCreateLabel({ name: "Untitled Label" }) },
                { label: "Open/Switch Template", icon: <FolderOpen size={12} />, action: () => onNavigateToLibrary && onNavigateToLibrary() },
                { label: "Save Template", icon: <Save size={12} />, action: () => handleSave() },
                { label: "Print (Browser Dial)", icon: <Printer size={12} />, action: () => window.print() },
                { label: "Go to Templates", icon: <LayoutGrid size={12} />, action: () => onNavigateToLibrary && onNavigateToLibrary() }
              ]
            },
            {
              id: "edit",
              label: "Edit",
              items: [
                { label: "Undo", icon: <Undo size={12} />, action: () => canvasRef.current?.handleUndo() },
                { label: "Redo", icon: <Redo size={12} />, action: () => canvasRef.current?.handleRedo() },
                { label: "Cut Object", icon: <Scissors size={12} />, action: () => handleCut() },
                { label: "Copy Object", icon: <Copy size={12} />, action: () => handleCopy() },
                { label: "Paste Object", icon: <Clipboard size={12} />, action: () => handlePaste() },
                { label: "Delete Object", icon: <Trash2 size={12} />, action: () => deleteElement() }
              ]
            },
            {
              id: "view",
              label: "View",
              items: [
                { label: "Zoom In", icon: <ZoomIn size={12} />, action: () => canvasRef.current?.handleZoomIn() },
                { label: "Zoom Out", icon: <ZoomOut size={12} />, action: () => canvasRef.current?.handleZoomOut() },
                { label: "Reset Zoom", icon: <RefreshCw size={12} />, action: () => canvasRef.current?.handleZoomReset() },
                { label: "Toggle Grid", icon: <Grid size={12} />, action: () => setShowGrid(!showGrid) }
              ]
            },
            {
              id: "create",
              label: "Create",
              items: [
                { label: "Text Object", icon: <Type size={12} />, action: () => activateTextDrawing() },
                { label: "Line Shape", icon: <Minus size={12} />, action: () => activateLineDrawing() },
                { label: "Table (2x2)", icon: <Grid3X3 size={12} />, action: () => addElement("table") },
                { label: "Image Object", icon: <ImageIcon size={12} />, action: () => imageInputRef.current?.click() }
              ]
            },
            {
              id: "arrange",
              label: "Arrange",
              items: [
                { label: "Align Left", action: () => handleAlign("left") },
                { label: "Align Center", action: () => handleAlign("center") },
                { label: "Align Right", action: () => handleAlign("right") },
                { label: "Align Top", action: () => handleAlign("top") },
                { label: "Align Middle", action: () => handleAlign("middle") },
                { label: "Align Bottom", action: () => handleAlign("bottom") },
                { label: "Bring to Front", icon: <Layers size={12} />, action: () => handleBringForward() },
                { label: "Send to Back", icon: <Layers size={12} />, action: () => handleSendBackward() }
              ]
            },
            {
              id: "help",
              label: "Help",
              items: [
                { label: "About BarTender Designer Lite", action: () => alert("BarTender Designer Lite - Cloud Graphic & Labels Studio v2.0") }
              ]
            }
          ].map((menu) => (
            <div key={menu.id} className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
                onMouseEnter={() => { if (activeMenu) setActiveMenu(menu.id); }}
                className={`px-3 py-1 rounded transition-colors text-xs font-semibold ${
                  activeMenu === menu.id
                    ? "bg-gray-200 dark:bg-gray-800 text-[var(--color-primary)]"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {menu.label}
              </button>
              {activeMenu === menu.id && (
                <div
                  className="absolute left-0 mt-1 w-52 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 py-1.5 animate-fadeIn"
                  style={{ top: "100%" }}
                >
                  {menu.items.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        item.action();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2"
                    >
                      {item.icon && <span className="opacity-70 shrink-0">{item.icon}</span>}
                      <span className="flex-1">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            {isOperator && (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Shield size={10} /> Operator Mode (Read Only)
              </span>
            )}
          </div>
        </div>

        {/* Toolbar Row 1: Actions & Tools */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b" style={{ borderColor: theme.border }}>
          {/* Quick Actions */}
          <div className="flex items-center gap-0.5 border-r pr-2 mr-1" style={{ borderColor: theme.border }}>
            <button
              onClick={() => onCreateLabel && onCreateLabel({ name: "Untitled Label" })}
              className="p-1.5 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title="New Template (Ctrl+N)"
            >
              <File size={15} />
            </button>
            <button
              onClick={() => onNavigateToLibrary && onNavigateToLibrary()}
              className="p-1.5 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title="Open Template Library (Ctrl+O)"
            >
              <FolderOpen size={15} />
            </button>
            {!isOperator ? (
              <button
                onClick={() => handleSave()}
                className="p-1.5 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                title="Save Design changes (Ctrl+S)"
              >
                <Save size={15} />
              </button>
            ) : (
              <span className="p-1.5 opacity-30 cursor-not-allowed text-gray-400">
                <Save size={15} />
              </span>
            )}
            <button
              onClick={() => window.print()}
              className="p-1.5 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title="Print Label"
            >
              <Printer size={15} />
            </button>
          </div>

          {/* Copy/Cut/Paste */}
          <div className="flex items-center gap-0.5 border-r pr-2 mr-1" style={{ borderColor: theme.border }}>
            <button
              onClick={handleCut}
              disabled={!selectedElementId}
              className="p-1.5 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Cut Object (Ctrl+X)"
            >
              <Scissors size={15} />
            </button>
            <button
              onClick={handleCopy}
              disabled={!selectedElementId}
              className="p-1.5 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Copy Object (Ctrl+C)"
            >
              <Copy size={15} />
            </button>
            <button
              onClick={handlePaste}
              disabled={!copiedElement}
              className="p-1.5 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Paste Object (Ctrl+V)"
            >
              <Clipboard size={15} />
            </button>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5 border-r pr-2 mr-1" style={{ borderColor: theme.border }}>
            <button
              onClick={() => canvasRef.current?.handleUndo()}
              className="p-1.5 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo size={15} />
            </button>
            <button
              onClick={() => canvasRef.current?.handleRedo()}
              className="p-1.5 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo size={15} />
            </button>
          </div>

          {/* Drawing Tools */}
          {!isOperator ? (
            <div className="flex items-center gap-1">
              {/* Select Tool */}
              <button
                onClick={cancelDrawingMode}
                className={`p-1.5 rounded transition-all flex items-center gap-1 text-xs font-semibold ${
                  !isDrawingText && !isDrawingShape && !isDrawingBarcode && !isDrawingLine
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20"
                    : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title="Select Mode"
              >
                <MousePointer size={15} />
                <span>Select</span>
              </button>

              {/* Text Tool */}
              <button
                onClick={activateTextDrawing}
                className={`p-1.5 rounded transition-all flex items-center gap-1 text-xs font-semibold ${
                  isDrawingText
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20"
                    : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title="Draw Text (Click & drag on canvas)"
              >
                <Type size={15} />
                <span>Text</span>
              </button>

              {/* Barcode Dropdown Button */}
              <div ref={barcodeBtnRef} className="relative">
                <button
                  onClick={() => setShowBarcodeDropdown(!showBarcodeDropdown)}
                  className={`p-1.5 rounded transition-all flex items-center gap-0.5 text-xs font-semibold ${
                    isDrawingBarcode
                      ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20"
                      : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  title="Insert Barcode (Select type)"
                >
                  <Barcode size={15} />
                  <span>Barcode</span>
                  <ChevronDown size={12} className="opacity-70 ml-0.5" />
                </button>
                {showBarcodeDropdown && (
                  <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 py-1 animate-fadeIn">
                    <span className="block px-3 py-1 text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-850 mb-1">
                      Select Barcode Symbology
                    </span>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {BARCODE_ITEMS.map((item) => (
                        <button
                          key={item.type}
                          onClick={() => {
                            activateBarcodeDrawing(item.type);
                            setShowBarcodeDropdown(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs flex flex-col"
                        >
                          <span className="font-bold text-gray-800 dark:text-gray-200">{item.name}</span>
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 truncate">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Line Tool */}
              <button
                onClick={activateLineDrawing}
                className={`p-1.5 rounded transition-all flex items-center gap-1 text-xs font-semibold ${
                  isDrawingLine
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20"
                    : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title="Draw Straight Line"
              >
                <Minus size={15} className="rotate-45" />
                <span>Line</span>
              </button>

              {/* Shape Dropdown Button */}
              <div ref={shapeBtnRef} className="relative">
                <button
                  onClick={() => setShowShapeDropdown(!showShapeDropdown)}
                  className={`p-1.5 rounded transition-all flex items-center gap-0.5 text-xs font-semibold ${
                    isDrawingShape
                      ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20"
                      : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  title="Draw Shapes"
                >
                  <Square size={15} />
                  <span>Shape</span>
                  <ChevronDown size={12} className="opacity-70 ml-0.5" />
                </button>
                {showShapeDropdown && (
                  <div className="absolute left-0 mt-1 w-[380px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 p-3 animate-fadeIn">
                    <span className="block text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-850 pb-1 mb-2">
                      Shapes Palette
                    </span>
                    <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                      {DROPDOWN_SHAPES.map((group) => (
                        <div key={group.category}>
                          <span className="block text-[9px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                            {group.category}
                          </span>
                          <div className="grid grid-cols-6 gap-1.5">
                            {group.items.map((item) => (
                              <button
                                key={item.type}
                                onClick={() => {
                                  activateShapeDrawing(item.type);
                                  setShowShapeDropdown(false);
                                }}
                                className="flex flex-col items-center p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded border border-gray-100 dark:border-gray-850 transition-colors"
                                title={item.name}
                              >
                                <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" viewBox="0 0 50 50">
                                  {item.path}
                                </svg>
                                <span className="text-[7.5px] font-bold mt-1 text-center truncate w-full text-gray-500 dark:text-gray-400">
                                  {item.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Table Tool */}
              <button
                onClick={() => addElement("table")}
                className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Add 2x2 Table Grid"
              >
                <Grid3X3 size={15} />
                <span>Table</span>
              </button>

              {/* Image Tool */}
              <button
                onClick={() => imageInputRef.current?.click()}
                className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Add Custom Image Asset"
              >
                <ImageIcon size={15} />
                <span>Image</span>
              </button>

              {/* Running Number Tool */}
              <div ref={runningNumBtnRef} className="relative">
                <button
                  onClick={() => setShowRunningNumberDropdown(!showRunningNumberDropdown)}
                  className={`p-1.5 rounded transition-all flex items-center gap-0.5 text-xs font-semibold ${
                    showRunningNumberDropdown
                      ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
                      : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  title="Insert Running Number"
                >
                  <Hash size={15} />
                  <span>Serial</span>
                  <ChevronDown size={12} className="opacity-70 ml-0.5" />
                </button>
                {showRunningNumberDropdown && (
                  <div className="absolute left-0 mt-1 w-72 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 p-3 animate-fadeIn">
                    <span className="block text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-850 pb-1 mb-2">
                      🔢 Running / Serial Number
                    </span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">Creates a text element with an auto-incrementing number placeholder for batch printing.</p>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 block mb-0.5">Start</label>
                        <input
                          type="number"
                          value={runningStart}
                          onChange={(e) => setRunningStart(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 block mb-0.5">End</label>
                        <input
                          type="number"
                          value={runningEnd}
                          onChange={(e) => setRunningEnd(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 block mb-0.5">Digits</label>
                        <input
                          type="number"
                          value={runningPad}
                          onChange={(e) => setRunningPad(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-400 mb-2">
                      Preview: <span className="font-mono text-indigo-500">{String(runningStart).padStart(runningPad, '0')}, {String(runningStart + 1).padStart(runningPad, '0')}, ... {String(runningEnd).padStart(runningPad, '0')}</span>
                    </p>
                    <button
                      onClick={() => {
                        const placeholder = `{{running_number:${runningStart}:${runningEnd}:${runningPad}}}`;
                        const element = {
                          id: generateId(),
                          type: "text",
                          x: 50,
                          y: 50,
                          width: 120,
                          height: 30,
                          content: placeholder,
                          fontSize: 14,
                          fontFamily: "Arial",
                          fontWeight: "normal",
                          fontStyle: "normal",
                          textDecoration: "none",
                          textAlign: "left",
                          color: "#000000",
                          backgroundColor: "transparent",
                          borderWidth: 0,
                          borderColor: "transparent",
                          borderStyle: "solid",
                          rotation: 0,
                          zIndex: elements.length,
                        };
                        const nextElements = [...elements, element];
                        setElements(nextElements);
                        setSelectedElementId(element.id);
                        canvasRef.current?.saveToHistory(nextElements);
                        setShowRunningNumberDropdown(false);
                      }}
                      className="w-full py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                      + Insert Running Number
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs italic text-gray-400 px-2 py-1">
              Add options disabled in Read Only Mode
            </div>
          )}
        </div>

        {/* Toolbar Row 2: Formatting, Colors & Alignments */}
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-slate-900/40 select-none">
          {/* Font selection */}
          <div className="flex items-center gap-1">
            <select
              value={selectedElement?.fontFamily || "Arial"}
              onChange={(e) => selectedElementId && updateElement(selectedElementId, { fontFamily: e.target.value })}
              disabled={!selectedElement || selectedElement.type === "image"}
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300 disabled:opacity-40"
              title="Font Family"
            >
              {["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana", "Impact", "Inter", "Roboto"].map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>

            <select
              value={selectedElement?.fontSize || 14}
              onChange={(e) => selectedElementId && updateElement(selectedElementId, { fontSize: Number(e.target.value) })}
              disabled={!selectedElement || selectedElement.type === "image"}
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 text-xs text-gray-700 dark:text-gray-300 w-16 disabled:opacity-40"
              title="Font Size"
            >
              {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map((sz) => (
                <option key={sz} value={sz}>{sz} pt</option>
              ))}
            </select>
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          {/* Bold/Italic/Underline */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => toggleStyle("fontWeight", "bold", "normal")}
              disabled={!selectedElement || selectedElement.type !== "text"}
              className={`p-1 rounded text-xs font-bold transition-colors disabled:opacity-30 ${
                selectedElement?.fontWeight === "bold"
                  ? "bg-gray-200 dark:bg-gray-750 text-black dark:text-white"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title="Bold"
            >
              <Bold size={13} />
            </button>
            <button
              onClick={() => toggleStyle("fontStyle", "italic", "normal")}
              disabled={!selectedElement || selectedElement.type !== "text"}
              className={`p-1 rounded text-xs font-bold transition-colors disabled:opacity-30 ${
                selectedElement?.fontStyle === "italic"
                  ? "bg-gray-200 dark:bg-gray-750 text-black dark:text-white"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title="Italic"
            >
              <Italic size={13} />
            </button>
            <button
              onClick={() => toggleStyle("textDecoration", "underline", "none")}
              disabled={!selectedElement || selectedElement.type !== "text"}
              className={`p-1 rounded text-xs font-bold transition-colors disabled:opacity-30 ${
                selectedElement?.textDecoration === "underline"
                  ? "bg-gray-200 dark:bg-gray-750 text-black dark:text-white"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title="Underline"
            >
              <Underline size={13} />
            </button>
            <button
              onClick={() => toggleStyle("textDecoration", "line-through", "none")}
              disabled={!selectedElement || selectedElement.type !== "text"}
              className={`p-1 rounded text-xs font-bold transition-colors disabled:opacity-30 ${
                selectedElement?.textDecoration === "line-through"
                  ? "bg-gray-200 dark:bg-gray-750 text-black dark:text-white"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title="Strikethrough"
            >
              <Strikethrough size={13} />
            </button>
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          {/* Text Alignment */}
          <div className="flex items-center gap-0.5">
            {[
              { val: "left", icon: <AlignLeft size={13} /> },
              { val: "center", icon: <AlignCenter size={13} /> },
              { val: "right", icon: <AlignRight size={13} /> },
              { val: "justify", icon: <AlignJustify size={13} /> },
            ].map(({ val, icon }) => (
              <button
                key={val}
                onClick={() => selectedElementId && updateElement(selectedElementId, { textAlign: val })}
                disabled={!selectedElement || selectedElement.type !== "text"}
                className={`p-1 rounded transition-colors disabled:opacity-30 ${
                  selectedElement?.textAlign === val
                    ? "bg-gray-200 dark:bg-gray-750 text-black dark:text-white"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title={`Align ${val}`}
              >
                {icon}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          {/* Colors */}
          <div className="flex items-center gap-1.5">
            {/* Text / Border Color */}
            <div className="flex items-center gap-1 text-[10px] text-gray-500" title="Text or Border Color">
              <Palette size={12} />
              <input
                type="color"
                value={selectedElement?.borderColor === "transparent" ? "#000000" : (selectedElement?.borderColor || selectedElement?.color || "#000000")}
                onChange={(e) => {
                  if (selectedElementId) {
                    if (selectedElement.type === "text") {
                      updateElement(selectedElementId, { color: e.target.value });
                    } else {
                      updateElement(selectedElementId, { borderColor: e.target.value });
                    }
                  }
                }}
                disabled={!selectedElement}
                className="w-4 h-4 cursor-pointer border border-gray-300 rounded-sm p-0 disabled:opacity-40"
              />
            </div>

            {/* Background / Fill Color */}
            <div className="flex items-center gap-1 text-[10px] text-gray-500" title="Fill/Background Color">
              <Pipette size={12} />
              <input
                type="color"
                value={selectedElement?.backgroundColor === "transparent" ? "#ffffff" : (selectedElement?.backgroundColor || "#ffffff")}
                onChange={(e) => {
                  if (selectedElementId) {
                    updateElement(selectedElementId, { backgroundColor: e.target.value });
                  }
                }}
                disabled={!selectedElement}
                className="w-4 h-4 cursor-pointer border border-gray-300 rounded-sm p-0 disabled:opacity-40"
              />
            </div>
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          {/* Object Alignment shortcuts */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleAlign("left")}
              disabled={!selectedElementId}
              className="p-1 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30"
              title="Align Left relative to Canvas"
            >
              <AlignStartHorizontal size={13} />
            </button>
            <button
              onClick={() => handleAlign("center")}
              disabled={!selectedElementId}
              className="p-1 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30"
              title="Align Center Horizontal"
            >
              <AlignCenterHorizontal size={13} />
            </button>
            <button
              onClick={() => handleAlign("right")}
              disabled={!selectedElementId}
              className="p-1 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30"
              title="Align Right relative to Canvas"
            >
              <AlignEndHorizontal size={13} />
            </button>
            <button
              onClick={() => handleAlign("top")}
              disabled={!selectedElementId}
              className="p-1 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30"
              title="Align Top"
            >
              <AlignStartVertical size={13} />
            </button>
            <button
              onClick={() => handleAlign("middle")}
              disabled={!selectedElementId}
              className="p-1 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30"
              title="Align Middle Vertical"
            >
              <AlignCenterVertical size={13} />
            </button>
            <button
              onClick={() => handleAlign("bottom")}
              disabled={!selectedElementId}
              className="p-1 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30"
              title="Align Bottom"
            >
              <AlignEndVertical size={13} />
            </button>
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          {/* Layer controls */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleBringForward}
              disabled={!selectedElementId}
              className="p-1 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30"
              title="Bring Layer Forward"
            >
              <ArrowLeft size={13} className="rotate-90" />
            </button>
            <button
              onClick={handleSendBackward}
              disabled={!selectedElementId}
              className="p-1 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30"
              title="Send Layer Backward"
            >
              <ArrowLeft size={13} className="-rotate-90" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Workspace Pane ─── */}
      <div className="flex-1 flex overflow-hidden relative select-none">
        
        {/* ─── Left Explorer Panel ─── */}
        {!isOperator && (
          <div
            className="w-60 border-r flex flex-col shrink-0 overflow-hidden select-none"
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          >
            {/* Header */}
            <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>
                Explorer
              </span>
              <button
                onClick={() => onCreateLabel && onCreateLabel({ name: "New Design Template" })}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-[var(--color-primary)] rounded transition-all"
                title="Create New Label"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
              {/* Active Label Elements (Layers) */}
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider block mb-2 opacity-50" style={{ color: theme.textMuted }}>
                  Active Template Objects
                </span>
                <div className="space-y-1">
                  {elements.length === 0 ? (
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 italic p-2 text-center border border-dashed rounded" style={{ borderColor: theme.border }}>
                      No objects on canvas
                    </div>
                  ) : (
                    elements.map((el) => {
                      const isSelected = el.id === selectedElementId;
                      return (
                        <div
                          key={el.id}
                          onClick={() => setSelectedElementId(el.id)}
                          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                            isSelected
                              ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <span className="truncate flex items-center gap-1.5">
                            <span className="opacity-70 shrink-0">
                              {el.type === "text" && "📝"}
                              {el.type === "line" && "╱"}
                              {el.type === "barcode" && "📊"}
                              {el.type === "table" && "⊞"}
                              {el.type === "image" && "🖼️"}
                              {el.type === "placeholder" && "📦"}
                              {!["text", "line", "barcode", "table", "image", "placeholder"].includes(el.type) && "🎨"}
                            </span>
                            <span>{el.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setElements((prev) => prev.filter((item) => item.id !== el.id));
                              if (selectedElementId === el.id) setSelectedElementId(null);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 rounded transition-opacity"
                            title="Delete Object"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Other Templates List */}
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider block mb-2 opacity-50" style={{ color: theme.textMuted }}>
                  Templates Library
                </span>
                <div className="space-y-1">
                  {labels.length === 0 ? (
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 italic p-2 text-center">
                      No templates available
                    </div>
                  ) : (
                    labels.map((item) => {
                      const isActive = item.id === label?.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (onSelectLabel) onSelectLabel(item);
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                            isActive
                              ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold border-l-2 border-[var(--color-primary)] rounded-l-none"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <span className="truncate flex items-center gap-1.5">
                            <span className="opacity-70 shrink-0">🏷️</span>
                            <span className="truncate">{item.name}</span>
                          </span>
                          {item.status && (
                            <span className={`text-[8px] px-1 py-0.5 rounded font-black uppercase ${
                              item.status === "approved"
                                ? "bg-green-500/10 text-green-500"
                                : item.status === "review"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-gray-500/10 text-gray-500"
                            }`}>
                              {item.status}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Design Canvas Center Workspace ─── */}
        <div
          className="flex-1 flex flex-col overflow-hidden relative"
          style={{ backgroundColor: canvasBg }}
        >
          {/* Active drawing mode status strip */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 pointer-events-none">
            {isDrawingText && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/90 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md pointer-events-auto">
                📝 Text Mode
                <button onClick={() => setIsDrawingText(false)} className="hover:bg-white/20 rounded p-0.5 ml-1 transition-colors"><X size={10} /></button>
              </div>
            )}
            {isDrawingLine && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/90 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md pointer-events-auto">
                <Minus size={10} className="rotate-45" /> Line Mode
                <button onClick={() => setIsDrawingLine(false)} className="hover:bg-white/20 rounded p-0.5 ml-1 transition-colors"><X size={10} /></button>
              </div>
            )}
            {isDrawingBarcode && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/90 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md pointer-events-auto">
                📊 {getBarcodeTypeName(selectedBarcodeType)} Mode
                <button onClick={() => { setIsDrawingBarcode(false); setSelectedBarcodeType(null); }} className="hover:bg-white/20 rounded p-0.5 ml-1 transition-colors"><X size={10} /></button>
              </div>
            )}
            {isDrawingShape && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-600/90 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md pointer-events-auto">
                🎨 {currentShapeType?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Mode
                <button onClick={() => { setIsDrawingShape(false); setCurrentShapeType(null); }} className="hover:bg-white/20 rounded p-0.5 ml-1 transition-colors"><X size={10} /></button>
              </div>
            )}
          </div>

          <DesignCanvas
            ref={canvasRef}
            elements={elements}
            setElements={setElements}
            selectedElementId={selectedElementId}
            setSelectedElementId={setSelectedElementId}
            labelSize={labelSize}
            showGrid={showGrid}
            isDrawingLine={!isOperator && isDrawingLine}
            setIsDrawingLine={setIsDrawingLine}
            isDrawingBarcode={!isOperator && isDrawingBarcode}
            setIsDrawingBarcode={setIsDrawingBarcode}
            isDrawingShape={!isOperator && isDrawingShape}
            setIsDrawingShape={setIsDrawingShape}
            currentShapeType={currentShapeType}
            isDrawingText={!isOperator && isDrawingText}
            setIsDrawingText={setIsDrawingText}
            generateId={generateId}
            selectedBarcodeType={selectedBarcodeType}
            updateElement={updateElement}
            setSelectedBarcodeType={setSelectedBarcodeType}
            zoom={zoom}
            onZoomChange={handleZoomChange}
            onInteraction={() => {
              setIsPropertiesExpanded(false);
            }}
            onElementCreated={() => {}}
            onElementSelected={() => {
              if (!isOperator) setIsPropertiesExpanded(true);
            }}
          />
        </div>

        {/* ─── Expandable Properties Panel (Right side) ─── */}
        {!isOperator && (
          <div
            className={`fixed top-12 md:top-14 bottom-0 right-0 z-40 transition-transform duration-500 ease-in-out border-l shadow-2xl flex ${
              isPropertiesExpanded ? "translate-x-0" : "translate-x-full"
            }`}
            style={{ width: "320px", backgroundColor: theme.surface, borderColor: theme.border }}
          >
            {/* Toggle Handle */}
            <button
              onClick={() => setIsPropertiesExpanded(!isPropertiesExpanded)}
              className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-16 rounded-l-xl border-l border-t border-b flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-[-4px_0_10px_rgba(0,0,0,0.05)]"
              style={{ borderColor: theme.border, backgroundColor: theme.surface }}
            >
              <div className={`transition-transform duration-500 ${isPropertiesExpanded ? "rotate-180" : ""}`} style={{ color: theme.textMuted }}>
                <ArrowLeft size={16} />
              </div>
            </button>

            {/* Properties content */}
            <div className="h-full w-full overflow-y-auto custom-scrollbar">
              <PropertiesPanel
                selectedElement={selectedElement}
                updateElement={updateElement}
                deleteElement={deleteElement}
                onBarcodeTypeChange={handleBarcodeTypeChange}
                isDrawingLine={isDrawingLine}
                isDrawingBarcode={isDrawingBarcode}
                isDrawingShape={isDrawingShape}
                onUndo={() => canvasRef.current?.handleUndo()}
                onRedo={() => canvasRef.current?.handleRedo()}
                onDuplicate={() => canvasRef.current?.handleDuplicate()}
                canUndo={canvasRef.current?.canUndo || false}
                canRedo={canvasRef.current?.canRedo || false}
                onAddShape={(type) => addElement(type)}
                onAddTable={(rows, cols) => addElement("table", { rows, cols })}
                onAddPlaceholder={handleAddPlaceholder}
                onActivateShapeDrawing={activateShapeDrawing}
                showShapeSelector={false}
                showTableCreator={false}
                onActivateBarcodeDrawing={activateBarcodeDrawing}
                showBarcodeSelector={false}
                selectedBarcodeType={selectedBarcodeType}
                setSelectedBarcodeType={setSelectedBarcodeType}
                onBringForward={handleBringForward}
                onSendBackward={handleSendBackward}
                onAlign={handleAlign}
              />
            </div>
          </div>
        )}
      </div>

      {/* AI Chatbot Integrations */}
      {!isOperator && (
        <AIChatbot
          onGenerateElements={(newElements, nextLabelSize, isNewRequest) => {
            if (nextLabelSize) setLabelSize(nextLabelSize);
            if (isNewRequest) {
              setElements(newElements);
              hasAiContent.current = true;
            } else {
              setElements((prev) => [...prev, ...newElements]);
              hasAiContent.current = true;
            }
          }}
          labelSize={labelSize}
          generateId={generateId}
        />
      )}
    </div>
  );
};

export default LabelDesigner;
