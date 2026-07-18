import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the prototype heading', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-shell')?.getAttribute('dir')).toBe('ltr');
    expect(compiled.querySelector('.app-shell')?.getAttribute('lang')).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Equipment, rentals, inspections, and project costs in one view',
    );
  });

  it('should navigate between prototype modules', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Inspections'))?.click();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Photos, videos, notes, and signatures');
  });

  it('should open the equipment request and receiving flow', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Requests'))?.click();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Request, approve, receive, and inspect before use');
    expect(compiled.textContent).toContain('Checks before receiving');
  });

  it('should open requests from the new request shortcut', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('New Request'))?.click();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('REQ-2407');
  });

  it('should open project portfolio details', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Projects'))?.click();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Project equipment cost, activity, and status');
    expect(compiled.textContent).toContain('PRJ-1001');
  });

  it('should keep Arabic RTL and English LTR on the app and document', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const shell = compiled.querySelector('.app-shell');
    const languageToggle = compiled.querySelector('.lang-toggle') as HTMLButtonElement;

    expect(shell?.getAttribute('dir')).toBe('ltr');
    expect(shell?.getAttribute('lang')).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');

    languageToggle.click();
    fixture.detectChanges();

    expect(shell?.getAttribute('dir')).toBe('rtl');
    expect(shell?.getAttribute('lang')).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');

    languageToggle.click();
    fixture.detectChanges();

    expect(shell?.getAttribute('dir')).toBe('ltr');
    expect(shell?.getAttribute('lang')).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('should switch to Arabic and apply RTL direction', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('عربي'))?.click();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-shell')?.getAttribute('dir')).toBe('rtl');
    expect(compiled.textContent).toContain('إدارة المعدات والإيجارات والتفتيشات');
  });
});
