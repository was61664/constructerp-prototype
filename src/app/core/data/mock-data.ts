import { deriveRentalStatus, deriveTransportStatus } from '../models';
import type { Inspection } from '../models';
import type {
  EquipmentDto,
  ProjectDto,
  RentalDto,
  TransportMoveDto,
  VendorDto,
} from './api-contracts';

/**
 * Fallback data used when no API is configured (the GitHub Pages build).
 * Shaped as API DTOs so the store has one mapping path, not two.
 */
export const SEED_PROJECTS: readonly ProjectDto[] = [
  {
    id: 'aaaaaaaa-0000-4000-8000-000000001001',
    code: 'PRJ-1001',
    name: { en: 'Downtown Tower', ar: 'برج وسط المدينة' },
    client: { en: 'Finesco Development', ar: 'فينسكو للتطوير' },
    manager: 'M. Hassan',
    location: { en: 'East Gate, Zone 4', ar: 'البوابة الشرقية، المنطقة 4' },
    status: 'Active',
    budget: 260000,
    progress: 76,
    startDate: null,
    endDate: null,
    equipmentSpend: 184000,
    transportSpend: 24500,
    extraSpend: 11200,
    equipmentCount: 1,
  },
  {
    id: 'aaaaaaaa-0000-4000-8000-000000001018',
    code: 'PRJ-1018',
    name: { en: 'Airport Expansion', ar: 'توسعة المطار' },
    client: { en: 'National Airports Authority', ar: 'هيئة المطارات الوطنية' },
    manager: 'A. Farouk',
    location: { en: 'Airport Expansion', ar: 'توسعة المطار' },
    status: 'Active',
    budget: 230000,
    progress: 64,
    startDate: null,
    endDate: null,
    equipmentSpend: 139000,
    transportSpend: 31800,
    extraSpend: 8400,
    equipmentCount: 1,
  },
  {
    id: 'aaaaaaaa-0000-4000-8000-000000001032',
    code: 'PRJ-1032',
    name: { en: 'Metro Station Works', ar: 'أعمال محطة المترو' },
    client: { en: 'Metro Projects JV', ar: 'تحالف مشاريع المترو' },
    manager: 'L. Ibrahim',
    location: { en: 'Metro Station Works', ar: 'أعمال محطة المترو' },
    status: 'At Risk',
    budget: 168000,
    progress: 42,
    startDate: null,
    endDate: null,
    equipmentSpend: 98000,
    transportSpend: 14900,
    extraSpend: 6200,
    equipmentCount: 1,
  },
];

