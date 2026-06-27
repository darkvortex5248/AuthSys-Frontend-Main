local AuthSysClient = require("authsys")

local auth = AuthSysClient:new("your_app_secret", "1.0.0")
auth:init("Lua-App")

if not auth.initialized then
    print("Init failed: " .. auth.last_error)
    return
end

print("1. Login\n2. Register\n3. License Login")
io.write("Choose: ")
io.flush()
local opt = io.read()

if opt == "1" then
    io.write("Username: ")
    io.flush()
    local user = io.read()
    io.write("Password: ")
    io.flush()
    local pass = io.read()

    auth:login(user, pass)
    if auth.session_token then
        print("Welcome " .. auth.username .. "!")
    else
        print("Login failed: " .. auth.last_error)
    end
elseif opt == "2" then
    io.write("Username: ")
    io.flush()
    local user = io.read()
    io.write("Password: ")
    io.flush()
    local pass = io.read()
    io.write("License Key: ")
    io.flush()
    local key = io.read()

    auth:register(user, pass, key)
    if auth.last_error == "" then
        print("Registered!")
    else
        print("Failed: " .. auth.last_error)
    end
elseif opt == "3" then
    io.write("License Key: ")
    io.flush()
    local key = io.read()

    auth:license_login(key)
    if auth.session_token then
        print("Welcome " .. auth.username .. "!")
    else
        print("License login failed: " .. auth.last_error)
    end
end
