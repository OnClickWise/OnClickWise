"use client";

import * as React from "react";

import { useSearchParams } from "next/navigation";

import { useTranslations, useLocale } from "next-intl";

import { AppSidebar } from "@/components/app-sidebar";

import AuthGuard from "@/components/AuthGuard";

import RoleGuard from "@/components/RoleGuard";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Separator } from "@/components/ui/separator";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  Search,
  Plus,
  Download,
  Upload,
  Trash2,
  Edit,
  X,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Check,
  Filter,
  XCircle,
  ArrowUp,
  ArrowDown,
  Copy,
  File,
  FileText,
  Image,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  Loader2,
  Eye,
  Trash,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  User,
  Hash,
  Clock,
  Info,
  Tag,
  Briefcase,
  CreditCard,
  FileDigit,
  MapPin,
  Columns,
  EyeOff,
  GripVertical,
} from "lucide-react";

import * as XLSX from "xlsx";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  apiService,
  Lead,
  CreateLeadRequest,
  UpdateLeadRequest,
  Attachment,
} from "@/services/LeadService";

import { useApi } from "@/hooks/useApi";
import { pipelineService, PipelineStage } from "@/services/pipelineService";

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

const IMPORT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const IMPORT_MAX_ROWS = 5000;
const IMPORT_MAX_COLUMNS = 100;
const DANGEROUS_IMPORT_KEYS = new Set(["__proto__", "prototype", "constructor"]);

// Removed SAMPLE_LEADS - now using API

// Sortable Column Item Component using HTML5 Drag and Drop
interface SortableColumnItemProps {
  id: string;
  label: string;
  visible: boolean;
  onToggle: () => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  isDragging: boolean;
  isDraggedOver: boolean;
}

