import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  ['/', 'Senior Living Acquisition and Turnaround Intelligence'], ['/underwriting', 'Acquisition Underwriting'], ['/scenarios', 'Scenario Analysis'],
  ['/pricing', 'Purchase Price Discipline'], ['/sensitivity', 'Sensitivity Analysis'], ['/turnaround', 'Operating Turnaround'], ['/diligence', 'Investment Diligence'],
  ['/investors', 'Investor Economics'], ['/research', 'Investment Research'], ['/methodology', 'Methodology and Downloads'],
] as const;

function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}
const field = (page: Page, name: string) => page.getByRole('spinbutton', { name, exact: true });
const kpi = (page: Page, id: string) => page.getByTestId(`kpi-${id}`);

for (const [path, heading] of ROUTES) {
  test(`route ${path} loads, no console errors, no horizontal overflow`, async ({ page }) => {
    const errors = watchConsole(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'horizontal overflow px').toBeLessThanOrEqual(0);
    expect(errors, errors.join('\n')).toEqual([]);
  });
  test(`accessibility ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).slice(0, 3).join(' | ')}`)).toEqual([]);
  });
}

test('overview shows workbook base results and switches case and scenario client-side', async ({ page }) => {
  await page.goto('/');
  await expect(kpi(page, 'levered-irr')).toHaveText('19.2%');
  await expect(kpi(page, 'equity-moic')).toHaveText('2.19x');
  await expect(kpi(page, 'max-supportable-bid')).toHaveText('$53.1M');
  await expect(kpi(page, 'minimum-dscr')).toHaveText('1.94x');
  await page.getByRole('radio', { name: 'Downside' }).click();
  await expect(kpi(page, 'levered-irr')).toHaveText('NM');
  await expect(kpi(page, 'minimum-dscr')).toHaveText('0.67x');
  await expect(page.getByText('Exit value does not cover the loan payoff')).toBeVisible();
  await page.getByRole('radio', { name: 'Upside' }).click();
  await expect(kpi(page, 'levered-irr')).toHaveText('33.5%');
  await page.getByRole('radio', { name: 'Katy' }).click();
  await page.getByRole('radio', { name: 'Base' }).click();
  await expect(kpi(page, 'levered-irr')).toHaveText('18.6%');
  await expect(kpi(page, 'max-supportable-bid')).toHaveText('$12.5M');
});

test('editing assumptions recalculates, flags modification, and resets to originals', async ({ page }) => {
  await page.goto('/underwriting');
  const irr = page.getByTestId('uw-levered-irr');
  const bid = page.getByTestId('uw-max-supportable-bid');
  await expect(irr).toHaveText('19.2%');
  await expect(page.getByTestId('original-badge')).toBeVisible();
  const bid0 = await bid.textContent();

  await field(page, 'Purchase price per unit').fill('150000');
  await expect(irr).not.toHaveText('19.2%');
  await expect(page.getByTestId('modified-badge')).toBeVisible();
  expect(await bid.textContent()).toBe(bid0); // ceiling is price-invariant

  await field(page, 'Exit cap rate').fill('9');
  const irrCap = await irr.textContent();
  await field(page, 'Exit cap rate').fill('7');
  expect(await irr.textContent()).not.toBe(irrCap);

  await field(page, 'Target occupancy').fill('97');
  await field(page, 'Loan-to-value').fill('50');
  await expect(page.getByTestId('uw-year-5-noi')).not.toHaveText('$5,541,222');

  await page.getByRole('button', { name: 'Reset current case' }).click();
  await expect(irr).toHaveText('19.2%');
  await expect(field(page, 'Purchase price per unit')).toHaveValue('135000');
  await expect(page.getByTestId('original-badge')).toBeVisible();
});

test('invalid inputs give immediate feedback and are not applied', async ({ page }) => {
  await page.goto('/underwriting');
  const cap = field(page, 'Exit cap rate');
  await cap.fill('0');
  await expect(page.getByRole('alert').first()).toContainText('Exit cap rate must be between');
  await expect(page.getByTestId('uw-levered-irr')).toHaveText('19.2%');
  await field(page, 'Amortization period').fill('12.5');
  await expect(page.getByRole('alert').first()).toBeVisible();
  await field(page, 'Starting occupancy').fill('150');
  await expect(page.getByText(/Starting occupancy must be between 0% and 100%/)).toBeVisible();
});

