/* ════════════════════════════════════════════
   DATA
════════════════════════════════════════════ */
const VALUES = [
    "Acceptance","Achievement","Action","Adaptability","Adventure","Authority","Autonomy",
    "Beauty","Belonging","Caring","Certainty","Challenge","Collaboration","Comfort",
    "Commitment","Community","Compassion","Control","Courage","Courtesy","Creativity",
    "Curiosity","Decisiveness","Dependability","Dignity","Diversity","Duty",
    "Efficiency","Equality","Equity","Excellence","Excitement",
    "Faith","Fame","Family","Forgiveness","Freedom","Friendship","Fulfillment","Fun",
    "Generosity","Genuineness","Gratitude","Happiness","Health","Honesty","Humility",
    "Identity","Independence","Innovation","Integrity","Interconnectedness","Intimacy",
    "Justice","Knowledge","Life","Love","Loyalty","Merit","Moderation",
    "Order","Passion","Patience","Patriotism","Pleasure","Popularity","Power",
    "Practicality","Prosperity","Rationality","Recognition","Respect",
    "Security","Service","Solitude","Spirituality","Stability","Success",
    "Sustainability","Tolerance","Tradition","Trust","Wealth","Wisdom"
];

const CUSTOM_IDS   = ['__c0','__c1','__c2','__c3','__c4'];
const customLabels = new Map();

function isCustom(v)  { return v.startsWith('__c'); }
function label(v)     { return isCustom(v) ? (customLabels.get(v) || '') : v; }
function allValues()  {
    const labeled = CUSTOM_IDS.filter(id => customLabels.has(id));
    return [...VALUES, ...labeled].sort((a, b) => label(a).localeCompare(label(b)));
}

/* ════════════════════════════════════════════
   STATE
════════════════════════════════════════════ */
let step        = 1;
let selected    = new Set();
let kept        = new Set();
let discarded   = new Set();
let pool        = [];
let finalists   = new Set();
let pairA       = null, pairB = null;
let s3phase     = 'tournament';
let revLeft     = null, revRight = null;
let placed      = new Map();
let pendingCard = null;
let dragSrc     = null;
let pairHistory = [];   // [{winner, loser}] — every Step 3 comparison

/* ════════════════════════════════════════════
   DOM REFS
════════════════════════════════════════════ */
const intro        = document.getElementById('intro');
const app          = document.getElementById('app');
const content      = document.getElementById('content');
const progressFill = document.getElementById('progressFill');
const countNum     = document.getElementById('countNum');
const countDenom   = document.getElementById('countDenom');
const footerMsg    = document.getElementById('footerMsg');
const nextBtn      = document.getElementById('nextBtn');
const limitMsg     = document.getElementById('limitMsg');
const hint         = document.getElementById('hint');
const backBtn      = document.getElementById('backBtn');
const dots         = document.querySelectorAll('.dot');
const bannerLabel  = document.getElementById('bannerLabel');
const bannerText   = document.getElementById('bannerText');

let limitTimer = null;
const MAX = 24, TARGET = 12;

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
function setBanner(lbl, html) {
    bannerLabel.textContent = lbl;
    bannerText.innerHTML    = html;
}

function setBack(show) {
    backBtn.classList.toggle('hidden', !show);
}

function setFooter({ n, denom, msg = '', btnText, btnDisabled, hintText }) {
    countNum.textContent = n;
    countNum.classList.toggle('complete', btnDisabled === false);
    countDenom.textContent = denom;
    footerMsg.textContent  = msg;
    nextBtn.textContent    = btnText;
    nextBtn.disabled       = btnDisabled;
    hint.textContent       = hintText;
    limitMsg.textContent   = '';
}

function showLimit() {
    limitMsg.textContent = 'Maximum 24 reached — remove one first.';
    clearTimeout(limitTimer);
    limitTimer = setTimeout(() => { limitMsg.textContent = ''; }, 2500);
}

function promptCustom(id) {
    const val = window.prompt('Name for this card:', customLabels.get(id) || '');
    if (val === null) return;
    const t = val.trim();
    if (t) { customLabels.set(id, t); }
    else   { customLabels.delete(id); selected.delete(id); }
    if (step === 1) renderStep1();
}

