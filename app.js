const STORAGE_KEY = "life-coach-v1";

const defaultState = {
  budget: {
    revenue: [
      { id: "attain", label: "Attain Payments / Employment Income", budget: 9330.66, actual: 0 },
      { id: "rental", label: "Rental Income — Cathy Jason", budget: 1200, actual: 0 },
      { id: "other-income", label: "Other Operating Income", budget: 0, actual: 0 }
    ],
    sections: [
      {
        name: "Housing & Property Operations",
        items: [
          { id: "rent", label: "Current Home Rent", budget: 1350, actual: 0 },
          { id: "mortgage", label: "Airbnb Mortgage", budget: 2000, actual: 0 },
          { id: "utilities", label: "Power / Water / Gas", budget: 500, actual: 0 },
          { id: "internet", label: "Internet", budget: 100, actual: 0 },
          { id: "phone", label: "Phone", budget: 100, actual: 0 },
          { id: "insurance", label: "Insurance", budget: 300, actual: 0 },
          { id: "pest", label: "Pest Control — Both Homes", budget: 150, actual: 0 },
          { id: "storage", label: "Storage", budget: 266, actual: 0 }
        ]
      },
      {
        name: "Health & Food",
        items: [
          { id: "groceries", label: "Groceries", budget: 600, actual: 0 },
          { id: "protein", label: "Protein / Supplements", budget: 200, actual: 0 },
          { id: "gym", label: "Gym", budget: 30, actual: 0 },
          { id: "eating-out", label: "Eating Out / Delivery", budget: 100, actual: 0 }
        ]
      },
      {
        name: "Transportation",
        items: [
          { id: "fuel", label: "Fuel", budget: 250, actual: 0 },
          { id: "vehicle", label: "Maintenance / Repairs", budget: 100, actual: 0 }
        ]
      },
      {
        name: "Business Operations",
        items: [
          { id: "workspace", label: "Google Workspace", budget: 20, actual: 0 },
          { id: "quickbooks", label: "QuickBooks", budget: 40, actual: 0 },
          { id: "mailbox", label: "Anytime Mailbox", budget: 20, actual: 0 },
          { id: "software", label: "Apps / Software", budget: 70, actual: 0 }
        ]
      },
      {
        name: "Debt Service",
        items: [
          { id: "boa-personal", label: "BOA Personal — 2 Payments", budget: 1000, actual: 0 },
          { id: "boa-business", label: "BOA Business — 2 Payments", budget: 750, actual: 0 },
          { id: "chase", label: "Chase Freedom — 2 Payments", budget: 500, actual: 0 },
          { id: "fidelity", label: "Fidelity Emergency Debt", budget: 300, actual: 0 }
        ]
      },
      {
        name: "Investing",
        items: [
          { id: "webull", label: "Webull", budget: 400, actual: 0 },
          { id: "crypto-investing", label: "Crypto Contributions", budget: 800, actual: 0 }
        ]
      },
      {
        name: "Lifestyle",
        items: [
          { id: "streaming", label: "Streaming / Sling", budget: 50, actual: 0 },
          { id: "shopping", label: "Needs-Based Shopping / Amazon", budget: 150, actual: 0 },
          { id: "misc", label: "Miscellaneous", budget: 200, actual: 0 }
        ]
      }
    ]
  },
  gapSpending: [],
  cashAccounts: [],
  health: {
    startWeight: 224.2,
    goalWeight: 199.9,
    ultimateWeight: 150,
    weighIns: [],
    daily: {},
    nutrition: {},
    foodLog: []
  },
  tradingAccounts: [],
  crypto: {
    startDate: "2026-07-23",
    startBalance: 1000,
    dailyRatePercent: 0.5,
    entries: []
  }
};

let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaultState);
    saved.health = saved.health || structuredClone(defaultState.health);
    saved.health.daily = saved.health.daily || {};
    saved.health.nutrition = saved.health.nutrition || {};
    saved.health.weighIns = saved.health.weighIns || [];
    saved.health.foodLog = saved.health.foodLog || [];
    saved.cashAccounts = saved.cashAccounts || [];
    saved.tradingAccounts = saved.tradingAccounts || [];
    saved.tradingAccounts.forEach(account => {
      account.transactions = account.transactions || [];
      if (account.kind === "crypto" && account.baseBalance === undefined) account.baseBalance = Number(account.startingBalance || 0);
      if (account.kind === "prop") {
        if (account.currentBalance === undefined) account.currentBalance = Number(account.accountSize || 0);
        if (account.baseBalance === undefined) account.baseBalance = Number(account.currentBalance || account.accountSize || 0);
        if (account.todayStartingBalance === undefined) account.todayStartingBalance = Number(account.currentBalance || account.accountSize || 0);
        if (account.programType === "step") account.programType = "one-step";
      }
    });
    [...saved.budget.revenue, ...saved.budget.sections.flatMap(s => s.items)].forEach(item => {
      if (item.varianceAdjustment === undefined) item.varianceAdjustment = 0;
    });
    return saved;
  } catch {
    return structuredClone(defaultState);
  }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}
function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value || 0));
}
function percent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}
function isoToday() {
  return new Date().toISOString().slice(0,10);
}
function daysBetween(start, end) {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  return Math.max(0, Math.floor((e - s) / 86400000));
}
function cryptoGoalForDate(date) {
  const day = daysBetween(state.crypto.startDate, date);
  const rate = state.crypto.dailyRatePercent / 100;
  return { day, goal: state.crypto.startBalance * Math.pow(1 + rate, day) };
}
function getBudgetTotals() {
  const revenueBudget = state.budget.revenue.reduce((s, x) => s + Number(x.budget || 0), 0);
  const revenueActual = state.budget.revenue.reduce((s, x) => s + Number(x.actual || 0), 0);
  const expenseItems = state.budget.sections.flatMap(s => s.items);
  const expenseBudget = expenseItems.reduce((s, x) => s + Number(x.budget || 0), 0);
  const expenseActual = expenseItems.reduce((s, x) => s + Number(x.actual || 0), 0);
  const gapActual = state.gapSpending.reduce((s, x) => s + Number(x.amount || 0), 0);
  const debtSection = state.budget.sections.find(s => s.name === "Debt Service");
  const debtActual = debtSection.items.reduce((s, x) => s + Number(x.actual || 0), 0);
  return { revenueBudget, revenueActual, expenseBudget, expenseActual, gapActual, debtActual, netActual: revenueActual - expenseActual - gapActual };
}



function openCashAccountDialog(id=null) {
  const form = document.querySelector("#cash-account-form");
  form.reset();
  const account = id ? state.cashAccounts.find(x => x.id === id) : null;
  document.querySelector("#cash-account-dialog-title").textContent = account ? "Edit cash account" : "Add cash account";
  form.elements.accountId.value = account?.id || "";
  form.elements.name.value = account?.name || "";
  form.elements.type.value = account?.type || "checking";
  form.elements.balance.value = account?.balance ?? "";
  document.querySelector("#cash-account-dialog").showModal();
}
function renderCashAccounts() {
  const checking = state.cashAccounts.filter(x => x.type === "checking").reduce((sum,x) => sum + Number(x.balance || 0), 0);
  const savings = state.cashAccounts.filter(x => x.type === "savings").reduce((sum,x) => sum + Number(x.balance || 0), 0);
  document.querySelector("#finance-checking-total").textContent = money(checking);
  document.querySelector("#finance-savings-total").textContent = money(savings);
  document.querySelector("#finance-cash-total").textContent = money(checking + savings);
  const grid = document.querySelector("#cash-account-grid");
  grid.innerHTML = state.cashAccounts.length ? "" : `<article class="cash-account-card"><p class="muted">Add your checking and savings accounts to see the cash you can use for your living budget.</p></article>`;
  state.cashAccounts.forEach(account => {
    grid.insertAdjacentHTML("beforeend", `<article class="cash-account-card">
      <header><div><h4>${account.name}</h4><span class="account-type">${account.type}</span></div></header>
      <strong>${money(account.balance)}</strong>
      <div class="cash-account-actions"><button class="button secondary edit-cash-account" data-id="${account.id}">Edit balance</button><button class="button secondary delete-cash-account" data-id="${account.id}">Remove</button></div>
    </article>`);
  });
}

function financeSections() {
  return [{key:"revenue", label:"Revenue"}, ...state.budget.sections.map(s=>({key:s.name,label:s.name}))];
}
function findFinanceLocation(id) {
  const revIndex = state.budget.revenue.findIndex(x=>x.id===id);
  if (revIndex >= 0) return {type:"revenue", list:state.budget.revenue, index:revIndex, item:state.budget.revenue[revIndex]};
  for (const section of state.budget.sections) {
    const index = section.items.findIndex(x=>x.id===id);
    if (index >= 0) return {type:section.name, list:section.items, index, item:section.items[index]};
  }
  return null;
}
function removeFinanceItem(id) {
  const loc = findFinanceLocation(id);
  if (loc) loc.list.splice(loc.index,1);
}
function populateFinanceSections(selected="revenue") {
  const select = document.querySelector("#finance-item-section");
  select.innerHTML = financeSections().map(s=>`<option value="${s.key}" ${s.key===selected?"selected":""}>${s.label}</option>`).join("");
}
function openFinanceItemDialog(id=null) {
  const form = document.querySelector("#finance-item-form");
  form.reset();
  const loc = id ? findFinanceLocation(id) : null;
  document.querySelector("#finance-item-dialog-title").textContent = loc ? "Edit finance line item" : "Add finance line item";
  populateFinanceSections(loc?.type || "revenue");
  form.elements.itemId.value = loc?.item.id || "";
  form.elements.label.value = loc?.item.label || "";
  form.elements.budget.value = loc?.item.budget || 0;
  form.elements.actual.value = loc?.item.actual || 0;
  form.elements.varianceAdjustment.value = loc?.item.varianceAdjustment || 0;
  document.querySelector("#finance-item-dialog").showModal();
}

function renderStatement() {
  const root = document.querySelector("#finance-statement");
  root.innerHTML = "";
  root.appendChild(createStatementSection("Revenue", state.budget.revenue, true));
  state.budget.sections.forEach(section => root.appendChild(createStatementSection(section.name, section.items, false)));

  const totals = getBudgetTotals();
  const summary = document.createElement("div");
  summary.className = "statement-section";
  summary.innerHTML = `
    <div class="statement-title">Operating Summary</div>
    <div class="statement-grid">
      <div class="statement-cell statement-header">Metric</div><div class="statement-cell statement-header">Budget</div><div class="statement-cell statement-header">Actual</div><div class="statement-cell statement-header">Variance</div>
      ${summaryRow("Total Revenue", totals.revenueBudget, totals.revenueActual, true)}
      ${summaryRow("Total Planned Expenses", totals.expenseBudget, totals.expenseActual, false)}
      ${summaryRow("Gap Spending", 0, totals.gapActual, false)}
      ${summaryRow("Net Operating Cash Flow", totals.revenueBudget - totals.expenseBudget, totals.netActual, true)}
    </div>`;
  root.appendChild(summary);
}
function summaryRow(label, budget, actual, positiveIsGood) {
  const variance = positiveIsGood ? actual - budget : budget - actual;
  return `<div class="statement-cell statement-total">${label}</div>
    <div class="statement-cell statement-total">${money(budget)}</div>
    <div class="statement-cell statement-total">${money(actual)}</div>
    <div class="statement-cell statement-total ${variance >= 0 ? "var-good" : "var-bad"}">${money(variance)}</div>`;
}
function createStatementSection(name, items, revenue) {
  const wrap = document.createElement("div");
  wrap.className = "statement-section";
  const totalBudget = items.reduce((s,x) => s + Number(x.budget || 0), 0);
  const totalActual = items.reduce((s,x) => s + Number(x.actual || 0), 0);
  const totalAdjustment = items.reduce((s,x) => s + Number(x.varianceAdjustment || 0), 0);
  const totalVariance = (revenue ? totalActual-totalBudget : totalBudget-totalActual) + totalAdjustment;

  wrap.innerHTML = `<div class="statement-title">${name}</div>
    <div class="statement-grid">
      <div class="statement-cell statement-header">Line item</div>
      <div class="statement-cell statement-header">Budget</div>
      <div class="statement-cell statement-header">Actual</div>
      <div class="statement-cell statement-header">Variance</div>
    </div>`;
  const grid = wrap.querySelector(".statement-grid");

  items.forEach(item => {
    const variance = (revenue ? Number(item.actual)-Number(item.budget) : Number(item.budget)-Number(item.actual)) + Number(item.varianceAdjustment || 0);
    const cells = [
      `<div class="statement-cell"><span>${item.label}</span><span class="statement-actions"><button class="statement-action edit edit-finance-item" data-id="${item.id}">Edit</button><button class="statement-action delete delete-finance-item" data-id="${item.id}">Remove</button></span></div>`,
      `<div class="statement-cell"><input class="money-input" data-type="budget" data-id="${item.id}" value="${Number(item.budget || 0).toFixed(2)}" type="number" min="0" step="0.01"></div>`,
      `<div class="statement-cell"><input class="money-input" data-type="actual" data-id="${item.id}" value="${Number(item.actual || 0).toFixed(2)}" type="number" min="0" step="0.01"></div>`,
      `<div class="statement-cell ${variance >= 0 ? "var-good" : "var-bad"}">${money(variance)}${Number(item.varianceAdjustment || 0) ? `<small class="muted"> adj ${money(item.varianceAdjustment)}</small>` : ""}</div>`
    ];
    grid.insertAdjacentHTML("beforeend", cells.join(""));
  });

  grid.insertAdjacentHTML("beforeend", `
    <div class="statement-cell statement-total">${name} Total</div>
    <div class="statement-cell statement-total">${money(totalBudget)}</div>
    <div class="statement-cell statement-total">${money(totalActual)}</div>
    <div class="statement-cell statement-total ${totalVariance >= 0 ? "var-good" : "var-bad"}">${money(totalVariance)}</div>
  `);
  return wrap;
}

