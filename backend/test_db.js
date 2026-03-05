const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://buildsathi:BuildSathi2025%40Secure@build-sathi.vmqjpiz.mongodb.net/gym-erp?retryWrites=true&w=majority')
    .then(async () => {
        const db = mongoose.connection.db;
        const users = await db.collection('users').find({ email: 'tonystark31949@gmail.com' }).toArray();
        console.log('--- Users ---');
        console.log(JSON.stringify(users, null, 2));

        const emps = await db.collection('employees').find({ email: 'tonystark31949@gmail.com' }).toArray();
        console.log('\n--- Employees ---');
        console.log(JSON.stringify(emps, null, 2));

        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(1);
    });
