/* Pillar – offline weight-gain & muscle app. Data stays in localStorage. */
(function () {
  'use strict';
  const KEY = 'pillar.v1';
  const LB = 0.45359237, IN = 2.54;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const round = (n, d = 0) => { const p = Math.pow(10, d); return Math.round(n * p) / p; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
  const today = () => ymd(new Date());
  const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
  const fmtDate = (s, opts = { weekday: 'short', month: 'short', day: 'numeric' }) => parseYmd(s).toLocaleDateString(undefined, opts);

  /* ---------------- Data ---------------- */
  const FOODS = [
    // name, serving, kcal, protein, carbs, fat, category, emoji  (approximate values)
        ['Whole milk', '1 cup (240 ml)', 150, 8, 12, 8, 'Dairy', '🥛'],
    ['Chocolate milk', '1 cup (240 ml)', 210, 8, 26, 8, 'Dairy', '🍫'],
    ['Whey protein', '1 scoop (~30 g)', 120, 24, 3, 1.5, 'Shakes', '🥤'],
    ['Greek yogurt, whole milk', '1 cup (227 g)', 220, 20, 9, 11, 'Dairy', '🥣'],
    ['Cottage cheese, 4%', '1 cup (226 g)', 220, 25, 8, 10, 'Dairy', '🥣'],
    ['Cheddar cheese', '1 oz (28 g)', 115, 7, 0.4, 9.5, 'Dairy', '🧀'],
    ['Large egg', '1 egg', 72, 6, 0.4, 5, 'Protein', '🥚'],
    ['Chicken breast, cooked', '4 oz (113 g)', 187, 35, 0, 4, 'Protein', '🍗'],
    ['Ground beef 85/15, cooked', '4 oz (113 g)', 290, 28, 0, 19, 'Protein', '🥩'],
    ['Salmon, cooked', '4 oz (113 g)', 235, 25, 0, 14, 'Protein', '🐟'],
    ['Canned tuna, drained', '1 can (~5 oz)', 130, 29, 0, 1, 'Protein', '🐟'],
    ['Black beans', '1 cup cooked', 227, 15, 41, 1, 'Protein', '🫘'],
    ['Peanut butter', '2 tbsp (32 g)', 190, 7, 7, 16, 'Fats & nuts', '🥜'],
    ['Almonds', '1 oz (~23 nuts)', 164, 6, 6, 14, 'Fats & nuts', '🌰'],
    ['Walnuts', '1 oz (28 g)', 185, 4, 4, 18, 'Fats & nuts', '🌰'],
    ['Trail mix', '¼ cup (~38 g)', 175, 5, 16, 11, 'Fats & nuts', '🥜'],
    ['Olive oil', '1 tbsp', 119, 0, 0, 13.5, 'Fats & nuts', '🫒'],
    ['Butter', '1 tbsp', 102, 0, 0, 11.5, 'Fats & nuts', '🧈'],
    ['Avocado', '½ medium', 160, 2, 9, 15, 'Fats & nuts', '🥑'],
    ['Hummus', '¼ cup (60 g)', 140, 4, 8, 10, 'Fats & nuts', '🫓'],
    ['Dark chocolate 70%', '1 oz (28 g)', 170, 2, 13, 12, 'Snacks', '🍫'],
    ['Oats (dry)', '½ cup (40 g)', 150, 5, 27, 3, 'Carbs', '🥣'],
    ['Granola', '½ cup (~55 g)', 260, 6, 36, 10, 'Carbs', '🥣'],
    ['White rice, cooked', '1 cup (158 g)', 205, 4, 45, 0.4, 'Carbs', '🍚'],
    ['Pasta, cooked', '1 cup (140 g)', 220, 8, 43, 1.3, 'Carbs', '🍝'],
    ['Bagel, plain', '1 medium', 245, 10, 48, 1.5, 'Carbs', '🥯'],
    ['Whole wheat bread', '1 slice', 80, 4, 14, 1, 'Carbs', '🍞'],
    ['Flour tortilla, large', '1 tortilla (10")', 200, 5, 34, 5, 'Carbs', '🌯'],
    ['Sweet potato', '1 medium, baked', 112, 2, 26, 0.1, 'Carbs', '🍠'],
    ['Banana', '1 medium', 105, 1.3, 27, 0.4, 'Fruit', '🍌'],
    ['Raisins', '¼ cup (40 g)', 120, 1, 32, 0, 'Fruit', '🍇'],
  ].map((f, i) => ({ id: 'b' + i, name: f[0], serving: f[1], kcal: f[2], protein: f[3], carbs: f[4], fat: f[5], cat: f[6], emoji: f[7] }));
  const C = window.BB_CONTENT || { recipes: [], tips: [], faqs: [], sources: {} };
  C.recipes.forEach(r => FOODS.push({ id: r.id, name: r.name, serving: '1 serving (recipe)', kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat, cat: 'Recipes', emoji: r.emoji }));

  const TIPS = [
    'Drink a peanut butter banana oat shake between meals (~810 kcal, approx.). Liquids feel less filling than solid food.',
    'Add a spoon of peanut butter or olive oil to meals you already eat: +100–190 kcal each, no extra volume.',
    'Eat every 3–4 hours. 5–6 smaller meals or snacks are easier than 3 huge ones.',
    'Don\'t drink a big glass of water right before meals. It takes up stomach space. Drink through the day instead.',
    'Eat the calorie- and protein-rich part of the plate first, then the salad.',
    'Keep trail mix or nuts in your bag. A handful is ~175 kcal.',
    'Swap water for whole milk at one meal. That\'s +150 kcal and 8 g protein.',
    'Make oats with milk instead of water, then top with banana and peanut butter.',
    'Before bed: Greek yogurt + granola or cottage cheese for slow-digesting protein.',
    'Cook a big batch of rice and chicken on Sunday so a meal is always 2 minutes away.',
    'Use bigger plates and add one extra item to every meal (cheese, avocado, an egg).',
    'Not hungry? Light cardio or a walk before meals can help appetite. Don\'t skip breakfast.',
    'Weigh yourself first thing in the morning, after the bathroom. Watch the weekly average, not single days.',
  ];

  const PLANS = {
    beginner: {
      name: 'Beginner 3-day Full Body',
      desc: 'Train 3 non-consecutive days (e.g. Mon/Wed/Fri), alternating A and B workouts. Great for your first 6–12 months.',
      days: {
        'Day A': [
          ['Barbell Back Squat', 3, '6–8', '2–3 min', 'Add 10 lb when you hit 3×8.'],
          ['Barbell Bench Press', 3, '6–8', '2–3 min', 'Add 5 lb when you hit 3×8.'],
          ['Barbell Row', 3, '8–10', '90 s', 'Keep your back flat, pull to your lower chest.'],
          ['Dumbbell Shoulder Press', 2, '8–12', '90 s', ''],
          ['Plank', 3, '30–60 s', '60 s', 'Add 10 s per week.'],
        ],
        'Day B': [
          ['Romanian Deadlift', 3, '8–10', '2 min', 'Hinge at the hips, feel the hamstrings stretch.'],
          ['Overhead Press', 3, '6–8', '2 min', 'Add 5 lb when you hit 3×8.'],
          ['Lat Pulldown / Assisted Pull-up', 3, '8–12', '90 s', ''],
          ['Goblet Squat or Leg Press', 3, '10–12', '90 s', ''],
          ['Dumbbell Curl', 2, '10–12', '60 s', ''],
          ['Triceps Pushdown', 2, '10–12', '60 s', ''],
        ],
      },
    },
    intermediate: {
      name: 'Intermediate 4-day Upper/Lower',
      desc: 'Upper / Lower / rest / Upper / Lower / rest / rest. More volume for when beginner gains slow down.',
      days: {
        'Upper A': [
          ['Barbell Bench Press', 4, '5–8', '2–3 min', 'Heavy day. Add weight when you hit 4×8.'],
          ['Barbell Row', 4, '6–10', '2 min', ''],
          ['Incline Dumbbell Press', 3, '8–12', '90 s', ''],
          ['Lat Pulldown', 3, '8–12', '90 s', ''],
          ['Lateral Raise', 3, '12–15', '60 s', ''],
          ['EZ-Bar Curl', 3, '8–12', '60 s', ''],
        ],
        'Lower A': [
          ['Barbell Back Squat', 4, '5–8', '3 min', 'Heavy day. Add 5–10 lb when you hit 4×8.'],
          ['Romanian Deadlift', 3, '8–10', '2 min', ''],
          ['Walking Lunge', 3, '10/leg', '90 s', ''],
          ['Leg Curl', 3, '10–15', '60 s', ''],
          ['Standing Calf Raise', 4, '10–15', '60 s', ''],
        ],
        'Upper B': [
          ['Overhead Press', 4, '6–10', '2 min', ''],
          ['Weighted Pull-up / Pulldown', 4, '6–10', '2 min', ''],
          ['Dumbbell Bench Press', 3, '8–12', '90 s', ''],
          ['Seated Cable Row', 3, '10–12', '90 s', ''],
          ['Dips or Close-Grip Bench', 3, '8–12', '90 s', ''],
          ['Hammer Curl', 3, '10–12', '60 s', ''],
        ],
        'Lower B': [
          ['Deadlift', 3, '4–6', '3 min', 'Add 10 lb when you hit 3×6. Form first.'],
          ['Front Squat or Hack Squat', 3, '8–10', '2 min', ''],
          ['Leg Press', 3, '10–15', '90 s', ''],
          ['Hip Thrust', 3, '8–12', '90 s', ''],
          ['Hanging Leg Raise', 3, '10–15', '60 s', ''],
        ],
      },
    },
  };

  // Surplus 10–20% over TDEE; target gain 0.25–0.5% bodyweight/week (Iraki et al., 2019)
  const PACES = {
    lean: { pct: 0.10, gain: 0.0025, label: 'Lean bulk (+10% kcal, ~0.25% bodyweight/wk)' },
    steady: { pct: 0.15, gain: 0.00375, label: 'Steady (+15% kcal, ~0.375% bodyweight/wk)' },
    fast: { pct: 0.20, gain: 0.005, label: 'Faster (+20% kcal, ~0.5% bodyweight/wk)' },
  };
  const ACT = { 1.2: 'Sedentary', 1.375: 'Light', 1.55: 'Moderate', 1.725: 'Very active', 1.9: 'Extra active' };

  /* ---------------- State ---------------- */
  const blank = () => ({ profile: null, goals: null, meals: {}, workouts: [], weights: [], measurements: [], customFoods: [], favorites: [], ui: { plan: 'beginner', day: null, range: '30' } });
  let S;
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = blank(); }
  S.ui = Object.assign(blank().ui, S.ui || {});
  S.favorites = S.favorites || [];
  function migrate() {
    if (S.profile && S.profile.proteinPerKg == null) {
      S.profile.proteinPerKg = Math.min(2.2, Math.max(1.6, round((S.profile.proteinPerLb || 0.82) / LB, 1)));
      delete S.profile.proteinPerLb;
    }
    S.migrations = S.migrations || {};
    // QA pass 1 / PIL-01: when the weight unit was switched, the Train tab pre-filled the last value in the OLD unit
    // and saved it stamped with the NEW unit (e.g. 135 lb saved as "135 kg"). Fix only entries that exactly match
    // that signature: same number as the previous entry for that exercise, in the other unit (or a repeat of an
    // entry already fixed this way). Anything the user actually typed differently is left untouched.
    if (!S.migrations.pil01) {
      let fixed = 0; const prev = {};
      (S.workouts || []).forEach(w => (w.exercises || []).forEach(e => {
        if (!e || !e.weight || !e.unit) return;
        const pr = prev[e.name];
        if (pr && pr.unit !== e.unit && e.weight === pr.weight) {
          const bad = e.weight; e.weight = convW(bad, pr.unit, e.unit); e.fixedFrom = bad; fixed++;
        } else if (pr && pr.fixedFrom != null && pr.unit === e.unit && e.weight === pr.fixedFrom) {
          const bad = e.weight; e.weight = pr.weight; e.fixedFrom = bad; fixed++;
        }
        prev[e.name] = e;
      }));
      S.migrations.pil01 = { at: Date.now(), fixed };
    }
    // PIL-03: negative/zero servings could be logged (negative calories). Remove those entries.
    if (!S.migrations.pil03) {
      let removed = 0;
      Object.keys(S.meals || {}).forEach(d => {
        const before = S.meals[d].length;
        S.meals[d] = S.meals[d].filter(m => !(m && (!(m.servings > 0) || m.kcal < 0)));
        removed += before - S.meals[d].length;
        if (!S.meals[d].length) delete S.meals[d];
      });
      S.migrations.pil03 = { at: Date.now(), removed };
    }
    S.workouts.forEach(w => w.exercises.forEach(e => { if (e && e.fixedFrom != null && S.migrations.pil01) delete e.fixedFrom; }));
  }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save (storage full?)'); } };
  let viewDate = today();
  let lastToday = viewDate;
  // PIL-04: if the app stays open (or is resumed) past midnight, move "Today" to the new day.
  function syncToday() {
    const t = today(); if (t === lastToday) return false;
    const wasToday = viewDate === lastToday; lastToday = t;
    if (wasToday) viewDate = t;
    return true;
  }
  let foodCat = 'All';
  let showAllW = false;

  const wUnit = () => (S.profile && S.profile.weightUnit) || 'lb';
  const toDispW = kg => wUnit() === 'lb' ? kg / LB : kg;
  const fromDispW = v => wUnit() === 'lb' ? v * LB : v;
  const lenUnit = () => (S.profile && S.profile.heightUnit === 'cm') ? 'cm' : 'in';
  // Convert a lifting weight between units, rounded to the nearest 0.5 (plate-friendly).
  const convW = (v, from, to) => { if (!v || !from || from === to) return v; return Math.round((to === 'kg' ? v * LB : v / LB) * 2) / 2; };
  const W_MIN_KG = 30, W_MAX_KG = 300;
  const fmtGain = lbwk => wUnit() === 'kg' ? `${round(lbwk * LB, 2)} kg (${round(lbwk, 2)} lb)` : `${round(lbwk, 2)} lb (${round(lbwk * LB, 2)} kg)`;
  // Exercise tips are written in lb; show common kg plate jumps in kg mode.
  const unitTip = tip => wUnit() === 'kg' ? tip.replace(/(\d+)(?:–(\d+))? lb\b/g, (m, a, b) => { const k = x => ({ 5: '2.5', 10: '5' }[x] || String(round(x * LB, 1))); return (b ? k(a) + '–' + k(b) : k(a)) + ' kg'; }) : tip;

  /* ---------------- Calculator ---------------- */
  function calc(p) {
    const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
    const tdee = bmr * p.activity;
    const pace = PACES[p.pace] || PACES.lean;
    const surplus = Math.round(tdee * pace.pct);
    const adjust = p.kcalAdjust || 0;
    const kcal = Math.round((tdee + surplus + adjust) / 10) * 10;
    const protein = Math.round(p.weightKg * p.proteinPerKg);
    const fat = Math.round((kcal * 0.25) / 9);
    const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
    const lbwk = round(p.weightKg * pace.gain / LB, 2);
    return { bmr: Math.round(bmr), tdee: Math.round(tdee), surplus, pct: pace.pct, gain: pace.gain, adjust, lbwk, kcal, protein, fat, carbs };
  }

  /* ---------------- Onboarding ---------------- */
  const ob = { sex: 'male', hUnit: 'ftin', wUnit: 'lb', pace: 'lean' };
  function segBind(id, key, after) {
    $$('#' + id + ' button').forEach(b => b.addEventListener('click', () => {
      $$('#' + id + ' button').forEach(x => x.classList.toggle('active', x === b));
      ob[key] = b.dataset.v; after && after(); obPreview();
    }));
  }
  function setSeg(id, v) { $$('#' + id + ' button').forEach(x => x.classList.toggle('active', x.dataset.v === v)); }
  function obRead() {
    const age = +$('#obAge').value;
    let heightCm = ob.hUnit === 'cm' ? +$('#obCm').value : ((+$('#obFt').value) * 12 + (+$('#obIn').value || 0)) * IN;
    const wv = +$('#obWeight').value;
    const weightKg = (ob.lastW && ob.lastW.shown === $('#obWeight').value) ? ob.lastW.kg : (ob.wUnit === 'lb' ? wv * LB : wv);
    return { age, sex: ob.sex, heightCm, weightKg, activity: +$('#obActivity').value, pace: ob.pace, proteinPerKg: +$('#obProtein').value, weightUnit: ob.wUnit, heightUnit: ob.hUnit };
  }
  function obValid(p) { return p.age >= 14 && p.age <= 90 && p.heightCm >= 120 && p.heightCm <= 240 && p.weightKg >= 30 && p.weightKg <= 300; }
  function obPreview() {
    const p = obRead();
    $('#obProtLabel').textContent = p.proteinPerKg.toFixed(1);
    $('#obProtLb').textContent = `(≈${(p.proteinPerKg * LB).toFixed(2)} g/lb)`;
    if (!obValid(p)) { $('#obResult').innerHTML = '<span class="muted">Enter your details to see your daily targets.</span>'; return; }
    const g = calc(p);
    $('#obResult').innerHTML = `<div class="muted small">Your daily target</div><div class="big">${g.kcal.toLocaleString()} kcal</div>
      <div class="muted small">Maintenance ≈ ${g.tdee.toLocaleString()} kcal + ${g.surplus} kcal surplus (${Math.round(g.pct * 100)}%)</div>
      <div class="muted small">Target gain ≈ ${ob.wUnit === 'kg' ? `${round(g.lbwk * LB, 2)} kg (${g.lbwk} lb)` : `${g.lbwk} lb (${round(g.lbwk * LB, 2)} kg)`} per week</div>
      ${S.profile && S.profile.kcalAdjust ? `<div class="muted small adj-note">${adjKept(p) ? `Your +${S.profile.kcalAdjust} kcal adaptive adjustment is included and will be kept.` : `Saving these changes resets your +${S.profile.kcalAdjust} kcal adaptive adjustment (activity, pace, age, sex, height or a weight change over 2 kg).`}</div>` : ''}
      <div class="macro-grid"><div class="macro"><b>${g.protein} g</b><span>Protein</span></div><div class="macro"><b>${g.carbs} g</b><span>Carbs</span></div><div class="macro"><b>${g.fat} g</b><span>Fat</span></div></div>`;
  }
  // Adaptive kcal adjustment survives an "Edit goals" save unless calorie inputs changed (PIL-06).
  function adjKept(np) {
    const o = S.profile; if (!o || !o.kcalAdjust) return false;
    return o.age === np.age && o.sex === np.sex && Math.abs(o.heightCm - np.heightCm) < 0.5 && Math.abs(o.weightKg - np.weightKg) <= 2 && +o.activity === +np.activity && o.pace === np.pace;
  }
  function openOnboarding() {
    const p = S.profile;
    const edit = !!p;
    $('#obTitle').textContent = edit ? 'Edit your goals' : 'Welcome to Pillar';
    $('#obIntro').textContent = edit ? 'Update your details. Your logs and history are kept.' : 'Let\'s work out how much you need to eat to gain weight and build muscle.';
    $('#obSubmit').textContent = edit ? 'Save changes' : 'Save my plan →';
    $('#obClose').hidden = !edit; $('#obCancel').hidden = !edit;
    if (p) {
      $('#obAge').value = p.age; ob.sex = p.sex; ob.hUnit = p.heightUnit; ob.wUnit = p.weightUnit; ob.pace = p.pace;
      const totalIn = p.heightCm / IN; $('#obFt').value = Math.floor(totalIn / 12); $('#obIn').value = round(totalIn % 12, 1); $('#obCm').value = Math.round(p.heightCm);
      let latest = latestWeightKg() || p.weightKg;
      if (!(latest >= W_MIN_KG && latest <= W_MAX_KG)) latest = p.weightKg; // PIL-07: never pre-fill an out-of-range weigh-in
      const shown = String(round(p.weightUnit === 'lb' ? latest / LB : latest, 1));
      $('#obWeight').value = shown; ob.lastW = { kg: latest, shown }; ob.prefillKg = latest;
      $('#obActivity').value = String(p.activity); $('#obProtein').value = p.proteinPerKg;
      setSeg('obSex', ob.sex); setSeg('obHUnit', ob.hUnit); setSeg('obWUnit', ob.wUnit); setSeg('obPace', ob.pace);
    }
    syncObUnits(); obPreview();
    $('#onboarding').hidden = false;
  }
  function syncObUnits() {
    $('#hFtIn').hidden = ob.hUnit !== 'ftin'; $('#hCm').hidden = ob.hUnit !== 'cm';
    $('#obWLabel').textContent = ob.wUnit;
  }
  function initOnboarding() {
    segBind('obSex', 'sex');
    segBind('obHUnit', 'hUnit', () => {
      // convert current value
      if (ob.hUnit === 'cm') { $('#obCm').value = Math.round(((+$('#obFt').value) * 12 + (+$('#obIn').value || 0)) * IN); }
      else { const t = (+$('#obCm').value) / IN; $('#obFt').value = Math.floor(t / 12); $('#obIn').value = round(t % 12, 1); }
      syncObUnits();
    });
    segBind('obWUnit', 'wUnit', () => {
      const el = $('#obWeight'), v = +el.value;
      if (v) { const exact = (ob.lastW && ob.lastW.shown === el.value) ? ob.lastW.kg : (ob.wUnit === 'kg' ? v * LB : v); // kg before switch
        const shown = String(round(ob.wUnit === 'kg' ? exact : exact / LB, 1)); el.value = shown; ob.lastW = { kg: exact, shown }; }
      syncObUnits();
    });
    segBind('obPace', 'pace');
    const closeOb = () => { if (S.profile) $('#onboarding').hidden = true; };
    $('#obClose').addEventListener('click', closeOb);
    $('#obCancel').addEventListener('click', closeOb);
    $('#onboarding').addEventListener('click', e => { if (e.target.id === 'onboarding') closeOb(); });
    $$('#obForm input, #obForm select').forEach(el => el.addEventListener('input', obPreview));
    $('#obForm').addEventListener('submit', e => {
      e.preventDefault();
      const p = obRead();
      if (!obValid(p)) { toast('Please check age, height and weight'); return; }
      const first = !S.profile;
      p.startDate = (S.profile && S.profile.startDate) || today();
      p.startWeightKg = (S.profile && S.profile.startWeightKg) || p.weightKg;
      const oldAdj = S.profile ? (S.profile.kcalAdjust || 0) : 0;
      const keep = adjKept(p);
      p.kcalAdjust = keep ? oldAdj : 0; // PIL-06: only reset when calorie inputs changed
      S.profile = p; S.goals = calc(p);
      const t = today(), existing = S.weights.find(w => w.date === t);
      if (first) { if (!existing) S.weights.push({ date: t, kg: p.weightKg }); }
      else if (ob.prefillKg == null || Math.abs(p.weightKg - ob.prefillKg) >= 0.05) {
        // PIL-08: a changed weight in Edit goals becomes today's weigh-in (single source of truth)
        if (existing) existing.kg = p.weightKg; else S.weights.push({ date: t, kg: p.weightKg });
        if (p.startDate === t) p.startWeightKg = p.weightKg; // correcting the weight on day one also corrects the start
      }
      S.weights.sort((a, b) => a.date.localeCompare(b.date));
      save(); $('#onboarding').hidden = true; renderAll();
      toast(first ? 'Plan saved! Let\'s grow 💪' : (oldAdj && !keep ? `Goals updated · +${oldAdj} kcal adjustment reset` : 'Goals updated'));
    });
  }

  const emptyArt = (img, text) => `<li class="empty empty-art"><img src="assets/${img}.svg" alt="" width="150" height="112"><div>${esc(text)}</div></li>`;

  /* ---------------- Toast ---------------- */
  let tT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tT); tT = setTimeout(() => t.classList.remove('show'), 2200); }

  /* ---------------- Tabs ---------------- */
  function showTab(name) {
    $$('.tab').forEach(t => t.classList.toggle('active', t.id === 'tab-' + name));
    $$('#bottomNav button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    window.scrollTo(0, 0);
    if (name === 'progress') renderProgress();
  }

  /* ---------------- Meals ---------------- */
  const dayMeals = d => S.meals[d] || [];
  function totals(d) {
    return dayMeals(d).reduce((t, m) => { t.kcal += m.kcal; t.protein += m.protein; t.carbs += m.carbs || 0; t.fat += m.fat || 0; return t; }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  }
  function addMeal(f, servings) {
    if (servings === '' || servings == null) servings = 1;
    servings = parseFloat(servings);
    if (!(servings > 0)) { toast('Servings must be more than 0'); return false; }
    if (servings > 20) { toast('That\'s a lot! Max 20 servings at once'); return false; }
    if (syncToday()) renderAll();
    (S.meals[viewDate] = S.meals[viewDate] || []).push({
      id: uid(), fid: f.id, name: f.name, servings, kcal: round(f.kcal * servings), protein: round(f.protein * servings, 1),
      carbs: round((f.carbs || 0) * servings, 1), fat: round((f.fat || 0) * servings, 1), t: Date.now(),
    });
    save(); renderToday(); renderQuick(); toast(`+${round(f.kcal * servings)} kcal · ${f.name}`);
    return true;
  }
  function renderBars() {
    const g = S.goals; if (!g) return;
    const t = totals(viewDate);
    const rows = [['kcal', 'Calories', t.kcal, g.kcal, 'kcal'], ['protein', 'Protein', t.protein, g.protein, 'g'], ['carbs', 'Carbs', t.carbs, g.carbs, 'g'], ['fat', 'Fat', t.fat, g.fat, 'g']];
    $('#progressBars').innerHTML = rows.map(([k, label, v, goal, u]) => {
      const pct = Math.min(100, goal ? (v / goal) * 100 : 0);
      return `<div class="pbar"><div class="pbar-top"><span>${label}</span><span><b>${Math.round(v).toLocaleString()}</b> / ${goal.toLocaleString()} ${u} <span class="muted">(${Math.round(goal ? v / goal * 100 : 0)}%)</span></span></div>
        <div class="track"><div class="fill ${k}${pct >= 100 ? ' done' : ''}" style="width:${pct}%"></div></div></div>`;
    }).join('');
    const left = g.kcal - t.kcal;
    $('#kcalLeft').textContent = left > 0 ? `${Math.round(left).toLocaleString()} kcal to go` : '🎉 Calorie goal hit!';
  }
  function renderFoodCats() {
    const cats = ['All', '★ Favorites', 'Recipes', 'My foods', ...new Set(FOODS.map(f => f.cat).filter(c => c !== 'Recipes'))];
    $('#foodCats').innerHTML = cats.map(c => `<button class="chip${c === foodCat ? ' active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  }
  function renderFoods() {
    const q = $('#foodSearch').value.trim().toLowerCase();
    const custom = S.customFoods.map(f => Object.assign({ cat: 'My foods', emoji: '⭐', serving: '1 serving' }, f));
    let list = [...custom, ...FOODS];
    if (foodCat === '★ Favorites') list = list.filter(f => S.favorites.includes(f.id));
    else if (foodCat !== 'All') list = list.filter(f => f.cat === foodCat);
    if (q) list = list.filter(f => f.name.toLowerCase().includes(q) || f.cat.toLowerCase().includes(q));
    $('#foodList').innerHTML = list.length ? list.map(f => `<div class="food" data-id="${esc(f.id)}">
        <span class="emoji">${f.emoji}</span>
        <div class="info"><div class="name">${esc(f.name)}</div><div class="meta">${esc(f.serving)} · ~${f.kcal} kcal · ${f.protein} g protein</div></div>
        <button class="fav${S.favorites.includes(f.id) ? ' on' : ''}" data-fav="${esc(f.id)}" aria-label="Favorite" title="Favorite">${S.favorites.includes(f.id) ? '★' : '☆'}</button>
        <input class="input serv" type="number" min="0.25" step="0.25" value="1" aria-label="Servings">
        <button class="add-btn" aria-label="Add ${esc(f.name)}">+</button></div>`).join('')
      : foodCat === '★ Favorites' && !q ? '<div class="empty">Tap ☆ on any food to pin it here.</div>' : `<div class="empty">No match. <button class="btn ghost small-btn" id="emptyCustom">Add “${esc(q)}” as custom food</button></div>`;
    const ec = $('#emptyCustom'); if (ec) ec.addEventListener('click', () => openFoodModal(q));
  }
  function findFood(id) { return FOODS.find(f => f.id === id) || S.customFoods.find(f => f.id === id); }
  function renderMealLog() {
    const list = dayMeals(viewDate);
    $('#mealCount').textContent = list.length ? `${list.length} item${list.length > 1 ? 's' : ''}` : '';
    $('#mealLog').innerHTML = list.length ? list.slice().reverse().map(m => `<li><div class="l-main"><div>${esc(m.name)}${m.servings !== 1 ? ` <span class="muted">×${m.servings}</span>` : ''}</div>
      <div class="l-sub">${m.kcal} kcal · ${m.protein} g P${m.carbs ? ` · ${m.carbs} g C` : ''}${m.fat ? ` · ${m.fat} g F` : ''}</div></div>
      <button class="del" data-del-meal="${m.id}" aria-label="Remove">✕</button></li>`).join('')
      : emptyArt('empty-meals', 'No meals logged yet. Tap + on a food above to add it.');
  }
  function renderDate() {
    const t = today();
    $('#dateLabel').textContent = viewDate === t ? 'Today · ' + fmtDate(viewDate, { month: 'short', day: 'numeric' }) : viewDate === addDays(t, -1) ? 'Yesterday' : fmtDate(viewDate);
    $('#nextDay').disabled = viewDate >= t; $('#nextDay').style.opacity = viewDate >= t ? .35 : 1;
  }
  let tipI = Math.floor(Math.random() * TIPS.length);
  function renderTip() { $('#tipText').textContent = TIPS[tipI % TIPS.length]; }
  function renderToday() { renderDate(); renderBars(); renderMealLog(); renderSuggest(); renderAdapt(); }

  /* Recent & favorites strip */
  function recentFoods() {
    const seen = new Set(), out = [];
    Object.keys(S.meals).sort().reverse().some(d => { S.meals[d].slice().reverse().forEach(m => { if (m.fid && m.servings > 0 && !seen.has(m.fid) && findFood(m.fid)) { seen.add(m.fid); out.push({ f: findFood(m.fid), s: m.servings }); } }); return out.length >= 8; });
    return out.slice(0, 8);
  }
  function renderQuick() {
    const favs = S.favorites.map(findFood).filter(Boolean).map(f => ({ f, s: 1, fav: true }));
    const rec = recentFoods().filter(r => !S.favorites.includes(r.f.id));
    const items = [...favs, ...rec].slice(0, 12);
    $('#quickStrip').innerHTML = items.length ? `<div class="quick-strip"><span class="qs-label">One tap:</span>${items.map(x => `<button class="qbtn" data-q="${esc(x.f.id)}" data-s="${x.s}" title="${esc(x.f.name)}">${x.fav ? '★ ' : '↺ '}${esc(x.f.name.length > 22 ? x.f.name.slice(0, 21) + '…' : x.f.name)}${x.s !== 1 ? ' ×' + x.s : ''}<b>${Math.round(x.f.kcal * x.s)}</b></button>`).join('')}</div>` : '';
  }

  /* What should I eat? */
  let sugSeed = 0;
  function renderSuggest() {
    const g = S.goals; if (!g) { $('#suggestList').innerHTML = ''; return; }
    const t = totals(viewDate);
    const kLeft = Math.round(g.kcal - t.kcal), pLeft = Math.round(g.protein - t.protein);
    if (kLeft <= 50) { $('#suggestIntro').textContent = '🎉 You\'ve hit your calories for the day. Nice work!'; $('#suggestList').innerHTML = ''; return; }
    const proteinHeavy = pLeft > 0 && pLeft / Math.max(kLeft, 1) > 0.06; // needs >6 g protein per 100 kcal
    $('#suggestIntro').textContent = `${kLeft.toLocaleString()} kcal and ${Math.max(0, pLeft)} g protein left. ` + (proteinHeavy ? 'Prioritizing protein-rich options:' : 'Easy calorie-dense picks sized for what\'s left:');
    const target = Math.min(kLeft, kLeft > 1200 ? 700 : kLeft); // one snack/meal, not the whole day
    const pool = [...S.customFoods.map(f => Object.assign({ emoji: '⭐', cat: 'My foods' }, f)), ...FOODS].filter(f => f.kcal >= 60);
    const scored = pool.map(f => {
      const opts = [0.5, 1, 1.5, 2].filter(s => f.kcal * s <= target * 1.1 && (s <= 1 || f.cat !== 'Recipes'));
      if (!opts.length) return null;
      const s = opts.reduce((a, b) => Math.abs(f.kcal * b - target) < Math.abs(f.kcal * a - target) ? b : a);
      const kc = f.kcal * s, pr = f.protein * s;
      const fit = 1 - Math.abs(kc - target) / target;            // how well it fills the gap
      const dens = Math.min(1, f.kcal / 250);                      // calorie density per serving
      const prot = pLeft > 0 ? Math.min(1, pr / Math.min(pLeft, 40)) : 0;
      const score = fit * 1.2 + dens * 0.5 + prot * (proteinHeavy ? 1.6 : 0.6) + (f.cat === 'Recipes' ? 0.25 : 0) + (S.favorites.includes(f.id) ? 0.3 : 0)
        + (((f.id.charCodeAt(f.id.length - 1) * 7 + sugSeed * 13) % 10) / 40); // gentle shuffle
      return { f, s, kc, pr, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score);
    const picks = []; const cats = {};
    for (const x of scored) { if ((cats[x.f.cat] || 0) >= 2) continue; cats[x.f.cat] = (cats[x.f.cat] || 0) + 1; picks.push(x); if (picks.length >= 4) break; }
    $('#suggestList').innerHTML = picks.map(x => `<div class="sug"><span class="emoji">${x.f.emoji || '🍽️'}</span><div class="info"><div class="name">${esc(x.f.name)}${x.s !== 1 ? ` <span class="muted">×${x.s}</span>` : ''}</div>
      <div class="meta">~${Math.round(x.kc)} kcal · ${round(x.pr, 1)} g protein${x.f.cat === 'Recipes' ? ' · recipe in Learn' : ''}</div></div>
      <button class="add-btn" data-sug="${esc(x.f.id)}" data-s="${x.s}" aria-label="Add ${esc(x.f.name)}">+</button></div>`).join('') || '<div class="empty">Try a custom food.</div>';
  }

  /* Adaptive calorie target */
  function weeklyAvgs() {
    const groups = {};
    sortedWeights().forEach(w => { const k = weekStart(w.date); (groups[k] = groups[k] || []).push(w.kg); });
    return Object.keys(groups).sort().filter(k => groups[k].length >= 2).map(k => ({ week: k, kg: groups[k].reduce((a, b) => a + b, 0) / groups[k].length }));
  }
  function adaptiveCheck() {
    if (!S.goals || !S.profile) return null;
    const cw = weekStart(today());
    if (S.ui.adaptSnooze && S.ui.adaptSnooze >= cw) return null;
    const wk = weeklyAvgs(); if (wk.length < 3) return null;
    const last = wk.slice(-3);
    // need consecutive weeks
    if (daysBetween(last[0].week, last[2].week) !== 14) return null;
    const tgtKg = S.goals.lbwk * LB;
    const c1 = last[1].kg - last[0].kg, c2 = last[2].kg - last[1].kg;
    if (c1 < tgtKg * 0.75 && c2 < tgtKg * 0.75) return { c1, c2, tgtKg, add: 125 };
    return null;
  }
  function renderAdapt() {
    const a = adaptiveCheck();
    const html = a ? `<div class="card adapt"><h2>📉 Gaining slower than planned</h2>
      <p>Your weekly average changed by ${fmtChange(a.c1)} and ${fmtChange(a.c2)} over the last 2 weeks, below your target of ~${fmtChange(a.tgtKg)}/week. Raising your daily target by about <strong>+${a.add} kcal</strong> (a glass of milk or a spoon of peanut butter) should get you back on pace.</p>
      <div class="row"><button class="btn primary" data-adapt="accept">Raise to ${calc(Object.assign({}, S.profile, { kcalAdjust: (S.profile.kcalAdjust || 0) + a.add })).kcal.toLocaleString()} kcal</button><button class="btn ghost" data-adapt="snooze">Not now</button></div></div>` : '';
    $('#adaptBanner').innerHTML = html; $('#adaptBanner2').innerHTML = html;
  }
  function fmtChange(kg) { const v = toDispW(kg); return (v >= 0 ? '+' : '') + round(v, 2) + ' ' + wUnit(); }
  function onAdapt(e) {
    const b = e.target.closest('[data-adapt]'); if (!b) return;
    const a = adaptiveCheck();
    if (b.dataset.adapt === 'accept' && a) {
      S.profile.kcalAdjust = (S.profile.kcalAdjust || 0) + a.add;
      S.goals = calc(Object.assign({}, S.profile, { weightKg: S.profile.weightKg }));
      toast(`Daily target raised to ${S.goals.kcal.toLocaleString()} kcal`);
    }
    S.ui.adaptSnooze = weekStart(today()); save(); renderAll();
  }

  function openFoodModal(name = '') {
    $('#fmForm').reset(); $('#fmName').value = name; $('#fmServ').value = 1; $('#fmSave').checked = true;
    $('#foodModal').hidden = false; setTimeout(() => $(name ? '#fmKcal' : '#fmName').focus(), 50);
  }
  function initMeals() {
    $('#prevDay').addEventListener('click', () => { viewDate = addDays(viewDate, -1); renderToday(); });
    $('#nextDay').addEventListener('click', () => { if (viewDate < today()) { viewDate = addDays(viewDate, 1); renderToday(); } });
    $('#foodSearch').addEventListener('input', renderFoods);
    $('#foodCats').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (!b) return; foodCat = b.dataset.cat; renderFoodCats(); renderFoods(); });
    $('#foodList').addEventListener('click', e => {
      const fv = e.target.closest('[data-fav]');
      if (fv) { const id = fv.dataset.fav; S.favorites = S.favorites.includes(id) ? S.favorites.filter(x => x !== id) : [id, ...S.favorites]; save(); renderFoods(); renderQuick(); return; }
      const b = e.target.closest('.add-btn'); if (!b) return;
      const row = b.closest('.food'); const f = findFood(row.dataset.id); if (f) addMeal(f, $('.serv', row).value);
    });
    $('#mealLog').addEventListener('click', e => {
      const b = e.target.closest('[data-del-meal]'); if (!b) return;
      S.meals[viewDate] = dayMeals(viewDate).filter(m => m.id !== b.dataset.delMeal); save(); renderToday();
    });
    $('#customFoodBtn').addEventListener('click', () => openFoodModal());
    $('#fmCancel').addEventListener('click', () => { $('#foodModal').hidden = true; });
    $('#foodModal').addEventListener('click', e => { if (e.target.id === 'foodModal') $('#foodModal').hidden = true; });
    $('#fmForm').addEventListener('submit', e => {
      e.preventDefault();
      const f = { id: 'c' + uid(), name: $('#fmName').value.trim(), kcal: +$('#fmKcal').value || 0, protein: +$('#fmProt').value || 0, carbs: +$('#fmCarb').value || 0, fat: +$('#fmFat').value || 0 };
      if (!f.name) return;
      const sv = parseFloat($('#fmServ').value);
      if (!(sv > 0) || sv > 20) { toast('Servings must be between 0.25 and 20'); return; }
      if ($('#fmSave').checked) { S.customFoods.unshift(f); renderFoods(); }
      addMeal(f, sv); $('#foodModal').hidden = true;
    });
    $('#nextTip').addEventListener('click', () => { tipI++; renderTip(); });
    $('#quickStrip').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (!b) return; const f = findFood(b.dataset.q); if (f) addMeal(f, +b.dataset.s || 1); });
    $('#suggestList').addEventListener('click', e => { const b = e.target.closest('[data-sug]'); if (!b) return; const f = findFood(b.dataset.sug); if (f) addMeal(f, +b.dataset.s || 1); });
    $('#shuffleSuggest').addEventListener('click', () => { sugSeed++; renderSuggest(); });
    $('#adaptBanner').addEventListener('click', onAdapt); $('#adaptBanner2').addEventListener('click', onAdapt);
  }

  /* ---------------- Workouts ---------------- */
  function lastFor(exName) {
    for (let i = S.workouts.length - 1; i >= 0; i--) {
      const e = S.workouts[i].exercises.find(x => x.name === exName && x.weight);
      if (e) return e;
    }
    return null;
  }
  function renderTrain() {
    const plan = PLANS[S.ui.plan]; const days = Object.keys(plan.days);
    if (!S.ui.day || !plan.days[S.ui.day]) S.ui.day = suggestDay(S.ui.plan);
    $$('#planSeg button').forEach(b => b.classList.toggle('active', b.dataset.plan === S.ui.plan));
    $('#planDesc').textContent = plan.desc;
    $('#daySeg').innerHTML = days.map(d => `<button class="chip${d === S.ui.day ? ' active' : ''}" data-day="${esc(d)}">${esc(d)}</button>`).join('');
    $('#workoutTitle').textContent = S.ui.day;
    $('#workoutDate').textContent = fmtDate(today());
    const wu = wUnit();
    $('#exerciseList').innerHTML = plan.days[S.ui.day].map(([name, sets, reps, rest, tip], i) => {
      const last = lastFor(name);
      const lastW = last ? convW(last.weight, last.unit || wu, wu) : '';
      const lastTxt = last ? `Last: ${lastW} ${wu} × ${last.reps || '?'}` : 'First time';
      return `<div class="ex" data-ex="${i}"><div class="ex-top"><div><div class="ex-name">${esc(name)}</div>
        <div class="ex-rx">${sets} sets × ${esc(reps)} reps · rest ${esc(rest)}</div></div><div class="ex-last">${esc(lastTxt)}</div></div>
        ${tip ? `<div class="ex-tip">↗ ${esc(unitTip(tip))}</div>` : ''}
        <div class="ex-inputs">
          <label>Weight (${wu})<input class="input" type="number" step="0.5" min="0" data-f="weight" value="${last ? lastW : ''}" placeholder="0 = BW"></label>
          <label>Reps (best set)<input class="input" type="text" inputmode="numeric" data-f="reps" placeholder="${esc(reps.split('–').pop())}"></label>
          <label>Sets done<input class="input" type="number" min="0" max="10" data-f="sets" value="${sets}"></label>
        </div></div>`;
    }).join('');
    renderWorkoutHistory();
    save();
  }
  function suggestDay(planKey) {
    const days = Object.keys(PLANS[planKey].days);
    const last = S.workouts.slice().reverse().find(w => w.plan === planKey);
    if (!last) return days[0];
    return days[(days.indexOf(last.day) + 1) % days.length];
  }
  function weekStart(s) { const d = parseYmd(s); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return ymd(d); }
  function renderWorkoutHistory() {
    const ws = weekStart(today());
    const thisWeek = S.workouts.filter(w => w.date >= ws).length;
    const target = S.ui.plan === 'beginner' ? 3 : 4;
    $('#workoutWeek').textContent = `${thisWeek}/${target} this week`;
    const list = S.workouts.slice().reverse().slice(0, 30);
    $('#workoutHistory').innerHTML = list.length ? list.map(w => `<li><div class="l-main"><div><strong>${esc(w.day)}</strong> <span class="muted small">· ${fmtDate(w.date)}</span></div>
      <div class="l-sub">${w.exercises.filter(e => e.weight || e.reps).map(e => `${esc(e.name)} ${e.weight ? convW(e.weight, e.unit || wUnit(), wUnit()) + ' ' + wUnit() : 'BW'}${e.reps ? '×' + esc(e.reps) : ''}`).join(' · ') || 'Completed'}${w.notes ? ' · “' + esc(w.notes) + '”' : ''}</div></div>
      <button class="del" data-del-w="${w.id}" aria-label="Remove">✕</button></li>`).join('')
      : emptyArt('empty-workouts', 'No workouts logged yet. Log your first one above!');
  }
  function initTrain() {
    $('#planSeg').addEventListener('click', e => { const b = e.target.closest('[data-plan]'); if (!b) return; S.ui.plan = b.dataset.plan; S.ui.day = null; renderTrain(); });
    $('#daySeg').addEventListener('click', e => { const b = e.target.closest('[data-day]'); if (!b) return; S.ui.day = b.dataset.day; renderTrain(); });
    $('#saveWorkout').addEventListener('click', () => {
      const plan = PLANS[S.ui.plan];
      const exercises = plan.days[S.ui.day].map(([name], i) => {
        const box = $(`.ex[data-ex="${i}"]`);
        return { name, weight: +$('[data-f=weight]', box).value || 0, reps: $('[data-f=reps]', box).value.trim(), sets: +$('[data-f=sets]', box).value || 0, unit: wUnit() };
      });
      S.workouts.push({ id: uid(), date: today(), plan: S.ui.plan, day: S.ui.day, exercises, notes: $('#workoutNotes').value.trim() });
      $('#workoutNotes').value = '';
      S.ui.day = suggestDay(S.ui.plan); save(); renderTrain(); toast('Workout logged! Next up: ' + S.ui.day);
    });
    $('#workoutHistory').addEventListener('click', e => {
      const b = e.target.closest('[data-del-w]'); if (!b) return;
      if (!confirm('Delete this workout?')) return;
      S.workouts = S.workouts.filter(w => w.id !== b.dataset.delW); save(); renderTrain();
    });
  }

  /* ---------------- Progress ---------------- */
  const sortedWeights = () => S.weights.slice().sort((a, b) => a.date.localeCompare(b.date));
  const latestWeightKg = () => { const w = sortedWeights(); return w.length ? w[w.length - 1].kg : null; };
  function avgBetween(ws, from, to) { const xs = ws.filter(w => w.date >= from && w.date <= to); return xs.length ? xs.reduce((s, w) => s + w.kg, 0) / xs.length : null; }
  function streak(hasDay) {
    let d = today(); if (!hasDay(d)) d = addDays(d, -1);
    let n = 0; while (hasDay(d) && n < 3650) { n++; d = addDays(d, -1); }
    return n;
  }
  function slopeKgPerWeek(ws) {
    if (ws.length < 2) return null;
    const x0 = ws[0].date; const xs = ws.map(w => daysBetween(x0, w.date)); const ys = ws.map(w => w.kg);
    const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
    let num = 0, den = 0; for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
    return den ? (num / den) * 7 : null;
  }
  function renderProgress() {
    const u = wUnit(); $('#weightUnitLabel').textContent = u; $('#measUnit').textContent = lenUnit();
    if (!$('#weightDate').value) $('#weightDate').value = today();
    $('#weightDate').max = today();
    const ws = sortedWeights(); const t = today();
    const cur = ws.length ? ws[ws.length - 1].kg : null;
    const sp = startPoint(ws); const start = sp ? sp.kg : null;
    const a7 = avgBetween(ws, addDays(t, -6), t), p7 = avgBetween(ws, addDays(t, -13), addDays(t, -7));
    const recent = ws.filter(w => w.date >= addDays(t, -27));
    const slope = slopeKgPerWeek(recent.length >= 2 ? recent : ws);
    const targetLb = S.goals ? S.goals.lbwk : 0.375;
    const foodStreak = streak(d => dayMeals(d).length > 0);
    const wStreak = streak(d => ws.some(w => w.date === d));
    const wkWorkouts = S.workouts.filter(w => w.date >= weekStart(t)).length;
    const fmt = kg => kg == null ? '—' : round(toDispW(kg), 1) + ' ' + u;
    const delta = cur != null && start != null ? toDispW(cur) - toDispW(start) : null;
    const slopeDisp = slope == null ? null : (u === 'lb' ? slope / LB : slope);
    const targetDisp = u === 'lb' ? targetLb : targetLb * LB;
    const card = (k, v, s, cls = '') => `<div class="stat"><div class="k">${k}</div><div class="v ${cls}">${v}</div><div class="s">${s}</div></div>`;
    $('#statCards').innerHTML =
      card('Current', fmt(cur), start != null ? `Started at ${fmt(start)}` : '') +
      card('Total change', delta == null ? '—' : (delta >= 0 ? '+' : '') + round(delta, 1) + ' ' + u, sp ? 'since ' + fmtDate(sp.date, { month: 'short', day: 'numeric' }) : '', delta > 0 ? 'up' : delta < 0 ? 'down' : '') +
      card('7-day average', fmt(a7), p7 != null && a7 != null ? `${toDispW(a7) - toDispW(p7) >= 0 ? '+' : ''}${round(toDispW(a7) - toDispW(p7), 1)} ${u} vs prior week` : 'Log a few days to compare') +
      card('Trend', slopeDisp == null ? '—' : (slopeDisp >= 0 ? '+' : '') + round(slopeDisp, 2) + ` ${u}/wk`, `Target +${round(targetDisp, 2)} ${u}/wk`, slopeDisp == null ? '' : slopeDisp > 0 ? 'up' : 'down') +
      card('🔥 Food log streak', foodStreak + (foodStreak === 1 ? ' day' : ' days'), `Weigh-in streak: ${wStreak} day${wStreak === 1 ? '' : 's'}`) +
      card('🏋️ This week', wkWorkouts + ' workout' + (wkWorkouts === 1 ? '' : 's'), `Goal: ${S.ui.plan === 'beginner' ? 3 : 4} per week`);

    // pace message
    let msg = '';
    if (slope == null || ws.length < 4 || daysBetween(ws[0].date, ws[ws.length - 1].date) < 7) msg = '📅 Weigh in most mornings for at least a week to see your trend vs. target pace.';
    else {
      const s = slopeDisp, tgt = round(targetDisp, 2);
      if (s < tgt * 0.5) msg = `🐢 You're gaining slower than your target (${round(s, 2)} vs ${tgt} ${u}/wk). Try adding ~150–250 kcal/day, like a glass of whole milk and a spoon of peanut butter.`;
      else if (s > tgt * 1.6) msg = `🚀 You're gaining faster than planned (${round(s, 2)} vs ${tgt} ${u}/wk). Consider trimming ~100–200 kcal/day to keep the gain mostly muscle.`;
      else msg = `✅ On track! You're gaining ~${round(s, 2)} ${u}/wk vs a target of ${tgt} ${u}/wk. Keep it up.`;
    }
    $('#paceMsg').textContent = msg;

    renderAdapt();
    renderChart(ws, targetLb);
    renderWeekly(ws);
    renderMeasurements();
    $('#weightHistory').innerHTML = ws.length ? ws.slice().reverse().slice(0, showAllW ? 400 : 10).map(w => `<li><div class="l-main">${fmt(w.kg)}<div class="l-sub">${fmtDate(w.date)}</div></div><button class="del" data-del-wt="${w.date}" aria-label="Remove">✕</button></li>`).join('') + (ws.length > 10 ? `<li class="empty"><button class="btn ghost small-btn" id="toggleW">${showAllW ? 'Show less' : 'Show all ' + ws.length + ' weigh-ins'}</button></li>` : '') : emptyArt('empty-weighins', 'No weigh-ins yet. Add your weight above to start your chart.');
    $$('#rangeSeg button').forEach(b => b.classList.toggle('active', b.dataset.range === S.ui.range));
  }
  // Start of the journey: profile start, or an earlier backdated weigh-in if there is one (PIL-14).
  function startPoint(ws) {
    const p = S.profile;
    if (p && p.startDate && p.startWeightKg != null && (!ws.length || ws[0].date >= p.startDate)) return { date: p.startDate, kg: p.startWeightKg };
    return ws.length ? { date: ws[0].date, kg: ws[0].kg } : (p && p.startWeightKg != null ? { date: p.startDate, kg: p.startWeightKg } : null);
  }
  function renderChart(ws, targetLb) {
    const el = $('#chart');
    const t = today();
    const from = S.ui.range === 'all' ? (ws[0] ? ws[0].date : t) : addDays(t, -(+S.ui.range - 1));
    const pts = ws.filter(w => w.date >= from);
    if (pts.length < 1) { el.innerHTML = '<div class="empty">Log your weight to see your chart.</div>'; return; }
    const W = 600, H = 260, P = { l: 44, r: 12, t: 14, b: 28 };
    const x0 = from < pts[0].date && S.ui.range !== 'all' ? from : pts[0].date;
    const span = Math.max(6, daysBetween(x0, t));
    // moving avg (7-day trailing over entries)
    const avg = pts.map(p => { const xs = ws.filter(w => w.date <= p.date && w.date >= addDays(p.date, -6)); return { date: p.date, kg: xs.reduce((s, w) => s + w.kg, 0) / xs.length }; });
    // target line from start weight & date
    const sp = startPoint(ws); const sDate = sp.date, sKg = sp.kg;
    const tgtAt = d => sKg + (daysBetween(sDate, d) / 7) * targetLb * LB;
    const tStart = sDate > x0 ? sDate : x0;
    const target = [{ date: tStart, kg: tgtAt(tStart) }, { date: t, kg: tgtAt(t) }];
    const vals = [...pts.map(p => p.kg), ...target.map(p => p.kg)].map(toDispW);
    let mn = Math.min(...vals), mx = Math.max(...vals); const padv = Math.max(1, (mx - mn) * 0.15); mn -= padv; mx += padv;
    const X = d => P.l + (daysBetween(x0, d) / span) * (W - P.l - P.r);
    const Y = kg => P.t + (1 - (toDispW(kg) - mn) / (mx - mn)) * (H - P.t - P.b);
    const ticks = 4; let grid = '';
    for (let i = 0; i <= ticks; i++) { const v = mn + (mx - mn) * i / ticks; const y = P.t + (1 - i / ticks) * (H - P.t - P.b); grid += `<line x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}" stroke="#26334f" stroke-width="1"/><text x="${P.l - 6}" y="${y + 4}" fill="#93a1bf" font-size="11" text-anchor="end">${round(v, 1)}</text>`; }
    const xl = [x0, addDays(x0, Math.round(span / 2)), t].map((d, i) => `<text x="${X(d)}" y="${H - 8}" fill="#93a1bf" font-size="11" text-anchor="${['start', 'middle', 'end'][i]}">${fmtDate(d, { month: 'short', day: 'numeric' })}</text>`).join('');
    const path = arr => arr.map((p, i) => (i ? 'L' : 'M') + X(p.date).toFixed(1) + ' ' + Y(p.kg).toFixed(1)).join(' ');
    const area = pts.length > 1 ? `<path d="${path(avg)} L${X(avg[avg.length - 1].date)} ${H - P.b} L${X(avg[0].date)} ${H - P.b} Z" fill="url(#g)" opacity=".35"/>` : '';
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight chart">
      <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#22c55e"/><stop offset="1" stop-color="#22c55e" stop-opacity="0"/></linearGradient></defs>
      ${grid}${xl}
      <path d="${path(target)}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6 5" fill="none"/>
      ${area}
      ${pts.length > 1 ? `<path d="${path(avg)}" stroke="#22c55e" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
      ${pts.map(p => `<circle cx="${X(p.date).toFixed(1)}" cy="${Y(p.kg).toFixed(1)}" r="3.5" fill="#60a5fa"><title>${fmtDate(p.date)}: ${round(toDispW(p.kg), 1)} ${wUnit()}</title></circle>`).join('')}
    </svg>`;
  }
  function renderWeekly(ws) {
    const u = wUnit(); const groups = {};
    ws.forEach(w => { const k = weekStart(w.date); (groups[k] = groups[k] || []).push(w.kg); });
    const keys = Object.keys(groups).sort().slice(-8);
    if (!keys.length) { $('#weeklyTable').innerHTML = '<tr><td class="empty">No data yet.</td></tr>'; return; }
    const tgt = (S.goals ? S.goals.lbwk : 0.375) * (u === 'lb' ? 1 : LB);
    let prev = null; const rows = keys.map(k => {
      const a = toDispW(groups[k].reduce((s, x) => s + x, 0) / groups[k].length);
      const ch = prev == null ? null : a - prev; prev = a;
      const status = ch == null ? '—' : ch < tgt * 0.5 ? '🐢 slow' : ch > tgt * 1.6 ? '🚀 fast' : '✅ on pace';
      return `<tr><td>${fmtDate(k, { month: 'short', day: 'numeric' })}</td><td>${round(a, 1)} ${u}</td><td class="${ch > 0 ? 'up' : ch < 0 ? 'down' : ''}">${ch == null ? '—' : (ch >= 0 ? '+' : '') + round(ch, 2)}</td><td>${groups[k].length}</td><td>${status}</td></tr>`;
    }).reverse();
    $('#weeklyTable').innerHTML = `<tr><th>Week of</th><th>Avg</th><th>Change</th><th>Days</th><th>vs target</th></tr>` + rows.join('');
  }
  function renderMeasurements() {
    const lu = lenUnit(); const conv = cm => lu === 'cm' ? round(cm, 1) : round(cm / IN, 1);
    const list = S.measurements.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
    $('#measureTable').innerHTML = list.length ? `<tr><th>Date</th><th>Chest</th><th>Arms</th><th>Waist</th><th>Thighs</th><th></th></tr>` +
      list.map(m => `<tr><td>${fmtDate(m.date, { month: 'short', day: 'numeric' })}</td>${['chest', 'arms', 'waist', 'thighs'].map(k => `<td>${m[k] ? conv(m[k]) : '—'}</td>`).join('')}<td><button class="del" data-del-m="${m.id}" aria-label="Remove">✕</button></td></tr>`).join('') : '';
  }
  function initProgress() {
    $('#addWeight').addEventListener('click', () => {
      const v = parseFloat($('#weightInput').value); const d = $('#weightDate').value || today();
      const u = wUnit(), lo = u === 'lb' ? Math.round(W_MIN_KG / LB) : W_MIN_KG, hi = u === 'lb' ? Math.round(W_MAX_KG / LB) : W_MAX_KG;
      if (!v || v < lo || v > hi) { toast(`Enter a weight between ${lo} and ${hi} ${u}`); return; }
      if (d > today()) { toast('Date can\'t be in the future'); return; }
      const sw = sortedWeights(); const ref = sw.filter(w => w.date < d).pop() || sw.find(w => w.date === d) || sw[0];
      if (ref && Math.abs(fromDispW(v) - ref.kg) / ref.kg > 0.1 && !confirm(`${v} ${u} is more than 10% different from your last weigh-in (${round(toDispW(ref.kg), 1)} ${u}). Save it anyway?`)) return;
      S.weights = S.weights.filter(w => w.date !== d); S.weights.push({ date: d, kg: fromDispW(v) });
      S.weights.sort((a, b) => a.date.localeCompare(b.date));
      $('#weightInput').value = ''; save(); renderProgress(); toast('Weight logged');
      if (S.weights.length >= 2) $('#sharePrompt').hidden = false;
    });
    $('#weightInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('#addWeight').click(); });
    $('#weightHistory').addEventListener('click', e => { if (e.target.id === 'toggleW') { showAllW = !showAllW; renderProgress(); return; } const b = e.target.closest('[data-del-wt]'); if (!b) return; S.weights = S.weights.filter(w => w.date !== b.dataset.delWt); save(); renderProgress(); });
    $('#rangeSeg').addEventListener('click', e => { const b = e.target.closest('[data-range]'); if (!b) return; S.ui.range = b.dataset.range; save(); renderProgress(); });
    $('#addMeasure').addEventListener('click', () => {
      const f = id => { const v = parseFloat($(id).value); return v ? (lenUnit() === 'cm' ? v : v * IN) : null; };
      const m = { id: uid(), date: today(), chest: f('#mChest'), arms: f('#mArms'), waist: f('#mWaist'), thighs: f('#mThighs') };
      if (!m.chest && !m.arms && !m.waist && !m.thighs) { toast('Enter at least one measurement'); return; }
      S.measurements.push(m); ['#mChest', '#mArms', '#mWaist', '#mThighs'].forEach(i => $(i).value = ''); save(); renderMeasurements(); toast('Measurements saved');
    });
    $('#measureTable').addEventListener('click', e => { const b = e.target.closest('[data-del-m]'); if (!b) return; S.measurements = S.measurements.filter(m => m.id !== b.dataset.delM); save(); renderMeasurements(); });
  }

  /* ---------------- Share progress card (canvas, fully offline) ---------------- */
  const SITE_URL = 'https://avrgnewb1.github.io/pillar/';
  const LOGO_SVG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256"><path fill="#4ade80" d="M12 19Q12 17 13.95 16.56L50.05 8.44Q52 8 52 10L52 13Q52 15 50.05 15.44L13.95 23.56Q12 24 12 22Z"/><path fill="#22c55e" d="M16 28.3Q16 27.1 17.17 26.84L22.83 25.56Q24 25.3 24 26.5L24 44.3Q24 45.5 22.8 45.5L17.2 45.5Q16 45.5 16 44.3ZM28 25.6Q28 24.4 29.17 24.14L34.83 22.86Q36 22.6 36 23.8L36 44.3Q36 45.5 34.8 45.5L29.2 45.5Q28 45.5 28 44.3ZM40 22.9Q40 21.7 41.17 21.44L46.83 20.16Q48 19.9 48 21.1L48 44.3Q48 45.5 46.8 45.5L41.2 45.5Q40 45.5 40 44.3Z"/><path fill="#16a34a" d="M12 51Q12 49 14 49L50 49Q52 49 52 51L52 54Q52 56 50 56L14 56Q12 56 12 54Z"/></svg>');
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  const share = { format: 'story', hide: true, blob: null, logo: null };
  function loadLogo() {
    if (share.logo) return Promise.resolve(share.logo);
    return new Promise(res => { const i = new Image(); i.onload = () => { share.logo = i; res(i); }; i.onerror = () => res(null); i.src = LOGO_SVG; });
  }
  function shareData() {
    const ws = sortedWeights(); const t = today(); const u = wUnit();
    if (ws.length < 2) return { ok: false, count: ws.length };
    const sp = startPoint(ws); const start = sp.kg; const startDate = sp.date;
    const last = ws[ws.length - 1];
    const recent = ws.filter(w => w.date >= addDays(t, -27));
    const slope = slopeKgPerWeek(recent.length >= 2 ? recent : ws);
    const days = daysBetween(ws[0].date, last.date);
    const from = S.ui.range === 'all' ? ws[0].date : addDays(t, -(+S.ui.range - 1));
    const pts = ws.filter(w => w.date >= from);
    return {
      ok: true, u, ws, pts, from: pts.length >= 2 ? pts[0].date : ws[ws.length - 2].date, to: t,
      start, startDate, cur: last.kg, delta: toDispW(last.kg) - toDispW(start),
      slope: slope == null ? null : toDispW(slope), target: S.goals ? (u === 'lb' ? S.goals.lbwk : S.goals.lbwk * LB) : null,
      weeks: Math.max(1, Math.round(days / 7)), days,
      foodStreak: streak(d => dayMeals(d).length > 0), wStreak: streak(d => ws.some(w => w.date === d)),
      workouts: S.workouts.filter(w => w.date >= weekStart(t)).length, workoutGoal: S.ui.plan === 'beginner' ? 3 : 4,
    };
  }
  const signed = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(round(v, d));
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawCard(canvas, D, opts) {
    const story = opts.format === 'story';
    const W = 1080, H = story ? 1920 : 1080; canvas.width = W; canvas.height = H;
    const c = canvas.getContext('2d'); const u = D.u; const P = 72, cw = W - P * 2;
    const L = story
      ? { hy: 96, ls: 104, brand: 68, tag: 30, label: 36, labelY: 330, big: 190, bigGap: 170, sub: 38, subGap: 66, exactGap: 56, chartGap: 56, footH: 150, gridRows: 3, cols: 2, bh: 170, gap: 24, sLab: 28, sVal: 56, sPad: 30 }
      : { hy: 56, ls: 80, brand: 54, tag: 25, label: 28, labelY: 200, big: 124, bigGap: 112, sub: 30, subGap: 48, exactGap: 42, chartGap: 32, footH: 92, gridRows: 2, cols: 3, bh: 112, gap: 16, sLab: 21, sVal: 40, sPad: 22 };
    // background
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1120'); g.addColorStop(1, '#111a2e'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const rg = c.createRadialGradient(W * 0.85, H * 0.06, 10, W * 0.85, H * 0.06, W * 0.75); rg.addColorStop(0, 'rgba(34,197,94,.22)'); rg.addColorStop(1, 'rgba(34,197,94,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
    c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    // header: logo + wordmark text
    if (opts.logo) c.drawImage(opts.logo, P - 8, L.hy, L.ls, L.ls);
    c.fillStyle = '#e8eefc'; c.font = `800 ${L.brand}px ${FONT}`; c.fillText('Pillar', P + L.ls + 10, L.hy + L.ls * 0.56);
    c.fillStyle = '#93a1bf'; c.font = `500 ${L.tag}px ${FONT}`; c.fillText('Eat more. Lift smart. Grow.', P + L.ls + 12, L.hy + L.ls * 0.56 + L.tag * 1.45);
    // hero
    let y = L.labelY;
    c.fillStyle = '#93a1bf'; c.font = `600 ${L.label}px ${FONT}`; c.fillText('MY PROGRESS', P, y);
    y += L.bigGap;
    c.fillStyle = D.delta >= 0 ? '#4ade80' : '#f87171'; c.font = `800 ${L.big}px ${FONT}`; c.fillText(signed(D.delta) + ' ' + u, P - 6, y);
    y += L.subGap;
    c.fillStyle = '#cbd5e1'; c.font = `500 ${L.sub}px ${FONT}`;
    c.fillText(`since ${fmtDate(D.startDate, { month: 'short', day: 'numeric', year: 'numeric' })} · ${D.weeks} week${D.weeks === 1 ? '' : 's'} tracked`, P, y);
    if (!opts.hide) { y += L.exactGap; c.fillStyle = '#93a1bf'; c.fillText(`${round(toDispW(D.start), 1)} → ${round(toDispW(D.cur), 1)} ${u}`, P, y); }
    // vertical budget: footer and stats grid anchored to bottom, chart fills the rest
    const footTop = H - L.footH;
    const gridH = L.gridRows * L.bh + (L.gridRows - 1) * L.gap;
    const gridTop = footTop - (story ? 48 : 28) - gridH;
    const cy = y + L.chartGap, ch = gridTop - (story ? 40 : 26) - cy;
    // chart card
    c.fillStyle = 'rgba(21,31,54,.92)'; rr(c, P, cy, cw, ch, story ? 32 : 26); c.fill(); c.strokeStyle = '#26334f'; c.lineWidth = 2; c.stroke();
    const th = story ? 62 : 46;
    c.fillStyle = '#e8eefc'; c.font = `700 ${story ? 34 : 26}px ${FONT}`; c.fillText('Weight trend', P + 32, cy + th);
    c.fillStyle = '#93a1bf'; c.font = `500 ${story ? 28 : 22}px ${FONT}`; c.textAlign = 'right';
    c.fillText(`${fmtDate(D.from, { month: 'short', day: 'numeric' })} – ${fmtDate(D.to, { month: 'short', day: 'numeric', year: 'numeric' })}`, P + cw - 32, cy + th); c.textAlign = 'left';
    const legH = story ? 54 : 40;
    drawTrend(c, D, opts, { x: P + 32, y: cy + th + (story ? 34 : 24), w: cw - 64, h: ch - th - (story ? 34 : 24) - legH, story });
    const ly = cy + ch - (story ? 24 : 16); c.font = `500 ${story ? 24 : 19}px ${FONT}`; let lx = P + 32;
    const leg = (color, label, dash) => { c.strokeStyle = color; c.lineWidth = 5; c.setLineDash(dash || []); c.beginPath(); c.moveTo(lx, ly - 7); c.lineTo(lx + 32, ly - 7); c.stroke(); c.setLineDash([]); c.fillStyle = '#93a1bf'; c.fillText(label, lx + 42, ly); lx += 42 + c.measureText(label).width + 34; };
    c.fillStyle = '#60a5fa'; c.beginPath(); c.arc(lx + 8, ly - 7, story ? 7 : 6, 0, Math.PI * 2); c.fill(); c.fillStyle = '#93a1bf'; c.fillText('Weigh-ins', lx + 24, ly); lx += 24 + c.measureText('Weigh-ins').width + 34;
    leg('#22c55e', '7-day avg'); leg('#f59e0b', 'Target pace', [12, 9]);
    // stats grid
    const stats = [
      ['Weekly trend', D.slope == null ? '—' : `${signed(D.slope, 2)} ${u}/wk`],
      ['Target pace', D.target == null ? '—' : `+${round(D.target, 2)} ${u}/wk`],
      ['Weeks tracked', String(D.weeks)],
      ['Food-log streak', `${D.foodStreak} day${D.foodStreak === 1 ? '' : 's'}`],
      ['Weigh-in streak', `${D.wStreak} day${D.wStreak === 1 ? '' : 's'}`],
      ['Workouts this week', `${D.workouts} / ${D.workoutGoal}`],
    ];
    const bw = (cw - L.gap * (L.cols - 1)) / L.cols;
    stats.forEach((st, i) => {
      const bx = P + (i % L.cols) * (bw + L.gap), by = gridTop + Math.floor(i / L.cols) * (L.bh + L.gap);
      c.fillStyle = 'rgba(21,31,54,.92)'; rr(c, bx, by, bw, L.bh, story ? 26 : 20); c.fill(); c.strokeStyle = '#26334f'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#93a1bf'; c.font = `600 ${L.sLab}px ${FONT}`; c.fillText(st[0].toUpperCase(), bx + L.sPad, by + L.bh * 0.36);
      c.fillStyle = '#e8eefc'; c.font = `800 ${L.sVal}px ${FONT}`; c.fillText(st[1], bx + L.sPad, by + L.bh * 0.78);
    });
    // footer
    c.fillStyle = '#26334f'; c.fillRect(P, footTop, cw, 2);
    const fy = footTop + (story ? 84 : 56);
    c.fillStyle = '#4ade80'; c.font = `700 ${story ? 36 : 28}px ${FONT}`; c.fillText('avrgnewb1.github.io/pillar', P, fy);
    c.fillStyle = '#93a1bf'; c.font = `500 ${story ? 28 : 22}px ${FONT}`; c.textAlign = 'right'; c.fillText('Tracked with Pillar', W - P, fy); c.textAlign = 'left';
  }
  function drawTrend(c, D, opts, box) {
    const pts = D.pts.length >= 2 ? D.pts : D.ws.slice(-2);
    const ws = D.ws; const base = toDispW(pts[0].kg);
    const val = kg => opts.hide ? toDispW(kg) - base : toDispW(kg);
    const x0 = pts[0].date, x1 = D.to; const span = Math.max(6, daysBetween(x0, x1));
    const avg = pts.map(p => { const xs = ws.filter(w => w.date <= p.date && w.date >= addDays(p.date, -6)); return { date: p.date, kg: xs.reduce((s, w) => s + w.kg, 0) / xs.length }; });
    const sKg = D.start, sDate = D.startDate, tLb = S.goals ? S.goals.lbwk : 0.375;
    const tgtAt = d => sKg + (daysBetween(sDate, d) / 7) * tLb * LB;
    const tStart = sDate > x0 ? sDate : x0; const target = [{ date: tStart, kg: tgtAt(tStart) }, { date: x1, kg: tgtAt(x1) }];
    const vals = [...pts, ...target].map(p => val(p.kg));
    let mn = Math.min(...vals), mx = Math.max(...vals); const pad = Math.max(0.4, (mx - mn) * 0.08); mn -= pad; mx += pad;
    const raw = (mx - mn) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))), step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(v => v >= raw) || 10 * mag;
    mn = Math.floor(mn / step) * step; mx = Math.ceil(mx / step) * step;
    const L = box.x + (box.story ? 92 : 76), R = box.x + box.w, T = box.y, B = box.y + box.h - (box.story ? 40 : 30);
    const X = d => L + (daysBetween(x0, d) / span) * (R - L);
    const Y = kg => T + (1 - (val(kg) - mn) / (mx - mn)) * (B - T);
    c.font = `500 ${box.story ? 24 : 19}px ${FONT}`; c.textAlign = 'right';
    const dec = step < 1 ? (step < 0.5 ? 2 : 1) : 0;
    for (let v = mn; v <= mx + step / 2; v += step) {
      const yy = T + (1 - (v - mn) / (mx - mn)) * (B - T); const vv = Math.abs(v) < step / 1000 ? 0 : v;
      c.strokeStyle = '#223050'; c.lineWidth = 2; c.beginPath(); c.moveTo(L, yy); c.lineTo(R, yy); c.stroke();
      c.fillStyle = '#7f8db0'; c.fillText(opts.hide ? (vv === 0 ? '0' : signed(vv, dec)) : vv.toFixed(dec), L - 14, yy + 8);
    }
    c.textAlign = 'center';
    [x0, x1].forEach((d, i) => { c.textAlign = i ? 'right' : 'left'; c.fillText(fmtDate(d, { month: 'short', day: 'numeric' }), i ? R : L, B + (box.story ? 38 : 28)); });
    c.textAlign = 'left';
    // target
    c.strokeStyle = '#f59e0b'; c.lineWidth = 4; c.setLineDash([12, 9]); c.beginPath(); c.moveTo(X(target[0].date), Y(target[0].kg)); c.lineTo(X(target[1].date), Y(target[1].kg)); c.stroke(); c.setLineDash([]);
    // area + avg line
    const grd = c.createLinearGradient(0, T, 0, B); grd.addColorStop(0, 'rgba(34,197,94,.35)'); grd.addColorStop(1, 'rgba(34,197,94,0)');
    c.beginPath(); avg.forEach((p, i) => i ? c.lineTo(X(p.date), Y(p.kg)) : c.moveTo(X(p.date), Y(p.kg))); c.lineTo(X(avg[avg.length - 1].date), B); c.lineTo(X(avg[0].date), B); c.closePath(); c.fillStyle = grd; c.fill();
    c.beginPath(); avg.forEach((p, i) => i ? c.lineTo(X(p.date), Y(p.kg)) : c.moveTo(X(p.date), Y(p.kg))); c.strokeStyle = '#22c55e'; c.lineWidth = box.story ? 7 : 6; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
    c.fillStyle = '#60a5fa'; pts.forEach(p => { c.beginPath(); c.arc(X(p.date), Y(p.kg), box.story ? 7 : 6, 0, Math.PI * 2); c.fill(); });
  }
  async function renderShare() {
    const D = shareData();
    $('#shareEmpty').hidden = D.ok; $('#shareBody').hidden = !D.ok;
    if (!D.ok) { $('#shareEmptyCount').textContent = `You have ${D.count} so far.`; return; }
    $('#shareUnit').textContent = wUnit();
    $$('#shareFormat button').forEach(b => b.classList.toggle('active', b.dataset.f === share.format));
    $$('#shareRange button').forEach(b => b.classList.toggle('active', b.dataset.range === S.ui.range));
    $('#shareHideWeight').checked = share.hide;
    const logo = await loadLogo();
    const cv = $('#shareCanvas'); drawCard(cv, D, { format: share.format, hide: share.hide, logo });
    share.blob = null;
    share.blob = await new Promise(res => cv.toBlob(b => res(b), 'image/png'));
    const file = share.blob && new File([share.blob], shareFileName(), { type: 'image/png' });
    $('#shareNative').hidden = !(file && navigator.canShare && navigator.canShare({ files: [file] }));
  }
  const shareFileName = () => `pillar-progress-${share.format}-${today()}.png`;
  function openShare() { share.hide = true; // PIL-17: privacy-safe default every time
    $('#shareSheet').hidden = false; $('#sharePrompt').hidden = true; renderShare(); }
  function closeShare() { $('#shareSheet').hidden = true; }
  async function copyLink() {
    try { await navigator.clipboard.writeText(SITE_URL); toast('Link copied'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = SITE_URL; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } ta.remove();
      toast(ok ? 'Link copied' : 'Copy this link: ' + SITE_URL);
    }
  }
  function initShare() {
    document.addEventListener('click', e => { if (e.target.closest('[data-open-share]')) openShare(); });
    $('#shareClose').addEventListener('click', closeShare);
    $('#shareSheet').addEventListener('click', e => { if (e.target.id === 'shareSheet') closeShare(); });
    $('#sharePromptClose').addEventListener('click', () => { $('#sharePrompt').hidden = true; });
    $('#shareFormat').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; share.format = b.dataset.f; renderShare(); });
    $('#shareRange').addEventListener('click', e => { const b = e.target.closest('[data-range]'); if (!b) return; S.ui.range = b.dataset.range; save(); renderProgress(); renderShare(); });
    $('#shareHideWeight').addEventListener('change', e => { share.hide = e.target.checked; renderShare(); });
    $('#shareGoLog').addEventListener('click', () => { closeShare(); showTab('progress'); setTimeout(() => $('#weightInput').focus(), 50); });
    $('#shareDownload').addEventListener('click', () => {
      if (!share.blob) return;
      const a = document.createElement('a'); a.href = URL.createObjectURL(share.blob); a.download = shareFileName(); document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500); toast('Image saved');
    });
    $('#shareNative').addEventListener('click', async () => {
      if (!share.blob) return;
      const file = new File([share.blob], shareFileName(), { type: 'image/png' });
      try { await navigator.share({ files: [file], title: 'My Pillar progress', text: 'Tracking my gains with Pillar: ' + SITE_URL }); }
      catch (err) { if (err && err.name !== 'AbortError') toast('Sharing failed. Try Download PNG.'); }
    });
    $('#shareCopyLink').addEventListener('click', copyLink);
  }

  /* ---------------- Plan ---------------- */
  function renderPlan() {
    const p = S.profile, g = S.goals; if (!p || !g) return;
    const u = wUnit();
    const h = p.heightUnit === 'cm' ? Math.round(p.heightCm) + ' cm' : (ti => `${Math.floor(ti / 12)}′${ti % 12}″`)(Math.round(p.heightCm / IN));
    $('#planSummary').innerHTML = `<div class="muted small" style="color:#cfe">Your daily target</div><div class="big">${g.kcal.toLocaleString()} kcal</div>
      <div class="small" style="opacity:.85">${esc(PACES[p.pace].label)} · ${ACT[p.activity] || ''} activity</div>
      <div class="macro-grid"><div class="macro"><b>${g.protein} g</b><span>Protein</span></div><div class="macro"><b>${g.carbs} g</b><span>Carbs</span></div><div class="macro"><b>${g.fat} g</b><span>Fat</span></div></div>`;
    const row = (k, v) => `<div class="mrow"><span>${k}</span><b>${v}</b></div>`;
    $('#planMath').innerHTML =
      row('Profile', `${p.age} y · ${p.sex} · ${h} · ${round(toDispW(p.weightKg), 1)} ${u}`) +
      row('BMR (Mifflin-St Jeor)', g.bmr.toLocaleString() + ' kcal') +
      row(`× Activity (${p.activity})`, '= ' + g.tdee.toLocaleString() + ' kcal maintenance') +
      row(`+ Surplus (${Math.round(g.pct * 100)}% of maintenance)`, '+' + g.surplus + ' kcal') +
      (g.adjust ? row('+ Adaptive adjustment', '+' + g.adjust + ' kcal') : '') +
      row('Protein', `${p.proteinPerKg} g/kg × ${round(p.weightKg, 1)} kg = ${g.protein} g (≈${round(p.proteinPerKg * LB, 2)} g/lb)`) +
      row('Fat', `25% of calories = ${g.fat} g`) +
      row('Carbs', `the rest = ${g.carbs} g`) +
      row('Target gain', `${+(g.gain * 100).toFixed(3)}% bodyweight ≈ ${fmtGain(g.lbwk)}/week`) +
      `<p class="tiny">Based on a 10–20% surplus over maintenance and 0.25–0.5% bodyweight gain per week (Iraki et al., 2019), with protein at 1.6–2.2 g/kg/day (Morton et al., 2018). The NHS suggests roughly 300–500 extra kcal/day. Treat these as starting estimates: if your weekly average stalls for 2+ weeks, Pillar will suggest +100–150 kcal. Recalculate every ~${u === 'kg' ? '5 kg' : '10 lb'} gained.</p>`;
  }
  function initPlan() {
    $('#redoOnboarding').addEventListener('click', openOnboarding);
    $('#editProfileBtn').addEventListener('click', openOnboarding);
    $('#exportData').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pillar-backup-${today()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000); toast('Backup downloaded');
    });
    $('#importData').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader(); r.onload = () => {
        try { const d = JSON.parse(r.result); if (!d || typeof d !== 'object' || !('meals' in d)) throw 0; S = Object.assign(blank(), d); S.ui = Object.assign(blank().ui, S.ui || {}); save(); renderAll(); toast('Backup restored'); }
        catch (err) { toast('That file isn\'t a Pillar backup'); }
      }; r.readAsText(f); e.target.value = '';
    });
    $('#resetData').addEventListener('click', () => {
      if (!confirm('Delete ALL Pillar data on this device? This cannot be undone.')) return;
      localStorage.removeItem(KEY); S = blank(); renderAll(); openOnboarding();
    });
  }

  /* Learn */
  function cite(keys) { return keys.map(k => C.sources[k] ? `<a class="cite" href="${C.sources[k][1]}" target="_blank" rel="noopener" title="${esc(C.sources[k][0])}">${esc(k === 'nhs' ? 'NHS' : k === 'mayo' ? 'Mayo Clinic' : k === 'usda' ? 'USDA' : k === 'sleep' ? 'AASM/SRS' : k[0].toUpperCase() + k.slice(1))}</a>` : '').join(''); }
  function renderLearn() {
    $('#recipeList').innerHTML = C.recipes.map(r => `<div class="card recipe"><div class="card-head" style="margin-bottom:4px"><h3>${r.icon ? `<img class="r-icon" src="${r.icon}" alt="" width="40" height="40">` : r.emoji} ${esc(r.name)}</h3><button class="btn primary small-btn" data-log-recipe="${r.id}">+ Log</button></div>
      <div class="rk">~${r.kcal} kcal · ~${r.protein} g protein <span class="muted" style="font-weight:400">(approx.)</span></div>
      <table class="table"><tr><th>Ingredient</th><th>Amount</th><th>kcal</th><th>Protein</th></tr>${r.ing.map(i => `<tr><td>${esc(i[0])}</td><td>${esc(i[1])}</td><td>~${i[2]}</td><td>~${i[3]} g</td></tr>`).join('')}</table>
      ${r.note ? `<div class="note">${esc(r.note)}</div>` : ''}<p><strong>Steps:</strong> ${esc(r.steps)}</p></div>`).join('');
    $('#tipsList').innerHTML = C.tips.map(t => `<li><strong>${esc(t[0])}</strong> ${esc(t[1])}${cite(t[2])}</li>`).join('');
    $('#faqList').innerHTML = C.faqs.map((f, i) => `<details class="faq"${i === 0 ? ' open' : ''}><summary><span class="fq">${f[1] ? `<img class="f-icon" src="${f[1]}" alt="" width="32" height="32">` : ''}${esc(f[0])}</span></summary><div class="ans">${f[2].replace(/\{(\w+)\}/g, (m, k) => cite([k]))}</div></details>`).join('');
    $('#sourceList').innerHTML = Object.values(C.sources).map(s => `<li>${esc(s[0])}<br><a href="${s[1]}" target="_blank" rel="noopener">${esc(s[1])}</a></li>`).join('');
  }
  function initLearn() {
    $('#learnSeg').addEventListener('click', e => { const b = e.target.closest('[data-l]'); if (!b) return; $$('#learnSeg button').forEach(x => x.classList.toggle('active', x === b)); $$('.lpane').forEach(p => p.hidden = p.id !== 'learn-' + b.dataset.l); });
    $('#recipeList').addEventListener('click', e => { const b = e.target.closest('[data-log-recipe]'); if (!b) return; const f = findFood(b.dataset.logRecipe); viewDate = today(); if (f) addMeal(f, 1); });
  }

  function renderAll() { renderToday(); renderFoodCats(); renderFoods(); renderQuick(); renderTip(); renderTrain(); renderProgress(); renderPlan(); }

  /* ---------------- Boot ---------------- */
  $('#bottomNav').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('#foodModal').hidden = true; $('#shareSheet').hidden = true; if (S.profile) $('#onboarding').hidden = true; } });
  migrate();
  if (S.profile) S.goals = calc(S.profile);
  initOnboarding(); initMeals(); initTrain(); initProgress(); initPlan(); initLearn(); renderLearn(); initShare();
  if (!S.profile) { S.goals = calc(Object.assign({ age: 22, sex: 'male', heightCm: 178, weightKg: 63.5, activity: 1.55, pace: 'lean', proteinPerKg: 1.8 })); renderAll(); S.goals = null; openOnboarding(); }
  else renderAll();

  // PIL-04: roll "Today" over when the app is resumed or left open past midnight
  const onWake = () => { if (syncToday()) renderAll(); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) onWake(); });
  window.addEventListener('focus', onWake);
  setInterval(onWake, 60000);
  // PIL-19: keep the sticky Learn bar just under the real top bar height
  const setTopH = () => { const tb = document.querySelector('.topbar'); if (tb) document.documentElement.style.setProperty('--topbar-h', Math.ceil(tb.getBoundingClientRect().height) + 'px'); };
  setTopH(); window.addEventListener('resize', setTopH);

  /* PWA: register the service worker (http/https only; skipped when opened from file://) */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(err => console.info('Service worker not registered:', err && err.message)); });
  }
})();