function renderGapSpending() {
  const body = document.querySelector("#gap-spending-body");
  body.innerHTML = state.gapSpending.length ? "" : `<tr><td colspan="6" class="muted">No gap spending logged.</td></tr>`;
  state.gapSpending.forEach((x, index) => {
    body.insertAdjacentHTML("beforeend", `<tr>
      <td>${x.date}</td><td>${x.description}</td><td>${money(x.amount)}</td><td>${x.category}</td>
      <td><span class="status ${x.necessary === "Yes" ? "good" : x.necessary === "No" ? "bad" : "warn"}">${x.necessary}</span></td>
      <td><button class="icon-button delete-gap" data-index="${index}">Delete</button></td>
    </tr>`);
  });
}

function latestCryptoEntry() {
  return [...state.crypto.entries].sort((a,b) => a.date.localeCompare(b.date)).at(-1);
}
function renderCrypto() {
  document.querySelector("#crypto-start-date").value = state.crypto.startDate;
  document.querySelector("#crypto-start-balance").value = state.crypto.startBalance;
  document.querySelector("#crypto-daily-rate").value = state.crypto.dailyRatePercent;

  const todayPlan = cryptoGoalForDate(isoToday());
  const latest = latestCryptoEntry();
  document.querySelector("#crypto-today-goal").textContent = money(todayPlan.goal);
  document.querySelector("#crypto-day-number").textContent = `Day ${todayPlan.day}`;
  document.querySelector("#crypto-latest-actual").textContent = latest ? money(latest.balance) : money(0);
  document.querySelector("#crypto-latest-date").textContent = latest ? latest.date : "No entries";

  const latestGoal = latest ? cryptoGoalForDate(latest.date).goal : 0;
  const variance = latest ? Number(latest.balance)-latestGoal : 0;
  const variancePct = latestGoal ? variance/latestGoal*100 : 0;
  document.querySelector("#crypto-variance").textContent = money(variance);
  document.querySelector("#crypto-variance").className = variance >= 0 ? "var-good" : "var-bad";
  document.querySelector("#crypto-variance-pct").textContent = percent(variancePct);

  let avgGrowth = 0;
  const sorted = [...state.crypto.entries].sort((a,b) => a.date.localeCompare(b.date));
  if (sorted.length >= 2) {
    const first = sorted[0], last = sorted.at(-1);
    const days = Math.max(1, daysBetween(first.date, last.date));
    avgGrowth = (Math.pow(last.balance/first.balance, 1/days)-1)*100;
  }
  document.querySelector("#crypto-average-growth").textContent = percent(avgGrowth);

  const body = document.querySelector("#crypto-log-body");
  body.innerHTML = sorted.length ? "" : `<tr><td colspan="8" class="muted">No balances logged yet. Start tomorrow with your actual closing balance.</td></tr>`;
  [...sorted].reverse().forEach(entry => {
    const plan = cryptoGoalForDate(entry.date);
    const dollarVar = entry.balance-plan.goal;
    const pctVar = dollarVar/plan.goal*100;
    const status = dollarVar >= 0 ? ["Ahead","good"] : pctVar >= -1 ? ["Near plan","warn"] : ["Behind","bad"];
    body.insertAdjacentHTML("beforeend", `<tr>
      <td>${entry.date}</td><td>${plan.day}</td><td>${money(plan.goal)}</td><td>${money(entry.balance)}</td>
      <td class="${dollarVar >= 0 ? "var-good" : "var-bad"}">${money(dollarVar)}</td>
      <td class="${dollarVar >= 0 ? "var-good" : "var-bad"}">${percent(pctVar)}</td>
      <td><span class="status ${status[1]}">${status[0]}</span></td>
      <td><button class="icon-button delete-crypto" data-date="${entry.date}">Delete</button></td>
    </tr>`);
  });
}

function renderDashboard() {
  const totals = getBudgetTotals();
  document.querySelector("#hero-net").textContent = money(totals.netActual);
  document.querySelector("#hero-net-status").textContent = totals.netActual >= 0 ? "Positive operating cash flow" : "Spending exceeds recorded revenue";
  document.querySelector("#kpi-revenue").textContent = money(totals.revenueActual);
  document.querySelector("#kpi-revenue-var").textContent = `Budget: ${money(totals.revenueBudget)}`;
  document.querySelector("#kpi-expenses").textContent = money(totals.expenseActual + totals.gapActual);
  document.querySelector("#kpi-expense-var").textContent = `Budget: ${money(totals.expenseBudget)}`;
  document.querySelector("#kpi-debt").textContent = money(totals.debtActual);

  const categoryRoot = document.querySelector("#category-bars");
  categoryRoot.innerHTML = "";
  state.budget.sections.forEach(section => {
    const budget = section.items.reduce((s,x)=>s+Number(x.budget||0),0);
    const actual = section.items.reduce((s,x)=>s+Number(x.actual||0),0);
    const ratio = budget ? actual/budget : 0;
    categoryRoot.insertAdjacentHTML("beforeend", `<div class="category-row">
      <span>${section.name}</span>
      <div class="bar-track"><div class="bar-fill ${ratio>1 ? "over":""}" style="width:${Math.min(ratio*100,100)}%"></div></div>
      <strong>${money(actual)} / ${money(budget)}</strong>
    </div>`);
  });

  const latest = latestCryptoEntry();
  const planDate = latest?.date || isoToday();
  const plan = cryptoGoalForDate(planDate);
  const actual = latest ? Number(latest.balance) : 0;
  const variance = actual-plan.goal;
  document.querySelector("#kpi-crypto").textContent = latest ? money(actual) : money(0);
  document.querySelector("#kpi-crypto-status").textContent = latest ? (variance >= 0 ? "Ahead of plan" : "Behind plan") : "Not entered";
  document.querySelector("#dash-plan-date").textContent = planDate;
  document.querySelector("#dash-goal-balance").textContent = money(plan.goal);
  document.querySelector("#dash-actual-balance").textContent = money(actual);
  document.querySelector("#dash-crypto-variance").textContent = money(variance);
  document.querySelector("#dash-crypto-variance").className = variance >= 0 ? "var-good" : "var-bad";
  document.querySelector("#dash-crypto-progress").style.width = `${Math.min(actual/plan.goal*100,100)}%`;
  document.querySelector("#dash-crypto-message").textContent = latest ? `${variance >= 0 ? "Ahead" : "Behind"} by ${money(Math.abs(variance))} on Day ${plan.day}.` : "Enter your current balance in Trading.";
}


const healthTasks = [
  { id: "wake", label: "Wake by 6:30 AM", time: "6:30 AM" },
  { id: "morning-walk", label: "Morning walk", time: "8:00–8:30 AM" },
  { id: "shake-1", label: "Morning protein shake", time: "8:30–9:30 AM" },
  { id: "shake-2", label: "Second protein shake", time: "10:30–11:30 AM" },
  { id: "protein-snack", label: "Required protein snack", time: "2:30–3:30 PM" },
  { id: "main-meal", label: "Main meal", time: "6:30–7:30 PM" },
  { id: "protein", label: "Reach 160 g protein", time: "Daily" },
  { id: "carbs", label: "Keep carbs at or below 25 g", time: "Daily" },
  { id: "sugar", label: "Keep sugar at or below 25 g", time: "Daily" },
  { id: "seed-oils", label: "No seed oils", time: "Daily" },
  { id: "evening-walk", label: "30-minute evening walk", time: "7:30–8:30 PM" },
  { id: "food-cutoff", label: "Stop eating by 9:00 PM", time: "9:00 PM" },
  { id: "bedtime", label: "Bed by 11:30 PM", time: "11:30 PM" }
];

