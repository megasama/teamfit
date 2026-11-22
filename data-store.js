const STORAGE_KEY = 'teamfit_teams_mockup_v4';
const DEFAULT_TEAM_ID = 'int33-10';

const ROLE_SLOTS = [
  { key: 'timekeeper', label: 'Timekeeper', trait: 'Planner', scoreLabel: 'best Planner score' },
  { key: 'captain', label: 'Captain', trait: 'Starter', scoreLabel: 'best Starter score' },
  { key: 'brainstorm', label: 'Brainstorm lead', trait: 'Idea Maker', scoreLabel: 'best Idea Maker score' },
  { key: 'integrator', label: 'Integrator', trait: 'Finisher', scoreLabel: 'best Finisher score' }
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const QUIZ_DATA = [
  {
    num: 1,
    type: 'grid2',
    en: 'A new group project is announced. What do you do first?',
    th: 'งานกลุ่มใหม่ประกาศมา คุณทำอะไรก่อน',
    options: [
      { en: 'Throw out ideas for what we could make', th: 'โยนไอเดียว่าเราทำอะไรได้บ้าง', role: 'Idea Maker' },
      { en: 'Read the brief and rubric carefully', th: 'อ่านโจทย์และเกณฑ์ให้ละเอียด', role: 'Finisher' },
      { en: 'Make a timeline and split the work', th: 'ทำไทม์ไลน์และแบ่งงาน', role: 'Planner' },
      { en: 'Start working on something right away', th: 'ลงมือทำบางอย่างทันที', role: 'Starter' }
    ]
  },
  {
    num: 2,
    type: 'grid2',
    en: 'In a team meeting, you usually...',
    th: 'ในการประชุมทีม คุณมักจะ...',
    options: [
      { en: 'Suggest new or unusual ideas', th: 'เสนอไอเดียใหม่ ๆ แปลก ๆ', role: 'Idea Maker' },
      { en: 'Spot gaps and mistakes', th: 'มองหาช่องโหว่และจุดผิด', role: 'Finisher' },
      { en: 'Keep the agenda and the time', th: 'คุมวาระและเวลา', role: 'Planner' },
      { en: 'Push the team to decide and act', th: 'ผลักให้ทีมตัดสินใจและลงมือ', role: 'Starter' }
    ]
  },
  {
    num: 3,
    type: 'grid2',
    en: 'Two days before the deadline, you are...',
    th: 'สองวันก่อนส่งงาน คุณ...',
    options: [
      { en: 'Already done and checking the plan', th: 'ทำเสร็จแล้ว กำลังเช็กตามแผน', role: 'Planner' },
      { en: 'Polishing format and details', th: 'เก็บรายละเอียดและรูปแบบ', role: 'Finisher' },
      { en: 'Wanting to add one more idea', th: 'ยังอยากเพิ่มอีกหนึ่งไอเดีย', role: 'Idea Maker' },
      { en: 'Still sprinting to finish', th: 'ยังเร่งทำให้เสร็จ', role: 'Starter' }
    ]
  },
  {
    num: 4,
    type: 'grid2',
    en: 'Which task do you enjoy most?',
    th: 'คุณชอบงานแบบไหนที่สุด',
    options: [
      { en: 'Editing, merging and checking', th: 'แก้ไข รวมงาน ตรวจทาน', role: 'Finisher' },
      { en: 'Schedules and task boards', th: 'ทำตารางงานและบอร์ดงาน', role: 'Planner' },
      { en: 'Brainstorming the concept', th: 'ระดมไอเดียและคอนเซปต์', role: 'Idea Maker' },
      { en: 'Building the first draft', th: 'ทำร่างแรก', role: 'Starter' }
    ]
  },
  {
    num: 5,
    type: 'grid2',
    en: 'What stresses you most in group work?',
    th: 'อะไรทำให้คุณเครียดที่สุดในงานกลุ่ม',
    options: [
      { en: 'Being told to just follow', th: 'ถูกสั่งให้ทำตามอย่างเดียว', role: 'Idea Maker' },
      { en: 'There is no plan', th: 'ไม่มีแผน', role: 'Planner' },
      { en: 'Messy, low-quality work', th: 'งานรก คุณภาพต่ำ', role: 'Finisher' },
      { en: 'Endless talk and no action', th: 'คุยไม่จบ ไม่ลงมือสักที', role: 'Starter' }
    ]
  },
  {
    num: 6,
    type: 'grid2',
    en: 'Your friends would describe you as...',
    th: 'เพื่อน ๆ จะบอกว่าคุณเป็นคน...',
    options: [
      { en: 'Organized', th: 'เป็นระบบ', role: 'Planner' },
      { en: 'Careful', th: 'รอบคอบ', role: 'Finisher' },
      { en: 'Fast', th: 'ไว', role: 'Starter' },
      { en: 'Creative', th: 'ครีเอทีฟ', role: 'Idea Maker' }
    ]
  },
  {
    num: 7,
    type: 'grid2',
    en: 'When the team is stuck, you...',
    th: 'เมื่อทีมติดปัญหา คุณ...',
    options: [
      { en: 'Find exactly what is wrong', th: 'หาให้เจอว่าผิดตรงไหน', role: 'Finisher' },
      { en: 'Try something quickly to see if it works', th: 'ลองทำเร็ว ๆ ดูว่าเวิร์กไหม', role: 'Starter' },
      { en: 'Re-plan and re-assign tasks', th: 'วางแผนใหม่และแบ่งงานใหม่', role: 'Planner' },
      { en: 'Look at the problem from a new angle', th: 'มองปัญหาจากมุมใหม่', role: 'Idea Maker' }
    ]
  },
  {
    num: 8,
    type: 'grid2',
    en: 'Your best contribution to a final presentation?',
    th: 'สิ่งที่คุณช่วยได้ดีที่สุดในงานนำเสนอ',
    options: [
      { en: 'Zero mistakes', th: 'ไม่มีจุดผิด', role: 'Finisher' },
      { en: 'Getting the slides done early', th: 'ทำสไลด์ให้เสร็จเร็ว', role: 'Starter' },
      { en: 'The flow and timing', th: 'ลำดับเรื่องและเวลา', role: 'Planner' },
      { en: 'The big idea', th: 'ไอเดียหลัก', role: 'Idea Maker' }
    ]
  },
  {
    num: 9,
    type: 'grid4',
    en: 'I say it when I disagree with the group.',
    th: 'ฉันพูดออกมาเมื่อไม่เห็นด้วยกับกลุ่ม',
    options: [
      { en: 'Never', th: 'ไม่เคย', score: 0 },
      { en: 'Sometimes', th: 'บางครั้ง', score: 1 },
      { en: 'Often', th: 'บ่อย', score: 2 },
      { en: 'Always', th: 'เสมอ', score: 3 }
    ]
  },
  {
    num: 10,
    type: 'grid4',
    en: 'I tell the team early when I am stuck.',
    th: 'ฉันบอกทีมเร็วเมื่อติดปัญหา',
    options: [
      { en: 'Never', th: 'ไม่เคย', score: 0 },
      { en: 'Sometimes', th: 'บางครั้ง', score: 1 },
      { en: 'Often', th: 'บ่อย', score: 2 },
      { en: 'Always', th: 'เสมอ', score: 3 }
    ]
  }
];

const ROLE_META = {
  Planner: {
    th: 'สายวางแผน',
    color: '#2563eb',
    descEn: 'Maps out timelines, milestones, and clear ownership.',
    descTh: 'วางไทม์ไลน์ ลำดับขั้น และความชัดเจนของคนรับผิดชอบ',
    suggestedRole: 'Timekeeper',
    tip: 'Tip: Leave room for quick pivots when new constraints appear, and check in before locking long timelines.'
  },
  Starter: {
    th: 'สายลุย',
    color: '#16a34a',
    descEn: 'Gets things moving fast. Turns talk into action.',
    descTh: 'ลงมือเร็ว เปลี่ยนการคุยให้เป็นการทำ',
    suggestedRole: 'Captain',
    tip: 'Tip: Check the plan with a Planner before rushing, and ask quiet members before deciding.'
  },
  'Idea Maker': {
    th: 'สายไอเดีย',
    color: '#d97706',
    descEn: 'Brings fresh angles, concepts, and creative possibilities.',
    descTh: 'เติมมุมมองใหม่ คอนเซปต์ และความเป็นไปได้ให้ทีม',
    suggestedRole: 'Brainstorm lead',
    tip: 'Tip: Pair ideas with concrete next steps and pick clear owners so concepts turn into deliverables.'
  },
  Finisher: {
    th: 'สายเก็บงาน',
    color: '#9333ea',
    descEn: 'Spots gaps, aligns quality, and brings work across the finish line.',
    descTh: 'จับจุดพลาด เก็บรายละเอียด และปิดงานให้สมบูรณ์',
    suggestedRole: 'Integrator',
    tip: 'Tip: Share early drafts before polishing everything so teammates have time to adjust.'
  }
};

const ROLE_COLORS = {
  Planner: '#2563eb',
  Starter: '#16a34a',
  'Idea Maker': '#d97706',
  Finisher: '#9333ea'
};

function createInt33SampleData() {
  return {
    members: [
      {
        name: 'S',
        role: 'Finisher',
        secondStyle: 'Planner',
        suggestedRole: 'Timekeeper',
        voice: 'Balanced voice · สมดุล',
        shortVoice: 'Balanced voice',
        voiceScore: 3,
        scores: { Planner: 3, Starter: 0, 'Idea Maker': 0, Finisher: 5 }
      },
      {
        name: 'K',
        role: 'Finisher',
        secondStyle: 'Starter',
        suggestedRole: 'Integrator',
        voice: 'Quiet voice · เงียบ/ฟังเยอะ',
        shortVoice: 'Quiet voice',
        voiceScore: 2,
        scores: { Planner: 0, Starter: 2, 'Idea Maker': 2, Finisher: 4 }
      },
      {
        name: 'P',
        role: 'Starter',
        secondStyle: 'Idea Maker',
        suggestedRole: 'Captain',
        voice: 'Vocal · กล้าพูด',
        shortVoice: 'Vocal',
        voiceScore: 5,
        scores: { Planner: 0, Starter: 3, 'Idea Maker': 3, Finisher: 2 }
      }
    ],
    contract: {
      project: 'TeamFit Demo',
      deadline: '2026-12-06',
      assignments: [
        { member: 'S', part: 'slides 1–5' },
        { member: 'P', part: 'slides 6–10' },
        { member: 'K', part: 'slides 11–15' }
      ],
      rhythm: 'two_days_week',
      weeklyDays: ['Wed', 'Sat'],
      startDate: '2026-11-25',
      postBy: '20:00',
      stakeAfter: '2 ghost marks',
      funStake: 'Buy the team bubble tea',
      agreedMembers: ['S', 'K']
    },
    checkins: [
      {
        id: 1,
        member: 'S',
        status: 'on_track',
        note: 'Completed problem framing and 5 Whys slides',
        doneNote: 'Completed problem framing and 5 Whys slides',
        blockedNote: '',
        helpNote: '',
        helpers: [],
        ghosts: 0
      },
      {
        id: 2,
        member: 'P',
        status: 'not_yet',
        note: '',
        doneNote: '',
        blockedNote: '',
        helpNote: '',
        helpers: [],
        ghosts: 0
      },
      {
        id: 3,
        member: 'K',
        status: 'on_track',
        note: 'Finished Team DNA demo & video timeline',
        doneNote: 'Finished Team DNA demo & video timeline',
        blockedNote: '',
        helpNote: '',
        helpers: [],
        ghosts: 0
      }
    ],
    memberSummaries: {
      S: '',
      P: '',
      K: ''
    },
    aiSummaryGenerated: false
  };
}

function createEmptyTeamData() {
  return {
    members: [],
    contract: null,
    checkins: [],
    memberSummaries: {},
    aiSummaryGenerated: false
  };
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.teams && parsed.activeTeamId) {
        return parsed;
      }
    }
  } catch {}

  return {
    activeTeamId: DEFAULT_TEAM_ID,
    teams: {
      [DEFAULT_TEAM_ID]: {
        name: 'Int33-10',
        ...createInt33SampleData()
      }
    }
  };
}

