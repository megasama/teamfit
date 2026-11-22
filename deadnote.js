let isEditingContract = false;
let draftContract = null;
let selectedIdentityMember = '';

// State for the bottom check-in composer
let composerMode = 'on_track'; // 'on_track' | 'blocked'
let composerDoneNote = '';
let composerBlockedNote = '';
let lastComposerMember = '';

function resetDeadNoteState() {
  isEditingContract = false;
  draftContract = null;
  selectedIdentityMember = '';
  composerMode = 'on_track';
  composerDoneNote = '';
  composerBlockedNote = '';
  lastComposerMember = '';
}

function shortCodeFromMemberName(fullName) {
  if (!fullName) return '';
  const firstPart = fullName.split('·')[0].trim();
  return firstPart || fullName.trim();
}

function buildDefaultDraftFromTeam(team) {
  const existing = team.contract;
  if (existing) {
    return {
      project: existing.project || '',
      deadline: existing.deadline || '2026-12-06',
      assignments: (existing.assignments || []).map((a) => ({ member: a.member, part: a.part })),
      rhythm: existing.rhythm || 'two_days_week',
      weeklyDays: Array.isArray(existing.weeklyDays) && existing.weeklyDays.length ? [...existing.weeklyDays] : ['Wed', 'Sat'],
      startDate: existing.startDate || '2026-11-25',
      postBy: existing.postBy || '20:00',
      stakeAfter: existing.stakeAfter || '2 ghost marks',
      funStake: existing.funStake || ''
    };
  }

  const memberCodes = team.members.map((m) => shortCodeFromMemberName(m.name)).filter(Boolean);
  const rows = memberCodes.length
    ? memberCodes.map((code) => ({ member: code, part: '' }))
    : [
        { member: 'S', part: '' },
        { member: 'P', part: '' }
      ];

  return {
    project: '',
    deadline: '2026-12-06',
    assignments: rows,
    rhythm: 'two_days_week',
    weeklyDays: ['Wed', 'Sat'],
    startDate: '2026-11-25',
    postBy: '20:00',
    stakeAfter: '2 ghost marks',
    funStake: ''
  };
}

function openContractEditor() {
  const team = getActiveTeam();
  draftContract = buildDefaultDraftFromTeam(team);
  isEditingContract = true;
  renderDeadNoteTab();
}

function cancelContractEditor() {
  isEditingContract = false;
  draftContract = null;
  renderDeadNoteTab();
}

function syncDraftFromDOM() {
  if (!draftContract) return;
  const projEl = document.getElementById('contractProjectInput');
  const deadEl = document.getElementById('contractDeadlineInput');
  const startEl = document.getElementById('contractStartDateInput');
  const postEl = document.getElementById('contractPostBySelect');
  const stakeAfterEl = document.getElementById('contractStakeAfterSelect');
  const funStakeEl = document.getElementById('contractFunStakeInput');

  if (projEl) draftContract.project = projEl.value;
  if (deadEl) draftContract.deadline = deadEl.value;
  if (startEl) draftContract.startDate = startEl.value;
  if (postEl) draftContract.postBy = postEl.value;
  if (stakeAfterEl) draftContract.stakeAfter = stakeAfterEl.value;
  if (funStakeEl) draftContract.funStake = funStakeEl.value;

  const memberInputs = document.querySelectorAll('.who-member-input');
  const partInputs = document.querySelectorAll('.who-part-input');
  const updatedAssignments = [];
  for (let i = 0; i < memberInputs.length; i++) {
    updatedAssignments.push({
      member: memberInputs[i].value,
      part: partInputs[i] ? partInputs[i].value : ''
    });
  }
  draftContract.assignments = updatedAssignments;
}

function addContractMemberRow() {
  syncDraftFromDOM();
  if (!draftContract) return;
  draftContract.assignments.push({ member: '', part: '' });
  renderDeadNoteTab();
}

function removeContractMemberRow(idx) {
  syncDraftFromDOM();
  if (!draftContract) return;
  draftContract.assignments.splice(idx, 1);
  renderDeadNoteTab();
}

function selectContractRhythm(rhythmKey) {
  syncDraftFromDOM();
  if (!draftContract) return;
  draftContract.rhythm = rhythmKey;
  renderDeadNoteTab();
}

function toggleWeeklyDay(dayName) {
  syncDraftFromDOM();
  if (!draftContract) return;
  const idx = draftContract.weeklyDays.indexOf(dayName);
  if (idx >= 0) {
    if (draftContract.weeklyDays.length > 1) {
      draftContract.weeklyDays.splice(idx, 1);
    }
  } else {
    draftContract.weeklyDays.push(dayName);
  }
  renderDeadNoteTab();
}