function localDateKey() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0,10);
}
function healthDayData(date = localDateKey()) {
  state.health.daily[date] = state.health.daily[date] || {};
  return state.health.daily[date];
}
function fastingModeForDate(date = localDateKey()) {
  const day = new Date(`${date}T12:00:00`).getDay();
  if (day === 2) return "Tuesday full fast";
  if (day === 4) return "Thursday fast until dinner";
  return "Standard eating day";
}
function taskVisible(task, mode) {
  if (mode === "Tuesday full fast") return !["shake-1","shake-2","protein-snack","main-meal","protein","carbs","sugar","seed-oils","food-cutoff"].includes(task.id);
  if (mode === "Thursday fast until dinner") return !["shake-1","shake-2","protein-snack"].includes(task.id);
  return true;
}
function currentScheduleStatus() {
  const mins = new Date().getHours()*60 + new Date().getMinutes();
  const schedule = [
    [390, "Wake and prepare for the day"],
    [480, "Morning walk"],
    [510, "Morning protein shake"],
    [630, "Second protein shake"],
    [870, "Required protein snack"],
    [1110, "Main meal"],
    [1170, "Evening walk"],
    [1260, "Food cutoff"],
    [1410, "Bedtime"]
  ];
  let current = schedule[0][1], next = schedule[1][1];
  for (let i=0; i<schedule.length; i++) {
    if (mins >= schedule[i][0]) {
      current = schedule[i][1];
      next = schedule[i+1]?.[1] || "Day complete";
    }
  }
  return { current, next };
}
function renderHealth() {
  const date = localDateKey();
  const mode = fastingModeForDate(date);
  const daily = healthDayData(date);
  const visibleTasks = healthTasks.filter(t => taskVisible(t, mode));
  const completed = visibleTasks.filter(t => daily[t.id]).length;
  const score = visibleTasks.length ? Math.round(completed/visibleTasks.length*100) : 0;

  document.querySelector("#health-date-badge").textContent = new Intl.DateTimeFormat("en-US",{weekday:"long",month:"short",day:"numeric"}).format(new Date(`${date}T12:00:00`));
  document.querySelector("#health-day-mode").textContent = mode;
  document.querySelector("#health-score").textContent = `${score}%`;
  document.querySelector("#health-ring-label").textContent = `${completed}/${visibleTasks.length}`;
  document.querySelector("#health-ring").style.setProperty("--score", score);
  document.querySelector("#health-score-message").textContent =
    score === 100 ? "Excellent execution. Today is complete." :
    score >= 75 ? "Strong day. Finish the remaining actions." :
    score >= 40 ? "Momentum is building. Keep moving." :
    "Start with the next scheduled action.";

  const checklist = document.querySelector("#health-checklist");
  checklist.innerHTML = "";
  visibleTasks.forEach(task => {
    checklist.insertAdjacentHTML("beforeend", `<label class="health-task ${daily[task.id] ? "done":""}">
      <input type="checkbox" class="health-task-check" data-id="${task.id}" ${daily[task.id] ? "checked":""}>
      <span><strong>${task.label}</strong><small>${task.time}</small></span>
      <span class="status ${daily[task.id] ? "good":"warn"}">${daily[task.id] ? "Done":"Open"}</span>
    </label>`);
  });

  const now = currentScheduleStatus();
  document.querySelector("#health-now-card").innerHTML = `<span>Current focus</span><strong>${now.current}</strong><small>Next: ${now.next}</small>`;
  const schedule = document.querySelector("#health-schedule");
  const scheduleRows = mode === "Tuesday full fast"
    ? [["6:30 AM","Wake"],["8:00–8:30 AM","Morning walk"],["All day","Full fast"],["7:30–8:30 PM","Evening walk"],["11:30 PM","Bedtime"]]
    : mode === "Thursday fast until dinner"
    ? [["6:30 AM","Wake"],["8:00–8:30 AM","Morning walk"],["Until dinner","Fast"],["6:30–7:30 PM","Main meal"],["7:30–8:30 PM","Evening walk"],["9:00 PM","Food cutoff"],["11:30 PM","Bedtime"]]
    : [["6:30 AM","Wake"],["8:00–8:30 AM","Morning walk"],["8:30–9:30 AM","Morning shake"],["10:30–11:30 AM","Second shake"],["2:30–3:30 PM","Protein snack"],["6:30–7:30 PM","Main meal"],["7:30–8:30 PM","Evening walk"],["9:00 PM","Food cutoff"],["11:30 PM","Bedtime"]];
  schedule.innerHTML = scheduleRows.map(r=>`<div class="schedule-row"><time>${r[0]}</time><div><strong>${r[1]}</strong></div></div>`).join("");

  renderWeight();
  renderNutrition();
}
function renderWeight() {
  document.querySelector("#health-start-weight").value = state.health.startWeight;
  document.querySelector("#health-goal-weight").value = state.health.goalWeight;
  document.querySelector("#health-ultimate-weight").value = state.health.ultimateWeight;
  const sorted = [...state.health.weighIns].sort((a,b)=>a.date.localeCompare(b.date));
  const latest = sorted.at(-1);
  const current = latest ? Number(latest.weight) : null;
  document.querySelector("#health-current-weight").textContent = current ? `${current.toFixed(1)} lb` : "—";
  document.querySelector("#health-phase-goal").textContent = `Under ${state.health.goalWeight + 0.1} lb`;
  document.querySelector("#health-lbs-to-go").textContent = current ? `${Math.max(0,current-state.health.goalWeight).toFixed(1)} lb to Phase 1` : "Enter current weight";
  document.querySelector("#health-weight-change").textContent = current ? `${(current-state.health.startWeight).toFixed(1)} lb from start` : "No weigh-in yet";
  const totalNeeded = state.health.startWeight-state.health.goalWeight;
  const lost = current ? state.health.startWeight-current : 0;
  const progress = totalNeeded > 0 ? Math.max(0,Math.min(100,lost/totalNeeded*100)) : 0;
  document.querySelector("#health-weight-progress").style.width = `${progress}%`;
  document.querySelector("#health-weight-progress-label").textContent = current ? `${progress.toFixed(1)}% of the way to Phase 1.` : "Add a weigh-in to begin.";

  const body = document.querySelector("#weight-log-body");
  body.innerHTML = sorted.length ? "" : `<tr><td colspan="4" class="muted">No weigh-ins logged.</td></tr>`;
  [...sorted].reverse().forEach((entry, reverseIndex) => {
    const originalIndex = sorted.findIndex(x=>x.date===entry.date);
    const previous = originalIndex > 0 ? Number(sorted[originalIndex-1].weight) : state.health.startWeight;
    const change = Number(entry.weight)-previous;
    body.insertAdjacentHTML("beforeend", `<tr>
      <td>${entry.date}</td><td>${Number(entry.weight).toFixed(1)} lb</td>
      <td class="${change <= 0 ? "var-good":"var-bad"}">${change > 0 ? "+":""}${change.toFixed(1)} lb</td>
      <td><button class="icon-button delete-weigh" data-date="${entry.date}">Delete</button></td>
    </tr>`);
  });
}
function renderNutrition() {
  const date = localDateKey();
  const manual = state.health.nutrition[date] || {protein:0,carbs:0,sugar:0,water:0};
  const food = sumFoodForDate(date);
  const n = {
    protein: food.protein || manual.protein || 0,
    carbs: food.carbs || manual.carbs || 0,
    sugar: food.sugar || manual.sugar || 0,
    water: manual.water || 0
  };
  document.querySelector("#nutrition-protein").value = n.protein || "";
  document.querySelector("#nutrition-carbs").value = n.carbs || "";
  document.querySelector("#nutrition-sugar").value = n.sugar || "";
  document.querySelector("#nutrition-water").value = n.water || "";
  const rows = [
    ["Protein", Number(n.protein||0), 160, false],
    ["Carbs", Number(n.carbs||0), 25, true],
    ["Sugar", Number(n.sugar||0), 25, true],
    ["Water", Number(n.water||0), 80, false]
  ];
  document.querySelector("#nutrition-status").innerHTML = rows.map(([label,val,target,limit]) => {
    const pct = limit ? Math.min(100,val/target*100) : Math.min(100,val/target*100);
    const good = limit ? val <= target : val >= target;
    return `<div class="nutrition-row"><span>${label}</span><div class="bar-track"><div class="bar-fill ${good?"good":"bad"}" style="width:${pct}%"></div></div><strong>${val}/${target}</strong></div>`;
  }).join("");
}


function foodEntriesForDate(date = localDateKey()) {
  return state.health.foodLog.filter(x => x.date === date);
}
function sumFoodForDate(date = localDateKey()) {
  const fields = ["protein","fat","carbs","sugar"];
  const totals = Object.fromEntries(fields.map(f => [f,0]));
  foodEntriesForDate(date).forEach(item => fields.forEach(f => totals[f] += Number(item[f] || 0)));
  return totals;
}
function renderFoodLog() {
  const totals = sumFoodForDate();
  const map = {
    protein: ["#food-total-protein"," g"],
    fat: ["#food-total-fat"," g"],
    carbs: ["#food-total-carbs"," g"],
    sugar: ["#food-total-sugar"," g"]
  };
  Object.entries(map).forEach(([k,[sel,suffix]]) => {
    document.querySelector(sel).textContent = `${Number(totals[k]).toFixed(k==="calories" ? 0 : 1)}${suffix}`;
  });

  const body = document.querySelector("#food-log-body");
  const entries = foodEntriesForDate();
  body.innerHTML = entries.length ? "" : `<tr><td colspan="8" class="muted">No foods logged for today.</td></tr>`;
  entries.forEach(item => {
    body.insertAdjacentHTML("beforeend", `<tr>
      <td>${item.meal}</td><td>${item.name}</td><td>${item.serving || "—"}</td>
      <td>${Number(item.protein||0).toFixed(1)} g</td><td>${Number(item.fat||0).toFixed(1)} g</td>
      <td>${Number(item.carbs||0).toFixed(1)} g</td><td>${Number(item.sugar||0).toFixed(1)} g</td>
      <td><button class="icon-button delete-food" data-id="${item.id}">Delete</button></td>
    </tr>`);
  });
}
function dateRangeLastNDays(n) {
  const out = [];
  for (let i=n-1;i>=0;i--) {
    const d = new Date();
    d.setDate(d.getDate()-i);
    const offset = d.getTimezoneOffset();
    out.push(new Date(d.getTime()-offset*60000).toISOString().slice(0,10));
  }
  return out;
}
function dailyHealthScoreForDate(date) {
  const mode = fastingModeForDate(date);
  const tasks = healthTasks.filter(t => taskVisible(t, mode));
  const d = state.health.daily[date] || {};
  const done = tasks.filter(t => d[t.id]).length;
  return tasks.length ? Math.round(done/tasks.length*100) : 0;
}
function renderHealthHistory() {
  const dates = dateRangeLastNDays(14);
  const rows = dates.map(date => {
    const totals = sumFoodForDate(date);
    const nutrition = state.health.nutrition[date] || {};
    const protein = totals.protein || Number(nutrition.protein||0);
    const carbs = totals.carbs || Number(nutrition.carbs||0);
    const sugar = totals.sugar || Number(nutrition.sugar||0);
    const weigh = state.health.weighIns.find(x=>x.date===date);
    return { date, score: dailyHealthScoreForDate(date), protein, carbs, sugar, fat: totals.fat, weight: weigh?.weight ?? null };
  });
  const avg = field => rows.reduce((s,r)=>s+Number(r[field]||0),0)/rows.length;
  const completedDays = rows.filter(r=>r.score>0).length || 1;
  document.querySelector("#health-history-summary").innerHTML = `
    <div><span>14-day avg score</span><strong>${avg("score").toFixed(0)}%</strong></div>
    <div><span>Avg protein</span><strong>${avg("protein").toFixed(0)} g</strong></div>
    <div><span>Avg carbs</span><strong>${avg("carbs").toFixed(0)} g</strong></div>
    <div><span>Avg sugar</span><strong>${avg("sugar").toFixed(0)} g</strong></div>`;
  const body = document.querySelector("#health-history-body");
  body.innerHTML = "";
  [...rows].reverse().forEach(r => {
    body.insertAdjacentHTML("beforeend", `<tr>
      <td>${r.date}</td><td>${r.score}%</td><td>${r.protein.toFixed(1)} g</td>
      <td class="${r.carbs <= 25 ? "var-good":"var-bad"}">${r.carbs.toFixed(1)} g</td>
      <td class="${r.sugar <= 25 ? "var-good":"var-bad"}">${r.sugar.toFixed(1)} g</td>
      <td>${r.fat.toFixed(1)} g</td><td>${r.weight ? Number(r.weight).toFixed(1)+" lb":"—"}</td>
    </tr>`);
  });
}
function healthCsv() {
  const dates = [...new Set([
    ...Object.keys(state.health.daily),
    ...Object.keys(state.health.nutrition),
    ...state.health.foodLog.map(x=>x.date),
    ...state.health.weighIns.map(x=>x.date)
  ])].sort();
  const lines = [["Date","Daily Score","Calories","Protein g","Carbs g","Sugar g","Fat g","Fiber g","Sodium mg","Potassium mg","Calcium mg","Iron mg","Weight lb"]];
  dates.forEach(date => {
    const t = sumFoodForDate(date);
    const n = state.health.nutrition[date] || {};
    const w = state.health.weighIns.find(x=>x.date===date)?.weight ?? "";
    lines.push([date,dailyHealthScoreForDate(date),t.calories,t.protein||n.protein||0,t.carbs||n.carbs||0,t.sugar||n.sugar||0,t.fat,t.fiber,t.sodium,t.potassium,t.calcium,t.iron,w]);
  });
  return lines.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
}


