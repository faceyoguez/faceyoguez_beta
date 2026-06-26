const { getAdminStudentData } = require('./app/actions/admin');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const data = await getAdminStudentData();
  const manisha = data.find(s => s.email === 'manisha.mk210@gmail.com');
  console.log('Manisha Kirodiwal resolved object:', manisha);
}

main();
