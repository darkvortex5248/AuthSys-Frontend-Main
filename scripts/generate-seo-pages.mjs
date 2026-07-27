import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const base = 'D:\\TESTING_ALL\\new_web\\RinoxAuth\\frontend\\src\\app'

const pages = {
  'authentication-api': { h1: 'Authentication API for Developers', intro: 'Simple, powerful REST API that handles authentication, license validation, and session management for your applications.', features: ['RESTful API design', 'JWT-based authentication', 'Session management', 'Rate limiting', 'Webhook integration'] },
  'developer-authentication': { h1: 'Developer Authentication Toolkit', intro: 'Everything developers need to implement secure authentication in their applications with minimal code.', features: ['SDKs for all major languages', 'Comprehensive documentation', 'Quick-start examples', 'API playground', 'Community support'] },
  'hwid-authentication': { h1: 'HWID Authentication System', intro: 'Bind licenses to specific hardware using unique device identifiers for maximum security against piracy.', features: ['Hardware fingerprinting', 'Multi-component HWID', 'HWID reset management', 'Device group management', 'Anti-spoofing protection'] },
  'hwid-lock': { h1: 'Hardware ID (HWID) Locking', intro: 'Bind your software licenses to specific hardware configurations to prevent unauthorized sharing and piracy.', features: ['Hardware-bound licensing', 'Tamper-resistant HWID', 'Controlled HWID resets', 'Device management dashboard', 'Cross-platform HWID'] },
  'software-protection': { h1: 'Software Protection & Anti-Piracy', intro: 'Multi-layered software protection to prevent cracking, reverse engineering, and unauthorized distribution.', features: ['Anti-debugging protection', 'Code integrity verification', 'Memory protection', 'Network-based validation', 'Automated ban system'] },
  'license-server': { h1: 'Cloud License Server', intro: 'Host your license management in the cloud with real-time validation and instant scalability.', features: ['Cloud-hosted infrastructure', 'Real-time license validation', 'Automatic scaling', '99.9% uptime SLA', 'Global CDN distribution'] },
  'authentication-sdk': { h1: 'Authentication SDK for Developers', intro: 'Ready-to-use SDKs that make implementing authentication in your application simple and fast.', features: ['Native C++ SDK', 'C# .NET SDK', 'Python SDK', 'JavaScript/TypeScript SDK', 'Java SDK', 'Rust SDK'] },
  'csharp-authentication': { h1: 'C# Authentication for .NET', intro: 'Integrate authentication into your C# applications with our native .NET SDK.', features: ['.NET Framework support', '.NET Core/5+ support', 'Unity integration', 'Async/await API', 'NuGet package'] },
  'cpp-authentication': { h1: 'C++ Authentication SDK', intro: 'Native C++ SDK for high-performance authentication in desktop applications.', features: ['Native performance', 'Header-only option', 'CMake integration', 'Cross-platform support', 'Minimal dependencies'] },
  'discord-authentication': { h1: 'Discord Authentication Integration', intro: 'Authenticate and verify users through Discord with OAuth integration and guild membership checks.', features: ['Discord OAuth login', 'Guild membership verification', 'Role-based access control', 'Discord bot integration', 'Webhook notifications'] },
  'telegram-authentication': { h1: 'Telegram Authentication Integration', intro: 'Authenticate users through Telegram with seamless bot integration and OAuth support.', features: ['Telegram OAuth login', 'Bot-based verification', 'Group membership checks', 'Push notifications', 'Auto-registration'] },
  'secure-login-system': { h1: 'Secure Login System', intro: 'Enterprise-grade login system with advanced security features to protect your users and applications.', features: ['Multi-factor authentication', 'Session management', 'Brute force protection', 'Geolocation tracking', 'Suspicious activity alerts'] },
  'game-authentication': { h1: 'Game Authentication Platform', intro: 'Protect your games from piracy with hardware-bound authentication and anti-tamper protection.', features: ['Unity SDK support', 'Unreal Engine support', 'HWID-based licensing', 'Anti-cheat integration', 'Auto-updater'] },
  'launcher-authentication': { h1: 'Launcher Authentication System', intro: 'Build and secure your game launcher with built-in authentication and automatic update capabilities.', features: ['Built-in auto-updater', 'License verification', 'Patch management', 'News system', 'User profiles'] },
  'api-security': { h1: 'API Security Platform', intro: 'Secure your REST and WebSocket APIs with enterprise-grade authentication and protection.', features: ['API key authentication', 'JWT token validation', 'Rate limiting', 'IP whitelisting', 'Request logging'] },
  'jwt-authentication': { h1: 'JWT Authentication Service', intro: 'Implement secure JWT-based authentication with automatic token refresh and session management.', features: ['JWT access and refresh tokens', 'Automatic token rotation', 'Custom claims support', 'RS256 and HS256', 'Token blacklisting'] },
  'rest-authentication': { h1: 'REST Authentication API', intro: 'Simple and secure REST API for authenticating users and managing sessions across all platforms.', features: ['RESTful endpoints', 'JSON request/response', 'Bearer token auth', 'Rate limiting', 'API versioning'] },
  'license-validation': { h1: 'License Validation API', intro: 'Validate software licenses in real-time with our fast and reliable license verification API.', features: ['Real-time validation', 'Offline validation', 'Hardware binding checks', 'Expiration verification', 'Usage tracking'] },
  'application-security': { h1: 'Application Security Platform', intro: 'Multi-layered security to protect your applications from piracy, tampering, and unauthorized access.', features: ['Code obfuscation', 'Anti-tamper protection', 'Integrity checking', 'Memory protection', 'Debugger detection'] },
  'cloud-authentication': { h1: 'Cloud Authentication Service', intro: 'Fully managed cloud authentication service that scales with your user base automatically.', features: ['Global CDN distribution', 'Automatic scaling', '99.9% uptime SLA', 'Multi-region deployment', 'DDoS protection'] },
}

for (const [path, p] of Object.entries(pages)) {
  const dir = join(base, path)
  mkdirSync(dir, { recursive: true })
  
  const content = `import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: '${p.h1} | RinoxAuth',
  description: '${p.intro}',
  alternates: { canonical: 'https://authsys.dpdns.org/${path}' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="${p.h1} | RinoxAuth"
      description="${p.intro}"
      h1="${p.h1}"
      intro="${p.intro}"
      features={[${p.features.map(f => `'${f}'`).join(', ')}]}
      breadcrumbs={[{ name: '${p.h1}', path: '/${path}' }]}
      faqItems={[
        { question: 'What is ${p.h1.toLowerCase()}?', answer: '${p.h1} is RinoxAuth\'s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with ${p.h1.toLowerCase()}?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for ${p.h1.toLowerCase()}?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
`
  writeFileSync(join(dir, 'page.tsx'), content, 'utf8')
  console.log(`Created ${path}`)
}
