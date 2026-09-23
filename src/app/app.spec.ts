import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';
import type {
  EquipmentDto,
  ProjectDto,
  RentalDto,
  RequestDto,
  SaveEquipmentRequest,
  TransportMoveDto,
  VendorDto,
} from './core/data/api-contracts';
import { ErpGateway } from './core/data/erp-gateway';
import { deriveRentalStatus, deriveTransportStatus } from './core/models';
import { ErpStore } from './core/services/erp-store';
import { I18nService } from './core/services/i18n';
import { ExportService } from './core/services/export';
import { NotificationsService } from './core/services/notifications';
import { SearchService } from './core/services/search';
import { ThemeService } from './core/services/theme';
import { BusyState } from './shared/utils/busy-state';

/**
 * In-memory stand-in for the API.
 *
 * The store is HTTP-backed now, so suites that reach it exercise mapping and
 * CRUD without a live backend. Writes actually mutate the fake's state —
 * returning the row unchanged made derived-state tests pass for the wrong
 * reason.
 */
function isoOffset(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

/** Mirrors the API: status follows the dates, it is never passed in. */
function rederive(row: Omit<RentalDto, 'status' | 'daysOverdue'>): RentalDto {
  const today = isoOffset(0);
  const late = !row.returnedOn && row.expectedReturnOn < today;

  return {
    ...row,
    status: deriveRentalStatus(row.expectedReturnOn, row.returnBookedOn, row.returnedOn, today),
    daysOverdue: late
      ? Math.round((Date.parse(today) - Date.parse(row.expectedReturnOn)) / 86_400_000)
      : 0,
  };
}

function fakeRental(id: string, dueOffset: number, bookedOffset: number | null): RentalDto {
  return rederive({
    id,
    code: `RNT-${id}`,
    vendorId: 'v1',
    vendorName: { en: 'Delta Heavy Rentals', ar: 'دلتا لتأجير المعدات الثقيلة' },
    equipmentId: 'e1',
    equipmentCode: 'EQ-104',
    equipmentName: { en: 'Crawler Crane 80T', ar: 'ونش زاحف 80 طن' },
    projectId: 'p1',
    projectCode: 'PRJ-1001',
    projectName: { en: 'Downtown Tower', ar: 'برج وسط المدينة' },
    startedOn: isoOffset(-40),
    expectedReturnOn: isoOffset(dueOffset),
    returnBookedOn: bookedOffset === null ? null : isoOffset(bookedOffset),
    returnedOn: null,
    amount: 1000,
    notes: { en: '', ar: null },
  });
}

type MoveFacts = Omit<TransportMoveDto, 'status' | 'isLate' | 'availableActions'>;

/** Mirrors the API: status and permitted actions follow the timestamps. */
function rederiveMove(row: MoveFacts): TransportMoveDto {
  const actions: TransportMoveDto['availableActions'] = [];

  if (!row.cancelledAt && !row.arrivedAt) {
    if (!row.approvedAt) {
      actions.push('approve');
    } else if (!row.departedAt) {
      actions.push('depart');
    } else {
      actions.push('arrive');
    }

    actions.push('cancel');
  }

  return {
    ...row,
    status: deriveTransportStatus(row.approvedAt, row.departedAt, row.arrivedAt, row.cancelledAt),
    isLate:
      !row.departedAt &&
      !row.arrivedAt &&
      !row.cancelledAt &&
      row.scheduledFor < new Date().toISOString(),
    availableActions: actions,
  };
}

function fakeMove(
  id: string,
  options: { approved?: boolean; departed?: boolean; hoursOut?: number } = {},
): TransportMoveDto {
  const at = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();

  return rederiveMove({
    id,
    code: `TRP-${id}`,
    equipmentId: 'e1',
    equipmentCode: 'EQ-104',
    equipmentName: { en: 'Crawler Crane 80T', ar: 'ونش زاحف 80 طن' },
    projectId: 'p1',
    projectCode: 'PRJ-1001',
    projectName: { en: 'Downtown Tower', ar: 'برج وسط المدينة' },
    origin: { en: 'Yard A', ar: 'الساحة أ' },
    destination: { en: 'Downtown Tower', ar: 'برج وسط المدينة' },
    kind: 'Delivery',
    scheduledFor: at(options.hoursOut ?? 6),
    approvedAt: options.approved ? at(-5) : null,
    departedAt: options.departed ? at(-2) : null,
    arrivedAt: null,
    cancelledAt: null,
    cost: 500,
    notes: { en: '', ar: null },
  });
}

class FakeGateway {
  hasApi = true;

  projects: ProjectDto[] = [
    {
      id: 'p1',
      code: 'PRJ-1001',
      name: { en: 'Downtown Tower', ar: 'برج وسط المدينة' },
      client: { en: 'Finesco', ar: 'فينسكو' },
      manager: 'M. Hassan',
      location: { en: 'East Gate', ar: 'البوابة الشرقية' },
      status: 'Active',
      budget: 260000,
      progress: 76,
      startDate: null,
      endDate: null,
      equipmentSpend: 1,
      transportSpend: 2,
      extraSpend: 3,
      equipmentCount: 1,
    },
  ];

  equipment: EquipmentDto[] = [
    {
      id: 'e1',
      code: 'EQ-104',
      name: { en: 'Crawler Crane 80T', ar: 'ونش زاحف 80 طن' },
      equipmentTypeId: 't1',
      equipmentType: { en: 'Lifting', ar: 'رفع' },
      ownership: 'Owned',
      projectId: 'p1',
      projectCode: 'PRJ-1001',
      projectName: { en: 'Downtown Tower', ar: 'برج وسط المدينة' },
      status: 'Idle',
      utilization: 86,
      dailyCost: 1250,
      nextAction: { en: 'Inspect', ar: 'تفتيش' },
    },
  ];

  lastSaved: SaveEquipmentRequest | null = null;

  getProjects = () => Promise.resolve(this.projects);

  getEquipment = () => Promise.resolve(this.equipment);

  getEquipmentTypes = () =>
    Promise.resolve([{ id: 't1', code: 'LIFT', name: { en: 'Lifting', ar: 'رفع' } }]);

  createEquipment = (request: SaveEquipmentRequest) => {
    this.lastSaved = request;
    const created: EquipmentDto = { ...this.equipment[0], ...this.merge(request), id: 'e2' };
    this.equipment = [created, ...this.equipment];
    return Promise.resolve(created);
  };

  updateEquipment = (id: string, request: SaveEquipmentRequest) => {
    this.lastSaved = request;
    const index = this.equipment.findIndex((item) => item.id === id);
    const updated: EquipmentDto = { ...this.equipment[index], ...this.merge(request) };
    this.equipment = this.equipment.map((item, i) => (i === index ? updated : item));
    return Promise.resolve(updated);
  };

  deleteEquipment = (id: string) => {
    this.equipment = this.equipment.filter((item) => item.id !== id);
    return Promise.resolve();
  };

  createProject = () => Promise.resolve(this.projects[0]);
  updateProject = () => Promise.resolve(this.projects[0]);
  deleteProject = () => Promise.resolve();

  readLocal = <T>(_key: string, fallback: readonly T[]) => [...fallback];
  commitLocal = () => Promise.resolve();

  requests: RequestDto[] = [];

  getRequests = () => Promise.resolve(this.requests);

  /**
   * Rentals carry dates only, exactly as the API does. The status on each row
   * below is derived from those dates rather than chosen, so these fixtures
   * cannot drift into the contradiction the backend change removed.
   */
  rentals: RentalDto[] = [
    fakeRental('r1', -12, null),
    fakeRental('r2', 9, null),
    fakeRental('r3', 5, -1),
  ];

  vendors: VendorDto[] = [
    {
      id: 'v1',
      code: 'VEN-001',
      name: { en: 'Delta Heavy Rentals', ar: 'دلتا لتأجير المعدات الثقيلة' },
      contactName: 'K. Mansour',
      phone: '+965 2222 1180',
      email: 'hire@deltaheavy.com.kw',
      rentalCount: 3,
      openRentalCount: 3,
      totalSpend: 3000,
    },
  ];

  getRentals = () => Promise.resolve(this.rentals);

  getVendors = () => Promise.resolve(this.vendors);

  /**
   * Moves carry event timestamps, as the API does. Status and availableActions
   * are derived from them here too, so a fixture cannot describe a state the
   * real workflow would never produce.
   */
  moves: TransportMoveDto[] = [
    fakeMove('m1'),
    fakeMove('m2', { approved: true }),
    fakeMove('m3', { approved: true, departed: true }),
  ];

  getTransportMoves = () => Promise.resolve(this.moves);

  /** Applies the same guards the API applies, then re-derives. */
  transitionTransportMove = (id: string, action: string) => {
    const index = this.moves.findIndex((move) => move.id === id);
    const move = this.moves[index];

    if (!move.availableActions.includes(action as never)) {
      return Promise.reject({ error: { error: `Cannot ${action} this move.` } });
    }

    const at = new Date().toISOString();
    const updated = rederiveMove({
      ...move,
      approvedAt: action === 'approve' ? at : move.approvedAt,
      departedAt: action === 'depart' ? at : move.departedAt,
      arrivedAt: action === 'arrive' ? at : move.arrivedAt,
      cancelledAt: action === 'cancel' ? at : move.cancelledAt,
    });

    this.moves = this.moves.map((item, i) => (i === index ? updated : item));

    return Promise.resolve(updated);
  };

  /** Records the return and re-derives, exactly as the API would. */
  returnRental = (id: string, returnedOn: string | null) => {
    const index = this.rentals.findIndex((item) => item.id === id);
    const updated = rederive({
      ...this.rentals[index],
      returnedOn: returnedOn ?? isoOffset(0),
    });

    this.rentals = this.rentals.map((item, i) => (i === index ? updated : item));

    return Promise.resolve(updated);
  };

  bookRentalReturn = (id: string, bookedOn: string | null) => {
    const index = this.rentals.findIndex((item) => item.id === id);
    const updated = rederive({
      ...this.rentals[index],
      returnBookedOn: bookedOn ?? isoOffset(0),
    });

    this.rentals = this.rentals.map((item, i) => (i === index ? updated : item));

    return Promise.resolve(updated);
  };

  private merge(request: SaveEquipmentRequest): Partial<EquipmentDto> {
    return {
      code: request.code,
      name: request.name,
      equipmentTypeId: request.equipmentTypeId,
      ownership: request.ownership,
      projectId: request.projectId,
      status: request.status,
      utilization: request.utilization,
      dailyCost: request.dailyCost,
      nextAction: request.nextAction,
    };
  }
}

describe('App shell', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideNoopAnimations(), provideHttpClient()],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the sidebar and toolbar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-sidebar-nav')).toBeTruthy();
    expect(compiled.querySelector('app-top-toolbar')).toBeTruthy();
  });

  it('should render every navigation group', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Overview');
    expect(compiled.textContent).toContain('Main Data');
    expect(compiled.textContent).toContain('Project Operations');
    expect(compiled.textContent).toContain('Analytics');
  });

  it('should switch the document to Arabic right-to-left', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    TestBed.inject(I18nService).toggleLanguage();
    fixture.detectChanges();

    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });
});