export const SEED_EQUIPMENT: readonly EquipmentDto[] = [
  {
    id: 'bbbbbbbb-0000-4000-8000-000000000104',
    code: 'EQ-104',
    name: { en: 'Crawler Crane 80T', ar: 'ونش زاحف 80 طن' },
    equipmentTypeId: 'cccccccc-0000-4000-8000-000000000001',
    equipmentType: { en: 'Lifting', ar: 'رفع' },
    ownership: 'Owned',
    projectId: 'aaaaaaaa-0000-4000-8000-000000001001',
    projectCode: 'PRJ-1001',
    projectName: { en: 'Downtown Tower', ar: 'برج وسط المدينة' },
    status: 'Working',
    utilization: 86,
    dailyCost: 1250,
    nextAction: { en: 'Routine inspection tomorrow', ar: 'تفتيش دوري غدا' },
  },
  {
    id: 'bbbbbbbb-0000-4000-8000-000000000219',
    code: 'EQ-219',
    name: { en: 'Concrete Pump 42m', ar: 'مضخة خرسانة 42 م' },
    equipmentTypeId: 'cccccccc-0000-4000-8000-000000000002',
    equipmentType: { en: 'Concrete', ar: 'خرسانة' },
    ownership: 'External Rental',
    projectId: 'aaaaaaaa-0000-4000-8000-000000001018',
    projectCode: 'PRJ-1018',
    projectName: { en: 'Airport Expansion', ar: 'توسعة المطار' },
    status: 'Return Scheduled',
    utilization: 72,
    dailyCost: 980,
    nextAction: { en: 'Return booking confirmed', ar: 'تم تأكيد حجز الرجوع' },
  },
  {
    id: 'bbbbbbbb-0000-4000-8000-000000000331',
    code: 'EQ-331',
    name: { en: 'Lowbed Trailer', ar: 'مقطورة لوبد' },
    equipmentTypeId: 'cccccccc-0000-4000-8000-000000000003',
    equipmentType: { en: 'Transportation', ar: 'نقل' },
    ownership: 'Owned',
    // Unassigned: the prototype pointed this at "Ring Road Package B", which
    // never existed as a project record. Inventing one to satisfy a string
    // match is the bug the foreign key removes.
    projectId: null,
    projectCode: null,
    projectName: null,
    status: 'In Transit',
    utilization: 64,
    dailyCost: 410,
    nextAction: { en: 'Arrives at site 16:30', ar: 'الوصول للموقع 16:30' },
  },
  {
    id: 'bbbbbbbb-0000-4000-8000-000000000448',
    code: 'EQ-448',
    name: { en: 'Tower Light Set', ar: 'وحدة إضاءة برجية' },
    equipmentTypeId: 'cccccccc-0000-4000-8000-000000000004',
    equipmentType: { en: 'Site Support', ar: 'دعم الموقع' },
    ownership: 'External Rental',
    projectId: 'aaaaaaaa-0000-4000-8000-000000001032',
    projectCode: 'PRJ-1032',
    projectName: { en: 'Metro Station Works', ar: 'أعمال محطة المترو' },
    status: 'Idle',
    utilization: 18,
    dailyCost: 160,
    nextAction: { en: 'Review rental continuation', ar: 'مراجعة استمرار الإيجار' },
  },
  {
    id: 'bbbbbbbb-0000-4000-8000-000000000512',
    code: 'EQ-512',
    name: { en: 'Excavator 36T', ar: 'حفار 36 طن' },
    equipmentTypeId: 'cccccccc-0000-4000-8000-000000000005',
    equipmentType: { en: 'Earthworks', ar: 'أعمال ترابية' },
    ownership: 'Owned',
    // Unassigned for the same reason: "Harbor Yard" was never a project.
    projectId: null,
    projectCode: null,
    projectName: null,
    status: 'Inspection Due',
    utilization: 57,
    dailyCost: 690,
    nextAction: { en: 'Operator checklist missing', ar: 'قائمة فحص المشغل غير مكتملة' },
  },
  {
    id: 'bbbbbbbb-0000-4000-8000-000000000577',
    code: 'EQ-577',
    name: { en: 'Mobile Crane 120T', ar: 'ونش متحرك 120 طن' },
    equipmentTypeId: 'cccccccc-0000-4000-8000-000000000001',
    equipmentType: { en: 'Lifting', ar: 'رفع' },
    ownership: 'External Rental',
    // Hired from Prime Lift. The prototype had a rental for this crane but no
    // fleet record, so the hire referred to a machine that did not exist.
    projectId: 'aaaaaaaa-0000-4000-8000-000000001001',
    projectCode: 'PRJ-1001',
    projectName: { en: 'Downtown Tower', ar: 'برج وسط المدينة' },
    status: 'Working',
    utilization: 81,
    dailyCost: 1480,
    nextAction: { en: 'Hire runs to month end', ar: 'الإيجار حتى نهاية الشهر' },
  },
];

export const SEED_VENDORS: readonly VendorDto[] = [
  {
    id: 'dddddddd-0000-4000-8000-000000000001',
    code: 'VEN-001',
    name: { en: 'Delta Heavy Rentals', ar: 'دلتا لتأجير المعدات الثقيلة' },
    contactName: 'K. Mansour',
    phone: '+965 2222 1180',
    email: 'hire@deltaheavy.com.kw',
    rentalCount: 1,
    openRentalCount: 1,
    totalSpend: 9800,
  },
  {
    id: 'dddddddd-0000-4000-8000-000000000002',
    code: 'VEN-002',
    name: { en: 'Prime Lift Services', ar: 'برايم لخدمات الرفع' },
    contactName: 'R. Aziz',
    phone: '+965 2222 4471',
    email: 'bookings@primelift.com.kw',
    rentalCount: 1,
    openRentalCount: 1,
    totalSpend: 14600,
  },
  {
    id: 'dddddddd-0000-4000-8000-000000000003',
    code: 'VEN-003',
    name: { en: 'SitePower Rental', ar: 'سايت باور للتأجير' },
    contactName: 'H. Darwish',
    phone: '+965 2222 9034',
    email: 'support@sitepower.com.kw',
    rentalCount: 1,
    openRentalCount: 1,
    totalSpend: 1920,
  },
];

