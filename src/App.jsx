import React, { useState, useEffect, useMemo, useRef } from "react";

/* =========================================================================
   AMARÉ — a premium beginner-to-strong fitness companion
   Clean rebuild: isolated storage key (amareV2_appData), debounced + immediate
   + periodic-safety-net saves, read-back verification, always-visible sync
   status strip, and manual Export/Import as a backup path. Starts empty.
   ========================================================================= */

const FONT_LINK = "Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700";

const COLORS = {
  cream: "#FBF6EF", creamDeep: "#F3EBDF", blush: "#F4DCE0",
  rose: "#C98A93", roseDark: "#A9707B", lavender: "#E5DCF1",
  lavenderDeep: "#C6B4DE", sage: "#A9B79C", sageDeep: "#8AA07C",
  gold: "#C6A25D", charcoal: "#3A332F", charcoalSoft: "#7A716A", white: "#FFFFFF",
};

/* ---------------------------- Exercise library --------------------------- */
const EXERCISES = {
  march: { name: "Standing March", pose: "march", cat: "Mobility", muscles: "Full body, warm-up",
    cues: "Stand tall, lift knees to hip height, swing arms naturally.", mistake: "Rushing the tempo — keep it controlled." },
  armCircle: { name: "Arm Circles", pose: "armCircle", cat: "Mobility", muscles: "Shoulders, warm-up",
    cues: "Small circles growing larger, keep shoulders relaxed.", mistake: "Shrugging shoulders up toward ears." },
  hipCircle: { name: "Hip Circles", pose: "hipCircle", cat: "Mobility", muscles: "Hips, warm-up",
    cues: "Hands on hips, slow controlled circles both directions.", mistake: "Moving too fast to feel the stretch." },
  gobletSquat: { name: "Goblet Squat", pose: "squat", cat: "Lower Body", muscles: "Quads, Glutes",
    home: "Dumbbell Goblet Squat", gym: "Goblet / Smith Machine Squat", trackWeight: true,
    cues: "Chest up, sit back and down, knees track over toes.", mistake: "Letting knees cave inward.",
    alternatives: ["Bodyweight Squat", "Chair Squat", "Leg Press"] },
  bulgarianSplitSquat: { name: "Bulgarian Split Squat", pose: "squat", cat: "Lower Body", muscles: "Quads, Glutes (unilateral)",
    home: "Bulgarian Split Squat, rear foot elevated", gym: "Smith Machine Split Squat", trackWeight: true,
    cues: "Rear foot elevated on a chair or bench, drop straight down, front knee tracks over toes.",
    mistake: "Leaning too far forward and losing balance.", alternatives: ["Goblet Squat", "Step-Up"] },
  gluteBridge: { name: "Glute Bridge", pose: "bridge", cat: "Glutes", muscles: "Glutes, Hamstrings",
    home: "Banded Glute Bridge", gym: "Hip Thrust Machine", trackWeight: true,
    cues: "Squeeze glutes at the top, ribs down, avoid arching low back.", mistake: "Overextending the lower back at the top.",
    alternatives: ["Dumbbell Hip Thrust", "Single-Leg Bridge"] },
  hipThrust: { name: "Hip Thrust", pose: "bridge", cat: "Glutes", muscles: "Glutes, Hamstrings",
    home: "Dumbbell Hip Thrust, shoulders on a bench", gym: "Hip Thrust Machine", trackWeight: true,
    cues: "Drive through heels, full lockout at the top, chin tucked slightly.", mistake: "Not reaching full hip extension.",
    alternatives: ["Glute Bridge", "Single-Leg Hip Thrust"] },
  rdl: { name: "Romanian Deadlift", pose: "hinge", cat: "Lower Body", muscles: "Hamstrings, Glutes",
    home: "Dumbbell Romanian Deadlift", gym: "Barbell Romanian Deadlift", trackWeight: true,
    cues: "Hinge at the hips, soft knees, weight glides down the shins.", mistake: "Rounding the back instead of hinging.",
    alternatives: ["Kickstand RDL", "Cable Pull-Through"] },
  lateralWalk: { name: "Banded Lateral Walk", pose: "lateral", cat: "Glutes", muscles: "Glutes, Hips",
    home: "Mini Band Lateral Walk", gym: "Cable Abduction",
    cues: "Slight knee bend, step wide and controlled, stay low.", mistake: "Standing up tall — keep tension in the band.",
    alternatives: ["Side-Lying Leg Raise", "Cable Abduction"] },
  kickback: { name: "Standing Kickback", pose: "kickback", cat: "Glutes", muscles: "Glutes",
    home: "Standing Banded Kickback", gym: "Cable Kickback",
    cues: "Hinge slightly forward, drive heel back and up, squeeze.", mistake: "Using momentum instead of glute squeeze.",
    alternatives: ["Quadruped Kickback"] },
  dbRow: { name: "Dumbbell Row", pose: "row", cat: "Back", muscles: "Back, Biceps",
    home: "Dumbbell Row (bench or chair)", gym: "Seated Cable Row", trackWeight: true,
    cues: "Flat back, pull elbow to hip, squeeze shoulder blade.", mistake: "Twisting the torso to pull the weight up.",
    alternatives: ["Supported Row", "Resistance Band Row"] },
  latPulldown: { name: "Lat Pulldown", pose: "row", cat: "Back", muscles: "Back, Biceps",
    home: "Band Lat Pulldown", gym: "Lat Pulldown Machine", trackWeight: true,
    cues: "Pull to collarbone, lead with the elbows, control the return.", mistake: "Leaning back excessively to move more weight.",
    alternatives: ["Dumbbell Row"] },
  shoulderPress: { name: "Shoulder Press", pose: "press", cat: "Shoulders", muscles: "Shoulders, Triceps",
    home: "Dumbbell Shoulder Press", gym: "Machine Shoulder Press", trackWeight: true,
    cues: "Press straight overhead, ribs down, avoid arching back.", mistake: "Flaring elbows too wide too fast.",
    alternatives: ["Seated Band Press"] },
  bicepCurl: { name: "Bicep Curl", pose: "curl", cat: "Arms", muscles: "Biceps",
    home: "Dumbbell Bicep Curl", gym: "Cable Curl", trackWeight: true,
    cues: "Elbows pinned to sides, slow controlled curl.", mistake: "Swinging the whole body for momentum.",
    alternatives: ["Band Curl"] },
  tricepExt: { name: "Overhead Tricep Extension", pose: "tricep", cat: "Arms", muscles: "Triceps",
    home: "Dumbbell Overhead Extension", gym: "Cable Overhead Extension", trackWeight: true,
    cues: "Elbows close to head, lower slow, extend fully.", mistake: "Letting elbows flare outward.",
    alternatives: ["Band Pressdown"] },
  deadBug: { name: "Dead Bug", pose: "deadbug", cat: "Core", muscles: "Core (neck-friendly)",
    cues: "Low back pressed to floor, extend opposite arm and leg slowly.", mistake: "Letting the low back arch off the floor.",
    alternatives: ["Heel Taps", "Bird Dog"] },
  birdDog: { name: "Bird Dog", pose: "birddog", cat: "Core", muscles: "Core (neck-friendly)",
    cues: "Neutral spine, extend opposite arm and leg, keep hips level.", mistake: "Letting the hips rotate open.",
    alternatives: ["Dead Bug", "Standing Marches"] },
  sidePlank: { name: "Side Plank (from knees)", pose: "sideplank", cat: "Core", muscles: "Core, Obliques (neck-friendly)",
    cues: "Stack shoulders and hips, long line from head to knee, neck relaxed.", mistake: "Letting hips sag toward the floor.",
    alternatives: ["Modified Plank", "Pallof Press"] },
  cooldownStretch: { name: "Standing Forward Fold", pose: "stretch", cat: "Mobility", muscles: "Cooldown, hamstrings",
    cues: "Soft knees, let the head and neck hang heavy, breathe slowly.", mistake: "Locking the knees." },
};

const WARMUP = [{ id: "march", sets: 1, reps: "45 sec" }, { id: "armCircle", sets: 1, reps: "20 sec each way" }, { id: "hipCircle", sets: 1, reps: "20 sec each way" }];
const COOLDOWN = [{ id: "cooldownStretch", sets: 1, reps: "60 sec" }];

