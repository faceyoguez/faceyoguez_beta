const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Levenshtein distance helper
function getEditDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

async function main() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, created_at');

  if (error) {
    console.error(error);
    return;
  }

  const target = '82535923';
  const targetWithCountry = '9182535923';
  console.log(`Fuzzy matching phone numbers against target: "${target}" / "${targetWithCountry}"...`);

  const results = [];
  profiles.forEach(p => {
    if (!p.phone) return;
    const cleanPhone = p.phone.replace(/[\s\-\+\(\)]/g, '');
    
    // Calculate edit distance
    const dist = getEditDistance(cleanPhone, targetWithCountry);
    const distNoCountry = getEditDistance(cleanPhone, target);
    
    // Check if cleanPhone contains any 4-digit substring of target
    let maxOverlap = 0;
    for (let len = 4; len <= target.length; len++) {
      for (let start = 0; start <= target.length - len; start++) {
        const sub = target.substring(start, start + len);
        if (cleanPhone.includes(sub)) {
          maxOverlap = Math.max(maxOverlap, len);
        }
      }
    }

    results.push({
      profile: p,
      cleanPhone,
      dist,
      distNoCountry,
      maxOverlap
    });
  });

  // Sort by maxOverlap descending, then by edit distance ascending
  results.sort((a, b) => b.maxOverlap - a.maxOverlap || a.distNoCountry - b.distNoCountry);

  console.log('\nTop 15 potential matches:');
  for (let i = 0; i < 15 && i < results.length; i++) {
    const r = results[i];
    console.log(`${i+1}. Name: ${r.profile.full_name} | Phone: ${r.profile.phone} | Clean: ${r.cleanPhone} | Overlap: ${r.maxOverlap} | Dist: ${r.distNoCountry} | Email: ${r.profile.email}`);
    // Fetch subscriptions for them
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', r.profile.id);
    if (subs && subs.length > 0) {
      console.log('   Subscriptions:');
      subs.forEach(s => {
        console.log(`     - Plan: ${s.plan_type} | Status: ${s.status} | Joined: ${s.created_at?.split('T')[0]} | Start: ${s.start_date}`);
      });
    }
  }
}

main();
