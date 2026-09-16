const fs = require('fs');
const pdf = require('pdf-parse');

const pdfParse = typeof pdf === 'function' ? pdf : pdf.default || pdf.pdfParse;

async function main() {
  console.log("==========================================");
  console.log("PDF 1: Rashmi_FaceRoutine_1_6.pdf");
  console.log("==========================================");
  const dataBuffer1 = fs.readFileSync('scratch/Rashmi_FaceRoutine_1_6.pdf');
  const res1 = await pdfParse(dataBuffer1);
  console.log(res1.text);

  console.log("\n==========================================");
  console.log("PDF 2: BODYWORKS_NEW.pdf");
  console.log("==========================================");
  const dataBuffer2 = fs.readFileSync('scratch/BODYWORKS_NEW.pdf');
  const res2 = await pdfParse(dataBuffer2);
  console.log(res2.text);
}

main().catch(console.error);