/* ════════════════════════════════════════════
   START
════════════════════════════════════════════ */
document.getElementById('startBtn').addEventListener('click', () => {
    intro.classList.add('hidden');
    app.classList.remove('hidden');
    renderStep1();
});

/* ════════════════════════════════════════════
   STEP 1 — Pick 24
════════════════════════════════════════════ */
function renderStep1() {
    setBanner('Step 1 of 4', 'Select <strong>24 values</strong> that feel most true to who you are and how you want to show up.');
    setBack(false);
    const n = selected.size;
    progressFill.style.width = `${(n / MAX) * 100}%`;
    setFooter({
        n, denom: '/ 24',
        msg: n === 0 ? '' : n < MAX ? `— ${MAX - n} more to go` : '— ready!',
        btnText: 'Continue to Step 2 →',
        btnDisabled: n !== MAX,
        hintText: n === MAX ? 'Tap any selected value to swap it out' : 'Tap a value to select it'
    });

    const grid = document.createElement('div');
    grid.className = 'chips-grid';

    // All labeled values (standard + custom) sorted alphabetically
    allValues().forEach(v => {
        const c = document.createElement('div');
        c.className = 'chip chip-anim' + (selected.has(v) ? ' selected' : '');
        c.textContent = label(v);
        if (isCustom(v)) {
            // Custom labeled chip: add edit button
            const btn = document.createElement('button');
            btn.className = 'chip-edit';
            btn.textContent = '✏';
            btn.addEventListener('click', e => { e.stopPropagation(); promptCustom(v); });
            c.appendChild(btn);
            c.addEventListener('click', e => {
                if (e.target === btn) return;
                if (selected.has(v)) { selected.delete(v); }
                else {
                    if (selected.size >= MAX) { showLimit(); return; }
                    selected.add(v);
                }
                renderStep1();
            });
        } else {
            c.addEventListener('click', () => {
                if (selected.has(v)) { selected.delete(v); }
                else {
                    if (selected.size >= MAX) { showLimit(); return; }
                    selected.add(v);
                }
                limitMsg.textContent = '';
                renderStep1();
            });
        }
        grid.appendChild(c);
    });

    // Unlabeled blank slots always at the end
    CUSTOM_IDS.forEach(id => {
        if (customLabels.has(id)) return; // already rendered above in sorted position
        const c = document.createElement('div');
        c.className = 'chip chip-anim add-custom';
        c.innerHTML = '✏ Add';
        c.addEventListener('click', () => promptCustom(id));
        grid.appendChild(c);
    });

    content.innerHTML = '';
    content.appendChild(grid);
}

/* ════════════════════════════════════════════
   STEP 2 — Keep 12
════════════════════════════════════════════ */
function goToStep2() {
    step = 2;
    kept      = new Set([...selected]);
    discarded = new Set();
    dots[1].classList.add('active');
    renderStep2();
}

function renderStep2() {
    const n        = kept.size;
    const toRemove = n - TARGET;
    setBanner('Step 2 of 4', 'Discard <strong>12 values</strong> you\'re willing to give up to keep the other 12.');
    setBack(true);
    progressFill.style.width = `${(discarded.size / TARGET) * 100}%`;
    countNum.textContent = n;
    countNum.classList.toggle('complete', n === TARGET);
    countDenom.textContent = '/ 12';
    nextBtn.textContent    = 'Continue to Step 3 →';
    nextBtn.disabled       = n !== TARGET;
    limitMsg.textContent   = '';
    footerMsg.textContent  = toRemove > 0 ? `— remove ${toRemove} more` : n === TARGET ? '— ready!' : `— restore ${TARGET - n}`;
    hint.textContent       = n === TARGET ? 'Tap any to swap kept ↔ discarded' : 'Tap a value to discard it';

    const grid = document.createElement('div');
    grid.className = 'chips-grid';

    allValues().forEach(v => {
        const isKept = kept.has(v);
        const isDisc = discarded.has(v);
        if (!isKept && !isDisc) return;
        const c = document.createElement('div');
        c.className = 'chip chip-anim' + (isKept ? ' selected' : ' discarded');
        c.textContent = label(v);
        c.addEventListener('click', () => {
            if (isKept) { kept.delete(v); discarded.add(v); }
            else        { discarded.delete(v); kept.add(v); }
            renderStep2();
        });
        grid.appendChild(c);
    });

    content.innerHTML = '';
    content.appendChild(grid);
}

