// Dedicated LOCAL D1 fixture UI. Never imported by public Astro routes.
// A browser-side test passkey must be pre-enrolled for owner.example.test.
// No real Owner provisioning or production secrets are supported here.
import { createLocalOwnerDashboard, createLocalEditorialActivity, createLocalReviewQueue } from '../../CB-M06/owner-dashboard.mjs';
import { createLocalEditorialInsights } from '../../CB-M06/local-editorial-insights.mjs';
import { createLocalEditorialTriage } from '../../CB-M06/local-editorial-triage.mjs';
import { createLocalSocialPreview } from '../../CB-M07/social-preview.mjs';
import { createLocalSocialCard } from '../../CB-M07/social-card.mjs';
import { createLocalEditorialVariant, getLocalEditorialVariant, upsertLocalEditorialVariant, requireCanonicalLocalVariant } from '../../CB-M07/local-editorial-variants.mjs';
import { requireCanonicalLocalApprovalEvent, inspectLocalApprovalHistory, latestLocalApproval, recordLocalApproval } from '../../CB-M07/local-editorial-approvals.mjs';
import { localCalendarMinuteFormatter, localCalendarMinuteParts, createLocalCalendarIdea, addLocalCalendarIdea, replaceLocalCalendarIdea, suggestLocalConflictAlternatives } from '../../CB-M07/local-calendar.mjs';
import { createLocalWeeklyBoard } from '../../CB-M07/local-week-board.mjs';
export const LOCAL_CMS_UI_SCRIPT = String.raw`
  const createLocalOwnerDashboard = (${createLocalOwnerDashboard.toString()});
  const createLocalEditorialActivity = (${createLocalEditorialActivity.toString()});
  const createLocalReviewQueue = (${createLocalReviewQueue.toString()});
  const createLocalEditorialInsights = (${createLocalEditorialInsights.toString()});
  const createLocalEditorialTriage = (${createLocalEditorialTriage.toString()});
  const createLocalSocialPreview = (${createLocalSocialPreview.toString()});
  const createLocalSocialCard = (${createLocalSocialCard.toString()});
  const createLocalEditorialVariant = (${createLocalEditorialVariant.toString()});
  const requireCanonicalLocalVariant = (${requireCanonicalLocalVariant.toString()});
  const getLocalEditorialVariant = (${getLocalEditorialVariant.toString()});
  const upsertLocalEditorialVariant = (${upsertLocalEditorialVariant.toString()});
  const requireCanonicalLocalApprovalEvent = (${requireCanonicalLocalApprovalEvent.toString()});
  const inspectLocalApprovalHistory = (${inspectLocalApprovalHistory.toString()});
  const latestLocalApproval = (${latestLocalApproval.toString()});
  const recordLocalApproval = (${recordLocalApproval.toString()});
  const localCalendarMinuteFormatter = (${localCalendarMinuteFormatter.toString()});
  const localCalendarMinuteParts = (${localCalendarMinuteParts.toString()});
  const createLocalCalendarIdea = (${createLocalCalendarIdea.toString()});
  const addLocalCalendarIdea = (${addLocalCalendarIdea.toString()});
  const replaceLocalCalendarIdea = (${replaceLocalCalendarIdea.toString()});
  const createLocalWeeklyBoard = (${createLocalWeeklyBoard.toString()});
  const suggestLocalConflictAlternatives = (${suggestLocalConflictAlternatives.toString()});
  const ui = {
    id: document.getElementById('credential'),
    login: document.getElementById('login'),
    logout: document.getElementById('logout'),
    refresh: document.getElementById('refresh'),
    form: document.getElementById('draft'),
    items: document.getElementById('items'),
    search: document.getElementById('draft-search'),
    message: document.getElementById('message'),
    preview: document.getElementById('draft-preview'),
    previewTitle: document.getElementById('draft-preview-title'),
    previewSummary: document.getElementById('draft-preview-summary'),
    previewBody: document.getElementById('draft-preview-body'),
    previewSource: document.getElementById('draft-preview-source'),
    unsaved: document.getElementById('unsaved-draft-status'),
    status: document.getElementById('session-status'),
    dashboard: document.getElementById('m06-dashboard'),
    listedDrafts: document.getElementById('m06-listed-drafts'),
    measuredAt: document.getElementById('m06-measured-at'),
    activityStatus: document.getElementById('m06-activity-status'),
    activityScope: document.getElementById('m06-activity-scope'),
    revisedListed: document.getElementById('m06-revised-listed'),
    lastEdited: document.getElementById('m06-last-edited'),
    recentActivity: document.getElementById('m06-recent-activity'),
    reviewFilter: document.getElementById('m06-review-filter'),
    reviewList: document.getElementById('m06-review-list'),
    reviewCount: document.getElementById('m06-review-count'),
    reviewScope: document.getElementById('m06-review-scope'),
    insightsStatus: document.getElementById('m06-insights-status'),
    insightsScope: document.getElementById('m06-insights-scope'),
    insightsMissing: document.getElementById('m06-insights-missing'),
    insightsOlder: document.getElementById('m06-insights-older'),
    insightsRecent: document.getElementById('m06-insights-recent'),
    insightsTrend: document.getElementById('m06-insights-trend'),
    triageStatus: document.getElementById('m06-triage-status'),
    triageScope: document.getElementById('m06-triage-scope'),
    triageCount: document.getElementById('m06-triage-count'),
    triageFilter: document.getElementById('m06-triage-filter'),
    triageList: document.getElementById('m06-triage-list'),
    triageCredit: document.getElementById('m06-triage-credit'),
    triageAged: document.getElementById('m06-triage-aged'),
    triageBoth: document.getElementById('m06-triage-both'),
    socialDraft: document.getElementById('m07-draft'),
    socialChannel: document.getElementById('m07-channel'),
    socialGenerate: document.getElementById('m07-generate'),
    socialClear: document.getElementById('m07-clear'),
    socialPreview: document.getElementById('m07-preview'),
    socialPreviewText: document.getElementById('m07-preview-text'),
    socialStatus: document.getElementById('m07-status'),
    socialRights: document.getElementById('m07-rights'),
    socialViewport: document.getElementById('m07-viewport'),
    socialCard: document.getElementById('m07-card'),
    socialCardHeading: document.getElementById('m07-card-heading'),
    socialCardFormat: document.getElementById('m07-card-format'),
    socialCardCopy: document.getElementById('m07-card-copy'),
    socialCardLabels: document.getElementById('m07-card-labels'),
    variantComposer: document.getElementById('m07-variant-composer'),
    variantText: document.getElementById('m07-variant-text'),
    variantSave: document.getElementById('m07-variant-save'),
    variantReset: document.getElementById('m07-variant-reset'),
    variantStatus: document.getElementById('m07-variant-status'),
    approvalPanel: document.getElementById('m07-approval-panel'),
    approvalApprove: document.getElementById('m07-approval-approve'),
    approvalReject: document.getElementById('m07-approval-reject'),
    approvalReason: document.getElementById('m07-approval-reason'),
    approvalStatus: document.getElementById('m07-approval-status'),
    approvalAudit: document.getElementById('m07-approval-audit'),
    calendarDate: document.getElementById('m07-calendar-date'),
    calendarZone: document.getElementById('m07-calendar-zone'),
    calendarAdd: document.getElementById('m07-calendar-add'),
    calendarClear: document.getElementById('m07-calendar-clear'),
    calendarList: document.getElementById('m07-calendar-list'),
    calendarStatus: document.getElementById('m07-calendar-status'),
    weekZone: document.getElementById('m07-week-zone'),
    weekFilter: document.getElementById('m07-week-filter'),
    weekStatus: document.getElementById('m07-week-status'),
    weekBoard: document.getElementById('m07-week-board'),
    revision: document.getElementById('revision'),
    draftId: document.getElementById('draft-id'),
    save: document.getElementById('save'),
    history: document.getElementById('history'),
    historyList: document.getElementById('history-list'),
    bootstrap: document.getElementById('bootstrap'),
    ticket: document.getElementById('ticket'),
    devices: document.getElementById('devices'),
    enrollRecovery: document.getElementById('enroll-recovery'),
    enrollPrimary: document.getElementById('enroll-primary'),
    authorizeRecovery: document.getElementById('authorize-recovery'),
    deviceId: document.getElementById('device-id'),
    revokeDevice: document.getElementById('revoke-device'),
    deviceList: document.getElementById('device-list'),
    emergency: document.getElementById('emergency'),
    emergencyToken: document.getElementById('emergency-token'),
  };
  let csrf = null;
  let sessionExpiresAt = 0;
  let sessionExpiryTimer = null;
  let sessionEpoch = 0;
  let socialActionGeneration = 0;
  // Tracks replacement of the rendered preview, not unsaved textarea input.
  // Authorization checks must still scrub stale text if a user types meanwhile.
  let socialPreviewGeneration = 0;
  let focusValidationGeneration = 0;
  let readGeneration = 0;
  // Invalidate in-flight editor reads when a newer navigation replaces them.
  let draftOpenGeneration = 0;
  let lastReviewQueue = null;
  let lastEditorialInsights = null;
  let lastEditorialTriage = null;
  let localCalendarIdeas = [];
  let localEditorialVariants = [];
  let localApprovalEvents = [];
  let lastDrafts = [];
  let savedSnapshot = null;
  const draftFields = ['title', 'summary', 'body', 'sourceUrl', 'authorLabel'];
  function draftSnapshot() {
    return JSON.stringify(draftFields.map(name => ui.form.elements.namedItem(name).value));
  }
  function hasUnsavedChanges() {
    return !!csrf && !ui.form.hidden && savedSnapshot !== null && draftSnapshot() !== savedSnapshot;
  }
  function showUnsavedChanges() {
    ui.unsaved.hidden = !hasUnsavedChanges();
  }
  function acceptSavedDraft() {
    savedSnapshot = draftSnapshot();
    showUnsavedChanges();
  }
  function confirmDraftDiscard() {
    return !hasUnsavedChanges() || window.confirm('Discard unsaved changes in this LOCAL draft?');
  }
  // Native browser navigation/refresh guard. Never persist text in browser storage.
  // Revoked sessions and explicit sign-out still clear data without a prompt.
  window.addEventListener?.('beforeunload', (event) => {
    if (!hasUnsavedChanges()) return;
    event.preventDefault();
    event.returnValue = '';
  });
  const decode = (s) => {
    const t = s.replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(t + '='.repeat((4 - t.length % 4) % 4));
    return Uint8Array.from(raw, x => x.charCodeAt(0));
  };
  const encode = (buffer) => {
    let raw = '';
    for (const b of new Uint8Array(buffer)) raw += String.fromCharCode(b);
    return btoa(raw).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };
  const message = (value) => { ui.message.textContent = value; };
  // Preview is a private, client-side text-only DOM projection. No publication,
  // raw HTML, additional request or external source fetching is permitted.
  function renderDraftPreview() {
    const authorized = !!csrf && !ui.form.hidden;
    const title = authorized ? ui.form.elements.namedItem('title').value.trim() : '';
    const summary = authorized ? ui.form.elements.namedItem('summary').value.trim() : '';
    const body = authorized ? ui.form.elements.namedItem('body').value.trim() : '';
    const source = authorized ? ui.form.elements.namedItem('sourceUrl').value.trim() : '';
    ui.preview.hidden = !authorized || !(title || summary || body);
    ui.previewTitle.textContent = title;
    ui.previewSummary.textContent = summary;
    ui.previewBody.textContent = body;
    ui.previewSource.textContent = source;
  }
  function clearLocalSocialPreview() {
    socialActionGeneration += 1;
    socialPreviewGeneration += 1;
    ui.socialPreview.hidden = true;
    ui.socialPreviewText.textContent = '';
    ui.socialRights.textContent = 'UNAVAILABLE';
    ui.socialStatus.textContent = 'No LOCAL social preview';
    ui.socialCard.hidden = true;
    ui.socialCardHeading.textContent = '';
    ui.socialCardFormat.textContent = '';
    ui.socialCardCopy.textContent = '';
    ui.socialCardLabels.textContent = '';
    ui.variantComposer.hidden = true;
    ui.variantText.value = '';
    ui.variantStatus.textContent = 'No editable LOCAL variant';
    ui.approvalPanel.hidden = true;
    ui.approvalReason.value = '';
    ui.approvalStatus.textContent = 'No LOCAL editorial decision';
    ui.approvalAudit.replaceChildren();
    ui.socialCard.removeAttribute('data-channel');
    ui.socialCard.removeAttribute('data-viewport');
  }
  function clearLocalCalendar() {
    localCalendarIdeas = [];
    ui.calendarList.replaceChildren();
    ui.calendarStatus.textContent = '0 hypothetical concepts · memory only · NOT SCHEDULED';
    ui.calendarDate.value = '';
    ui.weekBoard.replaceChildren();
    ui.weekStatus.textContent = '0 shown · 0 conflicts · NOT SCHEDULED';
    ui.weekZone.value = 'America/Sao_Paulo';
    ui.weekFilter.value = 'all';
  }
  /**
   * Rebuild the session-gated weekly DOM with textContent and no external I/O.
   * Invalid projections scrub ephemeral calendar data; filters never persist.
   * @returns {void}
   */
  function renderLocalWeekBoard() {
    ui.weekBoard.replaceChildren();
    ui.weekStatus.textContent = '0 shown · 0 conflicts · NOT SCHEDULED';
    if (!csrf || ui.form.hidden || ui.dashboard.hidden) return;
    let board;
    try {
      board = createLocalWeeklyBoard(localCalendarIdeas, ui.weekFilter.value, ui.weekZone.value);
    } catch {
      clearLocalCalendar();
      ui.weekStatus.textContent = 'LOCAL weekly view cleared due to invalid data · NOT SCHEDULED';
      return;
    }
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const week of board.weeks) {
      const section = document.createElement('section');
      section.className = 'm07-week';
      const title = document.createElement('h5');
      title.textContent = 'Hypothetical week ' + week.startDate + ' to ' + week.endDate;
      section.append(title);
      const grid = document.createElement('div');
      grid.className = 'm07-week-grid';
      for (const [index, day] of week.days.entries()) {
        const article = document.createElement('article');
        article.className = 'm07-week-day';
        const heading = document.createElement('h6');
        heading.textContent = weekdays[index] + ' · ' + day.date;
        article.append(heading);
        if (day.ideas.length === 0) {
          const empty = document.createElement('p');
          empty.textContent = 'No hypothetical ideas';
          article.append(empty);
        }
        for (const idea of day.ideas) {
          const item = document.createElement('p');
          item.className = idea.collision ? 'm07-week-idea m07-week-conflict' : 'm07-week-idea';
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'm07-week-open';
          button.textContent = 'Open LOCAL draft · ' + idea.title;
          const epoch = sessionEpoch;
          const generation = readGeneration;
          button.addEventListener('click', async () => {
            // A stale idea or detached element must never authorize a draft lookup.
            if (epoch !== sessionEpoch || generation !== readGeneration ||
                !csrf || ui.form.hidden || ui.dashboard.hidden || !item.isConnected) return;
            const draft = lastDrafts.find(row => row.id === idea.draftId);
            if (!draft) {
              message('LOCAL draft unavailable; refresh your list');
              return;
            }
            if (await openLocalDraft(draft) && epoch === sessionEpoch &&
                generation === readGeneration) {
              ui.form.elements.namedItem('title').focus();
            }
          });
          const detail = document.createElement('span');
          detail.textContent = ' · ' + idea.localTime + ' · ' + idea.channel.toUpperCase() +
            ' · ' + idea.status + ' · ' + idea.publication + ' · ' +
            idea.sourceStatus + ' · ' + idea.rights + ' · ' + idea.creditStatus +
            (idea.collision ? ' · HYPOTHETICAL TIME CONFLICT (NOT BLOCKING)' : '');
          item.append(button, detail);
          article.append(item);
        }
        grid.append(article);
      }
      section.append(grid);
      ui.weekBoard.append(section);
    }
    ui.weekStatus.textContent = board.visibleCount + ' of ' + board.totalCount +
      ' hypothetical concepts shown · ' + board.collisionSlots +
      ' conflict slots · ' + board.timeZone + ' · NOT SCHEDULED · NOT POSTED';
  }
  function renderLocalCalendar() {
    ui.calendarList.replaceChildren();
    if (!csrf || ui.form.hidden || ui.dashboard.hidden) return;
    for (const item of localCalendarIdeas) {
      const li = document.createElement('li');
      const article = document.createElement('article');
      article.className = 'm07-calendar-item';
      const description = document.createElement('p');
      description.textContent = item.title + ' · ' + item.channel.toUpperCase() + ' · ' +
        item.hypotheticalLocal + ' ' + item.timeZone + ' · ' + item.utcISO;
      const labels = document.createElement('small');
      labels.textContent = item.status + ' · ' + item.publication + ' · ' +
        item.sourceStatus + ' · ' + item.creditStatus + ' · ' + item.rights;
      const epoch = sessionEpoch;
      const generation = readGeneration;
      // Detached, superseded, logged-out or delisted controls have no authority.
      const current = () => epoch === sessionEpoch && generation === readGeneration &&
        !!csrf && !ui.form.hidden && !ui.dashboard.hidden && li.isConnected &&
        localCalendarIdeas.includes(item) && lastDrafts.some(row => row.id === item.draftId);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove hypothetical concept';
      remove.setAttribute('aria-label', 'Remove hypothetical concept for ' + item.title);
      remove.addEventListener('click', () => {
        if (!current()) return;
        localCalendarIdeas = localCalendarIdeas.filter(row => row !== item);
        renderLocalCalendar();
      });
      const action = (className, caption) => {
        const control = document.createElement('button');
        control.type = 'button';
        control.className = className;
        control.textContent = caption;
        return control;
      };
      const edit = action('m07-calendar-edit', 'Edit hypothetical concept');
      edit.setAttribute('aria-label', 'Edit hypothetical concept for ' + item.title);
      const editor = document.createElement('fieldset');
      editor.className = 'm07-calendar-editor';
      editor.hidden = true;
      const legend = document.createElement('legend');
      legend.textContent = 'Edit LOCAL hypothetical concept · ' + item.title;
      const controls = document.createElement('div');
      controls.className = 'm07-calendar-controls';
      const labeled = (caption, control) => {
        const label = document.createElement('label');
        label.textContent = caption;
        label.append(control);
        controls.append(label);
      };
      const select = (className, choices, value) => {
        const control = document.createElement('select');
        control.className = className;
        for (const [key, caption] of choices) {
          const choice = document.createElement('option');
          choice.value = key;
          choice.textContent = caption;
          control.append(choice);
        }
        control.value = value;
        return control;
      };
      const channel = select('m07-edit-channel',
        [['x', 'X'], ['instagram', 'Instagram'], ['tiktok', 'TikTok']], item.channel);
      labeled('Illustrative channel (not a real provider)', channel);
      const time = document.createElement('input');
      time.className = 'm07-edit-time';
      time.type = 'datetime-local';
      time.step = '60';
      time.autocomplete = 'off';
      time.value = item.hypotheticalLocal;
      labeled('Hypothetical local date and minute', time);
      const zone = select('m07-edit-zone', [['America/Sao_Paulo', 'São Paulo'],
        ['UTC', 'UTC'], ['America/New_York', 'New York (DST test)']], item.timeZone);
      labeled('Fictional time zone', zone);
      const save = action('m07-calendar-save', 'Save LOCAL idea edit');
      const cancel = action('m07-calendar-cancel', 'Cancel idea edit');
      const editStatus = document.createElement('p');
      editStatus.setAttribute('role', 'status');
      editStatus.setAttribute('aria-live', 'polite');
      editStatus.textContent = 'MEMORY ONLY · NOT SCHEDULED · NOT POSTED';
      const panel = document.createElement('div');
      panel.className = 'm07-suggestion-panel';
      panel.hidden = true;
      const suggestStatus = document.createElement('p');
      suggestStatus.setAttribute('aria-live', 'polite');
      suggestStatus.textContent = 'Hypothetical alternatives only · NOT SCHEDULED · NOT POSTED';
      const selection = select('m07-suggestion-choice',
        [['', 'Choose a hypothetical alternative before confirming']], '');
      const pickLabel = document.createElement('label');
      pickLabel.textContent = 'Available fictional times for ' + item.title;
      pickLabel.append(selection);
      const confirmSuggestion = action('m07-suggestion-confirm', 'Confirm hypothetical time change');
      panel.append(suggestStatus, pickLabel, confirmSuggestion);
      const resetEditor = () => {
        panel.hidden = true;
        selection.replaceChildren();
        selection.value = '';
        channel.value = item.channel;
        time.value = item.hypotheticalLocal;
        zone.value = item.timeZone;
        editStatus.textContent = 'MEMORY ONLY · NOT SCHEDULED · NOT POSTED';
      };
      edit.addEventListener('click', () => {
        if (!current()) return;
        resetEditor();
        editor.hidden = false;
        time.focus();
      });
      cancel.addEventListener('click', () => {
        if (!current()) return;
        resetEditor();
        editor.hidden = true;
        edit.focus();
      });
      save.addEventListener('click', () => {
        if (!current()) return;
        const draft = lastDrafts.find(row => row.id === item.draftId);
        if (!draft) return;
        try {
          const replacement = createLocalCalendarIdea(draft, channel.value, time.value, zone.value);
          // Editing may change channel/minute, never the authorized draft ID.
          localCalendarIdeas = replaceLocalCalendarIdea(localCalendarIdeas, item, replacement);
          renderLocalCalendar();
          ui.calendarStatus.textContent = 'Edited LOCAL hypothetical concept · memory only · NOT SCHEDULED · NOT POSTED';
        } catch {
          editStatus.textContent = 'Invalid or duplicate LOCAL idea; NOTHING SCHEDULED';
        }
      });
      article.append(description, labels, remove, edit);

      // M07-H: confirm a cross-channel copy of this still-current LOCAL idea.
      // No provider I/O, draft write, timer, scheduler or persistent storage.
      const copy = action('m07-calendar-copy', 'Copy hypothetical concept to another channel');
      copy.setAttribute('aria-label', 'Copy hypothetical concept for ' + item.title + ' to another channel');
      const copyPanel = document.createElement('fieldset');
      copyPanel.className = 'm07-copy-panel';
      copyPanel.hidden = true;
      const copyLegend = document.createElement('legend');
      copyLegend.textContent = 'Copy LOCAL concept for ' + item.title + ' · MEMORY ONLY';
      const copyLabel = document.createElement('label');
      copyLabel.textContent = 'Destination channel (no provider connection)';
      const copyChannel = document.createElement('select');
      copyChannel.className = 'm07-copy-channel';
      for (const [value, label] of [
        ['', 'Choose a different hypothetical channel'],
        ['x', 'X'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'],
      ]) {
        if (value === item.channel) continue;
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        copyChannel.append(option);
      }
      copyLabel.append(copyChannel);
      const copyPreview = document.createElement('p');
      copyPreview.className = 'm07-copy-preview';
      copyPreview.setAttribute('aria-live', 'polite');
      const confirmCopy = action('m07-copy-confirm', 'Confirm LOCAL hypothetical copy');
      const cancelCopy = action('m07-copy-cancel', 'Cancel LOCAL hypothetical copy');
      let copyValidationGeneration = 0;
      const copyReset = () => {
        // Cancel pending authorization reads when the panel is reset or reopened.
        copyValidationGeneration += 1;
        copyChannel.value = '';
        copyPreview.textContent = 'Choose a destination for preview · NOT SCHEDULED · NOT POSTED';
        confirmCopy.disabled = true;
      };
      const copyCandidate = () => {
        if (!current() || !activeLocalSocialSession(epoch) || copyPanel.hidden ||
            !['x', 'instagram', 'tiktok'].includes(copyChannel.value) ||
            copyChannel.value === item.channel) return null;
        const draft = lastDrafts.find(row => row.id === item.draftId);
        if (!draft) return null;
        const candidate = createLocalCalendarIdea(draft, copyChannel.value,
          item.hypotheticalLocal, item.timeZone);
        // Dry-run the canonical immutable gate, including the 20-concept cap.
        addLocalCalendarIdea(localCalendarIdeas, candidate);
        return candidate;
      };
      copy.addEventListener('click', () => {
        if (!current() || !activeLocalSocialSession(epoch)) return;
        copyReset();
        copyPanel.hidden = false;
        copyChannel.focus();
      });
      copyChannel.addEventListener('change', () => {
        // A new channel selection supersedes an in-flight server recheck.
        copyValidationGeneration += 1;
        if (!current() || !activeLocalSocialSession(epoch) || copyPanel.hidden) return;
        confirmCopy.disabled = true;
        try {
          const candidate = copyCandidate();
          if (!candidate) throw new TypeError('Unavailable destination');
          copyPreview.textContent = 'Preview only · ' + candidate.channel.toUpperCase() +
            ' · ' + candidate.hypotheticalLocal + ' ' + candidate.timeZone +
            ' · ' + candidate.status + ' · ' + candidate.publication +
            ' · NOT SCHEDULED · NOT POSTED';
          confirmCopy.disabled = false;
        } catch {
          copyPreview.textContent = 'Duplicate, invalid time, unavailable draft or 20-concept limit · NOTHING SCHEDULED';
        }
      });
      cancelCopy.addEventListener('click', () => {
        if (!current() || !activeLocalSocialSession(epoch)) return;
        copyReset();
        copyPanel.hidden = true;
        copy.focus();
      });
      confirmCopy.addEventListener('click', async () => {
        if (!current() || !activeLocalSocialSession(epoch) || confirmCopy.disabled) return;
        const draft = lastDrafts.find(row => row.id === item.draftId);
        const selectedChannel = copyChannel.value;
        const initialIdeas = localCalendarIdeas;
        try {
          // The preview is never authorization. Re-check this exact selection.
          if (!draft || !copyCandidate()) throw new TypeError('Unavailable destination');
        } catch {
          confirmCopy.disabled = true;
          copyPreview.textContent = 'Destination no longer available; choose again · NOTHING SCHEDULED';
          return;
        }
        const validation = ++copyValidationGeneration;
        confirmCopy.disabled = true; // No double submission while verification is pending.
        copyPreview.textContent = 'Checking LOCAL authorization · NOTHING SCHEDULED';
        // Reuse the existing authenticated Owner/D1 read; 401 clears the UI.
        const authorized = await verifyLocalSocialSession(epoch, draft);
        // Reject responses made obsolete by logout, refresh, cancel, channel switch,
        // changes to the draft list, or replacement of the calendar DOM.
        if (!authorized || validation !== copyValidationGeneration ||
            !current() || !activeLocalSocialSession(epoch) || copyPanel.hidden ||
            selectedChannel !== copyChannel.value || initialIdeas !== localCalendarIdeas ||
            lastDrafts.find(row => row.id === item.draftId) !== draft ||
            !authorized.some(row => sameLocalSocialDraftMetadata(draft, row))) return;
        try {
          const candidate = copyCandidate();
          if (!candidate) throw new TypeError('Unavailable destination');
          localCalendarIdeas = addLocalCalendarIdea(localCalendarIdeas, candidate);
          renderLocalCalendar();
          ui.calendarStatus.textContent = 'Copied LOCAL hypothetical concept · MEMORY ONLY · NOT SCHEDULED · NOT POSTED';
          // The old confirm button is detached. Restore focus to its source idea.
          const sourceIndex = localCalendarIdeas.indexOf(item);
          ui.calendarList.children[sourceIndex]?.querySelector('.m07-calendar-copy')?.focus();
        } catch {
          if (current() && validation === copyValidationGeneration) {
            confirmCopy.disabled = true;
            copyPreview.textContent = 'Destination no longer available; choose again · NOTHING SCHEDULED';
          }
        }
      });
      copyPanel.append(copyLegend, copyLabel, copyPreview, confirmCopy, cancelCopy);
      article.append(copy, copyPanel);
      const conflict = localCalendarIdeas.some(row => row !== item &&
        row.draftId !== item.draftId && row.channel === item.channel &&
        row.utcISO === item.utcISO);
      if (conflict) {
        const suggestions = action('m07-conflict-suggest', 'Suggest hypothetical conflict-free times');
        suggestions.setAttribute('aria-label', 'Suggest hypothetical alternatives for ' + item.title);
        suggestions.addEventListener('click', () => {
          if (!current()) return;
          const draft = lastDrafts.find(row => row.id === item.draftId);
          if (!draft) return;
          resetEditor();
          editor.hidden = false;
          panel.hidden = false;
          try {
            const times = suggestLocalConflictAlternatives(localCalendarIdeas, item, draft);
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = 'Choose a hypothetical time to confirm';
            selection.append(placeholder);
            for (const candidate of times) {
              const option = document.createElement('option');
              option.value = candidate.utcISO;
              option.textContent = candidate.hypotheticalLocal + ' ' + candidate.timeZone +
                ' · ' + candidate.channel.toUpperCase() + ' · NOT SCHEDULED';
              selection.append(option);
            }
            suggestStatus.textContent = times.length
              ? times.length + ' hypothetical alternatives · select, then confirm manually · NOT POSTED'
              : 'No valid alternatives in the next three hours · NOTHING SCHEDULED';
            confirmSuggestion.disabled = times.length === 0;
            selection.focus();
          } catch {
            panel.hidden = true;
            editStatus.textContent = 'Alternatives unavailable; NOTHING SCHEDULED';
          }
        });
        article.append(suggestions);
      }
      confirmSuggestion.addEventListener('click', () => {
        if (!current() || editor.hidden || panel.hidden || !selection.value) return;
        const draft = lastDrafts.find(row => row.id === item.draftId);
        if (!draft) return;
        try {
          // Recompute against the latest list before applying the user selection.
          const fresh = suggestLocalConflictAlternatives(localCalendarIdeas, item, draft)
            .find(row => row.utcISO === selection.value);
          if (!fresh) throw new TypeError('Stale suggestion');
          channel.value = fresh.channel;
          time.value = fresh.hypotheticalLocal;
          zone.value = fresh.timeZone;
          save.click(); // Uses the existing validated, immutable LOCAL edit action.
        } catch {
          editStatus.textContent = 'Suggested time unavailable; refresh alternatives · NOTHING SCHEDULED';
        }
      });
      editor.append(legend, controls, panel, save, cancel, editStatus);
      article.append(editor);
      li.append(article);
      ui.calendarList.append(li);
    }
    ui.calendarStatus.textContent = localCalendarIdeas.length +
      ' hypothetical concepts · memory only · NOT SCHEDULED';
    renderLocalWeekBoard();
  }
  function renderLocalApproval() {
    ui.approvalPanel.hidden = ui.variantComposer.hidden;
    ui.approvalApprove.disabled = true;
    ui.approvalReject.disabled = true;
    ui.approvalAudit.replaceChildren();
    if (!csrf || ui.form.hidden || ui.dashboard.hidden || ui.variantComposer.hidden) return;
    const draft = lastDrafts.find(row => row.id === ui.socialDraft.value);
    if (!draft) return;
    const channel = ui.socialChannel.value;
    try {
      const saved = getLocalEditorialVariant(localEditorialVariants,draft,channel);
      const latest = latestLocalApproval(localApprovalEvents,draft,channel,lastDrafts);
      const editable = !!saved && ui.variantText.value === saved.editableText;
      ui.approvalApprove.disabled = !editable || latest?.action !== 'SAVE';
      ui.approvalReject.disabled = !editable || latest?.action !== 'SAVE';
      // Never present unsaved textarea edits as though that new text were approved.
      let status = 'No active LOCAL editorial decision';
      if (!saved) {
        status = 'Save this channel before review · NOT POSTED';
      } else if (!editable) {
        status = 'Unsaved edits · approval applies only to the last saved version · NOT POSTED';
      } else if (latest && latest.action !== 'RESET') {
        const labels = {
          SAVE:'PENDING LOCAL REVIEW',
          APPROVE:'APPROVED FOR LOCAL EDITORIAL REVIEW ONLY',
          REJECT:'REJECTED FOR LOCAL EDITORIAL REVIEW',
        };
        status = 'Version ' + latest.version + ' · ' + labels[latest.action] +
          ' · NOT POSTED · RIGHTS NOT CLEARED';
      }
      ui.approvalStatus.textContent = status;
      for (const [index,event] of localApprovalEvents.entries()) {
        if (event.variant.draftId !== draft.id ||
            event.variant.draftRevision !== draft.revision ||
            event.variant.channel !== channel) continue;
        const row = document.createElement('li');
        row.textContent = '#' + (index + 1) + ' · v' + event.version + ' · ' +
          event.action + ' · ' + event.atUTC + (event.reason ? ' · ' + event.reason : '');
        ui.approvalAudit.append(row);
      }
    } catch {
      localApprovalEvents = [];
      ui.approvalStatus.textContent = 'Invalid LOCAL review history cleared · NOT POSTED';
      ui.approvalAudit.replaceChildren();
    }
  }
  function scrubLocalSocialStudio() {
    localApprovalEvents = [];
    localEditorialVariants = [];
    clearLocalCalendar();
    ui.calendarZone.value = 'America/Sao_Paulo';
    clearLocalSocialPreview();
    ui.socialDraft.replaceChildren();
    ui.socialChannel.value = 'x';
    ui.socialViewport.value = 'mobile';
  }
  function renderLocalSocialChoices() {
    ui.socialDraft.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Choose an authenticated LOCAL draft';
    ui.socialDraft.append(placeholder);
    for (const draft of lastDrafts) {
      const option = document.createElement('option');
      option.value = draft.id;
      option.textContent = draft.title + ' · rev ' + draft.revision;
      ui.socialDraft.append(option);
    }
    ui.socialDraft.value = '';
  }
  function hideLocalDashboard() {
    scrubLocalSocialStudio();
    ui.dashboard.hidden = true;
    ui.listedDrafts.textContent = 'Unavailable';
    ui.measuredAt.textContent = 'Unavailable';
    ui.activityStatus.textContent = 'UNAVAILABLE';
    ui.activityScope.textContent = 'UNAVAILABLE';
    ui.revisedListed.textContent = 'Unavailable';
    ui.lastEdited.textContent = 'Unavailable';
    ui.recentActivity.replaceChildren();
    lastReviewQueue = null;
    lastEditorialInsights = null;
    lastEditorialTriage = null;
    ui.triageList.replaceChildren();
    ui.triageStatus.textContent = 'UNAVAILABLE';
    ui.triageScope.textContent = 'UNAVAILABLE';
    ui.triageCount.textContent = 'UNAVAILABLE';
    ui.triageCredit.textContent = 'Unavailable';
    ui.triageAged.textContent = 'Unavailable';
    ui.triageBoth.textContent = 'Unavailable';
    ui.triageFilter.value = 'all';
    ui.insightsStatus.textContent = 'UNAVAILABLE';
    ui.insightsScope.textContent = 'UNAVAILABLE';
    ui.insightsMissing.textContent = 'Unavailable';
    ui.insightsOlder.textContent = 'Unavailable';
    ui.insightsRecent.textContent = 'Unavailable';
    ui.insightsTrend.replaceChildren();
    ui.reviewList.replaceChildren();
    ui.reviewCount.textContent = 'UNAVAILABLE';
    ui.reviewScope.textContent = 'UNAVAILABLE';
  }
  function renderLocalReviewQueue() {
    ui.reviewList.replaceChildren();
    if (!lastReviewQueue || !csrf || ui.form.hidden || ui.dashboard.hidden) return;
    const filter = ui.reviewFilter.value;
    let shown = 0;
    for (const row of lastReviewQueue.rows) {
      if (filter === 'missing-credit' && row.creditStatus !== 'CREDIT_MISSING') continue;
      if (filter === 'revised' && row.revision <= 1) continue;
      if (filter === 'older-seven-days' &&
          (!lastEditorialInsights || row.updatedAtSeconds >
            Date.parse(lastEditorialInsights.asOfUTC) / 1000 - 7 * 86400)) continue;
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = row.title + ' · rev ' + row.revision;
      button.addEventListener('click', () => openLocalDraft(row));
      const labels = document.createElement('span');
      labels.textContent = ' · ' + row.creditStatus + ' · ' + row.sourceStatus + ' · ' + row.publishingStatus;
      li.append(button, labels);
      ui.reviewList.append(li);
      shown++;
    }
    ui.reviewCount.textContent = String(shown) + ' of ' + lastReviewQueue.totalListed + ' listed LOCAL drafts';
    ui.reviewScope.textContent = lastReviewQueue.listingScope;
  }
  function renderLocalEditorialTriage() {
    ui.triageList.replaceChildren();
    if (!lastEditorialTriage || !csrf || ui.form.hidden || ui.dashboard.hidden) return;
    let shown = 0;
    const filter = ui.triageFilter.value;
    for (const row of lastEditorialTriage.items) {
      if (filter === 'missing-credit' && !row.creditMissing) continue;
      if (filter === 'aged' && !row.aged) continue;
      if (filter === 'both' && !(row.creditMissing && row.aged)) continue;
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = row.title + ' · rev ' + row.revision;
      const epoch = sessionEpoch;
      const generation = readGeneration;
      button.addEventListener('click', () => {
        if (epoch !== sessionEpoch || generation !== readGeneration ||
            !csrf || ui.form.hidden || ui.dashboard.hidden || !item.isConnected ||
            !lastDrafts.some(draft => draft.id === row.id)) return;
        void openLocalDraft(row);
      });
      const reason = document.createElement('span');
      reason.textContent = ' · ' + row.attention + ' · ' + row.reasons.join(' · ') +
        ' · DRAFT_ONLY · NOT VERIFIED';
      item.append(button, reason);
      ui.triageList.append(item);
      shown++;
    }
    ui.triageCount.textContent = shown + ' of ' + lastEditorialTriage.totalListed +
      ' authenticated LOCAL drafts (listed only)';
  }
  function showLocalDashboard(snapshot, activity, reviewQueue, insights, triage) {
    if (!csrf || ui.form.hidden) return hideLocalDashboard();
    ui.listedDrafts.textContent = String(snapshot.listedDraftsCount);
    ui.measuredAt.textContent = snapshot.asOfUTC;
    ui.revisedListed.textContent = String(activity.revisedListedDraftsCount);
    ui.lastEdited.textContent = activity.lastUpdatedUTC ?? 'No listed edits';
    ui.activityStatus.textContent = activity.status;
    ui.activityScope.textContent = activity.listingScope;
    ui.recentActivity.replaceChildren();
    for (const row of activity.recent) {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = row.title + ' · rev ' + row.revision + ' · ' + row.updatedAtUTC;
      button.addEventListener('click', () => openLocalDraft(row));
      li.append(button);
      ui.recentActivity.append(li);
    }
    lastReviewQueue = reviewQueue;
    lastEditorialInsights = insights;
    lastEditorialTriage = triage;
    ui.triageStatus.textContent = triage.status;
    ui.triageScope.textContent = triage.listingScope;
    ui.triageCredit.textContent = String(triage.requiringCredit);
    ui.triageAged.textContent = String(triage.agedListed);
    ui.triageBoth.textContent = String(triage.requiringBoth);
    ui.insightsStatus.textContent = insights.status;
    ui.insightsScope.textContent = insights.listingScope;
    ui.insightsMissing.textContent = String(insights.missingCreditListed);
    ui.insightsOlder.textContent = String(insights.olderThanSevenDaysListed);
    ui.insightsRecent.textContent = String(insights.editedLast24HoursListed);
    ui.insightsTrend.replaceChildren();
    for (const day of insights.dailyLastEditsUTC) {
      const li = document.createElement('li');
      li.textContent = day.dayUTC + ': ' + day.lastEditedListedDrafts + ' listed draft(s) last edited';
      ui.insightsTrend.append(li);
    }
    ui.dashboard.hidden = false;
    renderLocalReviewQueue();
    renderLocalEditorialTriage();
    renderLocalSocialChoices();
  }
  function clearLocalSession() {
    if (sessionExpiryTimer !== null) clearTimeout(sessionExpiryTimer);
    sessionExpiryTimer = null;
    sessionExpiresAt = 0;
    sessionEpoch += 1;
    readGeneration += 1;
    draftOpenGeneration += 1;
    hideLocalDashboard();
    ui.reviewFilter.value = 'all';
    csrf = null;
    savedSnapshot = null;
    ui.form.reset();
    ui.draftId.value = '';
    ui.revision.value = '0';
    ui.save.textContent = 'Create draft';
    ui.form.hidden = true;
    renderDraftPreview();
    showUnsavedChanges();
    ui.logout.hidden = true;
    ui.refresh.hidden = true;
    ui.history.hidden = true;
    ui.historyList.replaceChildren();
    ui.items.replaceChildren();
    lastDrafts = [];
    ui.search.value = '';
    ui.search.hidden = true;
    ui.devices.hidden = true;
    ui.deviceList.replaceChildren();
    ui.deviceId.value = '';
    ui.emergencyToken.value = '';
    ui.status.textContent = 'Not authenticated';
  }
  async function api(url, method = 'GET', body) {
    const requestEpoch = sessionEpoch;
    const headers = {};
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      if (csrf) headers['X-CB-CSRF'] = csrf;
    }
    const response = await fetch(url, {
      method, credentials: 'same-origin', cache: 'no-store',
      headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    if (!response.ok) {
      // Fail closed on expired/revoked sessions: do not leave private draft text
      // readable in an old visible form after a denied authenticated read.
      if (response.status === 401 && requestEpoch === sessionEpoch && (csrf ||
          /^\/(?:local|admin)\/articles(?:\/|\?|$)/.test(url))) {
        // Denied article reads must erase stale drafts even if the local CSRF state
        // was already cleared. After sign-in, deny from any protected route
        // also revokes this browser editor's local authenticated state.
        clearLocalSession();
      }
      const error = new Error('Local request rejected (' + response.status + ')');
      error.status = response.status;
      throw error;
    }
    return data;
  }
  function registrationJson(credential) {
    return {
      id: credential.id,
      rawId: encode(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: encode(credential.response.clientDataJSON),
        attestationObject: encode(credential.response.attestationObject),
        transports: credential.response.getTransports ? credential.response.getTransports() : [],
      },
      clientExtensionResults: credential.getClientExtensionResults(),
      authenticatorAttachment: credential.authenticatorAttachment,
    };
  }
  function assertionJson(assertion) {
    return {
      id: assertion.id,
      rawId: encode(assertion.rawId),
      type: assertion.type,
      response: {
        clientDataJSON: encode(assertion.response.clientDataJSON),
        authenticatorData: encode(assertion.response.authenticatorData),
        signature: encode(assertion.response.signature),
        userHandle: assertion.response.userHandle ? encode(assertion.response.userHandle) : null,
      },
      clientExtensionResults: assertion.getClientExtensionResults(),
    };
  }
  async function createPasskey(challengeHex, rpId) {
    if (!window.PublicKeyCredential || !navigator.credentials?.create) {
      throw new Error('Browser passkey creation is unavailable in this secure test origin');
    }
    const credential = await navigator.credentials.create({ publicKey: {
      challenge: Uint8Array.from(challengeHex.match(/.{2}/g), x => parseInt(x, 16)),
      rp: { id: rpId, name: 'CoinBlink local test' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'local-owner', displayName: 'Local Owner' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: { userVerification: 'required', residentKey: 'required' },
      attestation: 'none', timeout: 60000,
    } });
    if (!credential) throw new Error('Passkey was not created');
    return registrationJson(credential);
  }
  async function refreshDevices() {
    const { credentials } = await api('/local/credentials');
    ui.deviceList.replaceChildren();
    for (const device of credentials) {
      const item = document.createElement('li');
      item.textContent = device.device_kind + ' · ' + device.credential_id.slice(0, 10) + '…' +
        (device.credential_id === ui.id.value.trim() ? ' (this sign-in)' : '') +
        (device.revoked_at ? ' (revoked)' : ' (active)');
      ui.deviceList.append(item);
    }
  }
  function editDraft(draft) {
    ui.form.elements.namedItem('title').value = draft.title;
    ui.form.elements.namedItem('summary').value = draft.summary;
    ui.form.elements.namedItem('body').value = draft.body;
    ui.form.elements.namedItem('sourceUrl').value = draft.source_url;
    ui.form.elements.namedItem('authorLabel').value = draft.author_label;
    ui.draftId.value = draft.id;
    ui.revision.value = String(draft.revision);
    ui.save.textContent = 'Save new revision';
    ui.history.hidden = false;
    ui.historyList.replaceChildren();
    renderDraftPreview();
    acceptSavedDraft();
  }
  async function openLocalDraft(draft) {
    if (!csrf || ui.form.hidden || !confirmDraftDiscard()) return false;
    const epoch = sessionEpoch;
    const generation = readGeneration;
    const openGeneration = ++draftOpenGeneration;
    const id = draft.id;
    const initialSnapshot = draftSnapshot();
    try {
      const result = await api('/local/articles/' + encodeURIComponent(id));
      // Never hydrate a prior-session, superseded-list or modified form.
      if (epoch !== sessionEpoch || generation !== readGeneration ||
          openGeneration !== draftOpenGeneration || !csrf ||
          ui.form.hidden || !lastDrafts.some(row => row.id === id) ||
          draftSnapshot() !== initialSnapshot) return false;
      if (!result.draft || result.draft.id !== id) {
        message('LOCAL draft unavailable; refresh your list');
        return false;
      }
      editDraft(result.draft);
      message('Loaded draft revision ' + result.draft.revision);
      return true;
    } catch (error) {
      if (epoch === sessionEpoch && generation === readGeneration &&
          openGeneration === draftOpenGeneration) {
        message(error.status === 404 ?
          'LOCAL draft unavailable; refresh your list' : 'Could not open draft');
      }
      return false;
    }
  }
  function renderDraftList() {
    ui.items.replaceChildren();
    const query = ui.search.value.trim().toLowerCase();
    for (const draft of lastDrafts) {
      if (query && !draft.title.toLowerCase().includes(query)) continue;
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = draft.title + ' · rev ' + draft.revision;
      button.addEventListener('click', () => openLocalDraft(draft));
      li.append(button);
      ui.items.append(li);
    }
  }
  async function refresh() {
    const epoch = sessionEpoch;
    const generation = ++readGeneration;
    hideLocalDashboard();
    if (csrf && !ui.form.hidden) ui.status.textContent = 'LOADING local editorial activity';
    try {
      const { drafts } = await api('/local/articles');
      if (epoch !== sessionEpoch || generation !== readGeneration || !csrf || ui.form.hidden) return;
      const asOfUTC = new Date().toISOString();
      const snapshot = createLocalOwnerDashboard(drafts, asOfUTC);
      const activity = createLocalEditorialActivity(drafts);
      const reviewQueue = createLocalReviewQueue(drafts);
      const insights = createLocalEditorialInsights(reviewQueue, asOfUTC);
      const triage = createLocalEditorialTriage(reviewQueue, insights);
      if (epoch !== sessionEpoch || generation !== readGeneration || !csrf || ui.form.hidden) return;
      lastDrafts = drafts;
      renderDraftList();
      showLocalDashboard(snapshot, activity, reviewQueue, insights, triage);
      ui.status.textContent = 'Local test session active';
    } catch (error) {
      // Ignore superseded reads, never revoke a freshly re-authenticated session.
      if (epoch !== sessionEpoch || generation !== readGeneration) return;
      clearLocalSession();
      throw error;
    }
  }
  ui.reviewFilter.addEventListener('change', renderLocalReviewQueue);
  ui.triageFilter.addEventListener('change', renderLocalEditorialTriage);
  ui.weekFilter.addEventListener('change', renderLocalWeekBoard);
  ui.weekZone.addEventListener('change', renderLocalWeekBoard);
  ui.calendarAdd.addEventListener('click', () => {
    if (!csrf || ui.form.hidden || ui.dashboard.hidden) return;
    const draft = lastDrafts.find(row => row.id === ui.socialDraft.value);
    if (!draft) {
      ui.calendarStatus.textContent = 'Select an authorized LOCAL draft first';
      return;
    }
    try {
      const idea = createLocalCalendarIdea(draft, ui.socialChannel.value,
        ui.calendarDate.value, ui.calendarZone.value);
      localCalendarIdeas = addLocalCalendarIdea(localCalendarIdeas, idea);
      renderLocalCalendar();
    } catch {
      ui.calendarStatus.textContent = 'Invalid/duplicate time or limit reached; NOTHING SCHEDULED';
    }
  });
  ui.calendarClear.addEventListener('click', () => {
    if (!csrf || ui.form.hidden || ui.dashboard.hidden) return;
    clearLocalCalendar();
  });
  ui.socialDraft.addEventListener('change', clearLocalSocialPreview);
  ui.socialChannel.addEventListener('change', clearLocalSocialPreview);
  ui.socialViewport.addEventListener('change', () => {
    if (!csrf || ui.form.hidden || ui.dashboard.hidden) return clearLocalSocialPreview();
    if (!ui.socialCard.hidden && ['mobile','desktop'].includes(ui.socialViewport.value)) {
      ui.socialCard.dataset.viewport = ui.socialViewport.value;
    }
  });
  ui.socialClear.addEventListener('click', clearLocalSocialPreview);
  function activeLocalSocialSession(epoch) {
    if (epoch !== sessionEpoch || !csrf || ui.form.hidden || ui.dashboard.hidden) return false;
    if (!sessionExpiresAt || Date.now() >= sessionExpiresAt) {
      clearLocalSession();
      return false;
    }
    return true;
  }
  // Share one metadata equality contract between focused rechecks and LOCAL actions.
  // A same-revision source, author, status or content change is NOT authorization.
  function sameLocalSocialDraftMetadata(a, b) {
    const fields = ['id', 'revision', 'title', 'summary', 'source_url',
      'author_label', 'status', 'updated_at'];
    return !!a && !!b && fields.every(key => a[key] === b[key]);
  }
  async function verifyLocalSocialSession(epoch, selectedDraft) {
    if (!activeLocalSocialSession(epoch)) return null;
    try {
      // Reuse the existing authenticated Owner/D1 listing, no new endpoint.
      const result = await api('/local/articles');
      if (!activeLocalSocialSession(epoch)) return null;
      if (!Array.isArray(result.drafts) || result.drafts.length > 100 ||
          (selectedDraft && !result.drafts.some(row =>
            sameLocalSocialDraftMetadata(selectedDraft, row)))) {
        throw new TypeError('Authorized LOCAL draft listing changed');
      }
      return result.drafts;
    } catch {
      if (epoch === sessionEpoch) clearLocalSession();
      return null;
    }
  }
  // Background tabs do not require polling. Recheck on return and before actions.
  const recheckLocalSocialOnFocus = async () => {
    if (!csrf || ui.form.hidden || ui.dashboard.hidden) return;
    const epoch = sessionEpoch;
    const validation = ++focusValidationGeneration;
    const previewGeneration = socialPreviewGeneration;
    const selectedId = ui.socialDraft.value;
    const selectedDraft = lastDrafts.find(row => row.id === selectedId);
    const authorizedDrafts = await verifyLocalSocialSession(epoch);
    if (!authorizedDrafts || validation !== focusValidationGeneration ||
        previewGeneration !== socialPreviewGeneration || !activeLocalSocialSession(epoch) ||
        selectedId !== ui.socialDraft.value) return;

    // Keep the already-visible LOCAL preview only while its exact metadata
    // still matches the latest authenticated Owner/D1 listing.
    const sameDraft = sameLocalSocialDraftMetadata;
    const authorizedSelected = authorizedDrafts.find(row => row.id === selectedId);
    const selectedStale = !!selectedDraft &&
      !sameDraft(selectedDraft, authorizedSelected);

    localEditorialVariants = Object.freeze(localEditorialVariants.filter(row => {
      const previous = lastDrafts.find(draft => draft.id === row.draftId &&
        draft.revision === row.draftRevision);
      const current = authorizedDrafts.find(draft => draft.id === row.draftId &&
        draft.revision === row.draftRevision);
      if (!sameDraft(previous, current)) return false;
      try { requireCanonicalLocalVariant(row, current); return true; }
      catch { return false; }
    }));
    localApprovalEvents = Object.freeze(localApprovalEvents.filter(event => {
      const previous = lastDrafts.find(draft => draft.id === event.variant?.draftId &&
        draft.revision === event.variant?.draftRevision);
      const current = authorizedDrafts.find(draft => draft.id === event.variant?.draftId &&
        draft.revision === event.variant?.draftRevision);
      if (!sameDraft(previous,current)) return false;
      try { requireCanonicalLocalVariant(event.variant,current); return true; }
      catch { return false; }
    }));
    if (!selectedStale) { renderLocalApproval(); return; }
    clearLocalSocialPreview();
    lastDrafts = authorizedDrafts;
    renderDraftList();
    renderLocalSocialChoices();
    ui.socialStatus.textContent = 'LOCAL draft changed or removed · preview cleared';
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) recheckLocalSocialOnFocus();
  });
  window.addEventListener('focus', recheckLocalSocialOnFocus);
  ui.socialGenerate.addEventListener('click', async () => {
    clearLocalSocialPreview();
    if (!csrf || ui.form.hidden || ui.dashboard.hidden) return;
    const draft = lastDrafts.find(row => row.id === ui.socialDraft.value);
    if (!draft) {
      ui.socialStatus.textContent = 'Select a listed LOCAL draft first';
      return;
    }
    const epoch = sessionEpoch;
    const generation = socialActionGeneration;
    const channel = ui.socialChannel.value;
    const authorizedDrafts = await verifyLocalSocialSession(epoch, draft);
    if (!authorizedDrafts || generation !== socialActionGeneration ||
        channel !== ui.socialChannel.value || draft.id !== ui.socialDraft.value) return;
    try {
      const currentDraft = authorizedDrafts.find(row => row.id === draft.id &&
        row.revision === draft.revision);
      let concept = createLocalSocialPreview(currentDraft, channel);
      const saved = getLocalEditorialVariant(localEditorialVariants, currentDraft, channel);
      const defaultText = concept.text.replace(/\nSource reference \(NOT VERIFIED\): [^\n]*$/u,'').trim();
      concept = saved ?? createLocalEditorialVariant(currentDraft, channel, defaultText);
      const card = createLocalSocialCard(concept);
      if (!activeLocalSocialSession(epoch) || generation !== socialActionGeneration) return;
      ui.socialCard.dataset.channel = card.channel;
      ui.socialCard.dataset.viewport = ['mobile','desktop'].includes(ui.socialViewport.value)
        ? ui.socialViewport.value : 'mobile';
      ui.socialCardHeading.textContent = card.heading;
      ui.socialCardFormat.textContent = card.formatLabel;
      ui.socialCardCopy.textContent = card.text;
      ui.socialCardLabels.textContent = card.labels;
      ui.socialCard.hidden = false;
      ui.socialPreviewText.textContent = concept.text;
      ui.socialRights.textContent = concept.channelName + ' · ' + concept.publishingStatus +
        ' · ' + concept.sourceStatus + ' · ' + concept.creditStatus + ' · ' + concept.rights;
      ui.socialPreview.hidden = false;
      ui.variantText.value = concept.editableText;
      ui.variantComposer.hidden = false;
      ui.variantStatus.textContent = saved ? 'Saved in this session only · NOT POSTED' :
        'Generated draft · save explicitly to retain in this session · NOT POSTED';
      renderLocalApproval();
      ui.socialStatus.textContent = 'LOCAL synthetic concept · NOT POSTED';
    } catch {
      clearLocalSocialPreview();
      ui.socialStatus.textContent = 'Invalid or unverified LOCAL draft; no preview created';
    }
  });
  ui.variantSave.addEventListener('click', async () => {
    if (!csrf || ui.form.hidden || ui.dashboard.hidden || ui.variantComposer.hidden) return;
    const draft = lastDrafts.find(row => row.id === ui.socialDraft.value);
    if (!draft) return clearLocalSocialPreview();
    const epoch = sessionEpoch;
    const generation = ++socialActionGeneration;
    const channel = ui.socialChannel.value;
    const editableText = ui.variantText.value;
    const authorizedDrafts = await verifyLocalSocialSession(epoch, draft);
    if (!authorizedDrafts || generation !== socialActionGeneration ||
        draft.id !== ui.socialDraft.value || channel !== ui.socialChannel.value ||
        editableText !== ui.variantText.value || ui.variantComposer.hidden) return;
    try {
      const currentDraft = authorizedDrafts.find(row => row.id === draft.id &&
        row.revision === draft.revision);
      const concept = createLocalEditorialVariant(currentDraft, channel, editableText);
      const next = upsertLocalEditorialVariant(localEditorialVariants, currentDraft,
        channel, concept.editableText, authorizedDrafts);
      const card = createLocalSocialCard(concept);
      if (!activeLocalSocialSession(epoch) || generation !== socialActionGeneration) return;
      const updatedApproval = recordLocalApproval(localApprovalEvents,concept,'SAVE',authorizedDrafts);
      localEditorialVariants = next;
      localApprovalEvents = updatedApproval;
      socialPreviewGeneration += 1;
      ui.socialCardCopy.textContent = card.text;
      ui.socialCardLabels.textContent = card.labels;
      ui.socialPreviewText.textContent = concept.text;
      ui.socialRights.textContent = concept.channelName + ' · ' + concept.publishingStatus +
        ' · ' + concept.sourceStatus + ' · ' + concept.creditStatus + ' · ' + concept.rights;
      ui.variantStatus.textContent = 'Saved in this session only · NOT POSTED';
      ui.approvalReason.value = '';
      renderLocalApproval();
    } catch {
      ui.variantStatus.textContent = 'LOCAL variant rejected: check authorized draft, text length and source · NOT POSTED';
    }
  });
  // Any user edit invalidates an in-flight LOCAL Reset, even if the text is
  // subsequently changed back to its original value before the GET completes.
  ui.variantText.addEventListener('input', () => {
    socialActionGeneration += 1;
    renderLocalApproval();
  });
  ui.variantReset.addEventListener('click', async () => {
    if (!csrf || ui.form.hidden || ui.dashboard.hidden || ui.variantComposer.hidden) return;
    const draft = lastDrafts.find(row => row.id === ui.socialDraft.value);
    if (!draft) return clearLocalSocialPreview();
    const epoch = sessionEpoch;
    const generation = ++socialActionGeneration;
    const channel = ui.socialChannel.value;
    const editableTextAtClick = ui.variantText.value;
    const authorizedDrafts = await verifyLocalSocialSession(epoch, draft);
    if (!authorizedDrafts || generation !== socialActionGeneration ||
        draft.id !== ui.socialDraft.value || channel !== ui.socialChannel.value ||
        editableTextAtClick !== ui.variantText.value || ui.variantComposer.hidden) return;
    if (!activeLocalSocialSession(epoch)) return;
    try {
      const currentDraft = authorizedDrafts.find(row => row.id === draft.id &&
        row.revision === draft.revision);
      const saved = getLocalEditorialVariant(localEditorialVariants,currentDraft,channel);
      const history = saved ? recordLocalApproval(localApprovalEvents,saved,
        'RESET',authorizedDrafts) : localApprovalEvents;
      localEditorialVariants = Object.freeze(localEditorialVariants.filter(row =>
        !(row.draftId === draft.id && row.channel === channel)));
      localApprovalEvents = history;
      ui.socialGenerate.click();
    } catch {
      clearLocalSocialPreview();
      ui.socialStatus.textContent = 'LOCAL reset unavailable; recheck draft';
    }
  });
  async function decideLocalVariant(action) {
    if (!csrf || ui.form.hidden || ui.dashboard.hidden || ui.variantComposer.hidden) return;
    const draft = lastDrafts.find(row => row.id === ui.socialDraft.value);
    if (!draft) return clearLocalSocialPreview();
    const epoch = sessionEpoch;
    const generation = ++socialActionGeneration;
    const channel = ui.socialChannel.value;
    const editableText = ui.variantText.value;
    const reason = action === 'REJECT' ? ui.approvalReason.value : '';
    const authorizedDrafts = await verifyLocalSocialSession(epoch, draft);
    if (!authorizedDrafts || generation !== socialActionGeneration ||
        draft.id !== ui.socialDraft.value || channel !== ui.socialChannel.value ||
        editableText !== ui.variantText.value || ui.variantComposer.hidden ||
        (action === 'REJECT' && reason !== ui.approvalReason.value)) return;
    try {
      const currentDraft = authorizedDrafts.find(row => row.id === draft.id &&
        row.revision === draft.revision);
      const saved = getLocalEditorialVariant(localEditorialVariants,currentDraft,channel);
      if (!saved || saved.editableText !== editableText) throw new TypeError('Unsaved variant');
      const history = recordLocalApproval(localApprovalEvents,saved,action,authorizedDrafts,reason);
      if (!activeLocalSocialSession(epoch) || generation !== socialActionGeneration) return;
      localApprovalEvents = history;
      socialPreviewGeneration += 1;
      ui.approvalReason.value = '';
      renderLocalApproval();
    } catch {
      ui.approvalStatus.textContent = 'LOCAL decision rejected; check saved version and reason · NOT POSTED';
    }
  }
  ui.approvalApprove.addEventListener('click', () => decideLocalVariant('APPROVE'));
  ui.approvalReject.addEventListener('click', () => decideLocalVariant('REJECT'));
  ui.approvalReason.addEventListener('input', () => { socialActionGeneration += 1; });
  ui.search.addEventListener('input', renderDraftList);
  ui.form.addEventListener('input', () => {
    renderDraftPreview();
    showUnsavedChanges();
  });
  ui.login.addEventListener('click', async () => {
    ui.login.disabled = true;
    try {
      if (!window.PublicKeyCredential || !navigator.credentials?.get) {
        throw new Error('Browser passkey APIs are unavailable in this secure test origin');
      }
      const credentialId = ui.id.value.trim();
      const { challenge, rpId } = await api('/local/challenge', 'POST', { credentialId });
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: Uint8Array.from(challenge.match(/.{2}/g), x => parseInt(x, 16)),
          rpId,
          allowCredentials: [{ type: 'public-key', id: decode(credentialId) }],
          userVerification: 'required',
          timeout: 60000,
        },
      });
      if (!assertion) throw new Error('Passkey was not selected');
      const response = assertionJson(assertion);
      const logged = await api('/local/login', 'POST', { credentialId, challenge, response });
      if (!Number.isSafeInteger(logged.expiresInSeconds) ||
          logged.expiresInSeconds < 1 || logged.expiresInSeconds > 1200) {
        throw new TypeError('Invalid LOCAL session expiry');
      }
      csrf = logged.csrf;
      sessionExpiresAt = Date.now() + logged.expiresInSeconds * 1000;
      const authenticatedEpoch = sessionEpoch;
      if (sessionExpiryTimer !== null) clearTimeout(sessionExpiryTimer);
      sessionExpiryTimer = setTimeout(() => {
        if (authenticatedEpoch === sessionEpoch && csrf) clearLocalSession();
      }, logged.expiresInSeconds * 1000);
      ui.form.hidden = false;
      renderDraftPreview();
      acceptSavedDraft();
      ui.logout.hidden = false;
      ui.refresh.hidden = false;
      ui.search.hidden = false;
      ui.devices.hidden = false;
      await refresh();
      await refreshDevices();
      message('Authenticated with a LOCAL test passkey');
    } catch (error) {
      message(error instanceof Error ? error.message : 'Local test login failed');
    } finally { ui.login.disabled = false; }
  });
  ui.refresh.addEventListener('click', () => refresh().catch(() => message('Could not refresh local drafts')));
  ui.history.addEventListener('click', async () => {
    const id = ui.draftId.value;
    if (!id) return;
    try {
      const { revisions } = await api('/local/articles/' + encodeURIComponent(id) + '/revisions');
      ui.historyList.replaceChildren();
      for (const revision of revisions) {
        const item = document.createElement('li');
        item.textContent = 'Revision ' + revision.revision + ' · ' + revision.title;
        ui.historyList.append(item);
      }
      message('Read-only revision history loaded: ' + revisions.length + ' versions');
    } catch { message('Could not load revision history'); }
  });
  ui.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    ui.save.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(ui.form));
      const id = ui.draftId.value;
      const version = Number(ui.revision.value);
      const idempotencyKey = encode(crypto.getRandomValues(new Uint8Array(24)));
      const result = await api(id ? '/local/articles/' + encodeURIComponent(id) : '/local/articles',
        id ? 'PATCH' : 'POST',
        { ...data, idempotencyKey, ...(id ? { expectedRevision: version } : {}) });
      ui.draftId.value = result.id;
      ui.revision.value = String(result.revision);
      ui.save.textContent = 'Save new revision';
      acceptSavedDraft();
      await refresh();
      message('Saved LOCAL draft revision ' + result.revision + '; not published');
    } catch { message('Save rejected; reload draft to resolve possible revision conflict'); }
    finally { ui.save.disabled = false; }
  });
  document.getElementById('new-draft').addEventListener('click', () => {
    if (!confirmDraftDiscard()) return;
    draftOpenGeneration += 1;
    ui.form.reset(); ui.draftId.value = ''; ui.revision.value = '0';
    ui.history.hidden = true;
    ui.historyList.replaceChildren();
    ui.save.textContent = 'Create draft'; renderDraftPreview(); acceptSavedDraft(); message('New unsaved local draft');
  });
  ui.bootstrap.addEventListener('click', async () => {
    ui.bootstrap.disabled = true;
    try {
      const ticket = ui.ticket.value.trim();
      if (!ticket) throw new Error('An operator ticket is required');
      const { challenge, rpId } = await api('/local/bootstrap/challenge', 'POST', { ticket });
      const response = await createPasskey(challenge, rpId);
      const claimed = await api('/local/bootstrap/claim', 'POST', { ticket, challenge, response });
      if (claimed.claimed) {
        ui.id.value = response.id;
        message('First passkey registered locally. Sign in to continue.');
      }
    } catch (error) { message(error instanceof Error ? error.message : 'Local bootstrap failed'); }
    finally { ui.bootstrap.disabled = false; }
  });
  async function enrollDevice(kind, label) {
    const { challenge, rpId } = await api('/local/enroll/challenge', 'POST', { kind });
    const response = await createPasskey(challenge, rpId);
    const result = await api('/local/enroll/claim', 'POST', { challenge, response });
    ui.deviceId.value = result.credentialId;
    message(label + ' registered locally (' + result.deviceKind + ').');
    try {
      await refreshDevices();
    } catch (error) {
      if (error && error.status === 401) {
        clearLocalSession();
        message(label + ' registered. The rotation ended this session; sign in again.');
        return;
      }
      throw error;
    }
  }
  ui.enrollRecovery.addEventListener('click', async () => {
    ui.enrollRecovery.disabled = true;
    try { await enrollDevice('recovery', 'Recovery passkey'); }
    catch (error) { message(error instanceof Error ? error.message : 'Recovery enrollment failed'); }
    finally { ui.enrollRecovery.disabled = false; }
  });
  ui.enrollPrimary.addEventListener('click', async () => {
    ui.enrollPrimary.disabled = true;
    try { await enrollDevice('primary', 'Primary passkey'); }
    catch (error) {
      message(error && error.status === 403
        ? 'Recovery authorization required before replacing a lost primary'
        : error instanceof Error ? error.message : 'Primary enrollment failed');
    } finally { ui.enrollPrimary.disabled = false; }
  });
  ui.authorizeRecovery.addEventListener('click', async () => {
    ui.authorizeRecovery.disabled = true;
    try {
      const credentialId = ui.id.value.trim();
      const { challenge, rpId } = await api('/local/recovery/challenge', 'POST', {});
      const assertion = await navigator.credentials.get({ publicKey: {
        challenge: Uint8Array.from(challenge.match(/.{2}/g), x => parseInt(x, 16)),
        rpId, allowCredentials: [{ type: 'public-key', id: decode(credentialId) }],
        userVerification: 'required', timeout: 60000,
      } });
      if (!assertion) throw new Error('Passkey was not selected');
      await api('/local/recovery/complete', 'POST',
        { challenge, credentialId, response: assertionJson(assertion) });
      message('Recovery authorized for one primary replacement');
    } catch (error) {
      message(error && error.status === 403
        ? 'Recovery authorization requires signing in with the recovery passkey'
        : error instanceof Error ? error.message : 'Recovery authorization failed');
    } finally { ui.authorizeRecovery.disabled = false; }
  });
  ui.revokeDevice.addEventListener('click', async () => {
    ui.revokeDevice.disabled = true;
    try {
      const credentialId = ui.deviceId.value.trim();
      await api('/local/credentials/revoke', 'POST', { credentialId });
      message('Device revoked locally');
      await refreshDevices();
    } catch (error) { message(error instanceof Error ? error.message : 'Device revocation failed'); }
    finally { ui.revokeDevice.disabled = false; }
  });
  ui.emergency.addEventListener('click', async () => {
    ui.emergency.disabled = true;
    try {
      const token = ui.emergencyToken.value.trim();
      const response = await createPasskey(token, location.hostname);
      await api('/local/emergency/claim', 'POST', { token, response });
      clearLocalSession();
      ui.id.value = response.id;
      message('Emergency recovery complete. Sign in with the new primary passkey.');
    } catch (error) { message(error instanceof Error ? error.message : 'Emergency recovery failed'); }
    finally { ui.emergency.disabled = false; }
  });
  ui.logout.addEventListener('click', async () => {
    ui.logout.disabled = true;
    try {
      await api('/local/logout', 'POST', {});
      clearLocalSession();
      message('Local test session ended');
    } catch {
      // Always remove private DOM/unsaved state even if the server refuses logout.
      // HttpOnly cookies cannot be cleared by JS; do not claim server revocation.
      clearLocalSession();
      message('Logout not confirmed. Browser editor cleared; server session may remain active. Close this disposable browser or sign in again.');
    } finally { ui.logout.disabled = false; }
  });
`;

