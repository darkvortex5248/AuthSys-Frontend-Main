mod authsys;
use authsys::AuthSysClient;

fn main() {
    let mut auth = AuthSysClient::new("your_app_secret", "1.0.0", None);
    auth.init(Some("Rust-App"));

    if !auth.initialized {
        eprintln!("Init failed: {}", auth.last_error);
        return;
    }

    println!("1. Login\n2. Register\n3. License Login");
    print!("Choose: ");
    std::io::Write::flush(&mut std::io::stdout()).unwrap();

    let mut opt = String::new();
    std::io::stdin().read_line(&mut opt).unwrap();

    match opt.trim() {
        "1" => {
            print!("Username: ");
            std::io::Write::flush(&mut std::io::stdout()).unwrap();
            let mut user = String::new();
            std::io::stdin().read_line(&mut user).unwrap();

            print!("Password: ");
            std::io::Write::flush(&mut std::io::stdout()).unwrap();
            let mut pass = String::new();
            std::io::stdin().read_line(&mut pass).unwrap();

            auth.login(user.trim(), pass.trim(), None);
            if auth.session_token.is_some() {
                println!("Welcome {}!", auth.username);
            } else {
                eprintln!("Login failed: {}", auth.last_error);
            }
        }
        "2" => {
            print!("Username: ");
            std::io::Write::flush(&mut std::io::stdout()).unwrap();
            let mut user = String::new();
            std::io::stdin().read_line(&mut user).unwrap();

            print!("Password: ");
            std::io::Write::flush(&mut std::io::stdout()).unwrap();
            let mut pass = String::new();
            std::io::stdin().read_line(&mut pass).unwrap();

            print!("License Key: ");
            std::io::Write::flush(&mut std::io::stdout()).unwrap();
            let mut key = String::new();
            std::io::stdin().read_line(&mut key).unwrap();

            auth.register(user.trim(), pass.trim(), key.trim(), None);
            if auth.last_error.is_empty() {
                println!("Registered!");
            } else {
                eprintln!("Failed: {}", auth.last_error);
            }
        }
        "3" => {
            print!("License Key: ");
            std::io::Write::flush(&mut std::io::stdout()).unwrap();
            let mut key = String::new();
            std::io::stdin().read_line(&mut key).unwrap();

            auth.license_login(key.trim(), None);
            if auth.session_token.is_some() {
                println!("Welcome {}!", auth.username);
            } else {
                eprintln!("License login failed: {}", auth.last_error);
            }
        }
        _ => eprintln!("Invalid option"),
    }
}
