const { fetchActiveOneOnOneStudents } = require('./lib/actions/chat');
require('dotenv').config({ path: '.env.local' });

async function main() {
  // Let's run it with a dummy or real instructor ID, it uses admin client anyway
  const result = await fetchActiveOneOnOneStudents('00000000-0000-0000-0000-000000000000');
  console.log('fetchActiveOneOnOneStudents returned', result.length, 'students');
  const manisha = result.find(s => s.full_name.includes('Manisha'));
  console.log('Manisha in 1-on-1 list:', manisha);
}

main();
