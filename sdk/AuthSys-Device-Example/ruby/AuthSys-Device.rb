require 'net/http'
require 'json'
require 'digest'
require 'socket'

class AuthSysDevice
  attr_reader :last_error, :last_response

  def initialize(group_secret, base_url = 'https://api.authsys.dpdns.org/api/v1/client')
    @group_secret = group_secret
    @base_url = base_url.sub(/\/+$/, '')
    @last_error = ''
    @last_response = ''
    @uri = URI(@base_url)
  end

  def self.get_hwid
    raw = Socket.gethostname
    if RUBY_PLATFORM =~ /mingw|mswin/
      begin
        raw += `wmic nic where "NetEnabled=true" get MACAddress 2>nul`.to_s
      rescue; end
    else
      begin
        raw += `ifconfig 2>/dev/null`.to_s
      rescue; end
    end
    Digest::MD5.hexdigest(raw).upcase
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
      group_secret: @group_secret,
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
    payload = { group_secret: @group_secret, hwid: self.class.get_hwid }
    payload[:device_name] = device_name unless device_name.empty?

    data = request('register', payload)
    return false unless data

    data['active'] == true
  end
end

