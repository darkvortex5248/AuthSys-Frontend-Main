'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function CPPSDKPage() {
  return (
    <DocPageLayout
      title="C++ SDK"
      subtitle="The official AuthSys SDK for C++17 applications. Header-only with optional precompiled static/shared libraries. Supports Windows (MSVC), macOS (Clang), and Linux (GCC/Clang)."
      sections={[
        {
          title: 'Installation',
          content: (
            <>
              <p>Add the SDK via CMake FetchContent or install it system-wide:</p>
              <CodeBlock code={`# CMakeLists.txt — FetchContent
include(FetchContent)
FetchContent_Declare(
  authsys
  GIT_REPOSITORY https://github.com/authsys/authsys-cpp.git
  GIT_TAG v2.1.0
)
FetchContent_MakeAvailable(authsys)

target_link_libraries(myapp PRIVATE authsys::authsys)

# Or install system-wide:
# git clone https://github.com/authsys/authsys-cpp.git
# cd authsys-cpp && cmake -B build && cmake --build build && cmake --install build`} lang="cmake" title="CMakeLists.txt" />
            </>
          ),
        },
        {
          title: 'Initialization',
          content: (
            <>
              <CodeBlock code={`#include <authsys/client.hpp>
#include <iostream>
#include <string>

int main() {
    // Initialize the client
    authsys::ClientConfig config;
    config.api_key = std::getenv("AUTHSYS_API_KEY");
    config.environment = authsys::Environment::Sandbox;
    config.timeout = std::chrono::seconds(10);

    auto client = authsys::AuthSysClient::create(config);

    // Authenticate
    auto session = client->authenticate();
    std::cout << "Session: " << session.id() << std::endl;

    return 0;
}`} lang="cpp" title="main.cpp" />
            </>
          ),
        },
        {
          title: 'License Validation',
          content: (
            <>
              <CodeBlock code={`#include <authsys/client.hpp>
#include <iostream>

void validate_license(const std::string& key) {
    auto client = authsys::AuthSysClient::create({
        .api_key = std::getenv("AUTHSYS_API_KEY"),
        .environment = authsys::Environment::Production,
    });

    // Validate with HWID binding
    auto result = client->validate(key, {
        .bind_hwid = true,
        .metadata = {{"app_version", "1.0.0"}},
    });

    if (result.valid()) {
        std::cout << "License valid!" << std::endl;
        std::cout << "  Type: " << result.license().type() << std::endl;
        std::cout << "  Expires: " << result.license().expires_at() << std::endl;
        std::cout << "  Activations: " << result.license().activation_count() << std::endl;
    } else {
        std::cerr << "Validation failed: " << result.reason() << std::endl;

        if (result.reason() == "hwid_mismatch") {
            std::cerr << "License is bound to another machine." << std::endl;
        } else if (result.reason() == "expired") {
            std::cerr << "License has expired." << std::endl;
        }
    }
}`} lang="cpp" title="validation.cpp" />
              <Callout variant="warning">
                In C++ applications, always validate on the main thread during startup. Never cache validation results in memory where they can be patched — use the signed server response instead.
              </Callout>
            </>
          ),
        },
        {
          title: 'HWID Collection (C++ Specific)',
          content: (
            <>
              <p>The C++ SDK provides native HWID collection using platform-specific APIs:</p>
              <CodeBlock code={`#include <authsys/hwid.hpp>

// Collect hardware fingerprint
auto hwid = authsys::collect_hwid({
    .components = {
        authsys::HwidComponent::MotherboardSerial,
        authsys::HwidComponent::CpuId,
        authsys::HwidComponent::MacAddress,
        authsys::HwidComponent::DiskSerial,
    },
    .salt = "my-app-specific-salt",
});

std::cout << "HWID: " << hwid.value() << std::endl;
// Output: hwid_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

// Use custom HWID in validation
auto result = client->validate("LICENSE-KEY", {
    .hwid = hwid.value(),
    .bind_hwid = true,
});`} lang="cpp" title="hwid-collection.cpp" />
            </>
          ),
        },
        {
          title: 'Build Configuration',
          content: (
            <>
              <p>The SDK supports various build configurations:</p>
              <CodeBlock code={`# Optional CMake options
option(AUTHSYS_BUILD_SHARED "Build shared library" ON)
option(AUTHSYS_BUILD_STATIC "Build static library" OFF)
option(AUTHSYS_ENABLE_ANTI_TAMPER "Enable anti-tamper features" ON)
option(AUTHSYS_ENABLE_HWID "Enable HWID collection" ON)

# Minimum CMake version
cmake_minimum_required(VERSION 3.20)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)`} lang="cmake" title="CMake options" />
              <Callout variant="info">
                For game engines like Unreal Engine, use the static library build (<code>-DAUTHSYS_BUILD_STATIC=ON</code>) and link against your game module.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