function SortableColumnItem({
  id,
  label,
  visible,
  onToggle,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging,
  isDraggedOver,
}: SortableColumnItemProps) {
  return (
    <div
      className={`
        relative flex items-center gap-2 px-2 py-2 rounded-sm cursor-default 
        transition-all duration-200
        ${isDragging ? "opacity-30 scale-95" : "opacity-100 scale-100"} 
        ${isDraggedOver ? "bg-primary/10" : "hover:bg-accent"}
        ${isDraggedOver ? "border-t-2 border-primary" : ""}
      `}
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={(e) => onDragOver(e, id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, id)}
    >
      {isDraggedOver && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
      )}
      <div
        className="cursor-grab active:cursor-grabbing touch-none"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <button
        onClick={onToggle}
        className="flex-1 flex items-center justify-between cursor-pointer"
      >
        <span className="text-sm">{label}</span>
        {visible ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

export default function LeadsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = React.use(params);

  const { isClient, apiCall } = useApi();

  const t = useTranslations("Leads");
  const locale = useLocale();

  // Pipeline stages for status options
  const [pipelineStages, setPipelineStages] = React.useState<
    Array<PipelineStage>
  >([]);
  const [isLoadingStages, setIsLoadingStages] = React.useState(false);

  const getInitialPipelineStatus = React.useCallback(() => {
    if (!pipelineStages.length) return "new";

    const sortedStages = [...pipelineStages].sort((a, b) => (a.order || 0) - (b.order || 0));
    const initialStage = sortedStages[0];

    return initialStage?.slug || "new";
  }, [pipelineStages]);

  const extractEmployees = React.useCallback((response: any) => {
    const fromData = response?.data?.employees;
    const fromRoot = response?.employees;
    const candidates = Array.isArray(fromData) ? fromData : Array.isArray(fromRoot) ? fromRoot : [];

    return candidates.filter((u: any) => u?.id && u?.name);
  }, []);

  // Helper function to format currency based on locale
  const formatCurrency = React.useCallback(
    (value: number) => {
      return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "en-US", {
        style: "currency",
        currency: locale === "pt-BR" ? "BRL" : "USD",
      }).format(value);
    },
    [locale],
  );

  // Função para obter identificador único e persistente do usuário
  const getUserIdentifier = React.useCallback(() => {
    if (typeof window === "undefined") return null;
    try {
      const token = localStorage.getItem("token");
      const organizationStr = localStorage.getItem("organization");
    } catch (error) {
      console.error("Error getting user identifier:", error);
      return null;
    }
  }, []);

  const [userId, setUserId] = React.useState<string | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  // Detectar se é mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint do Tailwind
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Obter o userId quando o componente montar ou quando a organização mudar
  React.useEffect(() => {
    const updateUserId = () => {
      const id = getUserIdentifier();
      setUserId("id");
    };

    updateUserId();

    // Listener para detectar mudanças no localStorage (quando trocar de conta em outra aba)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "organization" || e.key === "token" || e.key === null) {
        updateUserId();
      }
    };

    // Listener para quando a aba recebe foco (usuário volta à aba)
    const handleFocus = () => {
      updateUserId();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [getUserIdentifier]);

  const storageKey = React.useMemo(() => `leads_${org}`, [org]);
  const columnsStorageKey = React.useMemo(
    () => (userId ? `leadColumns_${org}_${userId}` : null),
    [org, userId],
  );
  const columnOrderStorageKey = React.useMemo(
    () => (userId ? `leadColumnOrder_${org}_${userId}` : null),
    [org, userId],
  );

  const searchParams = useSearchParams();

  const [leads, setLeads] = React.useState<Lead[]>([]);

  const [totalLeads, setTotalLeads] = React.useState<number>(0); // Total de leads no banco (sem filtros)

  const [filteredLeads, setFilteredLeads] = React.useState<Lead[]>([]);

  const [searchTerm, setSearchTerm] = React.useState("");

  const [selectedLeads, setSelectedLeads] = React.useState<Set<string>>(
    new Set(),
  );

  const [sortField, setSortField] = React.useState<keyof Lead | null>(null);

  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "asc",
  );

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const [confirmInput, setConfirmInput] = React.useState("");

  const [pendingDeletionIds, setPendingDeletionIds] = React.useState<string[]>(
    [],
  );

  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Selection helpers

  const [lastClickedIndex, setLastClickedIndex] = React.useState<number | null>(
    null,
  );

  const [isBulkEditOpen, setIsBulkEditOpen] = React.useState(false);

  const [bulkStatus, setBulkStatus] = React.useState<string>(""); // empty = keep

  const [bulkSource, setBulkSource] = React.useState<string>(""); // empty = keep

  // Bulk edit confirmation
  const [bulkEditConfirm, setBulkEditConfirm] = React.useState("");

  // Pipeline bulk actions
  const [isPipelineModalOpen, setIsPipelineModalOpen] = React.useState(false);
  const [pipelineAction, setPipelineAction] = React.useState<"add" | "remove">(
    "add",
  );

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [isImportOpen, setIsImportOpen] = React.useState(false);

  const [isDragActive, setIsDragActive] = React.useState(false);

  const [isImporting, setIsImporting] = React.useState(false);
  const [isProcessingFile, setIsProcessingFile] = React.useState(false);

  const [importProgress, setImportProgress] = React.useState({
    current: 0,
    total: 0,
    batch: 0,
    totalBatches: 0,
  });
  const [importCancelled, setImportCancelled] = React.useState(false);
  const [filePreview, setFilePreview] = React.useState<{
    leads: Lead[];
    fields: string[];
    totalLeads: number;
  } | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);
  // Toast notifications stack (top-right)

  const [toasts, setToasts] = React.useState<
    { id: string; text: string; type: "success" | "warning" | "error" }[]
  >([]);

  // Import progress notification
  const [importNotification, setImportNotification] = React.useState<{
    show: boolean;
    progress: {
      current: number;
      total: number;
      batch: number;
      totalBatches: number;
    };
    cancelled: boolean;
  }>({
    show: false,
    progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
    cancelled: false,
  });

  // Bulk edit progress notification
  const [editNotification, setEditNotification] = React.useState<{
    show: boolean;
    progress: {
      current: number;
      total: number;
      batch: number;
      totalBatches: number;
    };
    cancelled: boolean;
  }>({
    show: false,
    progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
    cancelled: false,
  });
  // Show top pagination when scrolling
  const [showTopPagination, setShowTopPagination] = React.useState(false);
  const lastScrollTop = React.useRef(0);
  const scrollDirection = React.useRef<"up" | "down">("down");
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Footer refs (footer is always fixed now)
  const footerRef = React.useRef<HTMLDivElement>(null);
  const footerPlaceholderRef = React.useRef<HTMLDivElement>(null);
  const sidebarInsetRef = React.useRef<HTMLElement | null>(null);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const [footerLeft, setFooterLeft] = React.useState<number | null>(null);
  const [footerWidth, setFooterWidth] = React.useState<string | null>(null);
  // Select all leads confirmation
  const [showSelectAllConfirm, setShowSelectAllConfirm] = React.useState(false);
  // Show select all leads button
  const [showSelectAllButton, setShowSelectAllButton] = React.useState(false);
  // Delete progress notification
  const [deleteNotification, setDeleteNotification] = React.useState<{
    show: boolean;
    progress: {
      current: number;
      total: number;
      batch: number;
      totalBatches: number;
    };
    cancelled: boolean;
  }>({
    show: false,
    progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
    cancelled: false,
  });
  // Track if deletion is being cancelled
  const [isDeletionCancelled, setIsDeletionCancelled] = React.useState(false);
  // Ref for immediate access to cancellation state
  const isDeletionCancelledRef = React.useRef(false);

  // Track if bulk edit is being cancelled
  const [isEditCancelled, setIsEditCancelled] = React.useState(false);
  // Ref for immediate access to edit cancellation state
  const isEditCancelledRef = React.useRef(false);

  // Track bulk assign modal and users
  const [isBulkAssignOpen, setIsBulkAssignOpen] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [bulkAssignConfirm, setBulkAssignConfirm] = React.useState("");
  const [organizationUsers, setOrganizationUsers] = React.useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const [assignNotification, setAssignNotification] = React.useState({
    show: false,
    progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
    cancelled: false,
  });

  // Track quick assign for individual lead
  const [quickAssignLeadId, setQuickAssignLeadId] = React.useState<
    string | null
  >(null);
  const [quickAssignUserId, setQuickAssignUserId] = React.useState("");
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);

  // Track deleted leads for potential rollback
  const [deletedLeads, setDeletedLeads] = React.useState<Lead[]>([]);
  // Track imported leads for potential rollback
  const [importedLeads, setImportedLeads] = React.useState<Lead[]>([]);
  const [currentImportLeads, setCurrentImportLeads] = React.useState<Lead[]>(
    [],
  );
  // Track original leads before bulk edit for potential rollback
  const [originalLeads, setOriginalLeads] = React.useState<Lead[]>([]);
  const [currentEditLeads, setCurrentEditLeads] = React.useState<Lead[]>([]);
  // Track if import is being cancelled
  const [isImportCancelled, setIsImportCancelled] = React.useState(false);
  // Ref for immediate access to import cancellation state
  const isImportCancelledRef = React.useRef(false);

  // Attachment states
  const [isAttachmentDragActive, setIsAttachmentDragActive] =
    React.useState(false);
  const [uploadingAttachments, setUploadingAttachments] = React.useState<{
    [leadId: string]: boolean;
  }>({});
  const [attachmentProgress, setAttachmentProgress] = React.useState<{
    [leadId: string]: number;
  }>({});
  const attachmentFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Local attachment management (pending changes)
  const [pendingAttachments, setPendingAttachments] = React.useState<{
    [leadId: string]: { toAdd: File[]; toRemove: string[] };
  }>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  // Track original form values for change detection
  const [originalFormValues, setOriginalFormValues] = React.useState<{
    name: string;
    email: string;
    phone: string;
    ssn: string;
    ein: string;
    source: string;
    location: string;
    interest: string;
    status: string;
    value: string;
    estimatedCloseDate: string;
  } | null>(null);

  // Toast notification for unsaved changes
  const [unsavedChangesToast, setUnsavedChangesToast] = React.useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: "" });

  // Function to check if form has changes
  const hasFormChanges = () => {
    if (!originalFormValues) return false;

    return (
      name !== originalFormValues.name ||
      email !== originalFormValues.email ||
      phone !== originalFormValues.phone ||
      ssn !== originalFormValues.ssn ||
      ein !== originalFormValues.ein ||
      source !== originalFormValues.source ||
      leadLocation !== originalFormValues.location ||
      interest !== originalFormValues.interest ||
      status !== originalFormValues.status ||
      value !== originalFormValues.value ||
      estimatedCloseDate !== originalFormValues.estimatedCloseDate
    );
  };

  // Function to check for unsaved changes and show confirmation
  const handleModalClose = () => {
    const hasAttachmentChanges =
      Object.keys(pendingAttachments).length > 0 &&
      Object.values(pendingAttachments).some(
        (p) => p.toAdd.length > 0 || p.toRemove.length > 0,
      );
    const hasFieldChanges = hasFormChanges();

    if (hasAttachmentChanges || hasFieldChanges) {
      setUnsavedChangesToast({
        show: true,
        message: t("modal.unsavedChanges"),
      });
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setUnsavedChangesToast({ show: false, message: "" });
      }, 3000);
    } else {
      setIsModalOpen(false);
      setEditingId(null);
      setPreview({ open: false, lead: null });
    }
  };

  // Function to confirm discard changes (called when clicking outside again)
  const confirmDiscardChanges = () => {
    // Clear all pending changes
    setPendingAttachments({});
    setHasUnsavedChanges(false);
    setUnsavedChangesToast({ show: false, message: "" });
    setOriginalFormValues(null);
    setIsModalOpen(false);
    setEditingId(null);
    setPreview({ open: false, lead: null });
  };

  // Preview modal for viewing selected lead details

  const [preview, setPreview] = React.useState<{
    open: boolean;
    lead: Lead | null;
  }>({ open: false, lead: null });

  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const [assignedUserName, setAssignedUserName] = React.useState<string>("");
  const [createdByUserName, setCreatedByUserName] = React.useState<string>("");

  // Fetch assigned user and created by user names when preview opens
  React.useEffect(() => {
    const fetchUsers = async () => {
      if (
        preview.open &&
        (preview.lead?.assigned_user_id || preview.lead?.created_by)
      ) {
        try {
          const response = await apiService.getOrganizationUsers(true); // Include master users
          if (response.success && response.data) {
            if (preview.lead?.assigned_user_id) {
              const assignedUser = response.data.employees.find(
                (u) => u.id === preview.lead?.assigned_user_id,
              );
              setAssignedUserName(assignedUser?.name || "Unknown User");
            }
            if (preview.lead?.created_by) {
              const createdByUser = response.data.employees.find(
                (u) => u.id === preview.lead?.created_by,
              );
              setCreatedByUserName(createdByUser?.name || "Unknown User");
            }
          }
        } catch (error) {
          console.error("Error fetching users:", error);
          if (preview.lead?.assigned_user_id)
            setAssignedUserName("Unknown User");
          if (preview.lead?.created_by) setCreatedByUserName("Unknown User");
        }
      } else {
        setAssignedUserName("");
        setCreatedByUserName("");
      }
    };

    fetchUsers();
  }, [preview.open, preview.lead?.assigned_user_id, preview.lead?.created_by]);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = React.useState<
    Record<string, boolean>
  >({
    name: true,
    email: true,
    phone: true,
    ssn: false,
    ein: false,
    status: true,
    value: false,
    estimatedCloseDate: false,
    location: true,
    interest: true,
  });

  // Column order state
  const [columnOrder, setColumnOrder] = React.useState<string[]>([
    "name",
    "email",
    "phone",
    "ssn",
    "ein",
    "status",
    "value",
    "estimatedCloseDate",
    "location",
    "interest",
  ]);

  // Cleanup old shared keys from localStorage (run once)
  React.useEffect(() => {
    if (typeof window !== "undefined" && isClient) {
      // Remove old shared keys that shouldn't be used anymore
      const oldKeys = [`leadColumns_${org}`, `leadColumnOrder_${org}`];
      oldKeys.forEach((key) => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [isClient, org]);

  // Load column preferences from localStorage after org and userId are available
  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      org &&
      userId &&
      columnsStorageKey &&
      columnOrderStorageKey
    ) {
      const savedColumns = localStorage.getItem(columnsStorageKey);
      if (savedColumns) {
        setVisibleColumns(JSON.parse(savedColumns));
      }

      const savedOrder = localStorage.getItem(columnOrderStorageKey);
      if (savedOrder) {
        setColumnOrder(JSON.parse(savedOrder));
      }
    }
  }, [org, userId, columnsStorageKey, columnOrderStorageKey]);

  // Save column preferences to localStorage (only if keys are not null)
  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      org &&
      userId &&
      columnsStorageKey !== null
    ) {
      localStorage.setItem(columnsStorageKey, JSON.stringify(visibleColumns));
    }
  }, [visibleColumns, org, userId, columnsStorageKey]);

  // Save column order to localStorage (only if keys are not null)
  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      org &&
      userId &&
      columnOrderStorageKey !== null
    ) {
      localStorage.setItem(columnOrderStorageKey, JSON.stringify(columnOrder));
    }
  }, [columnOrder, org, userId, columnOrderStorageKey]);

  // Clean up invalid columns from state and localStorage
  React.useEffect(() => {
    const validColumnIds = Object.keys(columnLabels);
    const filteredOrder = columnOrder.filter((id) =>
      validColumnIds.includes(id),
    );
    const filteredVisibility = Object.fromEntries(
      Object.entries(visibleColumns).filter(([key]) =>
        validColumnIds.includes(key),
      ),
    );

    if (filteredOrder.length !== columnOrder.length) {
      setColumnOrder(filteredOrder);
    }

    if (
      Object.keys(filteredVisibility).length !==
      Object.keys(visibleColumns).length
    ) {
      setVisibleColumns(filteredVisibility as Record<string, boolean>);
    }
  }, []); // Run only once on mount

  const toggleColumn = (column: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // HTML5 Drag and Drop for columns
  const [draggedColumn, setDraggedColumn] = React.useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(
    null,
  );

  const handleColumnDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedColumn(columnId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleColumnDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (draggedColumn && draggedColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleColumnDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleColumnDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();

    if (!draggedColumn || draggedColumn === targetColumnId) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    const draggedIndex = columnOrder.indexOf(draggedColumn);
    const targetIndex = columnOrder.indexOf(targetColumnId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    const newColumnOrder = [...columnOrder];
    newColumnOrder.splice(draggedIndex, 1);
    newColumnOrder.splice(targetIndex, 0, draggedColumn);

    setColumnOrder(newColumnOrder);
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  // Column labels mapping
  const columnLabels: Record<string, string> = {
    name: t("columns.name"),
    email: t("columns.email"),
    phone: t("columns.phone"),
    ssn: t("columns.ssn"),
    ein: t("columns.ein"),
    status: t("columns.status"),
    value: t("columns.value"),
    location: t("columns.location"),
    interest: t("columns.interest"),
    estimatedCloseDate: t("columns.estimatedCloseDate"),
  };

  // Render table header for a column
  const renderColumnHeader = (columnId: string) => {
    if (!visibleColumns[columnId]) return null;

    const sortableColumns = [
      "name",
      "email",
      "phone",
      "ssn",
      "ein",
      "status",
      "value",
      "estimatedCloseDate",
      "location",
      "interest",
    ];
    const sortFieldMap: Record<string, string> = {
      name: "name",
      email: "email",
      phone: "phone",
      ssn: "ssn",
      ein: "ein",
      status: "status",
      value: "value",
      estimatedCloseDate: "estimated_close_date",
      location: "location",
      interest: "interest",
    };

    const widthMap: Record<string, string> = {
      name: "min-w-[120px] max-w-[140px] w-[140px]",
      email: "min-w-[130px] max-w-[160px] w-[160px]",
      phone: "min-w-[100px] max-w-[120px] w-[120px]",
      ssn: "min-w-[90px] max-w-[100px] w-[100px]",
      ein: "min-w-[90px] max-w-[100px] w-[100px]",
      status: "min-w-[80px] max-w-[90px] w-[90px]",
      value: "min-w-[80px] max-w-[90px] w-[90px]",
      estimatedCloseDate: "min-w-[90px] max-w-[100px] w-[100px]",
      location: "min-w-[100px] max-w-[130px] w-[130px]",
      interest: "min-w-[120px] max-w-[180px] w-[180px]",
    };

    const isSortable = sortableColumns.includes(columnId);
    const field = sortFieldMap[columnId];

    return (
      <th
        key={columnId}
        className={`py-2.5 px-2 border-r border-border/40 font-semibold text-xs ${widthMap[columnId] || "w-auto"}`}
      >
        {isSortable ? (
          <div
            className="flex items-center gap-1 cursor-pointer hover:text-primary select-none w-fit transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              // Save current scroll position
              const container = tableContainerRef.current;
              const scrollLeft = container?.scrollLeft || 0;

              // Perform sort
              handleSort(field as keyof Lead);

              // Restore scroll position to prevent unwanted horizontal scrolling
              if (container) {
                // Use double requestAnimationFrame to ensure DOM has updated
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    if (container) {
                      container.scrollLeft = scrollLeft;
                    }
                  });
                });
              }
            }}
          >
            {columnLabels[columnId]}
            {sortField === field &&
              (sortDirection === "asc" ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              ))}
          </div>
        ) : (
          <span className="font-semibold">{columnLabels[columnId]}</span>
        )}
      </th>
    );
  };

  // Render table cell for a column
  const renderColumnCell = (columnId: string, lead: Lead) => {
    if (!visibleColumns[columnId]) return null;

    switch (columnId) {
      case "name":
        return (
          <td key={columnId} className="py-2.5 px-2 border-r border-border/30">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <div
                  className="truncate hover:underline decoration-dotted cursor-pointer font-medium text-sm"
                  title={lead.name}
                  onClick={() => setPreview({ open: true, lead })}
                >
                  {lead.name}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {lead.show_on_pipeline && (
                    <span
                      className="inline-flex items-center justify-center rounded-full bg-green-100 p-1"
                      title={t("table.onPipeline")}
                    >
                      <CheckCircle2 className="h-3 w-3 text-green-700" />
                    </span>
                  )}
                  {lead.assigned_user_id && (
                    <span
                      className="inline-flex items-center justify-center rounded-full bg-blue-100 p-1"
                      title={t("table.assignedToUser")}
                    >
                      <UserPlus className="h-3 w-3 text-blue-700" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </td>
        );
      case "email":
        return (
          <td key={columnId} className="py-2.5 px-2 border-r border-border/30">
            <div className="truncate text-xs" title={lead.email}>
              {lead.email || "-"}
            </div>
          </td>
        );
      case "phone":
        return (
          <td key={columnId} className="py-2.5 px-2 border-r border-border/30">
            <div className="truncate text-xs" title={lead.phone}>
              {lead.phone || "-"}
            </div>
          </td>
        );
      case "ssn":
        return (
          <td key={columnId} className="py-2.5 px-2 border-r border-border/30">
            <div className="truncate text-xs font-mono" title={lead.ssn}>
              {lead.ssn || "-"}
            </div>
          </td>
        );
      case "ein":
        return (
          <td key={columnId} className="py-2.5 px-2 border-r border-border/30">
            <div className="truncate text-xs font-mono" title={lead.ein}>
              {lead.ein || "-"}
            </div>
          </td>
        );
      case "status":
        return (
          <td key={columnId} className="py-2.5 px-2 border-r border-border/30">
            <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
              {lead.status}
            </span>
          </td>
        );
      case "value":
        return (
          <td key={columnId} className="py-2.5 px-2 border-r border-border/30">
            <div className="text-xs font-semibold text-green-600 whitespace-nowrap">
              {lead.value ? `$${lead.value.toLocaleString()}` : "-"}
            </div>
          </td>
        );
      case "estimatedCloseDate":
        return (
          <td key={columnId} className="py-2.5 px-2 border-r border-border/30">
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {lead.estimated_close_date
                ? new Date(lead.estimated_close_date).toLocaleDateString(
                    "pt-BR",
                  )
                : "-"}
            </div>
          </td>
        );
      case "location":
        return (
          <td
            key={columnId}
            className="py-2.5 px-2 border-r border-border/30 max-w-[130px]"
          >
            <div className="truncate text-xs max-w-full" title={lead.location}>
              {lead.location || "-"}
            </div>
          </td>
        );
      case "interest":
        return (
          <td
            key={columnId}
            className="py-2.5 px-2 border-r border-border/30 max-w-[180px]"
          >
            <div className="truncate text-xs max-w-full" title={lead.interest}>
              {lead.interest || "-"}
            </div>
          </td>
        );
      default:
        return null;
    }
  };
  // Filter modal and state

  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  const [filters, setFilters] = React.useState({
    name: "",

    email: "",

    phone: "",

    ssn: "",

    ein: "",

    source: "",

    location: "",

    interest: "",

    status: "",

    pipeline: "",

    assignedUserId: "",
  });

  const [valueRange, setValueRange] = React.useState({
    min: "",

    max: "",
  });

  const [dateRange, setDateRange] = React.useState({
    min: "",

    max: "",
  });

  // Load users when filter modal opens
  React.useEffect(() => {
    const loadUsers = async () => {
      if (isFilterOpen && organizationUsers.length === 0) {
        try {
          const response = await apiService.getOrganizationUsers(true);
          if (response.success) {
            setOrganizationUsers(extractEmployees(response));
          }
        } catch (error) {
          console.error("Error loading users for filter:", error);
        }
      }
    };

    loadUsers();
  }, [isFilterOpen, organizationUsers.length, extractEmployees]);

  // Função para validar data

  const validateDate = (dateString: string): boolean => {
    if (!dateString) return true; // Permitir campo vazio

    // Validar formato YYYY-MM-DD

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(dateString)) {
      return false;
    }

    // Validar ano (deve ter exatamente 4 dígitos)

    const year = parseInt(dateString.split("-")[0]);

    if (year < 1000 || year > 9999) {
      return false;
    }

    // Validar se a data é válida

    const dateObj = new Date(dateString);

    return !isNaN(dateObj.getTime());
  };

  const [name, setName] = React.useState("");

  const [email, setEmail] = React.useState("");

  const [phone, setPhone] = React.useState("");

  const [ssn, setSsn] = React.useState("");

  const [ein, setEin] = React.useState("");

  const [source, setSource] = React.useState("");

  const [leadLocation, setLeadLocation] = React.useState("");

  const [interest, setInterest] = React.useState("");

  const [status, setStatus] = React.useState<Lead["status"]>("New");

  const [customStatus, setCustomStatus] = React.useState("");

  const [value, setValue] = React.useState("");

  const [estimatedCloseDate, setEstimatedCloseDate] = React.useState("");

  const [description, setDescription] = React.useState("");

  // Memoized status calculations for performance
  const statusSelectValue = React.useMemo(() => {
    const normalizedStatus = String(status).toLowerCase().replace(/\s+/g, "-");
    const matchingStage = pipelineStages.find(
      (stage) => stage.slug === normalizedStatus,
    );
    if (matchingStage) return matchingStage.slug;

    const legacyStatuses = ["New", "In Contact", "Qualified", "Lost"];
    if (legacyStatuses.includes(String(status))) {
      return String(status);
    }

    return "custom";
  }, [status, pipelineStages]);

  const showCustomStatusField = React.useMemo(() => {
    const normalizedStatus = String(status).toLowerCase().replace(/\s+/g, "-");
    const matchingStage = pipelineStages.find(
      (stage) => stage.slug === normalizedStatus,
    );
    const isLegacyStatus = ["New", "In Contact", "Qualified", "Lost"].includes(
      String(status),
    );
    return !matchingStage && !isLegacyStatus;
  }, [status, pipelineStages]);

  const bulkEditStageOptions = React.useMemo(() => {
    const statusMap: Record<string, string> = {
      new: "New",
      contact: "In Contact",
      qualified: "Qualified",
      lost: "Lost",
    };

    return pipelineStages.map((stage) => {
      const stageValue = stage.translation_key
        ? statusMap[stage.slug] || stage.slug
        : stage.slug;

      return (
        <option key={stage.id} value={stageValue}>
          {stage.translation_key
            ? t(`statuses.${stage.slug}` as any)
            : stage.name}
        </option>
      );
    });
  }, [pipelineStages, t]);

  // Field limits

  const FIELD_MAX = React.useMemo(
    () => ({
      name: 150, // limite do banco de dados

      email: 150, // limite do banco de dados

      phone: 20, // formato internacional +55 11 99999-9999

      ssn: 20, // SSN americano: 123-45-6789

      ein: 20, // EIN americano

      source: 100, // origem do lead

      status: 50, // status customizado

      description: 500, // descrição/notas

      value: 15, // valor monetário (ex: 999999999.99)

      date: 10, // data no formato YYYY-MM-DD
    }),
    [],
  );

  // Load all leads from API - simplified approach
  React.useEffect(() => {
    const loadAllLeads = async () => {
      try {
        // Use only the basic call that works
        const response = await apiService.getLeads();

        if (response.success && response.data) {
          setLeads(response.data.leads);
          // Atualizar o total se foi retornado pela API
          if (response.data.total !== undefined) {
            setTotalLeads(response.data.total);
          } else {
            // Fallback: usar o tamanho do array se total não estiver disponível
            setTotalLeads(response.data.leads.length);
          }
        } else {
          console.error("Failed to load leads:", response.error);

          pushToast(
            t("notifications.errorLoadingLeads") ||
              t("notifications.errorLoading"),
            "error",
          );
        }
      } catch (error) {
        console.error("Error loading leads:", error);

        pushToast(t("notifications.errorLoadingLeads"), "error");
      }
    };

    // Always run, not just on client side

    loadAllLeads();
  }, []);

  // Calculate footer position based on SidebarInset
  React.useEffect(() => {
    if (!isClient) return;

    const handleUpdate = () => {
      // Try to find SidebarInset by ref first
      if (sidebarInsetRef.current) {
        const rect = sidebarInsetRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.left >= 0) {
          setFooterLeft(rect.left);
          setFooterWidth(`${rect.width}px`);
          return;
        }
      }

      // Fallback: find by data attribute
      const sidebarInset = document.querySelector(
        '[data-slot="sidebar-inset"]',
      ) as HTMLElement;
      if (sidebarInset) {
        const rect = sidebarInset.getBoundingClientRect();
        if (rect.width > 0 && rect.left >= 0) {
          setFooterLeft(rect.left);
          setFooterWidth(`${rect.width}px`);
        }
      }
    };

    // Try immediately
    handleUpdate();

    // Also try with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(handleUpdate, 100);

    // Update on resize and scroll
    window.addEventListener("resize", handleUpdate, { passive: true });
    window.addEventListener("scroll", handleUpdate, { passive: true });

    // Use ResizeObserver to watch for sidebar changes
    let resizeObserver: ResizeObserver | null = null;

    // Observe SidebarInset if available
    if (sidebarInsetRef.current) {
      resizeObserver = new ResizeObserver(handleUpdate);
      resizeObserver.observe(sidebarInsetRef.current);
    } else {
      // Try to find and observe by selector
      const sidebarInset = document.querySelector(
        '[data-slot="sidebar-inset"]',
      );
      if (sidebarInset) {
        resizeObserver = new ResizeObserver(handleUpdate);
        resizeObserver.observe(sidebarInset);
      }
    }

    // Also observe the sidebar element if possible
    const sidebarElement = document.querySelector("[data-sidebar]");
    if (sidebarElement && resizeObserver) {
      resizeObserver.observe(sidebarElement);
    }

    // Use MutationObserver to watch for DOM changes
    const mutationObserver = new MutationObserver(() => {
      handleUpdate();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      mutationObserver.disconnect();
    };
  }, [isClient]);

  // Detect scroll to show top pagination
  React.useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Detect scroll direction
      if (scrollTop > lastScrollTop.current) {
        scrollDirection.current = "down";
      } else if (scrollTop < lastScrollTop.current) {
        scrollDirection.current = "up";
      }
      lastScrollTop.current = scrollTop;

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Only show top pagination when:
      // 1. Scrolled down significantly (more than 300px)
      // 2. There's more content below
      // 3. NOT scrolling up rapidly (when scrolling up, hide immediately)
      const isScrolledDown = scrollTop > 300;
      const hasMoreContentBelow =
        documentHeight - scrollTop - windowHeight > 200;
      const isScrollingUp = scrollDirection.current === "up";

      if (isScrollingUp) {
        // Hide immediately when scrolling up
        setShowTopPagination(false);
      } else if (isScrolledDown && hasMoreContentBelow) {
        // When scrolling down, add a small delay to avoid flickering during fast scroll
        scrollTimeoutRef.current = setTimeout(() => {
          setShowTopPagination(true);
        }, 150); // 150ms delay
      } else {
        setShowTopPagination(false);
      }
    };

    // Use requestAnimationFrame for better performance
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll(); // Check initial state

    // Also check on resize
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isClient]);

  // Search leads with backend filters

  const searchLeads = React.useCallback(
    async (searchParams: {
      search?: string;

      status?: string;

      source?: string;

      pipeline?: string;

      value_min?: number;

      value_max?: number;

      date_min?: string;

      date_max?: string;

      sort?: string;

      order?: "asc" | "desc";
    }) => {
      try {
        const response = await apiService.searchLeads(searchParams);

        if (response.success && response.data) {
          setLeads(response.data.leads);

          setFilteredLeads(response.data.leads);

          // Atualizar o total se foi retornado pela API
          if (response.data.total !== undefined) {
            setTotalLeads(response.data.total);
          }

          return response.data.leads;
        } else {
          console.error("Failed to search leads:", response.error);

          pushToast(t("notifications.errorSearching"), "error");

          return [];
        }
      } catch (error) {
        console.error("Error searching leads:", error);

        pushToast(t("notifications.errorSearching"), "error");

        return [];
      }
    },
    [],
  );

  // Initialize search term from URL parameters

  React.useEffect(() => {
    const searchFromUrl = searchParams.get("search");

    if (searchFromUrl) {
      setSearchTerm(decodeURIComponent(searchFromUrl));
    }
  }, [searchParams]);

  // Removed localStorage logic - now using API

  // Helpers: notifications

  function pushToast(
    message: string,
    type: "success" | "warning" | "error" = "success",
    timeoutMs = 4000,
  ) {
    const id = createId();

    setToasts((prev) => [...prev, { id, text: message, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, timeoutMs);
  }

  // Função de ordenação local
  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);

      setSortDirection("asc");
    }

    // Aplicar ordenação local aos leads filtrados
    const sortedLeads = [...filteredLeads].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Tratar valores nulos/undefined
      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";

      // Tratar valores numéricos (value)
      if (field === "value") {
        const aNum = parseFloat(aValue as string) || 0;
        const bNum = parseFloat(bValue as string) || 0;
        return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
      }

      // Tratar datas (estimated_close_date)
      if (field === "estimated_close_date") {
        const aDate = new Date(aValue as string);
        const bDate = new Date(bValue as string);
        if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
        if (isNaN(aDate.getTime())) return 1;
        if (isNaN(bDate.getTime())) return -1;
        return sortDirection === "asc"
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }

      // Tratar strings (source, status)
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortDirection === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    setFilteredLeads(sortedLeads);
  };

  const reloadLeads = async () => {
    try {
      const response = await apiService.getLeads();
      if (response.success && response.data) {
        const newLeads = response.data.leads || [];
        setLeads(newLeads);
        setFilteredLeads(newLeads);
        // Atualizar o total se foi retornado pela API
        if (response.data.total !== undefined) {
          setTotalLeads(response.data.total);
        } else {
          // Fallback: usar o tamanho do array se total não estiver disponível
          setTotalLeads(newLeads.length);
        }
      }
    } catch (error) {
      console.error("Error reloading leads:", error);
    }
  };

  // Force refresh function that ensures complete sync
  const forceRefreshLeads = async () => {
    try {
      const response = await apiService.getLeads();
      if (response.success && response.data) {
        const newLeads = response.data.leads || [];
        setLeads(newLeads);
        setFilteredLeads(newLeads);
        // Atualizar o total de leads
        if (response.data.total !== undefined) {
          setTotalLeads(response.data.total);
        } else {
          setTotalLeads(newLeads.length);
        }
      }
    } catch (error) {
      console.error("Error force refreshing leads:", error);
    }
  };

  // Immediate sync function for after CRUD operations
  const syncAfterOperation = async () => {
    try {
      // Aumentar o delay para garantir que o backend tenha processado completamente
      // especialmente para operações em massa (importação/deleção)
      await new Promise((resolve) => setTimeout(resolve, 500));
      await forceRefreshLeads();
      // Aguardar um pouco mais e verificar novamente para garantir que o total está correto
      await new Promise((resolve) => setTimeout(resolve, 500));
      await forceRefreshLeads();
    } catch (error) {
      console.error("Error syncing after operation:", error);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");

    setFilters({
      name: "",

      email: "",

      phone: "",

      ssn: "",

      ein: "",

      source: "",

      location: "",

      interest: "",

      status: "",

      pipeline: "",

      assignedUserId: "",
    });

    setValueRange({
      min: "",

      max: "",
    });

    setDateRange({
      min: "",

      max: "",
    });

    setSortField(null);

    setSortDirection("asc");

    // Reload all leads when clearing filters
    reloadLeads();
  };

  const clearSort = () => {
    setSortField(null);

    setSortDirection("asc");
  };

  // Debounced search function

  const debouncedSearch = React.useMemo(() => {
    let timeoutId: NodeJS.Timeout;

    return (searchParams: any) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        searchLeads(searchParams);
      }, 300); // 300ms debounce
    };
  }, [searchLeads]);

  // Apply search term only (real-time)

  React.useEffect(() => {
    if (!isClient) return;

    if (searchTerm) {
      // Use backend search with debounce for search term only

      const searchParams = {
        search: searchTerm,
      };

      debouncedSearch(searchParams);
    } else {
      // No search term, reload all leads from API

      const loadAllLeads = async () => {
        try {
          const response = await apiService.getLeads();

          if (response.success && response.data) {
            setLeads(response.data.leads);
            // Atualizar o total se foi retornado pela API
            if (response.data.total !== undefined) {
              setTotalLeads(response.data.total);
            } else {
              // Fallback: usar o tamanho do array se total não estiver disponível
              setTotalLeads(response.data.leads.length);
            }

            setFilteredLeads(response.data.leads);
          }
        } catch (error) {
          console.error("Error loading all leads:", error);
        }
      };

      loadAllLeads();
    }
  }, [searchTerm, debouncedSearch, isClient]);

  // Load pipeline stages for status dropdown
  React.useEffect(() => {
    const loadStages = async () => {
      if (!isClient) return;

      setIsLoadingStages(true);
      try {
        const response = await pipelineService.getStages();
        // Handle different response formats
        let stagesData = null;

        if (Array.isArray(response)) {
          // Direct array response
          stagesData = response;
        } else if (
          response &&
          response.success &&
          Array.isArray(response.data)
        ) {
          // Success response with data array
          stagesData = response.data;
        } else if (response && Array.isArray(response.data)) {
          // Response with data array (no success field)
          stagesData = response.data;
        }

        if (stagesData && stagesData.length > 0) {
          console.log(stagesData);
          setPipelineStages(stagesData);
        } else {
          // Fallback to default stages if API fails
          console.warn("No pipeline stages loaded, using defaults");
          setPipelineStages([
            {
              id: "1",
              organization_id: "",
              order: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              name: "New",
              slug: "new",
              translation_key: "Pipeline.stages.new",
              color: "bg-blue-100 border-blue-200 text-blue-800",
            },
            {
              id: "2",
              organization_id: "",
              order: 2,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              name: "In Contact",
              slug: "contact",
              translation_key: "Pipeline.stages.contact",
              color: "bg-yellow-100 border-yellow-200 text-yellow-800",
            },
            {
              id: "3",
              organization_id: "",
              order: 3,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              name: "Qualified",
              slug: "qualified",
              translation_key: "Pipeline.stages.qualified",
              color: "bg-green-100 border-green-200 text-green-800",
            },
            {
              id: "4",
              organization_id: "",
              order: 4,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              name: "Lost",
              slug: "lost",
              translation_key: "Pipeline.stages.lost",
              color: "bg-red-100 border-red-200 text-red-800",
            },
          ]);
        }
      } catch (error) {
        console.error("Error loading pipeline stages:", error);
        // Use default stages on error
        setPipelineStages([
          {
            id: "1",
            organization_id: "",
            order: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            name: "New",
            slug: "new",
            translation_key: "Pipeline.stages.new",
            color: "bg-blue-100 border-blue-200 text-blue-800",
          },
          {
            id: "2",
            organization_id: "",
            order: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            name: "In Contact",
            slug: "contact",
            translation_key: "Pipeline.stages.contact",
            color: "bg-yellow-100 border-yellow-200 text-yellow-800",
          },
          {
            id: "3",
            organization_id: "",
            order: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            name: "Qualified",
            slug: "qualified",
            translation_key: "Pipeline.stages.qualified",
            color: "bg-green-100 border-green-200 text-green-800",
          },
          {
            id: "4",
            organization_id: "",
            order: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            name: "Lost",
            slug: "lost",
            translation_key: "Pipeline.stages.lost",
            color: "bg-red-100 border-red-200 text-red-800",
          },
        ]);
      } finally {
        setIsLoadingStages(false);
      }
    };

    loadStages();
  }, [isClient]);
  // Apply modal filters when Apply Filter is clicked

  const applyModalFilters = React.useCallback(async () => {
    if (!isClient) return;

    const hasFilters =
      filters.name ||
      filters.email ||
      filters.phone ||
      filters.ssn ||
      filters.ein ||
      filters.source ||
      filters.location ||
      filters.interest ||
      filters.status ||
      filters.pipeline ||
      filters.assignedUserId ||
      sortField ||
      valueRange.min ||
      valueRange.max ||
      dateRange.min ||
      dateRange.max;

    if (hasFilters) {
      try {
        let allLeads: Lead[] = [];

        // Se temos filtro de pipeline ou assigned user, usar APENAS busca unificada com todos os filtros
        if (filters.pipeline || filters.assignedUserId) {
          const searchParams: any = {};

          if (filters.pipeline) {
            searchParams.show_on_pipeline = filters.pipeline === "true";
          }

          if (filters.assignedUserId) {
            if (filters.assignedUserId === "unassigned") {
              searchParams.assigned_user_id = "null";
            } else {
              searchParams.assigned_user_id = filters.assignedUserId;
            }
          }

          // Adicionar outros filtros se existirem
          if (filters.name) searchParams.name = filters.name;
          if (filters.email) searchParams.email = filters.email;
          if (filters.phone) searchParams.phone = filters.phone;
          if (filters.ssn) searchParams.ssn = filters.ssn;
          if (filters.ein) searchParams.ein = filters.ein;
          if (filters.source) searchParams.source = filters.source;
          if (filters.location) searchParams.location = filters.location;
          if (filters.interest) searchParams.interest = filters.interest;
          if (filters.status) searchParams.status = filters.status;
          if (valueRange.min && !isNaN(parseFloat(valueRange.min)))
            searchParams.value_min = parseFloat(valueRange.min);
          if (valueRange.max && !isNaN(parseFloat(valueRange.max)))
            searchParams.value_max = parseFloat(valueRange.max);
          if (dateRange.min) searchParams.date_min = dateRange.min;
          if (dateRange.max) searchParams.date_max = dateRange.max;

          const response = await apiService.searchLeads(searchParams);

          if (response.success && response.data) {
            allLeads = response.data.leads;
          }
        } else {
          // Caso contrário, buscar por cada campo específico usando rotas separadas

          if (filters.name) {
            const response = await apiService.searchLeadsByName(filters.name);
            if (response.success && response.data) {
              allLeads = [...allLeads, ...response.data.leads];
            }
          }

          if (filters.email) {
            const response = await apiService.searchLeadsByEmail(filters.email);

            if (response.success && response.data) {
              allLeads = [...allLeads, ...response.data.leads];
            }
          }

          if (filters.phone) {
            const response = await apiService.searchLeadsByPhone(filters.phone);

            if (response.success && response.data) {
              allLeads = [...allLeads, ...response.data.leads];
            }
          }

          if (filters.ssn) {
            const response = await apiService.searchLeadsBySSN(filters.ssn);

            if (response.success && response.data) {
              allLeads = [...allLeads, ...response.data.leads];
            }
          }

          if (filters.ein) {
            const response = await apiService.searchLeadsByEIN(filters.ein);

            if (response.success && response.data) {
              allLeads = [...allLeads, ...response.data.leads];
            }
          }

          if (filters.source) {
            const response = await apiService.searchLeadsBySource(
              filters.source,
            );

            if (response.success && response.data) {
              allLeads = [...allLeads, ...response.data.leads];
            }
          }

          if (filters.status) {
            const response = await apiService.searchLeadsByStatus(
              filters.status,
            );

            if (response.success && response.data) {
              allLeads = [...allLeads, ...response.data.leads];
            }
          }

          // Buscas de valueRange e dateRange só se NÃO usamos busca unificada
          // (se usamos, esses filtros já foram incluídos nos parâmetros)
          if (valueRange.min && !isNaN(parseFloat(valueRange.min))) {
            const response = await apiService.searchLeadsByValueMin(
              parseFloat(valueRange.min),
            );

            if (response.success && response.data) {
              allLeads = [...allLeads, ...response.data.leads];
            }
          }

          if (valueRange.max && !isNaN(parseFloat(valueRange.max))) {
            const response = await apiService.searchLeadsByValueMax(
              parseFloat(valueRange.max),
            );

            if (response.success && response.data) {
              allLeads = [...allLeads, ...response.data.leads];
            }
          }

          if (dateRange.min) {
            const response = await apiService.searchLeadsByDateMin(
              dateRange.min,
            );

            if (response.success && response.data) {
              allLeads = [...allLeads, ...response.data.leads];
            }
          }

          if (dateRange.max) {
            const response = await apiService.searchLeadsByDateMax(
              dateRange.max,
            );

            if (response.success && response.data) {
              allLeads = [...allLeads, ...response.data.leads];
            }
          }
        }

        // Remover duplicatas baseado no ID

        const uniqueLeads = allLeads.filter(
          (lead, index, self) =>
            index === self.findIndex((l) => l.id === lead.id),
        );
        // Aplicar filtros adicionais nos resultados (intersecção)

        let filteredLeads = uniqueLeads;

        // Se temos filtros de valor, aplicar intersecção

        if (
          valueRange.min &&
          valueRange.max &&
          !isNaN(parseFloat(valueRange.min)) &&
          !isNaN(parseFloat(valueRange.max))
        ) {
          filteredLeads = filteredLeads.filter(
            (lead) =>
              lead.value &&
              lead.value >= parseFloat(valueRange.min) &&
              lead.value <= parseFloat(valueRange.max),
          );
        }

        // Se temos filtros de data, aplicar intersecção

        if (dateRange.min && dateRange.max) {
          filteredLeads = filteredLeads.filter(
            (lead) =>
              lead.estimated_close_date &&
              lead.estimated_close_date >= dateRange.min &&
              lead.estimated_close_date <= dateRange.max,
          );
        }

        // Aplicar ordenação se especificada

        if (sortField) {
          filteredLeads.sort((a, b) => {
            const aValue = a[sortField as keyof Lead];

            const bValue = b[sortField as keyof Lead];

            if (aValue === null || aValue === undefined) return 1;

            if (bValue === null || bValue === undefined) return -1;

            if (typeof aValue === "string" && typeof bValue === "string") {
              return sortDirection === "desc"
                ? bValue.localeCompare(aValue)
                : aValue.localeCompare(bValue);
            }

            if (typeof aValue === "number" && typeof bValue === "number") {
              return sortDirection === "desc"
                ? bValue - aValue
                : aValue - bValue;
            }

            return 0;
          });
        }

        setLeads(filteredLeads);

        setFilteredLeads(filteredLeads);
      } catch (error) {
        console.error("Error applying filters:", error);

        pushToast(t("notifications.errorApplyingFilters"), "error");
      }
    } else {
      // No filters, reload all leads from API

      const loadAllLeads = async () => {
        try {
          const response = await apiService.getLeads();

          if (response.success && response.data) {
            setLeads(response.data.leads);
            // Atualizar o total se foi retornado pela API
            if (response.data.total !== undefined) {
              setTotalLeads(response.data.total);
            } else {
              // Fallback: usar o tamanho do array se total não estiver disponível
              setTotalLeads(response.data.leads.length);
            }
            setFilteredLeads(response.data.leads);
          }
        } catch (error) {
          console.error("Error loading all leads:", error);
        }
      };

      loadAllLeads();
    }
  }, [filters, valueRange, dateRange, sortField, sortDirection, isClient]);

  // Update filteredLeads when leads change and no filters are active

  React.useEffect(() => {
    if (!isClient) return;

    const hasFilters =
      searchTerm ||
      filters.name ||
      filters.email ||
      filters.phone ||
      filters.ssn ||
      filters.ein ||
      filters.source ||
      filters.location ||
      filters.interest ||
      filters.status ||
      filters.pipeline ||
      filters.assignedUserId ||
      sortField;

    if (!hasFilters) {
      setFilteredLeads(leads);
    }
  }, [
    leads,
    searchTerm,
    filters.name,
    filters.email,
    filters.phone,
    filters.ssn,
    filters.ein,
    filters.source,
    filters.location,
    filters.interest,
    filters.status,
    filters.pipeline,
    filters.assignedUserId,
    sortField,
    isClient,
  ]);

  // Check if any filters are active
  const hasActiveFilters = React.useMemo(() => {
    return !!(
      searchTerm ||
      filters.name ||
      filters.email ||
      filters.phone ||
      filters.ssn ||
      filters.ein ||
      filters.source ||
      filters.location ||
      filters.interest ||
      filters.status ||
      filters.pipeline ||
      filters.assignedUserId ||
      sortField ||
      valueRange.min ||
      valueRange.max ||
      dateRange.min ||
      dateRange.max
    );
  }, [
    searchTerm,
    filters.name,
    filters.email,
    filters.phone,
    filters.ssn,
    filters.ein,
    filters.source,
    filters.location,
    filters.interest,
    filters.status,
    filters.pipeline,
    filters.assignedUserId,
    sortField,
    valueRange.min,
    valueRange.max,
    dateRange.min,
    dateRange.max,
  ]);
  // Pagination calculations
  // Use totalLeads from API when no filters are applied, otherwise use filteredLeads.length
  const totalItems = hasActiveFilters
    ? filteredLeads?.length
    : totalLeads || filteredLeads?.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = filteredLeads?.slice(startIndex, endIndex);
  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredLeads, itemsPerPage]);

  function resetForm() {
    setEditingId(null);

    setName("");

    setEmail("");

    setPhone("");

    setSsn("");

    setEin("");

    setSource("");

    setLeadLocation("");

    setInterest("");

    setStatus("New");

    setCustomStatus("");

    setValue("");

    setEstimatedCloseDate("");

    setDescription("");

    setIsModalOpen(false);

    // Clear pending attachments when closing modal
    if (editingId) {
      setPendingAttachments((prev) => {
        const newPending = { ...prev };
        delete newPending[editingId];
        return newPending;
      });
    }
    setHasUnsavedChanges(false);
    setOriginalFormValues(null);
  }

  function startAddNew() {
    // Clear any editing state and open modal for creating a new lead

    setEditingId(null);

    setName("");

    setEmail("");

    setPhone("");

    setSsn("");

    setEin("");

    setSource("");

    setLeadLocation("");

    setInterest("");

    setStatus("New");

    setCustomStatus("");

    setValue("");

    setEstimatedCloseDate("");

    setDescription("");

    setIsModalOpen(true);
  }

  function truncateTo(value: string, max: number): string {
    return value.length > max ? value.slice(0, max) : value;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !email) return;

    // Verificar se estamos no cliente

    if (!isClient) {
      pushToast(
        t("notifications.pleaseWaitLoading") || t("notifications.pleaseWait"),
        "warning",
      );

      return;
    }

    // Enforce limits before saving

    const safeName = truncateTo(name, FIELD_MAX.name);

    const safeEmail = truncateTo(email, FIELD_MAX.email);

    const safePhone = truncateTo(phone, FIELD_MAX.phone);

    const safeSsn = truncateTo(ssn, FIELD_MAX.ssn);

    const safeEin = truncateTo(ein, FIELD_MAX.ein);

    const safeSource = truncateTo(source, FIELD_MAX.source);

    const safeLocation = truncateTo(leadLocation, FIELD_MAX.source);

    const safeInterest = truncateTo(interest, FIELD_MAX.source);

    const safeStatus = truncateTo(String(status), FIELD_MAX.status);

    const safeValue = value ? parseFloat(value) : undefined;

    // Validar valor máximo (9.999.999.999.999,99 com decimal(15,2))
    if (safeValue !== undefined && safeValue > 9999999999999.99) {
      pushToast(t("notifications.valueTooLarge"), "error");
      return;
    }

    if (safeValue !== undefined && safeValue < 0) {
      pushToast(t("notifications.valueNegative"), "error");
      return;
    }

    const safeEstimatedCloseDate = estimatedCloseDate
      ? estimatedCloseDate.slice(0, FIELD_MAX.date)
      : undefined;

    const safeDescription = truncateTo(description, FIELD_MAX.description);

    try {
      if (editingId) {
        // Update existing lead

        const updateData: UpdateLeadRequest = {
          id: editingId,

          name: safeName,

          email: safeEmail,

          phone: safePhone || undefined,

          ssn: safeSsn || undefined,

          ein: safeEin || undefined,

          source: safeSource || undefined,

          location: safeLocation || undefined,

          interest: safeInterest || undefined,

          status: safeStatus,

          value: safeValue,

          estimated_close_date: safeEstimatedCloseDate,

          description: safeDescription || undefined,
        };

        const response = await apiService.updateLead(updateData);

        if (response.success && response.data) {
          setLeads((prev) =>
            prev.map((l) => (l.id === editingId ? response.data!.lead : l)),
          );
          // Process pending attachments after successful lead update
          await processPendingAttachments(editingId);

          pushToast(
            t("notifications.leadUpdated", { name: safeName }),
            "success",
          );
        } else {
          pushToast(
            `${t("notifications.errorUpdating")}: ${response.error}`,
            "error",
          );
        }
      } else {
        // Create new lead

        const createData: CreateLeadRequest = {
          name: safeName,

          email: safeEmail,

          phone: safePhone || undefined,

          ssn: safeSsn || undefined,

          ein: safeEin || undefined,

          source: safeSource || undefined,

          location: safeLocation || undefined,

          interest: safeInterest || undefined,

          status: safeStatus,

          value: safeValue,

          estimated_close_date: safeEstimatedCloseDate,

          description: safeDescription || undefined,
        };

        const response = await apiService.createLead(createData);

        if (response.success && response.data) {
          setLeads((prev) => [response.data!.lead, ...prev]);

          pushToast(t("notifications.leadAdded"), "success");
        } else {
          pushToast(
            `${t("notifications.errorAdding")}: ${response.error}`,
            "error",
          );
        }
      }
    } catch (error) {
      console.error("Error saving lead:", error);

      pushToast(
        t("notifications.errorSaving") || t("notifications.errorAdding"),
        "error",
      );
    }

    resetForm();
  }

  function handleEdit(lead: Lead) {
    setEditingId(lead.id);

    setName(lead.name);

    setEmail(lead.email);

    setPhone(lead.phone || "");

    setSsn(lead.ssn || "");

    setEin(lead.ein || "");

    setSource(lead.source || "");

    setLeadLocation(lead.location || "");

    setInterest(lead.interest || "");

    setStatus(lead.status);

    setValue(lead.value ? lead.value.toString() : "");

    // Convert ISO date to yyyy-MM-dd format for date input
    const closeDate = lead.estimated_close_date
      ? lead.estimated_close_date.split("T")[0]
      : "";
    setEstimatedCloseDate(closeDate);

    setDescription(lead.description || "");

    // Check if status is in pipeline stages or is a custom status
    const isStageStatus = pipelineStages.some(
      (stage) => stage.slug === lead.status.toLowerCase().replace(/\s+/g, "-"),
    );
    const isLegacyStatus = ["New", "In Contact", "Qualified", "Lost"].includes(
      lead.status,
    );

    if (!isStageStatus && !isLegacyStatus) {
      setCustomStatus(lead.status);
    } else {
      setCustomStatus("");
    }

    // Save original values for change detection
    setOriginalFormValues({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || "",
      ssn: lead.ssn || "",
      ein: lead.ein || "",
      source: lead.source || "",
      location: lead.location || "",
      interest: lead.interest || "",
      status: lead.status,
      value: lead.value ? lead.value.toString() : "",
      estimatedCloseDate: closeDate,
    });

    setIsModalOpen(true);
  }

  function handleDelete(id: string) {
    // Open confirmation modal for single deletion

    setPendingDeletionIds([id]);

    setConfirmInput("");

    setIsConfirmOpen(true);
  }

  async function handleQuickAssign(leadId: string) {
    setIsLoadingUsers(true);
    setQuickAssignLeadId(leadId);
    setQuickAssignUserId("");

    try {
      const response = await apiService.getOrganizationUsers(true);
      if (response.success) {
        const users = extractEmployees(response);
        setOrganizationUsers(users);
        if (!users.length) {
          pushToast(t("notifications.errorLoadingUsers"), "warning");
        }
      } else {
        pushToast(t("notifications.errorLoadingUsers"), "error");
        setQuickAssignLeadId(null);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      pushToast(t("notifications.errorLoadingUsers"), "error");
      setQuickAssignLeadId(null);
    } finally {
      setIsLoadingUsers(false);
    }
  }

  async function handleTogglePipeline(leadId: string, currentStatus: boolean) {
    try {
      const lead = leads.find((l) => l.id === leadId);
      const initialStatus = getInitialPipelineStatus();
      const response = await apiService.bulkUpdatePipeline(
        [leadId],
        !currentStatus,
        !currentStatus ? initialStatus : lead?.status,
      );

      if (response.success) {
        // Atualizar o lead localmente
        setLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead.id === leadId
              ? {
                  ...lead,
                  show_on_pipeline: !currentStatus,
                  status: !currentStatus ? initialStatus : lead.status,
                }
              : lead,
          ),
        );
        setFilteredLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead.id === leadId
              ? {
                  ...lead,
                  show_on_pipeline: !currentStatus,
                  status: !currentStatus ? initialStatus : lead.status,
                }
              : lead,
          ),
        );
      } else {
        pushToast(
          t("notifications.errorUpdatingPipeline") ||
            t("notifications.errorUpdating"),
          "error",
        );
      }
    } catch (error) {
      console.error("Error toggling pipeline:", error);
      pushToast(t("notifications.errorUpdatingPipeline"), "error");
    }
  }
  async function applyQuickAssign() {
    if (!quickAssignLeadId || !quickAssignUserId) return;

    try {
      const lead = leads.find((l) => l.id === quickAssignLeadId);
      if (!lead) return;

      const initialStatus = getInitialPipelineStatus();

      const updateData: any = {
        id: lead.id,
        assignedUserId: quickAssignUserId,
        status: initialStatus,
      };

      const response = await apiService.updateLead(updateData);

      if (response.success) {
        const pipelineResponse = await apiService.bulkUpdatePipeline(
          [lead.id],
          true,
          initialStatus,
        );
        if (!pipelineResponse.success) {
          pushToast(
            pipelineResponse.error || t("notifications.errorUpdatingPipeline"),
            "warning",
          );
        }

        const updatedLead = {
          ...lead,
          assigned_user_id: quickAssignUserId,
          status: initialStatus,
          show_on_pipeline: true,
        };

        setLeads((prevLeads) =>
          prevLeads.map((l) => (l.id === lead.id ? updatedLead : l)),
        );
        setFilteredLeads((prevLeads) =>
          prevLeads.map((l) => (l.id === lead.id ? updatedLead : l)),
        );

        pushToast(t("notifications.leadAssigned"), "success");
        setQuickAssignLeadId(null);
        setQuickAssignUserId("");
      } else {
        pushToast(response.error || t("notifications.errorAssigning"), "error");
      }
    } catch (error) {
      console.error("Error assigning lead:", error);
      pushToast(t("notifications.errorAssigning"), "error");
    }
  }

  function handleDeleteSelected() {
    if (selectedLeads.size === 0) return;

    // Open confirmation modal for bulk deletion

    setPendingDeletionIds(Array.from(selectedLeads));

    setConfirmInput("");

    setIsConfirmOpen(true);
  }

  function handleSelectAll() {
    if (selectedLeads.size === currentLeads.length) {
      setSelectedLeads(new Set());

      setShowSelectAllButton(false);
    } else {
      setSelectedLeads(new Set(currentLeads.map((l) => l.id)));
      setShowSelectAllButton(true);
    }
  }

  const handleToggleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      // Se todos estão selecionados, desmarcar todos
      setSelectedLeads(new Set());
    } else {
      // Selecionar todos os leads que já estão carregados no frontend
      const allLeadIds = new Set(leads.map((lead) => lead.id));
      setSelectedLeads(allLeadIds);
    }
  };

  const handleToggleSelectPage = () => {
    const currentPageLeadIds = new Set(currentLeads.map((lead) => lead.id));
    const allCurrentPageSelected =
      currentPageLeadIds.size > 0 &&
      Array.from(currentPageLeadIds).every((id) => selectedLeads.has(id));

    if (allCurrentPageSelected) {
      // Se todos da página estão selecionados, desmarcar apenas os da página
      const newSelected = new Set(selectedLeads);
      currentPageLeadIds.forEach((id) => newSelected.delete(id));
      setSelectedLeads(newSelected);
    } else {
      // Selecionar todos os leads da página atual
      const newSelected = new Set([...selectedLeads, ...currentPageLeadIds]);
      setSelectedLeads(newSelected);
    }
  };

  // Confirm select all leads (mantido para compatibilidade)
  const confirmSelectAllLeads = () => {
    const allLeadIds = new Set(leads.map((lead) => lead.id));
    setSelectedLeads(allLeadIds);
    setShowSelectAllConfirm(false);
    setShowSelectAllButton(false);
  };

  function handleSelectLead(
    id: string,
    index: number,
    e: React.MouseEvent<HTMLInputElement>,
  ) {
    const isCurrentlySelected = selectedLeads.has(id);

    const shouldSelect = !isCurrentlySelected;

    setSelectedLeads((prev) => {
      const next = new Set(prev);

      if (e.shiftKey && lastClickedIndex !== null && index !== -1) {
        const start = Math.min(lastClickedIndex, index);

        const end = Math.max(lastClickedIndex, index);

        for (let i = start; i <= end; i++) {
          const leadId = currentLeads[i]?.id;
          if (!leadId) continue;

          if (shouldSelect) {
            next.add(leadId);
          } else {
            next.delete(leadId);
          }
        }
      } else {
        if (isCurrentlySelected) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }

      return next;
    });

    if (index !== -1) setLastClickedIndex(index);
  }

  function openBulkEdit() {
    setBulkStatus("");

    setBulkSource("");

    setBulkEditConfirm("");

    setIsBulkEditOpen(true);
  }

  async function openBulkAssign() {
    try {
      const response = await apiService.getOrganizationUsers(true); // Include master users
      if (response.success) {
        setOrganizationUsers(extractEmployees(response));
      } else {
        pushToast(t("notifications.errorLoadingUsers"), "error");
        return;
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      pushToast(t("notifications.errorLoadingUsers"), "error");
      return;
    }

    setSelectedUserId("");
    setBulkAssignConfirm("");
    setIsBulkAssignOpen(true);
  }

  function openPipelineModal(action: "add" | "remove") {
    setPipelineAction(action);
    setIsPipelineModalOpen(true);
  }

  async function handlePipelineBulkAction() {
    if (selectedLeads.size === 0) return;

    try {
      const leadIds = Array.from(selectedLeads);
      const showOnPipeline = pipelineAction === "add";
      const initialStatus = getInitialPipelineStatus();

      const response = await apiService.bulkUpdatePipeline(
        leadIds,
        showOnPipeline,
        showOnPipeline ? initialStatus : undefined,
      );

      if (response.success) {
        // Update local state
        setLeads((prev) =>
          prev.map((lead) =>
            selectedLeads.has(lead.id)
              ? {
                  ...lead,
                  show_on_pipeline: showOnPipeline,
                  status: showOnPipeline ? initialStatus : lead.status,
                }
              : lead,
          ),
        );

        pushToast(
          showOnPipeline
            ? t("notifications.leadsAddedToPipeline", { count: leadIds.length })
            : t("notifications.leadsRemovedFromPipeline", {
                count: leadIds.length,
              }),
          "success",
        );

        // Clear selection
        setSelectedLeads(new Set());
      } else {
        pushToast(
          t("notifications.errorUpdating") + `: ${response.error}`,
          "error",
        );
      }
    } catch (error) {
      console.error("Pipeline bulk action error:", error);
      pushToast(
        t("notifications.errorUpdatingPipeline") ||
          t("notifications.errorUpdating"),
        "error",
      );
    }

    setIsPipelineModalOpen(false);
  }

  // Helper function to update a lead with retry logic
  async function updateLeadWithRetry(
    lead: Lead,
    updateData: any,
    maxRetries: number = 5,
  ): Promise<{ success: boolean; lead: Lead; error?: string }> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await apiService.updateLead(updateData);

        if (result.success) {
          return { success: true, lead };
        } else if (attempt < maxRetries - 1) {
          // Retry on failure with exponential backoff
          const backoffDelay = 50 * Math.pow(2, attempt); // 50ms, 100ms, 200ms, 400ms, 800ms
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          continue;
        } else {
          console.error(
            `Failed to update lead after ${maxRetries} attempts:`,
            lead.id,
            result.error,
          );
          return { success: false, lead, error: result.error };
        }
      } catch (error) {
        if (attempt < maxRetries - 1) {
          // Retry on network errors with exponential backoff
          const backoffDelay = 50 * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          continue;
        } else {
          console.error(
            `Network error after ${maxRetries} attempts:`,
            lead.id,
            error,
          );
          return { success: false, lead, error: String(error) };
        }
      }
    }

    return { success: false, lead, error: "Max retries exceeded" };
  }

  async function applyBulkEdit() {
    if (selectedLeads.size === 0) return;

    const shouldUpdateStatus = bulkStatus.trim() !== "";
    const shouldUpdateSource = bulkSource.trim() !== "";

    if (!shouldUpdateStatus && !shouldUpdateSource) {
      setIsBulkEditOpen(false);
      return;
    }

    // Check confirmation input
    if (bulkEditConfirm.trim().toLowerCase() !== "edit") {
      pushToast(t("notifications.confirmEdit"), "error");
      return;
    }

    const idsToUpdate = Array.from(selectedLeads);
    const leadsToUpdate = leads.filter((l) => idsToUpdate.includes(l.id));

    // Store original leads before editing for potential rollback
    const originalLeads = [...leadsToUpdate];
    setOriginalLeads(originalLeads);
    setCurrentEditLeads([]);

    const totalLeads = leadsToUpdate.length;
    const batchSize = 1000;
    const totalBatches = Math.ceil(totalLeads / batchSize);
    const parallelLimit = 30;

    // Close the bulk edit modal immediately when starting
    setIsBulkEditOpen(false);

    // Show progress notification
    setEditNotification({
      show: true,
      progress: { current: 0, total: totalLeads, batch: 0, totalBatches },
      cancelled: false,
    });
    setIsEditCancelled(false);
    isEditCancelledRef.current = false;

    try {
      let successCount = 0;
      const successfullyUpdatedIds: string[] = [];
      const updatedLeadsMap = new Map<string, Lead>();
      const failedUpdates: Array<{ lead: Lead; error: string }> = [];

      // Process batches
      for (let i = 0; i < totalBatches; i++) {
        // Check if cancelled at start of batch
        if (isEditCancelledRef.current) {
          // Rollback: restore original leads
          if (successfullyUpdatedIds.length > 0) {
            for (const id of successfullyUpdatedIds) {
              const originalLead = originalLeads.find((l) => l.id === id);
              if (originalLead) {
                try {
                  const updateData: any = {
                    id: originalLead.id,
                    status: originalLead.status,
                    source: originalLead.source,
                  };
                  await apiService.updateLead(updateData);
                } catch (error) {
                  console.error("Error restoring lead:", error);
                }
              }
            }
          }

          // Restore frontend state
          setLeads((prev) =>
            prev.map((l) => {
              const originalLead = originalLeads.find(
                (orig) => orig.id === l.id,
              );
              return originalLead || l;
            }),
          );
          setFilteredLeads((prev) =>
            prev.map((l) => {
              const originalLead = originalLeads.find(
                (orig) => orig.id === l.id,
              );
              return originalLead || l;
            }),
          );

          setEditNotification({
            show: false,
            progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
            cancelled: false,
          });
          pushToast(t("notifications.bulkEditCancelled"), "success");
          return;
        }

        const startIndex = i * batchSize;
        const endIndex = Math.min(startIndex + batchSize, totalLeads);
        const batch = leadsToUpdate.slice(startIndex, endIndex);

        // Update progress
        setEditNotification({
          show: true,
          progress: {
            current: startIndex,
            total: totalLeads,
            batch: i + 1,
            totalBatches,
          },
          cancelled: false,
        });

        // Process batch in controlled parallel chunks
        const batchSuccessIds: string[] = [];
        for (let j = 0; j < batch.length; j += parallelLimit) {
          // Check cancellation during chunk processing
          if (isEditCancelledRef.current) {
            // Rollback all successfully updated leads so far
            const allUpdatedIds = [
              ...successfullyUpdatedIds,
              ...batchSuccessIds,
            ];
            if (allUpdatedIds.length > 0) {
              for (const id of allUpdatedIds) {
                const originalLead = originalLeads.find((l) => l.id === id);
                if (originalLead) {
                  try {
                    const updateData: any = {
                      id: originalLead.id,
                      status: originalLead.status,
                      source: originalLead.source,
                    };
                    await apiService.updateLead(updateData);
                  } catch (error) {
                    console.error("Error restoring lead:", error);
                  }
                }
              }
            }

            // Restore frontend state
            setLeads((prev) =>
              prev.map((l) => {
                const originalLead = originalLeads.find(
                  (orig) => orig.id === l.id,
                );
                return originalLead || l;
              }),
            );
            setFilteredLeads((prev) =>
              prev.map((l) => {
                const originalLead = originalLeads.find(
                  (orig) => orig.id === l.id,
                );
                return originalLead || l;
              }),
            );

            setEditNotification({
              show: false,
              progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
              cancelled: false,
            });
            pushToast(t("notifications.bulkEditCancelled"), "success");
            return;
          }

          const chunk = batch.slice(j, j + parallelLimit);
          const leadIndex = startIndex + j;

          // Update progress
          setEditNotification({
            show: true,
            progress: {
              current: leadIndex,
              total: totalLeads,
              batch: i + 1,
              totalBatches,
            },
            cancelled: false,
          });

          // Prepare updates for this chunk
          const chunkPromises = chunk.map(async (lead) => {
            const updateData: any = { id: lead.id };

            if (shouldUpdateStatus) {
              updateData.status = bulkStatus as Lead["status"];
            }

            if (shouldUpdateSource) {
              updateData.source = bulkSource;
            }

            return updateLeadWithRetry(lead, updateData, 5);
          });

          const chunkResults = await Promise.all(chunkPromises);

          // Collect results
          chunkResults.forEach((result) => {
            if (result.success) {
              successCount++;
              batchSuccessIds.push(result.lead.id);
              const updatedLead = {
                ...result.lead,
                status: shouldUpdateStatus
                  ? (bulkStatus as Lead["status"])
                  : result.lead.status,
                source: shouldUpdateSource ? bulkSource : result.lead.source,
              };
              updatedLeadsMap.set(result.lead.id, updatedLead);
            } else {
              failedUpdates.push({
                lead: result.lead,
                error: result.error || t("notifications.unknownError"),
              });
            }
          });

          // Small delay to prevent server overload
          if (j + parallelLimit < batch.length) {
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
        }

        // Update UI progressively after each batch
        successfullyUpdatedIds.push(...batchSuccessIds);
        if (batchSuccessIds.length > 0) {
          setLeads((prev) => prev.map((l) => updatedLeadsMap.get(l.id) || l));
          setFilteredLeads((prev) =>
            prev.map((l) => updatedLeadsMap.get(l.id) || l),
          );
        }
      }

      // Check for cancellation before retry phase
      if (isEditCancelledRef.current) {
        // Rollback all successfully updated leads
        if (successfullyUpdatedIds.length > 0) {
          for (const id of successfullyUpdatedIds) {
            const originalLead = originalLeads.find((l) => l.id === id);
            if (originalLead) {
              try {
                const updateData: any = {
                  id: originalLead.id,
                  status: originalLead.status,
                  source: originalLead.source,
                };
                await apiService.updateLead(updateData);
              } catch (error) {
                console.error("Error restoring lead:", error);
              }
            }
          }
        }

        // Restore frontend state
        setLeads((prev) =>
          prev.map((l) => {
            const originalLead = originalLeads.find((orig) => orig.id === l.id);
            return originalLead || l;
          }),
        );
        setFilteredLeads((prev) =>
          prev.map((l) => {
            const originalLead = originalLeads.find((orig) => orig.id === l.id);
            return originalLead || l;
          }),
        );

        setEditNotification({
          show: false,
          progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
          cancelled: false,
        });
        pushToast(t("notifications.bulkEditCancelled"), "success");
        return;
      }

      // Retry failed updates if any
      if (failedUpdates.length > 0 && !isEditCancelledRef.current) {
        pushToast(
          t("notifications.retrying", { count: failedUpdates.length }),
          "warning",
        );

        const retriedSuccessIds: string[] = [];

        for (let k = 0; k < failedUpdates.length; k += parallelLimit) {
          if (isEditCancelledRef.current) {
            // Rollback all successfully updated leads including retries
            const allUpdatedIds = [
              ...successfullyUpdatedIds,
              ...retriedSuccessIds,
            ];
            if (allUpdatedIds.length > 0) {
              for (const id of allUpdatedIds) {
                const originalLead = originalLeads.find((l) => l.id === id);
                if (originalLead) {
                  try {
                    const updateData: any = {
                      id: originalLead.id,
                      status: originalLead.status,
                      source: originalLead.source,
                    };
                    await apiService.updateLead(updateData);
                  } catch (error) {
                    console.error("Error restoring lead:", error);
                  }
                }
              }
            }

            // Restore frontend state
            setLeads((prev) =>
              prev.map((l) => {
                const originalLead = originalLeads.find(
                  (orig) => orig.id === l.id,
                );
                return originalLead || l;
              }),
            );
            setFilteredLeads((prev) =>
              prev.map((l) => {
                const originalLead = originalLeads.find(
                  (orig) => orig.id === l.id,
                );
                return originalLead || l;
              }),
            );

            setEditNotification({
              show: false,
              progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
              cancelled: false,
            });
            pushToast(t("notifications.bulkEditCancelled"), "success");
            return;
          }

          const retryChunk = failedUpdates.slice(k, k + parallelLimit);
          const retryPromises = retryChunk.map(({ lead }) => {
            const updateData: any = { id: lead.id };
            if (shouldUpdateStatus)
              updateData.status = bulkStatus as Lead["status"];
            if (shouldUpdateSource) updateData.source = bulkSource;
            return updateLeadWithRetry(lead, updateData, 5);
          });

          const retryResults = await Promise.all(retryPromises);

          retryResults.forEach((result) => {
            if (result.success) {
              successCount++;
              retriedSuccessIds.push(result.lead.id);
              const updatedLead = {
                ...result.lead,
                status: shouldUpdateStatus
                  ? (bulkStatus as Lead["status"])
                  : result.lead.status,
                source: shouldUpdateSource ? bulkSource : result.lead.source,
              };
              updatedLeadsMap.set(result.lead.id, updatedLead);
            }
          });

          // No delay between retry chunks for maximum speed
        }

        // Update UI for successful retries
        if (retriedSuccessIds.length > 0) {
          setLeads((prev) => prev.map((l) => updatedLeadsMap.get(l.id) || l));
          setFilteredLeads((prev) =>
            prev.map((l) => updatedLeadsMap.get(l.id) || l),
          );
        }

        const finalErrors = failedUpdates.length - retriedSuccessIds.length;
        if (finalErrors > 0) {
          pushToast(
            t("notifications.bulkEditPartial", {
              success: successCount,
              failed: finalErrors,
            }),
            "warning",
          );
        } else {
          pushToast(
            t("notifications.bulkEditSuccess", { count: successCount }),
            "success",
          );
        }
      } else {
        // Show success message
        if (failedUpdates.length > 0) {
          pushToast(
            t("notifications.bulkEditPartial", {
              success: successCount,
              failed: failedUpdates.length,
            }),
            "warning",
          );
        } else {
          pushToast(
            t("notifications.bulkEditSuccess", { count: successCount }),
            "success",
          );
        }
      }

      // Clear selections
      setSelectedLeads(new Set());

      // Sync after operation
      await syncAfterOperation();
    } catch (error) {
      console.error("Error updating leads:", error);
      pushToast(
        t("notifications.errorUpdatingLeads") ||
          t("notifications.errorUpdating"),
        "error",
      );
    } finally {
      setEditNotification({
        show: false,
        progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
        cancelled: false,
      });
      setOriginalLeads([]);
      setCurrentEditLeads([]);
      setIsEditCancelled(false);
      isEditCancelledRef.current = false;
    }
  }

  async function applyBulkAssign() {
    if (selectedLeads.size === 0) return;

    if (!selectedUserId) {
      pushToast(t("toasts.selectUser"), "error");
      return;
    }

    // Check confirmation input
    if (bulkAssignConfirm.trim().toLowerCase() !== "assign") {
      pushToast(t("toasts.confirmAssign"), "error");
      return;
    }

    const idsToUpdate = Array.from(selectedLeads);
    const leadsToUpdate = leads.filter((l) => idsToUpdate.includes(l.id));

    const totalLeads = leadsToUpdate.length;
    const batchSize = 1000;
    const totalBatches = Math.ceil(totalLeads / batchSize);
    const parallelLimit = 30;

    // Close the bulk assign modal immediately when starting
    setIsBulkAssignOpen(false);

    // Show progress notification
    setAssignNotification({
      show: true,
      progress: { current: 0, total: totalLeads, batch: 0, totalBatches },
      cancelled: false,
    });

    try {
      let successCount = 0;
      const successfullyUpdatedIds: string[] = [];
      const updatedLeadsMap = new Map<string, Lead>();
      const failedUpdates: Array<{ lead: Lead; error: string }> = [];
      const initialStatus = getInitialPipelineStatus();

      // Process batches
      for (let i = 0; i < totalBatches; i++) {
        const startIndex = i * batchSize;
        const endIndex = Math.min(startIndex + batchSize, totalLeads);
        const batch = leadsToUpdate.slice(startIndex, endIndex);

        // Update progress
        setAssignNotification({
          show: true,
          progress: {
            current: startIndex,
            total: totalLeads,
            batch: i + 1,
            totalBatches,
          },
          cancelled: false,
        });

        // Process batch in controlled parallel chunks
        const batchSuccessIds: string[] = [];
        for (let j = 0; j < batch.length; j += parallelLimit) {
          const chunk = batch.slice(j, j + parallelLimit);
          const leadIndex = startIndex + j;

          // Update progress
          setAssignNotification({
            show: true,
            progress: {
              current: leadIndex,
              total: totalLeads,
              batch: i + 1,
              totalBatches,
            },
            cancelled: false,
          });

          // Prepare updates for this chunk
          const chunkPromises = chunk.map(async (lead) => {
            const updateData: any = {
              id: lead.id,
              assignedUserId: selectedUserId,
              status: initialStatus,
            };
            return updateLeadWithRetry(lead, updateData, 5);
          });

          const chunkResults = await Promise.all(chunkPromises);

          // Collect results
          chunkResults.forEach((result) => {
            if (result.success) {
              successCount++;
              batchSuccessIds.push(result.lead.id);
              const updatedLead = {
                ...result.lead,
                assigned_user_id: selectedUserId,
                status: initialStatus,
                show_on_pipeline: true,
              };
              updatedLeadsMap.set(result.lead.id, updatedLead);
            } else {
              failedUpdates.push({
                lead: result.lead,
                error: result.error || t("notifications.unknownError"),
              });
            }
          });

          // Small delay to prevent server overload
          if (j + parallelLimit < batch.length) {
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
        }

        // Update UI progressively after each batch
        successfullyUpdatedIds.push(...batchSuccessIds);
        if (batchSuccessIds.length > 0) {
          setLeads((prev) => prev.map((l) => updatedLeadsMap.get(l.id) || l));
          setFilteredLeads((prev) =>
            prev.map((l) => updatedLeadsMap.get(l.id) || l),
          );
        }
      }

      // Retry failed updates if any
      if (failedUpdates.length > 0) {
        pushToast(
          t("notifications.retryingAssignments", {
            count: failedUpdates.length,
          }) || t("notifications.retrying", { count: failedUpdates.length }),
          "warning",
        );

        const retriedSuccessIds: string[] = [];

        for (let k = 0; k < failedUpdates.length; k += parallelLimit) {
          const retryChunk = failedUpdates.slice(k, k + parallelLimit);
          const retryPromises = retryChunk.map(({ lead }) => {
            const updateData: any = {
              id: lead.id,
              assignedUserId: selectedUserId,
              status: initialStatus,
            };
            return updateLeadWithRetry(lead, updateData, 5);
          });

          const retryResults = await Promise.all(retryPromises);

          retryResults.forEach((result) => {
            if (result.success) {
              successCount++;
              retriedSuccessIds.push(result.lead.id);
              const updatedLead = {
                ...result.lead,
                assigned_user_id: selectedUserId,
                status: initialStatus,
                show_on_pipeline: true,
              };
              updatedLeadsMap.set(result.lead.id, updatedLead);
            }
          });

          // No delay between retry chunks for maximum speed
        }

        const allSuccessIds = [...successfullyUpdatedIds, ...retriedSuccessIds];
        if (allSuccessIds.length > 0) {
          const pipelineResponse = await apiService.bulkUpdatePipeline(
            allSuccessIds,
            true,
            initialStatus,
          );
          if (!pipelineResponse.success) {
            pushToast(
              pipelineResponse.error || t("notifications.errorUpdatingPipeline"),
              "warning",
            );
          }
        }

        // Update UI for successful retries
        if (retriedSuccessIds.length > 0) {
          setLeads((prev) => prev.map((l) => updatedLeadsMap.get(l.id) || l));
          setFilteredLeads((prev) =>
            prev.map((l) => updatedLeadsMap.get(l.id) || l),
          );
        }

        const finalErrors = failedUpdates.length - retriedSuccessIds.length;
        if (finalErrors > 0) {
          pushToast(
            t("notifications.leadsAssignedPartial", {
              success: successCount,
              failed: finalErrors,
            }) || t("notifications.leadsAssigned", { count: successCount }),
            "warning",
          );
        } else {
          pushToast(
            t("notifications.leadsAssigned", { count: successCount }),
            "success",
          );
        }
      } else {
        // Show success message
        if (failedUpdates.length > 0) {
          pushToast(
            t("notifications.leadsAssignedPartial", {
              success: successCount,
              failed: failedUpdates.length,
            }) || t("notifications.leadsAssigned", { count: successCount }),
            "warning",
          );
        } else {
          if (successfullyUpdatedIds.length > 0) {
            const pipelineResponse = await apiService.bulkUpdatePipeline(
              successfullyUpdatedIds,
              true,
              initialStatus,
            );
            if (!pipelineResponse.success) {
              pushToast(
                pipelineResponse.error || t("notifications.errorUpdatingPipeline"),
                "warning",
              );
            }
          }

          pushToast(
            t("notifications.leadsAssigned", { count: successCount }),
            "success",
          );
        }
      }

      // Clear selections
      setSelectedLeads(new Set());

      // Sync after operation
      await syncAfterOperation();
    } catch (error) {
      console.error("Error assigning leads:", error);
      pushToast(
        t("notifications.errorAssigningLeads") ||
          t("notifications.errorAssigning"),
        "error",
      );
    } finally {
      setAssignNotification({
        show: false,
        progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
        cancelled: false,
      });
      setSelectedUserId("");
      setBulkAssignConfirm("");
    }
  }
  function normalizeHeader(raw: string): string {
    const s = raw

      .toLowerCase()

      .normalize("NFD")

      .replace(/\p{Diacritic}+/gu, "")

      .replace(/[^a-z0-9]+/g, " ")

      .trim();

    // unify common variants

    return s;
  }

  function headerToCanonical(
    normalized: string,
  ):
    | "name"
    | "email"
    | "phone"
    | "ssn"
    | "ein"
    | "source"
    | "status"
    | "value"
    | "estimated_close_date"
    | "location"
    | "interest"
    | "description"
    | null {
    // Map of supported header synonyms (normalized via normalizeHeader)

    const headerAliases: Record<
      | "name"
      | "email"
      | "phone"
      | "ssn"
      | "ein"
      | "source"
      | "status"
      | "value"
      | "estimated_close_date"
      | "location"
      | "interest"
      | "description",
      string[]
    > = {
      name: [
        // English
        "name",
        "full name",
        "fullname",
        "lead name",
        "contact name",
        "customer name",
        "client name",
        "person name",
        "person",
        "contact",
        "lead",
        // Portuguese
        "nome",
        "nome completo",
        "nome do lead",
        "nome do contato",
        "nome do cliente",
        "contato",
        "cliente",
        "pessoa",
      ],

      email: [
        // English
        "email",
        "e mail",
        "e-mail",
        "mail",
        "email address",
        "e mail address",
        "e-mail address",
        "contact email",
        "email contact",
        "electronic mail",
        "email / phone",
        "email phone",
        "email/phone",
        // Portuguese
        "endereco de email",
        "endereço de email",
        "endereco eletronico",
        "endereço eletrônico",
        "correio",
        "correio eletronico",
        "correio eletrônico",
        "e-mail",
        "e mail",
      ],

      phone: [
        // English
        "phone",
        "phone number",
        "phone no",
        "phone no.",
        "phone #",
        "tel",
        "tel.",
        "telephone",
        "cell",
        "cellphone",
        "cell phone",
        "mobile",
        "mobile phone",
        "mobile number",
        "contact number",
        "contact phone",
        "whatsapp",
        "whatsapp number",
        "whatsapp no",
        // Portuguese
        "telefone",
        "telefone celular",
        "tel",
        "tel.",
        "fone",
        "celular",
        "cel",
        "cel.",
        "telemovel",
        "telemóvel",
        "numero de telefone",
        "número de telefone",
        "contato",
        "numero de contato",
        "número de contato",
        "whatsapp",
        "zap",
      ],

      ssn: [
        // English
        "ssn",
        "social security number",
        "social security",
        "social security no",
        "social security no.",
        "social security n",
        "social security #",
        "social sec number",
        "social sec no",
        "social sec",
        "ss number",
        "ss no",
        "ss #",
        "tax id",
        "personal tax id",
        // Portuguese
        "cpf",
        "c p f",
        "cadastro de pessoa fisica",
        "cadastro de pessoa física",
        "numero do cpf",
        "número do cpf",
        "n cpf",
        "no cpf",
        "no. cpf",
        "cpf numero",
        "cpf número",
        "documento cpf",
        "doc cpf",
        // Combined (legacy)
        "ssn ein",
        "ssn/ein",
        "ssn / ein",
      ],

      ein: [
        // English
        "ein",
        "employer identification number",
        "employer id",
        "employer id number",
        "business tax id",
        "company tax id",
        "federal tax id",
        "tax identification number",
        "tin",
        "business id",
        "company id",
        "corporate id",
        // Portuguese
        "cnpj",
        "cadastro nacional da pessoa juridica",
        "cadastro nacional da pessoa jurídica",
        "cadastro nacional pessoa juridica",
        "numero do cnpj",
        "número do cnpj",
        "n cnpj",
        "no cnpj",
        "no. cnpj",
        "cnpj numero",
        "cnpj número",
        "documento cnpj",
        "doc cnpj",
        "cnpj empresa",
        // Combined (legacy)
        "ssn ein",
        "ssn/ein",
        "ssn / ein",
      ],

      source: [
        // English
        "source",
        "lead source",
        "leadsource",
        "lead origin",
        "origin",
        "channel",
        "marketing channel",
        "acquisition channel",
        "traffic source",
        "referral source",
        "campaign",
        "medium",
        "source/medium",
        "utm source",
        "how did you find us",
        // Portuguese
        "origem",
        "origem do lead",
        "fonte",
        "fonte do lead",
        "canal",
        "canal de origem",
        "canal de marketing",
        "canal de aquisicao",
        "canal de aquisição",
        "campanha",
        "meio",
        "referencia",
        "referência",
        "indicacao",
        "indicação",
        "como nos conheceu",
        "como conheceu",
        "de onde veio",
      ],

      status: [
        // English
        "status",
        "lead status",
        "leadstatus",
        "current status",
        "stage",
        "pipeline stage",
        "deal stage",
        "sales stage",
        "phase",
        "state",
        "condition",
        // Portuguese
        "situacao",
        "situação",
        "situacao do lead",
        "situação do lead",
        "estado",
        "estado do lead",
        "etapa",
        "etapa do lead",
        "fase",
        "fase do lead",
        "estagio",
        "estágio",
        "pipeline",
        "funil",
        "status do contato",
      ],

      value: [
        // English
        "value",
        "deal value",
        "dealvalue",
        "opportunity value",
        "sale value",
        "sales value",
        "amount",
        "deal amount",
        "total",
        "total value",
        "total amount",
        "price",
        "cost",
        "revenue",
        "contract value",
        "order value",
        "purchase value",
        // Portuguese
        "valor",
        "valor do negocio",
        "valor do negócio",
        "valor da venda",
        "valor do deal",
        "valor total",
        "total",
        "montante",
        "quantia",
        "soma",
        "preco",
        "preço",
        "custo",
        "receita",
        "valor do contrato",
        "valor do pedido",
      ],

      estimated_close_date: [
        // English variations
        "estimated close date",
        "est close date",
        "est. close date",
        "close date",
        "closing date",
        "closed date",
        "expected close date",
        "exp close date",
        "exp. close date",
        "target close date",
        "target closing date",
        "deal close date",
        "deal closing date",
        "deal close",
        "expected close",
        "expected closing",
        "estimated closing date",
        "est closing date",
        "est. closing date",
        "projected close date",
        "proj close date",
        "proj. close date",
        "anticipated close date",
        "forecast close date",
        "expected date",
        "target date",
        "due date",
        "deadline",
        "completion date",
        "finish date",
        "end date",
        "final date",
        "sale close date",
        "contract close date",
        "close",
        "closing",
        "date",

        // Portuguese variations
        "data de fechamento",
        "data fechamento",
        "dt fechamento",
        "dt. fechamento",
        "data estimada",
        "data estimada de fechamento",
        "dt estimada",
        "data prevista",
        "data prevista de fechamento",
        "dt prevista",
        "data esperada",
        "data esperada de fechamento",
        "data alvo",
        "data objetivo",
        "data meta",
        "data de conclusao",
        "data de conclusão",
        "dt conclusao",
        "dt conclusão",
        "data de venda",
        "data da venda",
        "dt venda",
        "data final",
        "data limite",
        "prazo",
        "prazo final",
        "previsao de fechamento",
        "previsão de fechamento",
        "estimativa de fechamento",
        "est. fechamento",
        "data do contrato",
        "data do negocio",
        "data do negócio",
        "data",
        "data estimada fechamento",
      ],

      location: [
        // English - Primary
        "location",
        "locations",
        "loc",
        "loc.",
        "locate",
        // English - Address variations
        "address",
        "full address",
        "street address",
        "mailing address",
        "physical address",
        "addr",
        "addr.",
        "street",
        "st",
        "st.",
        // English - Geographic
        "city",
        "town",
        "municipality",
        "village",
        "borough",
        "state",
        "province",
        "region",
        "territory",
        "county",
        "country",
        "nation",
        "area",
        "zone",
        "district",
        "place",
        "places",
        "where",
        "geographic location",
        "geography",
        "geo",
        "city/state",
        "city state",
        "city-state",
        "state/country",
        "state country",
        "state-country",
        "city, state",
        "city,state",
        // English - Postal
        "zip",
        "zipcode",
        "zip code",
        "zip-code",
        "postal",
        "postal code",
        "postcode",
        "post code",
        // Portuguese - Primary
        "localizacao",
        "localização",
        "localizacoes",
        "localizações",
        "local",
        "locais",
        "lugar",
        "lugares",
        "onde",
        // Portuguese - Address
        "endereco",
        "endereço",
        "enderecos",
        "endereços",
        "endereco completo",
        "endereço completo",
        "end",
        "end.",
        "rua",
        "logradouro",
        // Portuguese - Geographic
        "cidade",
        "cidades",
        "municipio",
        "município",
        "municipios",
        "municípios",
        "estado",
        "estados",
        "uf",
        "regiao",
        "região",
        "regioes",
        "regiões",
        "pais",
        "país",
        "paises",
        "países",
        "nacao",
        "nação",
        "nacoes",
        "nações",
        "area",
        "área",
        "areas",
        "áreas",
        "zona",
        "distrito",
        "cidade/estado",
        "cidade estado",
        "cidade-estado",
        "estado/pais",
        "estado pais",
        "estado-pais",
        "cidade, estado",
        "cidade,estado",
        // Portuguese - Postal
        "cep",
        "codigo postal",
        "código postal",
        "cod postal",
        "cód postal",
      ],

      interest: [
        // English - Primary
        "interest",
        "interests",
        "interested",
        "interest in",
        "interested in",
        "area of interest",
        "areas of interest",
        "interest area",
        "interest areas",
        // English - Product/Service
        "product",
        "products",
        "product interest",
        "product of interest",
        "service",
        "services",
        "service interest",
        "service of interest",
        "solution",
        "solutions",
        "offering",
        "offerings",
        "offer",
        "item",
        "items",
        "item of interest",
        // English - Needs/Wants
        "need",
        "needs",
        "needed",
        "needing",
        "want",
        "wants",
        "wanted",
        "wanting",
        "requirement",
        "requirements",
        "required",
        "requires",
        "looking for",
        "searching for",
        "seeking",
        "search",
        "preference",
        "preferences",
        "preferred",
        "prefers",
        "choice",
        "choices",
        "choose",
        "chosen",
        "desire",
        "desires",
        "desired",
        "desiring",
        // English - Questions
        "what interested",
        "what interests",
        "what are you interested in",
        "what do you need",
        "what product",
        "which product",
        "which service",
        "interested in what",
        "interest what",
        // Portuguese - Primary
        "interesse",
        "interesses",
        "interessado",
        "interessada",
        "interesse em",
        "interessado em",
        "interessada em",
        "area de interesse",
        "área de interesse",
        "areas de interesse",
        "áreas de interesse",
        // Portuguese - Product/Service
        "produto",
        "produtos",
        "interesse no produto",
        "produto de interesse",
        "servico",
        "serviço",
        "servicos",
        "serviços",
        "interesse no servico",
        "interesse no serviço",
        "solucao",
        "solução",
        "solucoes",
        "soluções",
        "oferta",
        "ofertas",
        "item",
        "itens",
        // Portuguese - Needs/Wants
        "necessidade",
        "necessidades",
        "necessita",
        "necessitando",
        "quer",
        "querer",
        "deseja",
        "desejar",
        "desejando",
        "requisito",
        "requisitos",
        "requer",
        "requerido",
        "procurando",
        "procurando por",
        "procura",
        "procura por",
        "buscando",
        "buscando por",
        "busca",
        "busca por",
        "preferencia",
        "preferência",
        "preferencias",
        "preferências",
        "escolha",
        "escolhas",
        "escolher",
        "escolhido",
        // Portuguese - Questions
        "o que interessa",
        "o que te interessa",
        "qual interesse",
        "qual produto",
        "que produto",
        "que servico",
        "que serviço",
        "em que esta interessado",
        "em que está interessado",
      ],

      description: [
        // English
        "description",
        "desc",
        "desc.",
        "notes",
        "note",
        "observations",
        "observation",
        "comments",
        "comment",
        "remarks",
        "remark",
        "details",
        "additional info",
        "additional information",
        "extra info",
        "info",
        "information",
        "about",
        "summary",
        "overview",
        "background",
        "context",
        // Portuguese
        "descricao",
        "descrição",
        "desc",
        "desc.",
        "notas",
        "nota",
        "observacoes",
        "observações",
        "observacao",
        "observação",
        "comentarios",
        "comentários",
        "comentario",
        "comentário",
        "detalhes",
        "informacoes adicionais",
        "informações adicionais",
        "info adicional",
        "informacao",
        "informação",
        "info",
        "infos",
        "sobre",
        "resumo",
        "visao geral",
        "visão geral",
        "contexto",
        "historico",
        "histórico",
      ],
    };

    for (const [key, aliases] of Object.entries(headerAliases) as [
      (
        | "name"
        | "email"
        | "phone"
        | "ssn"
        | "ein"
        | "source"
        | "status"
        | "value"
        | "estimated_close_date"
        | "location"
        | "interest"
        | "description"
      ),
      string[],
    ][]) {
      if (aliases.includes(normalized)) return key;
    }

    return null;
  }

  function makeLeadSignature(l: {
    name: string;
    email: string;
    phone?: string;
    ssn?: string;
    source?: string;
    status: string;
  }): string {
    return `${l.name}||${l.email}||${l.phone || ""}||${l.ssn || ""}||${l.source || ""}||${l.status}`;
  }

  function buildSignatureSet(items: Lead[]): Set<string> {
    const s = new Set<string>();

    for (const l of items) {
      s.add(
        makeLeadSignature({
          name: l.name,
          email: l.email,
          phone: l.phone,
          ssn: l.ssn,
          source: l.source,
          status: l.status,
        }),
      );
    }

    return s;
  }

  // Attachment functions
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return FileImage;
    if (mimeType === "application/pdf") return FileText;
    if (mimeType.includes("word") || mimeType.includes("document"))
      return FileText;
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return FileText;
    if (mimeType.startsWith("video/")) return FileVideo;
    if (mimeType.startsWith("audio/")) return FileAudio;
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("tar")
    )
      return Archive;
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds 50MB limit. Current size: ${formatFileSize(file.size)}`,
      };
    }
    return { valid: true };
  };

  function validateImportFile(file: File): { valid: boolean; error?: string } {
    const allowed = /\.(xlsx|xls|csv|ods|json)$/i.test(file.name);
    if (!allowed) {
      return {
        valid: false,
        error: "Unsupported file. Please choose .xlsx, .xls, .csv, .ods or .json",
      };
    }

    if (file.size > IMPORT_MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File exceeds ${Math.floor(IMPORT_MAX_FILE_SIZE_BYTES / 1024 / 1024)}MB limit. Current size: ${formatFileSize(file.size)}`,
      };
    }

    return { valid: true };
  }

  function sanitizeImportedRows(
    rows: Record<string, unknown>[],
  ): Record<string, unknown>[] {
    const sanitized: Record<string, unknown>[] = [];

    for (const row of rows) {
      const cleanRow: Record<string, unknown> = {};
      let colCount = 0;

      for (const [rawKey, rawValue] of Object.entries(row)) {
        if (colCount >= IMPORT_MAX_COLUMNS) break;

        const key = String(rawKey || "").trim();
        if (!key) continue;

        const normalized = key.toLowerCase();
        if (DANGEROUS_IMPORT_KEYS.has(normalized)) continue;

        if (typeof rawValue === "string") {
          cleanRow[key] = rawValue.slice(0, 5000);
        } else {
          cleanRow[key] = rawValue;
        }

        colCount++;
      }

      if (Object.keys(cleanRow).length > 0) {
        sanitized.push(cleanRow);
      }
    }

    return sanitized;
  }

  function parseRowsFromSpreadsheet(arrayBuffer: ArrayBuffer): Record<string, unknown>[] {
    const workbook = XLSX.read(arrayBuffer, {
      type: "array",
      dense: true,
      cellFormula: false,
      cellHTML: false,
      cellNF: false,
      cellStyles: false,
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const parsedRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
      raw: false,
      blankrows: false,
    });

    if (parsedRows.length > IMPORT_MAX_ROWS) {
      throw new Error(`Import limit exceeded. Maximum ${IMPORT_MAX_ROWS} rows per file.`);
    }

    return sanitizeImportedRows(parsedRows);
  }

  const handleAttachmentFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    leadId: string,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    // Process all selected files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);

      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    }

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      pushToast(
        t("notifications.invalidFiles") + ` ${invalidFiles.join(", ")}`,
        "error",
      );
    }

    // Add valid files to pending attachments
    if (validFiles.length > 0) {
      setPendingAttachments((prev) => ({
        ...prev,
        [leadId]: {
          toAdd: [...(prev[leadId]?.toAdd || []), ...validFiles],
          toRemove: prev[leadId]?.toRemove || [],
        },
      }));
      setHasUnsavedChanges(true);
    }

    // Reset input
    if (attachmentFileInputRef.current) {
      attachmentFileInputRef.current.value = "";
    }
  };

  const handleAttachmentDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAttachmentDragActive(true);
  };

  const handleAttachmentDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAttachmentDragActive(false);
  };

  const handleAttachmentDrop = (e: React.DragEvent, leadId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAttachmentDragActive(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    // Process all dropped files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);

      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    }

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      pushToast(
        t("notifications.invalidFiles") + ` ${invalidFiles.join(", ")}`,
        "error",
      );
    }

    // Add valid files to pending attachments
    if (validFiles.length > 0) {
      setPendingAttachments((prev) => ({
        ...prev,
        [leadId]: {
          toAdd: [...(prev[leadId]?.toAdd || []), ...validFiles],
          toRemove: prev[leadId]?.toRemove || [],
        },
      }));
      setHasUnsavedChanges(true);
    }
  };

  const uploadAttachment = async (leadId: string, file: File) => {
    try {
      setUploadingAttachments((prev) => ({ ...prev, [leadId]: true }));
      setAttachmentProgress((prev) => ({ ...prev, [leadId]: 0 }));

      const response = await apiService.uploadAttachment(leadId, file);

      if (response.success && response.data) {
        // Check if the response has the expected structure
        let newAttachment = null;

        if (response.data.lead.attachments) {
          newAttachment = response.data.lead.attachments[0];
        } else if (
          (response.data as any).data &&
          (response.data as any).data.attachment
        ) {
          newAttachment = (response.data as any).data.attachment;
        } else if (response.data) {
          // Maybe the response.data is the attachment itself
          newAttachment = response.data as any;
        }

        if (
          newAttachment &&
          newAttachment.id &&
          newAttachment.mimeType &&
          newAttachment.originalName
        ) {
          // Update local state with new attachment
          setLeads((prev) =>
            prev.map((lead) => {
              if (lead.id === leadId) {
                const attachments = lead.attachments || [];
                return {
                  ...lead,
                  attachments: [...attachments, newAttachment],
                };
              }
              return lead;
            }),
          );

          setFilteredLeads((prev) =>
            prev.map((lead) => {
              if (lead.id === leadId) {
                const attachments = lead.attachments || [];
                return {
                  ...lead,
                  attachments: [...attachments, newAttachment],
                };
              }
              return lead;
            }),
          );
        } else {
          console.warn(
            "Invalid attachment received from server:",
            newAttachment,
          );
        }

        // Refresh to ensure sync
        await syncAfterOperation();
      } else {
        pushToast(
          response.error || t("notifications.errorUploadingFile"),
          "error",
        );
      }
    } catch (error) {
      console.error("Error uploading attachment:", error);
      pushToast(t("notifications.errorUploadingFile"), "error");
    } finally {
      setUploadingAttachments((prev) => ({ ...prev, [leadId]: false }));
      setAttachmentProgress((prev) => ({ ...prev, [leadId]: 0 }));
    }
  };

  const uploadAttachmentSilently = async (leadId: string, file: File) => {
    try {
      const response = await apiService.uploadAttachment(leadId, file);

      if (response.success && response.data) {
        // Check if the response has the expected structure
        let newAttachment = null;

        if (response.data.lead.attachments) {
          newAttachment = response.data.lead.attachments[0];
        } else if (
          (response.data as any).data &&
          (response.data as any).data.attachment
        ) {
          newAttachment = (response.data as any).data.attachment;
        } else if (response.data) {
          newAttachment = response.data as any;
        }

        if (
          newAttachment &&
          newAttachment.id &&
          newAttachment.mimeType &&
          newAttachment.originalName
        ) {
          // Update local state to add attachment
          setLeads((prev) =>
            prev.map((lead) => {
              console.log(leadId);
              if (lead.id === leadId) {
                const attachments = lead.attachments || [];
                return {
                  ...lead,
                  attachments: [...attachments, newAttachment],
                };
              }
              return lead;
            }),
          );

          setFilteredLeads((prev) =>
            prev.map((lead) => {
              if (lead.id === leadId) {
                const attachments = lead.attachments || [];
                return {
                  ...lead,
                  attachments: [...attachments, newAttachment],
                };
              }
              return lead;
            }),
          );
        }
      } else {
        throw new Error(response.error || "Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading attachment silently:", error);
      throw error;
    }
  };

  const removeAttachmentFromPending = (
    leadId: string,
    attachmentId: string,
  ) => {
    // Add to pending removals instead of deleting immediately
    setPendingAttachments((prev) => ({
      ...prev,
      [leadId]: {
        toAdd: prev[leadId]?.toAdd || [],
        toRemove: [...(prev[leadId]?.toRemove || []), attachmentId],
      },
    }));
    setHasUnsavedChanges(true);
  };

  const deleteAttachment = async (leadId: string, attachmentId: string) => {
    try {
      const response = await apiService.deleteLeadAttachment(
        leadId,
        attachmentId,
      );

      if (response.success) {
        // Update local state to remove attachment
        setLeads((prev) =>
          prev.map((lead) => {
            if (lead.id === leadId) {
              const attachments = (lead.attachments || []).filter(
                (a) => a.id !== attachmentId,
              );
              return { ...lead, attachments };
            }
            return lead;
          }),
        );

        setFilteredLeads((prev) =>
          prev.map((lead) => {
            if (lead.id === leadId) {
              const attachments = (lead.attachments || []).filter(
                (a) => a.id !== attachmentId,
              );
              return { ...lead, attachments };
            }
            return lead;
          }),
        );

        // Refresh to ensure sync
        await syncAfterOperation();
      } else {
        pushToast(
          response.error || t("notifications.errorDeletingFile"),
          "error",
        );
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
      pushToast(t("notifications.errorDeletingFile"), "error");
    }
  };

  const downloadAttachment = async (
    leadId: string,
    attachmentId: string,
    filename: string,
  ) => {
    try {
      const blob = await apiService.getLeadAttachment(leadId, attachmentId);

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        pushToast(
          t("notifications.fileDownloaded") ||
            t("notifications.fileDownloadSuccess"),
          "success",
        );
      } else {
        pushToast(
          t("notifications.errorDownloadingFile") ||
            t("notifications.fileDownloadFailed"),
          "error",
        );
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
      pushToast(
        t("notifications.errorDownloadingFile") ||
          t("notifications.fileDownloadFailed"),
        "error",
      );
    }
  };

  const viewAttachment = async (leadId: string, attachmentId: string) => {
    try {
      const blob = await apiService.getAttachment(leadId, attachmentId);

      if (blob.data) {
        const url = window.URL.createObjectURL(blob.data);
        window.open(url, "_blank");
      } else {
        pushToast(
          t("notifications.errorViewingFile") ||
            t("notifications.fileViewFailed"),
          "error",
        );
      }
    } catch (error) {
      console.error("Error viewing attachment:", error);
      pushToast(
        t("notifications.errorViewingFile") ||
          t("notifications.fileViewFailed"),
        "error",
      );
    }
  };

  const processPendingAttachments = async (leadId: string) => {
    const pending = pendingAttachments[leadId];
    if (
      !pending ||
      (pending.toAdd.length === 0 && pending.toRemove.length === 0)
    ) {
      return;
    }

    try {
      setUploadingAttachments((prev) => ({ ...prev, [leadId]: true }));

      // Process deletions first
      for (const attachmentId of pending.toRemove) {
        await deleteAttachment(leadId, attachmentId);
      }

      // Process uploads - but don't update local state immediately
      for (const file of pending.toAdd) {
        await uploadAttachmentSilently(leadId, file);
      }

      // Refresh the lead data to get updated attachments
      await syncAfterOperation();

      // Clear pending changes
      setPendingAttachments((prev) => {
        const newPending = { ...prev };
        delete newPending[leadId];
        return newPending;
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error processing pending attachments:", error);
      pushToast(
        t("notifications.errorSavingAttachments") ||
          t("notifications.errorSaving"),
        "error",
      );
    } finally {
      setUploadingAttachments((prev) => ({ ...prev, [leadId]: false }));
    }
  };

  // Function to separate email and phone from concatenated string
  function separateEmailAndPhone(combinedString: string): {
    email: string;
    phone: string;
  } {
    if (!combinedString) return { email: "", phone: "" };

    // Try to find email pattern (contains @)
    const emailMatch = combinedString.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    );
    if (emailMatch) {
      const email = emailMatch[0];
      // Remove the email from the string to get the phone
      let phone = combinedString.replace(email, "").trim();

      // Clean up phone number (remove any non-digit characters except + at start)
      phone = phone.replace(/[^\d+]/g, "");

      // If phone starts with +, keep it, otherwise format as needed
      if (phone && !phone.startsWith("+")) {
        // Ensure it's a valid phone number format
        phone = phone.replace(/^0+/, ""); // Remove leading zeros
      }

      return { email, phone };
    }

    // If no email found, treat entire string as phone
    return { email: "", phone: combinedString };
  }

  // Function to parse any date format (Brazilian, American, ISO, etc.)
  function parseAnyDateFormat(dateString: string | number): string | null {
    if (dateString == null || dateString === "") return null;

    // 🔹 Trata valores numéricos (Excel serial date)
    if (typeof dateString === "number") {
      const excelEpoch = new Date(1899, 11, 30); // Excel epoch is 1900-01-01, but JavaScript Date is 1899-12-30
      const date = new Date(excelEpoch.getTime() + dateString * 86400000);
      return date.toISOString().split("T")[0];
    }

    const cleanDate = dateString.toString().trim();

    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return cleanDate;
    }

    // Try different date patterns
    const patterns = [
      // DD/MM/YYYY (Brazilian)
      {
        regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        handler: (match: RegExpMatchArray) => {
          const [, day, month, year] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        },
      },

      // MM/DD/YYYY (American)
      {
        regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        handler: (match: RegExpMatchArray) => {
          const [, month, day, year] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        },
      },

      // YYYY/MM/DD
      {
        regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
        handler: (match: RegExpMatchArray) => {
          const [, year, month, day] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        },
      },

      // DD-MM-YYYY
      {
        regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
        handler: (match: RegExpMatchArray) => {
          const [, day, month, year] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        },
      },

      // YYYY-MM-DD (already handled above, but just in case)
      {
        regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
        handler: (match: RegExpMatchArray) => {
          const [, year, month, day] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        },
      },

      // DD.MM.YYYY
      {
        regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
        handler: (match: RegExpMatchArray) => {
          const [, day, month, year] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        },
      },

      // DD de MMMM de YYYY (Brazilian long format)
      {
        regex: /^(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})$/,
        handler: (match: RegExpMatchArray) => {
          const [, day, monthName, year] = match;
          const monthNames = [
            "janeiro",
            "fevereiro",
            "março",
            "abril",
            "maio",
            "junho",
            "julho",
            "agosto",
            "setembro",
            "outubro",
            "novembro",
            "dezembro",
          ];
          const monthIndex = monthNames.findIndex(
            (m) => m.toLowerCase() === monthName.toLowerCase(),
          );
          if (monthIndex !== -1) {
            return new Date(parseInt(year), monthIndex, parseInt(day));
          }
          return null;
        },
      },
    ];

    // Try each pattern
    for (const pattern of patterns) {
      const match = cleanDate.match(pattern.regex);
      if (match) {
        try {
          const date = pattern.handler(match);
          if (date && !isNaN(date.getTime())) {
            // Validate date is reasonable
            const year = date.getFullYear();
            const currentYear = new Date().getFullYear();
            if (year >= 1900 && year <= currentYear + 10) {
              return date.toISOString().split("T")[0];
            }
          }
        } catch (error) {
          // Try next pattern
        }
      }
    }

    // Try JavaScript's native Date parsing as fallback
    try {
      const nativeDate = new Date(cleanDate);
      if (!isNaN(nativeDate.getTime())) {
        const year = nativeDate.getFullYear();
        const currentYear = new Date().getFullYear();
        if (year >= 1900 && year <= currentYear + 10) {
          return nativeDate.toISOString().split("T")[0];
        }
      }
    } catch (error) {
      // Date parsing failed
    }

    return null;
  }

  // Function to separate SSN and EIN from concatenated string
  function separateSSNAndEIN(combinedString: string): {
    ssn: string;
    ein: string;
  } {
    if (!combinedString) return { ssn: "", ein: "" };

    // Remove common prefixes and clean the string
    let cleanString = combinedString
      .replace(/^(ssn|ein):\s*/gi, "") // Remove SSN: or EIN: prefixes
      .replace(/^(ssn|ein)\s*/gi, "") // Remove SSN or EIN prefixes
      .replace(/ssn:\s*/gi, "") // Remove SSN: prefix
      .replace(/ein:\s*/gi, "") // Remove EIN: prefix
      .trim();

    // Try to find SSN pattern (XXX-XX-XXXX or XXXXXXXXX)
    const ssnMatch = cleanString.match(/(\d{3}-?\d{2}-?\d{4})/);
    let ssn = "";
    let ein = "";

    if (ssnMatch) {
      ssn = ssnMatch[1].replace(/-/g, ""); // Remove dashes for storage
      // Remove SSN from string to get EIN
      cleanString = cleanString.replace(ssnMatch[1], "").trim();
    }

    // Look for EIN pattern (9+ digits)
    const einMatch = cleanString.match(/(\d{9,})/);
    if (einMatch) {
      ein = einMatch[1];
    }

    return { ssn, ein };
  }
  function mapRowsToLeads(rows: Record<string, unknown>[]): Lead[] {
    if (rows.length === 0) return [];

    const sampleRow = rows[0];

    const headerKeys = Object.keys(sampleRow);

    const mapping: Partial<
      Record<
        string,
        | "name"
        | "email"
        | "phone"
        | "ssn"
        | "ein"
        | "source"
        | "status"
        | "value"
        | "estimated_close_date"
        | "location"
        | "interest"
        | "description"
      >
    > = {};

    console.log("Original headers:", headerKeys);

    // Test specific problematic headers

    console.log("Testing 'Close Date' detection...");
    const closeDateHeaders = headerKeys.filter(
      (h) =>
        h.toLowerCase().includes("close") ||
        h.toLowerCase().includes("date") ||
        h.toLowerCase().includes("fechamento"),
    );
    console.log("Potential close date headers:", closeDateHeaders);
    const testHeaders = [
      "Value",
      "Close Date",
      "Notes",
      "Description",
      "Estimated Close Date",
    ];

    console.log("Testing specific headers:");

    for (const testHeader of testHeaders) {
      const normalized = normalizeHeader(testHeader);

      const canonical = headerToCanonical(normalized);

      console.log(
        `Test: "${testHeader}" -> Normalized: "${normalized}" -> Canonical: ${canonical}`,
      );
    }

    for (const header of headerKeys) {
      const normalized = normalizeHeader(header);

      const canonical = headerToCanonical(normalized);

      console.log(
        `Header: "${header}" -> Normalized: "${normalized}" -> Canonical: ${canonical}`,
      );

      if (canonical) {
        mapping[header] = canonical;

        console.log(`✅ Mapped "${header}" to ${canonical}`);
      } else {
        console.log(
          `❌ Could not map "${header}" (normalized: "${normalized}")`,
        );
      }
    }

    console.log("Final mapping:", mapping);

    const imported: Lead[] = [];

    for (const row of rows) {
      const draft: Partial<Lead> = {};

      console.log("Processing row:", row);

      for (const [header, value] of Object.entries(row)) {
        const key = mapping[header];

        if (!key) continue;

        const text = String(value ?? "").trim();

        if (key === "status") {
          draft.status = truncateTo(text, FIELD_MAX.status) as Lead["status"];
        } else if (key === "name") {
          draft.name = truncateTo(text, FIELD_MAX.name);
        } else if (key === "email") {
          // Check if this field contains both email and phone (concatenated)
          if (text.includes("@") && /\d/.test(text)) {
            const separated = separateEmailAndPhone(text);
            draft.email = truncateTo(separated.email, FIELD_MAX.email);
            if (separated.phone && !draft.phone) {
              draft.phone = truncateTo(separated.phone, FIELD_MAX.phone);
            }
          } else {
            draft.email = truncateTo(text, FIELD_MAX.email);
          }
        } else if (key === "phone") {
          draft.phone = truncateTo(text, FIELD_MAX.phone);
        } else if (key === "source") {
          draft.source = truncateTo(text, FIELD_MAX.source);
        } else if (key === "ssn") {
          // Check if this field contains SSN (with or without EIN)
          if (text.includes("SSN")) {
            const separated = separateSSNAndEIN(text);
            draft.ssn = truncateTo(separated.ssn, FIELD_MAX.ssn);
            if (separated.ein && !draft.ein) {
              draft.ein = truncateTo(separated.ein, FIELD_MAX.ein);
            }
          } else {
            draft.ssn = truncateTo(text, FIELD_MAX.ssn);
          }
        } else if (key === "ein") {
          draft.ein = truncateTo(text, FIELD_MAX.ein);
        } else if (key === "value") {
          // Clean monetary values (remove $, commas, etc.)
          const cleanValue = text.replace(/[$,]/g, "").trim();
          const numValue = parseFloat(cleanValue);
          if (!isNaN(numValue)) {
            draft.value = numValue;

            console.log(`Set Value: ${draft.value} (from "${text}")`);
          }
        } else if (key === "estimated_close_date") {
          // Try to parse the date and limit to 10 characters

          if (text && text.trim()) {
            try {
              const parsedDate = parseAnyDateFormat(text.trim());
              if (parsedDate) {
                draft.estimated_close_date = parsedDate.slice(
                  0,
                  FIELD_MAX.date,
                );
              }
            } catch (error) {
              // Date parsing failed, skip
            }
          }
        } else if (key === "description") {
          draft.description = truncateTo(text, FIELD_MAX.description);
        } else if (key === "location") {
          draft.location = truncateTo(text, FIELD_MAX.source);
          console.log(`✅ Set Location: "${draft.location}" (from "${text}")`);
        } else if (key === "interest") {
          draft.interest = truncateTo(text, FIELD_MAX.source);
          console.log(`✅ Set Interest: "${draft.interest}" (from "${text}")`);
        }
      }

      // Validate required fields
      if (!draft.name || !draft.email) {
        continue;
      }

      // Ensure estimated_close_date is valid before creating lead
      let safeEstimatedCloseDate = draft.estimated_close_date;
      if (safeEstimatedCloseDate) {
        try {
          // Validate the date format and ensure it's reasonable
          const testDate = new Date(safeEstimatedCloseDate);
          if (isNaN(testDate.getTime())) {
            safeEstimatedCloseDate = undefined;
          } else {
            // Ensure it's in YYYY-MM-DD format
            const year = testDate.getFullYear();
            const month = String(testDate.getMonth() + 1).padStart(2, "0");
            const day = String(testDate.getDate()).padStart(2, "0");
            safeEstimatedCloseDate = `${year}-${month}-${day}`;
          }
        } catch (error) {
          safeEstimatedCloseDate = undefined;
        }
      }

      const finalLead = {
        id: createId(),

        organization_id: "", // Will be set by the API

        name: draft.name,
        email: draft.email,
        phone: draft.phone || "",

        ssn: draft.ssn || "",

        ein: draft.ein || "",

        source: draft.source || "",

        status: (draft.status as Lead["status"]) || "New",

        value: draft.value,

        estimated_close_date: safeEstimatedCloseDate,
        location: draft.location || "",
        interest: draft.interest || "",
        description: draft.description,
        show_on_pipeline: false,

        created_at: new Date().toISOString(),

        updated_at: new Date().toISOString(),
      };

      console.log(`📦 Final Lead for "${finalLead.name}":`, {
        location: finalLead.location,
        interest: finalLead.interest,
        hasLocation: !!finalLead.location,
        hasInterest: !!finalLead.interest,
      });

      imported.push(finalLead);
    }

    return imported;
  }

  // Helper function to retry a lead creation with exponential backoff
  async function createLeadWithRetry(
    lead: Lead,
    maxRetries: number = 5,
  ): Promise<{
    success: boolean;
    lead: Lead | null;
    type: string;
    error?: string;
  }> {
    const createData: CreateLeadRequest = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone || undefined,
      ssn: lead.ssn || undefined,
      ein: lead.ein || undefined,
      source: lead.source || undefined,
      location: lead.location || undefined,
      interest: lead.interest || undefined,
      status: lead.status,
      value: lead.value,
      description: lead.description,
      estimated_close_date: lead.estimated_close_date,
    };

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await apiService.createLead(createData);

        if (response.success && response.data) {
          return { success: true, lead: response.data.lead, type: "saved" };
        } else {
          // Check if it's a duplicate error
          const errorMsg = response.error?.toLowerCase() || "";
          if (
            errorMsg.includes("duplicado") ||
            errorMsg.includes("duplicate")
          ) {
            // Don't retry duplicates
            return { success: true, lead: null, type: "duplicate" };
          } else if (attempt < maxRetries - 1) {
            // Retry on other errors with exponential backoff
            const backoffDelay = 50 * Math.pow(2, attempt); // 50ms, 100ms, 200ms, 400ms, 800ms
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            continue;
          } else {
            console.error(
              `Failed to save lead after ${maxRetries} attempts:`,
              lead.name,
              response.error,
            );
            return {
              success: false,
              lead: null,
              type: "error",
              error: response.error,
            };
          }
        }
      } catch (error) {
        if (attempt < maxRetries - 1) {
          // Retry on network errors with exponential backoff
          const backoffDelay = 50 * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          continue;
        } else {
          console.error(
            `Network error after ${maxRetries} attempts:`,
            lead.name,
            error,
          );
          return {
            success: false,
            lead: null,
            type: "error",
            error: String(error),
          };
        }
      }
    }

    return {
      success: false,
      lead: null,
      type: "error",
      error: t("notifications.maxRetriesExceeded"),
    };
  }

  // Function to process leads in batches with controlled parallel processing and retry logic
  async function processBatch(
    leads: Lead[],
    batchSize: number = 1000,
    initialDelayMs: number = 0,
    isCancelled: () => boolean = () => importCancelled,
    onBatchSaved?: (leads: Lead[]) => void,
  ): Promise<{
    saved: Lead[];
    errors: number;
    duplicates: number;
    cancelled: boolean;
    failedLeads: Array<{ lead: Lead; error: string }>;
  }> {
    const totalBatches = Math.ceil(leads.length / batchSize);
    const savedLeads: Lead[] = [];
    const failedLeads: Array<{ lead: Lead; error: string }> = [];
    let errorCount = 0;
    let duplicateCount = 0;
    const parallelLimit = 30; // Process 30 leads in parallel to avoid server overload

    for (let i = 0; i < leads.length; i += batchSize) {
      // Check if import was cancelled
      const cancelled = isCancelled();
      if (cancelled || isImportCancelledRef.current) {
        // Rollback: remove imported leads from backend and frontend
        if (savedLeads.length > 0) {
          let successfullyDeleted = 0;
          let errors = 0;

          try {
            // Delete imported leads from backend with error handling
            for (const lead of savedLeads) {
              try {
                const response = await apiService.deleteLead(lead.id);
                if (response.success) {
                  successfullyDeleted++;
                } else {
                  errors++;
                }
              } catch (error) {
                errors++;
              }
            }

            if (successfullyDeleted > 0) {
              pushToast(
                t("notifications.importCancelledLeadsRemoved", {
                  count: successfullyDeleted,
                }) || t("notifications.importCancelled"),
                "success",
              );
            }
            if (errors > 0) {
              pushToast(
                t("notifications.importCancelledLeadsNotFound", {
                  count: errors,
                }) || t("notifications.importCancelled"),
                "warning",
              );
            }
          } catch (error) {
            console.error("Error during rollback:", error);
            pushToast(t("notifications.importCancelledLocalOnly"), "warning");
          }

          // Remove from frontend state regardless of backend success
          const importedIds = savedLeads.map((lead) => lead.id);
          setLeads((prev) =>
            prev.filter((lead) => !importedIds.includes(lead.id)),
          );
          setFilteredLeads((prev) =>
            prev.filter((lead) => !importedIds.includes(lead.id)),
          );
          setImportedLeads((prev) =>
            prev.filter((lead) => !importedIds.includes(lead.id)),
          );
          setCurrentImportLeads([]);
          // Atualizar o total de leads após cancelar importação
          if (savedLeads.length > 0) {
            setTotalLeads((prev) => Math.max(0, prev - savedLeads.length));
          }
        }
        setImportNotification({
          show: false,
          progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
          cancelled: true,
        });
        setIsImportCancelled(false);
        isImportCancelledRef.current = false;
        return {
          saved: savedLeads,
          errors: errorCount,
          duplicates: duplicateCount,
          cancelled: true,
          failedLeads,
        };
      }

      const batch = leads.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      setImportProgress({
        current: i,
        total: leads.length,
        batch: batchNumber,
        totalBatches,
      });
      setImportNotification({
        show: true,
        progress: {
          current: i,
          total: leads.length,
          batch: batchNumber,
          totalBatches,
        },
        cancelled: false,
      });

      // Check if import was cancelled before processing batch
      if (isCancelled() || isImportCancelledRef.current) {
        // Rollback: remove imported leads from backend and frontend
        if (savedLeads.length > 0) {
          let successfullyDeleted = 0;
          let errors = 0;

          try {
            for (const lead of savedLeads) {
              try {
                const response = await apiService.deleteLead(lead.id);
                if (response.success) {
                  successfullyDeleted++;
                } else {
                  errors++;
                }
              } catch (error) {
                errors++;
              }
            }

            if (successfullyDeleted > 0) {
              pushToast(
                t("notifications.importCancelledLeadsRemoved", {
                  count: successfullyDeleted,
                }) || t("notifications.importCancelled"),
                "success",
              );
            }
          } catch (error) {
            console.error("Error during rollback:", error);
          }

          // Remove from frontend state
          const importedIds = savedLeads.map((lead) => lead.id);
          setLeads((prev) =>
            prev.filter((lead) => !importedIds.includes(lead.id)),
          );
          setFilteredLeads((prev) =>
            prev.filter((lead) => !importedIds.includes(lead.id)),
          );
          setImportedLeads((prev) =>
            prev.filter((lead) => !importedIds.includes(lead.id)),
          );
          setCurrentImportLeads([]);
          // Atualizar o total de leads após cancelar importação
          if (savedLeads.length > 0) {
            setTotalLeads((prev) => Math.max(0, prev - savedLeads.length));
          }
        }
        setImportNotification({
          show: false,
          progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
          cancelled: true,
        });
        setIsImportCancelled(false);
        isImportCancelledRef.current = false;
        return {
          saved: savedLeads,
          errors: errorCount,
          duplicates: duplicateCount,
          cancelled: true,
          failedLeads,
        };
      }

      // Process batch in controlled parallel chunks (parallelLimit at a time)
      const batchSavedLeads: Lead[] = [];
      for (let j = 0; j < batch.length; j += parallelLimit) {
        // Check cancellation
        if (isCancelled() || isImportCancelledRef.current) {
          // Rollback: remove imported leads from backend and frontend
          if (savedLeads.length > 0) {
            let successfullyDeleted = 0;
            let errors = 0;

            try {
              for (const lead of savedLeads) {
                try {
                  const response = await apiService.deleteLead(lead.id);
                  if (response.success) {
                    successfullyDeleted++;
                  } else {
                    errors++;
                  }
                } catch (error) {
                  errors++;
                }
              }

              if (successfullyDeleted > 0) {
                pushToast(
                  t("notifications.importCancelledLeadsRemoved", {
                    count: successfullyDeleted,
                  }) || t("notifications.importCancelled"),
                  "success",
                );
              }
            } catch (error) {
              console.error("Error during rollback:", error);
            }

            // Remove from frontend state
            const importedIds = savedLeads.map((lead) => lead.id);
            setLeads((prev) =>
              prev.filter((lead) => !importedIds.includes(lead.id)),
            );
            setFilteredLeads((prev) =>
              prev.filter((lead) => !importedIds.includes(lead.id)),
            );
            setImportedLeads((prev) =>
              prev.filter((lead) => !importedIds.includes(lead.id)),
            );
            setCurrentImportLeads([]);
            // Atualizar o total de leads após cancelar importação
            if (savedLeads.length > 0) {
              setTotalLeads((prev) => Math.max(0, prev - savedLeads.length));
            }
          }
          setImportNotification({
            show: false,
            progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
            cancelled: true,
          });
          setIsImportCancelled(false);
          isImportCancelledRef.current = false;
          return {
            saved: savedLeads,
            errors: errorCount,
            duplicates: duplicateCount,
            cancelled: true,
            failedLeads,
          };
        }

        const chunk = batch.slice(j, j + parallelLimit);
        const leadIndex = i + j;

        // Update progress
        setImportProgress({
          current: leadIndex,
          total: leads.length,
          batch: batchNumber,
          totalBatches,
        });
        setImportNotification({
          show: true,
          progress: {
            current: leadIndex,
            total: leads.length,
            batch: batchNumber,
            totalBatches,
          },
          cancelled: false,
        });

        // Process chunk in parallel
        const chunkPromises = chunk.map((lead) => createLeadWithRetry(lead, 5));
        const chunkResults = await Promise.all(chunkPromises);

        // Collect results
        chunkResults.forEach((result) => {
          if (result.success) {
            if (result.type === "saved" && result.lead) {
              savedLeads.push(result.lead);
              batchSavedLeads.push(result.lead);
            } else if (result.type === "duplicate") {
              duplicateCount++;
            }
          } else {
            errorCount++;
            // Extract lead from error - need to match back
            const leadData = chunk[chunkResults.indexOf(result)];
            if (leadData) {
              failedLeads.push({
                lead: leadData,
                error: result.error || t("notifications.unknownError"),
              });
            }
          }
        });

        // Small delay to prevent server overload
        if (j + parallelLimit < batch.length) {
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
      }

      // Call callback with newly saved leads from this batch
      if (onBatchSaved && batchSavedLeads.length > 0) {
        onBatchSaved(batchSavedLeads);
      }

      // No delay between batches for maximum speed
    }

    return {
      saved: savedLeads,
      errors: errorCount,
      duplicates: duplicateCount,
      cancelled: false,
      failedLeads,
    };
  }

  async function processFileForPreview(file: File) {
    try {
      const validation = validateImportFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const lower = file.name.toLowerCase();
      let imported: Lead[] = [];
      let fields: string[] = [];

      if (lower.endsWith(".json")) {
        const text = await file.text();
        const data = JSON.parse(text) as Record<string, unknown>[];
        const safeRows = sanitizeImportedRows(Array.isArray(data) ? data.slice(0, IMPORT_MAX_ROWS) : []);
        imported = mapRowsToLeads(safeRows);
        fields = safeRows.length > 0 ? Object.keys(safeRows[0]) : [];
      } else {
        // CSV, XLSX, XLS, ODS via SheetJS
        const arrayBuffer = await file.arrayBuffer();
        const rows = parseRowsFromSpreadsheet(arrayBuffer);
        imported = mapRowsToLeads(rows);
        fields = rows.length > 0 ? Object.keys(rows[0]) : [];
      }

      return { leads: imported, fields, totalLeads: imported.length };
    } catch (error) {
      console.error("Error processing file:", error);
      throw error;
    }
  }

  async function handleFileSelect(file: File) {
    setIsProcessingFile(true);
    try {
      const preview = await processFileForPreview(file);
      setFilePreview(preview);
      setShowPreview(true);
    } catch (error) {
      pushToast(t("notifications.errorProcessingFile"), "error");
      console.error("File processing error:", error);
    } finally {
      setIsProcessingFile(false);
    }
  }

  async function confirmImport() {
    if (!filePreview) return;

    setShowPreview(false);
    setIsImportOpen(false);

    // Create a temporary file object for the import
    const fileInput = fileInputRef.current;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      await handleImportFile(fileInput.files[0]);
    }
  }

  async function handleImportFile(file: File) {
    setIsImporting(true);

    setImportProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 });
    setImportNotification({
      show: true,
      progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
      cancelled: false,
    });
    setIsImportCancelled(false);
    isImportCancelledRef.current = false;
    setCurrentImportLeads([]); // Reset current import leads

    try {
      const validation = validateImportFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const lower = file.name.toLowerCase();

      let imported: Lead[] = [];

      if (lower.endsWith(".json")) {
        const text = await file.text();

        const data = JSON.parse(text) as Record<string, unknown>[];

        const safeRows = sanitizeImportedRows(Array.isArray(data) ? data.slice(0, IMPORT_MAX_ROWS) : []);
        imported = mapRowsToLeads(safeRows);
      } else {
        // CSV, XLSX, XLS, ODS via SheetJS

        const arrayBuffer = await file.arrayBuffer();

        const rows = parseRowsFromSpreadsheet(arrayBuffer);
        imported = mapRowsToLeads(rows);
      }

      if (imported.length > 0) {
        const existing = buildSignatureSet(leads);

        const uniqueToAdd: Lead[] = [];

        let duplicatesCount = 0;

        // Filtrar duplicados baseado em todos os campos principais

        for (const l of imported) {
          const isDuplicate = leads.some(
            (existingLead) =>
              existingLead.name.toLowerCase() === l.name.toLowerCase() &&
              existingLead.email.toLowerCase() === l.email.toLowerCase() &&
              (existingLead.phone || "") === (l.phone || "") &&
              (existingLead.ssn || "") === (l.ssn || "") &&
              (existingLead.source || "") === (l.source || "") &&
              existingLead.status === l.status,
          );

          if (!isDuplicate) {
            uniqueToAdd.push(l);
          } else {
            duplicatesCount++;
          }
        }

        if (uniqueToAdd.length > 0) {
          // Use optimized batch size to avoid server overload
          const batchSize = 1000;
          const delayMs = 0;

          const {
            saved: savedLeads,
            errors: errorCount,
            duplicates: duplicateCount,
            cancelled,
            failedLeads,
          } = await processBatch(
            uniqueToAdd,
            batchSize,
            delayMs,
            () => {
              return importCancelled;
            },
            (newLeads) => {
              // Track leads as they are imported for immediate rollback capability
              setCurrentImportLeads((prev) => [...prev, ...newLeads]);

              // Update leads list in real-time as batches are processed
              setLeads((prev) => [...newLeads, ...prev]);
              setFilteredLeads((prev) => [...newLeads, ...prev]);

              // Track all imported leads for potential rollback
              setImportedLeads((prev) => [...prev, ...newLeads]);
            },
          );

          // Retry failed leads one more time if any failed
          if (failedLeads.length > 0 && !cancelled) {
            console.log(`Retrying ${failedLeads.length} failed leads...`);
            pushToast(
              t("notifications.retryingLeads", { count: failedLeads.length }) ||
                t("notifications.retrying", { count: failedLeads.length }),
              "warning",
            );

            const retryLeads = failedLeads.map((f) => f.lead);
            const {
              saved: retrySaved,
              errors: retryErrors,
              duplicates: retryDuplicates,
              failedLeads: stillFailed,
            } = await processBatch(
              retryLeads,
              500,
              0,
              () => importCancelled,
              (newLeads) => {
                setCurrentImportLeads((prev) => [...prev, ...newLeads]);
                setLeads((prev) => [...newLeads, ...prev]);
                setFilteredLeads((prev) => [...newLeads, ...prev]);
                setImportedLeads((prev) => [...prev, ...newLeads]);
              },
            );

            // Update final counts
            savedLeads.push(...retrySaved);
            const finalErrors = retryErrors;
            const finalDuplicates = duplicateCount + retryDuplicates;

            // Log remaining failures
            if (stillFailed.length > 0) {
              console.error(
                `Still failed after retry (${stillFailed.length} leads):`,
              );
              stillFailed.forEach((f) =>
                console.error(`- ${f.lead.name} (${f.lead.email}): ${f.error}`),
              );
            }

            // Show comprehensive results
            let message = t("notifications.leadsImported", {
              count: savedLeads.length,
            });
            if (finalDuplicates > 0) {
              message += ` ${t("notifications.duplicatesSkipped", { count: finalDuplicates })}`;
            }
            if (finalErrors > 0) {
              message += ` ${t("notifications.leadsFailedAfterRetry", { count: finalErrors })}`;
            }
            pushToast(message, finalErrors > 0 ? "warning" : "success");

            // Atualizar o total de leads imediatamente após importação bem-sucedida
            if (savedLeads.length > 0) {
              setTotalLeads((prev) => prev + savedLeads.length);
            }
          } else {
            // Show comprehensive results
            if (cancelled) {
              pushToast(
                t("notifications.importCancelledWithResults", {
                  saved: savedLeads.length,
                  duplicates: duplicateCount,
                }) || t("notifications.importCancelled"),
                "warning",
              );
            } else {
              let message = t("notifications.leadsImported", {
                count: savedLeads.length,
              });
              if (duplicateCount > 0) {
                message += ` ${t("notifications.duplicatesSkipped", { count: duplicateCount })}`;
              }
              if (errorCount > 0) {
                message += ` ${t("notifications.leadsFailedToSave", { count: errorCount })}`;
              }
              pushToast(message, errorCount > 0 ? "warning" : "success");

              // Atualizar o total de leads imediatamente após importação bem-sucedida
              if (savedLeads.length > 0) {
                setTotalLeads((prev) => prev + savedLeads.length);
              }
            }

            if (cancelled && savedLeads.length === 0 && duplicateCount === 0) {
              pushToast(
                t("notifications.importCancelledNoLeads") ||
                  t("notifications.importCancelled"),
                "warning",
              );
            }
          }
        } else {
          pushToast(
            t("notifications.noLeadsImported") ||
              t("notifications.importCancelled"),
            "warning",
          );
        }

        if (duplicatesCount > 0) {
          pushToast(
            t("notifications.duplicatesSkipped", { count: duplicatesCount }),
            "warning",
          );
        }
      }
    } catch (err) {
      console.error(err);

      pushToast(t("notifications.errorImporting"), "error");
    } finally {
      setIsImporting(false);

      setImportProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 });
      setImportCancelled(false);
      setImportNotification({
        show: false,
        progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
        cancelled: false,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Sync after operation to ensure complete sync with backend
      await syncAfterOperation();
    }
  }
  function exportData(format: "xlsx" | "csv" | "ods" | "json") {
    try {
      const selectedIds = selectedLeads;

      // Se não há seleção, exporta template vazio
      const isTemplate = selectedIds.size === 0;

      // Apenas pega leads se houver seleção
      const baseList =
        selectedIds.size > 0 ? leads.filter((l) => selectedIds.has(l.id)) : [];

      // Template vazio com todas as colunas aceitas na importação
      const templateData = [
        {
          Name: "",
          Email: "",
          Phone: "",
          SSN: "",
          EIN: "",
          Source: "",
          Status: "",
          Value: "",
          "Estimated Close Date": "",
          Location: "",
          Interest: "",
          Description: "",
        },
      ];

      // Dados dos leads selecionados
      const leadsData = baseList.map((lead) => ({
        Name: lead.name,
        Email: lead.email,
        Phone: lead.phone || "",
        SSN: lead.ssn || "",
        EIN: lead.ein || "",
        Source: lead.source || "",
        Status: lead.status,
        Value: lead.value || "",
        "Estimated Close Date": lead.estimated_close_date || "",
        Location: lead.location || "",
        Interest: lead.interest || "",
        Description: lead.description || "",
      }));

      // Usa template se não há seleção, caso contrário usa os dados dos leads
      const data = isTemplate ? templateData : leadsData;

      const date = new Date().toISOString().split("T")[0];
      const base = isTemplate
        ? `leads_template_${org}_${date}`
        : `leads_${org}_${date}`;

      if (format === "json") {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json;charset=utf-8",
        });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${base}.json`;
        a.click();
        URL.revokeObjectURL(a.href);

        if (isTemplate) {
          pushToast(
            t("notifications.templateExported", { format: "JSON" }),
            "success",
          );
        } else {
          pushToast(
            t("notifications.leadsExported", {
              count: data.length,
              format: "JSON",
            }),
            "success",
          );
        }
        return;
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leads");
      const bookType = format;
      XLSX.writeFile(wb, `${base}.${format}`, {
        bookType: bookType as XLSX.BookType,
      });

      if (isTemplate) {
        pushToast(
          t("notifications.templateExported", { format: format.toUpperCase() }),
          "success",
        );
      } else {
        pushToast(
          t("notifications.leadsExported", {
            count: data.length,
            format: format.toUpperCase(),
          }),
          "success",
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      pushToast(t("notifications.errorExporting"), "error");
    }
  }

  // Free text phone input: no auto-formatting

  const canConfirmDeletion = React.useMemo(() => {
    // For single deletion, no typing required. For bulk deletion, require "delete"

    if (pendingDeletionIds.length === 1) return true;

    const value = confirmInput.trim().toLowerCase();

    return value === "delete";
  }, [confirmInput, pendingDeletionIds.length]);

  // Helper function to delete a lead with retry logic
  async function deleteLeadWithRetry(
    leadId: string,
    maxRetries: number = 5,
  ): Promise<{ success: boolean; id: string; error?: string }> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await apiService.deleteLead(leadId);

        if (response.success) {
          return { success: true, id: leadId };
        } else if (attempt < maxRetries - 1) {
          // Retry on failure with exponential backoff
          const backoffDelay = 50 * Math.pow(2, attempt); // 50ms, 100ms, 200ms, 400ms, 800ms
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          continue;
        } else {
          return { success: false, id: leadId, error: response.error };
        }
      } catch (error) {
        if (attempt < maxRetries - 1) {
          // Retry on network errors with exponential backoff
          const backoffDelay = 50 * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          continue;
        } else {
          return { success: false, id: leadId, error: String(error) };
        }
      }
    }

    return { success: false, id: leadId, error: "Max retries exceeded" };
  }

  async function performDeletion() {
    if (!canConfirmDeletion) return;

    // Close confirmation modal immediately when starting deletion
    setIsConfirmOpen(false);

    const totalLeads = pendingDeletionIds.length;
    const batchSize = 1000;
    const totalBatches = Math.ceil(totalLeads / batchSize);
    const parallelLimit = 30;

    // Show progress notification
    setDeleteNotification({
      show: true,
      progress: { current: 0, total: totalLeads, batch: 0, totalBatches },
      cancelled: false,
    });
    setIsDeletionCancelled(false);
    isDeletionCancelledRef.current = false;

    try {
      let deletedCount = 0;
      const successfullyDeletedIds: string[] = [];
      const failedDeletions: Array<{ id: string; error: string }> = [];

      // Store leads before deletion for potential rollback
      const leadsBeforeDeletion = [...leads];
      const idsToDelete = [...pendingDeletionIds];

      // Process batches
      for (let i = 0; i < totalBatches; i++) {
        // Check if cancelled at start of batch
        if (isDeletionCancelledRef.current) {
          // Rollback: restore deleted leads
          if (successfullyDeletedIds.length > 0) {
            const leadsToRestore = leadsBeforeDeletion.filter((lead) =>
              successfullyDeletedIds.includes(lead.id),
            );
            for (const lead of leadsToRestore) {
              try {
                await apiService.createLead(lead);
              } catch (error) {
                console.error("Error restoring lead:", error);
              }
            }
          }

          // Restore frontend state
          setLeads(leadsBeforeDeletion);
          setFilteredLeads(leadsBeforeDeletion);
          setDeleteNotification({
            show: false,
            progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
            cancelled: false,
          });
          pushToast(t("notifications.deletionCancelled"), "success");
          return;
        }

        const startIndex = i * batchSize;
        const endIndex = Math.min(startIndex + batchSize, totalLeads);
        const batchIds = idsToDelete.slice(startIndex, endIndex);

        // Update progress
        setDeleteNotification((prev) => ({
          ...prev,
          progress: {
            current: startIndex,
            total: totalLeads,
            batch: i + 1,
            totalBatches,
          },
        }));

        // Delete leads in controlled parallel chunks
        const batchSuccessIds: string[] = [];
        for (let j = 0; j < batchIds.length; j += parallelLimit) {
          // Check cancellation during chunk processing
          if (isDeletionCancelledRef.current) {
            // Rollback all successfully deleted leads so far
            const allDeletedIds = [
              ...successfullyDeletedIds,
              ...batchSuccessIds,
            ];
            if (allDeletedIds.length > 0) {
              const leadsToRestore = leadsBeforeDeletion.filter((lead) =>
                allDeletedIds.includes(lead.id),
              );
              for (const lead of leadsToRestore) {
                try {
                  await apiService.createLead(lead);
                } catch (error) {
                  console.error("Error restoring lead:", error);
                }
              }
            }

            // Restore frontend state
            setLeads(leadsBeforeDeletion);
            setFilteredLeads(leadsBeforeDeletion);
            setDeleteNotification({
              show: false,
              progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
              cancelled: false,
            });
            pushToast(t("notifications.deletionCancelled"), "success");
            return;
          }

          const chunk = batchIds.slice(j, j + parallelLimit);
          const leadIndex = startIndex + j;

          // Update progress
          setDeleteNotification((prev) => ({
            ...prev,
            progress: {
              current: leadIndex,
              total: totalLeads,
              batch: i + 1,
              totalBatches,
            },
          }));

          // Process chunk in parallel
          const chunkPromises = chunk.map((id) => deleteLeadWithRetry(id, 5));
          const chunkResults = await Promise.all(chunkPromises);

          // Collect results
          chunkResults.forEach((result) => {
            if (result.success) {
              deletedCount++;
              batchSuccessIds.push(result.id);
            } else {
              failedDeletions.push({
                id: result.id,
                error: result.error || t("notifications.unknownError"),
              });
            }
          });

          // No delay between parallel chunks for maximum speed
        }

        // Update UI progressively after each batch
        successfullyDeletedIds.push(...batchSuccessIds);
        if (batchSuccessIds.length > 0) {
          setLeads((prev) =>
            prev.filter((lead) => !batchSuccessIds.includes(lead.id)),
          );
          setFilteredLeads((prev) =>
            prev.filter((lead) => !batchSuccessIds.includes(lead.id)),
          );
        }
      }

      // Check for cancellation before retry phase
      if (isDeletionCancelledRef.current) {
        // Rollback all successfully deleted leads
        if (successfullyDeletedIds.length > 0) {
          const leadsToRestore = leadsBeforeDeletion.filter((lead) =>
            successfullyDeletedIds.includes(lead.id),
          );
          for (const lead of leadsToRestore) {
            try {
              await apiService.createLead(lead);
            } catch (error) {
              console.error("Error restoring lead:", error);
            }
          }
        }

        // Restore frontend state
        setLeads(leadsBeforeDeletion);
        setFilteredLeads(leadsBeforeDeletion);
        setDeleteNotification({
          show: false,
          progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
          cancelled: false,
        });
        pushToast("Deletion cancelled and leads restored", "success");
        return;
      }

      // Retry failed deletions one more time if any failed
      if (failedDeletions.length > 0 && !isDeletionCancelledRef.current) {
        pushToast(
          t("notifications.retryingDeletions", {
            count: failedDeletions.length,
          }),
          "warning",
        );

        const retryIds = failedDeletions.map((f) => f.id);
        const retriedSuccessIds: string[] = [];

        // Process retries in parallel chunks
        for (let k = 0; k < retryIds.length; k += parallelLimit) {
          if (isDeletionCancelledRef.current) {
            // Rollback all successfully deleted leads
            const allDeletedIds = [
              ...successfullyDeletedIds,
              ...retriedSuccessIds,
            ];
            if (allDeletedIds.length > 0) {
              const leadsToRestore = leadsBeforeDeletion.filter((lead) =>
                allDeletedIds.includes(lead.id),
              );
              for (const lead of leadsToRestore) {
                try {
                  await apiService.createLead(lead);
                } catch (error) {
                  console.error("Error restoring lead:", error);
                }
              }
            }

            // Restore frontend state
            setLeads(leadsBeforeDeletion);
            setFilteredLeads(leadsBeforeDeletion);
            setDeleteNotification({
              show: false,
              progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
              cancelled: false,
            });
            pushToast(t("notifications.deletionCancelled"), "success");
            return;
          }

          const retryChunk = retryIds.slice(k, k + parallelLimit);
          const retryPromises = retryChunk.map((id) =>
            deleteLeadWithRetry(id, 5),
          );
          const retryResults = await Promise.all(retryPromises);

          // Collect successful retries and remaining failures
          const stillFailedIds: string[] = [];
          retryResults.forEach((result) => {
            if (result.success) {
              deletedCount++;
              retriedSuccessIds.push(result.id);
            } else {
              stillFailedIds.push(result.id);
            }
          });

          // No delay between retry chunks for maximum speed
        }

        // Update UI for successful retries
        if (retriedSuccessIds.length > 0) {
          setLeads((prev) =>
            prev.filter((lead) => !retriedSuccessIds.includes(lead.id)),
          );
          setFilteredLeads((prev) =>
            prev.filter((lead) => !retriedSuccessIds.includes(lead.id)),
          );
        }

        // Third retry phase for remaining failures (with more aggressive retries)
        const stillFailed = failedDeletions.filter(
          (f) => !retriedSuccessIds.includes(f.id),
        );
        if (stillFailed.length > 0 && !isDeletionCancelledRef.current) {
          pushToast(
            t("notifications.finalRetryDeletions", {
              count: stillFailed.length,
            }),
            "warning",
          );

          const finalRetryIds = stillFailed.map((f) => f.id);
          const finalSuccessIds: string[] = [];

          // Process with smaller chunks for better reliability
          const smallerChunkSize = 20;
          for (let m = 0; m < finalRetryIds.length; m += smallerChunkSize) {
            if (isDeletionCancelledRef.current) break;

            const finalChunk = finalRetryIds.slice(m, m + smallerChunkSize);
            const finalPromises = finalChunk.map((id) =>
              deleteLeadWithRetry(id, 6),
            );
            const finalResults = await Promise.all(finalPromises);

            finalResults.forEach((result) => {
              if (result.success) {
                deletedCount++;
                finalSuccessIds.push(result.id);
              }
            });

            // Small delay between final retry chunks for stability
            if (m + smallerChunkSize < finalRetryIds.length) {
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
          }

          // Update UI for final successful retries
          if (finalSuccessIds.length > 0) {
            setLeads((prev) =>
              prev.filter((lead) => !finalSuccessIds.includes(lead.id)),
            );
            setFilteredLeads((prev) =>
              prev.filter((lead) => !finalSuccessIds.includes(lead.id)),
            );
          }

          const absoluteFinalErrors =
            stillFailed.length - finalSuccessIds.length;
          if (absoluteFinalErrors > 0) {
            pushToast(
              t("notifications.leadsDeletedAfterRetries", {
                count: deletedCount,
                failed: absoluteFinalErrors,
              }),
              "warning",
            );
          } else {
            pushToast(
              t("notifications.leadsDeleted", { count: deletedCount }),
              "success",
            );
          }
        } else {
          const finalErrors = failedDeletions.length - retriedSuccessIds.length;
          if (finalErrors > 0) {
            pushToast(
              t("notifications.leadsDeletedAfterRetry", {
                count: deletedCount,
                failed: finalErrors,
              }),
              "warning",
            );
          } else {
            pushToast(
              t("notifications.leadsDeleted", { count: deletedCount }),
              "success",
            );
          }
        }
      } else {
        // Show success message
        if (failedDeletions.length > 0) {
          pushToast(
            t("notifications.leadsDeletedPartial", {
              count: deletedCount,
              failed: failedDeletions.length,
            }),
            "warning",
          );
        } else {
          pushToast(
            t("notifications.leadsDeleted", { count: deletedCount }),
            "success",
          );
        }
      }

      // Atualizar o total de leads imediatamente após deleção bem-sucedida
      if (deletedCount > 0) {
        setTotalLeads((prev) => Math.max(0, prev - deletedCount));
      }

      // Clear selections
      setSelectedLeads(new Set());

      // Sync after operation
      await syncAfterOperation();
    } catch (error) {
      console.error("Error deleting leads:", error);
      pushToast(
        t("notifications.errorDeletingLeads") ||
          t("notifications.errorDeleting"),
        "error",
      );
    } finally {
      setDeleteNotification({
        show: false,
        progress: { current: 0, total: 0, batch: 0, totalBatches: 0 },
        cancelled: false,
      });
      setPendingDeletionIds([]);
      setConfirmInput("");
      setIsDeletionCancelled(false);
      isDeletionCancelledRef.current = false;
    }
  }
  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />

        <SidebarInset ref={sidebarInsetRef}>
          {/* HEADER */}

          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-2 sm:px-4">
            <SidebarTrigger className="-ml-1" />

            <Separator
              orientation="vertical"
              className="mr-1 sm:mr-2 data-[orientation=vertical]:h-4"
            />

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${org}/dashboard`}>
                    {t("breadcrumbHome")}
                  </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator className="hidden md:block" />

                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm sm:text-base">
                    {t("breadcrumbLeads")}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* NOTIFICATIONS STACK */}

          {toasts.length > 0 && (
            <div className="fixed top-4 right-2 sm:right-4 z-50 flex flex-col gap-2 w-[calc(100vw-1rem)] sm:max-w-sm">
              {toasts.map((toast) => {
                const styles =
                  toast.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : toast.type === "error"
                      ? "bg-red-50 border border-red-200 text-red-800"
                      : "bg-yellow-50 border border-yellow-200 text-yellow-800";

                const closeColor =
                  toast.type === "success"
                    ? "text-green-600 hover:text-green-800"
                    : toast.type === "error"
                      ? "text-red-600 hover:text-red-800"
                      : "text-yellow-600 hover:text-yellow-800";

                return (
                  <div
                    key={toast.id}
                    className={`${styles} px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {toast.type === "success" && (
                          <CheckCircle2 className="h-4 w-4" />
                        )}

                        {toast.type === "warning" && (
                          <AlertTriangle className="h-4 w-4" />
                        )}

                        {toast.type === "error" && (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </div>

                      <div className="flex-1 text-sm leading-5">
                        {toast.text}
                      </div>

                      <button
                        onClick={() =>
                          setToasts((prev) =>
                            prev.filter((x) => x.id !== toast.id),
                          )
                        }
                        className={`${closeColor} ml-2`}
                        aria-label={t("notifications.dismissNotification")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* IMPORT PROGRESS NOTIFICATION */}
          {importNotification.show && (
            <div className="fixed top-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 w-80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span className="font-medium">
                    {isImportCancelled
                      ? t("notifications.cancellingImport")
                      : t("notifications.importingLeads")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    setIsImportCancelled(true);
                    isImportCancelledRef.current = true;
                    setImportCancelled(true);
                    setIsImporting(false);

                    // Rollback: remove all imported leads from backend and frontend
                    if (currentImportLeads.length > 0) {
                      let successfullyDeleted = 0;
                      let errors = 0;

                      try {
                        // Delete imported leads from backend with error handling
                        for (const lead of currentImportLeads) {
                          try {
                            const response = await apiService.deleteLead(
                              lead.id,
                            );
                            if (response.success) {
                              successfullyDeleted++;
                            } else {
                              errors++;
                              console.log(
                                `Lead ${lead.id} not found or already deleted:`,
                                response.error,
                              );
                            }
                          } catch (error) {
                            errors++;
                            console.log(
                              `Error deleting lead ${lead.id}:`,
                              error,
                            );
                          }
                        }

                        if (successfullyDeleted > 0) {
                          pushToast(
                            t("notifications.importCancelledLeadsRemoved", {
                              count: successfullyDeleted,
                            }) || t("notifications.importCancelled"),
                            "success",
                          );
                        }
                        if (errors > 0) {
                          pushToast(
                            t("notifications.importCancelledLeadsNotFound", {
                              count: errors,
                            }) || t("notifications.importCancelled"),
                            "warning",
                          );
                        }
                      } catch (error) {
                        console.error("Error during rollback:", error);
                        pushToast(
                          t("notifications.importCancelledLocalOnly"),
                          "warning",
                        );
                      }

                      // Remove from frontend state regardless of backend success
                      const importedIds = currentImportLeads.map(
                        (lead) => lead.id,
                      );
                      const importedCount = currentImportLeads.length;
                      setLeads((prev) =>
                        prev.filter((lead) => !importedIds.includes(lead.id)),
                      );
                      setFilteredLeads((prev) =>
                        prev.filter((lead) => !importedIds.includes(lead.id)),
                      );
                      setImportedLeads((prev) =>
                        prev.filter((lead) => !importedIds.includes(lead.id)),
                      );
                      setCurrentImportLeads([]);
                      // Atualizar o total de leads após cancelar importação
                      if (importedCount > 0) {
                        setTotalLeads((prev) =>
                          Math.max(0, prev - importedCount),
                        );
                      }
                    }

                    // Reset file input to allow reimporting the same file
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }

                    // Reset file preview state
                    setFilePreview(null);
                    setShowPreview(false);
                    setIsProcessingFile(false);

                    setImportNotification({
                      show: false,
                      progress: {
                        current: 0,
                        total: 0,
                        batch: 0,
                        totalBatches: 0,
                      },
                      cancelled: true,
                    });
                  }}
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  {t("notifications.cancel")}
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {t("notifications.batchOf", {
                      batch: importNotification.progress.batch,
                      total: importNotification.progress.totalBatches,
                    })}
                  </span>
                  <span>
                    {importNotification.progress.current} /{" "}
                    {importNotification.progress.total}
                  </span>
                </div>

                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(importNotification.progress.current / importNotification.progress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* BULK EDIT PROGRESS NOTIFICATION */}
          {editNotification.show && (
            <div className="fixed top-4 right-4 z-[100] bg-background border rounded-lg shadow-lg p-4 w-80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="font-medium">
                    {isEditCancelled
                      ? t("notifications.cancellingEdit")
                      : t("notifications.updatingLeads")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    setIsEditCancelled(true);
                    isEditCancelledRef.current = true;

                    // Rollback: restore original leads in backend
                    if (currentEditLeads.length > 0) {
                      let successfullyRestored = 0;
                      let errors = 0;

                      try {
                        // Restore leads that were already edited in this batch
                        for (const editedLead of currentEditLeads) {
                          try {
                            // Find the original lead to get the original values
                            const originalLead = originalLeads.find(
                              (orig) => orig.id === editedLead.id,
                            );
                            if (originalLead) {
                              const updateData: any = {
                                id: editedLead.id,
                                status: originalLead.status,
                                source: originalLead.source,
                              };
                              const result =
                                await apiService.updateLead(updateData);
                              if (result.success) {
                                successfullyRestored++;
                              } else {
                                errors++;
                              }
                            }
                          } catch (error) {
                            errors++;
                          }
                        }

                        if (successfullyRestored > 0) {
                          pushToast(
                            t("notifications.bulkEditCancelledRestored", {
                              count: successfullyRestored,
                            }),
                            "success",
                          );
                        }
                        if (errors > 0) {
                          pushToast(
                            t("notifications.bulkEditCancelledRestoreFailed", {
                              count: errors,
                            }),
                            "warning",
                          );
                        }
                      } catch (error) {
                        pushToast(
                          t("notifications.bulkEditCancelledLocalOnly"),
                          "warning",
                        );
                      }

                      // Restore frontend state regardless of backend success
                      const editedIds = currentEditLeads.map((lead) => lead.id);
                      setLeads((prev) =>
                        prev.map((l) => {
                          if (!editedIds.includes(l.id)) return l;

                          const originalLead = originalLeads.find(
                            (orig) => orig.id === l.id,
                          );
                          if (originalLead) {
                            return originalLead;
                          }
                          return l;
                        }),
                      );

                      setFilteredLeads((prev) =>
                        prev.map((l) => {
                          if (!editedIds.includes(l.id)) return l;

                          const originalLead = originalLeads.find(
                            (orig) => orig.id === l.id,
                          );
                          if (originalLead) {
                            return originalLead;
                          }
                          return l;
                        }),
                      );

                      setOriginalLeads([]);
                      setCurrentEditLeads([]);
                    }

                    setEditNotification({
                      show: false,
                      progress: {
                        current: 0,
                        total: 0,
                        batch: 0,
                        totalBatches: 0,
                      },
                      cancelled: true,
                    });

                    // Force refresh leads to ensure sync with backend after rollback
                    setTimeout(async () => {
                      await forceRefreshLeads();
                    }, 100);
                  }}
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  {t("notifications.cancel")}
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {t("notifications.batchOf", {
                      batch: editNotification.progress.batch,
                      total: editNotification.progress.totalBatches,
                    })}
                  </span>
                  <span>
                    {editNotification.progress.current} /{" "}
                    {editNotification.progress.total}
                  </span>
                </div>

                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(editNotification.progress.current / editNotification.progress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* BULK ASSIGN PROGRESS NOTIFICATION */}
          {assignNotification.show && (
            <div className="fixed top-4 right-4 z-[100] bg-background border rounded-lg shadow-lg p-4 w-80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="font-medium">
                    {t("notifications.assigningLeads")}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {t("notifications.batchOf", {
                      batch: assignNotification.progress.batch,
                      total: assignNotification.progress.totalBatches,
                    })}
                  </span>
                  <span>
                    {assignNotification.progress.current} /{" "}
                    {assignNotification.progress.total}
                  </span>
                </div>

                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(assignNotification.progress.current / assignNotification.progress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* DELETE PROGRESS NOTIFICATION */}
          {deleteNotification.show && (
            <div className="fixed top-4 right-4 z-[100] bg-background border rounded-lg shadow-lg p-4 w-80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  <span className="font-medium">
                    {isDeletionCancelled
                      ? t("notifications.cancellingDeletion")
                      : t("notifications.deletingLeads")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    setIsDeletionCancelled(true);
                    isDeletionCancelledRef.current = true;

                    // Rollback: restore deleted leads in backend
                    if (deletedLeads.length > 0) {
                      let successfullyRestored = 0;
                      let errors = 0;

                      try {
                        // Restore leads that were already deleted in this batch
                        for (const lead of deletedLeads) {
                          try {
                            const createData: CreateLeadRequest = {
                              name: lead.name,
                              email: lead.email,
                              phone: lead.phone || undefined,
                              ssn: lead.ssn || undefined,
                              ein: lead.ein || undefined,
                              source: lead.source || undefined,
                              location: lead.location || undefined,
                              interest: lead.interest || undefined,
                              status: lead.status,
                              value: lead.value,
                              description: lead.description,
                              estimated_close_date: lead.estimated_close_date,
                            };
                            const result =
                              await apiService.createLead(createData);
                            if (result.success) {
                              successfullyRestored++;
                            } else {
                              errors++;
                            }
                          } catch (error) {
                            errors++;
                          }
                        }

                        if (successfullyRestored > 0) {
                          pushToast(
                            t("notifications.deletionCancelledRestored", {
                              count: successfullyRestored,
                            }),
                            "success",
                          );
                        }
                        if (errors > 0) {
                          pushToast(
                            t("notifications.deletionCancelledRestoreFailed", {
                              count: errors,
                            }),
                            "warning",
                          );
                        }
                      } catch (error) {
                        pushToast(
                          t("notifications.deletionCancelledLocalOnly"),
                          "warning",
                        );
                      }

                      // Restore frontend state regardless of backend success
                      setLeads((prev) => [...deletedLeads, ...prev]);
                      setFilteredLeads((prev) => [...deletedLeads, ...prev]);
                      setDeletedLeads([]);
                    }

                    setDeleteNotification({
                      show: false,
                      progress: {
                        current: 0,
                        total: 0,
                        batch: 0,
                        totalBatches: 0,
                      },
                      cancelled: true,
                    });

                    // Force refresh leads to ensure sync with backend after rollback
                    setTimeout(async () => {
                      await forceRefreshLeads();
                    }, 100);
                  }}
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  {t("notifications.cancel")}
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {t("notifications.batchOf", {
                      batch: deleteNotification.progress.batch,
                      total: deleteNotification.progress.totalBatches,
                    })}
                  </span>
                  <span>
                    {deleteNotification.progress.current} /{" "}
                    {deleteNotification.progress.total}
                  </span>
                </div>

                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(deleteNotification.progress.current / deleteNotification.progress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* MAIN */}
          <div
            data-main-container
            className="flex flex-1 flex-col gap-2 sm:gap-4 p-2 sm:p-4 pt-0"
          >
            {/* CONTROLS */}
            <div className="flex flex-col gap-2 sm:gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search and Filters */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="relative flex-1 sm:flex-none min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("search.placeholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>

                <Button
                  onClick={() => setIsFilterOpen(true)}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer shrink-0"
                >
                  <Filter className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {t("filters.filters")}
                  </span>
                  <span className="sm:hidden">Filtros</span>
                  {(searchTerm ||
                    Object.values(filters).some((f) => f !== "") ||
                    valueRange.min ||
                    valueRange.max ||
                    dateRange.min ||
                    dateRange.max) && (
                    <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                      {
                        [
                          searchTerm,
                          ...Object.values(filters),
                          valueRange.min,
                          valueRange.max,
                          dateRange.min,
                          dateRange.max,
                        ].filter((f) => f && f !== "").length
                      }
                    </span>
                  )}
                </Button>

                {(searchTerm ||
                  Object.values(filters).some((f) => f !== "") ||
                  valueRange.min ||
                  valueRange.max ||
                  dateRange.min ||
                  dateRange.max) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="cursor-pointer text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}

                {/* Column Visibility Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer shrink-0"
                    >
                      <Columns className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">
                        {t("filters.columns")}
                      </span>
                      <ChevronDown className="ml-0 sm:ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-1">
                    {columnOrder
                      .filter((columnId) => columnLabels[columnId])
                      .map((columnId) => (
                        <SortableColumnItem
                          key={columnId}
                          id={columnId}
                          label={columnLabels[columnId]}
                          visible={visibleColumns[columnId]}
                          onToggle={() => toggleColumn(columnId)}
                          onDragStart={handleColumnDragStart}
                          onDragOver={handleColumnDragOver}
                          onDragLeave={handleColumnDragLeave}
                          onDrop={handleColumnDrop}
                          isDragging={draggedColumn === columnId}
                          isDraggedOver={dragOverColumn === columnId}
                        />
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="cursor-pointer w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-1 sm:mr-2" />

                      <span className="hidden sm:inline">
                        {t("actions.addLead")}
                      </span>
                      <span className="sm:hidden">Adicionar</span>

                      <ChevronDown className="ml-auto sm:ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={startAddNew}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />

                      {t("actions.addManually")}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setIsImportOpen(true)}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />

                      {t("actions.import")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* hidden input moved to Import modal */}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="cursor-pointer w-full sm:w-auto"
                    >
                      <Upload className="h-4 w-4 mr-1 sm:mr-2" />

                      <span className="hidden sm:inline">
                        {selectedLeads.size > 0
                          ? t("actions.exportSelected")
                          : t("actions.export")}
                      </span>
                      <span className="sm:hidden">Exportar</span>

                      <ChevronDown className="ml-auto sm:ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => exportData("xlsx")}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />

                      {t("actions.exportAsXLSX")}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => exportData("csv")}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />

                      {t("actions.exportAsCSV")}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => exportData("ods")}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />

                      {t("actions.exportAsODS")}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => exportData("json")}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />

                      {t("actions.exportAsJSON")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {selectedLeads.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="cursor-pointer w-full sm:w-auto"
                      >
                        <Edit className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">
                          {t("actions.actionsWithCount", {
                            count: selectedLeads.size,
                          })}
                        </span>
                        <span className="sm:hidden">
                          {selectedLeads.size} selecionados
                        </span>
                        <ChevronDown className="ml-auto sm:ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        onClick={openBulkEdit}
                        className="cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {t("actions.editSelected")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={openBulkAssign}
                        className="cursor-pointer"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t("actions.assignToUser")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openPipelineModal("add")}
                        className="cursor-pointer"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {t("actions.addToPipeline")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openPipelineModal("remove")}
                        className="cursor-pointer"
                      >
                        <X className="h-4 w-4 mr-2" />
                        {t("actions.removeFromPipeline")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDeleteSelected}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t("actions.deleteSelected")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* LEADS TABLE */}

            <div className="bg-muted/50 rounded-xl p-2 sm:p-4 flex-1 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 sm:gap-4">
                  <h2 className="text-base sm:text-lg font-semibold">
                    {t("table.leadList")}
                  </h2>

                  {selectedLeads.size > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLeads(new Set())}
                      className="cursor-pointer text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                      {t("table.unselectAll")}
                    </Button>
                  )}
                  {/* TOP PAGINATION - Show when scrolling */}
                  {totalPages > 1 && showTopPagination && (
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="cursor-pointer text-xs sm:text-sm"
                      >
                        <span className="hidden sm:inline">
                          {t("table.first")}
                        </span>
                        <span className="sm:hidden">1ª</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="cursor-pointer text-xs sm:text-sm"
                      >
                        {t("table.previous")}
                      </Button>

                      <div className="flex items-center gap-2 px-1 sm:px-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {t("table.pageOf", {
                            current: currentPage,
                            total: totalPages,
                          })}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="cursor-pointer text-xs sm:text-sm"
                      >
                        {t("table.next")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="cursor-pointer text-xs sm:text-sm"
                      >
                        <span className="hidden sm:inline">
                          {t("table.last")}
                        </span>
                        <span className="sm:hidden">Últ.</span>
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {selectedLeads.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                        {selectedLeads.size} {t("table.selected")}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLeads(new Set())}
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {t("table.clear")}
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {t("table.itemsRange", {
                      start: startIndex + 1,
                      end: Math.min(endIndex, totalItems),
                      total: totalItems,
                    })}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                      >
                        {t("table.perPage", { count: itemsPerPage })}
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem
                        onClick={() => setItemsPerPage(10)}
                        className="cursor-pointer"
                      >
                        {t("table.perPage", { count: 10 })}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setItemsPerPage(20)}
                        className="cursor-pointer"
                      >
                        {t("table.perPage", { count: 20 })}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setItemsPerPage(50)}
                        className="cursor-pointer"
                      >
                        {t("table.perPage", { count: 50 })}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setItemsPerPage(100)}
                        className="cursor-pointer"
                      >
                        {t("table.perPage", { count: 100 })}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div
                ref={tableContainerRef}
                className="overflow-x-auto border rounded-lg -mx-2 sm:mx-0"
                style={{ scrollBehavior: "auto" }}
              >
                <table className="w-full text-xs sm:text-sm border-collapse table-fixed min-w-[800px]">
                  <thead>
                    <tr className="text-left border-b-2 border-border bg-muted/60">
                      <th className="py-2.5 px-1 sm:px-2 w-10 border-r border-border/40">
                        {leads?.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="cursor-pointer p-1 h-6 w-6"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                              <DropdownMenuItem
                                onClick={handleToggleSelectAll}
                                className="cursor-pointer"
                              >
                                {selectedLeads.size === leads.length &&
                                leads.length > 0
                                  ? t("table.unselectAllCount", {
                                      count: leads.length,
                                    })
                                  : t("table.selectAll", {
                                      count: leads.length,
                                    })}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={handleToggleSelectPage}
                                className="cursor-pointer"
                              >
                                {(() => {
                                  const currentPageLeadIds = new Set(
                                    currentLeads.map((lead) => lead?.id),
                                  );
                                  const allCurrentPageSelected =
                                    currentPageLeadIds.size > 0 &&
                                    Array.from(currentPageLeadIds).every((id) =>
                                      selectedLeads.has(id),
                                    );
                                  return allCurrentPageSelected
                                    ? t("table.unselectPage")
                                    : t("table.selectPage");
                                })()}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </th>

                      {columnOrder
                        .filter((columnId) => columnLabels[columnId])
                        .map((columnId) => renderColumnHeader(columnId))}

                      <th className="py-2.5 px-1 sm:px-2 text-center min-w-[100px] sm:min-w-[110px] w-[100px] sm:w-[120px] font-semibold text-xs">
                        {t("columns.actions")}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentLeads?.map((lead, index) => {
                      const hasSpecialStatus =
                        lead.show_on_pipeline || lead.assigned_user_id;
                      const borderColorClass = lead.show_on_pipeline
                        ? "border-l-2 border-l-green-500"
                        : lead.assigned_user_id
                          ? "border-l-2 border-l-blue-500"
                          : "";

                      return (
                        <tr
                          key={lead.id}
                          className={`border-b last:border-b-0 transition-colors ${index % 2 === 0 ? "bg-background hover:bg-muted/30" : "bg-muted/20 hover:bg-muted/40"} ${borderColorClass}`}
                        >
                          <td className="py-2.5 px-1 sm:px-2 border-r border-border/30">
                            <input
                              type="checkbox"
                              checked={selectedLeads.has(lead.id)}
                              onClick={(e) =>
                                handleSelectLead(lead.id, index, e)
                              }
                              readOnly
                              className="rounded border-input cursor-pointer"
                            />
                          </td>

                          {columnOrder
                            .filter((columnId) => columnLabels[columnId])
                            .map((columnId) =>
                              renderColumnCell(columnId, lead),
                            )}

                          <td className="py-2.5 px-1 sm:px-2">
                            <div className="flex justify-end gap-0.5 sm:gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(lead)}
                                className="cursor-pointer h-6 w-6 sm:h-7 sm:w-7 p-0"
                                title={t("notifications.editLead")}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickAssign(lead.id)}
                                className="cursor-pointer h-6 w-6 sm:h-7 sm:w-7 p-0"
                                title={t("notifications.assignToUser")}
                              >
                                <UserPlus className="h-3 w-3" />
                              </Button>

                              {lead.show_on_pipeline ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleTogglePipeline(
                                      lead.id,
                                      lead.show_on_pipeline,
                                    )
                                  }
                                  className="cursor-pointer h-6 w-6 sm:h-7 sm:w-7 p-0 border-orange-300 hover:bg-orange-50"
                                  title={t("notifications.removeFromPipeline")}
                                >
                                  <X className="h-3 w-3 text-orange-600" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleTogglePipeline(
                                      lead.id,
                                      lead.show_on_pipeline,
                                    )
                                  }
                                  className="cursor-pointer h-6 w-6 sm:h-7 sm:w-7 p-0 border-green-300 hover:bg-green-50"
                                  title={t("notifications.addToPipeline")}
                                >
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(lead.id)}
                                className="cursor-pointer h-6 w-6 sm:h-7 sm:w-7 p-0"
                                title={t("notifications.deleteLead")}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {currentLeads?.length === 0 && (
                      <tr>
                        <td
                          colSpan={
                            Object.values(visibleColumns).filter(Boolean)
                              .length + 2
                          }
                          className="py-6 px-4 text-center text-xs sm:text-sm text-muted-foreground"
                        >
                          {searchTerm
                            ? "No leads found for this search."
                            : "No leads yet. Add the first one above."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls - Always Fixed Footer */}
              {totalPages > 1 &&
                footerLeft !== null &&
                footerWidth !== null && (
                  <>
                    {/* Placeholder to maintain space in document flow when footer is fixed */}
                    <div
                      ref={footerPlaceholderRef}
                      className="pointer-events-none invisible"
                      style={{
                        height: "80px",
                        marginTop: "1rem",
                        paddingTop: "1rem",
                        paddingBottom: "1rem",
                      }}
                      aria-hidden="true"
                    />
                    <div
                      ref={footerRef}
                      data-pagination-footer
                      className="fixed bottom-0 z-[50] flex items-center justify-center pt-2 pb-2 sm:pt-4 sm:pb-4 border-t bg-background/95"
                      style={{
                        left: `${footerLeft}px`,
                        width: footerWidth,
                        right: "auto",
                        maxWidth: footerWidth,
                        paddingLeft: "0.5rem",
                        paddingRight: "0.5rem",

                        // Vidro - apenas em desktop
                        background: isMobile
                          ? "rgba(255, 255, 255, 0.95)"
                          : "rgba(255, 255, 255, 0)",
                        backdropFilter: isMobile
                          ? "none"
                          : "blur(6px) contrast(1.1) saturate(1.3)",
                        WebkitBackdropFilter: isMobile
                          ? "none"
                          : "blur(14px) contrast(1.1) saturate(1.3)",

                        // Borda e sombra
                        borderColor: isMobile
                          ? "rgba(0, 0, 0, 0.1)"
                          : "rgba(255, 255, 255, 0.3)",
                        boxShadow: isMobile
                          ? "0 -2px 10px rgba(0, 0, 0, 0.1)"
                          : "0 -6px 30px rgba(0, 0, 0, 0.18)",

                        // Suaviza o efeito
                        transition:
                          "background 0.2s ease, backdrop-filter 0.2s ease",
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="cursor-pointer text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                        >
                          <span className="hidden sm:inline">
                            {t("table.first")}
                          </span>
                          <span className="sm:hidden">1ª</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="cursor-pointer text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                        >
                          {t("table.previous")}
                        </Button>

                        <div className="flex items-center gap-2 px-1 sm:px-4">
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {t("table.pageOf", {
                              current: currentPage,
                              total: totalPages,
                            })}
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="cursor-pointer text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                        >
                          {t("table.next")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="cursor-pointer text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                        >
                          <span className="hidden sm:inline">
                            {t("table.last")}
                          </span>
                          <span className="sm:hidden">Últ.</span>
                        </Button>
                      </div>
                    </div>
                  </>
                )}
            </div>
          </div>
          {/* ADD/EDIT MODAL */}
          <Sheet
            open={isModalOpen}
            onOpenChange={(open: boolean) => {
              if (!open) {
                if (unsavedChangesToast.show) {
                  // User clicked outside again after seeing the toast
                  confirmDiscardChanges();
                } else {
                  handleModalClose();
                }
              } else {
                setIsModalOpen(open);
              }
            }}
          >
            <SheetContent
              className="w-full sm:max-w-2xl border-l border-border p-4 sm:p-6 md:p-8 flex flex-col max-h-screen overflow-y-auto"
              onDragOver={handleAttachmentDragOver}
              onDragLeave={handleAttachmentDragLeave}
              onDrop={(e: React.DragEvent) =>
                editingId && handleAttachmentDrop(e, editingId)
              }
            >
              <div className="flex-shrink-0">
                <SheetHeader>
                  <SheetTitle>
                    {editingId ? t("modal.editLead") : t("modal.addLead")}
                  </SheetTitle>

                  <SheetDescription>
                    {editingId
                      ? t("modal.editDescription")
                      : t("modal.addDescription")}
                  </SheetDescription>
                </SheetHeader>

                <Separator className="my-4" />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 sm:pr-3 pb-4 sm:pb-6">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 sm:space-y-8"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("form.name")}
                      </label>

                      <Input
                        placeholder={t("form.namePlaceholder")}
                        value={name}
                        onChange={(e) =>
                          setName(e.target.value.slice(0, FIELD_MAX.name))
                        }
                        maxLength={FIELD_MAX.name}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("form.email")}
                      </label>

                      <Input
                        type="email"
                        placeholder={t("form.emailPlaceholder")}
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value.slice(0, FIELD_MAX.email))
                        }
                        maxLength={FIELD_MAX.email}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("form.phone")}
                      </label>

                      <Input
                        placeholder={t("form.phonePlaceholder")}
                        value={phone}
                        onChange={(e) =>
                          setPhone(e.target.value.slice(0, FIELD_MAX.phone))
                        }
                        maxLength={FIELD_MAX.phone}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("form.ssn")}
                      </label>

                      <Input
                        placeholder={t("form.ssnPlaceholder")}
                        value={ssn}
                        onChange={(e) =>
                          setSsn(e.target.value.slice(0, FIELD_MAX.ssn))
                        }
                        maxLength={FIELD_MAX.ssn}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("form.ein")}
                      </label>

                      <Input
                        placeholder={t("form.einPlaceholder")}
                        value={ein}
                        onChange={(e) =>
                          setEin(e.target.value.slice(0, FIELD_MAX.ssn))
                        }
                        maxLength={FIELD_MAX.ssn}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("form.location")}
                      </label>
                      <Input
                        placeholder={t("form.locationPlaceholder")}
                        value={leadLocation}
                        onChange={(e) =>
                          setLeadLocation(
                            e.target.value.slice(0, FIELD_MAX.source),
                          )
                        }
                        maxLength={FIELD_MAX.source}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("form.interest")}
                      </label>
                      <Input
                        placeholder={t("form.interestPlaceholder")}
                        value={interest}
                        onChange={(e) =>
                          setInterest(e.target.value.slice(0, FIELD_MAX.source))
                        }
                        maxLength={FIELD_MAX.source}
                      />
                    </div>

                    <div className="lg:col-span-2 space-y-2">
                      <div className="space-y-2">
                        <label className="mb-2 block text-sm font-medium leading-tight">
                          {t("form.status")}
                        </label>

                        <select
                          className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                          value={statusSelectValue}
                          onChange={(e) => {
                            const val = e.target.value;

                            if (val === "custom") {
                              setStatus(customStatus || "");
                              return;
                            }

                            // Clear custom status first
                            setCustomStatus("");

                            // Find the stage
                            const stage = pipelineStages.find(
                              (s) => s.status === val,
                            );

                            if (stage && stage.translation_key) {
                              // System stages: use legacy format
                              const statusMap: Record<string, string> = {
                                new: "New",
                                contact: "In Contact",
                                qualified: "Qualified",
                                lost: "Lost",
                              };
                              setStatus(
                                (statusMap[stage.slug] ||
                                  stage.slug) as Lead["status"],
                              );
                            } else if (stage) {
                              // Custom stages: use slug
                              setStatus(stage.slug as Lead["status"]);
                            } else {
                              // Fallback
                              setStatus(val as Lead["status"]);
                            }
                          }}
                          disabled={isLoadingStages}
                        >
                          {isLoadingStages ? (
                            <option value="">{t("form.loadingStages")}</option>
                          ) : (
                            <>
                              {pipelineStages.map((stage) => (
                                <option key={stage.id} value={stage.slug}>
                                  {stage.translation_key
                                    ? t(`statuses.${stage.slug}` as any)
                                    : stage.name}
                                </option>
                              ))}
                              <option value="custom">
                                {t("statuses.custom")}
                              </option>
                            </>
                          )}
                        </select>
                      </div>

                      {showCustomStatusField && (
                        <div className="space-y-2">
                          <label className="mb-2 block text-sm font-medium leading-tight">
                            {t("form.customStatus")}
                          </label>

                          <Input
                            placeholder={t("form.customStatusPlaceholder")}
                            value={customStatus}
                            onChange={(e) => {
                              const v = e.target.value.slice(
                                0,
                                FIELD_MAX.status,
                              );

                              setCustomStatus(v);

                              setStatus(v);
                            }}
                            maxLength={FIELD_MAX.status}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Commercial Information */}

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {t("form.commercialInformation")}
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <label className="mb-2 block text-sm font-medium leading-tight">
                          {t("form.dealValue")}
                        </label>

                        <Input
                          type="number"
                          placeholder={t("form.dealValuePlaceholder")}
                          value={value}
                          onChange={(e) => {
                            const val = e.target.value.slice(
                              0,
                              FIELD_MAX.value,
                            );

                            setValue(val);
                          }}
                          step="0.01"
                          maxLength={FIELD_MAX.value}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="mb-2 block text-sm font-medium leading-tight">
                          {t("form.estimatedCloseDateLabel")}
                        </label>

                        <Input
                          type="date"
                          value={estimatedCloseDate}
                          onChange={(e) => {
                            const value = e.target.value.slice(
                              0,
                              FIELD_MAX.date,
                            );

                            setEstimatedCloseDate(value);
                          }}
                          maxLength={FIELD_MAX.date}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("form.notesDescription")}
                      </label>

                      <textarea
                        className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-20 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        placeholder={t("form.notesPlaceholder")}
                        value={description}
                        onChange={(e) =>
                          setDescription(
                            e.target.value.slice(0, FIELD_MAX.description),
                          )
                        }
                        maxLength={FIELD_MAX.description}
                      />

                      <div className="text-xs text-muted-foreground mt-1">
                        {t("form.charactersCount", {
                          current: description.length,
                          max: FIELD_MAX.description,
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Attachments Section */}
                  {editingId && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-muted-foreground">
                            {t("form.attachments")}
                          </h3>
                          {(() => {
                            const lead = leads.find((l) => l?.id === editingId);
                            const attachments = lead?.attachments || [];
                            const pending = pendingAttachments[editingId];
                            const pendingToAdd = pending?.toAdd || [];
                            const pendingToRemove = pending?.toRemove || [];
                            const visibleAttachments = attachments.filter(
                              (att) => !pendingToRemove.includes(att.id),
                            );
                            const hasAnyAttachments =
                              visibleAttachments.length > 0 ||
                              pendingToAdd.length > 0;

                            if (hasAnyAttachments) {
                              return (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="cursor-pointer"
                                  onClick={() =>
                                    attachmentFileInputRef.current?.click()
                                  }
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  {t("form.addFiles")}
                                </Button>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        <input
                          ref={attachmentFileInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) =>
                            handleAttachmentFileSelect(e, editingId)
                          }
                        />

                        {/* Upload Zone - Conditional display */}
                        {(() => {
                          const lead = leads.find((l) => l.id === editingId);
                          const attachments = lead?.attachments || [];
                          const pending = pendingAttachments[editingId];
                          const pendingToAdd = pending?.toAdd || [];
                          const pendingToRemove = pending?.toRemove || [];
                          const visibleAttachments = attachments.filter(
                            (att) => !pendingToRemove.includes(att.id),
                          );
                          const hasAnyAttachments =
                            visibleAttachments.length > 0 ||
                            pendingToAdd.length > 0;

                          if (!hasAnyAttachments) {
                            return (
                              <div
                                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
                                  isAttachmentDragActive
                                    ? "border-primary bg-primary/5"
                                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                                }`}
                                onDragOver={handleAttachmentDragOver}
                                onDragLeave={handleAttachmentDragLeave}
                                onDrop={(e) =>
                                  handleAttachmentDrop(e, editingId)
                                }
                                onClick={() =>
                                  attachmentFileInputRef.current?.click()
                                }
                              >
                                <div className="flex flex-col items-center justify-center gap-2">
                                  {uploadingAttachments[editingId] ? (
                                    <>
                                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                      <p className="text-sm text-muted-foreground">
                                        {t("form.uploading")}
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-8 w-8 text-muted-foreground" />
                                      <div className="text-center">
                                        <p className="text-sm font-medium">
                                          {t("form.dragDropFiles")}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {t("form.clickToBrowseFiles")}
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Existing Attachments */}
                        {(() => {
                          const lead = leads.find((l) => l.id === editingId);
                          const attachments = lead?.attachments || [];
                          const pending = pendingAttachments[editingId];
                          const pendingToAdd = pending?.toAdd || [];
                          const pendingToRemove = pending?.toRemove || [];

                          // Filter out attachments that are marked for removal
                          const visibleAttachments = attachments.filter(
                            (att) => !pendingToRemove.includes(att.id),
                          );

                          if (
                            visibleAttachments.length === 0 &&
                            pendingToAdd.length === 0
                          ) {
                            return null;
                          }

                          return (
                            <div className="space-y-2">
                              {/* Existing attachments */}
                              {visibleAttachments.map((attachment) => {
                                // Add safety checks for attachment properties
                                if (
                                  !attachment ||
                                  !attachment.id ||
                                  !attachment.mimeType
                                ) {
                                  console.warn(
                                    "Invalid attachment object:",
                                    attachment,
                                  );
                                  return null;
                                }

                                const FileIcon = getFileIcon(
                                  attachment.mimeType,
                                );
                                return (
                                  <div
                                    key={attachment.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                  >
                                    <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {attachment.filename ||
                                          t("notifications.unknownFile")}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatFileSize(attachment.size || 0)}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="cursor-pointer text-destructive hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeAttachmentFromPending(
                                          editingId,
                                          attachment.id,
                                        );
                                      }}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}

                              {/* Pending files to add */}
                              {pendingToAdd.map((file, index) => (
                                <div
                                  key={`pending-${index}`}
                                  className="flex items-center gap-3 p-3 rounded-lg border bg-primary/5 border-primary/20"
                                >
                                  <File className="h-5 w-5 text-primary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate text-primary">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(file.size)}{" "}
                                      {t("form.pendingSaveToUpload")}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="cursor-pointer text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPendingAttachments((prev) => ({
                                        ...prev,
                                        [editingId]: {
                                          toAdd:
                                            prev[editingId]?.toAdd.filter(
                                              (_, i) => i !== index,
                                            ) || [],
                                          toRemove:
                                            prev[editingId]?.toRemove || [],
                                        },
                                      }));
                                    }}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 cursor-pointer">
                      {editingId ? t("modal.save") : t("actions.addLead")}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // Close toast if it's showing
                        setUnsavedChangesToast({ show: false, message: "" });
                        resetForm();
                      }}
                      className="cursor-pointer"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t("modal.cancel")}
                    </Button>
                  </div>
                </form>
              </div>
            </SheetContent>
          </Sheet>

          {/* PREVIEW MODAL - Lead details */}
          <Sheet
            open={preview.open}
            onOpenChange={(open: boolean) =>
              setPreview((p) => ({ ...p, open }))
            }
          >
            <SheetContent className="w-full sm:max-w-lg border-l border-border p-6 md:p-8 flex flex-col max-h-screen">
              <div className="flex-shrink-0">
                <SheetHeader>
                  <SheetTitle>{t("modal.leadDetails")}</SheetTitle>

                  <SheetDescription>
                    {t("modal.completeInformation")}
                  </SheetDescription>
                </SheetHeader>

                <Separator className="my-4" />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {(() => {
                  const l = preview.lead;

                  if (!l) return null;

                  return (
                    <>
                      {/* Basic Information */}

                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                          {t("preview.basicInformation")}
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-muted-foreground">
                                Name
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 cursor-pointer"
                                onClick={() => {
                                  navigator.clipboard.writeText(l.name);

                                  setCopiedKey("name");

                                  window.setTimeout(
                                    () => setCopiedKey(null),
                                    700,
                                  );
                                }}
                              >
                                {copiedKey === "name" ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>

                            <div className="text-sm font-medium">{l.name}</div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-muted-foreground">
                                Status
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 cursor-pointer"
                                onClick={() => {
                                  navigator.clipboard.writeText(l.status);

                                  setCopiedKey("status");

                                  window.setTimeout(
                                    () => setCopiedKey(null),
                                    700,
                                  );
                                }}
                              >
                                {copiedKey === "status" ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>

                            <div className="text-sm">
                              <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
                                {l.status}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-muted-foreground">
                                Email
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 cursor-pointer"
                                onClick={() => {
                                  navigator.clipboard.writeText(l.email);

                                  setCopiedKey("email");

                                  window.setTimeout(
                                    () => setCopiedKey(null),
                                    700,
                                  );
                                }}
                              >
                                {copiedKey === "email" ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>

                            <div className="text-sm">{l.email}</div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-muted-foreground">
                                Phone
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 cursor-pointer"
                                onClick={() => {
                                  navigator.clipboard.writeText(l.phone || "");

                                  setCopiedKey("phone");

                                  window.setTimeout(
                                    () => setCopiedKey(null),
                                    700,
                                  );
                                }}
                              >
                                {copiedKey === "phone" ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>

                            <div className="text-sm">{l.phone || "-"}</div>
                          </div>

                          {l.ssn && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-muted-foreground">
                                  SSN
                                </div>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0 cursor-pointer"
                                  onClick={() => {
                                    navigator.clipboard.writeText(l.ssn || "");

                                    setCopiedKey("ssn");

                                    window.setTimeout(
                                      () => setCopiedKey(null),
                                      700,
                                    );
                                  }}
                                >
                                  {copiedKey === "ssn" ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>

                              <div className="text-sm">{l.ssn}</div>
                            </div>
                          )}

                          {l.ein && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-muted-foreground">
                                  EIN
                                </div>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0 cursor-pointer"
                                  onClick={() => {
                                    navigator.clipboard.writeText(l.ein || "");

                                    setCopiedKey("ein");

                                    window.setTimeout(
                                      () => setCopiedKey(null),
                                      700,
                                    );
                                  }}
                                >
                                  {copiedKey === "ein" ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>

                              <div className="text-sm">{l.ein}</div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-muted-foreground">
                                Source
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 cursor-pointer"
                                onClick={() => {
                                  navigator.clipboard.writeText(l.source || "");

                                  setCopiedKey("source");

                                  window.setTimeout(
                                    () => setCopiedKey(null),
                                    700,
                                  );
                                }}
                              >
                                {copiedKey === "source" ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>

                            <div className="text-sm">{l.source || "-"}</div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Commercial Information */}

                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                          Commercial Information
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-muted-foreground">
                                Value
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 cursor-pointer"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    l.value
                                      ? `$${l.value.toLocaleString()}`
                                      : "",
                                  );

                                  setCopiedKey("value");

                                  window.setTimeout(
                                    () => setCopiedKey(null),
                                    700,
                                  );
                                }}
                              >
                                {copiedKey === "value" ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>

                            <div className="text-sm font-medium text-green-600">
                              {l.value ? `$${l.value.toLocaleString()}` : "-"}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-muted-foreground">
                                Estimated Close Date
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 cursor-pointer"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    l.estimated_close_date
                                      ? new Date(
                                          l.estimated_close_date,
                                        ).toLocaleDateString("en-US")
                                      : "",
                                  );

                                  setCopiedKey("closeDate");

                                  window.setTimeout(
                                    () => setCopiedKey(null),
                                    700,
                                  );
                                }}
                              >
                                {copiedKey === "closeDate" ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>

                            <div className="text-sm">
                              {l.estimated_close_date
                                ? new Date(
                                    l.estimated_close_date,
                                  ).toLocaleDateString("en-US")
                                : "-"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}

                      {l.description && (
                        <>
                          <Separator />

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-muted-foreground">
                                Notes / Observations
                              </h3>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 cursor-pointer"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    l.description || "",
                                  );

                                  setCopiedKey("description");

                                  window.setTimeout(
                                    () => setCopiedKey(null),
                                    700,
                                  );
                                }}
                              >
                                {copiedKey === "description" ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>

                            <div className="bg-muted/30 rounded-md p-3 text-sm">
                              {l.description}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Attachments Section */}
                      {l.attachments && l.attachments.length > 0 && (
                        <>
                          <Separator />
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground">
                              Attachments
                            </h3>
                            <div className="space-y-2">
                              {l.attachments
                                .filter((att) => att && att.id) // Filtra antes para evitar nulls no render
                                .map((attachment) => {
                                  const attachments =
                                    typeof l.attachments === "string"
                                      ? JSON.parse(l.attachments)
                                      : l.attachments;
                                  // Normalização para lidar com mimetype ou mimeType (Fastify vs Express)
                                  const currentMimeType =
                                    attachment.mimeType || attachment.mimeType;

                                  if (!currentMimeType) {
                                    console.warn(
                                      "Attachment missing mimeType:",
                                      attachment,
                                    );
                                    return null;
                                  }

                                  const FileIcon = getFileIcon(currentMimeType);

                                  return (
                                    <div
                                      key={attachment.id}
                                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                    >
                                      <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {attachment.filename ||
                                            attachment.originalName ||
                                            "Unknown file"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatFileSize(attachment.size || 0)}{" "}
                                          •{" "}
                                          {attachment.uploadedAt
                                            ? new Date(
                                                attachment.uploadedAt,
                                              ).toLocaleDateString(
                                                locale === "pt-BR"
                                                  ? "pt-BR"
                                                  : "en-US",
                                              )
                                            : t("notifications.unknownDate")}
                                        </p>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className=""
                                          onClick={() =>
                                            viewAttachment(l.id, attachment.id)
                                          }
                                          title={t("notifications.viewFile")}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="cursor-pointer"
                                          onClick={() =>
                                            downloadAttachment(
                                              l.id,
                                              attachment.id,
                                              attachment.filename || "file",
                                            )
                                          }
                                          title={t(
                                            "notifications.downloadFile",
                                          )}
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Activity History */}

                      <Separator />

                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                          Activity History
                        </h3>

                        <div className="text-sm text-muted-foreground">
                          Created:{" "}
                          {new Date(l.created_at).toLocaleDateString("en-US")}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          Last updated:{" "}
                          {new Date(l.updated_at).toLocaleDateString("en-US")}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex-shrink-0 pt-4 border-t">
                <div className="flex justify-end">
                  <Button
                    className="cursor-pointer"
                    onClick={() => setPreview({ open: false, lead: null })}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* FILTER MODAL */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetContent className="w-full sm:max-w-lg border-l border-border p-6 md:p-8 flex flex-col">
              <SheetHeader className="flex-shrink-0">
                <SheetTitle>{t("filters.title")}</SheetTitle>

                <SheetDescription>{t("filters.description")}</SheetDescription>
              </SheetHeader>

              <Separator className="my-4 flex-shrink-0" />

              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("filters.basicInformation")}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("filters.name")}
                      </label>
                      <Input
                        placeholder={t("filters.filterByName")}
                        value={filters.name}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("filters.email")}
                      </label>
                      <Input
                        placeholder={t("filters.filterByEmail")}
                        value={filters.email}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("filters.phone")}
                      </label>
                      <Input
                        placeholder={t("filters.filterByPhone")}
                        value={filters.phone}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("filters.documents")}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("filters.ssn")}
                      </label>
                      <Input
                        placeholder={t("filters.filterBySSN")}
                        value={filters.ssn}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            ssn: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("filters.ein")}
                      </label>
                      <Input
                        placeholder={t("filters.filterByEIN")}
                        value={filters.ein}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            ein: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Status and Pipeline */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("filters.statusAndPipeline")}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("filters.source")}
                      </label>
                      <Input
                        placeholder={t("filters.filterBySource")}
                        value={filters.source}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            source: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("filters.location")}
                      </label>
                      <Input
                        placeholder={t("filters.filterByLocation")}
                        value={filters.location}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("filters.interest")}
                      </label>
                      <Input
                        placeholder={t("filters.filterByInterest")}
                        value={filters.interest}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            interest: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("filters.status")}
                      </label>
                      <select
                        className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        value={filters.status}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                      >
                        <option value="">{t("filters.allStatuses")}</option>
                        <option value="New">New</option>
                        <option value="In Contact">In Contact</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("filters.pipeline")}
                      </label>
                      <select
                        className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        value={filters.pipeline || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            pipeline: e.target.value,
                          }))
                        }
                      >
                        <option value="">{t("filters.allLeads")}</option>
                        <option value="true">{t("filters.inPipeline")}</option>
                        <option value="false">
                          {t("filters.notInPipeline")}
                        </option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("filters.assignedUser")}
                      </label>
                      <select
                        className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] cursor-pointer"
                        value={filters.assignedUserId || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            assignedUserId: e.target.value,
                          }))
                        }
                      >
                        <option value="">{t("filters.allUsers")}</option>
                        <option value="unassigned">
                          {t("filters.unassigned")}
                        </option>
                        {organizationUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Ranges */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("filters.ranges")}
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("filters.valueRange")}
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder={t("filters.minValuePlaceholder")}
                          value={valueRange.min}
                          onChange={(e) =>
                            setValueRange((prev) => ({
                              ...prev,
                              min: e.target.value,
                            }))
                          }
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder={t("filters.maxValuePlaceholder")}
                          value={valueRange.max}
                          onChange={(e) =>
                            setValueRange((prev) => ({
                              ...prev,
                              max: e.target.value,
                            }))
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="mb-2 block text-sm font-medium leading-tight">
                        {t("filters.dateRange")}
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          placeholder={t("filters.startDate")}
                          value={dateRange.min}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (validateDate(value)) {
                              setDateRange((prev) => ({ ...prev, min: value }));
                            }
                          }}
                          className={
                            !validateDate(dateRange.min) ? "border-red-500" : ""
                          }
                        />
                        {!validateDate(dateRange.min) && dateRange.min && (
                          <p className="text-xs text-red-500 mt-1">
                            Ano deve ter exatamente 4 dígitos (1000-9999)
                          </p>
                        )}

                        <Input
                          type="date"
                          placeholder={t("filters.endDate")}
                          value={dateRange.max}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (validateDate(value)) {
                              setDateRange((prev) => ({ ...prev, max: value }));
                            }
                          }}
                          className={
                            !validateDate(dateRange.max) ? "border-red-500" : ""
                          }
                        />
                        {!validateDate(dateRange.max) && dateRange.max && (
                          <p className="text-xs text-red-500 mt-1">
                            Ano deve ter exatamente 4 dígitos (1000-9999)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Action Buttons */}
              <div className="flex-shrink-0 border-t pt-4 mt-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      applyModalFilters();
                      setIsFilterOpen(false);
                    }}
                    className="flex-1 cursor-pointer"
                  >
                    {t("filters.applyFilter")}
                  </Button>

                  <Button
                    onClick={() => {
                      clearFilters();
                      setIsFilterOpen(false);
                    }}
                    variant="outline"
                    className="flex-1 cursor-pointer"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t("filters.clearAll")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* IMPORT MODAL (Centered Overlay) */}

          {isImportOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={() => !isImporting && setIsImportOpen(false)}
              />

              <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold leading-none tracking-tight">
                    {t("import.title")}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {t("import.acceptedFormats")} <br></br>
                    {t("import.columns")}
                  </p>
                </div>

                <Separator className="my-4" />

                {isImporting ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <div className="text-sm text-muted-foreground">
                      Importing leads...
                    </div>

                    <div className="mt-2 text-xs">
                      Please wait while we save your leads to the database.
                    </div>

                    {importProgress.total > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="text-xs text-muted-foreground">
                          Batch {importProgress.batch} of{" "}
                          {importProgress.totalBatches}
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(importProgress.current / importProgress.total) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {importProgress.current} of {importProgress.total}{" "}
                          leads processed
                        </div>
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setImportCancelled(true);
                              setIsImporting(false);
                              setIsImportOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            Cancel Import
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={
                      "border-2 border-dashed rounded-lg p-8 text-center select-none " +
                      (isProcessingFile
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:bg-muted/50") +
                      (isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/30")
                    }
                    onDragOver={(e) => {
                      e.preventDefault();

                      if (!isProcessingFile) {
                        setIsDragActive(true);
                      }
                    }}
                    onDragLeave={() => setIsDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();

                      setIsDragActive(false);

                      if (isProcessingFile) return;

                      const file = e.dataTransfer.files?.[0];

                      if (!file) return;

                      const validation = validateImportFile(file);

                      if (!validation.valid) {
                        alert(validation.error);

                        return;
                      }

                      handleFileSelect(file);
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      !isProcessingFile && fileInputRef.current?.click()
                    }
                  >
                    {isProcessingFile ? (
                      <>
                        <div className="text-sm text-muted-foreground">
                          {t("import.processing")}
                        </div>
                        <div className="mt-2 text-xs">
                          {t("import.processingDescription")}
                        </div>
                        <div className="mt-4 flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-muted-foreground">
                          {t("import.dragDrop")}
                        </div>
                        <div className="mt-2 text-xs">
                          {t("import.clickToBrowse")}
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          .xlsx, .xls, .csv, .ods, .json
                        </div>
                      </>
                    )}
                  </div>
                )}

                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.ods,.json,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.oasis.opendocument.spreadsheet"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (isProcessingFile) return;

                    const file = e.target.files?.[0];

                    if (!file) return;

                    const validation = validateImportFile(file);

                    if (!validation.valid) {
                      alert(validation.error);

                      return;
                    }

                    handleFileSelect(file);
                  }}
                />

                <Separator className="my-4" />

                <div className="text-xs text-muted-foreground">
                  {t("import.autoDetect")}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsImportOpen(false)}
                    className="cursor-pointer"
                    disabled={isImporting}
                  >
                    {isImporting ? t("import.importing") : t("import.close")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* FILE PREVIEW MODAL */}
          {showPreview && filePreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={() => setShowPreview(false)}
              />
              <div className="relative z-10 w-full max-w-4xl max-h-[80vh] rounded-xl border border-border bg-background p-6 shadow-xl overflow-hidden">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold leading-none tracking-tight">
                    {t("import.filePreview")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("import.foundLeads", {
                      total: filePreview.totalLeads,
                      fields: filePreview.fields.length,
                    })}
                  </p>
                </div>
                <Separator className="my-4" />

                <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      {t("import.detectedFields")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {filePreview.fields.map(
                        (field: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-muted rounded text-xs"
                          >
                            {field}
                          </span>
                        ),
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      {t("import.sampleLeads")}
                    </h4>
                    <div className="space-y-2">
                      {filePreview.leads
                        .slice(0, 5)
                        .map((lead: Lead, index: number) => (
                          <div
                            key={index}
                            className="p-3 border rounded-lg text-sm"
                          >
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <strong>{t("import.name")}</strong>{" "}
                                {lead.name || "N/A"}
                              </div>
                              <div>
                                <strong>{t("import.email")}</strong>{" "}
                                {lead.email || "N/A"}
                              </div>
                              <div>
                                <strong>{t("import.phone")}</strong>{" "}
                                {lead.phone || "N/A"}
                              </div>
                              <div>
                                <strong>{t("import.source")}</strong>{" "}
                                {lead.source || "N/A"}
                              </div>
                              <div>
                                <strong>{t("import.status")}</strong>{" "}
                                {lead.status || "N/A"}
                              </div>
                              <div>
                                <strong>{t("import.value")}</strong>{" "}
                                {lead.value ? `$${lead.value}` : "N/A"}
                              </div>
                              <div>
                                <strong>{t("import.closeDate")}</strong>{" "}
                                {lead.estimated_close_date || "N/A"}
                              </div>
                              <div>
                                <strong>{t("import.ssn")}</strong>{" "}
                                {lead.ssn || "N/A"}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                    className="cursor-pointer"
                  >
                    {t("import.cancel")}
                  </Button>
                  <Button onClick={confirmImport} className="cursor-pointer">
                    {t("import.importLeads", { count: filePreview.totalLeads })}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* BULK EDIT MODAL */}

          <Sheet open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
            <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">
              <SheetHeader>
                <SheetTitle>{t("bulk.editSelectedLeads")}</SheetTitle>

                <SheetDescription>
                  {t("bulk.updateStatusSource", { count: selectedLeads.size })}
                </SheetDescription>
              </SheetHeader>

              <Separator className="my-4" />

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="mb-2 block text-sm font-medium">
                    {t("bulk.status")}
                  </label>

                  <select
                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    disabled={isLoadingStages}
                  >
                    <option value="">{t("bulk.keepUnchanged")}</option>

                    {isLoadingStages ? (
                      <option value="">{t("form.loadingStages")}</option>
                    ) : (
                      <>
                        {bulkEditStageOptions}
                        <option value="custom">{t("statuses.custom")}</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Custom Status Input for Bulk Edit */}
                {bulkStatus === "custom" && (
                  <div className="space-y-2">
                    <label className="mb-2 block text-sm font-medium">
                      {t("form.customStatus")}
                    </label>
                    <Input
                      placeholder={t("form.customStatusPlaceholder")}
                      value={customStatus}
                      onChange={(e) => {
                        const v = e.target.value.slice(0, FIELD_MAX.status);
                        setCustomStatus(v);
                        setBulkStatus(v);
                      }}
                      maxLength={FIELD_MAX.status}
                    />
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <label className="mb-1 block text-sm font-medium">
                    {t("bulk.confirmation")}
                  </label>
                  <Input
                    placeholder={t("bulk.confirmPlaceholder")}
                    value={bulkEditConfirm}
                    onChange={(e) => setBulkEditConfirm(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    {t("bulk.confirmEditMessage", {
                      count: selectedLeads.size,
                    })}
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    onClick={applyBulkEdit}
                    className="flex-1 cursor-pointer"
                    disabled={bulkEditConfirm.trim().toLowerCase() !== "edit"}
                  >
                    {t("bulk.saveChanges")}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsBulkEditOpen(false)}
                    className="cursor-pointer"
                  >
                    {t("bulk.cancel")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* PIPELINE MODAL */}
          <Sheet
            open={isPipelineModalOpen}
            onOpenChange={setIsPipelineModalOpen}
          >
            <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8 [&>button]:cursor-pointer">
              <SheetHeader>
                <SheetTitle>
                  {pipelineAction === "add"
                    ? t("bulk.addToPipeline")
                    : t("bulk.removeFromPipeline")}
                </SheetTitle>
                <SheetDescription>
                  {pipelineAction === "add"
                    ? t("bulk.addToPipelineDesc", { count: selectedLeads.size })
                    : t("bulk.removeFromPipelineDesc", {
                        count: selectedLeads.size,
                      })}
                </SheetDescription>
              </SheetHeader>
              <Separator className="my-4" />
              <div className="space-y-6">
                <div className="text-sm text-muted-foreground">
                  {pipelineAction === "add"
                    ? t("bulk.addToPipelineInfo")
                    : t("bulk.removeFromPipelineInfo")}
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button
                    onClick={handlePipelineBulkAction}
                    className="flex-1 cursor-pointer"
                  >
                    {pipelineAction === "add"
                      ? t("bulk.addToPipeline")
                      : t("bulk.removeFromPipeline")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsPipelineModalOpen(false)}
                    className="cursor-pointer"
                  >
                    {t("bulk.cancel")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* BULK ASSIGN MODAL */}
          <Sheet open={isBulkAssignOpen} onOpenChange={setIsBulkAssignOpen}>
            <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">
              <SheetHeader>
                <SheetTitle>{t("bulk.assignLeadsTitle")}</SheetTitle>
                <SheetDescription>
                  {t("bulk.assignDescriptionSelected", {
                    count: selectedLeads.size,
                  })}
                </SheetDescription>
              </SheetHeader>

              <Separator className="my-4" />

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="mb-1 block text-sm font-medium">
                    {t("bulk.selectUser")}
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">{t("bulk.selectUserPlaceholder")}</option>
                    {organizationUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="mb-1 block text-sm font-medium">
                    {t("bulk.confirmation")}
                  </label>
                  <Input
                    placeholder={t("bulk.confirmAssign")}
                    value={bulkAssignConfirm}
                    onChange={(e) => setBulkAssignConfirm(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    {t("bulk.assignConfirmMessage", {
                      count: selectedLeads.size,
                    })}
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    onClick={applyBulkAssign}
                    className="flex-1 cursor-pointer"
                    disabled={
                      bulkAssignConfirm.trim().toLowerCase() !== "assign" ||
                      !selectedUserId
                    }
                  >
                    {t("bulk.assignLeads")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsBulkAssignOpen(false)}
                    className="cursor-pointer"
                  >
                    {t("bulk.cancel")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          {/* QUICK ASSIGN MODAL */}
          <Sheet
            open={quickAssignLeadId !== null}
            onOpenChange={(open: boolean) =>
              !open && setQuickAssignLeadId(null)
            }
          >
            <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">
              <SheetHeader>
                <SheetTitle>{t("bulk.assignToUser")}</SheetTitle>
                <SheetDescription>
                  {t("bulk.selectUserDescription")}
                </SheetDescription>
              </SheetHeader>

              <Separator className="my-4" />

              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading users...
                  </span>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="mb-1 block text-sm font-medium">
                      Select User
                    </label>
                    <select
                      value={quickAssignUserId}
                      onChange={(e) => setQuickAssignUserId(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                    >
                      <option value="">-- Select a user --</option>
                      {organizationUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      onClick={applyQuickAssign}
                      className="flex-1 cursor-pointer"
                      disabled={!quickAssignUserId}
                    >
                      Assign Lead
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setQuickAssignLeadId(null)}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* CONFIRMATION MODAL */}

          <Sheet open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <SheetContent className="w-full sm:max-w-md border-l border-border p-6 md:p-8">
              <SheetHeader>
                <SheetTitle>{t("delete.confirmDeletion")}</SheetTitle>

                <SheetDescription>
                  {t("delete.irreversible")}{" "}
                  {pendingDeletionIds.length > 1 && (
                    <>
                      <br></br>
                      {t("delete.typeToProceed")}
                    </>
                  )}
                </SheetDescription>
              </SheetHeader>

              <Separator className="my-4" />

              <div className="space-y-6">
                <div className="text-sm bg-destructive/10 text-destructive border border-destructive/30 rounded-md p-3">
                  {pendingDeletionIds.length === 1
                    ? t("delete.aboutToRemoveOne")
                    : t("delete.aboutToRemoveMany", {
                        count: pendingDeletionIds.length,
                      })}
                </div>

                {pendingDeletionIds.length > 1 && (
                  <div className="space-y-2">
                    <label className="mb-1 block text-sm font-medium">
                      {t("delete.confirmation")}
                    </label>

                    <Input
                      placeholder={t("delete.typeToContinue")}
                      value={confirmInput}
                      onChange={(e) => setConfirmInput(e.target.value)}
                    />
                  </div>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={performDeletion}
                    disabled={!canConfirmDeletion}
                    className="cursor-pointer flex-1"
                  >
                    {t("delete.deletePermanently")}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsConfirmOpen(false)}
                    className="cursor-pointer"
                  >
                    {t("delete.cancel")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* UNSAVED CHANGES TOAST NOTIFICATION */}
          {unsavedChangesToast.show && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
              <div className="bg-yellow-50 dark:bg-yellow-900/90 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-lg px-4 py-3 max-w-sm mx-4 pointer-events-auto">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    {unsavedChangesToast.message}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Fixed Bottom Pagination - Hidden on mobile (duplicate, already have fixed footer pagination) */}
          {totalPages > 1 && !isMobile && (
            <div className="hidden md:block sticky bottom-0 bg-background/1 backdrop-blur-md border-t border-border/50 p-4 z-10">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="cursor-pointer"
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="cursor-pointer"
                    >
                      Previous
                    </Button>

                    <div className="flex items-center gap-2 px-4">
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="cursor-pointer"
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="cursor-pointer"
                    >
                      Last
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SidebarInset>
      </SidebarProvider>

      {/* LEAD DETAILS MODAL - MODERN DESIGN */}
      <Sheet
        open={preview.open}
        onOpenChange={(open: boolean) =>
          setPreview({ open, lead: open ? preview.lead : null })
        }
      >
        <SheetContent className="w-full sm:max-w-3xl border-l border-border p-0 overflow-y-auto [&>button]:cursor-pointer">
          {preview.lead && (
            <>
              <SheetTitle className="sr-only">
                {t("preview.leadDetails")}: {preview.lead.name}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {t("preview.completeLeadInformation")}
              </SheetDescription>
              {/* Header */}
              <div className="sticky top-0 z-10 bg-background border-b p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-6 w-6" />
                      <h2 className="text-2xl font-bold">
                        {preview.lead.name}
                      </h2>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {t("preview.completeLeadInformation")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 cursor-pointer"
                    onClick={() => setPreview({ open: false, lead: null })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status Badge */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium capitalize">
                      {preview.lead.status}
                    </span>
                  </div>
                  {preview.lead.value && (
                    <div className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
                      <span className="text-sm font-medium">
                        {formatCurrency(preview.lead.value)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Contact Information Card */}
                <div className="bg-muted/50 rounded-xl p-5 border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {t("preview.contactInformation")}
                  </h3>
                  <div className="grid gap-3">
                    {preview.lead.email && (
                      <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-3 flex-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">
                              {t("preview.email")}
                            </p>
                            <p className="text-sm font-medium truncate">
                              {preview.lead.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              preview.lead?.email || "",
                            );
                            setCopiedKey("email");
                            setTimeout(() => setCopiedKey(null), 2000);
                          }}
                        >
                          {copiedKey === "email" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}

                    {preview.lead.phone && (
                      <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-3 flex-1">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">
                              {t("preview.phone")}
                            </p>
                            <p className="text-sm font-medium truncate">
                              {preview.lead.phone}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              preview.lead?.phone || "",
                            );
                            setCopiedKey("phone");
                            setTimeout(() => setCopiedKey(null), 2000);
                          }}
                        >
                          {copiedKey === "phone" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Business Information Card */}
                {(preview.lead.ssn ||
                  preview.lead.ein ||
                  preview.lead.source) && (
                  <div className="bg-muted/50 rounded-xl p-5 border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      {t("preview.businessInformation")}
                    </h3>
                    <div className="grid gap-3">
                      {preview.lead.ssn && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                          <div className="flex items-center gap-3 flex-1">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">
                                {t("preview.ssn")}
                              </p>
                              <p className="text-sm font-medium font-mono">
                                {preview.lead.ssn}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                preview.lead?.ssn || "",
                              );
                              setCopiedKey("ssn");
                              setTimeout(() => setCopiedKey(null), 2000);
                            }}
                          >
                            {copiedKey === "ssn" ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}

                      {preview.lead.ein && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                          <div className="flex items-center gap-3 flex-1">
                            <FileDigit className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">
                                {t("preview.ein")}
                              </p>
                              <p className="text-sm font-medium font-mono">
                                {preview.lead.ein}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                preview.lead?.ein || "",
                              );
                              setCopiedKey("ein");
                              setTimeout(() => setCopiedKey(null), 2000);
                            }}
                          >
                            {copiedKey === "ein" ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}

                      {preview.lead.source && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                          <div className="flex items-center gap-3 flex-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">
                                {t("preview.source")}
                              </p>
                              <p className="text-sm font-medium">
                                {preview.lead.source}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                preview.lead?.source || "",
                              );
                              setCopiedKey("source");
                              setTimeout(() => setCopiedKey(null), 2000);
                            }}
                          >
                            {copiedKey === "source" ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Deal Information Card */}
                {preview.lead.estimated_close_date && (
                  <div className="bg-muted/50 rounded-xl p-5 border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {t("preview.dealTimeline")}
                    </h3>
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-3 flex-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">
                              {t("preview.estimatedCloseDate")}
                            </p>
                            <p className="text-sm font-medium">
                              {new Date(
                                preview.lead.estimated_close_date,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              new Date(
                                preview.lead?.estimated_close_date || "",
                              ).toLocaleDateString(),
                            );
                            setCopiedKey("close_date");
                            setTimeout(() => setCopiedKey(null), 2000);
                          }}
                        >
                          {copiedKey === "close_date" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assignment Card */}
                <div className="bg-muted/50 rounded-xl p-5 border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    {t("preview.assignment")}
                  </h3>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                      <div className="flex items-center gap-3 flex-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {t("preview.assignedTo")}
                          </p>
                          <p className="text-sm font-medium">
                            {preview.lead.assigned_user_id
                              ? assignedUserName || t("preview.loading")
                              : t("preview.notAssigned")}
                          </p>
                        </div>
                      </div>
                      {preview.lead.assigned_user_id && assignedUserName && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(assignedUserName);
                            setCopiedKey("assigned_user");
                            setTimeout(() => setCopiedKey(null), 2000);
                          }}
                        >
                          {copiedKey === "assigned_user" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {preview.lead.assigned_user_id && (
                      <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-3 flex-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">
                              {t("preview.assignedSince")}
                            </p>
                            <p className="text-sm font-medium">
                              {new Date(
                                preview.lead.updated_at,
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              new Date(
                                preview.lead?.updated_at || "",
                              ).toLocaleString(),
                            );
                            setCopiedKey("assigned_date");
                            setTimeout(() => setCopiedKey(null), 2000);
                          }}
                        >
                          {copiedKey === "assigned_date" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location & Interest Card */}
                {(preview.lead.location || preview.lead.interest) && (
                  <div className="bg-muted/50 rounded-xl p-5 border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {t("preview.additionalInformation")}
                    </h3>
                    <div className="grid gap-3">
                      {preview.lead.location && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                          <div className="flex items-center gap-3 flex-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">
                                {t("preview.location")}
                              </p>
                              <p className="text-sm font-medium">
                                {preview.lead.location}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                preview.lead?.location || "",
                              );
                              setCopiedKey("location");
                              setTimeout(() => setCopiedKey(null), 2000);
                            }}
                          >
                            {copiedKey === "location" ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}

                      {preview.lead.interest && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                          <div className="flex items-center gap-3 flex-1">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">
                                {t("preview.interest")}
                              </p>
                              <p className="text-sm font-medium">
                                {preview.lead.interest}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                preview.lead?.interest || "",
                              );
                              setCopiedKey("interest");
                              setTimeout(() => setCopiedKey(null), 2000);
                            }}
                          >
                            {copiedKey === "interest" ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description Card */}
                {preview.lead.description && (
                  <div className="bg-muted/50 rounded-xl p-5 border">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        {t("preview.description")}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            preview.lead?.description || "",
                          );
                          setCopiedKey("description");
                          setTimeout(() => setCopiedKey(null), 2000);
                        }}
                      >
                        {copiedKey === "description" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="bg-background rounded-lg p-4 border">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {preview.lead.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Metadata Card */}
                <div className="bg-muted/50 rounded-xl p-5 border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {t("preview.metadata")}
                  </h3>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                      <div className="flex items-center gap-3 flex-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {t("preview.created")}
                          </p>
                          <p className="text-sm font-medium">
                            {new Date(preview.lead.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            new Date(
                              preview.lead?.created_at || "",
                            ).toLocaleString(),
                          );
                          setCopiedKey("created_at");
                          setTimeout(() => setCopiedKey(null), 2000);
                        }}
                      >
                        {copiedKey === "created_at" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {preview.lead.created_by && (
                      <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-3 flex-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">
                              {t("preview.createdBy")}
                            </p>
                            <p className="text-sm font-medium">
                              {createdByUserName || t("preview.loading")}
                            </p>
                          </div>
                        </div>
                        {createdByUserName && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(createdByUserName);
                              setCopiedKey("created_by");
                              setTimeout(() => setCopiedKey(null), 2000);
                            }}
                          >
                            {copiedKey === "created_by" ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                      <div className="flex items-center gap-3 flex-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {t("preview.lastUpdated")}
                          </p>
                          <p className="text-sm font-medium">
                            {new Date(preview.lead.updated_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            new Date(
                              preview.lead?.updated_at || "",
                            ).toLocaleString(),
                          );
                          setCopiedKey("updated_at");
                          setTimeout(() => setCopiedKey(null), 2000);
                        }}
                      >
                        {copiedKey === "updated_at" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                      <div className="flex items-center gap-3 flex-1">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {t("preview.leadId")}
                          </p>
                          <p className="text-sm font-medium font-mono text-xs truncate">
                            {preview.lead.id}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(preview.lead?.id || "");
                          setCopiedKey("id");
                          setTimeout(() => setCopiedKey(null), 2000);
                        }}
                      >
                        {copiedKey === "id" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPreview({ open: false, lead: null })}
                    className="w-full cursor-pointer"
                    size="lg"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t("modal.close")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AuthGuard>
  );
}
