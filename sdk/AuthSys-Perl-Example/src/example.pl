use strict;
use warnings;
use lib '.';
use AuthSysClient;

my $auth = AuthSysClient->new("your_app_secret", "1.0.0");
$auth->init("Perl-App");

unless ($auth->{initialized}) {
    print "Init failed: $auth->{last_error}\n";
    exit;
}

print "1. Login\n2. Register\n3. License Login\nChoose: ";
chomp(my $opt = <STDIN>);

if ($opt eq "1") {
    print "Username: "; chomp(my $user = <STDIN>);
    print "Password: "; chomp(my $pass = <STDIN>);

    $auth->login($user, $pass);
    if ($auth->{session_token}) {
        print "Welcome $auth->{username}!\n";
    } else {
        print "Login failed: $auth->{last_error}\n";
    }

} elsif ($opt eq "2") {
    print "Username: "; chomp(my $user = <STDIN>);
    print "Password: "; chomp(my $pass = <STDIN>);
    print "License Key: "; chomp(my $key = <STDIN>);

    $auth->register($user, $pass, $key);
    if ($auth->{last_error}) {
        print "Failed: $auth->{last_error}\n";
    } else {
        print "Registered!\n";
    }

} elsif ($opt eq "3") {
    print "License Key: "; chomp(my $key = <STDIN>);

    $auth->license_login($key);
    if ($auth->{session_token}) {
        print "Welcome $auth->{username}!\n";
    } else {
        print "License login failed: $auth->{last_error}\n";
    }
}