describe('I18nService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('should translate UI keys for the active language', () => {
    const i18n = TestBed.inject(I18nService);

    expect(i18n.t('projectsOverview')).toBe('Projects overview');

    i18n.toggleLanguage();

    expect(i18n.t('projectsOverview')).toBe('نظرة عامة على المشاريع');
  });

  it('should localize digits to Arabic-Indic numerals', () => {
    const i18n = TestBed.inject(I18nService);

    expect(i18n.formatInteger(42)).toBe('42');

    i18n.toggleLanguage();

    expect(i18n.formatInteger(42)).toBe('٤٢');
  });

  it('should fill placeholders in formatted strings', () => {
    const i18n = TestBed.inject(I18nService);

    expect(i18n.format('confirmDeleteMessage', { name: 'Crawler Crane 80T' })).toContain(
      'Crawler Crane 80T',
    );
  });

  it('should fall back to the raw value for untranslated data', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.toggleLanguage();

    expect(i18n.text('Some New Project')).toBe('Some New Project');
  });
});

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('theme-dark', 'theme-light');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('theme-dark', 'theme-light');
  });

  it('should default to following the system, not a frozen value', () => {
    expect(TestBed.inject(ThemeService).preference()).toBe('system');
  });

  it('should NOT write storage until the user makes an explicit choice', () => {
    const theme = TestBed.inject(ThemeService);
    TestBed.tick();

    // Regression guard. Persisting the resolved value here is what used to
    // freeze the OS preference on first visit and stop `system` working.
    expect(theme.resolved()).toMatch(/^(light|dark)$/);
    expect(localStorage.getItem('constructerp.theme')).toBeNull();
  });

  it('should apply an explicit theme class to the document element', () => {
    const theme = TestBed.inject(ThemeService);
    theme.select('dark');
    TestBed.tick();

    expect(theme.isDark()).toBeTrue();
    expect(document.documentElement.classList.contains('theme-dark')).toBeTrue();
    expect(document.documentElement.classList.contains('theme-light')).toBeFalse();
  });

  it('should persist an explicit choice so it survives a reload', () => {
    TestBed.inject(ThemeService).select('dark');
    TestBed.tick();

    expect(localStorage.getItem('constructerp.theme')).toBe('dark');
  });

  it('should persist "system" as a choice in its own right', () => {
    const theme = TestBed.inject(ThemeService);
    theme.select('dark');
    theme.select('system');
    TestBed.tick();

    expect(localStorage.getItem('constructerp.theme')).toBe('system');
    expect(theme.preference()).toBe('system');
  });

  it('should restore a stored preference over the system setting', () => {
    localStorage.setItem('constructerp.theme', 'light');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const theme = TestBed.inject(ThemeService);

    expect(theme.preference()).toBe('light');
    expect(theme.resolved()).toBe('light');
  });

  it('should cycle light to dark to system', () => {
    const theme = TestBed.inject(ThemeService);
    theme.select('light');

    theme.cycle();
    expect(theme.preference()).toBe('dark');

    theme.cycle();
    expect(theme.preference()).toBe('system');

    theme.cycle();
    expect(theme.preference()).toBe('light');
  });
});

