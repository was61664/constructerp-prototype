import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  LucideBadgeDollarSign,
  LucideBell,
  LucideBoxes,
  LucideBuilding2,
  LucideCalendarClock,
  LucideCamera,
  LucideChartNoAxesCombined,
  LucideChevronRight,
  LucideCircleDollarSign,
  LucideClipboardCheck,
  LucideClipboardList,
  LucideDownload,
  LucideFileText,
  LucideGauge,
  LucideListChecks,
  LucideMapPinned,
  LucideMenu,
  LucidePlus,
  LucidePackageCheck,
  LucideSearch,
  LucideSignature,
  LucideTruck,
  LucideWarehouse,
  LucideWrench,
} from '@lucide/angular';

type ModuleId =
  | 'dashboard'
  | 'requests'
  | 'projects'
  | 'equipment'
  | 'rentals'
  | 'transport'
  | 'inspections'
  | 'costs'
  | 'reports';

type Equipment = {
  id: string;
  name: string;
  type: string;
  ownership: 'Owned' | 'External Rental';
  project: string;
  status: 'Working' | 'Idle' | 'In Transit' | 'Inspection Due' | 'Return Scheduled';
  utilization: number;
  dailyCost: number;
  nextAction: string;
};

type Inspection = {
  asset: string;
  project: string;
  status: 'Passed' | 'Attention' | 'Pending Signature';
  media: string;
  inspector: string;
};

type Rental = {
  vendor: string;
  asset: string;
  project: string;
  returnDate: string;
  amount: number;
  status: 'Active' | 'Return Scheduled' | 'Overdue';
};

type Language = 'en' | 'ar';

type RequestStage = 'Request' | 'Approval' | 'Receiving' | 'Inspection';

type EquipmentRequest = {
  id: string;
  equipment: string;
  project: string;
  ownership: 'Owned' | 'External Rental';
  requestedBy: string;
  requiredDate: string;
  returnDate: string;
  location: string;
  purpose: string;
  estimatedCost: number;
  stage: RequestStage;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Received' | 'Inspection Pending' | 'Ready to Use';
  checks: Array<{ label: string; passed: boolean }>;
  receivingChecks: Array<{ label: string; passed: boolean }>;
};

type ProjectRecord = {
  name: string;
  code: string;
  client: string;
  manager: string;
  location: string;
  status: 'Active' | 'At Risk' | 'Closing';
  budget: number;
  equipmentSpend: number;
  transportSpend: number;
  extraSpend: number;
  progress: number;
};

type NavGroupId = 'overview' | 'mainData' | 'projectOperations' | 'analytics';

