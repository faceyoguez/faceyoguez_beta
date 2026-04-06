const http = require('http');

const urls = [
  '/',
  '/dashboard',
  '/student/dashboard',
  '/auth/login'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${url}`, (res) => {
      console.log(`URL: ${url} - Status: ${res.statusCode}`);
      resolve();
    }).on('error', (err) => {
      console.log(`URL: ${url} - Error: ${err.message}`);
      resolve();
    });
  });
}

(async () => {
  for (const url of urls) {
    await checkUrl(url);
  }
})();