describe('SearchService', () => {
  beforeEach(() => {
    localStorage.clear();
    // SearchService -> ErpStore -> ErpGateway -> HttpClient.
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
  });

  afterEach(() => localStorage.clear());

  it('should return nothing for an empty query', () => {
    const search = TestBed.inject(SearchService);

    expect(search.hasQuery()).toBeFalse();
    expect(search.groups()).toEqual([]);
  });

  it('should find records by English term', () => {
    const search = TestBed.inject(SearchService);
    search.query.set('excavator');

    expect(search.resultCount()).toBeGreaterThan(0);
    expect(search.groups().some((group) => group.module === 'equipment')).toBeTrue();
  });

  it('should find the same records by Arabic term while the UI is English', () => {
    const search = TestBed.inject(SearchService);

    search.query.set('excavator');
    const english = search.resultCount();

    search.query.set('حفار');

    // Regression guard: matching through i18n.text() restricted search to the
    // active UI language, so Arabic queries silently returned nothing.
    expect(search.resultCount()).toBe(english);
  });

  it('should fold Arabic-Indic digits so ٨٠ matches 80', () => {
    const search = TestBed.inject(SearchService);

    search.query.set('80');
    const latin = search.resultCount();

    search.query.set('٨٠');

    expect(search.resultCount()).toBe(latin);
    expect(latin).toBeGreaterThan(0);
  });

  it('should group results by module and cap each group', () => {
    const search = TestBed.inject(SearchService);
    search.query.set('a');

    for (const group of search.groups()) {
      expect(group.results.length).toBeLessThanOrEqual(4);
    }
  });
});

