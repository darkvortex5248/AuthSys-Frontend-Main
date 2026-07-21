'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function AntiTamperPage() {
  return (
    <DocPageLayout
      title="Anti-Tamper"
      subtitle="AuthSys provides multiple layers of tamper protection to detect and respond to unauthorized modifications of your software, debugger attachment, and virtualized execution environments."
      sections={[
        {
          title: 'Runtime Integrity Checks',
          content: (
            <>
              <p>The AuthSys SDK performs periodic integrity checks during execution. These checks verify that the application binary has not been modified since distribution, that no debuggers are attached, and that the process is running in a genuine environment.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Code Integrity</strong> — Checksums of critical code sections are verified at runtime.</li>
                <li><strong>Debugger Detection</strong> — Uses OS-specific APIs to detect attached debuggers (IsDebuggerPresent on Windows, ptrace on Linux).</li>
                <li><strong>VM Detection</strong> — Heuristics detect common virtualization and emulation environments.</li>
              </ul>
              <CodeBlock code={`// Anti-tamper configuration
const client = new AuthSysClient({
  apiKey: '...',
  antiTamper: {
    enabled: true,
    checksumIntervalMs: 30000,   // Check every 30 seconds
    debuggerAction: 'report',    // 'report' | 'block' | 'crash'
    vmDetection: true,
    allowedEnvironments: [
      'windows', 'macos', 'linux',
      // 'wsl',  // optionally allow WSL
    ],
  },
});`} lang="typescript" title="anti-tamper-config.ts" />
              <Callout variant="danger">
                Setting <code>debuggerAction</code> to <code>'crash'</code> will terminate the process immediately upon detecting a debugger. Use this only in production builds after thorough testing.
              </Callout>
            </>
          ),
        },
        {
          title: 'Code Obfuscation',
          content: (
            <>
              <p>For compiled languages (C++, C#), AuthSys recommends integrating with a code obfuscator before distribution. The SDK includes helpers that integrate with popular obfuscation tools:</p>
              <CodeBlock code={`// Obfuscation integration (C++)
#include <authsys/obfuscation.h>

// Obfuscate string literals
AUTHSYS_OBFUSCATE_STR("API_KEY", "as_api_...");

// Anti-debug breakpoints
AUTHSYS_ANTI_DEBUG();

// Integrity check macros
if (!AUTHSYS_VERIFY_INTEGRITY()) {
    std::terminate();
}`} lang="cpp" title="obfuscation.cpp" />
              <Callout variant="info">
                Obfuscation is a deterrent, not a silver bullet. Combine it with HWID locking and server-side validation for robust protection.
              </Callout>
            </>
          ),
        },
        {
          title: 'Tamper Response Actions',
          content: (
            <>
              <p>When tampering is detected, you can configure the SDK to take one or more of the following actions:</p>
              <CodeBlock code={`// Configure tamper response
const client = new AuthSysClient({
  antiTamper: {
    onTamperDetected: {
      // Send alert to your webhook
      webhookUrl: 'https://myapp.com/api/security-alert',
      // Block execution after N detections
      blockAfter: 3,
      // Report to AuthSys threat feed
      reportToAuthSys: true,
    },
  },
});`} lang="typescript" title="tamper-response.ts" />
            </>
          ),
        },
        {
          title: 'Testing Anti-Tamper',
          content: (
            <>
              <p>AuthSys provides a test mode that simulates tamper events without actually modifying your binary:</p>
              <CodeBlock code={`// Enable test mode in development
const client = new AuthSysClient({
  environment: 'sandbox',
  antiTamper: {
    enabled: true,
    testMode: true,  // Simulates detections for testing
  },
});

// In test mode, you can trigger events
client.triggerTamperEvent('debugger_detected');
client.triggerTamperEvent('integrity_failure');`} lang="typescript" title="test-mode.ts" />
              <Callout variant="tip">
                Always test your anti-tamper configuration in the sandbox environment before deploying to production. Use the <code>testMode</code> flag to verify your response handlers work correctly.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
