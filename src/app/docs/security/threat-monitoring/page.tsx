'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function ThreatMonitoringPage() {
  return (
    <DocPageLayout
      title="Threat Monitoring"
      subtitle="AuthSys monitors all API traffic in real time to detect and block abusive behavior, including brute force attacks, credential stuffing, VPN/proxy usage, and anomalous validation patterns."
      sections={[
        {
          title: 'Real-Time Detection Engine',
          content: (
            <>
              <p>The threat monitoring engine processes every API request through a series of analysis pipelines:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Rate Analysis</strong> — Detects burst patterns, rapid-fire validation, and distributed attacks.</li>
                <li><strong>Geolocation Checks</strong> — Compares request IP against expected user geography.</li>
                <li><strong>Proxy/VPN Detection</strong> — Identifies requests originating from known VPN, proxy, and Tor exit nodes.</li>
                <li><strong>Behavioral Analysis</strong> — Flags unusual validation patterns (e.g., 100 different keys from the same IP).</li>
              </ul>
              <Callout variant="info">
                Threat events are visible in the dashboard's Threat Feed within seconds. You can configure webhook notifications for real-time alerting.
              </Callout>
            </>
          ),
        },
        {
          title: 'VPN & Proxy Detection',
          content: (
            <>
              <p>AuthSys maintains a regularly updated database of known VPN, proxy, and anonymizer IP ranges. Requests from these IPs can be logged, flagged, or blocked entirely based on your settings.</p>
              <CodeBlock code={`// Configure VPN/Proxy handling
curl -X PUT https://api.authsys.io/v1/settings/threat-monitoring \\
  -H "X-API-Key: as_api_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "vpn_detection": {
      "enabled": true,
      "action": "flag",           // "allow" | "flag" | "block"
      "block_message": "Please disable your VPN to use this software."
    },
    "proxy_detection": {
      "enabled": true,
      "action": "block"
    },
    "tor_detection": {
      "enabled": true,
      "action": "block"
    }
  }'`} lang="bash" title="VPN detection config" />
              <Callout variant="warning">
                Blocking VPNs can affect legitimate users who rely on VPNs for privacy. Consider using the <code>flag</code> action first, monitoring the impact, and escalating to <code>block</code> only if abuse is detected.
              </Callout>
            </>
          ),
        },
        {
          title: 'Brute Force Protection',
          content: (
            <>
              <p>AuthSys automatically detects and mitigates brute force attacks against your license keys and user accounts:</p>
              <CodeBlock code={`// Brute force protection settings
{
  "brute_force": {
    "max_attempts_per_ip": 10,
    "window_minutes": 15,
    "block_duration_minutes": 60,
    "notify_on_block": true,
    "webhook_url": "https://myapp.com/webhooks/security"
  },
  "rate_limiting": {
    "enabled": true,
    "requests_per_second": 50,
    "burst_size": 100
  }
}`} lang="json" title="brute-force-config.json" />
              <p>When a brute force attack is detected, the offending IP is automatically blocked. You will receive a notification (and optionally a webhook payload) with details about the incident.</p>
            </>
          ),
        },
        {
          title: 'Threat Feed & Alerts',
          content: (
            <>
              <p>The dashboard's Threat Feed provides a real-time view of security events. Each event includes the threat type, source IP, geographic origin, affected resource, and timestamp.</p>
              <CodeBlock code={`// Sample threat event webhook payload
{
  "event": "threat.detected",
  "payload": {
    "threat_type": "brute_force",
    "severity": "high",
    "source_ip": "203.0.113.42",
    "country": "RU",
    "target": "license:ACTIVATE-ABCDE",
    "attempts": 47,
    "timestamp": "2026-06-15T08:23:19Z"
  }
}`} lang="json" title="threat-event.json" />
              <Callout variant="tip">
                Set up a Discord or Slack webhook to receive threat alerts in real time. Go to <strong>Settings → Webhooks</strong> in the dashboard and select the <code>threat.*</code> event types.
              </Callout>
            </>
          ),
        },
        {
          title: 'Behavioral Threat Intelligence',
          content: (
            <>
              <p>The Behavioral Threat Intelligence module (available on Enterprise plans) uses machine learning to detect advanced abuse patterns:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Anomaly Detection</strong> — Establishes baseline usage patterns per license and flags outliers (e.g., a key validated from 3 countries in 5 minutes).</li>
                <li><strong>Credential Stuffing Detection</strong> — Identifies when leaked license keys from other platforms are being tested against your app.</li>
                <li><strong>Time-Based Analysis</strong> — Flags validation attempts at unusual hours or compressed time windows.</li>
                <li><strong>Co-occurrence Analysis</strong> — Detects when multiple licenses share suspicious characteristics (same HWID prefix, sequential key patterns).</li>
              </ul>
              <CodeBlock code={`// Example threat intelligence event
{
  "type": "threat.behavioral_anomaly",
  "severity": "medium",
  "score": 78,
  "indicators": [
    { "type": "geo_velocity", "value": "3 countries in 300s" },
    { "type": "time_anomaly", "value": "validation_at_3am" }
  ],
  "license_key": "PREMIUM-A1B2C3D4-..."
}`} lang="json" title="Behavioral threat event" />
              <Callout variant="info">
                Behavioral intelligence requires at least 7 days of data to establish baselines. The system improves accuracy over time as more data is collected.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
