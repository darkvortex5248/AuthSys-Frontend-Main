import time
import requests

url_init = "https://auth-sys-7xqx.vercel.app/api/v1/client/init"
url_login = "https://auth-sys-7xqx.vercel.app/api/v1/client/login"

payload_init = {
    "app_secret": "d439bc498e7e0e7d4b80746a05b0447a7bae41eac2ec32dc7dec329a30a87372",
    "version": "1.0.0",
    "app_name": "Rinox",
    "hwid": "test_hwid"
}

payload_login = {
    "app_secret": "d439bc498e7e0e7d4b80746a05b0447a7bae41eac2ec32dc7dec329a30a87372",
    "username": "Rinox", # Let's see if this username exists or what
    "password": "somepassword",
    "hwid": "test_hwid"
}

print("--- Request 1: /client/init ---")
t0 = time.time()
r = requests.post(url_init, json=payload_init)
t1 = time.time()
print(f"Time taken: {int((t1 - t0) * 1000)} ms")
print(f"Status: {r.status_code}, Response: {r.text}\n")

print("--- Request 2: /client/init (Warm) ---")
t0 = time.time()
r = requests.post(url_init, json=payload_init)
t1 = time.time()
print(f"Time taken: {int((t1 - t0) * 1000)} ms")
print(f"Status: {r.status_code}, Response: {r.text}\n")

print("--- Request 3: /client/login ---")
t0 = time.time()
r = requests.post(url_login, json=payload_login)
t1 = time.time()
print(f"Time taken: {int((t1 - t0) * 1000)} ms")
print(f"Status: {r.status_code}, Response: {r.text}\n")
