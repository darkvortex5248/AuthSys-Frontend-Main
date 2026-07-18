require 'net/http'
require 'uri'
require 'json'
require 'open3'

class AuthSysClient
  attr_reader :session_token, :last_error, :last_response, :initialized, :username, :email

  def initialize(app_secret, version, api_url = "https://authsys-main-production.up.railway.app/api/v1")
    @app_secret = app_secret
    @version = version
    @api_url = api_url.chomp("/")
    @http = Net::HTTP.new(URI(@api_url).host, URI(@api_url).port)
    @http.use_ssl = URI(@api_url).scheme == 'https'
    @http.open_timeout = 30
    @http.read_timeout = 30

    @session_token = nil
    @last_error = ""
    @last_response = ""
    @initialized = false
    @username = ""
    @email = ""
  end

  def get_hwid
    # Windows volume serial
    if Gem.win_platform?
      stdout, _stderr, _status = Open3.capture3('wmic', 'volume', 'where', "DriveLetter='C:'", 'get', 'SerialNumber', '/value')
      stdout.each_line do |line|
        if line.include?('SerialNumber')
          return line.split('=').last.strip rescue nil
        end
      end
    end

    # Linux machine-id
    if File.exist?('/etc/machine-id')
      return File.read('/etc/machine-id').strip
    end

    "FALLBACK_HWID"
  end

  def post(endpoint, body, token = nil)
    url = URI("#{@api_url}/client/#{endpoint}")
    req = Net::HTTP::Post.new(url)
    req['Content-Type'] = 'application/json'
    req.body = body.to_json

    if token
      req['Authorization'] = "Bearer #{token}"
      req['X-HWID'] = get_hwid
    end

    res = @http.request(req)
    res.body
  rescue => e
    %Q({"success":false,"detail":"#{e.message}"})
  end

  def init(app_name = "")
    @last_error = ""
    @last_response = ""
    @initialized = false

    @last_response = post("init", {
      app_secret: @app_secret,
      version: @version,
      hwid: get_hwid,
      app_name: app_name
    })

    data = JSON.parse(@last_response) rescue {}
    status = data["status"]
    if status == "success" || status == "update_available"
      @initialized = true
    else
      @last_error = data["detail"] || "Init failed"
    end
  end

  def login(username, password, session_length = 86400)
    @session_token = nil
    @last_error = ""
    @last_response = ""

    @last_response = post("login", {
      app_secret: @app_secret,
      username: username,
      password: password,
      hwid: get_hwid,
      session_length: session_length
    })

    data = JSON.parse(@last_response) rescue {}
    if data["detail"] && !data["detail"].empty?
      @last_error = data["detail"]
      return
    end

    if data["success"] == true || data["success"] == "true"
      @session_token = data["token"]
      @username = username
      @email = data["email"] || ""
    else
      @last_error = "Login failed"
    end
  end

  def register(username, password, license_key, email = "")
    @last_error = ""
    @last_response = ""

    body = {
      app_secret: @app_secret,
      username: username,
      password: password,
      license_key: license_key,
      hwid: get_hwid
    }
    body[:email] = email unless email.empty?

    @last_response = post("register", body)

    data = JSON.parse(@last_response) rescue {}
    if data["detail"] && !data["detail"].empty?
      @last_error = data["detail"]
      return
    end

    unless data["success"] == true || data["success"] == "true"
      @last_error = "Registration failed"
    end
  end

  def license_login(license_key, session_length = 86400)
    @session_token = nil
    @last_error = ""
    @last_response = ""

    @last_response = post("license-login", {
      app_secret: @app_secret,
      license_key: license_key,
      hwid: get_hwid,
      session_length: session_length
    })

    data = JSON.parse(@last_response) rescue {}
    if data["detail"] && !data["detail"].empty?
      @last_error = data["detail"]
      return
    end

    if data["success"] == true || data["success"] == "true"
      @session_token = data["token"]
      @username = data["username"] || ""
    else
      @last_error = "License login failed"
    end
  end

  def license_check(license_key)
    @last_error = ""
    @last_response = ""
    @last_response = post("license/check", {
      app_secret: @app_secret,
      license_key: license_key
    })
  end

  def verify
    @last_error = ""
    @last_response = ""
    unless @session_token
      @last_error = "No active session"
      return
    end
    @last_response = post("verify", {}, @session_token)
  end

  def chat_send(room_id, message)
    @last_error = ""
    @last_response = ""
    endpoint = "chat/send?room_id=#{room_id}&message=#{URI.encode_www_form_component(message)}"
    @last_response = post(endpoint, {}, @session_token)
  end

  def var(name)
    JSON.parse(@last_response)[name] rescue ""
  end

  def logout
    @session_token = nil
    @username = ""
    @email = ""
    @last_error = ""
    @last_response = ""
  end
end
