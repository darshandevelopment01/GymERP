require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Need to load the Employee model compiled by TS, or just make a raw insertion
    const Employee = require('./dist/models/Employee').default;

    try {
        const rawData = {
            name: 'Test Create',
            email: 'testcreate2@test.com',
            phone: '8888777766',
            gender: 'Male',
            userType: 'User',
            password: 'hashedpassword123',
            employeeCode: `EMP-${Date.now()}`
        };

        console.log('Inserting...', rawData);
        const emp = new Employee(rawData);
        await emp.save();
        console.log('Success:', emp._id);

    } catch (err) {
        console.log('Validation Error:', err.message);
        if (err.errors) {
            console.log('Errors dict:', Object.keys(err.errors).map(k => err.errors[k].message));
        }
    }
    process.exit();
}

run();
