import { AuthSys } from './index';

async function runExample() {
    console.log("Starting AuthSys TS Example...");
    const auth = new AuthSys("TestApp", "ownerid", "app_secret", "1.0");

    await auth.init();

    if (auth.initialized) {
        console.log("MOTD Variable: ", auth.var("motd"));

        const success = await auth.login("test", "test");
        if (success) {
            console.log("Logged in!", auth.userData);
        } else {
            console.log("Login failed.");
        }
    }
}

runExample();
