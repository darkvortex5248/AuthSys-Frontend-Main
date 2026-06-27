require_relative 'authsys'

auth = AuthSysClient.new("your_app_secret", "1.0.0")
auth.init("Ruby-App")

unless auth.initialized
  puts "Init failed: #{auth.last_error}"
  return
end

puts "1. Login\n2. Register\n3. License Login"
print "Choose: "
opt = gets.chomp

case opt
when "1"
  print "Username: "
  user = gets.chomp
  print "Password: "
  pass = gets.chomp

  auth.login(user, pass)
  if auth.session_token
    puts "Welcome #{auth.username}!"
  else
    puts "Login failed: #{auth.last_error}"
  end

when "2"
  print "Username: "
  user = gets.chomp
  print "Password: "
  pass = gets.chomp
  print "License Key: "
  key = gets.chomp

  auth.register(user, pass, key)
  if auth.last_error.empty?
    puts "Registered!"
  else
    puts "Failed: #{auth.last_error}"
  end

when "3"
  print "License Key: "
  key = gets.chomp

  auth.license_login(key)
  if auth.session_token
    puts "Welcome #{auth.username}!"
  else
    puts "License login failed: #{auth.last_error}"
  end
end
