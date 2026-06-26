#pragma once
#include <cstdint>
#include <cstring>
#include <array>
#include <random>
#include <type_traits>

// ── Compile-time string encryption (XOR + randomized keys) ──

namespace protection {

    // Compile-time random seed generator
    template<size_t N>
    struct RandomSeed {
        uint64_t value = 0;
        constexpr RandomSeed() {
            for (size_t i = 0; i < N; i++)
                value = (value * 0x5851F42D4C957F2Dull) + 0x9E3779B97F4A7C15ull;
        }
    };

    // Encrypted string storage
    template<size_t N>
    struct EncryptedString {
        uint8_t data[N]{};
        uint8_t key[N]{};
        size_t length = N;

        constexpr EncryptedString(const char(&input)[N]) {
            uint64_t seed = 0x2B7E151628AED2A6ull;
            for (size_t i = 0; i < N; i++) {
                seed = (seed * 0x5851F42D4C957F2Dull) + 0x9E3779B9ull;
                key[i] = static_cast<uint8_t>(seed >> (i % 8) * 8);
                data[i] = static_cast<uint8_t>(input[i] ^ key[i]);
            }
        }

        const char* Decrypt() const {
            static thread_local char buffer[N];
            for (size_t i = 0; i < N; i++)
                buffer[i] = static_cast<char>(data[i] ^ key[i]);
            return buffer;
        }
    };

// ── Encryption key generators ──

    namespace detail {
        template<typename T, T Key>
        constexpr T EncryptKey(T val) {
            return val ^ Key;
        }

        // Compile-time string hashing for API names
        constexpr uint64_t HashString(const char* str, size_t len = 0) {
            uint64_t hash = 0xCBF29CE484222325ull;
            if (len == 0) {
                while (*str)
                    hash = (hash ^ *str++) * 0x100000001B3ull;
            } else {
                for (size_t i = 0; i < len; i++)
                    hash = (hash ^ str[i]) * 0x100000001B3ull;
            }
            return hash;
        }

        // Runtime string decryption (stack-based, auto-wipe)
        class StackString {
        public:
            StackString(const uint8_t* data, const uint8_t* key, size_t len) {
                for (size_t i = 0; i < len && i < maxLen - 1; i++)
                    buffer[i] = static_cast<char>(data[i] ^ key[i]);
                buffer[len] = 0;
            }

            ~StackString() {
                volatile char* p = buffer;
                for (size_t i = 0; i < maxLen; i++)
                    *p++ = 0;
            }

            const char* Get() const { return buffer; }

        private:
            static constexpr size_t maxLen = 512;
            char buffer[maxLen]{};
        };
    }

} // namespace protection

// ── Macro: Obfuscated string literal ──
#define OBFUSCATE(str) []() { \
    constexpr protection::EncryptedString<sizeof(str)> enc(str); \
    return enc.Decrypt(); \
}()

// ── Macro: Hashed API call ──
#define HASH_API(module, api) protection::detail::HashString(#api)

// ── Anti-static-analysis: opaque predicates ──
namespace protection {
    namespace obfuscation {
        // Always-true predicate that looks complex
        __forceinline bool TruePredicate() {
            volatile uint64_t a = 0x2B7E151628AED2A6ull;
            volatile uint64_t b = 0x9E3779B97F4A7C15ull;
            return ((a * b) ^ (a + b)) != 0;
        }

        // Always-false predicate
        __forceinline bool FalsePredicate() {
            volatile uint64_t a = 0;
            volatile uint64_t b = 0xFFFFFFFFFFFFFFFFull;
            return (a & b) != a;
        }

        // Junk code filler (compiler will optimize some, not all)
        __forceinline void JunkCode() {
            volatile uint64_t junk[8];
            for (int i = 0; i < 8; i++)
                junk[i] = __rdtsc() ^ (uint64_t)(uintptr_t)junk;
        }
    }
}
