<?php
require_once 'authsys.php';

$auth = new AuthSysClient("your_app_secret", "1.0.0");
$auth->init("PHP-App");

if (!$auth->initialized) {
    die("Init failed: " . $auth->lastError . "\n");
}

echo "1. Login\n2. Register\n3. License Login\nChoose: ";
$opt = trim(fgets(STDIN));

switch ($opt) {
    case "1":
        echo "Username: ";
        $user = trim(fgets(STDIN));
        echo "Password: ";
        $pass = trim(fgets(STDIN));
        $auth->login($user, $pass);
        if ($auth->sessionToken) {
            echo "Welcome {$auth->username}!\n";
        } else {
            echo "Login failed: {$auth->lastError}\n";
        }
        break;

    case "2":
        echo "Username: ";
        $user = trim(fgets(STDIN));
        echo "Password: ";
        $pass = trim(fgets(STDIN));
        echo "License Key: ";
        $key = trim(fgets(STDIN));
        $auth->register($user, $pass, $key);
        echo $auth->lastError ? "Failed: {$auth->lastError}\n" : "Registered!\n";
        break;

    case "3":
        echo "License Key: ";
        $key = trim(fgets(STDIN));
        $auth->licenseLogin($key);
        if ($auth->sessionToken) {
            echo "Welcome {$auth->username}!\n";
        } else {
            echo "License login failed: {$auth->lastError}\n";
        }
        break;
}