const translations = {
  en: {
    phase: 'Phase 1 Prototype',
    search: 'Search equipment, projects, vendors, inspections',
    notifications: 'Notifications',
    newRequest: 'New Request',
    eyebrow: 'Construction equipment ERP',
    heading: 'Equipment, rentals, inspections, and project costs in one view',
    export: 'Export Report',
    totalEquipment: 'Total equipment',
    totalEquipmentNote: 'Owned and external rentals',
    externalRentals: 'External rentals',
    externalRentalsNote: 'Across active projects',
    dailySpend: 'Daily equipment spend',
    dailySpendNote: 'Mock operational cost',
    avgUtilization: 'Average utilization',
    idleNeedsReview: 'idle asset needs review',
    fleetVisibility: 'Fleet visibility',
    utilizationByAsset: 'Equipment utilization by asset',
    requestFlow: 'Request flow',
    requestFlowTitle: 'Request, approve, receive, and inspect before use',
    activeRequests: 'Active requests',
    currentStage: 'Current stage',
    requiredDate: 'Required date',
    returnDate: 'Expected return',
    requestedBy: 'Requested by',
    location: 'Location',
    purpose: 'Purpose',
    estimatedCost: 'Estimated cost',
    beforeRequestChecks: 'Checks before request',
    beforeReceivingChecks: 'Checks before receiving',
    processSteps: 'Process steps',
    createRequest: 'Create request',
    approveRequest: 'Approve request',
    receiveEquipment: 'Receive equipment',
    inspectBeforeUse: 'Inspect before use',
    requestFlowNote:
      'Equipment cannot move to Working until the request is approved, delivery is received, and pre-use inspection passes.',
    projectsOverview: 'Projects overview',
    projectsTitle: 'Project equipment cost, activity, and status',
    projectCode: 'Project code',
    client: 'Client',
    manager: 'Manager',
    status: 'Status',
    budget: 'Budget',
    equipmentAssigned: 'Equipment assigned',
    requestsLinked: 'Requests linked',
    inspectionsLinked: 'Inspections linked',
    costProgress: 'Cost progress',
    equipmentSpend: 'Equipment spend',
    transportSpend: 'Transport spend',
    extraSpend: 'Extra spend',
    projectPortfolio: 'Project portfolio',
    linkedActivity: 'Linked activity',
    attentionQueue: 'Attention queue',
    nextActions: 'Next actions',
    assetRegister: 'Asset register',
    ownedAndRented: 'Owned and externally rented equipment',
    assetDetail: 'Asset detail',
    project: 'Project',
    ownership: 'Ownership',
    dailyCost: 'Daily cost',
    nextAction: 'Next action',
    vendorRentals: 'Vendor rentals',
    activeCommitments: 'Active external equipment commitments',
    transportation: 'Transportation',
    transportPlanning: 'Delivery and return cost planning',
    costSplit: 'Cost split',
    transportShare: 'Transport share',
    transportDistribution: 'Transportation cost distribution',
    transportNote: 'Mock share of equipment-related project spend this month.',
    inspectionRecords: 'Inspection records',
    inspectionTitle: 'Photos, videos, notes, and signatures',
    projectCosts: 'Project costs',
    costTitle: 'Equipment, transport, and additional expenses',
    reports: 'Reports',
    reportPack: 'Management reporting pack',
    utilizationReport: 'Equipment utilization summary',
    rentalReport: 'Rental spend and overdue returns',
    inspectionReport: 'Inspection compliance register',
    prototypeOutput: 'Prototype output',
    readyReview: 'Ready for stakeholder review',
    reportNote:
      'These report examples demonstrate the decisions ConstructERP will support before live backend reporting is implemented.',
    langToggle: 'عربي',
    menu: 'Open menu',
  },
  ar: {
    phase: 'النموذج الأولي - المرحلة الأولى',
    search: 'ابحث عن المعدات أو المشاريع أو الموردين أو التفتيشات',
    notifications: 'الإشعارات',
    newRequest: 'طلب جديد',
    eyebrow: 'نظام ERP لمعدات المقاولات',
    heading: 'إدارة المعدات والإيجارات والتفتيشات وتكاليف المشاريع في شاشة واحدة',
    export: 'تصدير التقرير',
    totalEquipment: 'إجمالي المعدات',
    totalEquipmentNote: 'معدات مملوكة وإيجارات خارجية',
    externalRentals: 'الإيجارات الخارجية',
    externalRentalsNote: 'على المشاريع النشطة',
    dailySpend: 'الإنفاق اليومي للمعدات',
    dailySpendNote: 'تكلفة تشغيلية تجريبية',
    avgUtilization: 'متوسط الاستخدام',
    idleNeedsReview: 'معدة خاملة تحتاج مراجعة',
    fleetVisibility: 'رؤية الأسطول',
    utilizationByAsset: 'استخدام المعدات حسب الأصل',
    requestFlow: 'دورة الطلب',
    requestFlowTitle: 'طلب واعتماد واستلام وتفتيش قبل التشغيل',
    activeRequests: 'الطلبات النشطة',
    currentStage: 'المرحلة الحالية',
    requiredDate: 'تاريخ الاحتياج',
    returnDate: 'تاريخ الرجوع المتوقع',
    requestedBy: 'مقدم الطلب',
    location: 'الموقع',
    purpose: 'الغرض',
    estimatedCost: 'التكلفة التقديرية',
    beforeRequestChecks: 'فحوصات قبل الطلب',
    beforeReceivingChecks: 'فحوصات قبل الاستلام',
    processSteps: 'خطوات العملية',
    createRequest: 'إنشاء الطلب',
    approveRequest: 'اعتماد الطلب',
    receiveEquipment: 'استلام المعدة',
    inspectBeforeUse: 'التفتيش قبل التشغيل',
    requestFlowNote:
      'لا تتحول المعدة إلى حالة التشغيل إلا بعد اعتماد الطلب، وتأكيد الاستلام، ونجاح التفتيش قبل الاستخدام.',
    projectsOverview: 'نظرة عامة على المشاريع',
    projectsTitle: 'تكلفة المعدات والنشاط والحالة لكل مشروع',
    projectCode: 'كود المشروع',
    client: 'العميل',
    manager: 'المدير',
    status: 'الحالة',
    budget: 'الميزانية',
    equipmentAssigned: 'المعدات المخصصة',
    requestsLinked: 'الطلبات المرتبطة',
    inspectionsLinked: 'التفتيشات المرتبطة',
    costProgress: 'تقدم التكلفة',
    equipmentSpend: 'إنفاق المعدات',
    transportSpend: 'إنفاق النقل',
    extraSpend: 'المصروفات الإضافية',
    projectPortfolio: 'محفظة المشاريع',
    linkedActivity: 'النشاط المرتبط',
    attentionQueue: 'قائمة المتابعة',
    nextActions: 'الإجراءات التالية',
    assetRegister: 'سجل المعدات',
    ownedAndRented: 'المعدات المملوكة والمستأجرة خارجيا',
    assetDetail: 'تفاصيل المعدة',
    project: 'المشروع',
    ownership: 'الملكية',
    dailyCost: 'التكلفة اليومية',
    nextAction: 'الإجراء التالي',
    vendorRentals: 'إيجارات الموردين',
    activeCommitments: 'التزامات المعدات الخارجية النشطة',
    transportation: 'النقل',
    transportPlanning: 'تخطيط تكلفة التسليم والرجوع',
    costSplit: 'توزيع التكلفة',
    transportShare: 'نسبة النقل',
    transportDistribution: 'توزيع تكلفة النقل',
    transportNote: 'نسبة تجريبية من إنفاق المشاريع المرتبط بالمعدات هذا الشهر.',
    inspectionRecords: 'سجلات التفتيش',
    inspectionTitle: 'صور وفيديوهات وملاحظات وتوقيعات',
    projectCosts: 'تكاليف المشاريع',
    costTitle: 'المعدات والنقل والمصروفات الإضافية',
    reports: 'التقارير',
    reportPack: 'حزمة تقارير الإدارة',
    utilizationReport: 'ملخص استخدام المعدات',
    rentalReport: 'إنفاق الإيجارات والمرتجعات المتأخرة',
    inspectionReport: 'سجل الالتزام بالتفتيش',
    prototypeOutput: 'مخرجات النموذج',
    readyReview: 'جاهز لمراجعة أصحاب المصلحة',
    reportNote:
      'تعرض هذه التقارير التجريبية القرارات التي سيدعمها ConstructERP قبل تنفيذ تقارير الخلفية الفعلية.',
    langToggle: 'EN',
    menu: 'فتح القائمة',
  },
} as const;