function makeId(prefix="id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

let selectedTradingAccountId = null;

function accountTransactions(account) {
  return [...(account.transactions || [])].sort((a,b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
}
function transactionSignedAmount(tx) {
  const amount = Number(tx.amount || 0);
  return tx.type === "profit" || tx.type === "deposit" ? amount : -amount;
}
function accountTransactionTotals(account) {
  const txs = accountTransactions(account);
  const profit = txs.filter(x=>x.type==="profit").reduce((s,x)=>s+Number(x.amount||0),0);
  const loss = txs.filter(x=>x.type==="loss").reduce((s,x)=>s+Number(x.amount||0),0);
  const deposits = txs.filter(x=>x.type==="deposit").reduce((s,x)=>s+Number(x.amount||0),0);
  const withdrawals = txs.filter(x=>x.type==="withdrawal").reduce((s,x)=>s+Number(x.amount||0),0);
  const netPL = profit-loss;
  const calculatedBalance = Number(account.baseBalance || 0) + netPL + deposits - withdrawals;
  return {profit, loss, deposits, withdrawals, netPL, calculatedBalance};
}
function syncAccountFromTransactions(account) {
  const totals = accountTransactionTotals(account);
  account.currentBalance = totals.calculatedBalance;
  if (account.kind === "prop") {
    const starting = Number(account.accountSize || 0);
    account.currentProfit = starting ? (Number(account.currentBalance) - starting) / starting * 100 : 0;
  }
}
function propAccountHealth(account) {
  syncAccountFromTransactions(account);
  const starting = Number(account.accountSize || 0);
  const current = Number(account.currentBalance || 0);
  const todayStart = Number(account.todayStartingBalance || current);
  const dailyFloor = todayStart * (1 - Number(account.dailyLossMax || 0) / 100);
  const maxFloor = starting * (1 - Number(account.maxDrawdown || 0) / 100);
  const dailyLeft = Math.max(0, current - dailyFloor);
  const maxLeft = Math.max(0, current - maxFloor);
  const withdrawable = Math.max(0, current - starting);
  const recovery = Math.max(0, starting - current);
  const status = current < starting ? "Recovery" : current === starting ? "Breakeven" : "Profitable";
  return {starting,current,todayStart,dailyFloor,maxFloor,dailyLeft,maxLeft,withdrawable,recovery,status};
}
function openAccountTransaction(accountId) {
  const account = state.tradingAccounts.find(x=>x.id===accountId);
  if (!account) return;
  selectedTradingAccountId = accountId;
  const form = document.querySelector("#account-transaction-form");
  form.reset();
  form.elements.accountId.value = accountId;
  form.elements.date.value = localDateKey();
  document.querySelector("#account-transaction-title").textContent = `Add transaction — ${account.name}`;
  document.querySelector("#account-transaction-dialog").showModal();
}
function openAccountDetail(accountId) {
  const account = state.tradingAccounts.find(x=>x.id===accountId);
  if (!account) return;
  selectedTradingAccountId = accountId;
  renderAccountDetail(account);
  document.querySelector("#account-detail-dialog").showModal();
}
function renderAccountDetail(account) {
  syncAccountFromTransactions(account);
  const totals = accountTransactionTotals(account);
  document.querySelector("#account-detail-type").textContent = account.kind === "crypto" ? "CRYPTO ACCOUNT" : `PROP FIRM · ${account.programType === "instant" ? "INSTANT" : "STEP CHALLENGE"}`;
  document.querySelector("#account-detail-name").textContent = account.name;

  const currentBalance = Number(account.currentBalance || 0);
  const health = account.kind === "prop" ? propAccountHealth(account) : null;
  const status = account.kind === "crypto" ? "Active" : health.status;

  document.querySelector("#account-detail-summary").innerHTML = `
    <div><span>Current balance</span><strong>${money(currentBalance)}</strong></div>
    <div><span>Total profit</span><strong class="var-good">${money(totals.profit)}</strong></div>
    <div><span>Total loss</span><strong class="var-bad">${money(totals.loss)}</strong></div>
    <div><span>Net P/L</span><strong class="${totals.netPL>=0?"var-good":"var-bad"}">${money(totals.netPL)}</strong></div>
    <div><span>Deposits</span><strong>${money(totals.deposits)}</strong></div>
    <div><span>Withdrawals</span><strong>${money(totals.withdrawals)}</strong></div>
    <div><span>Status</span><strong>${status}</strong></div>
    <div><span>${account.kind==="crypto"?"Growth":"Account return"}</span><strong>${account.kind==="crypto" ? percent(account.baseBalance ? (currentBalance-account.baseBalance)/account.baseBalance*100 : 0) : percent(account.currentProfit)}</strong></div>
    ${health ? `<div><span>Withdrawable profit</span><strong class="${health.withdrawable>0?'var-good':''}">${money(health.withdrawable)}</strong></div><div><span>Recovery needed</span><strong class="${health.recovery>0?'var-bad':''}">${money(health.recovery)}</strong></div>` : ''}`;

  const body = document.querySelector("#account-transaction-body");
  const txs = accountTransactions(account);
  body.innerHTML = txs.length ? "" : `<tr><td colspan="6" class="muted">No transactions logged.</td></tr>`;
  let running = Number(account.baseBalance || 0);
  txs.forEach(tx => {
    running += transactionSignedAmount(tx);
    body.insertAdjacentHTML("beforeend", `<tr>
      <td>${tx.date}</td>
      <td class="transaction-${tx.type}">${tx.type[0].toUpperCase()+tx.type.slice(1)}</td>
      <td class="${tx.type==="profit"||tx.type==="deposit"?"var-good":"var-bad"}">${tx.type==="profit"||tx.type==="deposit"?"+":"-"}${money(tx.amount)}</td>
      <td>${tx.note || "—"}</td>
      <td>${money(running)}</td>
      <td><button class="icon-button delete-account-transaction" data-account-id="${account.id}" data-transaction-id="${tx.id}">Delete</button></td>
    </tr>`);
  });
  bindAccountDetailEvents();
}
function bindAccountDetailEvents() {
  document.querySelectorAll(".delete-account-transaction").forEach(btn => btn.addEventListener("click", () => {
    const account = state.tradingAccounts.find(x=>x.id===btn.dataset.accountId);
    account.transactions = account.transactions.filter(x=>x.id!==btn.dataset.transactionId);
    syncAccountFromTransactions(account);
    saveState();
    renderAccountDetail(account);
  }));
}

function renderTradingAccounts() {
  const root = document.querySelector("#trading-account-grid");
  if (!root) return;
  if (!state.tradingAccounts.length) {
    root.innerHTML = `<p class="muted">No accounts added yet. Add a crypto account or prop firm account.</p>`;
    return;
  }
  root.innerHTML = "";
  state.tradingAccounts.forEach(account => {
    syncAccountFromTransactions(account);
    const totals = accountTransactionTotals(account);
    if (account.kind === "crypto") {
      const growth = account.baseBalance ? (Number(account.currentBalance)-Number(account.baseBalance))/Number(account.baseBalance)*100 : 0;
      root.insertAdjacentHTML("beforeend", `<article class="trading-account-card open-account-card" data-id="${account.id}">
        <div class="account-top"><div><p class="eyebrow">CRYPTO ACCOUNT</p><h4>${account.name}</h4></div><span class="status good">Active</span></div>
        <div class="account-meta">
          <div><span>Starting</span><strong>${money(account.startingBalance)}</strong></div>
          <div><span>Current</span><strong>${money(account.currentBalance)}</strong></div>
          <div><span>Growth</span><strong class="${growth>=0?"var-good":"var-bad"}">${percent(growth)}</strong></div>
          <div><span>Daily goal</span><strong>${percent(account.dailyGoal)}</strong></div>
        </div>
        <div class="account-pl">
          <div><span>Profit</span><strong class="var-good">${money(totals.profit)}</strong></div>
          <div><span>Loss</span><strong class="var-bad">${money(totals.loss)}</strong></div>
          <div><span>Net P/L</span><strong class="${totals.netPL>=0?"var-good":"var-bad"}">${money(totals.netPL)}</strong></div>
        </div>
        <div class="account-actions">
          <button class="button small-button add-account-transaction" data-id="${account.id}">Add P/L</button>
          <button class="button secondary small-button remove-trading-account" data-id="${account.id}">Remove</button>
        </div>
      </article>`);
    } else {
      const active = account.active !== false;
      const h = propAccountHealth(account);
      const statusClass = h.status === "Profitable" ? "good" : h.status === "Breakeven" ? "warn" : "bad";
      const programLabel = account.programType === "instant" ? "INSTANT FUNDED" : account.programType === "two-step" ? "2-STEP CHALLENGE" : "1-STEP CHALLENGE";
      const dailyUsed = Number(account.dailyLossMax||0) ? Math.max(0,Math.min(100,(1-h.dailyLeft/(h.todayStart*Number(account.dailyLossMax||0)/100))*100)) : 0;
      const maxUsed = Number(account.maxDrawdown||0) ? Math.max(0,Math.min(100,(1-h.maxLeft/(h.starting*Number(account.maxDrawdown||0)/100))*100)) : 0;
      root.insertAdjacentHTML("beforeend", `<article class="trading-account-card open-account-card ${active?"active-account":""}" data-id="${account.id}">
        <div class="account-top"><div><p class="eyebrow">PROP FIRM · ${programLabel}</p><h4>${account.name}</h4></div><span class="status ${statusClass}">${h.status}</span></div>
        <div class="account-meta prop-health-meta">
          <div><span>Starting balance</span><strong>${money(h.starting)}</strong></div>
          <div><span>Current balance</span><strong class="${h.current>=h.starting?'var-good':'var-bad'}">${money(h.current)}</strong></div>
          <div><span>Today's start</span><strong>${money(h.todayStart)}</strong></div>
          <div><span>${h.withdrawable>0?'Withdrawable':'Recovery needed'}</span><strong class="${h.withdrawable>0?'var-good':'var-bad'}">${money(h.withdrawable||h.recovery)}</strong></div>
        </div>
        <div class="drawdown-stack">
          <div class="drawdown-row"><div><span>Daily drawdown left</span><strong>${money(h.dailyLeft)}</strong></div><small>Floor ${money(h.dailyFloor)}</small><div class="bar-track"><div class="bar-fill risk-fill" style="width:${dailyUsed}%"></div></div></div>
          <div class="drawdown-row"><div><span>Max drawdown left</span><strong>${money(h.maxLeft)}</strong></div><small>Floor ${money(h.maxFloor)}</small><div class="bar-track"><div class="bar-fill risk-fill" style="width:${maxUsed}%"></div></div></div>
        </div>
        <div class="account-actions">
          <button class="button small-button add-account-transaction" data-id="${account.id}">Add P/L</button>
          <button class="button secondary small-button remove-trading-account" data-id="${account.id}">Remove</button>
        </div>
      </article>`);
    }
  });
}

function renderAll() {
  renderCashAccounts();
  renderStatement();
  renderGapSpending();
  renderCrypto();
  renderHealth();
  renderFoodLog();
  renderHealthHistory();
  renderTradingAccounts();
  renderDashboard();
  bindDynamicEvents();
}

function findBudgetItem(id) {
  return [...state.budget.revenue, ...state.budget.sections.flatMap(s=>s.items)].find(x=>x.id===id);
}
function bindDynamicEvents() {
  document.querySelectorAll(".money-input").forEach(input => {
    input.addEventListener("change", e => {
      const item = findBudgetItem(e.target.dataset.id);
      item[e.target.dataset.type] = Number(e.target.value || 0);
      saveState();
    });
  });
  document.querySelectorAll(".delete-gap").forEach(btn => btn.addEventListener("click", () => {
    state.gapSpending.splice(Number(btn.dataset.index),1); saveState();
  }));
  document.querySelectorAll(".delete-crypto").forEach(btn => btn.addEventListener("click", () => {
    state.crypto.entries = state.crypto.entries.filter(x=>x.date!==btn.dataset.date); saveState();
  }));
  document.querySelectorAll(".health-task-check").forEach(box => box.addEventListener("change", () => {
    healthDayData()[box.dataset.id] = box.checked;
    saveState();
  }));
  document.querySelectorAll(".delete-weigh").forEach(btn => btn.addEventListener("click", () => {
    state.health.weighIns = state.health.weighIns.filter(x=>x.date!==btn.dataset.date);
    saveState();
  }));
  document.querySelectorAll(".delete-food").forEach(btn => btn.addEventListener("click", () => {
    state.health.foodLog = state.health.foodLog.filter(x=>x.id!==btn.dataset.id);
    saveState();
  }));
  document.querySelectorAll(".edit-cash-account").forEach(btn => btn.addEventListener("click", () => openCashAccountDialog(btn.dataset.id)));
  document.querySelectorAll(".delete-cash-account").forEach(btn => btn.addEventListener("click", () => {
    if (!confirm("Remove this cash account?")) return;
    state.cashAccounts = state.cashAccounts.filter(x => x.id !== btn.dataset.id);
    saveState();
  }));
  document.querySelectorAll(".delete-finance-item").forEach(btn => btn.addEventListener("click", () => {
    if (!confirm("Remove this finance line item?")) return;
    removeFinanceItem(btn.dataset.id);
    saveState();
  }));
  document.querySelectorAll(".edit-finance-item").forEach(btn => btn.addEventListener("click", () => openFinanceItemDialog(btn.dataset.id)));
  document.querySelectorAll(".remove-trading-account").forEach(btn => btn.addEventListener("click", e => {
    e.stopPropagation();
    if (!confirm("Remove this account?")) return;
    state.tradingAccounts = state.tradingAccounts.filter(x=>x.id!==btn.dataset.id);
    saveState();
  }));
  document.querySelectorAll(".add-account-transaction").forEach(btn => btn.addEventListener("click", e => {
    e.stopPropagation();
    openAccountTransaction(btn.dataset.id);
  }));
  document.querySelectorAll(".open-account-card").forEach(card => card.addEventListener("click", e => {
    if (e.target.closest("button")) return;
    openAccountDetail(card.dataset.id);
  }));
  document.querySelectorAll(".activate-prop-account").forEach(btn => btn.addEventListener("click", e => {
    e.stopPropagation();
    const a = state.tradingAccounts.find(x=>x.id===btn.dataset.id);
    if (Number(a.currentProfit) < Number(a.profitTarget)) return;
    a.status = "active";
    saveState();
  }));
}

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    document.querySelector(`#${btn.dataset.view}-view`).classList.add("active");
    document.querySelector("#page-title").textContent = btn.textContent;
  });
});
document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"}).format(new Date());

const gapDialog = document.querySelector("#gap-dialog");
document.querySelector("#add-gap-row").addEventListener("click", () => {
  document.querySelector("#gap-form").elements.date.value = isoToday();
  gapDialog.showModal();
});
document.querySelector("#gap-form").addEventListener("submit", e => {
  if (e.submitter?.value === "cancel") return;
  e.preventDefault();
  const f = new FormData(e.target);
  state.gapSpending.push({
    date: f.get("date"), description: f.get("description"), amount: Number(f.get("amount")),
    category: f.get("category"), necessary: f.get("necessary")
  });
  e.target.reset(); gapDialog.close(); saveState();
});

