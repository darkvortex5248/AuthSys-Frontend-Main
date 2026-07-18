local AuthSysClient = {}
AuthSysClient.__index = AuthSysClient

function AuthSysClient:new(app_secret, version, api_url)
    api_url = api_url or "https://authsys-main-production.up.railway.app/api/v1"
    local self = setmetatable({
        app_secret = app_secret,
        version = version,
        api_url = api_url:gsub("/+$", ""),
        session_token = nil,
        variables = {},
        last_error = "",
        last_response = "",
        initialized = false,
        username = "",
        email = "",
    }, AuthSysClient)
    return self
end

function AuthSysClient:get_hwid()
    local handle = io.popen("wmic volume where \"DriveLetter='C:'\" get SerialNumber /value 2>nul")
    if handle then
        local result = handle:read("*a")
        handle:close()
        for line in result:gmatch("[^\r\n]+") do
            if line:find("SerialNumber") then
                local val = line:match("SerialNumber=(.+)")
                if val then return val end
            end
        end
    end

    local f = io.open("/etc/machine-id", "r")
    if f then
        local id = f:read("*a"):gsub("%s+", "")
        f:close()
        if id ~= "" then return id end
    end

    return "FALLBACK_HWID"
end

function AuthSysClient:get_json(key, json_str)
    local ok, data = pcall(function() return require("json").decode(json_str) end)
    if ok and data and data[key] then
        return tostring(data[key])
    end
    -- Manual parse fallback
    local pattern = '"' .. key .. '":["]?(.-)["]?[,}]'
    local s, e, val = json_str:find(pattern)
    if s then return val end
    return ""
end

function AuthSysClient:post(endpoint, json_body, token)
    local url = self.api_url .. "/client/" .. endpoint
    local http = require("socket.http")
    local ltn12 = require("ltn12")

    local headers = {
        ["Content-Type"] = "application/json",
        ["Content-Length"] = #json_body,
    }
    if token then
        headers["Authorization"] = "Bearer " .. token
        headers["X-HWID"] = self:get_hwid()
    end

    local response_body = {}
    local res, code, response_headers = http.request{
        url = url,
        method = "POST",
        headers = headers,
        source = ltn12.source.string(json_body),
        sink = ltn12.sink.table(response_body),
        timeout = 30,
    }

    if res then
        return table.concat(response_body)
    else
        return '{"success":false,"detail":"' .. tostring(code) .. '"}'
    end
end

function AuthSysClient:init(app_name)
    app_name = app_name or ""
    self.last_error = ""
    self.last_response = ""
    self.initialized = false

    local json = '{"app_secret":"' .. self.app_secret .. '","version":"' .. self.version .. '","hwid":"' .. self:get_hwid() .. '","app_name":"' .. app_name .. '"}'
    self.last_response = self:post("init", json)

    local status = self:get_json("status", self.last_response)
    if status == "success" or status == "update_available" then
        self.initialized = true
        local ok, data = pcall(function() return require("json").decode(self.last_response) end)
        if ok and data and data.variables then
            self.variables = data.variables
        else
            self.variables = {}
        end
    else
        self.last_error = self:get_json("detail", self.last_response)
        if self.last_error == "" then self.last_error = "Init failed" end
    end
end

function AuthSysClient:login(username, password, session_length)
    session_length = session_length or 86400
    self.session_token = nil
    self.last_error = ""
    self.last_response = ""

    local json = '{"app_secret":"' .. self.app_secret .. '","username":"' .. username .. '","password":"' .. password .. '","hwid":"' .. self:get_hwid() .. '","session_length":' .. session_length .. '}'
    self.last_response = self:post("login", json)

    local detail = self:get_json("detail", self.last_response)
    if detail ~= "" then self.last_error = detail return end

    local success = self:get_json("success", self.last_response)
    if success == "true" then
        self.session_token = self:get_json("token", self.last_response)
        self.username = username
        self.email = self:get_json("email", self.last_response)
    else
        self.last_error = "Login failed"
    end
end

function AuthSysClient:register(username, password, license_key, email)
    email = email or ""
    self.last_error = ""
    self.last_response = ""

    local json = '{"app_secret":"' .. self.app_secret .. '","username":"' .. username .. '","password":"' .. password .. '","license_key":"' .. license_key .. '","hwid":"' .. self:get_hwid() .. '"'
    if email ~= "" then json = json .. ',"email":"' .. email .. '"' end
    json = json .. '}'

    self.last_response = self:post("register", json)

    local detail = self:get_json("detail", self.last_response)
    if detail ~= "" then self.last_error = detail return end

    local success = self:get_json("success", self.last_response)
    if success ~= "true" then self.last_error = "Registration failed" end
end

function AuthSysClient:license_login(license_key, session_length)
    session_length = session_length or 86400
    self.session_token = nil
    self.last_error = ""
    self.last_response = ""

    local json = '{"app_secret":"' .. self.app_secret .. '","license_key":"' .. license_key .. '","hwid":"' .. self:get_hwid() .. '","session_length":' .. session_length .. '}'
    self.last_response = self:post("license-login", json)

    local detail = self:get_json("detail", self.last_response)
    if detail ~= "" then self.last_error = detail return end

    local success = self:get_json("success", self.last_response)
    if success == "true" then
        self.session_token = self:get_json("token", self.last_response)
        self.username = self:get_json("username", self.last_response)
    else
        self.last_error = "License login failed"
    end
end

function AuthSysClient:license_check(license_key)
    self.last_error = ""
    self.last_response = ""
    local json = '{"app_secret":"' .. self.app_secret .. '","license_key":"' .. license_key .. '"}'
    self.last_response = self:post("license/check", json)
end

function AuthSysClient:verify()
    self.last_error = ""
    self.last_response = ""
    if not self.session_token then self.last_error = "No active session" return end
    self.last_response = self:post("verify", "{}", self.session_token)
end

function AuthSysClient:chat_send(room_id, message)
    self.last_error = ""
    self.last_response = ""
    local function urlencode(s)
        return (s:gsub("([^%w%.%-_~])", function(c)
            return string.format("%%%02X", string.byte(c))
        end))
    end
    local endpoint = "chat/send?room_id=" .. tostring(room_id) .. "&message=" .. urlencode(message)
    self.last_response = self:post(endpoint, "{}", self.session_token)
end

function AuthSysClient:var(name)
    if self.variables and self.variables[name] then
        return tostring(self.variables[name])
    end
    return ""
end

function AuthSysClient:logout()
    self.session_token = nil
    self.username = ""
    self.email = ""
    self.last_error = ""
    self.last_response = ""
end

return AuthSysClient
