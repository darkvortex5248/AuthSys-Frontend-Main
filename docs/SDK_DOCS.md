# AuthSys SDK Documentation

We provide official SDKs to easily integrate AuthSys into your software.

## 1. Python SDK

**Installation:**
```bash
pip install -e sdks/python
```

**Usage Example:**
```python
from rinoxauth import RinoxAuth, AuthException

auth = RinoxAuth(
    app_name="TestApp",
    app_secret="APP_SECRET_HERE",
    api_url="http://localhost:8000/api/v1"
)

try:
    auth.init("1.0")
    print("Init successful. Global Vars:", auth.get_variables())
    
    auth.login("testuser", "password123")
    print("Logged in!")
    
except AuthException as e:
    print(f"Error: {e}")
```

## 2. C# SDK (.NET)

**Usage Example:**
```csharp
using RinoxAuthSDK;
using System;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        var auth = new RinoxAuth("TestApp", "APP_SECRET_HERE", "http://localhost:8000/api/v1");
        try {
            await auth.Init("1.0");
            await auth.Login("testuser", "password123");
            Console.WriteLine("Login successful!");
        } catch(Exception e) {
            Console.WriteLine("Error: " + e.Message);
        }
    }
}
```

## 3. Node.js / Browser (JS)

**Usage Example:**
```javascript
const RinoxAuth = require('rinoxauth');

const auth = new RinoxAuth('TestApp', 'APP_SECRET', 'http://localhost:8000/api/v1');

auth.init('1.0').then(() => {
  return auth.login('testuser', 'password123');
}).then(res => {
  console.log("Logged in:", res);
}).catch(console.error);
```

## 4. C++ SDK (libcurl required)

Header-only `rinoxauth.hpp`. See file for method stubs.