/* ════════════════════════════════════════════
   STEP 3 — Tournament to 6
════════════════════════════════════════════ */
function goToStep3() {
    step     = 3;
    pool     = allValues().filter(v => kept.has(v));
    finalists = new Set();
    pairHistory = [];
    s3phase  = 'tournament';
    pairA    = pool.shift();
    pairB    = pool.shift();
    revLeft  = revRight = null;
    dots[2].classList.add('active');
    countDenom.textContent = '/ 6';
    nextBtn.textContent    = 'Continue to Step 4 →';
    nextBtn.disabled       = true;
    renderStep3();
}

function renderStep3() {
    const n = finalists.size;
    countNum.textContent = n;
    countNum.classList.toggle('complete', n === 6);
    progressFill.style.width = `${(n / 6) * 100}%`;
    limitMsg.textContent = '';
    s3phase === 'tournament' ? drawTournament() : drawReview();
}

function makeCmpCard(v) {
    const el = document.createElement('div');
    el.className = 'cmp-card';
    el.innerHTML = `
        <div class="cmp-inner"></div>
        <span class="cmp-corner tl">◆</span>
        <span class="cmp-name">${label(v)}</span>
        <span class="cmp-corner br">◆</span>
    `;
    return el;
}

function drawTournament() {
    setBanner('Step 3 of 4', 'Which value is <strong>more important</strong> to you? Tap your choice.');
    setBack(true);
    nextBtn.disabled      = true;
    footerMsg.textContent = `— ${6 - finalists.size} more to find`;
    hint.textContent      = 'Tap the value that matters more to you';

    const wrap = document.createElement('div');
    wrap.className = 'compare-screen';

    // VS pair
    const pair = document.createElement('div');
    pair.className = 'compare-pair';
    const cA = makeCmpCard(pairA);
    const vs = document.createElement('div');
    vs.className = 'cmp-vs';
    vs.textContent = 'vs';
    const cB = makeCmpCard(pairB);
    cA.addEventListener('click', () => pickWinner(pairA, pairB));
    cB.addEventListener('click', () => pickWinner(pairB, pairA));
    pair.append(cA, vs, cB);
    wrap.appendChild(pair);

    // Waiting pool
    const waiting = allValues().filter(v => pool.includes(v));
    if (waiting.length > 0) {
        const lbl = document.createElement('div');
        lbl.className = 'section-label';
        lbl.style.cssText = 'width:100%;max-width:380px;';
        lbl.textContent = `Waiting (${waiting.length})`;
        const pills = document.createElement('div');
        pills.className = 'pill-group';
        waiting.forEach(v => {
            const p = document.createElement('div');
            p.className = 'pill';
            p.textContent = label(v);
            pills.appendChild(p);
        });
        wrap.append(lbl, pills);
    }

    // Finalists so far
    if (finalists.size > 0) {
        const lbl2 = document.createElement('div');
        lbl2.className = 'section-label';
        lbl2.style.cssText = 'width:100%;max-width:380px;margin-top:16px;';
        lbl2.textContent = `Your ${finalists.size} so far`;
        const fins = document.createElement('div');
        fins.className = 'pill-group';
        allValues().forEach(v => {
            if (!finalists.has(v)) return;
            const p = document.createElement('div');
            p.className = 'pill finalist';
            p.textContent = label(v);
            fins.appendChild(p);
        });
        wrap.append(lbl2, fins);
    }

    content.innerHTML = '';
    content.appendChild(wrap);
}

function pickWinner(winner, loser) {
    pairHistory.push({ winner: label(winner), loser: label(loser) });
    finalists.add(winner);
    pool.push(loser);
    if (finalists.size === 6) {
        s3phase  = 'review';
        pairA    = pairB = null;
        revLeft  = revRight = null;
    } else {
        pairA = pool.shift();
        pairB = pool.shift();
    }
    renderStep3();
}