const DAY_TITLES = { d1: "Lower Body + Glutes", d2: "Upper Body + Back + Arms", d3: "Full Body + Glutes", mobility: "Mobility & Recovery" };
const WEEK_SCHEDULE = ["d1", "mobility", "d2", "rest", "d3", "mobility", "rest"];
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const BASE_DAYS = {
  d1: [
    { id: "gobletSquat", advancedId: "bulgarianSplitSquat", baseSets: 2, baseReps: 8, rest: 60 },
    { id: "gluteBridge", advancedId: "hipThrust", baseSets: 2, baseReps: 10, rest: 45 },
    { id: "rdl", baseSets: 2, baseReps: 8, rest: 60 },
    { id: "lateralWalk", baseSets: 2, baseReps: "10 each side", rest: 45 },
    { id: "kickback", baseSets: 2, baseReps: "10 each side", rest: 45 },
  ],
  d2: [
    { id: "dbRow", advancedId: "latPulldown", baseSets: 2, baseReps: 10, rest: 60 },
    { id: "shoulderPress", baseSets: 2, baseReps: 8, rest: 60 },
    { id: "bicepCurl", baseSets: 2, baseReps: 10, rest: 45 },
    { id: "tricepExt", baseSets: 2, baseReps: 10, rest: 45 },
  ],
  d3: [
    { id: "gobletSquat", advancedId: "bulgarianSplitSquat", baseSets: 2, baseReps: 10, rest: 60 },
    { id: "dbRow", advancedId: "latPulldown", baseSets: 2, baseReps: 10, rest: 60 },
    { id: "gluteBridge", advancedId: "hipThrust", baseSets: 2, baseReps: 12, rest: 45 },
    { id: "deadBug", baseSets: 2, baseReps: "8 each side", rest: 30 },
    { id: "birdDog", baseSets: 2, baseReps: "8 each side", rest: 30 },
  ],
  mobility: [
    { id: "hipCircle", baseSets: 2, baseReps: "30 sec each way", rest: 15 },
    { id: "sidePlank", baseSets: 2, baseReps: "20 sec each side", rest: 30 },
    { id: "cooldownStretch", baseSets: 1, baseReps: "90 sec", rest: 0 },
  ],
};

const PHASES = [
  { id: 1, name: "Start", tagline: "Your only goal right now is to show up.", weeks: [1, 2], icon: "🌱" },
  { id: 2, name: "Foundation", tagline: "Build movement confidence.", weeks: [3, 4], icon: "🌿" },
  { id: 3, name: "Build", tagline: "Start getting noticeably stronger.", weeks: [5, 8], icon: "🌸" },
  { id: 4, name: "Strength", tagline: "Develop real strength.", weeks: [9, 12], icon: "✨" },
];
const PHASE5_FOCUSES = [
  { id: "glutes", label: "Glute & Lower Body", icon: "🍑" }, { id: "strength", label: "Strength", icon: "💪" },
  { id: "tone", label: "Tone & Definition", icon: "✨" }, { id: "endurance", label: "Endurance", icon: "🏃" },
  { id: "mobility", label: "Mobility", icon: "🧘" }, { id: "fullbody", label: "Full Body", icon: "🔥" },
  { id: "balanced", label: "Balanced Fitness", icon: "⚖️" },
];

function phaseForWeek(week) {
  if (week <= 2) return PHASES[0];
  if (week <= 4) return PHASES[1];
  if (week <= 8) return PHASES[2];
  if (week <= 12) return PHASES[3];
  return { id: 5, name: "Continued Progress", tagline: "Becoming stronger than yesterday.", weeks: [13, 99], icon: "🔥" };
}

function buildDayExercises(dayId, week, deload) {
  const phase = phaseForWeek(week);
  const advanced = phase.id >= 3;
  const base = BASE_DAYS[dayId] || [];
  const deloadFactor = deload ? 1 : 0;
  return base.map((e) => {
    const exId = advanced && e.advancedId ? e.advancedId : e.id;
    let sets = Math.min(4, e.baseSets + Math.floor((week - 1) / 4)) - deloadFactor;
    sets = Math.max(1, sets);
    let reps = e.baseReps;
    if (typeof e.baseReps === "number") {
      reps = Math.min(e.baseReps + Math.floor((week - 1) / 2), e.baseReps + 6);
      if (deload) reps = Math.max(e.baseReps, reps - 2);
    }
    return { id: exId, sets, reps, rest: e.rest };
  });
}

function buildDay(dayId, week, deload) {
  const phase = phaseForWeek(week);
  const isMobility = dayId === "mobility";
  const minutes = isMobility ? 15 : Math.min(50, 22 + phase.id * 5);
  return { id: dayId, title: DAY_TITLES[dayId], minutes, exercises: buildDayExercises(dayId, week, deload) };
}

const AFFIRMATIONS = [
  "Showing up is an act of self-love.", "You don't have to be perfect to make progress.",
  "Your future self will thank you.", "Small promises kept become confidence.",
  "You are building trust with yourself.", "Strength takes time. You're allowed to grow.",
  "Yesterday doesn't define today.",
];
const LEVELS = [
  { min: 0, icon: "🌱", label: "Starting" }, { min: 5, icon: "🌿", label: "Building" },
  { min: 12, icon: "🌸", label: "Growing" }, { min: 24, icon: "✨", label: "Stronger" },
  { min: 40, icon: "🔥", label: "Powerful" }, { min: 60, icon: "👑", label: "Strong & Consistent" },
];
const MASTERY_LEVELS = [{ min: 0, icon: "○", label: "Learning" }, { min: 3, icon: "◐", label: "Comfortable" }, { min: 7, icon: "●", label: "Confident" }, { min: 14, icon: "★", label: "Strong" }];

function todayISO() { return new Date().toISOString().slice(0, 10); }
function dayOfWeekIdx(d = new Date()) { const j = d.getDay(); return j === 0 ? 6 : j - 1; }
function fmtDate(iso) { return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric" }); }
function currentLevel(count) { let l = LEVELS[0]; for (const x of LEVELS) if (count >= x.min) l = x; return l; }
function masteryFor(count) { let l = MASTERY_LEVELS[0]; for (const x of MASTERY_LEVELS) if (count >= x.min) l = x; return l; }
function daysBetween(a, b) { return Math.floor((new Date(b) - new Date(a)) / 86400000); }

const DEFAULT_PROFILE = {
  onboarded: true, name: "", level: "Complete Beginner", goals: [], location: "both", schedule: 3,
  age: "", height: "", weight: "", goalWeight: "", units: "lbs",
  notifications: { workoutReminder: true, streakReminder: true, weeklyProgress: true, encouragement: true },
  connections: { appleHealth: false, appleWatch: false, smartScale: false },
};
const DEFAULT_ACTIVITY = {
  history: [], weightLog: [], measurements: [], exWeights: {}, exCounts: {}, prs: {},
  startDate: null, lastFeelings: [], weekReviews: [], lastPhaseSeen: null, deload: false, focus: null,
};

/* ------------------------------ Storage helpers ---------------------------- */
// Real browser localStorage — works normally outside the artifact sandbox (e.g. in Claude Code / any real web app).
const STORAGE_KEY = "amareV2_appData";

function loadStore() {
  try {
    if (typeof localStorage === "undefined") return { ok: false, value: null, error: "localStorage isn't available in this environment." };
    const raw = localStorage.getItem(STORAGE_KEY);
    return { ok: true, value: raw ? JSON.parse(raw) : null };
  } catch (e) {
    return { ok: false, value: null, error: (e && e.message) || String(e) };
  }
}
function saveStore(value) {
  try {
    if (typeof localStorage === "undefined") return { ok: false, error: "localStorage isn't available in this environment." };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e && e.message) || String(e) };
  }
}


/* ------------------------------ Animated figure ---------------------------- */
function ExerciseFigure({ pose, playing, speed }) {
  const dur = speed === "slow" ? 3.2 : 1.6;
  return (
    <svg viewBox="0 0 200 200" className={`figure figure-${pose} ${playing ? "playing" : "paused"}`} style={{ "--dur": `${dur}s` }}>
      <ellipse cx="100" cy="182" rx="46" ry="6" fill={COLORS.blush} opacity="0.6" />
      <g className="rig" stroke={COLORS.roseDark} strokeWidth="7" strokeLinecap="round" fill="none">
        <circle className="head" cx="100" cy="46" r="13" fill={COLORS.rose} stroke="none" />
        <line className="spine" x1="100" y1="59" x2="100" y2="112" />
        <line className="armL" x1="100" y1="72" x2="76" y2="98" />
        <line className="armR" x1="100" y1="72" x2="124" y2="98" />
        <line className="legL" x1="100" y1="112" x2="84" y2="160" />
        <line className="legR" x1="100" y1="112" x2="116" y2="160" />
      </g>
    </svg>
  );
}

