import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';
import { ErpStore } from './core/services/erp-store';
import { I18nService } from './core/services/i18n';
import { ThemeService } from './core/services/theme';
import { BusyState } from './shared/utils/busy-state';

describe('App shell', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideNoopAnimations()],
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
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('should derive fleet totals from equipment', () => {
    const store = TestBed.inject(ErpStore);
    const totals = store.totals();

    expect(totals.total).toBe(store.equipment().length);
    expect(totals.rented).toBe(
      store.equipment().filter((item) => item.ownership === 'External Rental').length,
    );
  });

  it('should recompute totals after a create, with no manual invalidation', async () => {
    const store = TestBed.inject(ErpStore);
    const before = store.totals().total;

    await store.createEquipment({
      id: store.nextEquipmentId(),
      name: 'Test Rig',
      type: 'Lifting',
      ownership: 'Owned',
      project: 'Downtown Tower',
      status: 'Working',
      utilization: 50,
      dailyCost: 100,
      nextAction: '',
    });

    expect(store.totals().total).toBe(before + 1);
  });

  it('should keep a selection valid after the selected asset is deleted', async () => {
    const store = TestBed.inject(ErpStore);
    const selected = store.selectedEquipmentId();

    await store.deleteEquipment(selected);

    expect(store.selectedEquipmentId()).not.toBe(selected);
    expect(store.selectedEquipment()).toBeTruthy();
  });

  it('should apply the change to state before the commit resolves', async () => {
    const store = TestBed.inject(ErpStore);
    const before = store.totals().total;

    // Not awaited yet: the table should already reflect the change while the
    // button is still showing its gear.
    const pending = store.createEquipment({
      id: store.nextEquipmentId(),
      name: 'Optimistic Rig',
      type: 'Lifting',
      ownership: 'Owned',
      project: 'Downtown Tower',
      status: 'Working',
      utilization: 10,
      dailyCost: 10,
      nextAction: '',
    });

    expect(store.totals().total).toBe(before + 1);
    await pending;
    expect(store.totals().total).toBe(before + 1);
  });

  it('should allocate sequential ids per entity', () => {
    const store = TestBed.inject(ErpStore);

    expect(store.nextProjectCode()).toMatch(/^PRJ-\d{4}$/);
    expect(store.nextEquipmentId()).toMatch(/^EQ-\d{4}$/);
    expect(store.nextRequestId()).toMatch(/^REQ-\d{4}$/);
  });
});
