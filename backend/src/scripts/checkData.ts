import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const db = mongoose.connection.db;
    if (!db) return;
    const followups = await db.collection('followups').find({ enquiry: { $exists: true } }).sort({ createdAt: -1 }).limit(2).toArray();
    console.log('Follow-ups:', JSON.stringify(followups, null, 2));

    if (followups.length > 0 && followups[0].enquiry) {
        const enq = await db.collection('enquiries').findOne({ _id: followups[0].enquiry });
        console.log('Enquiry:', JSON.stringify(enq, null, 2));
    }
    process.exit(0);
}
run().catch(console.error);