describe('Rentals', () => {
  let gateway: FakeGateway;

  beforeEach(async () => {
    localStorage.clear();
    gateway = new FakeGateway();
    TestBed.configureTestingModule({
      providers: [{ provide: ErpGateway, useValue: gateway }],
    });

    await TestBed.inject(ErpStore).load();
  });

  afterEach(() => localStorage.clear());

  it('should read overdue from the return date rather than a stored value', () => {
    const rentals = TestBed.inject(ErpStore).rentals();
    const today = new Date().toISOString().slice(0, 10);

    // Every row's status is checkable against the dates on the row itself.
    // Under the old model a status could say anything at all.
    for (const rental of rentals) {
      const expected = rental.returnedOn
        ? 'Returned'
        : rental.returnDate < today
          ? 'Overdue'
          : rental.returnBookedOn
            ? 'Return Scheduled'
            : 'Active';

      expect(rental.status).toBe(expected);
    }

    expect(rentals.filter((rental) => rental.status === 'Overdue').length).toBe(1);
  });

  it('should clear an overdue rental by recording the return, not by editing a status', async () => {
    const store = TestBed.inject(ErpStore);
    const overdue = store.rentals().find((rental) => rental.status === 'Overdue');

    expect(overdue).toBeTruthy();
    expect(overdue!.daysOverdue).toBeGreaterThan(0);

    await store.returnRental(overdue!.id);

    const after = store.rentals().find((rental) => rental.id === overdue!.id);

    expect(after!.status).toBe('Returned');
    expect(after!.daysOverdue).toBe(0);
    expect(store.rentals().filter((rental) => rental.status === 'Overdue').length).toBe(0);
  });

  it('should keep a booked return overdue once its due date has passed', async () => {
    const store = TestBed.inject(ErpStore);
    const active = store.rentals().find((rental) => rental.status === 'Active');

    await store.bookRentalReturn(active!.id);

    expect(store.rentals().find((r) => r.id === active!.id)!.status).toBe('Return Scheduled');

    // The collection was booked but never happened, and the due date has now
    // passed. It must go back to being chased rather than hide as scheduled.
    gateway.rentals = gateway.rentals.map((rental) =>
      rental.id === active!.id ? rederive({ ...rental, expectedReturnOn: isoOffset(-2) }) : rental,
    );
    await store.load();

    const late = store.rentals().find((rental) => rental.id === active!.id);

    expect(late!.status).toBe('Overdue');
    expect(late!.returnBookedOn).not.toBeNull();
  });

  it('should localise the vendor name without refetching', () => {
    const store = TestBed.inject(ErpStore);

    expect(store.rentals()[0].vendor).toBe('Delta Heavy Rentals');

    TestBed.inject(I18nService).toggleLanguage();

    expect(store.rentals()[0].vendor).toBe('دلتا لتأجير المعدات الثقيلة');
  });
});