/* --------------------------------- App shell ------------------------------- */
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [activity, setActivity] = useState(DEFAULT_ACTIVITY);
  const [screen, setScreen] = useState("home");
  const [session, setSession] = useState(null);
  const [checkin, setCheckin] = useState(null);
  const [weeklyReview, setWeeklyReview] = useState(null);
  const [phaseCelebration, setPhaseCelebration] = useState(null);
  const [phase5Picker, setPhase5Picker] = useState(false);
  const [storageError, setStorageError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const profileRef = useRef(profile);
  const activityRef = useRef(activity);
  useEffect(() => { profileRef.current = profile; }, [profile]);
  useEffect(() => { activityRef.current = activity; }, [activity]);

  function exportData() {
    const blob = new Blob([JSON.stringify({ profile: profileRef.current, activity: activityRef.current }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "amare-data.json"; a.click(); URL.revokeObjectURL(url);
  }

  // The ONLY save path in the app. Called explicitly after meaningful actions —
  // never automatically on every keystroke/render — so there's one thing to trust.
  async function persistNow(nextProfile, nextActivity) {
    setSyncing(true);
    const r = await saveStore({ profile: nextProfile ?? profileRef.current, activity: nextActivity ?? activityRef.current });
    setSyncing(false);
    if (r.ok) { setStorageError(null); setLastSynced(new Date()); } else setStorageError(r.error + " — tap Save Now in Profile → Settings to retry.");
    return r;
  }
  // Update + save profile in one step (for discrete choices: chips, toggles, blur-committed text).
  function commitProfile(updater) {
    setProfile((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      persistNow(next, activityRef.current);
      return next;
    });
  }
  function commitActivity(updater) {
    setActivity((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      persistNow(profileRef.current, next);
      return next;
    });
  }

  // Load once on mount.
  useEffect(() => {
    (async () => {
      const r = await loadStore();
      if (r.ok && r.value) {
        if (r.value.profile) setProfile({ ...DEFAULT_PROFILE, ...r.value.profile });
        if (r.value.activity) setActivity({ ...DEFAULT_ACTIVITY, ...r.value.activity });
      }
      if (!r.ok) setStorageError(r.error + " — your progress may not save between visits.");
      setLoaded(true);
    })();
  }, []);

  const streak = useMemo(() => {
    let s = 0; const dates = new Set(activity.history.map((h) => h.date)); let cursor = new Date();
    for (let i = 0; i < 60; i++) {
      const iso = cursor.toISOString().slice(0, 10);
      if (dates.has(iso)) s++; else if (i > 0) break;
      cursor.setDate(cursor.getDate() - 1);
    }
    return s;
  }, [activity.history]);

  const weekCompleted = useMemo(() => {
    const start = new Date(); start.setDate(start.getDate() - dayOfWeekIdx()); start.setHours(0, 0, 0, 0);
    return activity.history.filter((h) => new Date(h.date + "T00:00:00") >= start).length;
  }, [activity.history]);

  const level = currentLevel(activity.history.length);
  const weekNumber = activity.startDate ? Math.min(99, Math.floor(daysBetween(activity.startDate, todayISO()) / 7) + 1) : 1;
  const phase = phaseForWeek(weekNumber);
  const todayDayId = WEEK_SCHEDULE[dayOfWeekIdx()];
  const todayDay = todayDayId === "rest" ? null : buildDay(todayDayId, weekNumber, activity.deload);

  const daysSinceLast = activity.history.length ? daysBetween(activity.history[0].date, todayISO()) : null;
  const missed = daysSinceLast !== null && daysSinceLast >= 5;

  // phase-change celebration
  useEffect(() => {
    if (!loaded || activity.history.length === 0) return;
    if (activity.lastPhaseSeen !== null && activity.lastPhaseSeen !== phase.id) {
      setPhaseCelebration({ from: activity.lastPhaseSeen, to: phase });
    }
    if (activity.lastPhaseSeen !== phase.id) {
      commitActivity((a) => ({ ...a, lastPhaseSeen: phase.id }));
    }
    if (phase.id === 5 && !activity.focus) setPhase5Picker(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, phase.id]);

  function startWorkout(day) {
    setSession({
      day, loc: profile.location === "gym" ? "gym" : "home", idx: 0,
      completedSets: day.exercises.map(() => 0), resting: false, restLeft: 0,
      startedAt: Date.now(), logWeights: { ...activity.exWeights }, newPRs: [],
    });
    setScreen("player");
  }

  function startResetWorkout() {
    const day = {
      id: "reset", title: "Reset Workout", minutes: 18,
      exercises: [
        { id: "march", sets: 1, reps: "60 sec", rest: 15 },
        { id: "gobletSquat", sets: 1, reps: 8, rest: 45 },
        { id: "gluteBridge", sets: 1, reps: 10, rest: 45 },
        { id: "dbRow", sets: 1, reps: 8, rest: 45 },
        { id: "deadBug", sets: 1, reps: "8 each side", rest: 30 },
        { id: "cooldownStretch", sets: 1, reps: "60 sec", rest: 0 },
      ],
    };
    startWorkout(day);
  }

  function finishWorkout(feeling) {
    const mins = Math.max(8, Math.round((Date.now() - session.startedAt) / 60000));
    const isFirst = activity.history.length === 0;
    const newHistory = [
      { date: todayISO(), dayId: session.day.id, title: session.day.title, minutes: mins, feeling, weights: session.logWeights, prs: session.newPRs },
      ...activity.history,
    ];
    const newCounts = { ...activity.exCounts };
    session.day.exercises.forEach((e) => { newCounts[e.id] = (newCounts[e.id] || 0) + 1; });
    const newFeelings = [feeling, ...activity.lastFeelings].slice(0, 5);
    const deload = newFeelings.slice(0, 2).length === 2 && newFeelings.slice(0, 2).every((f) => f === "Too Much");

    const nextActivity = {
      ...activity, history: newHistory, exWeights: { ...activity.exWeights, ...session.logWeights },
      exCounts: newCounts, startDate: activity.startDate || todayISO(), lastFeelings: newFeelings, deload,
    };
    setActivity(nextActivity);
    persistNow(profile, nextActivity); // don't wait for the debounce on the most important save of the flow
    setSession(null);
    setCheckin(null);

    const isLastOfWeek = weekCompleted + 1 >= profile.schedule;
    if (isLastOfWeek) {
      setWeeklyReview({ workouts: weekCompleted + 1, minutes: newHistory.slice(0, weekCompleted + 1).reduce((s, h) => s + h.minutes, 0) });
    } else {
      setScreen("home");
    }
    if (isFirst) setScreen("home");
  }

  if (!loaded) {
    return <Shell><div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "'Playfair Display', serif", color: COLORS.roseDark, fontSize: 18 }}>Amaré ♡</div></Shell>;
  }

  // Onboarding removed — app opens straight to the dashboard; set up your profile from the Profile tab.

  return (
    <Shell>
      <div className="app-frame">
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 10.5, fontWeight: 600,
          padding: "6px 12px", letterSpacing: 0.2,
          background: storageError ? "#E8B4B8" : syncing ? COLORS.blush : COLORS.creamDeep,
          color: storageError ? "#5A2A2E" : COLORS.charcoalSoft,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: storageError ? "#8B3A3F" : syncing ? COLORS.gold : COLORS.sageDeep, display: "inline-block" }} />
          {storageError ? "Not saving" : syncing ? "Saving…" : lastSynced ? `Saved ${lastSynced.toLocaleTimeString()}` : "Local session"}
        </div>
        {storageError && (
          <div style={{ background: "#E8B4B8", color: "#5A2A2E", fontSize: 11, padding: "6px 16px 10px", textAlign: "center", lineHeight: 1.4 }}>
            ⚠ {storageError}
            <button className="btn" style={{ display: "block", margin: "8px auto 0", padding: "6px 16px", fontSize: 11.5, background: "#5A2A2E", color: "white" }} onClick={exportData}>Export Now</button>
          </div>
        )}
        <div className="app-scroll">
          {screen === "home" && (
            <Dashboard profile={profile} streak={streak} weekCompleted={weekCompleted} schedule={profile.schedule}
              level={level} phase={phase} weekNumber={weekNumber} todayDay={todayDay} history={activity.history}
              missed={missed} onStart={() => startWorkout(todayDay)} onReset={startResetWorkout} onNav={setScreen}
              deload={activity.deload} />
          )}
          {screen === "workouts" && (
            <WorkoutsScreen phase={phase} weekNumber={weekNumber} activity={activity} onOpenLibrary={() => setScreen("library")}
              onStartDay={(id) => startWorkout(buildDay(id, weekNumber, activity.deload))} />
          )}
          {screen === "library" && <LibraryScreen exCounts={activity.exCounts} onBack={() => setScreen("workouts")} />}
          {screen === "progress" && <Progress activity={activity} setActivity={commitActivity} streak={streak} />}
          {screen === "calendar" && <CalendarScreen history={activity.history} />}
          {screen === "profile" && <ProfileScreen profile={profile} setProfile={setProfile} commitProfile={commitProfile} activity={activity} setActivity={commitActivity} streak={streak} level={level} lastSynced={lastSynced} syncing={syncing} onSaveNow={() => persistNow()} />}
          {screen === "player" && session && (
            <WorkoutPlayer session={session} setSession={setSession} exCounts={activity.exCounts}
              onExit={() => setScreen("home")} onFinish={() => setCheckin("pending")} />
          )}
        </div>
        {screen !== "player" && <BottomNav screen={screen} onNav={setScreen} />}
        {checkin && <FeelingModal onSelect={finishWorkout} />}
        {weeklyReview && <WeeklyReviewModal data={weeklyReview} onDone={(notes) => {
          commitActivity((a) => ({ ...a, weekReviews: [{ week: weekNumber, date: todayISO(), ...notes }, ...a.weekReviews] }));
          setWeeklyReview(null); setScreen("home");
        }} />}
        {phaseCelebration && (
          <PhaseCelebrationModal celebration={phaseCelebration} count={activity.history.length} onClose={() => setPhaseCelebration(null)} />
        )}
        {phase5Picker && (
          <Phase5Modal onPick={(f) => { commitActivity((a) => ({ ...a, focus: f })); setPhase5Picker(false); }} />
        )}
      </div>
    </Shell>
  );
}

