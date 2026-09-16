const fs = require('fs');
const http = require('https');

const pdf1 = 'https://vdeddkrsumjhzkqaeywl.supabase.co/storage/v1/object/public/resources/12051866-1727-4e10-8b68-9e3f81729fdc/9c39dc58-d4f0-44d3-a860-ea89e56d316d.pdf';
const pdf2 = 'https://vdeddkrsumjhzkqaeywl.supabase.co/storage/v1/object/public/resources/12051866-1727-4e10-8b68-9e3f81729fdc/e4a0148e-888f-4f03-a4aa-99d90a9164ba.pdf';

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    http.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log("Downloading PDFs...");
  await downloadFile(pdf1, 'scratch/Rashmi_FaceRoutine_1_6.pdf');
  console.log("Downloaded Rashmi_FaceRoutine_1_6.pdf");
  await downloadFile(pdf2, 'scratch/BODYWORKS_NEW.pdf');
  console.log("Downloaded BODYWORKS_NEW.pdf");
}

main().catch(console.error);