describe('Transport', () => {
  let gateway: FakeGateway;

  beforeEach(async () => {
    localStorage.clear();
    gateway = new FakeGateway();
    TestBed.configureTestingModule({
      providers: [{ provide: ErpGateway, useValue: gateway }],
    });

    await TestBed.inject(ErpStore).load();
  });

  afterEach(() => localStorage.clear());

  it('should read each status from the events recorded against the move', () => {
    const moves = TestBed.inject(ErpStore).transportMoves();

    for (const move of moves) {
      const expected = move.cancelledAt
        ? 'Cancelled'
        : move.arrivedAt
          ? 'Completed'
          : move.departedAt
            ? 'In Transit'
            : move.approvedAt
              ? 'Scheduled'
              : 'Awaiting Approval';

      expect(move.status).toBe(expected);
    }

    expect(moves.map((move) => move.status)).toEqual([
      'Awaiting Approval',
      'Scheduled',
      'In Transit',
    ]);
  });

  it('should not offer departure on a move that has not been approved', () => {
    const store = TestBed.inject(ErpStore);
    const pending = store.transportMoves().find((move) => move.status === 'Awaiting Approval');

    // The gate, expressed as the absence of a button rather than a disabled one.
    expect(pending!.availableActions).not.toContain('depart');
    expect(pending!.availableActions).toContain('approve');
  });

  it('should reach In Transit only by recording a departure', async () => {
    const store = TestBed.inject(ErpStore);
    const move = store.transportMoves().find((m) => m.status === 'Awaiting Approval')!;

    await store.transitionTransportMove(move.id, 'approve');

    const approved = store.transportMoves().find((m) => m.id === move.id);
    expect(approved!.status).toBe('Scheduled');
    expect(approved!.availableActions).toContain('depart');

    await store.transitionTransportMove(move.id, 'depart');

    const departed = store.transportMoves().find((m) => m.id === move.id);
    expect(departed!.status).toBe('In Transit');
    expect(departed!.departedAt).not.toBeNull();
  });

  it('should refuse a transition the workflow does not allow', async () => {
    const store = TestBed.inject(ErpStore);
    const pending = store.transportMoves().find((m) => m.status === 'Awaiting Approval')!;

    await expectAsync(store.transitionTransportMove(pending.id, 'depart')).toBeRejected();

    // And nothing moved: a refused transition records no event.
    expect(store.transportMoves().find((m) => m.id === pending.id)!.status).toBe(
      'Awaiting Approval',
    );
  });

  it('should flag a move that missed its slot without anyone marking it', async () => {
    const store = TestBed.inject(ErpStore);

    // Booked three hours ago, approved, never departed.
    gateway.moves = [fakeMove('late1', { approved: true, hoursOut: -3 })];
    await store.load();

    const late = store.transportMoves()[0];
    expect(late.isLate).toBeTrue();

    // Recording the departure clears it — no "late" field was ever written.
    await store.transitionTransportMove(late.id, 'depart');

    expect(store.transportMoves()[0].isLate).toBeFalse();
  });

  it('should localise the route without refetching', () => {
    const store = TestBed.inject(ErpStore);

    expect(store.transportMoves()[0].origin).toBe('Yard A');

    TestBed.inject(I18nService).toggleLanguage();

    expect(store.transportMoves()[0].origin).toBe('الساحة أ');
  });
});

