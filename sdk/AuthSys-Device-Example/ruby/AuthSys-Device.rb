require 'net/http'
require 'json'
require 'digest'
require 'socket'

class AuthSysDevice
  attr_reader :last_error, :last_response

  def initialize(device_key, base_url = 'https://authsys-main-production.up.railway.app/device')
    @device_key = device_key
    @base_url = base_url.sub(/\/+$/, '')
    @last_error = ''
    @last_response = ''
    @uri = URI(@base_url)
  end

  def self.get_hwid
    hostname = Socket.gethostname
    Digest::MD5.hexdigest(hostname).upcase
  rescue
    'unknown'
  end

  private

  def request(endpoint, payload)
    uri = URI("#{@base_url}/#{endpoint}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = (uri.scheme == 'https')
    http.open_timeout = 15
    http.read_timeout = 15

    req = Net::HTTP::Post.new(uri.path)
    req['Content-Type'] = 'application/json'
    req.body = payload.to_json

    res = http.request(req)
    @last_response = res.body
    JSON.parse(res.body)
  rescue => e
    @last_error = e.message
    nil
  end

  public

  def check
    @last_error = ''
    data = request('check', {
      device_key: @device_key,
      hwid: self.class.get_hwid
    })
    return false unless data

    if data['active'] == true
      true
    else
      @last_error = data['message'] || 'Device deactivated by admin'
      false
    end
  end

  def register(device_name = '')
    @last_error = ''
    payload = { device_key: @device_key, hwid: self.class.get_hwid }
    payload[:device_name] = device_name unless device_name.empty?

    data = request('register', payload)
    return false unless data

    data['active'] == true
  end
end
