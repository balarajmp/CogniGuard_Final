import urllib.request
import json
import urllib.error

data = json.dumps({'username': 'test55@test.com', 'password': 'password', 'role': 'user'}).encode('utf-8')
req = urllib.request.Request('http://localhost:8000/api/auth/register', data=data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req) as f:
        with open('response.txt', 'w', encoding='utf-8') as out:
            out.write(f.read().decode('utf-8'))
            print("Success")
except urllib.error.HTTPError as e:
    with open('response.txt', 'w', encoding='utf-8') as out:
        out.write(str(e.code) + "\n")
        out.write(e.read().decode('utf-8'))
        print("HTTP Error")
except Exception as e:
    with open('response.txt', 'w', encoding='utf-8') as out:
        out.write(str(e))
        print("Other Error")
