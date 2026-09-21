import type {
  Equipment,
  EquipmentRequest,
  Inspection,
  RequestCheck,
  Rental,
  ProjectRecord,
  TransportMove,
} from '../models';

/** Gate that must pass before a request may be submitted. */
export function defaultRequestChecks(): RequestCheck[] {
  return [
    { label: 'Equipment available', passed: true },
    { label: 'Project is active', passed: true },
    { label: 'No idle similar equipment', passed: true },
    { label: 'Rental period is valid', passed: true },
    { label: 'Cost within budget', passed: true },
    { label: 'Delivery cost entered', passed: true },
  ];
}

/** Gate that must pass before delivery may be accepted on site. */
export function defaultReceivingChecks(): RequestCheck[] {
  return [
    { label: 'Approved request exists', passed: false },
    { label: 'Correct equipment and project', passed: false },
    { label: 'Transport details entered', passed: false },
    { label: 'Arrival condition documented', passed: false },
    { label: 'Photos/videos attached', passed: false },
    { label: 'Receiver signature captured', passed: false },
  ];
}

export const SEED_PROJECTS: readonly ProjectRecord[] = [
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

export const SEED_EQUIPMENT: readonly Equipment[] = [
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

export const SEED_REQUESTS: readonly EquipmentRequest[] = [
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
    checks: defaultRequestChecks(),
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

export const SEED_RENTALS: readonly Rental[] = [
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
export const SEED_TRANSPORT: readonly TransportMove[] = [
  {
    id: 'TRP-5001',
    origin: 'Yard A',
    destination: 'Downtown Tower',
    kind: 'Delivery',
    asset: 'Lowbed Trailer',
    project: 'Downtown Tower',
    cost: 2400,
    status: 'In Transit',
    schedule: 'ETA 16:30',
  },
  {
    id: 'TRP-5002',
    origin: 'Airport Expansion',
    destination: 'Vendor Yard',
    kind: 'Return move',
    asset: 'Concrete Pump 42m',
    project: 'Airport Expansion',
    cost: 3150,
    status: 'Scheduled',
    schedule: 'Jul 24',
  },
  {
    id: 'TRP-5003',
    origin: 'Harbor Yard',
    destination: 'Service Center',
    kind: 'Inspection transfer',
    asset: 'Excavator 36T',
    project: 'Harbor Yard',
    cost: 1100,
    status: 'Awaiting Approval',
    schedule: 'Jul 26',
  },
];