describe('NotificationsService', () => {
  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: ErpGateway, useValue: new FakeGateway() }],
    });

    await TestBed.inject(ErpStore).load();
  });

  afterEach(() => localStorage.clear());

  it('should derive one entry per overdue rental', () => {
    const notifications = TestBed.inject(NotificationsService);
    const store = TestBed.inject(ErpStore);
    const overdue = store.rentals().filter((rental) => rental.status === 'Overdue').length;

    const entries = notifications
      .notifications()
      .filter((item) => item.key.startsWith('rental-overdue:'));

    expect(entries.length).toBe(overdue);
  });

  it('should drop the unread count when an entry is opened', () => {
    const notifications = TestBed.inject(NotificationsService);
    const before = notifications.unreadCount();
    const first = notifications.notifications()[0];

    expect(before).toBeGreaterThan(0);

    notifications.markRead(first.key);

    // The badge must move when the user acts. `count` deliberately does NOT:
    // the issue is still open until the underlying record is fixed.
    expect(notifications.unreadCount()).toBe(before - 1);
    expect(notifications.count()).toBe(before);
    expect(notifications.notifications()[0].read).toBeTrue();
  });

  it('should clear the badge when everything is marked read', () => {
    const notifications = TestBed.inject(NotificationsService);
    notifications.markAllRead();

    expect(notifications.unreadCount()).toBe(0);
    expect(notifications.hasUnread()).toBeFalse();
    expect(notifications.count()).toBeGreaterThan(0);
  });

  it('should treat a recurring issue as unread again', async () => {
    const notifications = TestBed.inject(NotificationsService);
    const store = TestBed.inject(ErpStore);
    const idle = store.equipment().find((item) => item.status === 'Idle');

    notifications.markAllRead();
    expect(notifications.hasUnread()).toBeFalse();

    // Resolve it, then let it recur: the read flag must not persist across the
    // gap, or a genuinely new occurrence would arrive silently pre-read.
    await store.updateEquipment(idle!.id, { ...idle!, status: 'Working' });
    notifications.markAllRead();
    await store.updateEquipment(idle!.id, { ...idle!, status: 'Idle' });

    expect(
      notifications.notifications().some((n) => n.key === `asset:${idle!.id}` && !n.read),
    ).toBeTrue();
  });

  it('should disappear when the underlying record is fixed', async () => {
    const notifications = TestBed.inject(NotificationsService);
    const store = TestBed.inject(ErpStore);
    const idle = store.equipment().find((item) => item.status === 'Idle');

    expect(idle).toBeTruthy();
    expect(notifications.notifications().some((n) => n.key === `asset:${idle!.id}`)).toBeTrue();

    await store.updateEquipment(idle!.id, { ...idle!, status: 'Working' });

    // The feed is derived, not stored — nothing needs dismissing.
    expect(notifications.notifications().some((n) => n.key === `asset:${idle!.id}`)).toBeFalse();
  });
});