function drawReview() {
    setBack(true);

    if (revLeft !== null && revRight !== null) {
        // Active swap comparison
        setBanner('Step 3 of 4', 'Which value matters <strong>more</strong>? The winner stays in your 6.');
        nextBtn.disabled      = true;
        footerMsg.textContent = '';
        hint.textContent      = 'Winner stays; loser returns to the pool';

        const wrap = document.createElement('div');
        wrap.className = 'compare-screen';
        const pair = document.createElement('div');
        pair.className = 'compare-pair';
        const cL = makeCmpCard(revLeft);
        const vs = document.createElement('div');
        vs.className = 'cmp-vs';
        vs.textContent = 'vs';
        const cR = makeCmpCard(revRight);
        cL.addEventListener('click', () => {
            pool = pool.filter(v => v !== revLeft);
            finalists.delete(revRight);
            finalists.add(revLeft);
            pool.push(revRight);
            revLeft = revRight = null;
            renderStep3();
        });
        cR.addEventListener('click', () => { revLeft = revRight = null; renderStep3(); });
        pair.append(cL, vs, cR);
        wrap.appendChild(pair);
        content.innerHTML = '';
        content.appendChild(wrap);

    } else {
        // Review overview
        setBanner('Step 3 of 4', 'Happy with your 6? Tap one from each group to compare and swap. Click <strong>Continue</strong> when satisfied.');
        nextBtn.disabled      = false;
        footerMsg.textContent = '— your top 6';
        hint.textContent      = 'Select from each group to compare, or continue';

        const wrap = document.createElement('div');
        wrap.className = 'compare-screen';

        // Finalists
        const finLabel = document.createElement('div');
        finLabel.className = 'section-label';
        finLabel.style.cssText = 'width:100%;max-width:380px;';
        finLabel.textContent = 'Your 6 values';
        const finGroup = document.createElement('div');
        finGroup.className = 'pill-group';
        allValues().forEach(v => {
            if (!finalists.has(v)) return;
            const p = document.createElement('div');
            p.className = 'pill finalist' + (revRight === v ? ' ring' : '');
            p.textContent = label(v);
            p.addEventListener('click', () => { revRight = revRight === v ? null : v; renderStep3(); });
            finGroup.appendChild(p);
        });
        wrap.append(finLabel, finGroup);

        // Pool
        const poolCards = allValues().filter(v => pool.includes(v));
        if (poolCards.length > 0) {
            const poolLabel = document.createElement('div');
            poolLabel.className = 'section-label';
            poolLabel.style.cssText = 'width:100%;max-width:380px;margin-top:18px;';
            poolLabel.textContent = 'Other values';
            const poolGroup = document.createElement('div');
            poolGroup.className = 'pill-group';
            poolCards.forEach(v => {
                const p = document.createElement('div');
                p.className = 'pill selectable' + (revLeft === v ? ' ring' : '');
                p.textContent = label(v);
                p.addEventListener('click', () => { revLeft = revLeft === v ? null : v; renderStep3(); });
                poolGroup.appendChild(p);
            });
            wrap.append(poolLabel, poolGroup);
        }

        content.innerHTML = '';
        content.appendChild(wrap);
    }
}

/* ════════════════════════════════════════════
   STEP 4 — Pyramid
════════════════════════════════════════════ */
function goToStep4() {
    step        = 4;
    placed      = new Map();
    pendingCard = null;
    dragSrc     = null;
    dots[3].classList.add('active');
    countDenom.textContent = '/ 6';
    nextBtn.textContent    = 'Done ✓';
    nextBtn.disabled       = true;
    renderStep4();
}