/**
 * Render the disposable LOCAL CMS test fixture with a strict per-request CSP nonce.
 * No private owner UI is imported by public Astro routes.
 * @param {string} nonce Fresh 256-bit lowercase-hex CSP nonce.
 * @returns {string} Restricted HTML with ephemeral in-memory editorial controls.
 */
export function renderLocalCmsUi(nonce) {
  if (typeof nonce !== 'string' || !/^[0-9a-f]{64}$/.test(nonce)) {
    throw new TypeError('Local UI requires a fresh 256-bit CSP nonce');
  }
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>CoinBlink · Local CMS Test Workspace</title>
<style nonce="${nonce}">
:root{color-scheme:dark;font-family:system-ui,sans-serif}
body{margin:0;background:#0d1815;color:#eaf3e8;line-height:1.5}
main{max-width:980px;margin:auto;padding:28px 18px}
h1{font-size:1.7rem;margin:0}h2{font-size:1.2rem}
p{color:#b9c8bd}.banner{background:#222f26;border:1px solid #536b4c;padding:12px;margin:18px 0}
fieldset{border:1px solid #536b4c;border-radius:9px;padding:18px;margin:16px 0}
label{display:block;margin:12px 0;font-weight:600}
input,textarea{display:block;width:100%;box-sizing:border-box;margin-top:5px;background:#13211a;border:1px solid #768977;border-radius:5px;padding:10px;color:#fff;font:inherit}
textarea{min-height:145px}
button{background:#bde874;color:#14210d;border:0;border-radius:5px;padding:10px 15px;margin:5px 5px 5px 0;cursor:pointer;font:inherit}
button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid #f7f6a5}
select{display:block;max-width:100%;margin:6px 0 12px;padding:10px;border:1px solid #768977;border-radius:5px;background:#13211a;color:#fff;font:inherit}
button:disabled{opacity:.45}
ul{padding-left:20px}li{margin:6px 0}
.draft-preview{margin-top:18px;padding:14px;border:1px solid #768977;border-radius:9px;background:#172820}
 .draft-preview p{white-space:pre-wrap;overflow-wrap:anywhere}
.m06-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:12px}
.m06-card{border:1px solid #536b4c;border-radius:8px;padding:12px;background:#172820}
.m06-card h3{margin:0 0 6px;font-size:1rem}
.m06-card strong{display:block;color:#c6f29c;overflow-wrap:anywhere}
.m06-card small{color:#d7c68f}
.m07-calendar-item{max-width:100%;border:1px solid #768977;border-radius:8px;background:#172820;padding:12px;overflow-wrap:anywhere;margin:8px 0}
.m07-calendar-item p{white-space:pre-wrap;overflow-wrap:anywhere}
.m07-calendar-item small{display:block;color:#d5e6c6}
.m07-calendar-editor{box-sizing:border-box;min-width:0;max-width:100%}
.m07-calendar-editor[hidden]{display:none}
.m07-copy-panel{box-sizing:border-box;min-width:0;max-width:100%;border:1px solid #768977;border-radius:8px}
.m07-copy-panel[hidden]{display:none}
.m07-calendar-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px}
.m07-calendar-controls label{display:block}
.m07-calendar-controls input,.m07-calendar-controls select{max-width:100%;box-sizing:border-box}
.m07-week{margin:16px 0;border-top:1px solid #768977;padding-top:10px}
.m07-week h5{font-size:1rem;margin:8px 0}
.m07-week-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:8px}
.m07-week-day{box-sizing:border-box;min-width:0;border:1px solid #768977;border-radius:8px;background:#172820;padding:9px;overflow-wrap:anywhere}
.m07-week-day h6{font-size:.9rem;margin:0 0 8px}
.m07-week-idea{white-space:pre-wrap;overflow-wrap:anywhere;padding:6px;border-left:3px solid #bde874}
.m07-week-open{max-width:100%;text-align:left;white-space:normal;overflow-wrap:anywhere}
.m07-week-conflict{border-left-color:#f2bd7d;font-weight:600}
.m07-concept{white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid #768977;border-radius:8px;padding:14px;background:#172820}
#m07-variant-composer{border:1px solid #536b4c;padding:12px;border-radius:8px;margin:12px 0}
#m07-variant-composer[hidden]{display:none}
.m07-stage{display:flex;align-items:flex-start;max-width:100%;overflow-wrap:anywhere;padding:12px 0}
.m07-card{box-sizing:border-box;min-width:0;width:100%;max-width:600px;border-radius:16px;border:2px solid #81988e;background:#142821;color:#f6f8f5;padding:20px;overflow-wrap:anywhere}
.m07-card[hidden]{display:none}
.m07-card[data-viewport="mobile"]{max-width:345px}
.m07-card[data-viewport="desktop"]{max-width:600px}
.m07-card p{color:inherit}
.m07-card[data-channel="x"]{border-radius:14px;background:#101719;border-color:#94a5a4}
.m07-card[data-channel="instagram"]{border-radius:22px;background:#302132;border-color:#c19ab9}
.m07-card[data-channel="tiktok"]{border-radius:10px;background:#182633;border-color:#8dc0ce;max-width:425px}
.m07-card[data-channel="tiktok"][data-viewport="mobile"]{max-width:300px}
.m07-card-top{font-size:.85rem;letter-spacing:.03em;font-weight:700}
.m07-card-copy{white-space:pre-wrap;overflow-wrap:anywhere;margin:14px 0;padding:12px;border-left:3px solid #bde874}
.m07-card[data-channel="instagram"] .m07-card-copy{border-left-color:#e7b9e0}
.m07-card[data-channel="tiktok"] .m07-card-copy{border-left-color:#92dff0}
.m07-card-labels{font-size:.79rem;line-height:1.65;border-top:1px solid #b9c8bd;padding-top:12px;overflow-wrap:anywhere}
.m07-card-note{font-size:.85rem;font-weight:700}
@media (max-width:430px){.m07-card{padding:14px}.m07-stage{padding:8px 0}}
footer{padding:24px 0;color:#b9c8bd}
</style>
</head><body>
<main>
<h1>CoinBlink · Local CMS Test Workspace</h1>
<p class="banner" role="note">LOCAL TEST ONLY. Bootstrap, devices, recovery and drafts are synthetic and stored only in a disposable LOCAL D1. No real Owner setup, publishing, cloud save, or production credentials.</p>
<fieldset id="bootstrap-panel"><legend>First Owner bootstrap (local test)</legend>
<label for="ticket">Offline operator ticket (one use)</label>
<input id="ticket" autocomplete="off" spellcheck="false" maxlength="64">
<button id="bootstrap" type="button">Create first passkey</button>
</fieldset>
<fieldset><legend>Test passkey sign-in</legend>
<label for="credential">Local test credential ID (base64url)</label>
<input id="credential" autocomplete="off" spellcheck="false" maxlength="256" required>
<button id="login" type="button">Sign in with test passkey</button>
<button id="logout" type="button" hidden>Sign out</button>
<p id="session-status">Not authenticated</p>
</fieldset>
<fieldset id="devices" hidden><legend>Test devices and recovery</legend>
<button id="enroll-recovery" type="button">Add recovery passkey</button>
<button id="enroll-primary" type="button">Add replacement primary passkey</button>
<button id="authorize-recovery" type="button">Authorize recovery with this passkey</button>
<label for="device-id">Device credential ID</label>
<input id="device-id" autocomplete="off" spellcheck="false" maxlength="256">
<button id="revoke-device" type="button">Revoke device</button>
<ul id="device-list" aria-label="Owner devices"></ul>
<p><a id="workspace-link" href="/local/workspace">Open the protected local workspace page</a></p>
</fieldset>
<fieldset id="emergency-panel"><legend>Emergency recovery (both devices lost)</legend>
<label for="emergency-token">Offline operator authorization token</label>
<input id="emergency-token" autocomplete="off" spellcheck="false" maxlength="64">
<button id="emergency" type="button">Recover with emergency authorization</button>
</fieldset>
<p id="message" role="status" aria-live="polite">Only disposable local data is permitted.</p>
<section id="m06-dashboard" aria-label="Local Owner dashboard" hidden>
<h2>M06 · LOCAL Owner command center · read-only</h2>
<p>Visible only after an authorized test-passkey session and a successful LOCAL D1 draft read. No production analytics, publishing, external services or new API.</p>
<div class="m06-grid">
<div class="m06-card"><h3>Listed drafts (up to 100)</h3><strong id="m06-listed-drafts">Unavailable</strong><small>MEASURED_LOCAL · CMS_D1_LOCAL</small></div>
<div class="m06-card"><h3>Published news</h3><strong>NOT_CONNECTED</strong><small>No verified publication feed</small></div>
<div class="m06-card"><h3>Source reuse rights</h3><strong>NOT_CLEARED</strong><small>No licensed ingestion</small></div>
<div class="m06-card"><h3>Market quotes</h3><strong>UNAVAILABLE</strong><small>No live market provider</small></div>
<div class="m06-card"><h3>Publishing</h3><strong>DISABLED</strong><small>Read-only local test</small></div>
</div>
<p>Observed after last authorized read (UTC): <time id="m06-measured-at">Unavailable</time></p>
<section id="m06-activity" aria-labelledby="m06-activity-title">
<h3 id="m06-activity-title">Recent LOCAL editorial activity · read-only</h3>
<p>From the authenticated D1 list only; not public reporting, traffic or publishing data.</p>
<p>Measurement status: <strong id="m06-activity-status">UNAVAILABLE</strong> · Listing scope: <strong id="m06-activity-scope">UNAVAILABLE</strong></p>
<p>Listed drafts with revisions above 1: <strong id="m06-revised-listed">Unavailable</strong></p>
<p>Latest listed edit (UTC): <time id="m06-last-edited">Unavailable</time></p>
<h4>Five most recently edited LOCAL drafts (at most)</h4>
<ol id="m06-recent-activity" aria-label="Recent private LOCAL draft activity"></ol>
</section>
<section id="m06-insights" aria-labelledby="m06-insights-title">
<h3 id="m06-insights-title">LOCAL editorial command center · private, read-only</h3>
<p>Only up to 100 authenticated LOCAL D1 draft rows. No public audience, revenue, editorial verification or publication reporting. All timestamps UTC.</p>
<p>Status: <strong id="m06-insights-status">UNAVAILABLE</strong> · Listing scope: <strong id="m06-insights-scope">UNAVAILABLE</strong></p>
<div class="m06-grid" aria-label="Private LOCAL editorial workload">
<div class="m06-card"><h4>Missing author credits</h4><strong id="m06-insights-missing">Unavailable</strong><small>Draft metadata only</small></div>
<div class="m06-card"><h4>No edit for 7+ days</h4><strong id="m06-insights-older">Unavailable</strong><small>Not a publishing deadline</small></div>
<div class="m06-card"><h4>Last edited in 24h</h4><strong id="m06-insights-recent">Unavailable</strong><small>Not readers or visits</small></div>
</div>
<h4>Drafts by UTC day of most recent edit · trailing 7 calendar days</h4>
<ol id="m06-insights-trend" aria-label="Private seven-day LOCAL editorial activity"></ol>
<p>Source verification remains pending; no reuse or publishing approval is inferred.</p>
</section>
<section id="m06-review" aria-labelledby="m06-review-title">
<h3 id="m06-review-title">LOCAL editorial review queue · read-only</h3>
<p>Only listed test drafts. An HTTPS source URL does not verify the publisher, licence or reuse rights. All sources require independent verification; nothing is approved for publication.</p>
<label for="m06-review-filter">Filter listed LOCAL drafts</label>
<select id="m06-review-filter">
<option value="all">All listed drafts</option>
<option value="missing-credit">Missing author credit</option>
<option value="revised">Revised drafts (revision above 1)</option>
<option value="older-seven-days">No edit for 7+ days</option>
</select>
<p role="status" aria-live="polite">Visible: <strong id="m06-review-count">UNAVAILABLE</strong> · scope: <strong id="m06-review-scope">UNAVAILABLE</strong></p>
<ul id="m06-review-list" aria-label="Private LOCAL editorial review queue"></ul>
</section>
<section id="m06-triage" aria-labelledby="m06-triage-title">
<h3 id="m06-triage-title">Owner editorial attention desk · private LOCAL triage</h3>
<p>Priorities order only the already-authenticated draft listing. Not a risk score, licence, source verification, sign-off or publishing permission.</p>
<p>Status: <strong id="m06-triage-status">UNAVAILABLE</strong> · scope: <strong id="m06-triage-scope">UNAVAILABLE</strong></p>
<div class="m06-grid" aria-label="Private LOCAL attention counts">
<div class="m06-card"><h4>Missing credits (listed)</h4><strong id="m06-triage-credit">Unavailable</strong></div>
<div class="m06-card"><h4>No edit for 7+ full days</h4><strong id="m06-triage-aged">Unavailable</strong></div>
<div class="m06-card"><h4>Both reasons (listed)</h4><strong id="m06-triage-both">Unavailable</strong></div>
</div>
<label for="m06-triage-filter">Show LOCAL attention items</label>
<select id="m06-triage-filter">
<option value="all">All listed drafts, highest attention first</option>
<option value="missing-credit">Missing author credit</option>
<option value="aged">No edit for 7+ days</option>
<option value="both">Missing credit and 7+ days</option>
</select>
<p role="status" aria-live="polite">Visible: <strong id="m06-triage-count">UNAVAILABLE</strong></p>
<ol id="m06-triage-list" aria-label="Private LOCAL attention order"></ol>
<p>Every source still needs human verification; every item remains a draft. This view is limited to at most 100 listed rows.</p>
</section>
<section id="m07-social" aria-labelledby="m07-title">
<h3 id="m07-title">M07 · LOCAL Social Studio (text-only sandbox)</h3>
<p>Private previews for illustrative X, Instagram and TikTok layouts. Never approved, scheduled, posted or shared. A source URL does not establish licensing or reuse rights.</p>
<label for="m07-draft">Authenticated draft from LOCAL D1 listing</label>
<select id="m07-draft"><option value="">Choose an authenticated LOCAL draft</option></select>
<label for="m07-channel">Illustrative channel format, not a provider integration</label>
<select id="m07-channel">
<option value="x">X concept</option>
<option value="instagram">Instagram concept</option>
<option value="tiktok">TikTok storyboard text</option>
</select>
<label for="m07-viewport">Illustrative preview size (not a provider specification)</label>
<select id="m07-viewport">
<option value="mobile">Mobile concept</option>
<option value="desktop">Desktop concept</option>
</select>
<button id="m07-generate" type="button">Generate LOCAL preview</button>
<button id="m07-clear" type="button">Clear LOCAL preview</button>
<section id="m07-variant-composer" aria-label="Independent synthetic channel editor" hidden>
<label for="m07-variant-text">Edit only the selected channel's fictitious message (source and rights remain fixed)</label>
<textarea id="m07-variant-text" maxlength="1600" minlength="8" autocomplete="off" spellcheck="true"></textarea>
<button id="m07-variant-save" type="button">Save this channel in LOCAL memory</button>
<button id="m07-variant-reset" type="button">Reset only this channel</button>
<p id="m07-variant-status" role="status" aria-live="polite">No editable LOCAL variant</p>
<section id="m07-approval-panel" aria-label="LOCAL channel editorial review and audit" hidden>
<h4>Saved-version editorial decision · LOCAL only</h4>
<p>APPROVED FOR LOCAL EDITORIAL REVIEW ONLY never clears rights, posts or schedules. Save first; this session-only history disappears on refresh or sign-out.</p>
<label for="m07-approval-reason">Rejection reason (8 to 240 characters required)</label>
<textarea id="m07-approval-reason" minlength="8" maxlength="240" autocomplete="off" required></textarea>
<button id="m07-approval-approve" type="button" disabled>Approve saved LOCAL version</button>
<button id="m07-approval-reject" type="button" disabled>Reject saved LOCAL version</button>
<p id="m07-approval-status" role="status" aria-live="polite">No LOCAL editorial decision</p>
<h5>Selected channel · session-only audit</h5>
<ol id="m07-approval-audit" aria-label="LOCAL editorial decision history"></ol>
</section>
</section>
<p id="m07-status" role="status" aria-live="polite">No LOCAL social preview</p>
<section id="m07-preview" aria-label="Private LOCAL social preview" hidden>
<p id="m07-rights">UNAVAILABLE</p>
<div class="m07-stage">
<article id="m07-card" class="m07-card" aria-labelledby="m07-card-heading" hidden>
<p class="m07-card-top">UNOFFICIAL · LOCAL DEMO · NOT A REAL SOCIAL POST</p>
<h4 id="m07-card-heading"></h4>
<p id="m07-card-format"></p>
<p id="m07-card-copy" class="m07-card-copy"></p>
<p id="m07-card-labels" class="m07-card-labels"></p>
<p class="m07-card-note">NO POSTING · NO MEDIA UPLOAD · NO PROVIDER AUTH</p>
</article>
</div>
<h4>Text-only accessible version</h4>
<pre id="m07-preview-text" class="m07-concept"></pre>
<p>NO POSTING · NO MEDIA UPLOAD · NO PROVIDER AUTH · NO PUBLICATION</p>
</section>
<section id="m07-calendar" aria-labelledby="m07-calendar-title">
<h3 id="m07-calendar-title">M07 · Hypothetical LOCAL editorial ideas calendar</h3>
<p>MEMORY ONLY · NOT SCHEDULED · NOT POSTED. All selected times are fictional. No real provider or automated scheduling.</p>
<p>Use the authenticated LOCAL draft and channel selectors above. All source rights remain unverified.</p>
<div class="m07-calendar-controls">
<label for="m07-calendar-date">Hypothetical local date and time
<input id="m07-calendar-date" type="datetime-local" step="60" autocomplete="off"></label>
<label for="m07-calendar-zone">Time zone for this fictional concept
<select id="m07-calendar-zone">
<option value="America/Sao_Paulo">São Paulo</option>
<option value="UTC">UTC</option>
<option value="America/New_York">New York (DST validation demo)</option>
</select></label>
</div>
<button id="m07-calendar-add" type="button">Add hypothetical concept</button>
<button id="m07-calendar-clear" type="button">Clear all concepts</button>
<p id="m07-calendar-status" role="status" aria-live="polite">0 hypothetical concepts · memory only · NOT SCHEDULED</p>
<ol id="m07-calendar-list" aria-label="Private hypothetical editorial calendar"></ol>
<section id="m07-weekly" aria-labelledby="m07-week-title">
<h4 id="m07-week-title">M07-D · Read-only hypothetical weekly board</h4>
<p>MEMORY ONLY · NOT SCHEDULED · NOT POSTED. Conflicts are informational and never trigger scheduling.</p>
<div class="m07-calendar-controls">
<label for="m07-week-zone">Time zone for the weekly display
<select id="m07-week-zone">
<option value="America/Sao_Paulo">São Paulo</option>
<option value="UTC">UTC</option>
<option value="America/New_York">New York</option>
</select></label>
<label for="m07-week-filter">Filter hypothetical ideas by channel
<select id="m07-week-filter">
<option value="all">All channels</option>
<option value="x">X</option>
<option value="instagram">Instagram</option>
<option value="tiktok">TikTok</option>
</select></label>
</div>
<p id="m07-week-status" role="status" aria-live="polite">0 shown · 0 conflicts · NOT SCHEDULED</p>
<div id="m07-week-board" aria-label="Private weekly hypothetical editorial board"></div>
</section>
</section>
</section>
</section>
<section aria-label="Draft editor">
<h2>Drafts</h2><button id="refresh" type="button" hidden>Refresh drafts</button>
<label for="draft-search">Filter local drafts by headline
<input id="draft-search" type="search" maxlength="100" autocomplete="off" placeholder="Search local draft titles" hidden></label>
<ul id="items" aria-label="Saved local drafts"></ul>
<form id="draft" hidden>
<fieldset><legend>Create or revise a local draft</legend>
<input id="draft-id" name="draftId" type="hidden"><input id="revision" type="hidden" value="0">
<label>Headline<input name="title" minlength="8" maxlength="140" required></label>
<label>Summary<textarea name="summary" minlength="20" maxlength="400" required></textarea></label>
<label>Article body<textarea name="body" maxlength="40000" required></textarea></label>
<label>HTTPS original source<input name="sourceUrl" type="url" maxlength="500" required></label>
<label>Author credit<input name="authorLabel" maxlength="80"></label>
<button id="save" type="submit">Create draft</button>
<button id="new-draft" type="button">New draft</button>
<p id="unsaved-draft-status" role="status" aria-live="polite" hidden>Unsaved changes in this LOCAL draft.</p>
<button id="history" type="button" hidden>View revision history</button>
<ul id="history-list" aria-label="Read-only draft revision history"></ul>
<section id="draft-preview" class="draft-preview" aria-labelledby="draft-preview-label" hidden>
<h3 id="draft-preview-label">Private draft preview · LOCAL only, not published</h3>
<h4 id="draft-preview-title"></h4>
<p id="draft-preview-summary"></p>
<p id="draft-preview-body"></p>
<p id="draft-preview-source"></p>
</section>
</fieldset></form></section>
<footer>Test data only · no publication capability · server-side authorization required on every request.</footer>
</main>
<script nonce="${nonce}" type="module">${LOCAL_CMS_UI_SCRIPT}</script>
</body></html>`;
}