function saveAndAskAgreement() {
  syncDraftFromDOM();
  if (!draftContract) return;

  const team = getActiveTeam();
  const cleanedAssignments = draftContract.assignments
    .map((a) => ({
      member: a.member.trim() || 'Member',
      part: a.part.trim()
    }))
    .filter((a) => a.member.length > 0);

  const finalAssignments = cleanedAssignments.length
    ? cleanedAssignments
    : [{ member: 'Member 1', part: '' }];

  team.contract = {
    project: draftContract.project.trim() || 'Group Project',
    deadline: draftContract.deadline || '2026-12-06',
    assignments: finalAssignments,
    rhythm: draftContract.rhythm || 'two_days_week',
    weeklyDays: draftContract.weeklyDays?.length ? [...draftContract.weeklyDays] : ['Wed', 'Sat'],
    startDate: draftContract.startDate || '2026-11-25',
    postBy: draftContract.postBy || '20:00',
    stakeAfter: draftContract.stakeAfter || '2 ghost marks',
    funStake: draftContract.funStake.trim() || 'Buy the team bubble tea',
    agreedMembers: []
  };

  team.checkins = finalAssignments.map((a, index) => {
    const prev = team.checkins?.find((c) => c.member === a.member);
    return {
      id: prev?.id || (Date.now() + index),
      member: a.member,
      status: 'not_yet',
      note: '',
      doneNote: '',
      blockedNote: '',
      helpNote: '',
      helpers: [],
      ghosts: prev?.ghosts ?? 0
    };
  });

  selectedIdentityMember = '';
  lastComposerMember = '';
  isEditingContract = false;
  draftContract = null;
  saveStore();
  renderAll();
}

function getContractRoster(contract) {
  if (!contract) return [];
  const fromAssignments = (contract.assignments || []).map((a) => a.member.trim()).filter(Boolean);
  return [...new Set(fromAssignments)];
}

function onIdentitySelectChange(val) {
  selectedIdentityMember = val;
  lastComposerMember = '';
  syncComposerWithMember(val);
  renderDeadNoteTab();
}

function syncComposerWithMember(memberCode) {
  const team = getActiveTeam();
  if (!team.checkins || !memberCode) return;
  const entry = team.checkins.find((c) => c.member === memberCode);
  if (!entry) return;

  if (lastComposerMember !== memberCode) {
    lastComposerMember = memberCode;
    composerMode = entry.status === 'blocked' ? 'blocked' : 'on_track';
    composerDoneNote = entry.doneNote || (entry.status === 'on_track' ? (entry.note || '') : '');
    composerBlockedNote = entry.blockedNote || (entry.status === 'blocked' ? (entry.note || '') : '');
  }
}

function confirmMemberAgreement() {
  const team = getActiveTeam();
  if (!team.contract || !selectedIdentityMember) return;

  if (!team.contract.agreedMembers) {
    team.contract.agreedMembers = [];
  }
  if (!team.contract.agreedMembers.includes(selectedIdentityMember)) {
    team.contract.agreedMembers.push(selectedIdentityMember);
  }

  saveStore();
  renderAll();
}

function formatShortDate(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return isoStr;
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${weekdays[d.getDay()]} ${day} ${months[month]}`;
}

function formatShortStart(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[month]}`;
}

function formatCheckinSummary(contract) {
  const postBy = contract.postBy || '20:00';
  if (contract.rhythm === 'every_3_days') {
    const startText = formatShortStart(contract.startDate || '2026-11-25');
    return `Every 3 days, by ${postBy} (from ${startText})`;
  }
  if (contract.rhythm === 'every_4_days') {
    const startText = formatShortStart(contract.startDate || '2026-11-25');
    return `Every 4 days, by ${postBy} (from ${startText})`;
  }
  const daysText = (contract.weeklyDays && contract.weeklyDays.length)
    ? contract.weeklyDays.join(' & ')
    : 'Wed & Sat';
  return `${daysText}, by ${postBy}`;
}

function getNextCheckinInfo(contract) {
  const postBy = contract.postBy || '20:00';
  const [hh, mm] = postBy.split(':').map((n) => Number(n) || 0);
  const startStr = contract.startDate || '2026-11-25';
  const [y, m, d] = startStr.split('-').map((n) => Number(n) || 0);
  const targetDate = new Date(y, (m || 1) - 1, d || 1, hh, mm, 0);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const formattedLabel = isNaN(targetDate.getTime())
    ? `Wed 25 Nov, ${postBy}`
    : `${weekdays[targetDate.getDay()]} ${targetDate.getDate()} ${months[targetDate.getMonth()]}, ${postBy}`;

  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  let countdownText = 'due soon';
  if (!isNaN(diffMs) && diffMs > 0) {
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (days > 0) {
      countdownText = `in ${days} day${days > 1 ? 's' : ''} ${hours} h`;
    } else {
      countdownText = `in ${hours} h`;
    }
  } else if (!isNaN(diffMs) && diffMs <= 0) {
    countdownText = 'check-in window';
  }

  return { formattedLabel, countdownText };
}

function setComposerMode(mode) {
  const doneEl = document.getElementById('statusDoneInput');
  const blockedEl = document.getElementById('statusBlockedInput');
  if (doneEl) composerDoneNote = doneEl.value;
  if (blockedEl) composerBlockedNote = blockedEl.value;
  composerMode = mode;
  renderDeadNoteTab();
}

