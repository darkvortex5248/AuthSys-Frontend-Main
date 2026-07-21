'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function DeviceActivationPage() {
  return (
    <DocPageLayout
      title="Device Activation (No-Login)"
      subtitle="Remote kill-switch for desktop EXEs without requiring user authentication. Just device_key + HWID."
      sections={[
        {
          title: 'How It Works',
          content: (
            <>
              <p>The Device Activation system lets you control which machines can run your application — without requiring a login screen. Perfect for closed-source EXEs where you want a silent kill-switch.</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Your EXE calls <code>deviceCheck()</code> on startup with <code>device_key</code> + <code>HWID</code></li>
                <li>The server auto-creates a device record if it doesn't exist (or returns existing status)</li>
                <li>If the device is <strong>active</strong> → your app runs normally</li>
                <li>If the device is <strong>disabled</strong> → your app should exit immediately</li>
              </ol>
              <p className="mt-4">Devices are managed from the <strong>Devices</strong> page in the developer dashboard. You can toggle activation or delete devices at any time.</p>
            </>
          ),
        },
        {
          title: 'API Endpoints',
          content: (
            <>
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold mb-2">POST /device/check</h4>
                  <CodeBlock code={`// Request
{
  "device_key": "your-app-secret",
  "hwid": "ABC123-DEF456"
}

// Response (active)
{ "active": true, "message": "Device active" }

// Response (disabled)
{ "active": false, "message": "Device deactivated by admin" }`} lang="json" title="check.json" />
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">Auto-registers the device if it doesn't exist yet.</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2">POST /device/register</h4>
                  <CodeBlock code={`// Request
{
  "device_key": "your-app-secret",
  "hwid": "ABC123-DEF456",
  "device_name": "PC-1"
}

// Response
{ "active": true, "device_id": 1 }`} lang="json" title="register.json" />
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">Explicitly registers a device. Enforces plan limits (Free=3, Developer=10, Seller=50, Enterprise=unlimited).</p>
                </div>
              </div>
            </>
          ),
        },
        {
          title: 'Plan Limits',
          content: (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-4 py-3 text-xs font-bold text-[var(--muted-foreground)] uppercase">Plan</th>
                      <th className="px-4 py-3 text-xs font-bold text-[var(--muted-foreground)] uppercase">Max Devices</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr><td className="px-4 py-3">Free</td><td className="px-4 py-3">3</td></tr>
                    <tr><td className="px-4 py-3">Developer</td><td className="px-4 py-3">10</td></tr>
                    <tr><td className="px-4 py-3">Seller</td><td className="px-4 py-3">50</td></tr>
                    <tr><td className="px-4 py-3">Enterprise</td><td className="px-4 py-3">Unlimited</td></tr>
                  </tbody>
                </table>
              </div>
              <Callout variant="warning">Device-only records are stored in the <code>end_users</code> table with <code>is_device_only=true</code>. No separate table, no duplicate data.</Callout>
            </>
          ),
        },
        {
          title: 'C++ Example',
          content: (
            <>
              <p>Header-only SDK — copy <code>AuthSys-Device.hpp</code> into your project:</p>
              <CodeBlock code={`#include "AuthSys-Device.hpp"

AuthSysDevice::Device device("YOUR_APP_SECRET");

if (!device.check()) {
    printf("Device blocked: %s\\n", device.getLastError().c_str());
    return 1; // Kill the process
}
// Device is active — run app logic`} lang="cpp" title="main.cpp" />
            </>
          ),
        },
        {
          title: 'C# Example',
          content: (
            <>
              <CodeBlock code={`using AuthSysDevice;

var device = new Device("YOUR_APP_SECRET");
if (!device.Check())
{
    Console.WriteLine("Device blocked: " + device.LastError);
    return;
}
// Device is active — run app logic`} lang="csharp" title="Program.cs" />
            </>
          ),
        },
        {
          title: 'Python Example',
          content: (
            <>
              <CodeBlock code={`from AuthSys_Device import Device

device = Device("YOUR_APP_SECRET")
if not device.check():
    print(f"Device blocked: {device.last_error}")
    exit(1)
# Device is active — run app logic`} lang="python" title="main.py" />
            </>
          ),
        },
        {
          title: 'JavaScript Example',
          content: (
            <>
              <CodeBlock code={`const { Device } = require("./AuthSys-Device");

const device = new Device("YOUR_APP_SECRET");
if (!(await device.check())) {
    console.log("Device blocked:", device.lastError);
    process.exit(1);
}
// Device is active — run app logic`} lang="javascript" title="main.js" />
            </>
          ),
        },
        {
          title: 'Source Code',
          content: (
            <>
              <p>All Device Activation SDK files are available in the <code>sdk/AuthSys-Device-Example/</code> directory:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-4 py-3 text-xs font-bold text-[var(--muted-foreground)] uppercase">Language</th>
                      <th className="px-4 py-3 text-xs font-bold text-[var(--muted-foreground)] uppercase">File</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr><td className="px-4 py-3">C++</td><td className="px-4 py-3 font-mono text-sm">cpp/AuthSys-Device.hpp</td></tr>
                    <tr><td className="px-4 py-3">C#</td><td className="px-4 py-3 font-mono text-sm">csharp/AuthSys-Device.cs</td></tr>
                    <tr><td className="px-4 py-3">Python</td><td className="px-4 py-3 font-mono text-sm">python/AuthSys-Device.py</td></tr>
                    <tr><td className="px-4 py-3">JavaScript</td><td className="px-4 py-3 font-mono text-sm">javascript/AuthSys-Device.js</td></tr>
                    <tr><td className="px-4 py-3">TypeScript</td><td className="px-4 py-3 font-mono text-sm">typescript/AuthSys-Device.ts</td></tr>
                    <tr><td className="px-4 py-3">React</td><td className="px-4 py-3 font-mono text-sm">react/AuthSys-Device.jsx</td></tr>
                    <tr><td className="px-4 py-3">Vue</td><td className="px-4 py-3 font-mono text-sm">vue/AuthSys-Device.js</td></tr>
                    <tr><td className="px-4 py-3">Go</td><td className="px-4 py-3 font-mono text-sm">go/AuthSys-Device.go</td></tr>
                    <tr><td className="px-4 py-3">Java</td><td className="px-4 py-3 font-mono text-sm">java/AuthSys-Device.java</td></tr>
                    <tr><td className="px-4 py-3">Ruby</td><td className="px-4 py-3 font-mono text-sm">ruby/AuthSys-Device.rb</td></tr>
                    <tr><td className="px-4 py-3">PHP</td><td className="px-4 py-3 font-mono text-sm">php/AuthSys-Device.php</td></tr>
                    <tr><td className="px-4 py-3">Rust</td><td className="px-4 py-3 font-mono text-sm">rust/AuthSys-Device.rs</td></tr>
                    <tr><td className="px-4 py-3">Perl</td><td className="px-4 py-3 font-mono text-sm">perl/AuthSys-Device.pl</td></tr>
                    <tr><td className="px-4 py-3">Lua</td><td className="px-4 py-3 font-mono text-sm">lua/AuthSys-Device.lua</td></tr>
                    <tr><td className="px-4 py-3">VB.NET</td><td className="px-4 py-3 font-mono text-sm">vb/AuthSys-Device.vb</td></tr>
                    <tr><td className="px-4 py-3">Unity (C#)</td><td className="px-4 py-3 font-mono text-sm">unity/AuthSys-Device.cs</td></tr>
                    <tr><td className="px-4 py-3">WPF (C#)</td><td className="px-4 py-3 font-mono text-sm">wpf/AuthSys-Device.cs</td></tr>
                  </tbody>
                </table>
              </div>
            </>
          ),
        },
      ]}
    />
  );
}