const moduleLabels: Record<Language, Record<ModuleId, { label: string; caption: string }>> = {
  en: {
    dashboard: { label: 'Dashboard', caption: 'Executive view' },
    requests: { label: 'Requests', caption: 'Request and receive flow' },
    projects: { label: 'Projects', caption: 'Costs and activity' },
    equipment: { label: 'Equipment', caption: 'Owned and rented fleet' },
    rentals: { label: 'Rentals', caption: 'Vendor equipment' },
    transport: { label: 'Transport', caption: 'Delivery and return' },
    inspections: { label: 'Inspections', caption: 'Media and signatures' },
    costs: { label: 'Project Costs', caption: 'Spend allocation' },
    reports: { label: 'Reports', caption: 'Decision support' },
  },
  ar: {
    dashboard: { label: 'لوحة التحكم', caption: 'عرض الإدارة' },
    requests: { label: 'طلبات المعدات', caption: 'الطلب والاستلام' },
    projects: { label: 'المشاريع', caption: 'التكاليف والنشاط' },
    equipment: { label: 'المعدات', caption: 'الأسطول المملوك والمستأجر' },
    rentals: { label: 'الإيجارات', caption: 'معدات الموردين' },
    transport: { label: 'النقل', caption: 'التسليم والرجوع' },
    inspections: { label: 'التفتيشات', caption: 'وسائط وتوقيعات' },
    costs: { label: 'تكاليف المشاريع', caption: 'توزيع الإنفاق' },
    reports: { label: 'التقارير', caption: 'دعم القرار' },
  },
};