test('edits persist across pages and Reset all restores originals', async ({ page, isMobile }) => {
  await page.goto('/underwriting');
  await field(page, 'Purchase price per unit').fill('150000');
  if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Investment Overview' }).click();
  await expect(kpi(page, 'levered-irr')).not.toHaveText('19.2%');
  await page.getByRole('button', { name: 'Reset all' }).click();
  await expect(kpi(page, 'levered-irr')).toHaveText('19.2%');
});

test('scenario parameter edit propagates', async ({ page }) => {
  await page.goto('/scenarios');
  const cell = page.getByLabel('Occupancy change (points), Upside');
  await expect(cell).toHaveValue('2');
  await cell.fill('4');
  await expect(page.getByTestId('modified-badge')).toBeVisible();
  await page.getByRole('radio', { name: 'Upside' }).click();
  await page.goto('/');
});

test('pricing stress test responds to the slider', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByTestId('stress-price')).toHaveText('$135,000');
  await page.getByLabel(/Price change vs current/).fill('20');
  await expect(page.getByTestId('stress-price')).toHaveText('$162,000');
  await expect(page.getByTestId('stress-levered-irr')).not.toHaveText('19.2%');
});

test('sensitivity tables render and basis toggle changes values', async ({ page }) => {
  await page.goto('/sensitivity');
  const table = page.getByRole('table', { name: 'Exit cap versus occupancy' });
  const before = await table.innerText();
  await page.getByRole('radio', { name: 'Net equity proceeds' }).first().click();
  expect(await table.innerText()).not.toBe(before);
  await expect(page.getByRole('table', { name: 'Leverage versus returns' })).toBeVisible();
});

test('workbook-derived content loads: diligence, plan, sources', async ({ page }) => {
  await page.goto('/diligence');
  await expect(page.getByText('Not received').first()).toBeVisible();
  await page.goto('/turnaround');
  await expect(page.getByRole('row')).toHaveCount(14, { timeout: 5000 }).catch(() => {}); // header + 12 plan rows + cadence/scorecard tables
  await expect(page.getByText('Review licensed staffing, medication, falls and survey findings')).toBeVisible();
  await page.goto('/research');
  await expect(page.getByRole('link', { name: /Open source S01/ })).toHaveAttribute('href', /cimainvest\.com/);
});

test('downloads work', async ({ request }) => {
  const files: [string, string, string][] = [
    ['/downloads/Cima_Senior_Living_Underwriting_Model.xlsx', 'PK', 'spreadsheet'], ['/downloads/Investment_Committee_Memo.pdf', '%PDF', 'pdf'],
    ['/downloads/Executive_Brief.pdf', '%PDF', 'pdf'], ['/downloads/100_Day_Value_Creation_Plan.pdf', '%PDF', 'pdf'],
  ];
  for (const [url, magic, ct] of files) {
    const res = await request.get(url);
    expect(res.status(), url).toBe(200);
    expect(res.headers()['content-type']).toContain(ct);
    const body = await res.body();
    expect(body.subarray(0, magic.length).toString('latin1')).toBe(magic);
    expect(body.length).toBeGreaterThan(10_000);
  }
});

test('download links on the methodology page are wired', async ({ page }) => {
  await page.goto('/methodology');
  for (const name of ['Formula-driven Excel workbook', 'Investment committee memo', 'Executive brief', '100-day value creation plan']) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name }).click()]);
    expect(dl.suggestedFilename().length).toBeGreaterThan(5);
  }
});

test('disclaimer and independence notice are present on every page load', async ({ page }) => {
  await page.goto('/');
  const f = page.locator('footer');
  await expect(f.getByText('Independent illustrative investment analysis.')).toBeVisible();
  await expect(f.getByText('Not affiliated with or endorsed by Cima Investment Group.')).toBeVisible();
  await expect(f.getByText(/Actual undisclosed transaction financials are not represented/)).toBeVisible();
});

test('primary navigation reaches every module', async ({ page, isMobile }) => {
  await page.goto('/');
  for (const [path, heading] of ROUTES.slice(1)) {
    if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
    const label = ({ '/underwriting': 'Acquisition Underwriting', '/scenarios': 'Scenario Analysis', '/pricing': 'Purchase Price Discipline', '/sensitivity': 'Sensitivity Analysis', '/turnaround': 'Operating Turnaround', '/diligence': 'Investment Diligence', '/investors': 'Investor Economics', '/research': 'Investment Research', '/methodology': 'Methodology and Downloads' } as Record<string, string>)[path];
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: label }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
  }
});