const cryptoDialog = document.querySelector("#crypto-dialog");
document.querySelector("#add-crypto-entry").addEventListener("click", () => {
  document.querySelector("#crypto-form").elements.date.value = isoToday();
  cryptoDialog.showModal();
});
document.querySelector("#crypto-form").addEventListener("submit", e => {
  if (e.submitter?.value === "cancel") return;
  e.preventDefault();
  const f = new FormData(e.target);
  const entry = { date: f.get("date"), balance: Number(f.get("balance")) };
  state.crypto.entries = state.crypto.entries.filter(x=>x.date!==entry.date);
  state.crypto.entries.push(entry);
  e.target.reset(); cryptoDialog.close(); saveState();
});
document.querySelector("#save-crypto-settings").addEventListener("click", () => {
  state.crypto.startDate = document.querySelector("#crypto-start-date").value;
  state.crypto.startBalance = Number(document.querySelector("#crypto-start-balance").value);
  state.crypto.dailyRatePercent = Number(document.querySelector("#crypto-daily-rate").value);
  saveState();
});
document.querySelector("#export-data").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `life-coach-${isoToday()}.json`; a.click();
  URL.revokeObjectURL(url);
});


const weighDialog = document.querySelector("#weigh-dialog");
document.querySelector("#add-weigh-in").addEventListener("click", () => {
  document.querySelector("#weigh-form").elements.date.value = localDateKey();
  weighDialog.showModal();
});
document.querySelector("#weigh-form").addEventListener("submit", e => {
  if (e.submitter?.value === "cancel") return;
  e.preventDefault();
  const f = new FormData(e.target);
  const entry = { date: f.get("date"), weight: Number(f.get("weight")) };
  state.health.weighIns = state.health.weighIns.filter(x=>x.date!==entry.date);
  state.health.weighIns.push(entry);
  e.target.reset(); weighDialog.close(); saveState();
});
document.querySelector("#save-health-settings").addEventListener("click", () => {
  state.health.startWeight = Number(document.querySelector("#health-start-weight").value);
  state.health.goalWeight = Number(document.querySelector("#health-goal-weight").value);
  state.health.ultimateWeight = Number(document.querySelector("#health-ultimate-weight").value);
  saveState();
});
document.querySelector("#save-nutrition").addEventListener("click", () => {
  state.health.nutrition[localDateKey()] = {
    protein: Number(document.querySelector("#nutrition-protein").value || 0),
    carbs: Number(document.querySelector("#nutrition-carbs").value || 0),
    sugar: Number(document.querySelector("#nutrition-sugar").value || 0),
    water: Number(document.querySelector("#nutrition-water").value || 0)
  };
  const n = state.health.nutrition[localDateKey()];
  const d = healthDayData();
  d.protein = n.protein >= 160;
  d.carbs = n.carbs <= 25 && n.carbs > 0;
  d.sugar = n.sugar <= 25 && n.sugar > 0;
  saveState();
});
document.querySelector("#reset-health-day").addEventListener("click", () => {
  if (confirm("Reset today's health checklist and nutrition entries?")) {
    state.health.daily[localDateKey()] = {};
    state.health.nutrition[localDateKey()] = {};
    saveState();
  }
});




const accountTransactionDialog = document.querySelector("#account-transaction-dialog");
document.querySelector("#account-transaction-form").addEventListener("submit", e => {
  if (e.submitter?.value === "cancel") return;
  e.preventDefault();
  const f = new FormData(e.target);
  const account = state.tradingAccounts.find(x=>x.id===f.get("accountId"));
  if (!account) return;
  account.transactions = account.transactions || [];
  account.transactions.push({
    id: makeId("tx"),
    date: f.get("date"),
    type: f.get("type"),
    amount: Number(f.get("amount")),
    note: f.get("note"),
    createdAt: Date.now()
  });
  syncAccountFromTransactions(account);
  e.target.reset();
  accountTransactionDialog.close();
  saveState();
  if (document.querySelector("#account-detail-dialog").open) renderAccountDetail(account);
});
document.querySelector("#close-account-detail").addEventListener("click", () => {
  document.querySelector("#account-detail-dialog").close();
});
document.querySelector("#detail-add-transaction").addEventListener("click", () => {
  if (selectedTradingAccountId) openAccountTransaction(selectedTradingAccountId);
});

const cryptoAccountDialog = document.querySelector("#crypto-account-dialog");
document.querySelector("#add-crypto-account").addEventListener("click", () => {
  document.querySelector("#crypto-account-form").reset();
  cryptoAccountDialog.showModal();
});
document.querySelector("#crypto-account-form").addEventListener("submit", e => {
  if (e.submitter?.value === "cancel") return;
  e.preventDefault();
  const f = new FormData(e.target);
  state.tradingAccounts.push({
    id: makeId("crypto"), kind:"crypto", name:f.get("name"),
    startingBalance:Number(f.get("startingBalance")), baseBalance:Number(f.get("startingBalance")),
    currentBalance:Number(f.get("currentBalance")), dailyGoal:Number(f.get("dailyGoal")||0),
    transactions: []
  });
  e.target.reset(); cryptoAccountDialog.close(); saveState();
});

// Dialog closing is handled with event delegation so Cancel/X works even when
// required fields are empty and for dialogs added later in the HTML.
document.addEventListener("click", event => {
  const explicitClose = event.target.closest("[data-close-dialog]");
  if (explicitClose) {
    event.preventDefault();
    document.getElementById(explicitClose.dataset.closeDialog)?.close();
    return;
  }

  const cancelButton = event.target.closest("[data-dialog-cancel], button[value=\"cancel\"]");
  if (cancelButton) {
    event.preventDefault();
    cancelButton.closest("dialog")?.close();
    return;
  }

  const dialog = event.target.closest("dialog");
  if (dialog && event.target === dialog) dialog.close();
});

const propAccountDialog = document.querySelector("#prop-account-dialog");
function updatePropDialogMode(){
  const form=document.querySelector("#prop-account-form");
  const instant=form.elements.programType.value==="instant";
  document.querySelector("#prop-profit-target-label").hidden=instant;
  if(instant) form.elements.profitTarget.value=0;
}
document.querySelector("#add-prop-account").addEventListener("click", () => {
  const form=document.querySelector("#prop-account-form"); form.reset(); updatePropDialogMode(); propAccountDialog.showModal();
});
document.querySelector("#prop-program-type").addEventListener("change",updatePropDialogMode);
document.querySelector("#prop-account-form").addEventListener("submit", e => {
  if (e.submitter?.value === "cancel") return;
  e.preventDefault();
  const f = new FormData(e.target);
  const starting=Number(f.get("accountSize")); const current=Number(f.get("currentBalance"));
  const programType=f.get("programType");
  const account = {
    id: makeId("prop"), kind:"prop", name:f.get("name"), accountSize:starting,
    programType, dailyLossMax:Number(f.get("dailyLossMax")), maxDrawdown:Number(f.get("maxDrawdown")),
    profitTarget:programType==="instant"?0:Number(f.get("profitTarget")||0),
    currentBalance:current, todayStartingBalance:Number(f.get("todayStartingBalance")||current),
    currentProfit:starting?(current-starting)/starting*100:0,
    status:programType==="instant"?"active":"challenge", active:programType==="instant",
    baseBalance:current, transactions: []
  };
  state.tradingAccounts.push(account);
  e.target.reset(); propAccountDialog.close(); saveState();
});

document.querySelector("#add-cash-account").addEventListener("click", () => openCashAccountDialog());
document.querySelector("#cash-account-form").addEventListener("submit", e => {
  if (e.submitter?.value === "cancel") return;
  e.preventDefault();
  const f = new FormData(e.target);
  const id = f.get("accountId");
  const account = { id: id || makeId("cash"), name: f.get("name").trim(), type: f.get("type"), balance: Number(f.get("balance") || 0) };
  if (id) {
    const index = state.cashAccounts.findIndex(x => x.id === id);
    if (index >= 0) state.cashAccounts[index] = account;
  } else state.cashAccounts.push(account);
  document.querySelector("#cash-account-dialog").close();
  saveState();
});

document.querySelector("#add-finance-item").addEventListener("click", () => openFinanceItemDialog());
document.querySelector("#finance-item-form").addEventListener("submit", e => {
  if (e.submitter?.value === "cancel") return;
  e.preventDefault();
  const f = new FormData(e.target);
  const id = f.get("itemId");
  const targetSection = f.get("section");
  const item = {
    id: id || makeId("finance"),
    label: f.get("label"),
    budget: Number(f.get("budget")||0),
    actual: Number(f.get("actual")||0),
    varianceAdjustment: Number(f.get("varianceAdjustment")||0)
  };
  if (id) removeFinanceItem(id);
  if (targetSection === "revenue") state.budget.revenue.push(item);
  else state.budget.sections.find(s=>s.name===targetSection).items.push(item);
  document.querySelector("#finance-item-dialog").close();
  saveState();
});

const foodDialog = document.querySelector("#food-dialog");
document.querySelector("#add-food-item").addEventListener("click", () => {
  document.querySelector("#food-form").elements.date.value = localDateKey();
  foodDialog.showModal();
});
document.querySelector("#food-form").addEventListener("submit", e => {
  if (e.submitter?.value === "cancel") return;
  e.preventDefault();
  const f = new FormData(e.target);
  const numberFields = ["protein","fat","carbs","sugar"];
  const item = {
    id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    date: f.get("date"), meal: f.get("meal"), name: f.get("name"), serving: f.get("serving")
  };
  numberFields.forEach(field => item[field] = Number(f.get(field) || 0));
  state.health.foodLog.push(item);

  const totals = sumFoodForDate(item.date);
  const d = healthDayData(item.date);
  d.protein = totals.protein >= 160;
  d.carbs = totals.carbs <= 25 && totals.carbs > 0;
  d.sugar = totals.sugar <= 25 && totals.sugar > 0;

  e.target.reset(); foodDialog.close(); saveState();
});
document.querySelector("#export-health-csv").addEventListener("click", () => {
  const blob = new Blob([healthCsv()], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `life-coach-health-history-${localDateKey()}.csv`; a.click();
  URL.revokeObjectURL(url);
});
document.querySelector("#import-data").addEventListener("click", () => {
  document.querySelector("#import-data-file").click();
});
document.querySelector("#import-data-file").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!imported.budget || !imported.crypto || !imported.health) throw new Error("Invalid file");
    if (confirm("Replace the current Life Coach data with this backup?")) {
      state = imported;
      saveState();
    }
  } catch {
    alert("That file is not a valid Life Coach backup.");
  }
  e.target.value = "";
});

renderAll();


