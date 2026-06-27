#include <iostream>
#include "AuthSys.hpp"

using namespace AuthSys;

api AuthSysApp(
    "TestApp",
    "your_owner_id",
    "your_app_secret",
    "1.0",
    "https://authsys-main-production.up.railway.app/api/v1"
);

int main() {
    std::cout << "\n\n Connecting..\n";
    AuthSysApp.init();

    if (!AuthSysApp.initialized) {
        std::cout << "\n Initialization Failed.";
        return 1;
    }

    std::cout << "\n [1] Login\n [2] Register\n [3] License key only\n\n Choose option: ";
    int option;
    std::cin >> option;

    std::string username, password, key;

    switch (option) {
        case 1:
            std::cout << "\n Enter username: ";
            std::cin >> username;
            std::cout << "\n Enter password: ";
            std::cin >> password;
            AuthSysApp.login(username, password);
            break;
        case 2:
            std::cout << "\n Enter username: ";
            std::cin >> username;
            std::cout << "\n Enter password: ";
            std::cin >> password;
            std::cout << "\n Enter license: ";
            std::cin >> key;
            AuthSysApp.register_user(username, password, key);
            break;
        case 3:
            std::cout << "\n Enter license: ";
            std::cin >> key;
            AuthSysApp.license(key);
            break;
        default:
            std::cout << "\n Invalid option";
            return 1;
    }

    if (!AuthSysApp.sessionid.empty()) {
        std::cout << "\n Success! Logged in.\n";
        std::cout << "\n [Main Application Running...]\n";
    } else {
        std::cout << "\n Failed to authenticate.\n";
    }

    return 0;
}
