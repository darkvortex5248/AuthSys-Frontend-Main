#pragma once
#include <windows.h>
#include <cstdint>
#include <vector>
#include <array>

// ── Mutation Engine: Code obfuscation and runtime polymorphism ──

namespace protection::mutation {

    // ── Generate a random 64-bit constant ──
    inline uint64_t Rand64() {
        uint64_t result;
        result  = static_cast<uint64_t>(rand()) << 0;
        result |= static_cast<uint64_t>(rand()) << 15;
        result |= static_cast<uint64_t>(rand()) << 30;
        result |= static_cast<uint64_t>(rand()) << 45;
        result ^= static_cast<uint64_t>(rand()) << 60;
        return result;
    }

    // ── Opaque predicate types ──
    enum class PredicateType : uint32_t {
        AlwaysTrue,
        AlwaysFalse,
        RandomBranch,
        Arithmetic
    };

    // ── Generate an opaque predicate ──
    // These are conditions that always evaluate to the same result
    // but look variable to an analyst
    inline bool GenerateOpaquePredicate(PredicateType type = PredicateType::Arithmetic) {
        switch (type) {
            case PredicateType::AlwaysTrue: {
                // (x * x) % 2 == 0 for any even x, but looks complex
                uint64_t x = Rand64() & ~1ULL; // force even
                return (x * x) % 2 == 0; // always true
            }
            case PredicateType::AlwaysFalse: {
                // (x * x + 1) % 2 == 1 is always true, negate for always false
                uint64_t x = Rand64() & ~1ULL;
                return !((x * x + 1) % 2 == 1); // always false
            }
            case PredicateType::Arithmetic: {
                // (x ^ x) == 0 is always true
                uint64_t x = Rand64();
                return (x ^ x) == 0; // always true
            }
            default:
                return true;
        }
    }

    // ── Junk code instruction patterns ──
    // These are x86-64 instructions that have no side effects
    // but confuse disassemblers and static analysis

    namespace junk {

        // Instruction bytes for common NOP-like operations
        static const uint8_t nop_2byte[]   = { 0x66, 0x90 };
        static const uint8_t nop_3byte[]   = { 0x0F, 0x1F, 0x00 };
        static const uint8_t nop_4byte[]   = { 0x0F, 0x1F, 0x40, 0x00 };
        static const uint8_t nop_5byte[]   = { 0x0F, 0x1F, 0x44, 0x00, 0x00 };
        static const uint8_t nop_6byte[]   = { 0x66, 0x0F, 0x1F, 0x44, 0x00, 0x00 };
        static const uint8_t nop_7byte[]   = { 0x0F, 0x1F, 0x80, 0x00, 0x00, 0x00, 0x00 };
        static const uint8_t nop_8byte[]   = { 0x0F, 0x1F, 0x84, 0x00, 0x00, 0x00, 0x00, 0x00 };
        static const uint8_t nop_9byte[]   = { 0x66, 0x0F, 0x1F, 0x84, 0x00, 0x00, 0x00, 0x00, 0x00 };

        // mov r64, r64 (no-op when src == dst)
        static const uint8_t mov_same[]    = { 0x48, 0x89, 0xC0 }; // mov rax, rax

        // lea r64, [r64 + 0] (no-op)
        static const uint8_t lea_noop[]    = { 0x48, 0x8D, 0x00 }; // lea rax, [rax]

        // xor r64, r64 (zeros but typically harmless)
        static const uint8_t xor_zero[]    = { 0x48, 0x31, 0xDB }; // xor rbx, rbx

        // push/pop pair (preserves stack)
        static const uint8_t push_pop[]    = { 0x50, 0x58 }; // push rax; pop rax
    }

    // ── Generate a random junk instruction sequence ──
    inline std::vector<uint8_t> GenerateJunk(size_t minBytes = 4, size_t maxBytes = 32) {
        std::vector<uint8_t> result;
        size_t target = minBytes + (rand() % (maxBytes - minBytes + 1));

        while (result.size() < target) {
            switch (rand() % 6) {
                case 0:
                    result.insert(result.end(), junk::nop_2byte, junk::nop_2byte + 2);
                    break;
                case 1:
                    result.insert(result.end(), junk::nop_3byte, junk::nop_3byte + 3);
                    break;
                case 2:
                    result.insert(result.end(), junk::nop_5byte, junk::nop_5byte + 5);
                    break;
                case 3:
                    result.insert(result.end(), junk::mov_same, junk::mov_same + 3);
                    break;
                case 4:
                    result.insert(result.end(), junk::push_pop, junk::push_pop + 2);
                    break;
                case 5:
                    result.insert(result.end(), junk::xor_zero, junk::xor_zero + 3);
                    break;
            }
        }

        result.resize(target);
        return result;
    }

    // ── Control flow flattening concept ──
    // In a real implementation, this would restructure the function
    // to use a state machine with a dispatcher, making the control flow
    // opaque to static analysis. Here we provide the state management.

    class StateDispatcher {
    public:
        StateDispatcher() : m_state(0) {}

        void SetState(uint32_t state) { m_state = state; }
        uint32_t GetState() const { return m_state; }

        // Dispatch to the next block based on current state
        template<typename Func>
        void Dispatch(uint32_t nextState, Func func) {
            func();
            m_state = nextState;
        }

    private:
        volatile uint32_t m_state;
    };

    // ── Constant unfolding ──
    // Represents a constant as a complex expression
    namespace constants {

        inline uint64_t Unfold32(uint32_t value) {
            // Express as (a + b - c) ^ d with random parts
            uint32_t a = rand() & 0xFFFF;
            uint32_t b = rand() & 0xFFFF;
            uint32_t c = (a + b - value) & 0xFFFFFFFF;
            uint32_t d = 0;
            return (static_cast<uint64_t>(a) + b - c) ^ d;
        }

        inline uint64_t Unfold64(uint64_t value) {
            // Split into two 32-bit parts
            uint32_t low = static_cast<uint32_t>(value & 0xFFFFFFFF);
            uint32_t high = static_cast<uint32_t>((value >> 32) & 0xFFFFFFFF);
            return (static_cast<uint64_t>(Unfold32(high)) << 32) | Unfold32(low);
        }

    } // namespace constants

    // ── String obfuscation at runtime ──
    // Store string as randomized chunks and reassemble
    class ObfuscatedString {
    public:
        ObfuscatedString(const char* str) {
            size_t len = strlen(str) + 1;
            m_chunks.resize(len);

            // Store each character XORed with a random key
            m_key = static_cast<char>(rand() & 0xFF);
            for (size_t i = 0; i < len; i++) {
                m_chunks[i] = str[i] ^ m_key;
            }
        }

        std::string Decrypt() const {
            std::string result;
            result.resize(m_chunks.size());
            for (size_t i = 0; i < m_chunks.size(); i++) {
                result[i] = static_cast<char>(m_chunks[i] ^ m_key);
            }
            // Remove null terminator
            if (!result.empty() && result.back() == '\0')
                result.pop_back();
            return result;
        }

    private:
        std::vector<char> m_chunks;
        char m_key;
    };

} // namespace protection::mutation
