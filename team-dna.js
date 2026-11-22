const selectedAnswers = {};
let latestResult = null;

function clearQuizDraft() {
  Object.keys(selectedAnswers).forEach((k) => delete selectedAnswers[k]);
  latestResult = null;
  document.getElementById('userName').value = '';
  document.querySelectorAll('.option-card, .option-card-scale').forEach((el) => {
    el.classList.remove('selected');
    const radio = el.querySelector('input[type="radio"]');
    if (radio) radio.checked = false;
  });
  const resultCard = document.getElementById('quizResultCard');
  if (resultCard) {
    resultCard.style.display = 'none';
    resultCard.innerHTML = '';
  }
  updateQuizStatus();
}

function renderQuiz() {
  const container = document.getElementById('quizQuestionsContainer');
  container.innerHTML = QUIZ_DATA.map((q) => {
    const isScale = q.type === 'grid4';
    const gridClass = isScale ? 'options-grid-4' : 'options-grid-2';
    const cardClass = isScale ? 'option-card-scale' : 'option-card';

    const optionsHtml = q.options.map((opt, idx) => `
      <label class="${cardClass}" id="opt_${q.num}_${idx}" onclick="selectOption(${q.num}, ${idx})">
        <input type="radio" name="question_${q.num}" value="${idx}" />
        <div class="opt-text-wrap">
          <span class="opt-en">${opt.en}</span>
          <span class="opt-th">${opt.th}</span>
        </div>
      </label>
    `).join('');

    return `
      <div class="question-block">
        <h2 class="q-header-en"><span class="q-num">${q.num}</span> ${q.en}</h2>
        <p class="q-header-th">${q.th}</p>
        <div class="${gridClass}">
          ${optionsHtml}
        </div>
      </div>
    `;
  }).join('');
}

function selectOption(qNum, optIdx) {
  selectedAnswers[qNum] = optIdx;
  const qObj = QUIZ_DATA.find((item) => item.num === qNum);
  qObj.options.forEach((_, i) => {
    const el = document.getElementById(`opt_${qNum}_${i}`);
    if (el) {
      el.classList.toggle('selected', i === optIdx);
      const radio = el.querySelector('input[type="radio"]');
      if (radio) radio.checked = (i === optIdx);
    }
  });
  updateQuizStatus();
}

function updateQuizStatus() {
  const answeredCount = Object.keys(selectedAnswers).length;
  const left = QUIZ_DATA.length - answeredCount;
  const nameVal = document.getElementById('userName').value.trim();
  const btn = document.getElementById('seeResultBtn');
  const label = document.getElementById('remainingLabel');

  if (left > 0) {
    label.textContent = `${left} question(s) left · เหลืออีก ${left} ข้อ`;
  } else if (!nameVal) {
    label.textContent = 'Enter your name or code · กรอกชื่อหรือโค้ดของคุณ';
  } else {
    label.textContent = 'Ready · พร้อมดูผลลัพธ์';
  }

  const isReady = (left === 0 && nameVal.length > 0);
  btn.disabled = !isReady;
  btn.classList.toggle('ready', isReady);
}

function classifyVoice(voiceScore) {
  if (voiceScore >= 4) return 'Vocal · กล้าพูด';
  if (voiceScore >= 2) return 'Balanced voice · สมดุล';
  return 'Quiet voice · เงียบ/ฟังเยอะ';
}

function classifyShortVoice(voiceScore) {
  if (voiceScore >= 4) return 'Vocal';
  if (voiceScore >= 2) return 'Balanced voice';
  return 'Quiet voice';
}

function rankRoles(scores) {
  const order = ['Planner', 'Starter', 'Idea Maker', 'Finisher'];
  return [...order].sort((a, b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a];
    return order.indexOf(a) - order.indexOf(b);
  });
}

function computeRole(scores) {
  return rankRoles(scores)[0] || 'Planner';
}