function renderStep4() {
    setBanner('Step 4 of 4', 'Place your 6 values. <strong>Most important</strong> goes at the top. Tap to select then place, or drag and drop.');
    setBack(true);

    const n = placed.size;
    countNum.textContent = n;
    countNum.classList.toggle('complete', n === 6);
    progressFill.style.width = `${(n / 6) * 100}%`;
    nextBtn.disabled      = n < 6;
    limitMsg.textContent  = '';
    footerMsg.textContent = pendingCard
        ? `— tap a slot to place "${label(pendingCard)}"`
        : n < 6 ? '' : '— all placed!';
    hint.textContent = pendingCard
        ? 'Tap an occupied slot to swap'
        : n < 6 ? 'Tap a value to select it, then tap a slot' : 'Tap Done when your pyramid is complete';

    const placedVals = new Set(placed.values());
    const unplaced   = allValues().filter(v => finalists.has(v) && !placedVals.has(v));
    const wrap       = document.createElement('div');

    // Unplaced value pills
    if (unplaced.length > 0) {
        const secLabel = document.createElement('div');
        secLabel.className = 'section-label';
        secLabel.textContent = 'Select a value';
        const group = document.createElement('div');
        group.className = 'unplaced-group';
        unplaced.forEach(v => {
            const p = document.createElement('div');
            p.className = 'unplaced-pill' + (pendingCard === v ? ' ring' : '');
            p.textContent = label(v);
            p.draggable = true;
            p.addEventListener('click', () => {
                pendingCard = pendingCard === v ? null : v;
                renderStep4();
            });
            p.addEventListener('dragstart', e => {
                dragSrc = { type: 'unplaced', value: v };
                e.dataTransfer.effectAllowed = 'move';
                pendingCard = null;
            });
            group.appendChild(p);
        });
        wrap.append(secLabel, group);
    }

    // Pyramid
    const pyrSection = document.createElement('div');
    pyrSection.className = 'pyramid-section';
    const pyrLabel = document.createElement('div');
    pyrLabel.className = 'section-label';
    pyrLabel.textContent = unplaced.length === 0 ? 'Your pyramid' : 'Then place it here';
    const pyr = document.createElement('div');
    pyr.className = 'pyramid';
    [[0], [1, 2], [3, 4, 5]].forEach(indices => {
        const row = document.createElement('div');
        row.className = 'pyr-row';
        indices.forEach(i => row.appendChild(makeSlot(i)));
        pyr.appendChild(row);
    });
    pyrSection.append(pyrLabel, pyr);
    wrap.appendChild(pyrSection);

    content.innerHTML = '';
    content.appendChild(wrap);
}

function makeSlot(index) {
    const placedVal = placed.get(index);
    const el = document.createElement('div');

    if (placedVal !== undefined) {
        el.className = `pyr-slot has-card${pendingCard ? ' swap-ready' : ''}`;
        el.innerHTML = `
            <div class="pyr-inner"></div>
            <span class="pyr-corner tl">◆</span>
            <span class="pyr-name">${label(placedVal)}</span>
            <span class="pyr-corner br">◆</span>
        `;
        el.draggable = true;
        el.addEventListener('click', () => {
            if (pendingCard) { placed.set(index, pendingCard); pendingCard = placedVal; }
            else             { placed.delete(index); pendingCard = placedVal; }
            renderStep4();
        });
        el.addEventListener('dragstart', e => {
            dragSrc = { type: 'slot', index, value: placedVal };
            e.dataTransfer.effectAllowed = 'move';
            pendingCard = null;
        });
    } else {
        el.className = `pyr-slot${pendingCard ? ' pending-target' : ''}`;
        el.innerHTML = `<span class="pyr-slot-num">${index + 1}</span>`;
        el.addEventListener('click', () => {
            if (pendingCard) { placed.set(index, pendingCard); pendingCard = null; renderStep4(); }
        });
    }

    el.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        el.classList.add('drag-over');
    });
    el.addEventListener('dragleave', e => {
        if (!el.contains(e.relatedTarget)) el.classList.remove('drag-over');
    });
    el.addEventListener('drop', e => {
        e.preventDefault();
        el.classList.remove('drag-over');
        if (!dragSrc) return;
        const incoming = dragSrc.value;
        if (dragSrc.type === 'unplaced') {
            placed.set(index, incoming);
        } else {
            const srcIdx = dragSrc.index;
            if (srcIdx === index) { dragSrc = null; return; }
            if (placedVal !== undefined) { placed.set(srcIdx, placedVal); placed.set(index, incoming); }
            else                        { placed.delete(srcIdx); placed.set(index, incoming); }
        }
        dragSrc = null;
        pendingCard = null;
        renderStep4();
    });

    return el;
}

