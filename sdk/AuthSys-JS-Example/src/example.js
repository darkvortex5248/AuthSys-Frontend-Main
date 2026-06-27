const AuthSys = require('./index');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function main() {
    console.log("Welcome to AuthSys JavaScript Example");

    // Initialize the SDK
    const auth = new AuthSys(
        "TestApp",
        "your_owner_id",
        "your_app_secret",
        "1.0",
        "https://authsys-main-production.up.railway.app/api/v1"
    );

    console.log("\n--- Initializing ---");
    await auth.init();

    if (!auth.initialized) {
        console.log("Initialization failed. Exiting...");
        process.exit(1);
    }

    console.log("\n--- Variable Check ---");
    const myVar = auth.var("motd");
    console.log(`Message of the day: ${myVar}`);

    while (true) {
        console.log("\nSelect an option:");
        console.log("1. Login");
        console.log("2. Register");
        console.log("3. License Login");
        console.log("4. Exit");

        const choice = await question("Enter choice: ");

        if (choice === "1") {
            const username = await question("Username: ");
            const password = await question("Password: ");
            
            const success = await auth.login(username, password);
            if (success) {
                console.log(`Welcome back!`);
                break;
            }
        } else if (choice === "2") {
            const username = await question("Username: ");
            const password = await question("Password: ");
            const licenseKey = await question("License Key: ");
            
            await auth.register(username, password, licenseKey);
        } else if (choice === "3") {
            const licenseKey = await question("License Key: ");
            
            const success = await auth.license(licenseKey);
            if (success) {
                break;
            }
        } else if (choice === "4") {
            console.log("Exiting...");
            process.exit(0);
        } else {
            console.log("Invalid choice.");
        }
    }

    // Main Application Logic
    if (auth.sessionid) {
        console.log("\n--- Main Application ---");
        console.log("Your secure application code runs here.");
        setTimeout(() => {
            console.log("Done.");
            process.exit(0);
        }, 2000);
    }
}

main();