describe('ExportService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  /** Captures the generated file instead of triggering a real download. */
  function blobFrom(run: (service: ExportService) => void): Blob {
    let captured: Blob | undefined;

    spyOn(URL, 'createObjectURL').and.callFake((source: Blob | MediaSource) => {
      captured = source as Blob;
      return 'blob:stub';
    });
    spyOn(URL, 'revokeObjectURL');

    run(TestBed.inject(ExportService));

    if (!captured) {
      throw new Error('exportCsv did not produce a blob');
    }

    return captured;
  }

  async function csvFrom(run: (service: ExportService) => void): Promise<string> {
    return blobFrom(run).text();
  }

  it('should start with a UTF-8 BOM so Excel reads Arabic correctly', async () => {
    const blob = blobFrom((service) =>
      service.exportCsv(
        'test',
        [{ header: 'Name', value: (r: { name: string }) => r.name }],
        [{ name: 'ونش زاحف' }],
      ),
    );

    // Must be checked as BYTES: Blob.text() decodes UTF-8 and strips a leading
    // U+FEFF, so reading it as a string always hides whether the BOM shipped.
    const bytes = new Uint8Array(await blob.arrayBuffer());

    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);
    expect(await blob.text()).toContain('ونش زاحف');
  });

  it('should quote values containing commas and double embedded quotes', async () => {
    const csv = await csvFrom((service) =>
      service.exportCsv(
        'test',
        [{ header: 'Name', value: (r: { name: string }) => r.name }],
        [{ name: 'Ring Road, Package "B"' }],
      ),
    );

    // Unquoted, this row would silently split into two columns.
    expect(csv).toContain('"Ring Road, Package ""B"""');
  });

  it('should emit a header row followed by one row per record', async () => {
    const csv = await csvFrom((service) =>
      service.exportCsv(
        'test',
        [
          { header: 'Id', value: (r: { id: string; qty: number }) => r.id },
          { header: 'Qty', value: (r: { id: string; qty: number }) => r.qty },
        ],
        [
          { id: 'EQ-1', qty: 2 },
          { id: 'EQ-2', qty: 5 },
        ],
      ),
    );

    const lines = csv.replace('﻿', '').trim().split('\r\n');

    expect(lines[0]).toBe('Id,Qty');
    expect(lines[1]).toBe('EQ-1,2');
    expect(lines.length).toBe(3);
  });
});

