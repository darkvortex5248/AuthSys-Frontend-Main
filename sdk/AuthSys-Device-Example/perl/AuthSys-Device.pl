package AuthSysDevice;

use strict;
use warnings;
use LWP::UserAgent;
use JSON;
use Digest::MD5 qw(md5_hex);
use Sys::Hostname;

sub new {
    my ($class, $device_key, $base_url) = @_;
    $base_url ||= 'https://authsys-main-production.up.railway.app/device';
    $base_url =~ s/\/+$//;
    my $self = {
        device_key   => $device_key,
        base_url     => $base_url,
        last_error   => '',
        last_response => '',
        ua           => LWP::UserAgent->new(timeout => 15),
    };
    $self->{ua}->default_header('Content-Type' => 'application/json');
    return bless $self, $class;
}

sub _get_hwid {
    my $hostname = hostname();
    return uc(md5_hex($hostname));
}

sub _request {
    my ($self, $endpoint, $payload) = @_;
    my $url = $self->{base_url} . '/' . $endpoint;
    my $json = encode_json($payload);
    my $resp = $self->{ua}->post($url, Content => $json);
    $self->{last_response} = $resp->decoded_content || '';
    return $resp;
}

sub check {
    my $self = shift;
    $self->{last_error} = '';
    my $payload = {
        device_key => $self->{device_key},
        hwid       => _get_hwid(),
    };
    my $resp = $self->_request('check', $payload);
    if ($resp->is_success) {
        my $data = decode_json($self->{last_response});
        if ($data->{active}) { return 1 }
        $self->{last_error} = $data->{message} || 'Device deactivated by admin';
        return 0;
    }
    $self->{last_error} = $resp->status_line;
    return 0;
}

sub register {
    my ($self, $device_name) = @_;
    $self->{last_error} = '';
    my $payload = {
        device_key => $self->{device_key},
        hwid       => _get_hwid(),
    };
    $payload->{device_name} = $device_name if $device_name;
    my $resp = $self->_request('register', $payload);
    if ($resp->is_success) {
        my $data = decode_json($self->{last_response});
        return $data->{active} ? 1 : 0;
    }
    $self->{last_error} = $resp->status_line;
    return 0;
}

1;