function renderQuizResultCard(record) {
  const card = document.getElementById('quizResultCard');
  if (!card || !record) return;

  const meta = ROLE_META[record.role] || ROLE_META.Planner;
  const roles = ['Planner', 'Starter', 'Idea Maker', 'Finisher'];
  const maxScore = Math.max(5, ...roles.map((r) => record.scores[r] || 0));

  const barsHtml = roles.map((r) => {
    const val = record.scores[r] || 0;
    const pct = Math.min(100, (val / maxScore) * 100);
    return `
      <div class="score-line">
        <span class="score-label">${r}</span>
        <div class="score-track">
          <div class="score-fill" style="width:${pct}%;background:${ROLE_COLORS[r]};"></div>
        </div>
        <span class="score-val">${val}</span>
      </div>
    `;
  }).join('');

  card.innerHTML = `
    <p class="result-intro">${escapeHtml(record.name)}, your TeamFit type is</p>
    <div class="result-type-row">
      <span class="result-type-dot" style="background:${meta.color};"></span>
      <h3 class="result-type-title">${escapeHtml(record.role)} <span class="result-type-th">${escapeHtml(meta.th)}</span></h3>
    </div>
    <p class="result-desc-en">${escapeHtml(meta.descEn)}</p>
    <p class="result-desc-th">${escapeHtml(meta.descTh)}</p>

    <div class="pill-row">
      <span class="info-pill">Suggested role: ${escapeHtml(record.suggestedRole)}</span>
      <span class="info-pill">2nd style: ${escapeHtml(record.secondStyle)}</span>
      <span class="info-pill">${escapeHtml(record.voice)}</span>
    </div>

    <div class="score-bars-wrap">
      ${barsHtml}
    </div>

    <p class="result-tip">${escapeHtml(meta.tip)}</p>
    <p class="result-disclaimer-en">Your type is a starting point for talking with your team, not a label.</p>
    <p class="result-disclaimer-th">ผลนี้เป็นจุดเริ่มคุยกับทีม ไม่ใช่การตัดสินตัวตน</p>

    <button type="button" class="saved-banner" onclick="switchTab('dna')">
      <span class="saved-banner-en">Saved to your team board. Open <strong>Team DNA</strong> to see everyone.</span>
      <span class="saved-banner-th">บันทึกแล้ว ดูของทั้งทีมที่แท็บ Team DNA</span>
    </button>
  `;

  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handleSeeResult() {
  const nameInput = document.getElementById('userName');
  const name = nameInput.value.trim();
  if (!name || Object.keys(selectedAnswers).length < QUIZ_DATA.length) return;

  const scores = { Planner: 0, Starter: 0, 'Idea Maker': 0, Finisher: 0 };
  for (let qNum = 1; qNum <= 8; qNum++) {
    const qObj = QUIZ_DATA.find((item) => item.num === qNum);
    const opt = qObj.options[selectedAnswers[qNum]];
    if (opt && opt.role && scores[opt.role] !== undefined) {
      scores[opt.role] += 1;
    }
  }

  const q9 = QUIZ_DATA[8].options[selectedAnswers[9]]?.score ?? 0;
  const q10 = QUIZ_DATA[9].options[selectedAnswers[10]]?.score ?? 0;
  const voiceScore = q9 + q10;

  const ranked = rankRoles(scores);
  const primaryRole = ranked[0];
  const secondStyle = ranked[1];
  const meta = ROLE_META[primaryRole] || ROLE_META.Planner;

  const memberRecord = {
    name,
    role: primaryRole,
    secondStyle,
    suggestedRole: meta.suggestedRole,
    voice: classifyVoice(voiceScore),
    shortVoice: classifyShortVoice(voiceScore),
    voiceScore,
    scores
  };

  const team = getActiveTeam();
  const idx = team.members.findIndex((m) => m.name.toLowerCase() === name.toLowerCase());
  if (idx >= 0) {
    team.members[idx] = memberRecord;
  } else {
    team.members.push(memberRecord);
  }

  latestResult = memberRecord;
  saveStore();
  renderAll();
  renderQuizResultCard(memberRecord);
}

function removeMember(nameToRemove) {
  const team = getActiveTeam();
  team.members = team.members.filter((m) => m.name !== nameToRemove);
  saveStore();
  renderAll();
}

function getShortVoiceLabel(m) {
  return m.shortVoice || (m.voice ? m.voice.split(' · ')[0] : 'Balanced voice');
}

function pickTopForTrait(members, trait) {
  if (!members || members.length === 0) {
    return { names: [], maxScore: 0 };
  }
  let maxScore = 0;
  members.forEach((m) => {
    const val = m.scores?.[trait] ?? 0;
    if (val > maxScore) maxScore = val;
  });
  if (maxScore <= 0) {
    return { names: [], maxScore: 0 };
  }
  const names = members
    .filter((m) => (m.scores?.[trait] ?? 0) === maxScore)
    .map((m) => m.name);
  return { names, maxScore };
}

function computeEveryoneAssignedRoles(members) {
  const slots = ROLE_SLOTS.map((s) => ({
    ...s,
    assignees: [],
    bestScore: 0
  }));

  if (!members || members.length === 0) {
    return { slots, notes: [] };
  }

  const notes = [];

  slots.forEach((slot) => {
    let maxVal = 0;
    members.forEach((m) => {
      const val = m.scores?.[slot.trait] ?? 0;
      if (val > maxVal) maxVal = val;
    });
    slot.bestScore = maxVal;
    if (maxVal > 0) {
      members.forEach((m) => {
        if ((m.scores?.[slot.trait] ?? 0) === maxVal) {
          slot.assignees.push({ member: m, mode: 'primary' });
        }
      });
    }
  });

  const getMemberSlots = (memberName) =>
    slots.filter((s) => s.assignees.some((a) => a.member.name === memberName));

  const hasAssignee = (slot, memberName) =>
    slot.assignees.some((a) => a.member.name === memberName);

  const orphans = members.filter((m) => getMemberSlots(m.name).length === 0);

  orphans.forEach((orphan) => {
    const rankedTraits = rankRoles(orphan.scores || {});
    const emptySlots = slots.filter((s) => s.assignees.length === 0);
    let placed = false;

    if (emptySlots.length > 0) {
      for (const candidate of members) {
        const currentSlots = getMemberSlots(candidate.name);
        if (currentSlots.length === 0) continue;

        const matchingEmpty = emptySlots.find((es) => {
          const candScoreInEmpty = candidate.scores?.[es.trait] ?? 0;
          const isSecondary = candidate.secondStyle === es.trait;
          return candScoreInEmpty > 0 || isSecondary;
        });

        if (matchingEmpty) {
          const targetFreedSlot = currentSlots.find((cs) => (orphan.scores?.[cs.trait] ?? 0) > 0) || currentSlots[0];
          targetFreedSlot.assignees = targetFreedSlot.assignees.filter((a) => a.member.name !== candidate.name);
          if (!hasAssignee(matchingEmpty, candidate.name)) {
            matchingEmpty.assignees.push({ member: candidate, mode: 'moved' });
          }
          if (!hasAssignee(targetFreedSlot, orphan.name)) {
            targetFreedSlot.assignees.push({ member: orphan, mode: 'rescued' });
          }
          notes.push(
            `Moved ${candidate.name} to ${matchingEmpty.label} so ${orphan.name} could step into ${targetFreedSlot.label}.`
          );
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      const bestTrait = rankedTraits[0];
      const targetSlot = slots.find((s) => s.trait === bestTrait) || slots[0];
      if (!hasAssignee(targetSlot, orphan.name)) {
        targetSlot.assignees.push({ member: orphan, mode: 'rescued' });
      }
      const sc = orphan.scores?.[targetSlot.trait] ?? 0;
      notes.push(
        `Assigned ${orphan.name} to ${targetSlot.label} (${targetSlot.trait} score: ${sc}) so every member has a clear role.`
      );
    }
  });

  slots.forEach((slot) => {
    if (slot.assignees.length === 0) {
      const sortedCandidates = [...members].sort((a, b) => {
        const loadDiff = getMemberSlots(a.name).length - getMemberSlots(b.name).length;
        if (loadDiff !== 0) return loadDiff;
        return (b.scores?.[slot.trait] ?? 0) - (a.scores?.[slot.trait] ?? 0);
      });
      const picked = sortedCandidates[0];
      if (picked && !hasAssignee(slot, picked.name)) {
        slot.assignees.push({ member: picked, mode: 'fill' });
      }
    }
  });

  return { slots, notes };
}

function renderSuggestedRoles(members) {
  const listEl = document.getElementById('suggestedRolesList');
  if (!listEl) return;

  if (!members || members.length === 0) {
    listEl.innerHTML = ROLE_SLOTS.map((s) =>
      `<li><span class="suggested-role-name">${escapeHtml(s.label)}:</span> <span class="suggested-muted">nobody yet · pick a volunteer</span></li>`
    ).join('');
    return;
  }

  const { slots, notes } = computeEveryoneAssignedRoles(members);

  const itemsHtml = slots.map((slot) => {
    if (!slot.assignees.length) {
      return `<li><span class="suggested-role-name">${escapeHtml(slot.label)}:</span> <span class="suggested-muted">nobody yet · pick a volunteer</span></li>`;
    }

    const formattedPeople = slot.assignees.map(({ member, mode }) => {
      const traitVal = member.scores?.[slot.trait] ?? 0;
      let badge = '';
      if (mode === 'primary' && slot.bestScore > 0) {
        badge = `<span class="suggested-tag">(${escapeHtml(slot.scoreLabel)}: ${traitVal})</span>`;
      } else if (mode === 'rescued') {
        badge = `<span class="suggested-tag rescued">(assigned · ${escapeHtml(slot.trait)}: ${traitVal})</span>`;
      } else if (mode === 'moved') {
        badge = `<span class="suggested-tag moved">(shifted for balance · ${escapeHtml(slot.trait)}: ${traitVal})</span>`;
      } else if (mode === 'fill') {
        badge = `<span class="suggested-tag">(covered slot)</span>`;
      }
      return `${escapeHtml(member.name)} ${badge}`;
    }).join(', ');

    return `<li><span class="suggested-role-name">${escapeHtml(slot.label)}:</span> ${formattedPeople}</li>`;
  });

  if (notes.length > 0) {
    itemsHtml.push(
      `<li style="list-style:none;margin-left:-12px;margin-top:4px;font-size:12.5px;color:#475569;"><strong>Balance note:</strong> ${escapeHtml(notes.join(' '))}</li>`
    );
  }

  listEl.innerHTML = itemsHtml.join('');
}

function renderWhatToWatch(members) {
  const watchList = document.getElementById('whatToWatchList');
  if (!watchList) return;

  if (!members || members.length === 0) {
    watchList.innerHTML = `
      <div class="watch-item">
        <div class="watch-tag-row">
          <span class="watch-badge">Team Check</span>
        </div>
        <p class="watch-en"><strong>Waiting for team data:</strong> Have each member complete the quiz to analyze role gaps, workload overlaps, and communication styles.</p>
        <p class="watch-th">ยังไม่มีข้อมูลสมาชิกในทีม ให้สมาชิกแต่ละคนทำแบบทดสอบก่อน เพื่อวิเคราะห์จุดบอดของบทบาทและสไตล์การสื่อสาร</p>
      </div>
    `;
    return;
  }

  const byRole = {
    Planner: members.filter((m) => m.role === 'Planner'),
    Starter: members.filter((m) => m.role === 'Starter'),
    'Idea Maker': members.filter((m) => m.role === 'Idea Maker'),
    Finisher: members.filter((m) => m.role === 'Finisher')
  };

  const alerts = [];

  if (byRole.Planner.length === 0) {
    const bestBackup = pickTopForTrait(members, 'Planner');
    const backupHintEn = bestBackup.names.length
      ? ` Assign ${bestBackup.names.join(', ')} (highest Planner score: ${bestBackup.maxScore}) as Timekeeper and set internal deadlines 2 days early.`
      : ' Pick a Timekeeper and set internal deadlines 2 days early.';
    const backupHintTh = bestBackup.names.length
      ? ` แนะนำให้ ${bestBackup.names.join(', ')} (คะแนน Planner สูงสุด: ${bestBackup.maxScore}) รับหน้าที่ Timekeeper และตั้งเดดไลน์ภายในล่วงหน้า 2 วัน`
      : ' เลือก Timekeeper และตั้งเดดไลน์ภายในล่วงหน้า 2 วัน';

    alerts.push({
      type: 'role-gap',
      badge: 'Role Gap · Missing Planner',
      membersLabel: `0 / ${members.length} primary Planner`,
      en: `<strong>No primary Planner:</strong> Work may pile up near the final deadline without clear milestones.${backupHintEn}`,
      th: `ไม่มี Planner เป็นสายหลัก เสี่ยงงานกองช่วงท้ายเพราะขาดตารางกลาง${backupHintTh}`
    });
  }

  if (byRole['Idea Maker'].length === 0) {
    const bestIdeaBackup = pickTopForTrait(members, 'Idea Maker');
    const ideaHintEn = bestIdeaBackup.names.length
      ? ` Run a 10-minute silent brainstorm first, then let ${bestIdeaBackup.names.join(', ')} (Idea Maker score: ${bestIdeaBackup.maxScore}) group concepts before locking scope.`
      : ' Run a 10-minute silent brainstorm so everyone adds ideas before picking one.';
    const ideaHintTh = bestIdeaBackup.names.length
      ? ` เริ่มประชุมด้วย brainstorm แบบเงียบ 10 นาที แล้วให้ ${bestIdeaBackup.names.join(', ')} (คะแนน Idea Maker: ${bestIdeaBackup.maxScore}) ช่วยสรุปแนวคิดก่อนลงมือ`
      : ' ทำ brainstorm แบบเงียบ 10 นาทีให้ทุกคนเขียนไอเดียก่อนตัดสินใจ';

    alerts.push({
      type: 'role-gap',
      badge: 'Role Gap · Missing Idea Maker',
      membersLabel: `0 / ${members.length} primary Idea Maker`,
      en: `<strong>No primary Idea Maker:</strong> The team may jump straight into execution with a narrow concept.${ideaHintEn}`,
      th: `ไม่มี Idea Maker เป็นสายหลัก ทีมอาจรีบลงมือทำโดยยังไม่สำรวจทางเลือกอื่น${ideaHintTh}`
    });
  }

  if (byRole.Starter.length === 0) {
    alerts.push({
      type: 'role-gap',
      badge: 'Role Gap · Missing Starter',
      membersLabel: `0 / ${members.length} primary Starter`,
      en: `<strong>No primary Starter:</strong> Discussions and planning may run too long before anyone builds a first draft. Commit to a 24-hour prototype rule in DeadNote.`,
      th: `ไม่มี Starter เป็นสายหลัก ทีมอาจคุยหรือวางแผนเพลินจนเริ่มร่างแรกช้า ควรกำหนดเวลาส่งร่างแรกใน DeadNote ให้ชัด`
    });
  }

  if (byRole.Finisher.length === 0) {
    alerts.push({
      type: 'role-gap',
      badge: 'Role Gap · Missing Finisher',
      membersLabel: `0 / ${members.length} primary Finisher`,
      en: `<strong>No primary Finisher:</strong> Formatting mismatches and rubric gaps may slip through at the end. Reserve a dedicated review slot 1 day before submission.`,
      th: `ไม่มี Finisher เป็นสายหลัก เสี่ยงตกหล่นรายละเอียดและเกณฑ์ให้คะแนน ควรกันเวลาตรวจรวมงานอย่างน้อย 1 วันก่อนส่ง`
    });
  }

  Object.entries(byRole).forEach(([roleName, group]) => {
    if (group.length >= 2) {
      const namesStr = group.map((m) => m.name).join(', ');
      if (roleName === 'Finisher') {
        alerts.push({
          type: 'overlap',
          badge: 'Role Overlap · Multiple Finishers',
          membersLabel: namesStr,
          en: `<strong>${group.length} Finishers (${namesStr}):</strong> Strong quality control, but risk over-polishing minor details or duplicating edits. Split review ownership (e.g. content vs. formatting/integration).`,
          th: `มี Finisher ${group.length} คน (${namesStr}) งานจะละเอียดรอบคอบ แต่ระวังแก้ซ้ำซ้อนหรือติดจุดเล็ก ๆ จนช้า ควรแบ่งหน้าที่ตรวจคนละส่วนให้ชัด`
        });
      } else if (roleName === 'Starter') {
        alerts.push({
          type: 'overlap',
          badge: 'Role Overlap · Multiple Starters',
          membersLabel: namesStr,
          en: `<strong>${group.length} Starters (${namesStr}):</strong> High execution speed, but members may build in parallel without aligning direction first. Sync on scope before sprinting.`,
          th: `มี Starter ${group.length} คน (${namesStr}) ลงมือไวมาก แต่ระวังต่างคนต่างรีบทำจนงานไปคนละทาง ควรตกลงขอบเขตงานก่อนแยกกันทำ`
        });
      } else if (roleName === 'Planner') {
        alerts.push({
          type: 'overlap',
          badge: 'Role Overlap · Multiple Planners',
          membersLabel: namesStr,
          en: `<strong>${group.length} Planners (${namesStr}):</strong> Clear structure, but avoid spending too much time debating schedules. Pick one Timekeeper to own the master timeline.`,
          th: `มี Planner ${group.length} คน (${namesStr}) โครงสร้างชัด แต่ระวังเสียเวลาจัดตารางซ้ำซ้อน ให้เลือก Timekeeper หลักเพียงคนเดียวดูแลไทม์ไลน์รวม`
        });
      } else if (roleName === 'Idea Maker') {
        alerts.push({
          type: 'overlap',
          badge: 'Role Overlap · Multiple Idea Makers',
          membersLabel: namesStr,
          en: `<strong>${group.length} Idea Makers (${namesStr}):</strong> Plenty of creative options, but risk scope creep late in the project. Set a feature freeze deadline in DeadNote.`,
          th: `มี Idea Maker ${group.length} คน (${namesStr}) ไอเดียเยอะ แต่ระวังเปลี่ยนแนวหรือเพิ่มไอเดียใหม่ช่วงท้าย ควรกำหนดวันปิดรับไอเดียเพิ่มใน DeadNote`
        });
      }
    }
  });

  const vocalMembers = members.filter((m) => getShortVoiceLabel(m) === 'Vocal');
  const quietMembers = members.filter((m) => getShortVoiceLabel(m) === 'Quiet voice');

  if (vocalMembers.length > 0 && quietMembers.length > 0) {
    const vocalNames = vocalMembers.map((m) => m.name).join(', ');
    const quietNames = quietMembers.map((m) => m.name).join(', ');
    alerts.push({
      type: 'voice',
      badge: 'Voice Dynamics · Vocal vs. Quiet',
      membersLabel: `Vocal: ${vocalNames} · Quiet: ${quietNames}`,
      en: `<strong>Voice contrast (${vocalNames} vs. ${quietNames}):</strong> Fast speakers may unintentionally steer decisions before quieter members weigh in. Do a quick round-robin check with ${quietNames} before locking choices.`,
      th: `ความต่างสไตล์การพูด (${vocalNames} พูดนำเร็ว ส่วน ${quietNames} ฟังและคิดก่อนพูด) ระวังตัดสินใจเร็วเกินไปจนคนเงียบยังไม่ได้เสนอความเห็น ให้ถามความเห็น ${quietNames} ก่อนสรุปมติทุกครั้ง`
    });
  } else if (quietMembers.length === members.length && members.length >= 2) {
    alerts.push({
      type: 'voice',
      badge: 'Voice Dynamics · All Quiet Voices',
      membersLabel: quietMembers.map((m) => m.name).join(', '),
      en: `<strong>All members have a Quiet voice style:</strong> Teammates may hesitate to flag blockers early. Use written check-ins in DeadNote so everyone can report issues comfortably.`,
      th: `สมาชิกทุกคนเป็นสายเงียบ/เกรงใจ อาจไม่กล้าทักทันทีเมื่อติดปัญหา ควรใช้การอัปเดตเป็นข้อความตามรอบใน DeadNote เพื่อให้แจ้งปัญหาได้ง่ายขึ้น`
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      type: 'balanced',
      badge: 'Balanced DNA',
      membersLabel: `${members.length} members`,
      en: `<strong>Well-balanced Team DNA:</strong> Core roles and communication styles complement each other. Keep regular check-ins active in DeadNote.`,
      th: `โครงสร้าง Team DNA สมดุลดี ทั้งบทบาทหลักและสไตล์การสื่อสารช่วยเสริมกัน รักษาการเช็กอินตามรอบใน DeadNote อย่างสม่ำเสมอ`
    });
  }

  watchList.innerHTML = alerts.map((item) => `
    <div class="watch-item ${item.type === 'voice' ? 'voice-note' : ''}">
      <div class="watch-tag-row">
        <span class="watch-badge">${escapeHtml(item.badge)}</span>
        <span class="watch-members">${escapeHtml(item.membersLabel)}</span>
      </div>
      <p class="watch-en">${item.en}</p>
      <p class="watch-th">${escapeHtml(item.th)}</p>
    </div>
  `).join('');
}

function renderDNA() {
  const team = getActiveTeam();
  const summaryLine = document.getElementById('dnaSummaryLine');
  const grid = document.getElementById('dnaGrid');
  const count = team.members.length;
  summaryLine.textContent = `${count} member(s) have taken the quiz. · สมาชิก ${count} คนทำ quiz แล้ว`;

  if (count === 0) {
    grid.innerHTML = '<p style="color:#64748b;font-size:14px;">ยังไม่มีข้อมูลสมาชิกในทีมนี้ กรอกแบบทดสอบที่แท็บ 1 Quiz หรือกด "โหลดข้อมูลตัวอย่าง"</p>';
  } else {
    const roles = ['Planner', 'Starter', 'Idea Maker', 'Finisher'];
    grid.innerHTML = team.members.map((m) => {
      const maxBar = Math.max(5, ...roles.map((r) => m.scores?.[r] ?? 0));
      const voiceDisplay = getShortVoiceLabel(m);
      const rowsHtml = roles.map((r) => {
        const val = m.scores?.[r] ?? 0;
        const pct = Math.min(100, (val / maxBar) * 100);
        return `
          <div class="trait-row">
            <span class="trait-name">${r}</span>
            <div class="trait-bar-bg">
              <div class="trait-bar-fill" style="width:${pct}%;background:${ROLE_COLORS[r]};"></div>
            </div>
            <span class="trait-num">${val}</span>
          </div>
        `;
      }).join('');

      return `
        <div class="dna-card">
          <div class="dna-card-top">
            <h3 class="dna-name">${escapeHtml(m.name)}</h3>
            <button type="button" class="remove-member-btn" title="ลบสมาชิก" onclick="removeMember('${escapeAttr(m.name)}')">✕</button>
          </div>
          <div class="dna-role">
            <span class="role-dot" style="background:${ROLE_COLORS[m.role] || '#00449e'};"></span>
            <span>${escapeHtml(m.role)}</span>
          </div>
          <div class="dna-voice">${escapeHtml(voiceDisplay)}</div>
          <div>${rowsHtml}</div>
        </div>
      `;
    }).join('');
  }

  renderWhatToWatch(team.members);
  renderSuggestedRoles(team.members);
}

function renderSummary() {
  const team = getActiveTeam();
  const container = document.getElementById('summaryBody');
  const totals = { Planner: 0, Starter: 0, 'Idea Maker': 0, Finisher: 0 };
  team.members.forEach((m) => {
    Object.keys(totals).forEach((k) => {
      totals[k] += (m.scores?.[k] ?? 0);
    });
  });

  const checkedCount = (team.checkins || []).filter((c) => c.status === 'checked').length;
  const totalCheckins = (team.checkins || []).length;
  const agreedCount = team.contract?.agreedMembers?.length || 0;
  const rosterCount = team.contract ? getContractRoster(team.contract).length : 0;

  container.innerHTML = `
    <div class="summary-stats">
      <div class="stat-box">
        <div class="stat-label">Members Assessed</div>
        <div class="stat-val">${team.members.length}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Check-ins Done</div>
        <div class="stat-val">${checkedCount} / ${totalCheckins}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Top Team Trait</div>
        <div class="stat-val">${computeRole(totals)}</div>
      </div>
    </div>
    <div class="summary-list">
      <div><strong>Active Team:</strong> ${escapeHtml(team.name)}</div>
      <div><strong>Contract Status:</strong> ${team.contract ? `${escapeHtml(team.contract.project)} · Agreed ${agreedCount}/${rosterCount} · Stake: ${escapeHtml(team.contract.funStake)} (${escapeHtml(team.contract.stakeAfter)})` : 'Not created yet'}</div>
      <div><strong>Team Trait Totals:</strong> Planner ${totals.Planner} · Starter ${totals.Starter} · Idea Maker ${totals['Idea Maker']} · Finisher ${totals.Finisher}</div>
      <div><strong>Members:</strong> ${team.members.length ? team.members.map((m) => `${escapeHtml(m.name)} (${escapeHtml(m.role)} · ${escapeHtml(getShortVoiceLabel(m))})`).join(', ') : 'None yet'}</div>
    </div>
  `;
}

function renderAll() {
  renderDNA();
  if (typeof renderDeadNoteTab === 'function') renderDeadNoteTab();
  renderSummary();
}

function switchTab(tabKey) {
  document.querySelectorAll('.nav-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabKey);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.remove('active');
  });
  const target = document.getElementById(`tab-${tabKey}`);
  if (target) target.classList.add('active');
}

renderQuiz();
renderTeamSwitcher();
updateQuizStatus();
renderAll();