describe('BusyState', () => {
  it('should report only the running action as busy', async () => {
    const busy = new BusyState();
    // Definite assignment: the executor runs synchronously, so `release` is
    // set before the next line. Avoids an empty placeholder function.
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const running = busy.run('save:1', () => gate);

    expect(busy.is('save:1')).toBeTrue();
    expect(busy.is('save:2')).toBeFalse();
    expect(busy.any).toBeTrue();

    release();
    await running;

    expect(busy.is('save:1')).toBeFalse();
    expect(busy.any).toBeFalse();
  });

  it('should clear the gear when the action fails', async () => {
    const busy = new BusyState();

    await expectAsync(busy.run('save', () => Promise.reject(new Error('boom')))).toBeRejected();

    // A stuck gear would leave every button on the screen disabled forever.
    expect(busy.any).toBeFalse();
  });
});

describe('ErpStore', () => {
  let gateway: FakeGateway;

  beforeEach(async () => {
    localStorage.clear();
    gateway = new FakeGateway();
    TestBed.configureTestingModule({
      providers: [{ provide: ErpGateway, useValue: gateway }],
    });

    await TestBed.inject(ErpStore).load();
  });

  afterEach(() => localStorage.clear());

  it('should map API DTOs into English view models', () => {
    const store = TestBed.inject(ErpStore);

    expect(store.equipment()[0].name).toBe('Crawler Crane 80T');
    expect(store.equipment()[0].type).toBe('Lifting');
    expect(store.projects()[0].name).toBe('Downtown Tower');
  });

  it('should re-derive names in Arabic without refetching', () => {
    const store = TestBed.inject(ErpStore);
    TestBed.inject(I18nService).toggleLanguage();

    // The whole point of holding DTOs: switching language is a re-map, not a
    // round trip.
    expect(store.equipment()[0].name).toBe('ونش زاحف 80 طن');
    expect(store.projects()[0].name).toBe('برج وسط المدينة');
  });

  it('should count linked equipment by project ID, not name', () => {
    const store = TestBed.inject(ErpStore);

    expect(store.equipmentCountForProject('p1')).toBe(1);
    // A project name must no longer match anything — that was the old bug.
    expect(store.equipmentCountForProject('Downtown Tower')).toBe(0);
  });

  it('should preserve the other language when saving an edit', async () => {
    const store = TestBed.inject(ErpStore);
    TestBed.inject(I18nService).toggleLanguage();

    const asset = store.equipment()[0];
    await store.updateEquipment(asset.id, { ...asset, name: 'اسم جديد' });

    // Editing in Arabic must not wipe the English name, or half the record is
    // silently destroyed on every save.
    const saved = gateway.lastSaved as { name: { en: string; ar: string } };
    expect(saved.name.ar).toBe('اسم جديد');
    expect(saved.name.en).toBe('Crawler Crane 80T');
  });

  it('should derive fleet totals from the loaded equipment', () => {
    const store = TestBed.inject(ErpStore);

    expect(store.totals().total).toBe(1);
    expect(store.totals().idle).toBe(1);
    expect(store.totals().dailySpend).toBe(1250);
  });

  it('should allocate sequential codes per entity', () => {
    const store = TestBed.inject(ErpStore);

    expect(store.nextProjectCode()).toMatch(/^PRJ-\d{4}$/);
    expect(store.nextEquipmentCode()).toMatch(/^EQ-\d{4}$/);
    expect(store.nextRequestCode()).toMatch(/^REQ-\d{4}$/);
  });
});