const navGroupLabels: Record<Language, Record<NavGroupId, string>> = {
  en: {
    overview: 'Overview',
    mainData: 'Main Data',
    projectOperations: 'Project Operations',
    analytics: 'Analytics',
  },
  ar: {
    overview: 'نظرة عامة',
    mainData: 'البيانات الرئيسية',
    projectOperations: 'عمليات المشاريع',
    analytics: 'التحليلات',
  },
};

const navGroupOrder: Array<{ id: NavGroupId; modules: ModuleId[] }> = [
  { id: 'overview', modules: ['dashboard'] },
  { id: 'mainData', modules: ['projects', 'equipment', 'rentals'] },
  { id: 'projectOperations', modules: ['requests', 'transport', 'inspections', 'costs'] },
  { id: 'analytics', modules: ['reports'] },
];

const displayText: Record<Language, Record<string, string>> = {
  en: {},
  ar: {
    'Crawler Crane 80T': 'ونش زاحف 80 طن',
    'Concrete Pump 42m': 'مضخة خرسانة 42 م',
    'Lowbed Trailer': 'مقطورة لوبد',
    'Tower Light Set': 'وحدة إضاءة برجية',
    'Excavator 36T': 'حفار 36 طن',
    'Mobile Crane 120T': 'ونش متحرك 120 طن',
    Lifting: 'رفع',
    Concrete: 'خرسانة',
    Transportation: 'نقل',
    'Site Support': 'دعم الموقع',
    Earthworks: 'أعمال ترابية',
    Owned: 'مملوكة',
    'External Rental': 'إيجار خارجي',
    Working: 'تعمل',
    Idle: 'خاملة',
    'In Transit': 'قيد النقل',
    'Inspection Due': 'مطلوب تفتيش',
    'Return Scheduled': 'تم جدولة الرجوع',
    Active: 'نشطة',
    Overdue: 'متأخرة',
    Passed: 'ناجح',
    Attention: 'تحتاج متابعة',
    'Pending Signature': 'بانتظار التوقيع',
    'Downtown Tower': 'برج وسط المدينة',
    'Airport Expansion': 'توسعة المطار',
    'Ring Road Package B': 'الطريق الدائري - الحزمة ب',
    'Metro Station Works': 'أعمال محطة المترو',
    'Harbor Yard': 'ساحة الميناء',
    'Delta Heavy Rentals': 'دلتا لتأجير المعدات الثقيلة',
    'Prime Lift Services': 'برايم لخدمات الرفع',
    'SitePower Rental': 'سايت باور للتأجير',
    'Routine inspection tomorrow': 'تفتيش دوري غدا',
    'Return booking confirmed': 'تم تأكيد حجز الرجوع',
    'Arrives at site 16:30': 'الوصول للموقع 16:30',
    'Review rental continuation': 'مراجعة استمرار الإيجار',
    'Operator checklist missing': 'قائمة فحص المشغل غير مكتملة',
    '8 photos, 1 video': '8 صور، فيديو واحد',
    '5 photos': '5 صور',
    '6 photos, signature draft': '6 صور، مسودة توقيع',
    'Yard A to Downtown Tower': 'الساحة أ إلى برج وسط المدينة',
    'Lowbed trailer': 'مقطورة لوبد',
    'ETA 16:30': 'الوصول 16:30',
    'Airport Expansion to Vendor Yard': 'توسعة المطار إلى ساحة المورد',
    'Return move': 'رحلة رجوع',
    'Scheduled Jul 24': 'مجدولة 24 يوليو',
    'Harbor Yard to Service Center': 'ساحة الميناء إلى مركز الخدمة',
    'Inspection transfer': 'نقل للتفتيش',
    'Awaiting approval': 'بانتظار الموافقة',
    'Foundation excavation support': 'دعم أعمال حفر الأساسات',
    'Night shift lighting': 'إضاءة الوردية الليلية',
    'East Gate, Zone 4': 'البوابة الشرقية، المنطقة 4',
    'Approved request exists': 'يوجد طلب معتمد',
    'Correct equipment and project': 'المعدة والمشروع صحيحان',
    'Transport details entered': 'تم إدخال بيانات النقل',
    'Arrival condition documented': 'تم توثيق حالة الوصول',
    'Photos/videos attached': 'تم إرفاق الصور والفيديوهات',
    'Receiver signature captured': 'تم تسجيل توقيع المستلم',
    'Equipment available': 'المعدة متاحة',
    'Project is active': 'المشروع نشط',
    'No idle similar equipment': 'لا توجد معدة مشابهة خاملة',
    'Rental period is valid': 'فترة الإيجار صحيحة',
    'Cost within budget': 'التكلفة داخل الميزانية',
    'Delivery cost entered': 'تم إدخال تكلفة التوصيل',
    Request: 'الطلب',
    Approval: 'الاعتماد',
    Receiving: 'الاستلام',
    Inspection: 'التفتيش',
    Draft: 'مسودة',
    Submitted: 'مرسل',
    Approved: 'معتمد',
    Received: 'تم الاستلام',
    'Inspection Pending': 'بانتظار التفتيش',
    'Ready to Use': 'جاهزة للاستخدام',
    'At Risk': 'تحتاج متابعة',
    Closing: 'قيد الإغلاق',
    'Finesco Development': 'فينسكو للتطوير',
    'National Airports Authority': 'هيئة المطارات الوطنية',
    'Metro Projects JV': 'تحالف مشاريع المترو',
    Equipment: 'المعدات',
    Transport: 'النقل',
    Extras: 'الإضافات',
  },
};

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    LucideBadgeDollarSign,
    LucideBell,
    LucideBoxes,
    LucideBuilding2,
    LucideCalendarClock,
    LucideCamera,
    LucideChartNoAxesCombined,
    LucideChevronRight,
    LucideCircleDollarSign,
    LucideClipboardCheck,
    LucideClipboardList,
    LucideDownload,
    LucideFileText,
    LucideGauge,
    LucideListChecks,
    LucideMapPinned,
    LucideMenu,
    LucidePlus,
    LucidePackageCheck,
    LucideSearch,
    LucideSignature,
    LucideTruck,
    LucideWarehouse,
    LucideWrench,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly document = inject(DOCUMENT);

  protected readonly language = signal<Language>('en');
  protected readonly activeModule = signal<ModuleId>('dashboard');
  protected readonly selectedEquipment = signal('EQ-104');

  protected readonly modules: Array<{ id: ModuleId; label: string; caption: string; icon: string }> = [
    { id: 'dashboard', label: 'Dashboard', caption: 'Executive view', icon: 'gauge' },
    { id: 'projects', label: 'Projects', caption: 'Costs and activity', icon: 'project' },
    { id: 'requests', label: 'Requests', caption: 'Request and receive flow', icon: 'request' },
    { id: 'equipment', label: 'Equipment', caption: 'Owned and rented fleet', icon: 'boxes' },
    { id: 'rentals', label: 'Rentals', caption: 'Vendor equipment', icon: 'warehouse' },
    { id: 'transport', label: 'Transport', caption: 'Delivery and return', icon: 'truck' },
    { id: 'inspections', label: 'Inspections', caption: 'Media and signatures', icon: 'clipboard' },
    { id: 'costs', label: 'Project Costs', caption: 'Spend allocation', icon: 'money' },
    { id: 'reports', label: 'Reports', caption: 'Decision support', icon: 'chart' },
  ];

  protected readonly projects: ProjectRecord[] = [
    {
      name: 'Downtown Tower',
      code: 'PRJ-1001',
      client: 'Finesco Development',
      manager: 'M. Hassan',
      location: 'East Gate, Zone 4',
      status: 'Active',
      budget: 260000,
      equipmentSpend: 184000,
      transportSpend: 24500,
      extraSpend: 11200,
      progress: 76,
    },
    {
      name: 'Airport Expansion',
      code: 'PRJ-1018',
      client: 'National Airports Authority',
      manager: 'A. Farouk',
      location: 'Airport Expansion',
      status: 'Active',
      budget: 230000,
      equipmentSpend: 139000,
      transportSpend: 31800,
      extraSpend: 8400,
      progress: 64,
    },
    {
      name: 'Metro Station Works',
      code: 'PRJ-1032',
      client: 'Metro Projects JV',
      manager: 'L. Ibrahim',
      location: 'Metro Station Works',
      status: 'At Risk',
      budget: 168000,
      equipmentSpend: 98000,
      transportSpend: 14900,
      extraSpend: 6200,
      progress: 42,
    },
  ];

  protected readonly equipmentRequests: EquipmentRequest[] = [
    {
      id: 'REQ-2407',
      equipment: 'Excavator 36T',
      project: 'Harbor Yard',
      ownership: 'Owned',
      requestedBy: 'K. Mansour',
      requiredDate: 'Jul 20',
      returnDate: 'Jul 28',
      location: 'East Gate, Zone 4',
      purpose: 'Foundation excavation support',
      estimatedCost: 5520,
      stage: 'Receiving',
      status: 'Approved',
      checks: [
        { label: 'Equipment available', passed: true },
        { label: 'Project is active', passed: true },
        { label: 'No idle similar equipment', passed: true },
        { label: 'Rental period is valid', passed: true },
        { label: 'Cost within budget', passed: true },
        { label: 'Delivery cost entered', passed: true },
      ],
      receivingChecks: [
        { label: 'Approved request exists', passed: true },
        { label: 'Correct equipment and project', passed: true },
        { label: 'Transport details entered', passed: true },
        { label: 'Arrival condition documented', passed: false },
        { label: 'Photos/videos attached', passed: false },
        { label: 'Receiver signature captured', passed: false },
      ],
    },
    {
      id: 'REQ-2411',
      equipment: 'Tower Light Set',
      project: 'Metro Station Works',
      ownership: 'External Rental',
      requestedBy: 'L. Ibrahim',
      requiredDate: 'Jul 18',
      returnDate: 'Jul 22',
      location: 'East Gate, Zone 4',
      purpose: 'Night shift lighting',
      estimatedCost: 940,
      stage: 'Inspection',
      status: 'Inspection Pending',
      checks: [
        { label: 'Equipment available', passed: true },
        { label: 'Project is active', passed: true },
        { label: 'No idle similar equipment', passed: false },
        { label: 'Rental period is valid', passed: true },
        { label: 'Cost within budget', passed: true },
        { label: 'Delivery cost entered', passed: true },
      ],
      receivingChecks: [
        { label: 'Approved request exists', passed: true },
        { label: 'Correct equipment and project', passed: true },
        { label: 'Transport details entered', passed: true },
        { label: 'Arrival condition documented', passed: true },
        { label: 'Photos/videos attached', passed: true },
        { label: 'Receiver signature captured', passed: true },
      ],
    },
  ];

  protected readonly equipment: Equipment[] = [
    {
      id: 'EQ-104',
      name: 'Crawler Crane 80T',
      type: 'Lifting',
      ownership: 'Owned',
      project: 'Downtown Tower',
      status: 'Working',
      utilization: 86,
      dailyCost: 1250,
      nextAction: 'Routine inspection tomorrow',
    },
    {
      id: 'EQ-219',
      name: 'Concrete Pump 42m',
      type: 'Concrete',
      ownership: 'External Rental',
      project: 'Airport Expansion',
      status: 'Return Scheduled',
      utilization: 72,
      dailyCost: 980,
      nextAction: 'Return booking confirmed',
    },
    {
      id: 'EQ-331',
      name: 'Lowbed Trailer',
      type: 'Transportation',
      ownership: 'Owned',
      project: 'Ring Road Package B',
      status: 'In Transit',
      utilization: 64,
      dailyCost: 410,
      nextAction: 'Arrives at site 16:30',
    },
    {
      id: 'EQ-448',
      name: 'Tower Light Set',
      type: 'Site Support',
      ownership: 'External Rental',
      project: 'Metro Station Works',
      status: 'Idle',
      utilization: 18,
      dailyCost: 160,
      nextAction: 'Review rental continuation',
    },
    {
      id: 'EQ-512',
      name: 'Excavator 36T',
      type: 'Earthworks',
      ownership: 'Owned',
      project: 'Harbor Yard',
      status: 'Inspection Due',
      utilization: 57,
      dailyCost: 690,
      nextAction: 'Operator checklist missing',
    },
  ];

  protected readonly rentals: Rental[] = [
    {
      vendor: 'Delta Heavy Rentals',
      asset: 'Concrete Pump 42m',
      project: 'Airport Expansion',
      returnDate: 'Jul 24',
      amount: 9800,
      status: 'Return Scheduled',
    },
    {
      vendor: 'Prime Lift Services',
      asset: 'Mobile Crane 120T',
      project: 'Downtown Tower',
      returnDate: 'Jul 21',
      amount: 14600,
      status: 'Active',
    },
    {
      vendor: 'SitePower Rental',
      asset: 'Tower Light Set',
      project: 'Metro Station Works',
      returnDate: 'Jul 15',
      amount: 1920,
      status: 'Overdue',
    },
  ];

  protected readonly inspections: Inspection[] = [
    {
      asset: 'Crawler Crane 80T',
      project: 'Downtown Tower',
      status: 'Passed',
      media: '8 photos, 1 video',
      inspector: 'M. Hassan',
    },
    {
      asset: 'Excavator 36T',
      project: 'Harbor Yard',
      status: 'Attention',
      media: '5 photos',
      inspector: 'S. Nabil',
    },
    {
      asset: 'Concrete Pump 42m',
      project: 'Airport Expansion',
      status: 'Pending Signature',
      media: '6 photos, signature draft',
      inspector: 'A. Farouk',
    },
  ];

  protected readonly projectCosts = [
    { project: 'Downtown Tower', equipment: 184000, transport: 24500, extras: 11200, progress: 76 },
    { project: 'Airport Expansion', equipment: 139000, transport: 31800, extras: 8400, progress: 64 },
    { project: 'Metro Station Works', equipment: 98000, transport: 14900, extras: 6200, progress: 42 },
  ];

  protected readonly selectedAsset = computed(
    () => this.equipment.find((item) => item.id === this.selectedEquipment()) ?? this.equipment[0],
  );

  protected readonly localizedModules = computed(() =>
    this.modules.map((module) => ({ ...module, ...moduleLabels[this.language()][module.id] })),
  );

  protected readonly localizedModuleGroups = computed(() => {
    const modulesById = new Map(this.localizedModules().map((module) => [module.id, module]));

    return navGroupOrder.map((group) => ({
      label: navGroupLabels[this.language()][group.id],
      modules: group.modules
        .map((module) => modulesById.get(module))
        .filter((module): module is NonNullable<typeof module> => module !== undefined),
    }));
  });

  protected readonly isArabic = computed(() => this.language() === 'ar');
  protected readonly pageDirection = computed(() => (this.isArabic() ? 'rtl' : 'ltr'));
  protected readonly currencyLocale = computed(() => (this.isArabic() ? 'ar-KW' : 'en-KW'));

  protected readonly totals = computed(() => {
    const rented = this.equipment.filter((item) => item.ownership === 'External Rental').length;
    const idle = this.equipment.filter((item) => item.status === 'Idle').length;
    const dailySpend = this.equipment.reduce((sum, item) => sum + item.dailyCost, 0);
    const avgUtilization = Math.round(
      this.equipment.reduce((sum, item) => sum + item.utilization, 0) / this.equipment.length,
    );

    return { rented, idle, dailySpend, avgUtilization };
  });

  constructor() {
    effect(() => {
      const language = this.language();
      const direction = language === 'ar' ? 'rtl' : 'ltr';

      this.document.documentElement.lang = language;
      this.document.documentElement.dir = direction;
      this.document.body.dir = direction;
    });
  }

  protected setModule(module: ModuleId): void {
    this.activeModule.set(module);
  }

  protected toggleLanguage(): void {
    this.language.update((language) => (language === 'en' ? 'ar' : 'en'));
  }

  protected selectEquipment(id: string): void {
    this.selectedEquipment.set(id);
    this.activeModule.set('equipment');
  }

  protected projectEquipmentCount(project: string): number {
    return this.equipment.filter((item) => item.project === project).length;
  }

  protected projectRequestCount(project: string): number {
    return this.equipmentRequests.filter((request) => request.project === project).length;
  }

  protected projectInspectionCount(project: string): number {
    return this.inspections.filter((inspection) => inspection.project === project).length;
  }

  protected projectTotalSpend(project: ProjectRecord): number {
    return project.equipmentSpend + project.transportSpend + project.extraSpend;
  }

  protected statusClass(status: string): string {
    return status.toLowerCase().replaceAll(' ', '-');
  }

  protected t(key: keyof (typeof translations)['en']): string {
    return translations[this.language()][key];
  }

  protected formatMoney(value: number): string {
    return new Intl.NumberFormat(this.currencyLocale(), {
      style: 'currency',
      currency: 'KWD',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(value);
  }

  protected text(value: string): string {
    return displayText[this.language()][value] ?? value;
  }
}
