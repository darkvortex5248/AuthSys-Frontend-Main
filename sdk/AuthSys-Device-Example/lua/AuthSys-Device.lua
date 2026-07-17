local http = require("socket.http")
local ltn12 = require("ltn12")
local json = require("json")

local Device = {}
Device.__index = Device

function Device:new(appSecret, baseUrl)
    local obj = {
        appSecret = appSecret,
        baseUrl = (baseUrl or "https://authsys-main-production.up.railway.app/device"):gsub("/+$", ""),
        lastError = "",
        lastResponse = ""
    }
    setmetatable(obj, self)
    return obj
end

local function getHWID()
    local handle = io.popen("wmic bios get serialnumber 2>nul")
    if handle then
        local result = handle:read("*a"):gsub("SerialNumber", ""):gsub("%s+", "")
        handle:close()
        if result and result ~= "" then return result end
    end
    local f = io.open("/etc/machine-id", "r")
    if f then
        local id = f:read("*l")
        f:close()
        if id and id ~= "" then return id end
    end
    return "unknown"
end

local function postRequest(self, endpoint, jsonData)
    local url = self.baseUrl .. "/" .. endpoint
    local responseBody = {}
    local _, status = http.request{
        url = url,
        method = "POST",
        headers = { ["Content-Type"] = "application/json" },
        source = ltn12.source.string(jsonData),
        sink = ltn12.sink.table(responseBody)
    }
    if status ~= 200 then
        self.lastError = "HTTP " .. tostring(status)
        return "{}"
    end
    return table.concat(responseBody)
end

function Device:check()
    self.lastError = ""
    local hwid = getHWID()
    local body = '{"device_key":"' .. self.appSecret .. '","hwid":"' .. hwid .. '"}'
    self.lastResponse = postRequest(self, "check", body)
    local ok, data = pcall(json.decode, self.lastResponse)
    if ok and data then
        if data.active == true then return true end
        self.lastError = data.message or "Device deactivated by admin"
        return false
    end
    self.lastError = "Failed to parse response"
    return false
end

function Device:register(deviceName)
    self.lastError = ""
    local hwid = getHWID()
    local body = '{"device_key":"' .. self.appSecret .. '","hwid":"' .. hwid .. '"'
    if deviceName and deviceName ~= "" then
        body = body .. ',"device_name":"' .. deviceName .. '"'
    end
    body = body .. "}"
    self.lastResponse = postRequest(self, "register", body)
    local ok, data = pcall(json.decode, self.lastResponse)
    if ok and data then
        return data.active == true
    end
    return false
end

return Device
