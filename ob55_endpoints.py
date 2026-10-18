# ob55_endpoints.py - Free Fire OB55 API Endpoints

# Garena Free Fire OB55 API Base URLs
GARENA_HOSTS = {
    "primary": "https://api.garena.com",
    "game": "https://ff.garena.com",
    "match": "https://match.garena.com",
    "shop": "https://shop.garena.com",
    "auth": "https://auth.garena.com"
}

# OB55 Specific Headers
OB55_HEADERS = {
    "User-Agent": "Garena/1.0 (Android; OB55)",
    "Accept": "application/json",
    "Accept-Encoding": "gzip, deflate",
    "X-Client-Version": "OB55",
    "X-Game-Version": "1.0.0",
    "X-Platform": "Android"
}

# OB55 Anti-Ban Headers (Spoofing)
OB55_SPOOF_HEADERS = {
    "X-Device-Model": "SM-G998B",
    "X-Device-Brand": "samsung",
    "X-Device-Android": "12",
    "X-Device-RAM": "8GB",
    "X-Device-Storage": "128GB",
    "X-Network-Type": "WiFi",
    "X-Carrier": "T-Mobile"
}