let store = loadStore();

function saveStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function getActiveTeam() {
  if (!store.teams[store.activeTeamId]) {
    const firstId = Object.keys(store.teams)[0] || DEFAULT_TEAM_ID;
    if (!store.teams[firstId]) {
      store.teams[firstId] = { name: 'Int33-10', ...createEmptyTeamData() };
    }
    store.activeTeamId = firstId;
  }
  return store.teams[store.activeTeamId];
}

function renderTeamSwitcher() {
  const select = document.getElementById('teamSelect');
  const ids = Object.keys(store.teams);
  select.innerHTML = ids.map((id) => {
    const t = store.teams[id];
    return `<option value="${escapeAttr(id)}" ${id === store.activeTeamId ? 'selected' : ''}>Team: ${escapeHtml(t.name)}</option>`;
  }).join('');
}

function createNewTeam() {
  const inputName = prompt('ตั้งชื่อทีมใหม่ (เช่น Instructor Demo หรือ Group B):', 'Instructor Demo');
  if (inputName === null) return;
  const cleanName = inputName.trim() || `Team ${Object.keys(store.teams).length + 1}`;
  const id = `team_${Date.now()}`;
  store.teams[id] = {
    name: cleanName,
    ...createEmptyTeamData()
  };
  store.activeTeamId = id;
  if (typeof resetDeadNoteState === 'function') resetDeadNoteState();
  saveStore();
  clearQuizDraft();
  renderTeamSwitcher();
  renderAll();
  switchTab('quiz');
}

function switchTeam(teamId) {
  if (!store.teams[teamId]) return;
  store.activeTeamId = teamId;
  if (typeof resetDeadNoteState === 'function') resetDeadNoteState();
  saveStore();
  clearQuizDraft();
  renderTeamSwitcher();
  renderAll();
}

function seedCurrentTeam() {
  const team = getActiveTeam();
  const seeded = createInt33SampleData();
  team.members = seeded.members;
  team.contract = seeded.contract;
  team.checkins = seeded.checkins;
  if (typeof resetDeadNoteState === 'function') resetDeadNoteState();
  saveStore();
  renderAll();
}

function resetCurrentTeam() {
  const team = getActiveTeam();
  team.members = [];
  team.contract = null;
  team.checkins = [];
  if (typeof resetDeadNoteState === 'function') resetDeadNoteState();
  saveStore();
  clearQuizDraft();
  renderAll();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}