/* --------------------------------- Shell/CSS -------------------------------- */
function Shell({ children }) {
  return (
    <div className="amare-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${FONT_LINK}&display=swap');
        .amare-root, .amare-root * { box-sizing: border-box; }
        .amare-root { font-family: 'Inter', sans-serif; color: ${COLORS.charcoal}; background: ${COLORS.cream}; width: 100%; min-height: 100vh; display: flex; justify-content: center; }
        .app-frame { width: 100%; max-width: 460px; min-height: 100vh; background: linear-gradient(180deg, ${COLORS.cream} 0%, ${COLORS.creamDeep} 100%); position: relative; display: flex; flex-direction: column; }
        .app-scroll { flex: 1; overflow-y: auto; padding-bottom: 92px; }
        h1,h2,h3,.serif { font-family: 'Playfair Display', serif; }
        .screen { padding: 28px 22px 8px; }
        .card { background: ${COLORS.white}; border-radius: 20px; padding: 20px; box-shadow: 0 6px 24px rgba(169,112,123,0.08); border: 1px solid rgba(169,112,123,0.08); }
        .btn { border: none; border-radius: 16px; padding: 15px 20px; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 15px; cursor: pointer; transition: transform .15s ease; }
        .btn:active { transform: scale(0.97); }
        .btn-primary { background: linear-gradient(135deg, ${COLORS.rose}, ${COLORS.roseDark}); color: white; box-shadow: 0 8px 20px rgba(169,112,123,0.35); width: 100%; }
        .btn-ghost { background: ${COLORS.white}; color: ${COLORS.charcoal}; border: 1.5px solid ${COLORS.blush}; }
        .btn-soft { background: ${COLORS.blush}; color: ${COLORS.roseDark}; }
        .pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; font-size: 12.5px; font-weight: 600; background: ${COLORS.blush}; color: ${COLORS.roseDark}; }
        .tag { font-size: 11.5px; letter-spacing: .02em; color: ${COLORS.charcoalSoft}; }
        .bottom-nav { position: absolute; bottom: 0; left: 0; right: 0; background: ${COLORS.white}; border-top: 1px solid ${COLORS.creamDeep}; display: flex; justify-content: space-around; padding: 10px 4px 16px; border-radius: 24px 24px 0 0; box-shadow: 0 -6px 20px rgba(169,112,123,0.08); }
        .nav-btn { background: none; border: none; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; color: ${COLORS.charcoalSoft}; cursor: pointer; padding: 6px 8px; border-radius: 12px; }
        .nav-btn.active { color: ${COLORS.roseDark}; background: ${COLORS.blush}; }
        input, select, textarea { font-family: 'Inter', sans-serif; border: 1.5px solid ${COLORS.creamDeep}; border-radius: 12px; padding: 12px 14px; font-size: 14.5px; width: 100%; background: ${COLORS.cream}; color: ${COLORS.charcoal}; }
        input:focus, select:focus, textarea:focus { outline: 2px solid ${COLORS.rose}; border-color: transparent; }
        .chip { display: inline-flex; padding: 10px 16px; border-radius: 999px; border: 1.5px solid ${COLORS.creamDeep}; font-size: 13.5px; font-weight: 500; cursor: pointer; margin: 4px 6px 4px 0; background: white; }
        .chip.selected { background: ${COLORS.rose}; border-color: ${COLORS.rose}; color: white; font-weight: 600; }
        .progress-track { background: ${COLORS.creamDeep}; border-radius: 999px; height: 8px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, ${COLORS.rose}, ${COLORS.gold}); border-radius: 999px; transition: width .4s ease; }
        .modal-overlay { position: absolute; inset: 0; background: rgba(58,51,47,0.5); display: flex; align-items: center; justify-content: center; border-radius: 24px; z-index: 30; padding: 20px; }
        .figure { width: 120px; height: 120px; }
        .figure.playing .rig { animation-duration: var(--dur); animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
        .figure.paused .rig { animation-play-state: paused; }
        .figure-squat.playing .rig { animation-name: squatAnim; }
        @keyframes squatAnim { 0%,100% { transform: translateY(0); } 50% { transform: translateY(18px) scaleY(.85); } }
        .figure-bridge.playing .rig { animation-name: bridgeAnim; }
        @keyframes bridgeAnim { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .figure-hinge.playing .rig { animation-name: hingeAnim; transform-origin: 100px 112px; }
        @keyframes hingeAnim { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(28deg)} }
        .figure-lateral.playing .rig { animation-name: lateralAnim; }
        @keyframes lateralAnim { 0%,100%{transform:translateX(-10px)} 50%{transform:translateX(10px)} }
        .figure-kickback.playing .legR { animation: kickAnim var(--dur) infinite ease-in-out; transform-origin: 100px 112px; }
        @keyframes kickAnim { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-22deg)} }
        .figure-press.playing .armL, .figure-press.playing .armR { animation: pressAnim var(--dur) infinite ease-in-out; }
        .figure-press .armL, .figure-press .armR { transform-origin: 100px 72px; }
        @keyframes pressAnim { 0%,100%{transform:rotate(0deg) translateY(0)} 50%{transform:rotate(-25deg) translateY(-14px)} }
        .figure-curl.playing .armL, .figure-curl.playing .armR { animation: curlAnim var(--dur) infinite ease-in-out; transform-origin: 100px 85px; }
        @keyframes curlAnim { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(35deg)} }
        .figure-tricep.playing .armL, .figure-tricep.playing .armR { animation: pressAnim var(--dur) infinite ease-in-out; }
        .figure-deadbug.playing .legL, .figure-deadbug.playing .armR { animation: deadbugAnim var(--dur) infinite ease-in-out; }
        @keyframes deadbugAnim { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        .figure-birddog.playing .legR, .figure-birddog.playing .armL { animation: deadbugAnim var(--dur) infinite ease-in-out; }
        .figure-sideplank.playing .rig { animation: sideplankAnim var(--dur) infinite ease-in-out; }
        @keyframes sideplankAnim { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-3deg)} }
        .figure-march.playing .legL, .figure-march.playing .legR { animation: marchAnim var(--dur) infinite ease-in-out; transform-origin: 100px 112px; }
        @keyframes marchAnim { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-30deg)} }
        .figure-armCircle.playing .armL, .figure-armCircle.playing .armR { animation: circAnim var(--dur) infinite linear; transform-origin: 100px 72px; }
        @keyframes circAnim { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .figure-hipCircle.playing .rig { animation: hipCircAnim var(--dur) infinite linear; transform-origin: 100px 112px; }
        @keyframes hipCircAnim { 0%{transform:rotate(0deg)} 100%{transform:rotate(8deg) translateX(3px)} }
        .figure-stretch.playing .rig { animation: hingeAnim var(--dur) infinite ease-in-out; transform-origin: 100px 112px; }
        @media (prefers-reduced-motion: reduce) { .figure .rig { animation: none !important; } }
      `}</style>
      {children}
    </div>
  );
}

const GOALS = ["Build strength", "Tone and define", "Build glutes", "Strengthen legs", "Strengthen arms", "Strengthen back", "Improve core strength", "Improve endurance", "Improve mobility", "Build consistency", "Improve confidence"];


/* --------------------------------- Dashboard --------------------------------- */
function Dashboard({ profile, streak, weekCompleted, schedule, level, phase, weekNumber, todayDay, history, missed, onStart, onReset, onNav, deload }) {
  const affirmation = AFFIRMATIONS[new Date().getDate() % AFFIRMATIONS.length];
  const hasStarted = history.length > 0;

  return (
    <div className="screen">
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, color: COLORS.charcoalSoft }}>{new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" })}</div>
        <h1 className="serif" style={{ fontSize: 27, margin: "2px 0 0" }}>Good morning{profile.name ? `, ${profile.name}` : ""} ♡</h1>
        <p style={{ color: COLORS.charcoalSoft, fontSize: 14.5, marginTop: 6 }}>Today is another opportunity to show up for yourself.</p>
      </div>

      {!hasStarted && (
        <div className="card" style={{ textAlign: "center", marginBottom: 16, background: COLORS.blush }}>
          <p className="serif" style={{ fontSize: 17, margin: "0 0 14px" }}>Your first workout is waiting for you ♡</p>
          <button className="btn btn-primary" onClick={onStart}>Start My First Workout</button>
        </div>
      )}

      {hasStarted && missed && (
        <div className="card" style={{ marginBottom: 16, background: COLORS.lavender }}>
          <div className="serif" style={{ fontSize: 16, marginBottom: 6 }}>Let's meet yourself where you are</div>
          <p style={{ fontSize: 13, color: COLORS.charcoalSoft, marginBottom: 12 }}>It's been a few days — no need to make it up. A short reset workout gets you moving again.</p>
          <button className="btn btn-soft" style={{ width: "100%" }} onClick={onReset}>Reset Workout · 15–20 min</button>
        </div>
      )}

      {hasStarted && deload && (
        <div className="card" style={{ marginBottom: 16, background: COLORS.sage, color: "white" }}>
          <p style={{ fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>Getting stronger also means knowing when to recover. This week's volume has been eased back a little.</p>
        </div>
      )}

      {hasStarted && (
        <div className="card" style={{ background: `linear-gradient(135deg, ${COLORS.blush}, ${COLORS.lavender})`, marginBottom: 16 }}>
          <div className="tag" style={{ marginBottom: 4 }}>PHASE {phase.id} · {phase.name.toUpperCase()} · WEEK {weekNumber}</div>
          <h2 className="serif" style={{ fontSize: 22, margin: "0 0 10px" }}>{todayDay ? todayDay.title : "Rest Day"}</h2>
          {todayDay && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <span className="pill">{todayDay.minutes} MIN</span>
              <span className="pill">{profile.level}</span>
              <span className="pill">HOME / GYM</span>
            </div>
          )}
          {todayDay ? <button className="btn btn-primary" onClick={onStart}>Start Workout</button> :
            <p style={{ fontSize: 14, color: COLORS.charcoalSoft }}>Rest, or take a gentle walk. Recovery is part of the work.</p>}
        </div>
      )}

      {hasStarted && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="tag" style={{ marginBottom: 12 }}>YOUR CONSISTENCY</div>
          <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center" }}>
            <div><div className="serif" style={{ fontSize: 26 }}>🔥 {streak}</div><div className="tag">DAY STREAK</div></div>
            <div><div className="serif" style={{ fontSize: 26 }}>{weekCompleted}/{schedule}</div><div className="tag">THIS WEEK</div></div>
            <div><div className="serif" style={{ fontSize: 26 }}>{level.icon}</div><div className="tag">{level.label.toUpperCase()}</div></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            {DAY_LABELS.map((l, i) => {
              const isToday = i === dayOfWeekIdx();
              return (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: COLORS.charcoalSoft, marginBottom: 4 }}>{l}</div>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                    background: isToday ? COLORS.rose : (WEEK_SCHEDULE[i] === "rest" ? "transparent" : COLORS.blush),
                    color: isToday ? "white" : COLORS.roseDark, border: isToday ? "none" : `1.5px solid ${COLORS.creamDeep}` }}>
                    {WEEK_SCHEDULE[i] === "rest" ? "—" : (i < dayOfWeekIdx() ? "✓" : "")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasStarted && (
        <div className="card" style={{ marginBottom: 16, cursor: "pointer" }} onClick={() => onNav("progress")}>
          <div className="tag" style={{ marginBottom: 10 }}>YOUR PROGRESS</div>
          <div style={{ display: "flex", gap: 24 }}>
            <div><div className="serif" style={{ fontSize: 20 }}>{history.length}</div><div className="tag">Workouts</div></div>
            <div><div className="serif" style={{ fontSize: 20 }}>{history.reduce((a, h) => a + h.minutes, 0)}</div><div className="tag">Minutes</div></div>
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: COLORS.roseDark, fontWeight: 600 }}>View full progress →</div>
        </div>
      )}

      <div className="card" style={{ textAlign: "center", background: COLORS.lavender }}>
        <div className="tag" style={{ marginBottom: 8 }}>DAILY AFFIRMATION</div>
        <p className="serif" style={{ fontSize: 16, margin: 0, fontStyle: "italic" }}>"{affirmation}"</p>
      </div>
    </div>
  );
}

/* -------------------------------- Bottom Nav --------------------------------- */
function BottomNav({ screen, onNav }) {
  const items = [["home", "Home", "⌂"], ["workouts", "Workouts", "🏋"], ["progress", "Progress", "◆"], ["calendar", "Calendar", "▦"], ["profile", "Profile", "☺"]];
  return (
    <div className="bottom-nav">
      {items.map(([id, label, icon]) => (
        <button key={id} className={`nav-btn ${screen === id || (id === "workouts" && screen === "library") ? "active" : ""}`} onClick={() => onNav(id)}>
          <span style={{ fontSize: 16 }}>{icon}</span>{label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------- Workouts / Phase timeline -------------------------------- */
function WorkoutsScreen({ phase, weekNumber, activity, onOpenLibrary, onStartDay }) {
  const timeline = [
    { icon: "🌱", label: "Start", sub: "Learning the basics" },
    { icon: "🌿", label: "Foundation", sub: "Building consistency" },
    { icon: "🌸", label: "Build", sub: "Getting stronger" },
    { icon: "✨", label: "Strength", sub: "Lifting with confidence" },
    { icon: "🔥", label: "Progress", sub: "Becoming stronger than yesterday" },
  ];
  const days = ["d1", "d2", "d3", "mobility"];
  return (
    <div className="screen">
      <h1 className="serif" style={{ fontSize: 25, marginBottom: 4 }}>Your Journey</h1>
      <p style={{ fontSize: 13.5, color: COLORS.charcoalSoft, marginBottom: 18 }}>{phase.tagline}</p>

      <div className="card" style={{ marginBottom: 16 }}>
        {timeline.map((t, i) => (
          <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", opacity: i + 1 <= phase.id ? 1 : 0.4 }}>
            <div style={{ fontSize: 20, width: 30, textAlign: "center" }}>{t.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: i + 1 === phase.id ? 700 : 500, fontSize: 14, color: i + 1 === phase.id ? COLORS.roseDark : COLORS.charcoal }}>{t.label}</div>
              <div className="tag">{t.sub}</div>
            </div>
            {i + 1 === phase.id && <span className="pill">NOW</span>}
          </div>
        ))}
      </div>

      <div className="tag" style={{ marginBottom: 10 }}>THIS WEEK · WEEK {weekNumber}</div>
      {days.map((id) => {
        const d = buildDay(id, weekNumber, activity.deload);
        return (
          <div key={id} className="card" style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => onStartDay(id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{d.title}</div>
                <div className="tag">{d.exercises.length} exercises · {d.minutes} min</div>
              </div>
              <span className="pill">START</span>
            </div>
          </div>
        );
      })}

      <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={onOpenLibrary}>Browse Exercise Library →</button>
    </div>
  );
}

function LibraryScreen({ exCounts, onBack }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [selected, setSelected] = useState(null);
  const cats = ["All", ...Array.from(new Set(Object.values(EXERCISES).map((e) => e.cat)))];
  const list = Object.entries(EXERCISES).filter(([id, e]) => {
    const matchesQ = e.name.toLowerCase().includes(q.toLowerCase());
    const matchesCat = cat === "All" || e.cat === cat;
    return matchesQ && matchesCat;
  });

  return (
    <div className="screen">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button className="btn btn-ghost" style={{ padding: "8px 12px" }} onClick={onBack}>← Back</button>
        <h1 className="serif" style={{ fontSize: 21, margin: 0 }}>Exercise Library</h1>
      </div>
      <input placeholder="Search exercises..." value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12 }} />
      <div style={{ marginBottom: 14 }}>{cats.map((c) => <span key={c} className={`chip ${cat === c ? "selected" : ""}`} onClick={() => setCat(c)}>{c}</span>)}</div>

      {list.map(([id, e]) => {
        const m = masteryFor(exCounts[id] || 0);
        return (
          <div key={id} className="card" style={{ marginBottom: 10, cursor: "pointer" }} onClick={() => setSelected(id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{e.name}</div>
                <div className="tag">{e.muscles}</div>
              </div>
              <span title={m.label} style={{ fontSize: 16 }}>{m.icon}</span>
            </div>
          </div>
        );
      })}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="card" style={{ width: "100%", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h2 className="serif" style={{ fontSize: 20, marginBottom: 4 }}>{EXERCISES[selected].name}</h2>
            <div className="tag" style={{ marginBottom: 14 }}>{EXERCISES[selected].muscles}</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><ExerciseFigure pose={EXERCISES[selected].pose} playing={true} speed="normal" /></div>
            {EXERCISES[selected].home && <p style={{ fontSize: 13, marginBottom: 4 }}><b>Home:</b> {EXERCISES[selected].home}</p>}
            {EXERCISES[selected].gym && <p style={{ fontSize: 13, marginBottom: 10 }}><b>Gym:</b> {EXERCISES[selected].gym}</p>}
            <p style={{ fontSize: 13, color: COLORS.charcoalSoft, marginBottom: 8 }}><b>Form cue:</b> {EXERCISES[selected].cues}</p>
            <p style={{ fontSize: 13, color: COLORS.charcoalSoft, marginBottom: 14 }}><b>Common mistake:</b> {EXERCISES[selected].mistake}</p>
            <button className="btn btn-primary" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Workout Player ------------------------------- */
function WorkoutPlayer({ session, setSession, exCounts, onExit, onFinish }) {
  const { day, idx, loc, completedSets, resting, restLeft } = session;
  const exSpec = day.exercises[idx];
  const ex = EXERCISES[exSpec.id];
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState("normal");
  const [showAlts, setShowAlts] = useState(false);
  const timerRef = useRef(null);
  const totalSets = exSpec.sets;
  const setsDone = completedSets[idx];
  const isLast = idx === day.exercises.length - 1;

  useEffect(() => {
    if (resting && restLeft > 0) timerRef.current = setTimeout(() => setSession((s) => ({ ...s, restLeft: s.restLeft - 1 })), 1000);
    else if (resting && restLeft <= 0) setSession((s) => ({ ...s, resting: false }));
    return () => clearTimeout(timerRef.current);
  }, [resting, restLeft, setSession]);

  function completeSet() {
    const newCompleted = [...completedSets];
    newCompleted[idx] += 1;
    let newPRs = session.newPRs;
    if (ex.trackWeight) {
      const w = session.logWeights[exSpec.id] || 0;
      const prevMax = session.prevMax || 0;
    }
    if (newCompleted[idx] >= totalSets) {
      if (isLast) { setSession((s) => ({ ...s, completedSets: newCompleted })); onFinish(); return; }
      setSession((s) => ({ ...s, completedSets: newCompleted, idx: s.idx + 1, resting: false }));
    } else {
      setSession((s) => ({ ...s, completedSets: newCompleted, resting: true, restLeft: exSpec.rest || 45 }));
    }
  }
  function setWeight(delta) {
    setSession((s) => ({ ...s, logWeights: { ...s.logWeights, [exSpec.id]: Math.max(0, (s.logWeights[exSpec.id] || 0) + delta) } }));
  }
  const weight = session.logWeights[exSpec.id] ?? 0;
  const progressPct = ((idx + setsDone / totalSets) / day.exercises.length) * 100;
  const isWarmupLike = ["march", "armCircle", "hipCircle", "cooldownStretch"].includes(exSpec.id);
  const mastery = masteryFor(exCounts[exSpec.id] || 0);

  return (
    <div className="screen" style={{ paddingTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button className="btn btn-ghost" style={{ padding: "8px 14px" }} onClick={onExit}>✕ Exit</button>
        <div style={{ display: "flex", borderRadius: 999, overflow: "hidden", border: `1.5px solid ${COLORS.creamDeep}` }}>
          {["home", "gym"].map((l) => (
            <button key={l} onClick={() => setSession((s) => ({ ...s, loc: l }))}
              style={{ border: "none", padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", background: loc === l ? COLORS.rose : "white", color: loc === l ? "white" : COLORS.charcoalSoft }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="tag" style={{ marginBottom: 6 }}>{day.title.toUpperCase()} • {idx + 1} / {day.exercises.length} EXERCISES</div>
      <div className="progress-track" style={{ marginBottom: 20 }}><div className="progress-fill" style={{ width: `${progressPct}%` }} /></div>

      {!resting ? (
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
            <h2 className="serif" style={{ fontSize: 21, margin: "0 0 4px" }}>{loc === "gym" && ex.gym ? ex.gym : (ex.home || ex.name)}</h2>
          </div>
          <div className="tag" style={{ marginBottom: 14 }}>{ex.muscles} {!isWarmupLike && <span title={mastery.label}>· {mastery.icon} {mastery.label}</span>}</div>

          <div style={{ display: "flex", justifyContent: "center", margin: "6px 0 10px" }}><ExerciseFigure pose={ex.pose} playing={playing} speed={speed} /></div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
            <button className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => setPlaying((p) => !p)}>{playing ? "PAUSE" : "PLAY"}</button>
            <button className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => setPlaying(true)}>REPLAY</button>
            <button className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => setSpeed((s) => (s === "slow" ? "normal" : "slow"))}>{speed === "slow" ? "NORMAL" : "SLOW-MO"}</button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 16 }}>
            <div><div className="serif" style={{ fontSize: 22 }}>{exSpec.sets}</div><div className="tag">SETS</div></div>
            <div><div className="serif" style={{ fontSize: 22 }}>{exSpec.reps}</div><div className="tag">REPS</div></div>
            <div><div className="serif" style={{ fontSize: 22 }}>{exSpec.rest || 0}s</div><div className="tag">REST</div></div>
          </div>

          {ex.trackWeight && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 16 }}>
              <span className="tag">WEIGHT</span>
              <button className="btn btn-ghost" style={{ padding: "4px 12px" }} onClick={() => setWeight(-2.5)}>−</button>
              <span className="serif" style={{ fontSize: 18, minWidth: 50 }}>{weight} lb</span>
              <button className="btn btn-ghost" style={{ padding: "4px 12px" }} onClick={() => setWeight(2.5)}>+</button>
            </div>
          )}

          <p style={{ fontSize: 13, color: COLORS.charcoalSoft, lineHeight: 1.5, margin: "0 0 16px" }}>{ex.cues}</p>

          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
            {Array.from({ length: totalSets }).map((_, i) => (
              <span key={i} className="pill" style={{ background: i < setsDone ? COLORS.rose : COLORS.blush, color: i < setsDone ? "white" : COLORS.roseDark }}>SET {i + 1} {i < setsDone ? "✓" : "○"}</span>
            ))}
          </div>

          <button className="btn btn-primary" onClick={completeSet}>Complete Set</button>

          {ex.alternatives && (
            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: 12.5, color: COLORS.roseDark, fontWeight: 600, cursor: "pointer" }} onClick={() => setShowAlts((s) => !s)}>Need another option? {showAlts ? "▲" : "▼"}</span>
              {showAlts && <div style={{ marginTop: 8, textAlign: "left" }}>{ex.alternatives.map((a) => <div key={a} className="chip" style={{ display: "block" }}>{a}</div>)}</div>}
            </div>
          )}
        </div>
      ) : (
        <RestTimer restLeft={restLeft} setSession={setSession} onSkip={() => setSession((s) => ({ ...s, resting: false }))} nextExName={ex.name} />
      )}
    </div>
  );
}

function RestTimer({ restLeft, setSession, onSkip, nextExName }) {
  const pct = Math.max(0, Math.min(100, (restLeft / 60) * 100));
  return (
    <div className="card" style={{ textAlign: "center", background: `linear-gradient(160deg, ${COLORS.lavender}, ${COLORS.blush})` }}>
      <div className="tag" style={{ marginBottom: 10 }}>REST</div>
      <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 18px" }}>
        <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
          <circle cx="50" cy="50" r="44" fill="none" stroke="white" strokeWidth="7" />
          <circle cx="50" cy="50" r="44" fill="none" stroke={COLORS.rose} strokeWidth="7" strokeLinecap="round" strokeDasharray={276} strokeDashoffset={276 - (276 * pct) / 100} style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <div className="serif" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>{Math.max(0, restLeft)}</div>
      </div>
      <p style={{ fontSize: 13, color: COLORS.charcoalSoft, marginBottom: 16 }}>Breathe. Up next: {nextExName}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button className="btn btn-ghost" style={{ padding: "10px 16px" }} onClick={() => setSession((s) => ({ ...s, restLeft: s.restLeft + 15 }))}>+15 SEC</button>
        <button className="btn btn-primary" style={{ width: "auto", padding: "10px 20px" }} onClick={onSkip}>SKIP</button>
      </div>
    </div>
  );
}

function FeelingModal({ onSelect }) {
  const feels = [["🌸", "Too Easy"], ["🙂", "Just Right"], ["🔥", "Challenging"], ["😮", "Too Much"]];
  return (
    <div className="modal-overlay">
      <div className="card" style={{ width: "100%", textAlign: "center" }}>
        <h2 className="serif" style={{ fontSize: 21, marginBottom: 4 }}>You did it. ♡</h2>
        <p style={{ fontSize: 13.5, color: COLORS.charcoalSoft, marginBottom: 18 }}>How did that feel?</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {feels.map(([icon, label]) => (
            <button key={label} className="btn btn-ghost" style={{ padding: "14px 8px" }} onClick={() => onSelect(label)}>
              <div style={{ fontSize: 22 }}>{icon}</div><div style={{ fontSize: 12.5, marginTop: 4 }}>{label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeeklyReviewModal({ data, onDone }) {
  const [wentWell, setWentWell] = useState("");
  const [focusNext, setFocusNext] = useState("");
  return (
    <div className="modal-overlay">
      <div className="card" style={{ width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <h2 className="serif" style={{ fontSize: 20, marginBottom: 10 }}>Your Week</h2>
        <p style={{ fontSize: 13.5, marginBottom: 4 }}>{data.workouts} workouts completed</p>
        <p style={{ fontSize: 13.5, marginBottom: 16 }}>{data.minutes} minutes moved</p>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.charcoalSoft }}>What went well?</label>
        <textarea rows={2} value={wentWell} onChange={(e) => setWentWell(e.target.value)} style={{ marginTop: 6, marginBottom: 14 }} />
        <label style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.charcoalSoft }}>What do you want to focus on next week?</label>
        <textarea rows={2} value={focusNext} onChange={(e) => setFocusNext(e.target.value)} style={{ marginTop: 6, marginBottom: 16 }} />
        <p style={{ fontSize: 13, fontStyle: "italic", color: COLORS.roseDark, marginBottom: 16, textAlign: "center" }}>You showed up for yourself this week. That's progress.</p>
        <button className="btn btn-primary" onClick={() => onDone({ wentWell, focusNext })}>Done</button>
      </div>
    </div>
  );
}

function PhaseCelebrationModal({ celebration, count, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="card" style={{ width: "100%", textAlign: "center" }}>
        <h2 className="serif" style={{ fontSize: 22, marginBottom: 8 }}>You did it. ♡</h2>
        <p style={{ fontSize: 14, marginBottom: 6 }}>You've completed {PHASES.find((p) => p.id === celebration.from)?.name || "this phase"}.</p>
        <p style={{ fontSize: 14, marginBottom: 20, color: COLORS.charcoalSoft }}>You showed up for yourself {count} times. Your strength is growing.</p>
        <div className="tag" style={{ marginBottom: 6 }}>NEXT</div>
        <h3 className="serif" style={{ fontSize: 19, marginBottom: 16 }}>{celebration.to.icon} {celebration.to.name}</h3>
        <button className="btn btn-primary" onClick={onClose}>Start Next Phase</button>
      </div>
    </div>
  );
}

function Phase5Modal({ onPick }) {
  return (
    <div className="modal-overlay">
      <div className="card" style={{ width: "100%" }}>
        <h2 className="serif" style={{ fontSize: 20, marginBottom: 4, textAlign: "center" }}>Week 13 and beyond</h2>
        <p style={{ fontSize: 13.5, color: COLORS.charcoalSoft, marginBottom: 16, textAlign: "center" }}>You've built real strength. Choose a focus to continue.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {PHASE5_FOCUSES.map((f) => (
            <button key={f.id} className="btn btn-ghost" style={{ padding: "14px 8px" }} onClick={() => onPick(f.id)}>
              <div style={{ fontSize: 20 }}>{f.icon}</div><div style={{ fontSize: 12, marginTop: 4 }}>{f.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Progress ---------------------------------- */
function Progress({ activity, setActivity, streak }) {
  const { history, weightLog, measurements, exWeights } = activity;
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [showAddMeasure, setShowAddMeasure] = useState(false);
  const totalMin = history.reduce((a, h) => a + h.minutes, 0);
  const strengthRows = Object.entries(exWeights).filter(([id]) => EXERCISES[id]?.trackWeight).slice(0, 5);

  function addWeight(w) {
    setActivity((a) => ({ ...a, weightLog: [{ date: todayISO(), weight: w }, ...a.weightLog] }));
    setShowAddWeight(false);
  }
  function addMeasurement(m) {
    setActivity((a) => ({ ...a, measurements: [{ date: todayISO(), ...m }, ...a.measurements] }));
    setShowAddMeasure(false);
  }

  return (
    <div className="screen">
      <h1 className="serif" style={{ fontSize: 25, marginBottom: 18 }}>Your Progress</h1>

      {history.length === 0 ? (
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, color: COLORS.charcoalSoft }}>Your progress story starts here.</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="tag" style={{ marginBottom: 12 }}>SHOW-UP SCORE</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
              <span className="serif" style={{ fontSize: 30 }}>{Math.min(100, 40 + history.length * 4 + streak * 2)}</span>
              <span style={{ color: COLORS.charcoalSoft, fontSize: 14 }}>/ 100</span>
            </div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, 40 + history.length * 4 + streak * 2)}%` }} /></div>
          </div>

          {strengthRows.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="tag" style={{ marginBottom: 12 }}>YOUR STRENGTH</div>
              {strengthRows.map(([id, cur]) => (
                <div key={id} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{EXERCISES[id].name}</span>
                    <span style={{ color: COLORS.sageDeep, fontWeight: 700 }}>{cur} lb</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, cur * 2)}%`, background: `linear-gradient(90deg, ${COLORS.sage}, ${COLORS.sageDeep})` }} /></div>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="tag">WEIGHT</div>
              <span style={{ fontSize: 12, color: COLORS.roseDark, fontWeight: 600, cursor: "pointer" }} onClick={() => setShowAddWeight(true)}>+ Add entry</span>
            </div>
            {weightLog.length === 0 ? (
              <p style={{ fontSize: 13, color: COLORS.charcoalSoft }}>No entries yet. Progress isn't only a number on the scale.</p>
            ) : (
              <>
                <div className="serif" style={{ fontSize: 22, marginBottom: 4 }}>{weightLog[0].weight} lb</div>
                <div className="tag">Last logged {fmtDate(weightLog[0].date)}</div>
              </>
            )}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="tag">MEASUREMENTS</div>
              <span style={{ fontSize: 12, color: COLORS.roseDark, fontWeight: 600, cursor: "pointer" }} onClick={() => setShowAddMeasure(true)}>+ Add entry</span>
            </div>
            {measurements.length === 0 ? <p style={{ fontSize: 13, color: COLORS.charcoalSoft }}>Your first measurement is waiting.</p> :
              Object.entries(measurements[0]).filter(([k]) => k !== "date").map(([k, v]) => v && (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                  <span style={{ textTransform: "capitalize" }}>{k}</span><span style={{ fontWeight: 600 }}>{v}"</span>
                </div>
              ))}
          </div>

          <div className="card">
            <div className="tag" style={{ marginBottom: 10 }}>WORKOUT HISTORY</div>
            {history.slice(0, 8).map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < history.length - 1 ? `1px solid ${COLORS.creamDeep}` : "none" }}>
                <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{h.title}</div><div className="tag">{fmtDate(h.date)}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 13 }}>{h.minutes} min</div><div className="tag" style={{ color: COLORS.sageDeep }}>Completed ✓</div></div>
              </div>
            ))}
          </div>
        </>
      )}

      {showAddWeight && <AddWeightModal onSave={addWeight} onClose={() => setShowAddWeight(false)} />}
      {showAddMeasure && <AddMeasureModal onSave={addMeasurement} onClose={() => setShowAddMeasure(false)} />}
    </div>
  );
}

function AddWeightModal({ onSave, onClose }) {
  const [w, setW] = useState("");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card" style={{ width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <h2 className="serif" style={{ fontSize: 19, marginBottom: 12 }}>Log your weight</h2>
        <input type="number" placeholder="Weight (lb)" value={w} onChange={(e) => setW(e.target.value)} style={{ marginBottom: 14 }} />
        <button className="btn btn-primary" onClick={() => w && onSave(Number(w))}>Save</button>
      </div>
    </div>
  );
}
function AddMeasureModal({ onSave, onClose }) {
  const [m, setM] = useState({ waist: "", hips: "", chest: "", thigh: "", arm: "", calf: "" });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card" style={{ width: "100%", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <h2 className="serif" style={{ fontSize: 19, marginBottom: 12 }}>Add measurements</h2>
        {Object.keys(m).map((k) => (
          <div key={k} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, textTransform: "capitalize", color: COLORS.charcoalSoft }}>{k} (in)</label>
            <input type="number" value={m[k]} onChange={(e) => setM((s) => ({ ...s, [k]: e.target.value }))} style={{ marginTop: 4 }} />
          </div>
        ))}
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => onSave(m)}>Save</button>
      </div>
    </div>
  );
}

/* --------------------------------- Calendar ----------------------------------- */
function CalendarScreen({ history }) {
  const dateSet = useMemo(() => new Map(history.map((h) => [h.date, h])), [history]);
  const today = new Date(); const year = today.getFullYear(), month = today.getMonth();
  const firstDay = new Date(year, month, 1); const startOffset = dayOfWeekIdx(firstDay);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = []; for (let i = 0; i < startOffset; i++) cells.push(null); for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="screen">
      <h1 className="serif" style={{ fontSize: 25, marginBottom: 4 }}>Calendar</h1>
      <p style={{ fontSize: 13.5, color: COLORS.charcoalSoft, marginBottom: 18 }}>{today.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 8 }}>{DAY_LABELS.map((l, i) => <div key={i} style={{ textAlign: "center", fontSize: 11, color: COLORS.charcoalSoft, fontWeight: 700 }}>{l}</div>)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const iso = new Date(year, month, d).toISOString().slice(0, 10);
            const done = dateSet.has(iso); const isToday = d === today.getDate();
            return (
              <div key={i} style={{ aspectRatio: "1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 600,
                background: done ? COLORS.rose : (isToday ? COLORS.blush : "transparent"), color: done ? "white" : COLORS.charcoal,
                border: isToday && !done ? `1.5px solid ${COLORS.rose}` : "1.5px solid transparent" }}>{d}</div>
            );
          })}
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: COLORS.charcoalSoft, textAlign: "center", marginTop: 16 }}>Missed days aren't failures — they're just open space to begin again.</p>
    </div>
  );
}

/* --------------------------------- Profile / Settings -------------------------------------- */
function ProfileScreen({ profile, setProfile, commitProfile, activity, setActivity, streak, level, lastSynced, syncing, onSaveNow }) {
  const [tab, setTab] = useState("about");
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const updateLocal = (k, v) => setProfile((p) => ({ ...p, [k]: v })); // text field typing — no save per keystroke
  const update = (k, v) => commitProfile((p) => ({ ...p, [k]: v })); // chips/toggles — discrete click, save immediately
  const commitBlur = () => commitProfile((p) => p); // save whatever's currently in state
  const updateNotif = (k) => commitProfile((p) => ({ ...p, notifications: { ...p.notifications, [k]: !p.notifications[k] } }));
  const updateConn = (k) => commitProfile((p) => ({ ...p, connections: { ...p.connections, [k]: !p.connections[k] } }));

  function importData() {
    try {
      const parsed = JSON.parse(importText);
      if (parsed.profile) commitProfile({ ...DEFAULT_PROFILE, ...parsed.profile });
      if (parsed.activity) setActivity({ ...DEFAULT_ACTIVITY, ...parsed.activity });
      setImportMsg("Imported ✓ — if auto-save is failing, export again before you close this tab.");
      setImportText("");
    } catch (e) {
      setImportMsg("That didn't look like valid exported data.");
    }
  }

  async function resetAllData() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    window.location.reload();
  }
  function exportData() {
    const blob = new Blob([JSON.stringify({ profile, activity }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "amare-data.json"; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="screen">
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 12px", background: `linear-gradient(135deg, ${COLORS.rose}, ${COLORS.lavenderDeep})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 26, fontFamily: "'Playfair Display', serif" }}>{profile.name?.[0] || "A"}</div>
        <h1 className="serif" style={{ fontSize: 22, margin: 0 }}>{profile.name}</h1>
        <div className="tag">{level.icon} {level.label}</div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["about", "About"], ["settings", "Settings"], ["health", "Health"], ["achievements", "Achievements"]].map(([id, l]) => (
          <span key={id} className={`chip ${tab === id ? "selected" : ""}`} onClick={() => setTab(id)}>{l}</span>
        ))}
      </div>

      {tab === "about" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center", marginBottom: 16 }}>
            <div><div className="serif" style={{ fontSize: 19 }}>{activity.history.length}</div><div className="tag">Workouts</div></div>
            <div><div className="serif" style={{ fontSize: 19 }}>{streak}</div><div className="tag">Streak</div></div>
            <div><div className="serif" style={{ fontSize: 19 }}>{activity.history.reduce((a, h) => a + h.minutes, 0)}</div><div className="tag">Minutes</div></div>
          </div>
          {[["Name", "name", "text"], ["Age", "age", "number"], ["Height", "height", "text"], ["Weight (lb)", "weight", "number"], ["Goal weight (optional)", "goalWeight", "number"]].map(([label, key, type]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12.5, color: COLORS.charcoalSoft, fontWeight: 600 }}>{label}</label>
              <input type={type} value={profile[key]} onChange={(e) => updateLocal(key, e.target.value)} onBlur={commitBlur} style={{ marginTop: 5 }} />
            </div>
          ))}
          <div className="tag" style={{ margin: "10px 0" }}>FITNESS LEVEL</div>
          <div style={{ marginBottom: 10 }}>{["Complete Beginner", "Beginner", "Intermediate", "Advanced"].map((l) => <span key={l} className={`chip ${profile.level === l ? "selected" : ""}`} onClick={() => update("level", l)}>{l}</span>)}</div>
          <div className="tag" style={{ margin: "10px 0" }}>GOALS</div>
          <div style={{ marginBottom: 10 }}>{GOALS.map((g) => <span key={g} className={`chip ${profile.goals.includes(g) ? "selected" : ""}`} onClick={() => commitProfile((p) => ({ ...p, goals: p.goals.includes(g) ? p.goals.filter((x) => x !== g) : [...p.goals, g] }))}>{g}</span>)}</div>
          <div className="tag" style={{ margin: "10px 0" }}>WORKOUT LOCATION</div>
          <div>{[["home", "Home"], ["gym", "Gym"], ["both", "Both"]].map(([v, l]) => <span key={v} className={`chip ${profile.location === v ? "selected" : ""}`} onClick={() => update("location", v)}>{l}</span>)}</div>
        </div>
      )}

      {tab === "settings" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="tag" style={{ marginBottom: 10 }}>SCHEDULE</div>
          <div style={{ marginBottom: 16 }}>{[2, 3, 4, 5, 6].map((n) => <span key={n} className={`chip ${profile.schedule === n ? "selected" : ""}`} onClick={() => update("schedule", n)}>{n}/wk</span>)}</div>

          <div className="tag" style={{ marginBottom: 10 }}>UNITS</div>
          <div style={{ marginBottom: 16 }}>{["lbs", "kg"].map((u) => <span key={u} className={`chip ${profile.units === u ? "selected" : ""}`} onClick={() => update("units", u)}>{u}</span>)}</div>

          <div className="tag" style={{ marginBottom: 10 }}>NOTIFICATIONS</div>
          {Object.entries({ workoutReminder: "Workout reminder", streakReminder: "Streak reminder", weeklyProgress: "Weekly progress", encouragement: "Encouragement" }).map(([k, l]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
              <span style={{ fontSize: 13.5 }}>{l}</span>
              <button className="btn" style={{ padding: "6px 14px", fontSize: 11, background: profile.notifications[k] ? COLORS.rose : COLORS.creamDeep, color: profile.notifications[k] ? "white" : COLORS.charcoalSoft }} onClick={() => updateNotif(k)}>{profile.notifications[k] ? "ON" : "OFF"}</button>
            </div>
          ))}
          <p className="tag" style={{ marginTop: 8 }}>Push notifications require native app implementation.</p>

          <div className="tag" style={{ margin: "16px 0 10px" }}>DATA & PRIVACY</div>
          <p className="tag" style={{ marginBottom: 8 }}>{syncing ? "Saving…" : lastSynced ? `Synced ✓ ${lastSynced.toLocaleTimeString()}` : "Not synced yet this session"}</p>
          <button className="btn btn-ghost" style={{ width: "100%", marginBottom: 8 }} onClick={onSaveNow}>Save Now</button>
          <button className="btn btn-ghost" style={{ width: "100%", marginBottom: 8 }} onClick={exportData}>Export Data</button>
          <button className="btn btn-ghost" style={{ width: "100%", color: COLORS.roseDark, marginBottom: 14 }} onClick={resetAllData}>Reset All Data</button>

          <div className="tag" style={{ marginBottom: 8 }}>IMPORT (backup workaround)</div>
          <p style={{ fontSize: 11.5, color: COLORS.charcoalSoft, marginBottom: 8 }}>If auto-save keeps failing, export your data before closing, then paste it back in here next time you open the app.</p>
          <textarea rows={3} placeholder="Paste exported JSON here" value={importText} onChange={(e) => setImportText(e.target.value)} style={{ marginBottom: 8, fontSize: 11.5 }} />
          <button className="btn btn-ghost" style={{ width: "100%" }} onClick={importData} disabled={!importText}>Import</button>
          {importMsg && <p className="tag" style={{ marginTop: 8, color: COLORS.roseDark }}>{importMsg}</p>}
        </div>
      )}

      {tab === "health" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="tag" style={{ marginBottom: 4 }}>CONNECT HEALTH DATA</div>
          <p style={{ fontSize: 12.5, color: COLORS.charcoalSoft, marginBottom: 14 }}>Requires native app integration — this shows the connection interface only.</p>
          {[["appleHealth", "Apple Health", "Workouts, steps, heart rate, weight, sleep"], ["appleWatch", "Apple Watch", "Workout sessions, heart rate, activity"], ["smartScale", "Smart Scale", "Weight, body composition"]].map(([k, l, sub]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${COLORS.creamDeep}` }}>
              <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{l}</div><div className="tag">{sub}</div>
                {profile.connections[k] && <div className="tag" style={{ color: COLORS.sageDeep }}>Connected ✓ (demo)</div>}
              </div>
              <button className="btn btn-soft" style={{ padding: "8px 14px", fontSize: 12 }} onClick={() => updateConn(k)}>{profile.connections[k] ? "Disconnect" : "Connect"}</button>
            </div>
          ))}
        </div>
      )}

      {tab === "achievements" && (
        <div className="card">
          <div className="tag" style={{ marginBottom: 10 }}>ACHIEVEMENTS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              ["First Workout", activity.history.length >= 1], ["First 3-Day Streak", streak >= 3],
              ["First Week Complete", activity.history.length >= 3], ["10 Workouts", activity.history.length >= 10],
              ["25 Workouts", activity.history.length >= 25], ["50 Workouts", activity.history.length >= 50],
              ["Home Workout Hero", activity.history.some((h) => h.dayId !== "reset")], ["First Phase Complete", activity.lastPhaseSeen >= 2],
            ].map(([label, unlocked]) => (
              <div key={label} style={{ padding: "12px 10px", borderRadius: 14, textAlign: "center", fontSize: 12, background: unlocked ? COLORS.blush : COLORS.creamDeep, color: unlocked ? COLORS.roseDark : COLORS.charcoalSoft, fontWeight: 600 }}>{unlocked ? "✓ " : "○ "}{label}</div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: 11.5, color: COLORS.charcoalSoft, textAlign: "center", margin: "20px 0 6px", lineHeight: 1.6 }}>
        Move at a pace that feels appropriate for you. Stop if you experience pain, dizziness, or unusual discomfort. This app provides general fitness guidance and is not medical advice.
      </p>
    </div>
  );
}
