// Calculate Ujwala's milestone upload windows
const SUBSCRIPTION_START = '2026-07-06';
const PHOTO_MILESTONE_DAYS = [1, 7, 14, 21, 25, 30];

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days - 1); // day 1 = start date itself
  return d;
}

function formatDate(date) {
  return date.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

const start = new Date(SUBSCRIPTION_START);
const now = new Date();

// Current day
const diffMs = now.getTime() - start.getTime();
const currentDay = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);

console.log(`\n📅 Ujwala's Photo Milestone Schedule`);
console.log(`   Subscription Start: ${formatDate(start)}`);
console.log(`   Today: ${formatDate(now)} (Day ${currentDay})\n`);
console.log('='.repeat(80));

PHOTO_MILESTONE_DAYS.forEach((day, i) => {
  const milestoneDate = addDays(SUBSCRIPTION_START, day);
  const nextMilestoneDay = PHOTO_MILESTONE_DAYS[i + 1] || (day + 7);
  const windowCloseDate = addDays(SUBSCRIPTION_START, nextMilestoneDay);
  const windowCloseDateExclusive = new Date(windowCloseDate);
  windowCloseDateExclusive.setDate(windowCloseDate.getDate() - 1);

  let status;
  if (currentDay >= nextMilestoneDay) {
    status = '🔒 LOCKED (window closed)';
  } else if (currentDay >= day) {
    status = '✅ OPEN NOW — upload by ' + formatDate(windowCloseDateExclusive);
  } else {
    status = '🔓 Unlocks on ' + formatDate(milestoneDate);
  }

  console.log(`\nDay ${day.toString().padStart(2)}  →  ${formatDate(milestoneDate)}`);
  console.log(`       Window: ${formatDate(milestoneDate)} → ${formatDate(windowCloseDateExclusive)}`);
  console.log(`       Status: ${status}`);
});

console.log('\n' + '='.repeat(80));
console.log('\n📸 WHAT UJWALA SHOULD DO RIGHT NOW:');
console.log('  1. Upload Day 1 baseline photos (late upload — open now)');
console.log('  2. ALSO upload Day 14 photos today (window is open, closes when Day 21 starts)');
console.log(`\n  ⚠️  Day 14 window closes on: ${formatDate(addDays(SUBSCRIPTION_START, 21))}`);
console.log(`  ⚠️  Days remaining for Day 14: ${21 - currentDay} days`);
