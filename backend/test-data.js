import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Use generic models
        const Employee = mongoose.models.Employee || mongoose.model('Employee', new mongoose.Schema({}, { strict: false }));
        const Enquiry = mongoose.models.Enquiry || mongoose.model('Enquiry', new mongoose.Schema({}, { strict: false }));
        const Member = mongoose.models.Member || mongoose.model('Member', new mongoose.Schema({}, { strict: false }));

        const user = await Employee.findOne({ email: 'darshandevelopment01@gmail.com' });

        if (!user) {
            console.log('User not found!');
        } else {
            console.log('User ID:', user._id.toString());
            console.log('User Type:', user.userType);

            const enqs = await Enquiry.find({ createdBy: user._id });
            console.log('Enquiries created by this user:', enqs.length);
            for (let e of enqs) {
                console.log(' - Enquiry ID:', e._id.toString());
            }

            const totalEnqs = await Enquiry.countDocuments();
            console.log('Total Enquiries in DB:', totalEnqs);

            const members = await Member.find({ convertedBy: user._id });
            console.log('Members converted by this user:', members.length);
            for (let m of members) {
                console.log(' - Member:', m.name, m._id.toString());
            }

            const totalMembers = await Member.countDocuments();
            console.log('Total Members in DB:', totalMembers);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