/**
 * Dates are relative to whenever the build is opened, not fixed.
 *
 * The old seed carried "Jul 24" beside a hand-written status, so within weeks
 * every demo row read "Active" next to a return date months past — the exact
 * contradiction the API change removed. Offsets keep one rental of each status
 * on screen whenever the page is loaded, and the status below is derived from
 * the dates rather than typed beside them.
 */
export const SEED_RENTALS: readonly RentalDto[] = buildSeedRentals();

function buildSeedRentals(): RentalDto[] {
  const today = new Date();
  const iso = (offsetDays: number): string =>
    new Date(today.getTime() + offsetDays * 86_400_000).toISOString().slice(0, 10);

  const rows = [
    {
      id: 'eeeeeeee-0000-4000-8000-000000002007',
      code: 'RNT-2007',
      vendorId: 'dddddddd-0000-4000-8000-000000000001',
      vendorName: { en: 'Delta Heavy Rentals', ar: 'دلتا لتأجير المعدات الثقيلة' },
      equipmentId: 'bbbbbbbb-0000-4000-8000-000000000219',
      equipmentCode: 'EQ-219',
      equipmentName: { en: 'Concrete Pump 42m', ar: 'مضخة خرسانة 42 م' },
      projectId: 'aaaaaaaa-0000-4000-8000-000000001018',
      projectCode: 'PRJ-1018',
      projectName: { en: 'Airport Expansion', ar: 'توسعة المطار' },
      startedOn: iso(-34),
      expectedReturnOn: iso(12),
      returnBookedOn: iso(-2),
      returnedOn: null,
      amount: 9800,
      notes: { en: '', ar: null },
    },
    {
      id: 'eeeeeeee-0000-4000-8000-000000002011',
      code: 'RNT-2011',
      vendorId: 'dddddddd-0000-4000-8000-000000000002',
      vendorName: { en: 'Prime Lift Services', ar: 'برايم لخدمات الرفع' },
      equipmentId: 'bbbbbbbb-0000-4000-8000-000000000577',
      equipmentCode: 'EQ-577',
      equipmentName: { en: 'Mobile Crane 120T', ar: 'ونش متحرك 120 طن' },
      projectId: 'aaaaaaaa-0000-4000-8000-000000001001',
      projectCode: 'PRJ-1001',
      projectName: { en: 'Downtown Tower', ar: 'برج وسط المدينة' },
      startedOn: iso(-21),
      expectedReturnOn: iso(26),
      returnBookedOn: null,
      returnedOn: null,
      amount: 14600,
      notes: { en: '', ar: null },
    },
    {
      id: 'eeeeeeee-0000-4000-8000-000000002014',
      code: 'RNT-2014',
      vendorId: 'dddddddd-0000-4000-8000-000000000003',
      vendorName: { en: 'SitePower Rental', ar: 'سايت باور للتأجير' },
      equipmentId: 'bbbbbbbb-0000-4000-8000-000000000448',
      equipmentCode: 'EQ-448',
      equipmentName: { en: 'Tower Light Set', ar: 'وحدة إضاءة برجية' },
      projectId: 'aaaaaaaa-0000-4000-8000-000000001032',
      projectCode: 'PRJ-1032',
      projectName: { en: 'Metro Station Works', ar: 'أعمال محطة المترو' },
      startedOn: iso(-48),
      expectedReturnOn: iso(-7),
      returnBookedOn: null,
      returnedOn: null,
      amount: 1920,
      notes: { en: '', ar: null },
    },
  ];

  const now = iso(0);

  return rows.map((row) => ({
    ...row,
    status: deriveRentalStatus(row.expectedReturnOn, row.returnBookedOn, row.returnedOn, now),
    daysOverdue:
      row.expectedReturnOn < now && !row.returnedOn
        ? Math.round((Date.parse(now) - Date.parse(row.expectedReturnOn)) / 86_400_000)
        : 0,
  }));
}

