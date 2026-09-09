import requests

try:
    response = requests.get('http://127.0.0.1:8000/api/admin/exams/?is_published=true', headers={'Accept': 'application/json'})
    print('Status Code:', response.status_code)
    data = response.json()
    
    if isinstance(data, list):
        print(f'Returned list with {len(data)} items')
    elif isinstance(data, dict):
        print(f'Returned dict with keys: {data.keys()}')
        if 'results' in data:
            results = data['results']
            print(f'Results count: {len(results)}')
            print(f'Total count: {data.get("count")}')
    else:
        print('Returned other type:', type(data))
except Exception as e:
    print('Error:', e)
