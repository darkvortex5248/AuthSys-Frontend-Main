use authsys::{AuthSys, AuthSysOptions, AuthSysException};

fn main() {
    let options = AuthSysOptions::new("YOUR_APP_SECRET".to_string());
    let mut auth = AuthSys::new(options);

    match auth.init() {
        Ok(result) => {
            println!("=== Initializing ===");
            println!("Result: {}", result);
            println!("Is Initialized: {}", auth.is_initialized());
        }
        Err(e) => {
            println!("Auth Error [{}]: {}", e.error_code, e.message);
            return;
        }
    }

    println!("\n=== Registering ===");
    match auth.register("testuser", "Password123!", "AUTHSYS-KEY-123456", None) {
        Ok(result) => println!("Result: {}", result),
        Err(e) => println!("Error: {}", e),
    }

    println!("\n=== Logging in ===");
    match auth.login("testuser", "Password123!", 86400) {
        Ok(result) => {
            println!("Result: {}", result);
            println!("Is Authenticated: {}", auth.is_authenticated());
        }
        Err(e) => println!("Error: {}", e),
    }

    println!("\n=== Verifying ===");
    match auth.verify() {
        Ok(result) => println!("Result: {}", result),
        Err(e) => println!("Error: {}", e),
    }

    println!("\n=== License Login ===");
    match auth.license_login("AUTHSYS-KEY-123456", 86400) {
        Ok(result) => println!("Result: {}", result),
        Err(e) => println!("Error: {}", e),
    }

    println!("\n=== License Check ===");
    match auth.license_check("AUTHSYS-KEY-123456") {
        Ok(result) => println!("Result: {}", result),
        Err(e) => println!("Error: {}", e),
    }

    println!("\n=== Variables ===");
    for (key, value) in auth.get_all_variables() {
        println!("  {}: {}", key, value);
    }

    println!("\n=== Sending chat message ===");
    match auth.send_chat_message(1, "Hello World!") {
        Ok(result) => println!("Result: {}", result),
        Err(e) => println!("Error: {}", e),
    }

    println!("\n=== Device Registration ===");
    match auth.register_device("HWID123", Some("My Device")) {
        Ok(result) => println!("Result: {}", result),
        Err(e) => println!("Error: {}", e),
    }

    println!("\n=== Logging out ===");
    auth.logout();
    println!("Is Authenticated: {}", auth.is_authenticated());
}
