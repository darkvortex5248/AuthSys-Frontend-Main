# AuthSys SDK Test Report

Generated: 2026-08-25T01:32:13

- Target API: `https://api.authsys.dpdns.org/api/v1`
- App secret: `rBXO5d1n8qaP`
- Test user: `test`

## Results

| SDK | Result | Run |
|-----|--------|-----|
| Python | ⚠️ PARTIAL | exit=0 |
| JavaScript | ⚠️ PARTIAL | exit=0 |
| TypeScript | ⚠️ PARTIAL | exit=0 |
| C# (.NET) | ⚠️ PARTIAL | exit=0 |

## Detailed Output

### Python

- ✅ `[PASS] init status=success`
- ✅ `[PASS] login user=test`
- ✅ `[PASS] verify user=test`
- ✅ `[PASS] license_check valid=False (expect False for fake key)`
- ✅ `[PASS] device_check msg=Device active`
- ❌ `[FAIL] device_register Operation failed`
- ℹ️ `[INFO] chat_send requires room_id: HWID mismatch for this session`

<details><summary>raw output</summary>

```
[PASS] init status=success
[PASS] login user=test
[PASS] verify user=test
[PASS] license_check valid=False (expect False for fake key)
[FAIL] device_register Operation failed
[PASS] device_check msg=Device active
[INFO] chat_send requires room_id: HWID mismatch for this session

```
</details>

### JavaScript

- ✅ `[PASS] init status=success`
- ✅ `[PASS] login user=test`
- ✅ `[PASS] verify user=test`
- ✅ `[PASS] license_check valid=false (expect False for fake key)`
- ✅ `[PASS] device_check msg=Device active`
- ❌ `[FAIL] device_register Operation failed`
- ℹ️ `[INFO] chat_send requires room_id: HWID mismatch for this session`

<details><summary>raw output</summary>

```
[PASS] init status=success
[PASS] login user=test
[PASS] verify user=test
[PASS] license_check valid=false (expect False for fake key)
[FAIL] device_register Operation failed
[PASS] device_check msg=Device active
[INFO] chat_send requires room_id: HWID mismatch for this session

```
</details>

### TypeScript

- ✅ `[PASS] init status=success`
- ✅ `[PASS] login user=test`
- ✅ `[PASS] verify user=test`
- ✅ `[PASS] license_check valid=false (expect False for fake key)`
- ✅ `[PASS] device_check msg=Device active`
- ❌ `[FAIL] device_register Operation failed`
- ℹ️ `[INFO] chat_send requires room_id: HWID mismatch for this session`

<details><summary>raw output</summary>

```
[PASS] init status=success
[PASS] login user=test
[PASS] verify user=test
[PASS] license_check valid=false (expect False for fake key)
[FAIL] device_register Operation failed
[PASS] device_check msg=Device active
[INFO] chat_send requires room_id: HWID mismatch for this session

```
</details>

### C# (.NET)

- ✅ `[PASS] init status=success`
- ✅ `[PASS] login user=test`
- ✅ `[PASS] verify user=test`
- ✅ `[PASS] license_check valid=False (expect False for fake key)`
- ✅ `[PASS] device_check msg=Device active`
- ❌ `[FAIL] device_register {"detail":"Operation failed","success":false,"error":{"code":500,"message":"Operation failed"}}`
- ℹ️ `[INFO] chat_send requires room_id: {"detail":"HWID mismatch for this session","success":false,"error":{"code":403,"message":"HWID mismatch for this session"}}`

<details><summary>raw output</summary>

```
D:\TESTING_ALL\AuthSys\sdk\AuthSys-CSHARP-Example\Console\src\AuthSys.cs(81,124): warning CS8625: Cannot convert null literal to non-nullable reference type. [D:\TESTING_ALL\AuthSys\Testing-All-SDK\tests\csharp\CSharpTest.csproj]
D:\TESTING_ALL\AuthSys\sdk\AuthSys-CSHARP-Example\Console\src\AuthSys.cs(81,167): warning CS8625: Cannot convert null literal to non-nullable reference type. [D:\TESTING_ALL\AuthSys\Testing-All-SDK\tests\csharp\CSharpTest.csproj]
D:\TESTING_ALL\AuthSys\sdk\AuthSys-CSHARP-Example\Console\src\AuthSys.cs(240,53): warning CS8625: Cannot convert null literal to non-nullable reference type. [D:\TESTING_ALL\AuthSys\Testing-All-SDK\tests\csharp\CSharpTest.csproj]
D:\TESTING_ALL\AuthSys\sdk\AuthSys-CSHARP-Example\Console\src\AuthSys.cs(254,53): warning CS8625: Cannot convert null literal to non-nullable reference type. [D:\TESTING_ALL\AuthSys\Testing-All-SDK\tests\csharp\CSharpTest.csproj]
D:\TESTING_ALL\AuthSys\sdk\AuthSys-CSHARP-Example\Console\src\AuthSys.cs(281,20): warning CS8603: Possible null reference return. [D:\TESTING_ALL\AuthSys\Testing-All-SDK\tests\csharp\CSharpTest.csproj]
[PASS] init status=success
[PASS] login user=test
[PASS] verify user=test
[PASS] license_check valid=False (expect False for fake key)
[FAIL] device_register {"detail":"Operation failed","success":false,"error":{"code":500,"message":"Operation failed"}}
[PASS] device_check msg=Device active
[INFO] chat_send requires room_id: {"detail":"HWID mismatch for this session","success":false,"error":{"code":403,"message":"HWID mismatch for this session"}}

```
</details>
