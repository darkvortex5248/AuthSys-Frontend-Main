package AuthSysClient;
use strict;
use warnings;
use LWP::UserAgent;
use JSON;
use URI::Escape;

sub new {
    my ($class, $app_secret, $version, $api_url) = @_;
    $api_url ||= "https://api.authsys.dpdns.org/api/v1";
    $api_url =~ s/\/+$//;

    my $self = {
        app_secret => $app_secret,
        version => $version,
        api_url => $api_url,
        ua => LWP::UserAgent->new(timeout => 30),
        session_token => undef,
        last_error => "",
        last_response => "",
        initialized => 0,
        username => "",
        email => "",
        variables => {},
    };

    $self->{ua}->ssl_opts(verify_hostname => 1);
    bless $self, $class;
    return $self;
}

sub get_hwid {
    my $hwid = "FALLBACK_HWID";

    # Windows volume serial
    if ($^O eq 'MSWin32') {
        my $output = `wmic volume where "DriveLetter='C:'" get SerialNumber /value 2>nul`;
        if ($output =~ /SerialNumber=(\S+)/) {
            return $1;
        }
    }

    # Linux machine-id
    if (-e '/etc/machine-id') {
        open my $fh, '<', '/etc/machine-id' or return $hwid;
        chomp(my $id = <$fh>);
        close $fh;
        return $id if $id;
    }

    return $hwid;
}

sub post {
    my ($self, $endpoint, $data, $token) = @_;
    my $url = $self->{api_url} . "/client/$endpoint";
    my $json = encode_json($data);

    my $req = HTTP::Request->new(POST => $url);
    $req->content_type('application/json');
    $req->content($json);

    if ($token) {
        $req->header('Authorization' => "Bearer $token");
        $req->header('X-HWID' => $self->get_hwid());
    }

    my $res = $self->{ua}->request($req);
    if ($res->is_success) {
        return $res->decoded_content;
    } else {
        return qq({"success":false,"detail":"${\$res->status_line}"});
    }
}

sub init {
    my ($self, $app_name) = @_;
    $app_name ||= "";
    $self->{last_error} = "";
    $self->{last_response} = "";
    $self->{initialized} = 0;

    $self->{last_response} = $self->post("init", {
        app_secret => $self->{app_secret},
        version => $self->{version},
        hwid => $self->get_hwid(),
        app_name => $app_name,
    });

    my $data = decode_json($self->{last_response});
    my $status = $data->{status} || "";
    if ($status eq "success" || $status eq "update_available") {
        $self->{initialized} = 1;
        $self->{variables} = $data->{variables} || {};
    } else {
        $self->{last_error} = $data->{detail} || "Init failed";
    }
}

sub login {
    my ($self, $username, $password, $session_length) = @_;
    $session_length ||= 86400;
    $self->{session_token} = undef;
    $self->{last_error} = "";
    $self->{last_response} = "";

    $self->{last_response} = $self->post("login", {
        app_secret => $self->{app_secret},
        username => $username,
        password => $password,
        hwid => $self->get_hwid(),
        session_length => $session_length,
    });

    my $data = decode_json($self->{last_response});
    if ($data->{detail}) { $self->{last_error} = $data->{detail}; return }

    if ($data->{success}) {
        $self->{session_token} = $data->{token};
        $self->{username} = $username;
        $self->{email} = $data->{email} || "";
    } else {
        $self->{last_error} = "Login failed";
    }
}

sub register {
    my ($self, $username, $password, $license_key, $email) = @_;
    $email ||= "";
    $self->{last_error} = "";
    $self->{last_response} = "";

    my %body = (
        app_secret => $self->{app_secret},
        username => $username,
        password => $password,
        license_key => $license_key,
        hwid => $self->get_hwid(),
    );
    $body{email} = $email if $email ne "";

    $self->{last_response} = $self->post("register", \%body);

    my $data = decode_json($self->{last_response});
    if ($data->{detail}) { $self->{last_error} = $data->{detail}; return }

    unless ($data->{success}) {
        $self->{last_error} = "Registration failed";
    }
}

sub license_login {
    my ($self, $license_key, $session_length) = @_;
    $session_length ||= 86400;
    $self->{session_token} = undef;
    $self->{last_error} = "";
    $self->{last_response} = "";

    $self->{last_response} = $self->post("license-login", {
        app_secret => $self->{app_secret},
        license_key => $license_key,
        hwid => $self->get_hwid(),
        session_length => $session_length,
    });

    my $data = decode_json($self->{last_response});
    if ($data->{detail}) { $self->{last_error} = $data->{detail}; return }

    if ($data->{success}) {
        $self->{session_token} = $data->{token};
        $self->{username} = $data->{username} || "";
    } else {
        $self->{last_error} = "License login failed";
    }
}

sub license_check {
    my ($self, $license_key) = @_;
    $self->{last_error} = "";
    $self->{last_response} = "";
    $self->{last_response} = $self->post("license/check", {
        app_secret => $self->{app_secret},
        license_key => $license_key,
    });
}

sub verify {
    my $self = shift;
    $self->{last_error} = "";
    $self->{last_response} = "";
    unless ($self->{session_token}) { $self->{last_error} = "No active session"; return }
    $self->{last_response} = $self->post("verify", {}, $self->{session_token});
}

sub chat_send {
    my ($self, $room_id, $message) = @_;
    $self->{last_error} = "";
    $self->{last_response} = "";
    my $endpoint = "chat/send?room_id=$room_id&message=" . uri_escape($message);
    $self->{last_response} = $self->post($endpoint, {}, $self->{session_token});
}

sub var {
    my ($self, $name) = @_;
    return $self->{variables}->{$name} // "";
}

sub logout {
    my $self = shift;
    $self->{session_token} = undef;
    $self->{username} = "";
    $self->{email} = "";
    $self->{last_error} = "";
    $self->{last_response} = "";
}

1;