/* ════════════════════════════════════════════
   NAVIGATION
════════════════════════════════════════════ */
backBtn.addEventListener('click', () => {
    if      (step === 2) { step = 1; dots[1].classList.remove('active'); renderStep1(); }
    else if (step === 3) { step = 2; dots[2].classList.remove('active'); renderStep2(); }
    else if (step === 4) { step = 3; dots[3].classList.remove('active'); renderStep4_back(); }
});

function renderStep4_back() {
    // Going back from step 4 → step 3: pool/finalists/s3phase are all preserved
    renderStep3();
}

nextBtn.addEventListener('click', () => {
    if      (step === 1) goToStep2();
    else if (step === 2) goToStep3();
    else if (step === 3) goToStep4();
    else if (step === 4) showCompletion();
});

/* ════════════════════════════════════════════
   SESSION ID  (anonymous, browser-scoped)
════════════════════════════════════════════ */
function getBrowserId() {
    let id = localStorage.getItem('vcg_bid');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('vcg_bid', id);
    }
    return id;
}

/* ════════════════════════════════════════════
   COMPLETION
════════════════════════════════════════════ */
async function showCompletion() {
    const order = [...placed.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, v]) => label(v));

    setBanner('Complete', 'Your values journey is complete.');
    setBack(false);
    progressFill.style.width = '100%';
    countNum.textContent = '6';
    countNum.classList.add('complete');
    footerMsg.textContent = '';
    hint.textContent      = '';
    nextBtn.style.display = 'none';

    const comp = document.createElement('div');
    comp.className = 'completion';

    const title = document.createElement('div');
    title.className = 'completion-title';
    title.textContent = 'What matters most to you';

    // Pyramid display
    const pyr = document.createElement('div');
    pyr.className = 'pyramid';
    [[0], [1, 2], [3, 4, 5]].forEach(indices => {
        const row = document.createElement('div');
        row.className = 'pyr-row';
        indices.forEach(i => {
            const slot = document.createElement('div');
            slot.className = 'pyr-slot has-card completion-slot' + (i === 0 ? ' top-slot' : '');
            slot.innerHTML = `
                <div class="pyr-inner"></div>
                <span class="pyr-corner tl">◆</span>
                <span class="pyr-name">${order[i]}</span>
                <span class="pyr-corner br">◆</span>
            `;
            row.appendChild(slot);
        });
        pyr.appendChild(row);
    });

    // AI portrait container
    const portraitWrap = document.createElement('div');
    portraitWrap.className = 'ai-portrait';

    // Email opt-in container (rendered after portrait loads)
    const emailSection = document.createElement('div');
    emailSection.className = 'email-section';

    comp.append(title, pyr, portraitWrap, emailSection);
    content.innerHTML = '';
    content.appendChild(comp);

    // Generate portrait, then save session + show email opt-in
    const portrait = await generatePortrait(order, portraitWrap);
    saveSession(order, portrait);
    renderEmailOptIn(emailSection, order, portrait);
}