export const SEED_INSPECTIONS: readonly Inspection[] = [
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

/** Previously hard-coded in the template; now seeded like every other entity. */
/**
 * Timestamps relative to load time, with the status derived from them.
 *
 * The prototype stored a status next to a "ETA 16:30" label that nothing could
 * compare — so a move read "Scheduled" long after its slot had passed. Here
 * each move carries the events that happened and the status follows.
 */
export const SEED_TRANSPORT: readonly TransportMoveDto[] = buildSeedTransport();

function buildSeedTransport(): TransportMoveDto[] {
  const hours = (n: number): string => new Date(Date.now() + n * 3_600_000).toISOString();

  const rows = [
    {
      id: 'ffffffff-0000-4000-8000-000000005001',
      code: 'TRP-5001',
      equipmentId: 'bbbbbbbb-0000-4000-8000-000000000331',
      equipmentCode: 'EQ-331',
      equipmentName: { en: 'Lowbed Trailer', ar: 'مقطورة لوبد' },
      projectId: 'aaaaaaaa-0000-4000-8000-000000001001',
      projectCode: 'PRJ-1001',
      projectName: { en: 'Downtown Tower', ar: 'برج وسط المدينة' },
      origin: { en: 'Yard A', ar: 'الساحة أ' },
      destination: { en: 'Downtown Tower', ar: 'برج وسط المدينة' },
      kind: 'Delivery' as const,
      scheduledFor: hours(3),
      approvedAt: hours(-6),
      departedAt: hours(-1),
      arrivedAt: null,
      cancelledAt: null,
      cost: 2400,
      notes: { en: '', ar: null },
    },
    {
      id: 'ffffffff-0000-4000-8000-000000005002',
      code: 'TRP-5002',
      equipmentId: 'bbbbbbbb-0000-4000-8000-000000000219',
      equipmentCode: 'EQ-219',
      equipmentName: { en: 'Concrete Pump 42m', ar: 'مضخة خرسانة 42 م' },
      projectId: 'aaaaaaaa-0000-4000-8000-000000001018',
      projectCode: 'PRJ-1018',
      projectName: { en: 'Airport Expansion', ar: 'توسعة المطار' },
      origin: { en: 'Airport Expansion', ar: 'توسعة المطار' },
      destination: { en: 'Vendor Yard', ar: 'ساحة المورد' },
      kind: 'Return move' as const,
      scheduledFor: hours(48),
      approvedAt: hours(-6),
      departedAt: null,
      arrivedAt: null,
      cancelledAt: null,
      cost: 3150,
      notes: { en: '', ar: null },
    },
    {
      // Unassigned: "Harbor Yard" was never a project record.
      id: 'ffffffff-0000-4000-8000-000000005003',
      code: 'TRP-5003',
      equipmentId: 'bbbbbbbb-0000-4000-8000-000000000512',
      equipmentCode: 'EQ-512',
      equipmentName: { en: 'Excavator 36T', ar: 'حفار 36 طن' },
      projectId: null,
      projectCode: null,
      projectName: null,
      origin: { en: 'Harbor Yard', ar: 'ساحة الميناء' },
      destination: { en: 'Service Center', ar: 'مركز الخدمة' },
      kind: 'Inspection transfer' as const,
      scheduledFor: hours(96),
      approvedAt: null,
      departedAt: null,
      arrivedAt: null,
      cancelledAt: null,
      cost: 1100,
      notes: { en: '', ar: null },
    },
  ];

  const now = new Date().toISOString();

  return rows.map((row) => {
    const status = deriveTransportStatus(
      row.approvedAt,
      row.departedAt,
      row.arrivedAt,
      row.cancelledAt,
    );

    const actions: TransportMoveDto['availableActions'] = [];

    if (!row.approvedAt) {
      actions.push('approve');
    } else if (!row.departedAt) {
      actions.push('depart');
    } else if (!row.arrivedAt) {
      actions.push('arrive');
    }

    if (!row.arrivedAt) {
      actions.push('cancel');
    }

    return {
      ...row,
      status,
      isLate: !row.departedAt && !row.arrivedAt && row.scheduledFor < now,
      availableActions: actions,
    };
  });
}