function postCheckinStatus() {
  const team = getActiveTeam();
  if (!team.contract) return;

  const roster = getContractRoster(team.contract);
  const activePerson = selectedIdentityMember || roster[0];
  if (!activePerson) return;

  const doneEl = document.getElementById('statusDoneInput');
  const blockedEl = document.getElementById('statusBlockedInput');
  const doneText = (doneEl ? doneEl.value : composerDoneNote).trim();
  const blockedText = (blockedEl ? blockedEl.value : composerBlockedNote).trim();

  if (composerMode === 'blocked' && !blockedText) {
    if (blockedEl) {
      blockedEl.style.borderColor = '#d97706';
      blockedEl.placeholder = 'Please describe what is blocking you (พิมพ์ปัญหาที่ติดขัดก่อนกดส่ง)';
      blockedEl.focus();
    }
    return;
  }

  if (!team.checkins) team.checkins = [];
  let entry = team.checkins.find((c) => c.member === activePerson);
  if (!entry) {
    entry = {
      id: Date.now(),
      member: activePerson,
      status: 'not_yet',
      note: '',
      doneNote: '',
      blockedNote: '',
      helpNote: '',
      helpers: [],
      ghosts: 0
    };
    team.checkins.push(entry);
  }

  if (composerMode === 'blocked') {
    entry.status = 'blocked';
    entry.blockedNote = blockedText;
    entry.doneNote = doneText;
    entry.note = blockedText;
    entry.helpNote = 'Waiting for a teammate to help';
    entry.helpers = [];
  } else {
    entry.status = 'on_track';
    entry.doneNote = doneText || 'On track';
    entry.blockedNote = '';
    entry.note = entry.doneNote;
    entry.helpNote = '';
    entry.helpers = [];
  }

  composerDoneNote = entry.doneNote;
  composerBlockedNote = entry.blockedNote;
  lastComposerMember = activePerson;

  saveStore();
  renderAll();
}

function offerHelpToMember(targetMember) {
  const team = getActiveTeam();
  if (!team.contract || !team.checkins) return;

  const roster = getContractRoster(team.contract);
  const helperCode = selectedIdentityMember || roster[0];
  if (!helperCode || helperCode === targetMember) return;

  const entry = team.checkins.find((c) => c.member === targetMember);
  if (!entry) return;

  if (!Array.isArray(entry.helpers)) entry.helpers = [];
  if (!entry.helpers.includes(helperCode)) {
    entry.helpers.push(helperCode);
  }

  saveStore();
  renderAll();
}

function resolveMemberBlocker(targetMember) {
  const team = getActiveTeam();
  if (!team.checkins) return;

  const entry = team.checkins.find((c) => c.member === targetMember);
  if (!entry) return;

  const helperText = (entry.helpers && entry.helpers.length)
    ? ` (helped by ${entry.helpers.join(', ')})`
    : '';
  const prevProgress = entry.doneNote || entry.blockedNote || 'Blocker resolved';

  entry.status = 'on_track';
  entry.doneNote = `${prevProgress}${helperText}`;
  entry.note = entry.doneNote;
  entry.blockedNote = '';
  entry.helpNote = '';
  entry.helpers = [];

  if (selectedIdentityMember === targetMember) {
    lastComposerMember = '';
  }

  saveStore();
  renderAll();
}

function simulateMissedCheckin(targetMember) {
  const team = getActiveTeam();
  if (!team.checkins) team.checkins = [];

  let entry = team.checkins.find((c) => c.member === targetMember);
  if (!entry) {
    entry = {
      id: Date.now(),
      member: targetMember,
      status: 'not_yet',
      note: '',
      doneNote: '',
      blockedNote: '',
      helpNote: '',
      helpers: [],
      ghosts: 0
    };
    team.checkins.push(entry);
  }

  entry.ghosts = (entry.ghosts || 0) + 1;
  saveStore();
  renderAll();
}

function parseStakeThreshold(stakeAfterStr) {
  const match = String(stakeAfterStr || '').match(/\d+/);
  return match ? Number(match[0]) : 2;
}

function renderStatusBadge(status) {
  if (status === 'blocked') {
    return `<span class="state-badge blocked">! Blocked</span>`;
  }
  if (status === 'on_track') {
    return `<span class="state-badge on_track">✓ On track</span>`;
  }
  return `<span class="state-badge not_yet">🕒 Not yet</span>`;
}

