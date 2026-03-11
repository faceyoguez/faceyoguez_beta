import { sendBatchMessage } from '../lib/actions/chat';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

(async () => {
    // Using the IDs from the user's manual enrollment
    const batchId = 'b78c3adf-85e9-4e74-a309-57d84db49255';
    const studentId = 'bca4fb53-ead9-432f-886b-1e7038bbc54f';
    const content = 'Hello from the debug script!';

    try {
        const result = await sendBatchMessage(batchId, content, studentId);
        fs.writeFileSync('send_result.json', JSON.stringify({ result }, null, 2));
    } catch (err: any) {
        fs.writeFileSync('send_result.json', JSON.stringify({ error: err.message }, null, 2));
    }
})();