// ===== Phase 6: recipes, million goal, trade journal, withdrawals, monthly close =====
function ensurePhase6State(){
  state.health.recipes = state.health.recipes || [];
  state.health.recipeLog = state.health.recipeLog || [];
  state.trades = state.trades || [];
  state.withdrawals = state.withdrawals || [];
  state.monthlyArchives = state.monthlyArchives || [];
  state.millionGoal = state.millionGoal || {amount:1000000,targetDate:new Date(Date.now()+365*86400000).toISOString().slice(0,10)};
  state.tradingAccounts.forEach(a=>{
    if(a.kind==="prop" && a.currentBalance===undefined) a.currentBalance=Number(a.accountSize||0);
    if(a.kind==="prop" && a.todayStartingBalance===undefined) a.todayStartingBalance=Number(a.currentBalance||a.accountSize||0);
    if(a.active===undefined) a.active = a.kind!=="prop" || a.programType==="instant" || a.status==="active";
  });
}
function phase6Download(name,text,type='text/plain'){const b=new Blob([text],{type});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function activeTradingAccounts(){return state.tradingAccounts.filter(a=>a.active!==false)}
function accountBalance(a){syncAccountFromTransactions(a);return Number(a.currentBalance ?? a.accountSize ?? 0)}
function renderMillionGoal(){
  const active=activeTradingAccounts();
  const capital=active.reduce((sum,a)=>sum+accountBalance(a),0);
  const propHealth=active.filter(a=>a.kind==="prop").map(propAccountHealth);
  const withdrawable=propHealth.reduce((sum,h)=>sum+h.withdrawable,0);
  const recovery=propHealth.reduce((sum,h)=>sum+h.recovery,0);
  const goal=Number(state.millionGoal.amount||1000000);
  const remaining=Math.max(0,goal-capital);
  const days=Math.max(1,Math.ceil((new Date(state.millionGoal.targetDate+'T12:00:00')-new Date())/86400000));
  const rate=capital>0&&goal>capital?(Math.pow(goal/capital,1/days)-1):0; const daily=capital*rate;
  document.querySelector('#million-active-capital').textContent=money(capital);
  document.querySelector('#million-withdrawable').textContent=money(withdrawable);
  document.querySelector('#million-recovery').textContent=money(recovery);
  document.querySelector('#million-remaining').textContent=money(remaining);
  document.querySelector('#million-daily-dollar').textContent=money(daily);
  document.querySelector('#million-daily-percent').textContent=percent(rate*100)+' / day';
  document.querySelector('#million-goal-amount').value=goal; document.querySelector('#million-target-date').value=state.millionGoal.targetDate;
  document.querySelector('#million-progress-start').textContent=`${money(capital)} current`;
  document.querySelector('#million-progress-goal').textContent=`${money(goal)} goal`;
  document.querySelector('#million-progress').style.width=Math.min(100,capital/goal*100)+'%';
  const recoveryText=recovery>0?` ${money(recovery)} is needed to bring negative prop accounts back to their starting balances; no profit is counted from those accounts until they are above breakeven.`:'';
  document.querySelector('#million-message').textContent=capital?`${days} days remain. Required compound pace: ${percent(rate*100)} per calendar day.${recoveryText}`:'Activate at least one trading account to calculate the required pace.';
}
function recipeTotalsToday(){return state.health.recipeLog.filter(x=>x.date===localDateKey()).reduce((t,x)=>{['protein','fat','carbs','sugar'].forEach(k=>t[k]+=Number(x[k]||0));return t},{protein:0,fat:0,carbs:0,sugar:0})}
function renderRecipes(){
  const grid=document.querySelector('#recipe-grid'); grid.innerHTML=state.health.recipes.length?'':'<p class="muted">Add your first saved recipe.</p>';
  state.health.recipes.forEach(r=>{const el=document.createElement('div');el.className='recipe-card';el.innerHTML=`<h4>${r.name}</h4><small>${r.serving||'1 serving'}</small><p class="muted">P ${r.protein}g · F ${r.fat}g · C ${r.carbs}g · S ${r.sugar}g</p><div class="actions"><button class="button recipe-log" data-id="${r.id}">Log today</button><button class="button secondary recipe-delete" data-id="${r.id}">Delete</button></div>`;grid.appendChild(el)});
  const totals=recipeTotalsToday(); document.querySelector('#meal-today-summary').innerHTML=['protein','fat','carbs','sugar'].map(k=>`<div><span>${k}</span><strong>${totals[k].toFixed(1)} g</strong></div>`).join('');
  const log=document.querySelector('#today-recipe-log'); const rows=state.health.recipeLog.filter(x=>x.date===localDateKey()); log.innerHTML=rows.length?'':'<p class="muted">No saved meals logged today.</p>'; rows.forEach(x=>{const d=document.createElement('div');d.className='compact-row';d.innerHTML=`<span><strong>${x.name}</strong><br><small>${x.serving||'1 serving'}</small></span><button class="icon-button recipe-log-delete" data-id="${x.id}">×</button>`;log.appendChild(d)});
}
function renderTrades(){
  const body=document.querySelector('#trade-log-body');body.innerHTML=''; let wins=0,net=0,totalR=0;
  state.trades.slice().sort((a,b)=>b.date.localeCompare(a.date)).forEach(t=>{net+=Number(t.netPnl);if(t.netPnl>0)wins++;totalR+=Number(t.r||0);const acc=state.tradingAccounts.find(a=>a.id===t.accountId);const tr=document.createElement('tr');tr.innerHTML=`<td>${t.date}</td><td>${acc?.name||'Removed'}</td><td>${t.symbol}</td><td>${t.side}</td><td>${money(t.netPnl)}</td><td>${Number(t.r||0).toFixed(2)}R</td><td>${t.setup||'—'}</td><td><button class="icon-button trade-delete" data-id="${t.id}">×</button></td>`;body.appendChild(tr)});
  const n=state.trades.length;document.querySelector('#trade-stats').innerHTML=`<div><span>Trades</span><strong>${n}</strong></div><div><span>Win rate</span><strong>${n?((wins/n)*100).toFixed(1):0}%</strong></div><div><span>Net P/L</span><strong>${money(net)}</strong></div><div><span>Average R</span><strong>${n?(totalR/n).toFixed(2):0}R</strong></div>`;
}
function renderWithdrawals(){
  const body=document.querySelector('#withdrawal-log-body');body.innerHTML='';let savings=0,cash=0;
  state.withdrawals.slice().sort((a,b)=>b.date.localeCompare(a.date)).forEach(w=>{if(w.destination==='Savings')savings+=w.net;if(w.destination==='Cash on Hand')cash+=w.net;const acc=state.tradingAccounts.find(a=>a.id===w.accountId);const tr=document.createElement('tr');tr.innerHTML=`<td>${w.date}</td><td>${acc?.name||'Removed'}</td><td>${money(w.net)}</td><td>${w.destination}</td><td>${w.note||'—'}</td><td><button class="icon-button withdrawal-delete" data-id="${w.id}">×</button></td>`;body.appendChild(tr)});
  document.querySelector('#withdrawal-savings').textContent=money(savings);document.querySelector('#withdrawal-cash').textContent=money(cash);
}
function populateAccountSelects(){['#trade-account-select','#withdrawal-account-select'].forEach(sel=>{const e=document.querySelector(sel);e.innerHTML=state.tradingAccounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')})}
function renderPhase6(){ensurePhase6State();renderRecipes();renderMillionGoal();renderTrades();renderWithdrawals();populateAccountSelects();
  document.querySelectorAll('.trading-account-card').forEach(card=>{const id=card.dataset.id;const a=state.tradingAccounts.find(x=>x.id===id);if(a&&!card.querySelector('.active-toggle')){const b=document.createElement('button');b.className='button secondary active-toggle';b.dataset.id=id;b.textContent=a.active===false?'Make active':'Pause from goal';card.appendChild(b)}})
}
const phase5RenderAll=renderAll;renderAll=function(){phase5RenderAll();renderPhase6()};ensurePhase6State();

document.querySelector('#add-recipe').addEventListener('click',()=>{document.querySelector('#recipe-form').reset();document.querySelector('#recipe-dialog').showModal()});
document.querySelector('#recipe-form').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();const f=new FormData(e.target);state.health.recipes.push({id:makeId('recipe'),name:f.get('name'),serving:f.get('serving'),protein:Number(f.get('protein')||0),fat:Number(f.get('fat')||0),carbs:Number(f.get('carbs')||0),sugar:Number(f.get('sugar')||0),ingredients:f.get('ingredients')});document.querySelector('#recipe-dialog').close();saveState()});
document.querySelector('#recipe-grid').addEventListener('click',e=>{const r=state.health.recipes.find(x=>x.id===e.target.dataset.id);if(e.target.classList.contains('recipe-log')&&r){state.health.recipeLog.push({...r,id:makeId('meal'),recipeId:r.id,date:localDateKey()});saveState()}if(e.target.classList.contains('recipe-delete')){state.health.recipes=state.health.recipes.filter(x=>x.id!==e.target.dataset.id);saveState()}});
document.querySelector('#today-recipe-log').addEventListener('click',e=>{if(e.target.classList.contains('recipe-log-delete')){state.health.recipeLog=state.health.recipeLog.filter(x=>x.id!==e.target.dataset.id);saveState()}});
document.querySelector('#save-million-goal').addEventListener('click',()=>{state.millionGoal.amount=Number(document.querySelector('#million-goal-amount').value||1000000);state.millionGoal.targetDate=document.querySelector('#million-target-date').value;saveState()});
document.querySelector('#trading-account-grid').addEventListener('click',e=>{if(e.target.classList.contains('active-toggle')){e.stopPropagation();const a=state.tradingAccounts.find(x=>x.id===e.target.dataset.id);a.active=!a.active;saveState()}});
document.querySelector('#add-trade').addEventListener('click',()=>{document.querySelector('#trade-form').reset();document.querySelector('#trade-form').elements.date.value=localDateKey();populateAccountSelects();document.querySelector('#trade-dialog').showModal()});
document.querySelector('#trade-form').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();const f=new FormData(e.target),risk=Number(f.get('risk')||0),pnl=Number(f.get('netPnl')||0);state.trades.push({id:makeId('trade'),date:f.get('date'),accountId:f.get('accountId'),symbol:f.get('symbol'),side:f.get('side'),entry:Number(f.get('entry')||0),exit:Number(f.get('exit')||0),risk,netPnl:pnl,r:risk?pnl/risk:0,setup:f.get('setup'),grade:f.get('grade'),notes:f.get('notes')});document.querySelector('#trade-dialog').close();saveState()});
document.querySelector('#trade-log-body').addEventListener('click',e=>{if(e.target.classList.contains('trade-delete')){state.trades=state.trades.filter(x=>x.id!==e.target.dataset.id);saveState()}});
document.querySelector('#export-trades').addEventListener('click',()=>{const rows=[['Date','Account','Symbol','Side','Entry','Exit','Risk','Net P/L','R','Setup','Grade','Notes'],...state.trades.map(t=>[t.date,state.tradingAccounts.find(a=>a.id===t.accountId)?.name||'',t.symbol,t.side,t.entry,t.exit,t.risk,t.netPnl,t.r,t.setup,t.grade,t.notes])];phase6Download(`life-coach-trades-${localDateKey()}.csv`,rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n'),'text/csv')});
document.querySelector('#add-withdrawal').addEventListener('click',()=>{document.querySelector('#withdrawal-form').reset();document.querySelector('#withdrawal-form').elements.date.value=localDateKey();populateAccountSelects();document.querySelector('#withdrawal-dialog').showModal()});
document.querySelector('#withdrawal-form').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();const f=new FormData(e.target),gross=Number(f.get('gross')),fees=Number(f.get('fees')||0),id=f.get('accountId');state.withdrawals.push({id:makeId('wd'),date:f.get('date'),accountId:id,gross,fees,net:gross-fees,destination:f.get('destination'),note:f.get('note')});const a=state.tradingAccounts.find(x=>x.id===id);if(a){a.transactions=a.transactions||[];a.transactions.push({id:makeId('tx'),date:f.get('date'),type:'withdrawal',amount:gross,fee:fees,note:`${f.get('destination')}: ${f.get('note')||''}`})}document.querySelector('#withdrawal-dialog').close();saveState()});
document.querySelector('#withdrawal-log-body').addEventListener('click',e=>{if(e.target.classList.contains('withdrawal-delete')){state.withdrawals=state.withdrawals.filter(x=>x.id!==e.target.dataset.id);saveState()}});
document.querySelector('#monthly-close').addEventListener('click',()=>{if(!confirm('Download a month-end backup and archive this month before resetting actuals?'))return;const month=new Date().toISOString().slice(0,7);const snapshot={month,closedAt:new Date().toISOString(),budget:structuredClone(state.budget),gapSpending:structuredClone(state.gapSpending)};state.monthlyArchives.push(snapshot);phase6Download(`life-coach-monthly-close-${month}.json`,JSON.stringify(snapshot,null,2),'application/json');state.budget.revenue.forEach(x=>x.actual=0);state.budget.sections.flatMap(s=>s.items).forEach(x=>x.actual=0);state.gapSpending=[];saveState();alert('Month archived. Recurring budgets and accounts were carried forward.')});
renderAll();

// ===== Phase 7: long-term investments, DCA cost basis, live market prices =====
const COINGECKO_SYMBOL_MAP = {
  BTC:'bitcoin', ETH:'ethereum', ADA:'cardano', AVAX:'avalanche-2', LINK:'chainlink',
  DOGE:'dogecoin', DOT:'polkadot', NEAR:'near', HBAR:'hedera-hashgraph', ALGO:'algorand',
  CRO:'crypto-com-chain', FET:'fetch-ai', ICP:'internet-computer', GALA:'gala', AMP:'amp-token',
  AERO:'aerodrome-finance', BEAM:'beam-2', FLUX:'zelcash', HNT:'helium', IOTA:'iota', OM:'mantra-dao'
};
function ensureInvestmentState(){
  state.investments = state.investments || {accounts:[], transactions:[], prices:{}, settings:{twelveDataKey:'', proxyUrl:'', lastUpdated:''}};
  state.investments.accounts = state.investments.accounts || [];
  state.investments.transactions = state.investments.transactions || [];
  state.investments.prices = state.investments.prices || {};
  state.investments.settings = state.investments.settings || {twelveDataKey:'',proxyUrl:'',lastUpdated:''};
}
function investmentAccount(id){ return state.investments.accounts.find(a=>a.id===id); }
function holdingKey(tx){ return `${tx.accountId}|${String(tx.symbol||'').toUpperCase()}`; }
function investmentHoldings(){
  ensureInvestmentState();
  const map={};
  state.investments.transactions.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'') || Number(a.createdAt||0)-Number(b.createdAt||0)).forEach(tx=>{
    const key=holdingKey(tx), symbol=String(tx.symbol||'').toUpperCase();
    if(!map[key]) map[key]={key,accountId:tx.accountId,symbol,name:tx.name||symbol,assetType:tx.assetType||'stock',priceId:tx.priceId||'',quantity:0,costBasis:0,realizedPnl:0,dividends:0};
    const h=map[key]; h.name=tx.name||h.name; h.assetType=tx.assetType||h.assetType; h.priceId=tx.priceId||h.priceId;
    const qty=Number(tx.quantity||0), price=Number(tx.price||0), fees=Number(tx.fees||0);
    if(tx.type==='buy') { h.quantity+=qty; h.costBasis+=qty*price+fees; }
    else if(tx.type==='sell') {
      const avg=h.quantity>0?h.costBasis/h.quantity:0; const sellQty=Math.min(qty,h.quantity);
      h.realizedPnl += sellQty*price-fees-sellQty*avg;
      h.quantity-=sellQty; h.costBasis=Math.max(0,h.costBasis-sellQty*avg);
    } else if(tx.type==='dividend') { h.dividends += Number(tx.amount || price || 0); h.realizedPnl += Number(tx.amount || price || 0); }
  });
  return Object.values(map).filter(h=>h.quantity>0.0000000001 || h.realizedPnl || h.dividends).map(h=>{
    const p=state.investments.prices[h.key] || {};
    h.avgCost=h.quantity?h.costBasis/h.quantity:0; h.currentPrice=Number(p.price ?? h.avgCost ?? 0);
    h.value=h.quantity*h.currentPrice; h.unrealized=h.value-h.costBasis; h.unrealizedPct=h.costBasis?h.unrealized/h.costBasis*100:0; h.lastUpdated=p.updatedAt||'';
    return h;
  });
}
function investmentTotals(){return investmentHoldings().reduce((t,h)=>{t.value+=h.value;t.cost+=h.costBasis;t.unrealized+=h.unrealized;t.realized+=h.realizedPnl;return t},{value:0,cost:0,unrealized:0,realized:0});}
function populateInvestmentAccounts(){
  const sel=document.querySelector('#investment-account-select');
  sel.innerHTML=state.investments.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
}
function renderInvestments(){
  ensureInvestmentState(); populateInvestmentAccounts();
  const totals=investmentTotals();
  document.querySelector('#investment-total-value').textContent=money(totals.value);
  document.querySelector('#investment-total-cost').textContent=money(totals.cost);
  document.querySelector('#investment-unrealized').textContent=money(totals.unrealized);
  document.querySelector('#investment-unrealized').className=totals.unrealized>=0?'var-good':'var-bad';
  document.querySelector('#investment-unrealized-pct').textContent=percent(totals.cost?totals.unrealized/totals.cost*100:0);
  document.querySelector('#investment-realized').textContent=money(totals.realized);
  const updated=state.investments.settings.lastUpdated;
  document.querySelector('#investment-price-status').textContent=updated?`Prices updated ${new Date(updated).toLocaleString()}`:'No prices refreshed';
  document.querySelector('#twelve-data-key').value=state.investments.settings.twelveDataKey||'';
  document.querySelector('#investment-proxy-url').value=state.investments.settings.proxyUrl||'';
  const accountGrid=document.querySelector('#investment-account-grid'); accountGrid.innerHTML='';
  state.investments.accounts.forEach(a=>{
    const hs=investmentHoldings().filter(h=>h.accountId===a.id); const value=hs.reduce((s,h)=>s+h.value,0), cost=hs.reduce((s,h)=>s+h.costBasis,0);
    const card=document.createElement('article');card.className='trading-account-card';card.innerHTML=`<p class="eyebrow">${a.platform||a.accountType||'ACCOUNT'}</p><h3>${a.name}</h3><div class="account-detail-summary"><div><span>Value</span><strong>${money(value)}</strong></div><div><span>Cost basis</span><strong>${money(cost)}</strong></div><div><span>Holdings</span><strong>${hs.length}</strong></div></div><button class="button secondary investment-account-delete" data-id="${a.id}">Remove</button>`;accountGrid.appendChild(card);
  });
  if(!state.investments.accounts.length) accountGrid.innerHTML='<p class="muted">Add Fidelity, Robinhood, Webull, or a crypto wallet to begin.</p>';
  const hb=document.querySelector('#investment-holdings-body');hb.innerHTML='';
  investmentHoldings().sort((a,b)=>b.value-a.value).forEach(h=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${investmentAccount(h.accountId)?.name||'Removed'}</td><td><strong>${h.symbol}</strong><br><small>${h.name||''}</small></td><td>${h.assetType}</td><td>${Number(h.quantity).toLocaleString('en-US',{maximumFractionDigits:8})}</td><td>${money(h.avgCost)}</td><td>${money(h.currentPrice)}</td><td>${money(h.value)}</td><td class="${h.unrealized>=0?'var-good':'var-bad'}">${money(h.unrealized)}<br><small>${percent(h.unrealizedPct)}</small></td><td><button class="icon-button investment-holding-edit" data-key="${h.key}">+</button></td>`;hb.appendChild(tr)});
  if(!investmentHoldings().length) hb.innerHTML='<tr><td colspan="9" class="muted">No holdings yet. Add a buy transaction or import your crypto CSV.</td></tr>';
  const tb=document.querySelector('#investment-transactions-body');tb.innerHTML='';
  state.investments.transactions.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).forEach(tx=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${tx.date}</td><td>${investmentAccount(tx.accountId)?.name||'Removed'}</td><td>${tx.symbol}</td><td>${tx.type}</td><td>${Number(tx.quantity||0).toLocaleString('en-US',{maximumFractionDigits:8})}</td><td>${money(tx.price||tx.amount||0)}</td><td>${money(tx.fees||0)}</td><td>${tx.realizedPnl===undefined?'—':money(tx.realizedPnl)}</td><td><button class="icon-button investment-tx-delete" data-id="${tx.id}">×</button></td>`;tb.appendChild(tr)});
}
async function fetchInvestmentPrice(h){
  if(h.assetType==='crypto'){
    const id=h.priceId || COINGECKO_SYMBOL_MAP[h.symbol];
    if(!id) throw new Error(`${h.symbol}: add a CoinGecko ID`);
    const r=await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`);
    if(!r.ok) throw new Error(`${h.symbol}: CoinGecko ${r.status}`); const d=await r.json(); const price=d[id]?.usd; if(price===undefined) throw new Error(`${h.symbol}: price not found`); return Number(price);
  }
  const settings=state.investments.settings; let url;
  if(settings.proxyUrl) url=`${settings.proxyUrl.replace(/\/$/,'')}?provider=twelvedata&symbol=${encodeURIComponent(h.symbol)}`;
  else { if(!settings.twelveDataKey) throw new Error(`${h.symbol}: Twelve Data API key required`); url=`https://api.twelvedata.com/price?symbol=${encodeURIComponent(h.symbol)}&apikey=${encodeURIComponent(settings.twelveDataKey)}`; }
  const r=await fetch(url); if(!r.ok) throw new Error(`${h.symbol}: price service ${r.status}`); const d=await r.json(); if(!d.price) throw new Error(`${h.symbol}: ${d.message||'price not found'}`); return Number(d.price);
}
async function refreshInvestmentPrices(){
  const btn=document.querySelector('#refresh-investment-prices');btn.disabled=true;btn.textContent='Refreshing…';
  const errors=[]; const hs=investmentHoldings();
  for(const h of hs){try{const price=await fetchInvestmentPrice(h);state.investments.prices[h.key]={price,updatedAt:new Date().toISOString()};}catch(err){errors.push(err.message);}}
  state.investments.settings.lastUpdated=new Date().toISOString();
  if(typeof checkReachedTargets==='function') checkReachedTargets(true);
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); renderAll(); btn.disabled=false;btn.textContent='Refresh prices';
  if(errors.length) alert(`Some prices were not updated:\n\n${errors.slice(0,12).join('\n')}${errors.length>12?'\n…':''}`);
}
function csvParse(text){
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'&&quoted&&n==='"'){field+='"';i++;}else if(c==='"'){quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(field);if(row.some(x=>x!==''))rows.push(row);row=[];field='';}else field+=c;}
  row.push(field);if(row.some(x=>x!==''))rows.push(row);return rows;
}
function cleanNumber(v){return Number(String(v??'').replace(/[$,%\s]/g,'').replaceAll(',',''))||0;}
function importCryptoPowerCsv(text){
  const rows=csvParse(text);const hi=rows.findIndex(r=>r.includes('Crypto')&&r.includes('Amount')&&r.includes('Cost'));if(hi<0)throw new Error('Could not find the Crypto/Amount/Cost header row.');
  const headers=rows[hi];const idx=n=>headers.indexOf(n);let added=0;
  rows.slice(hi+1).forEach(r=>{const symbol=String(r[idx('Crypto')]||'').trim();const qty=cleanNumber(r[idx('Amount')]);const totalCost=cleanNumber(r[idx('Cost')]);if(!symbol||qty<=0)return;const platform=String(r[idx('Exchange')]||'Crypto Wallet').trim()||'Crypto Wallet';let acc=state.investments.accounts.find(a=>a.name.toLowerCase()===platform.toLowerCase());if(!acc){acc={id:makeId('invacct'),name:platform,platform,accountType:'Crypto'};state.investments.accounts.push(acc)}const price=qty?totalCost/qty:cleanNumber(r[idx('Price')]);const tx={id:makeId('invtx'),date:localDateKey(),accountId:acc.id,type:'buy',assetType:'crypto',symbol:symbol.toUpperCase(),name:symbol,priceId:COINGECKO_SYMBOL_MAP[symbol.toUpperCase()]||'',quantity:qty,price,fees:0,note:'Imported from Crypto Power Profit Sheet',createdAt:Date.now()+added};state.investments.transactions.push(tx);const current=cleanNumber(r[idx('Price')]);if(current>0)state.investments.prices[holdingKey(tx)]={price:current,updatedAt:new Date().toISOString(),source:'import'};added++;});return added;
}
function investmentCsv(){const rows=[['Account','Platform','Symbol','Name','Asset Type','Quantity','Average Cost','Cost Basis','Current Price','Current Value','Unrealized P/L','Unrealized %','Realized P/L'],...investmentHoldings().map(h=>[investmentAccount(h.accountId)?.name||'',investmentAccount(h.accountId)?.platform||'',h.symbol,h.name,h.assetType,h.quantity,h.avgCost,h.costBasis,h.currentPrice,h.value,h.unrealized,h.unrealizedPct,h.realizedPnl])];return rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');}
const phase6RenderAll=renderAll;renderAll=function(){phase6RenderAll();renderInvestments();};ensureInvestmentState();
document.querySelector('#add-investment-account').addEventListener('click',()=>{document.querySelector('#investment-account-form').reset();document.querySelector('#investment-account-dialog').showModal()});
document.querySelector('#investment-account-form').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();const f=new FormData(e.target);state.investments.accounts.push({id:makeId('invacct'),name:f.get('name'),platform:f.get('platform'),accountType:f.get('accountType')});document.querySelector('#investment-account-dialog').close();saveState()});
document.querySelector('#add-investment-transaction').addEventListener('click',()=>{if(!state.investments.accounts.length){alert('Add an investment account first.');return;}document.querySelector('#investment-transaction-form').reset();document.querySelector('#investment-transaction-form').elements.date.value=localDateKey();populateInvestmentAccounts();document.querySelector('#investment-transaction-dialog').showModal()});
document.querySelector('#investment-transaction-form').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();const f=new FormData(e.target),type=f.get('type'),qty=Number(f.get('quantity')||0),price=Number(f.get('price')||0),fees=Number(f.get('fees')||0);if(type!=='dividend'&&qty<=0){alert('Quantity must be greater than zero.');return;}const tx={id:makeId('invtx'),date:f.get('date'),accountId:f.get('accountId'),type,assetType:f.get('assetType'),symbol:String(f.get('symbol')).toUpperCase().trim(),name:f.get('name'),priceId:f.get('priceId'),quantity:qty,price,amount:type==='dividend'?price:0,fees,note:f.get('note'),createdAt:Date.now()};if(type==='sell'){const h=investmentHoldings().find(h=>h.key===holdingKey(tx));tx.realizedPnl=h?(qty*price-fees-qty*h.avgCost):0;}state.investments.transactions.push(tx);document.querySelector('#investment-transaction-dialog').close();saveState()});
document.querySelector('#investment-holdings-body').addEventListener('click',e=>{if(!e.target.classList.contains('investment-holding-edit'))return;const h=investmentHoldings().find(x=>x.key===e.target.dataset.key);if(!h)return;const form=document.querySelector('#investment-transaction-form');form.reset();populateInvestmentAccounts();form.elements.date.value=localDateKey();form.elements.accountId.value=h.accountId;form.elements.assetType.value=h.assetType;form.elements.symbol.value=h.symbol;form.elements.name.value=h.name;form.elements.priceId.value=h.priceId||'';document.querySelector('#investment-transaction-dialog').showModal()});
document.querySelector('#investment-transactions-body').addEventListener('click',e=>{if(e.target.classList.contains('investment-tx-delete')&&confirm('Delete this investment transaction?')){state.investments.transactions=state.investments.transactions.filter(x=>x.id!==e.target.dataset.id);saveState()}});
document.querySelector('#investment-account-grid').addEventListener('click',e=>{if(e.target.classList.contains('investment-account-delete')){const id=e.target.dataset.id;if(state.investments.transactions.some(t=>t.accountId===id)){alert('Delete or move this account’s transactions before removing the account.');return;}state.investments.accounts=state.investments.accounts.filter(a=>a.id!==id);saveState()}});
document.querySelector('#save-investment-settings').addEventListener('click',()=>{state.investments.settings.twelveDataKey=document.querySelector('#twelve-data-key').value.trim();state.investments.settings.proxyUrl=document.querySelector('#investment-proxy-url').value.trim();saveState()});
document.querySelector('#refresh-investment-prices').addEventListener('click',refreshInvestmentPrices);
document.querySelector('#investment-import').addEventListener('click',()=>document.querySelector('#investment-import-file').click());
document.querySelector('#investment-import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const added=importCryptoPowerCsv(await file.text());saveState();alert(`Imported ${added} crypto holdings. Review CoinGecko IDs before refreshing less-common tokens.`);}catch(err){alert(err.message);}e.target.value='';});
document.querySelector('#export-investments').addEventListener('click',()=>phase6Download(`life-coach-investments-${localDateKey()}.csv`,investmentCsv(),'text/csv'));
renderAll();

// ===== Phase 8: separate stocks/ETFs from crypto + take-profit alerts =====
let investmentDisplayMode = localStorage.getItem('slyInvestmentDisplayMode') || 'stocks';
function ensureProfitTargetState(){
  ensureInvestmentState();
  state.investments.profitTargets = state.investments.profitTargets || [];
}
function cryptoHoldings(){ return investmentHoldings().filter(h=>h.assetType==='crypto'); }
function targetPlan(target, holding){
  const targetPrice=Number(target.targetPrice||0), amount=Number(target.amount||0);
  const projectedValue=holding.quantity*targetPrice;
  const projectedProfit=Math.max(0,projectedValue-holding.costBasis);
  let tokens=0, proceeds=0, label='';
  if(target.method==='positionPct'){ tokens=holding.quantity*Math.min(100,amount)/100; proceeds=tokens*targetPrice; label=`${amount}% of position`; }
  else if(target.method==='profitPct'){ proceeds=projectedProfit*Math.min(100,amount)/100; tokens=targetPrice?proceeds/targetPrice:0; label=`${amount}% of projected profit`; }
  else if(target.method==='fixedDollar'){ proceeds=amount; tokens=targetPrice?amount/targetPrice:0; label=`${money(amount)} proceeds`; }
  else if(target.method==='fixedTokens'){ tokens=amount; proceeds=tokens*targetPrice; label=`${Number(amount).toLocaleString('en-US',{maximumFractionDigits:8})} tokens`; }
  else { proceeds=Math.min(holding.costBasis,projectedValue); tokens=targetPrice?proceeds/targetPrice:0; label='Recover cost basis'; }
  tokens=Math.max(0,Math.min(tokens,holding.quantity)); proceeds=tokens*targetPrice;
  return {tokens,proceeds,label,projectedProfit};
}
function targetStatus(target, holding){
  if(target.status==='completed') return 'completed';
  return Number(holding.currentPrice||0)>=Number(target.targetPrice||0)?'reached':'waiting';
}
function filterInvestmentDisplay(){
  const isCrypto=investmentDisplayMode==='crypto';
  document.querySelectorAll('.investment-tab').forEach(b=>b.classList.toggle('active',b.dataset.investmentMode===investmentDisplayMode));
  const desc=document.querySelector('#investment-mode-description');
  if(desc) desc.textContent=isCrypto?'Long-term crypto tokens, wallets, dollar-cost averaging, live prices, and take-profit targets.':'Fidelity, Robinhood, Webull, retirement, stocks, ETFs, dividends, and dollar-cost averaging.';
  const targetCard=document.querySelector('#crypto-profit-targets-card'); if(targetCard) targetCard.hidden=!isCrypto;
  const accountCards=[...document.querySelectorAll('#investment-account-grid .trading-account-card')];
  accountCards.forEach(card=>{
    const id=card.querySelector('.investment-account-delete')?.dataset.id;
    const acct=investmentAccount(id); const cryptoAcct=['crypto','wallet'].includes(String(acct?.accountType||'').toLowerCase());
    card.hidden=isCrypto?!cryptoAcct:cryptoAcct;
  });
  [...document.querySelectorAll('#investment-holdings-body tr')].forEach(row=>{
    if(row.querySelector('td.muted')) return;
    const type=(row.cells[2]?.textContent||'').trim().toLowerCase(); row.hidden=isCrypto?type!=='crypto':type==='crypto';
  });
  [...document.querySelectorAll('#investment-transactions-body tr')].forEach(row=>{
    const txId=row.querySelector('.investment-tx-delete')?.dataset.id;
    const tx=state.investments.transactions.find(x=>x.id===txId); if(tx) row.hidden=isCrypto?tx.assetType!=='crypto':tx.assetType==='crypto';
  });
}
function populateProfitTargetHoldings(){
  const select=document.querySelector('#profit-target-holding'); if(!select)return;
  const hs=cryptoHoldings();
  select.innerHTML=hs.map(h=>`<option value="${h.key}">${investmentAccount(h.accountId)?.name||'Account'} — ${h.symbol} (${Number(h.quantity).toLocaleString('en-US',{maximumFractionDigits:8})})</option>`).join('');
}
function renderProfitTargets(){
  ensureProfitTargetState(); populateProfitTargetHoldings();
  const body=document.querySelector('#profit-targets-body'); if(!body)return; body.innerHTML='';
  state.investments.profitTargets.slice().sort((a,b)=>Number(a.targetPrice)-Number(b.targetPrice)).forEach(t=>{
    const h=cryptoHoldings().find(x=>x.key===t.holdingKey); if(!h)return;
    const plan=targetPlan(t,h), status=targetStatus(t,h);
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><strong>${h.symbol}</strong><br><small>${investmentAccount(h.accountId)?.name||''}</small></td><td>${money(t.targetPrice)}</td><td>${plan.label}<br><small>${t.note||''}</small></td><td>${plan.tokens.toLocaleString('en-US',{maximumFractionDigits:8})}</td><td>${money(plan.proceeds)}</td><td><span class="target-status ${status}">${status==='reached'?'Target reached':status==='completed'?'Completed':'Waiting'}</span></td><td><div class="inline-actions">${status==='reached'?`<button class="small-button button execute-profit-target" data-id="${t.id}">Log sale</button>`:''}<button class="icon-button delete-profit-target" data-id="${t.id}">×</button></div></td>`;
    body.appendChild(tr);
  });
  if(!body.children.length) body.innerHTML='<tr><td colspan="7" class="muted">No crypto take-profit targets yet.</td></tr>';
}
function previewProfitTarget(){
  const form=document.querySelector('#profit-target-form'), box=document.querySelector('#profit-target-preview'); if(!form||!box)return;
  const f=new FormData(form), h=cryptoHoldings().find(x=>x.key===f.get('holdingKey'));
  if(!h||!Number(f.get('targetPrice'))){box.textContent='Choose a holding and target price to preview the sale.';return;}
  const plan=targetPlan({targetPrice:Number(f.get('targetPrice')),method:f.get('method'),amount:Number(f.get('amount'))},h);
  box.innerHTML=`At <strong>${money(f.get('targetPrice'))}</strong>, log a sale of approximately <strong>${plan.tokens.toLocaleString('en-US',{maximumFractionDigits:8})} ${h.symbol}</strong> for <strong>${money(plan.proceeds)}</strong>. Estimated projected profit at that price: <strong>${money(plan.projectedProfit)}</strong>.`;
}
function checkReachedTargets(sendNotifications=false){
  ensureProfitTargetState();
  state.investments.profitTargets.forEach(t=>{
    const h=cryptoHoldings().find(x=>x.key===t.holdingKey); if(!h||t.status==='completed')return;
    const reached=targetStatus(t,h)==='reached';
    if(reached && !t.notifiedAt){
      t.notifiedAt=new Date().toISOString();
      if(sendNotifications && 'Notification' in window && Notification.permission==='granted') new Notification(`${h.symbol} take-profit target reached`,{body:`Current price ${money(h.currentPrice)} reached your ${money(t.targetPrice)} target.`});
    }
    if(!reached) t.notifiedAt='';
  });
}
const phase7RenderInvestments=renderInvestments;
renderInvestments=function(){ phase7RenderInvestments(); renderProfitTargets(); filterInvestmentDisplay(); };

document.querySelectorAll('.investment-tab').forEach(btn=>btn.addEventListener('click',()=>{investmentDisplayMode=btn.dataset.investmentMode;localStorage.setItem('slyInvestmentDisplayMode',investmentDisplayMode);filterInvestmentDisplay()}));
document.querySelector('#add-profit-target')?.addEventListener('click',()=>{if(!cryptoHoldings().length){alert('Add a crypto buy transaction first.');return;}const form=document.querySelector('#profit-target-form');form.reset();populateProfitTargetHoldings();previewProfitTarget();document.querySelector('#profit-target-dialog').showModal();});
document.querySelector('#profit-target-method')?.addEventListener('change',e=>{const label=document.querySelector('#profit-target-amount-label');label.childNodes[0].textContent=e.target.value==='positionPct'||e.target.value==='profitPct'?'Percentage ':e.target.value==='fixedDollar'?'Dollar amount ':e.target.value==='fixedTokens'?'Token quantity ':'Amount not required ';const input=label.querySelector('input');input.disabled=e.target.value==='recoverPrincipal';previewProfitTarget();});
document.querySelector('#profit-target-form')?.addEventListener('input',previewProfitTarget);
document.querySelector('#profit-target-form')?.addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();const f=new FormData(e.target);state.investments.profitTargets.push({id:makeId('target'),holdingKey:f.get('holdingKey'),targetPrice:Number(f.get('targetPrice')),method:f.get('method'),amount:Number(f.get('amount')||0),note:f.get('note'),status:'active',createdAt:Date.now()});document.querySelector('#profit-target-dialog').close();saveState();});
document.querySelector('#profit-targets-body')?.addEventListener('click',e=>{
  const id=e.target.dataset.id; if(!id)return;
  if(e.target.classList.contains('delete-profit-target')){if(confirm('Delete this take-profit target?')){state.investments.profitTargets=state.investments.profitTargets.filter(t=>t.id!==id);saveState();}return;}
  if(e.target.classList.contains('execute-profit-target')){
    const t=state.investments.profitTargets.find(x=>x.id===id),h=cryptoHoldings().find(x=>x.key===t?.holdingKey); if(!t||!h)return;
    const plan=targetPlan(t,h), executionPrice=Number(h.currentPrice||t.targetPrice);
    if(!confirm(`Log a sale of ${plan.tokens.toLocaleString('en-US',{maximumFractionDigits:8})} ${h.symbol} at ${money(executionPrice)}?`))return;
    state.investments.transactions.push({id:makeId('invtx'),date:localDateKey(),accountId:h.accountId,type:'sell',assetType:'crypto',symbol:h.symbol,name:h.name,priceId:h.priceId,quantity:plan.tokens,price:executionPrice,fees:0,note:`Take-profit target: ${t.note||t.method}`,createdAt:Date.now(),profitTargetId:t.id});
    t.status='completed';t.completedAt=new Date().toISOString();saveState();
  }
});
document.querySelector('#enable-price-notifications')?.addEventListener('click',async()=>{if(!('Notification' in window)){alert('Browser notifications are not supported here.');return;}const result=await Notification.requestPermission();alert(result==='granted'?'Browser price alerts enabled. Keep the page open for alerts.':'Notification permission was not granted.');});
ensureProfitTargetState();renderAll();