async function generatePortrait(pyramidOrder, container) {
    // Loading state
    container.innerHTML = `<div class="portrait-loading"><span class="portrait-dots">Reflecting on your journey</span></div>`;

    // Build context for the AI
    const discardedLabels = [...discarded].map(v => label(v));
    const keptLabels      = [...kept].map(v => label(v));
    const apex            = pyramidOrder[0];
    const middle          = pyramidOrder.slice(1, 3);
    const base            = pyramidOrder.slice(3, 6);

    const comparisons = pairHistory.map(p => `${p.winner} over ${p.loser}`).join(', ');

    const prompt = `You are helping someone understand their core values after completing a reflective card game. Based on the choices they made, write a powerful 1–2 sentence personal introduction — like the opening line of a biography — that captures who they are and what drives them. Make it specific, vivid, and true to the values shown. Do not be generic. Do not use the word "values". Do not list the values literally.

Here is the context from their game:

FROM 80+ VALUES, THEY FIRST CHOSE THESE 24:
${[...selected].map(v => label(v)).join(', ')}

IN STEP 2, THEY DISCARDED THESE 12 (things they were willing to let go):
${discardedLabels.join(', ')}

THEY KEPT THESE 12 (things they couldn't give up):
${keptLabels.join(', ')}

IN STEP 3, THEY CHOSE BETWEEN PAIRS — EACH CHOICE SHOWING WHAT MATTERS MORE:
${comparisons || '(no comparisons recorded)'}

THEIR FINAL VALUES PYRAMID:
- Apex (overriding belief about a good society): ${apex}
- Middle row (philosophical goals / how they want to be perceived): ${middle.join(' and ')}
- Base row (decision criteria / how they act day-to-day): ${base.join(', ')}

Write the 1–2 sentence portrait now. Write in second person ("You are someone who...") so it feels personal.`;

    try {
        // All Claude API calls go through /api/synthesize so the API key
        // stays on the server and is never exposed to the browser.
        // A 30-second timeout ensures this always resolves so saveSession
        // is never left waiting indefinitely.
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 30000);

        const res = await fetch('/api/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model: 'claude-opus-4-6',
                max_tokens: 200,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error?.message || err.error || `API error ${res.status}`);
        }

        const data     = await res.json();
        const portrait = data.content?.[0]?.text?.trim() || '';

        container.innerHTML = `
            <div class="portrait-label">Your values portrait</div>
            <p class="portrait-text">${portrait}</p>
        `;
        return portrait;
    } catch (e) {
        const msg = e.name === 'AbortError'
            ? 'Portrait generation timed out.'
            : `Couldn't generate portrait: ${e.message}`;
        container.innerHTML = `<p class="portrait-error">${msg}</p>`;
        return '';
    }
}

/* ════════════════════════════════════════════
   SAVE SESSION  (anonymous, fire-and-forget)
════════════════════════════════════════════ */
function saveSession(pyramidOrder, portrait) {
    const payload = JSON.stringify({
        browserId: getBrowserId(),
        gameData: {
            selected:    [...selected].map(v => label(v)),
            kept:        [...kept].map(v => label(v)),
            discarded:   [...discarded].map(v => label(v)),
            comparisons: pairHistory,
            pyramid:     pyramidOrder,
            portrait
        }
    });

    // sendBeacon guarantees delivery even when the user closes the tab.
    // Falls back to fetch for any environment that doesn't support it.
    if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/save-session', new Blob([payload], { type: 'application/json' }));
    } else {
        fetch('/api/save-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
        }).catch(e => console.warn('Session save failed:', e.message));
    }
}

/* ════════════════════════════════════════════
   EMAIL OPT-IN
════════════════════════════════════════════ */
function renderEmailOptIn(container, pyramidOrder, portrait) {
    const keptLabels      = [...kept].map(v => label(v));
    const discardedLabels = [...discarded].map(v => label(v));

    container.innerHTML = `
        <div class="email-opt-in">
            <p class="email-prompt">Want a copy of your results?</p>
            <p class="email-note">Enter your email and we'll send it once. We don't store your address.</p>
            <div class="email-form">
                <input type="email" class="email-input" placeholder="you@example.com" />
                <button class="email-btn">Send →</button>
            </div>
            <p class="email-status"></p>
        </div>
    `;

    const input  = container.querySelector('.email-input');
    const btn    = container.querySelector('.email-btn');
    const status = container.querySelector('.email-status');

    btn.addEventListener('click', async () => {
        const email = input.value.trim();
        if (!email || !email.includes('@')) {
            input.classList.add('input-error');
            return;
        }
        input.classList.remove('input-error');
        btn.disabled    = true;
        btn.textContent = 'Sending…';
        status.textContent = '';

        try {
            const res = await fetch('/api/send-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    gameData: { pyramid: pyramidOrder, kept: keptLabels, discarded: discardedLabels, portrait }
                })
            });

            if (!res.ok) throw new Error('Send failed');

            container.innerHTML = `<p class="email-sent">✓ Sent! Check your inbox.</p>`;
        } catch (e) {
            btn.disabled    = false;
            btn.textContent = 'Send →';
            status.textContent = 'Something went wrong — please try again.';
        }
    });

    // Allow submitting with Enter key
    input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
}