function renderDeadNoteTab() {
  const team = getActiveTeam();
  const contractCard = document.getElementById('deadnoteContractCard');
  const checkinCard = document.getElementById('deadnoteCheckinCard');
  if (!contractCard || !checkinCard) return;

  if (isEditingContract) {
    if (!draftContract) draftContract = buildDefaultDraftFromTeam(team);

    const rowsHtml = draftContract.assignments.map((row, idx) => `
      <div class="who-row">
        <input
          type="text"
          class="text-input who-member-input"
          maxlength="28"
          value="${escapeAttr(row.member)}"
          placeholder="Name / Code"
        />
        <input
          type="text"
          class="text-input who-part-input"
          value="${escapeAttr(row.part)}"
          placeholder="Their part, e.g. slides 1–5"
        />
        <button
          type="button"
          class="remove-row-btn"
          title="Remove row"
          onclick="removeContractMemberRow(${idx})"
        >×</button>
      </div>
    `).join('');

    const rhythm = draftContract.rhythm || 'two_days_week';
    const showStartDate = (rhythm === 'every_3_days' || rhythm === 'every_4_days');
    const showDaysPicker = (rhythm === 'two_days_week');

    const daysChipsHtml = WEEKDAYS.map((day) => {
      const active = (draftContract.weeklyDays || []).includes(day);
      return `<button type="button" class="day-chip ${active ? 'active' : ''}" onclick="toggleWeeklyDay('${day}')">${day}</button>`;
    }).join('');

    const times = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:59'];
    const stakeOptions = ['1 ghost mark', '2 ghost marks', '3 ghost marks'];

    contractCard.innerHTML = `
      <div class="step-kicker">STEP 2 · COMMIT</div>
      <h2 class="section-title">Team contract <span style="font-size:15px;font-weight:600;color:#64748b;">· สัญญาทีม</span></h2>

      <div class="contract-form-grid-2" style="margin-top: 14px;">
        <div>
          <label class="name-label-en" for="contractProjectInput">Project</label>
          <input
            id="contractProjectInput"
            class="text-input"
            type="text"
            value="${escapeAttr(draftContract.project)}"
            placeholder="e.g. GEN231 Final Assignment"
          />
        </div>
        <div>
          <label class="name-label-en" for="contractDeadlineInput">Deadline</label>
          <input
            id="contractDeadlineInput"
            class="date-input"
            type="date"
            value="${escapeAttr(draftContract.deadline)}"
          />
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <label class="name-label-en">Who does what</label>
        <span class="name-label-th">ใครทำอะไร ระบุเจ้าของงานให้ชัด</span>
        <div>${rowsHtml}</div>
        <button type="button" class="add-member-btn" onclick="addContractMemberRow()">+ Add member</button>
      </div>

      <div>
        <label class="name-label-en">Check-in rhythm: pick one</label>
        <span class="name-label-th">เลือกความถี่ในการอัปเดตสถานะ 1 แบบ</span>
        <div class="rhythm-grid">
          <button
            type="button"
            class="rhythm-card ${rhythm === 'two_days_week' ? 'selected' : ''}"
            onclick="selectContractRhythm('two_days_week')"
          >
            <span class="rhythm-title">2 days a week</span>
            <span class="rhythm-sub">you pick the days</span>
          </button>
          <button
            type="button"
            class="rhythm-card ${rhythm === 'every_3_days' ? 'selected' : ''}"
            onclick="selectContractRhythm('every_3_days')"
          >
            <span class="rhythm-title">Every 3 days</span>
            <span class="rhythm-sub">from a start date</span>
          </button>
          <button
            type="button"
            class="rhythm-card ${rhythm === 'every_4_days' ? 'selected' : ''}"
            onclick="selectContractRhythm('every_4_days')"
          >
            <span class="rhythm-title">Every 4 days</span>
            <span class="rhythm-sub">from a start date</span>
          </button>
        </div>

        ${showDaysPicker ? `
          <div class="days-picker-box">
            <span style="font-size:12.5px;font-weight:700;color:#334155;">Pick check-in days · เลือกวันเช็กอิน:</span>
            <div class="days-chip-row">${daysChipsHtml}</div>
          </div>
        ` : ''}

        ${showStartDate ? `
          <div style="max-width: 240px; margin-bottom: 16px;">
            <label class="name-label-en" for="contractStartDateInput">First check-in</label>
            <input
              id="contractStartDateInput"
              class="date-input"
              type="date"
              value="${escapeAttr(draftContract.startDate)}"
            />
          </div>
        ` : ''}
      </div>

      <div class="contract-form-grid-2">
        <div>
          <label class="name-label-en" for="contractPostBySelect">Post status by</label>
          <select id="contractPostBySelect" class="select-input">
            ${times.map((t) => `<option value="${t}" ${draftContract.postBy === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="name-label-en" for="contractStakeAfterSelect">Stake after</label>
          <select id="contractStakeAfterSelect" class="select-input">
            ${stakeOptions.map((s) => `<option value="${s}" ${draftContract.stakeAfter === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>

      <div>
        <label class="name-label-en" for="contractFunStakeInput">Fun stake</label>
        <span class="name-label-th">กติกาขำ ๆ ถ้าเงียบหาย เช่น เลี้ยงชานมทั้งทีม</span>
        <input
          id="contractFunStakeInput"
          class="text-input"
          type="text"
          value="${escapeAttr(draftContract.funStake)}"
          placeholder="e.g. Buy the team bubble tea"
        />
      </div>

      <div class="contract-actions">
        <button type="button" class="primary-btn" onclick="saveAndAskAgreement()">Save and ask everyone to agree</button>
        <button type="button" class="secondary-btn" onclick="cancelContractEditor()">Cancel</button>
      </div>
      <p class="contract-footnote">Saving clears earlier agreements, so everyone agrees to the same version.</p>
    `;

    checkinCard.innerHTML = `
      <div class="step-kicker">STEP 3 · CHECK</div>
      <h2 class="section-title">Check-in board <span style="font-size:15px;font-weight:600;color:#64748b;">· บอร์ดเช็กอิน</span></h2>
      <p class="section-sub" style="margin-bottom:0;">
        The board starts when everyone has agreed to the team contract.<br>
        บอร์ดจะเริ่มทำงานเมื่อทุกคนกดยอมรับสัญญาทีม
      </p>
    `;
    return;
  }

  if (!team.contract) {
    contractCard.innerHTML = `
      <div class="step-kicker">STEP 2 · COMMIT</div>
      <h2 class="section-title">Team contract <span style="font-size:15px;font-weight:600;color:#64748b;">· สัญญาทีม</span></h2>
      <p class="section-sub">
        Agree who does what, when you check in, and a fun stake for going silent.<br>
        ตกลงกันว่าใครทำอะไร เช็กอินวันไหน และกติกาขำ ๆ ถ้าเงียบหาย
      </p>
      <button type="button" class="primary-btn" onclick="openContractEditor()">Write the contract</button>
    `;

    checkinCard.innerHTML = `
      <div class="step-kicker">STEP 3 · CHECK</div>
      <h2 class="section-title">Check-in board <span style="font-size:15px;font-weight:600;color:#64748b;">· บอร์ดเช็กอิน</span></h2>
      <p class="section-sub" style="margin-bottom:0;">
        The board starts when everyone has agreed to the team contract.<br>
        บอร์ดจะเริ่มทำงานเมื่อทุกคนกดยอมรับสัญญาทีม
      </p>
    `;
    return;
  }

  const c = team.contract;
  const roster = getContractRoster(c);
  const agreedSet = new Set(c.agreedMembers || []);
  const pendingCount = Math.max(0, roster.length - agreedSet.size);
  const allAgreed = roster.length > 0 && pendingCount === 0;

  const optionsHtml = roster.map((code) => {
    const signedMark = agreedSet.has(code) ? ' ✓' : '';
    return `<option value="${escapeAttr(code)}" ${selectedIdentityMember === code ? 'selected' : ''}>${escapeHtml(code)}${signedMark}</option>`;
  }).join('');

  const whoHtml = (c.assignments || []).map((a) => `
    <div><strong>${escapeHtml(a.member)}</strong> ${escapeHtml(a.part || '')}</div>
  `).join('');

  const agreedChipsHtml = roster.map((code) => {
    const isSigned = agreedSet.has(code);
    return `<span class="agreed-badge ${isSigned ? 'signed' : ''}" title="${isSigned ? 'Agreed' : 'Waiting'}">${escapeHtml(code)}${isSigned ? ' ✓' : ''}</span>`;
  }).join('');

  const alreadySigned = selectedIdentityMember && agreedSet.has(selectedIdentityMember);

  contractCard.innerHTML = `
    <div class="contract-top-row">
      <div>
        <div class="step-kicker">STEP 2 · COMMIT</div>
        <h2 class="section-title">Team contract <span style="font-size:15px;font-weight:600;color:#64748b;">· สัญญาทีม</span></h2>
      </div>
      <span class="waiting-pill ${allAgreed ? 'all-agreed' : ''}">
        ${allAgreed ? '✓ Locked · Everyone agreed' : `🕒 Waiting for ${pendingCount}`}
      </span>
    </div>

    ${!allAgreed ? `
      <div class="you-are-row">
        <label class="you-are-label" for="youAreSelect">You are</label>
        <select id="youAreSelect" class="who-select" onchange="onIdentitySelectChange(this.value)">
          <option value="">Choose...</option>
          ${optionsHtml}
        </select>
        ${selectedIdentityMember ? `
          <button
            type="button"
            class="primary-btn"
            style="padding: 8px 14px; font-size: 13px;"
            onclick="confirmMemberAgreement()"
            ${alreadySigned ? 'disabled style="opacity:0.65;cursor:default;"' : ''}
          >
            ${alreadySigned ? `Agreed (${escapeHtml(selectedIdentityMember)}) ✓` : `I agree (${escapeHtml(selectedIdentityMember)})`}
          </button>
        ` : ''}
      </div>
    ` : ''}

    <div class="contract-summary-table" style="margin-top: 14px;">
      <div class="contract-summary-line">
        <span class="contract-field-key">Project</span>
        <span class="contract-field-val">${escapeHtml(c.project)} · due ${escapeHtml(formatShortDate(c.deadline))}</span>
      </div>
      <div class="contract-summary-line">
        <span class="contract-field-key">Who does what</span>
        <div class="contract-field-val who-list-stack">${whoHtml}</div>
      </div>
      <div class="contract-summary-line">
        <span class="contract-field-key">Check-in</span>
        <span class="contract-field-val">${escapeHtml(formatCheckinSummary(c))}</span>
      </div>
      <div class="contract-summary-line">
        <span class="contract-field-key">Stake</span>
        <span class="contract-field-val">${escapeHtml(c.funStake)} after ${escapeHtml(c.stakeAfter)}</span>
      </div>
    </div>

    <div class="agreed-row">
      <span>Agreed:</span>
      ${agreedChipsHtml}
    </div>

    <div>
      <button type="button" class="secondary-btn" onclick="openContractEditor()">Edit</button>
    </div>
  `;

  if (!allAgreed) {
    checkinCard.innerHTML = `
      <div class="step-kicker">STEP 3 · CHECK</div>
      <h2 class="section-title">Check-in board <span style="font-size:15px;font-weight:600;color:#64748b;">· บอร์ดเช็กอิน</span></h2>
      <p class="section-sub" style="margin-bottom:0;">
        The board starts when everyone has agreed to the team contract.<br>
        บอร์ดจะเริ่มเมื่อทุกคนกดยอมรับสัญญาทีม (${agreedSet.size}/${roster.length} agreed)
      </p>
    `;
    return;
  }

  const currentComposerPerson = selectedIdentityMember || roster[0] || '';
  syncComposerWithMember(currentComposerPerson);

  const nextInfo = getNextCheckinInfo(c);

  const memberCardsHtml = (c.assignments || []).map((assign) => {
    const code = assign.member;
    const entry = (team.checkins || []).find((item) => item.member === code) || {
      status: 'not_yet',
      note: '',
      doneNote: '',
      blockedNote: '',
      helpNote: '',
      helpers: [],
      ghosts: 0
    };
    const isYou = code === currentComposerPerson;
    const helpers = Array.isArray(entry.helpers) ? entry.helpers : [];
    const iAlreadyOffered = helpers.includes(currentComposerPerson);

    let bodyHtml = '';
    if (entry.status === 'blocked') {
      const issueText = (entry.blockedNote || entry.note || '').trim();
      const otherProgress = (entry.doneNote || '').trim();

      const helperStatusHtml = helpers.length > 0
        ? `<span class="helper-offered-pill">✓ ${escapeHtml(helpers.join(', '))} offered to help</span>`
        : `<span class="member-help-note urgent-amber">● Waiting for a teammate to help</span>`;

      let actionButtonHtml = '';
      if (!isYou) {
        actionButtonHtml = iAlreadyOffered
          ? `<button type="button" class="resolve-help-btn" onclick="resolveMemberBlocker('${escapeAttr(code)}')">Mark resolved</button>`
          : `<button type="button" class="ill-help-btn" onclick="offerHelpToMember('${escapeAttr(code)}')">I'll help</button>`;
      } else {
        actionButtonHtml = `<button type="button" class="resolve-help-btn" onclick="resolveMemberBlocker('${escapeAttr(code)}')">Mark resolved</button>`;
      }

      bodyHtml = `
        <div class="blocked-callout-box">
          ${issueText ? `<p class="member-blocked-line">“${escapeHtml(issueText)}”</p>` : ''}
          ${otherProgress ? `<p class="member-progress-line">Other progress: “${escapeHtml(otherProgress)}”</p>` : ''}
          <div class="blocked-actions-row">
            ${helperStatusHtml}
            ${actionButtonHtml}
          </div>
        </div>
      `;
    } else if (entry.status === 'on_track') {
      const doneText = (entry.doneNote || entry.note || '').trim();
      bodyHtml = doneText ? `<p class="member-quote">“${escapeHtml(doneText)}”</p>` : '';
    }

    return `
      <div class="member-status-card">
        <div class="member-status-main">
          <div class="member-title-line">
            <span class="member-code-bold">${escapeHtml(code)}</span>
            ${isYou ? `<span class="you-tag-pill">you</span>` : ''}
          </div>
          <div class="member-part-sub">${escapeHtml(assign.part || '')}</div>
          ${bodyHtml}
        </div>
        <div>${renderStatusBadge(entry.status)}</div>
      </div>
    `;
  }).join('');

  const boardOptionsHtml = roster.map((code) =>
    `<option value="${escapeAttr(code)}" ${code === currentComposerPerson ? 'selected' : ''}>${escapeHtml(code)}</option>`
  ).join('');

  const threshold = parseStakeThreshold(c.stakeAfter);
  const ledgerRowsHtml = (c.assignments || []).map((assign) => {
    const code = assign.member;
    const entry = (team.checkins || []).find((item) => item.member === code) || { ghosts: 0 };
    const ghosts = entry.ghosts || 0;
    const triggered = ghosts >= threshold;
    const badgeClass = triggered ? 'stake-triggered' : (ghosts > 0 ? 'has-ghost' : '');
    const labelText = triggered
      ? `${ghosts} / ${threshold} ghost marks · Stake triggered!`
      : `${ghosts} / ${threshold} ghost marks`;

    return `
      <div class="ledger-row">
        <div>
          <strong>${escapeHtml(code)}</strong>
          <span style="color:#64748b;margin-left:6px;">${escapeHtml(assign.part || '')}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="ghost-count-pill ${badgeClass}">${labelText}</span>
          <button type="button" class="sim-ghost-btn" onclick="simulateMissedCheckin('${escapeAttr(code)}')">+1 Ghost (Demo)</button>
        </div>
      </div>
    `;
  }).join('');

  checkinCard.innerHTML = `
    <div class="board-header-row">
      <div>
        <div class="step-kicker">STEP 3 · CHECK</div>
        <h2 class="section-title" style="margin-bottom:0;">Check-in board <span style="font-size:15px;font-weight:600;color:#64748b;">· บอร์ดเช็กอิน</span></h2>
      </div>
      <div class="board-you-are">
        <label class="you-are-label" for="boardYouAreSelect" style="font-size:14px;">You are</label>
        <select id="boardYouAreSelect" class="who-select" style="padding:7px 12px;min-width:96px;" onchange="onIdentitySelectChange(this.value)">
          ${boardOptionsHtml}
        </select>
      </div>
    </div>

    <div class="next-checkin-box">
      <div>
        <div class="next-checkin-label">Next check-in</div>
        <div class="next-checkin-time">${escapeHtml(nextInfo.formattedLabel)}</div>
      </div>
      <span class="countdown-pill">${escapeHtml(nextInfo.countdownText)}</span>
    </div>

    <div class="member-status-list">
      ${memberCardsHtml}
    </div>

    <div class="update-status-box">
      <h3 class="update-status-heading">Update your status <span>for this check-in</span></h3>

      <div class="mode-toggle-grid">
        <button
          type="button"
          class="mode-btn ${composerMode === 'on_track' ? 'active-on-track' : ''}"
          onclick="setComposerMode('on_track')"
        >
          On track
        </button>
        <button
          type="button"
          class="mode-btn ${composerMode === 'blocked' ? 'active-blocked' : ''}"
          onclick="setComposerMode('blocked')"
        >
          Blocked, need help
        </button>
      </div>

      ${composerMode === 'on_track' ? `
        <div class="composer-field-stack">
          <label class="composer-field-label on-track" for="statusDoneInput">On track · What did you finish?</label>
          <textarea
            id="statusDoneInput"
            class="composer-textarea"
            placeholder="e.g. Finished slides 1–5"
          >${escapeHtml(composerDoneNote)}</textarea>
        </div>
      ` : `
        <div class="composer-field-stack">
          <label class="composer-field-label blocked" for="statusBlockedInput">Blocked · What do you need?</label>
          <textarea
            id="statusBlockedInput"
            class="composer-textarea"
            placeholder="e.g. I need the cause map."
          >${escapeHtml(composerBlockedNote)}</textarea>
        </div>

        <div class="composer-field-stack">
          <label class="composer-field-label" for="statusDoneInput">Progress on other parts not blocked <span style="font-weight:500;color:#64748b;">· ความคืบหน้าส่วนอื่น</span></label>
          <textarea
            id="statusDoneInput"
            class="composer-textarea"
            placeholder="e.g. Finished slides 1–5"
          >${escapeHtml(composerDoneNote)}</textarea>
        </div>
      `}

      <div class="post-status-row">
        <button type="button" class="post-status-btn" onclick="postCheckinStatus()">Post status</button>
        <span class="post-status-hint">Blocked is never a mark against you. · การติดปัญหาไม่ใช่การไม่ทำงาน</span>
      </div>
    </div>

    <div class="ledger-box">
      <div class="ledger-header-row">
        <div>
          <h3 class="ledger-title">Ghost mark ledger <span style="font-weight:500;color:#64748b;">· บันทึกการเงียบหาย</span></h3>
          <p class="ledger-sub">Only silence past check-in time adds a ghost mark. Stake: <strong>${escapeHtml(c.funStake)}</strong></p>
        </div>
      </div>
      <div class="ledger-list">
        ${ledgerRowsHtml}
      </div>
    </div>
  `;
}

// --- TAB 4: SUMMARY (REVIEW) ---
let summaryDraftText = '';
let lastSummaryMember = '';
let copyFeedbackVisible = false;

function getSummaryRoster(team) {
  if (team && team.contract && Array.isArray(team.contract.assignments) && team.contract.assignments.length > 0) {
    const seen = new Set();
    const list = [];
    team.contract.assignments.forEach((a) => {
      const clean = (a.member || '').trim();
      if (clean && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        list.push(clean);
      }
    });
    if (list.length > 0) return list;
  }

  return (team?.members || [])
    .map((m) => (m.name || '').trim())
    .filter(Boolean);
}

function syncSummaryComposer(memberCode) {
  const team = getActiveTeam();
  if (!team.memberSummaries) team.memberSummaries = {};
  if (!memberCode) return;

  if (lastSummaryMember !== memberCode) {
    lastSummaryMember = memberCode;
    summaryDraftText = team.memberSummaries[memberCode] || '';
  }
}

function onSummaryIdentityChange(val) {
  selectedIdentityMember = val;
  lastComposerMember = '';
  lastSummaryMember = '';
  copyFeedbackVisible = false;
  syncSummaryComposer(val);
  if (typeof renderDeadNoteTab === 'function') {
    renderDeadNoteTab();
  }
  renderSummary();
}

function saveMyPartSummary() {
  const team = getActiveTeam();
  const roster = getSummaryRoster(team);
  const activePerson = selectedIdentityMember || roster[0];
  if (!activePerson) return;

  const textarea = document.getElementById('myPartTextarea');
  const text = (textarea ? textarea.value : summaryDraftText).trim();

  if (!team.memberSummaries) team.memberSummaries = {};
  team.memberSummaries[activePerson] = text;
  summaryDraftText = text;
  lastSummaryMember = activePerson;
  copyFeedbackVisible = false;

  if (typeof saveStore === 'function') {
    saveStore();
  }
  renderSummary();
}

function copyAllPartsSummary() {
  const team = getActiveTeam();
  const roster = getSummaryRoster(team);

  const lines = roster.map((code) => {
    const assign = team.contract?.assignments?.find((a) => (a.member || '').trim() === code);
    const partLabel = assign?.part ? ` (${assign.part})` : '';
    const note = (team.memberSummaries?.[code] || '').trim() || 'Not written yet';
    return `${code}${partLabel}: ${note}`;
  });

  const fullText = lines.join('\n');
  if (fullText && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullText).catch(() => {});
  }

  copyFeedbackVisible = true;
  renderSummary();
}

function renderSummary() {
  const team = typeof getActiveTeam === 'function' ? getActiveTeam() : null;
  const container = document.getElementById('summaryBody');
  if (!team || !container) return;

  const roster = getSummaryRoster(team);
  if (!team.memberSummaries) team.memberSummaries = {};

  const currentPerson = selectedIdentityMember || roster[0] || '';
  syncSummaryComposer(currentPerson);

  const writtenCount = roster.filter((code) => Boolean((team.memberSummaries[code] || '').trim())).length;
  const totalCount = roster.length;
  const allWritten = totalCount > 0 && writtenCount === totalCount;

  const identityOptionsHtml = roster.map((code) =>
    `<option value="${escapeAttr(code)}" ${code === currentPerson ? 'selected' : ''}>${escapeHtml(code)}</option>`
  ).join('');

  const partsListHtml = roster.length > 0
    ? roster.map((code) => {
        const assign = team.contract?.assignments?.find((a) => (a.member || '').trim() === code);
        const partSubtitle = assign?.part || 'Team member';
        const savedNote = (team.memberSummaries[code] || '').trim();
        const isWritten = Boolean(savedNote);

        return `
          <div class="part-entry-card">
            <div class="part-entry-main">
              <div class="part-entry-name">${escapeHtml(code)}</div>
              <div class="part-entry-role">${escapeHtml(partSubtitle)}</div>
              ${isWritten ? `<p class="part-entry-text">${escapeHtml(savedNote)}</p>` : ''}
            </div>
            <span class="part-status-badge ${isWritten ? 'written' : 'missing'}">
              ${isWritten ? '✓ Written' : '🕒 Missing'}
            </span>
          </div>
        `;
      }).join('')
    : '<p style="color:#64748b;font-size:14px;margin:0;">Add members or write a contract first to see everyone\'s parts.</p>';

  const compiledPartsHtml = roster.length > 0
    ? roster.map((code) => {
        const assign = team.contract?.assignments?.find((a) => (a.member || '').trim() === code);
        const note = (team.memberSummaries[code] || '').trim();
        return `
          <div style="margin-bottom:6px;overflow-wrap:anywhere;">
            <strong>${escapeHtml(code)}</strong>${assign?.part ? ` <span style="color:#64748b;">(${escapeHtml(assign.part)})</span>` : ''}:
            ${note ? escapeHtml(note) : '<span style="color:#94a3b8;">Not written yet</span>'}
          </div>
        `;
      }).join('')
    : '<p style="margin:0;color:#64748b;">No summary entries yet.</p>';

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="review-card-header">
        <div>
          <div class="step-kicker">STEP 4 · REVIEW</div>
          <h2 class="section-title" style="margin-bottom:4px;">My part</h2>
        </div>
        <div class="board-you-are">
          <label class="you-are-label" for="summaryYouAreSelect" style="font-size:14px;">You are</label>
          <select id="summaryYouAreSelect" class="who-select" style="padding:7px 12px;min-width:96px;" onchange="onSummaryIdentityChange(this.value)">
            ${identityOptionsHtml}
          </select>
        </div>
      </div>

      <p class="section-sub" style="margin-top:8px;margin-bottom:12px;">
        In 2–4 sentences: what you made and the key point the team must be able to explain.<br>
        <span style="font-size:13px;color:#64748b;">เขียนสั้น ๆ ว่าทำส่วนไหน และประเด็นสำคัญที่ทุกคนต้องอธิบายได้</span>
      </p>

      <textarea
        id="myPartTextarea"
        class="composer-textarea"
        style="min-height:96px;margin-bottom:12px;"
        placeholder="e.g. Built slides 6–10 and explained why unclear roles and invisible progress were merged."
        oninput="summaryDraftText = this.value"
      >${escapeHtml(summaryDraftText)}</textarea>

      <button type="button" class="post-status-btn" onclick="saveMyPartSummary()">Save my part</button>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="review-card-header">
        <h3 class="subcard-heading" style="margin:0;">Everyone's parts</h3>
        <span class="written-count-pill ${allWritten ? 'complete' : ''}">${writtenCount} of ${totalCount} written</span>
      </div>

      <div class="parts-status-list">
        ${partsListHtml}
      </div>
    </div>

    <div class="card" style="margin-bottom:0;">
      <h3 class="subcard-heading" style="margin:0 0 6px;">One-page summary</h3>
      <p class="section-sub" style="margin-bottom:0;">
        Before you present, everyone reads the same one page about the whole project.<br>
        <span style="font-size:13px;color:#64748b;">ก่อนนำเสนอ ทุกคนอ่านสรุปหน้าเดียวกัน เข้าใจงานทั้งหมด</span>
      </p>

      <div class="onepage-compiled-box">
        ${compiledPartsHtml}
      </div>

      <div class="summary-action-row">
        <button type="button" class="secondary-btn" onclick="copyAllPartsSummary()">Copy all parts</button>
        ${copyFeedbackVisible ? `<span class="copy-toast-text">Copied all parts ✓</span>` : ''}
      </div>
    </div>
  `;
}

if (typeof renderAll === 'function') {
  renderAll();
} else {
  renderSummary();
}

renderDeadNoteTab();