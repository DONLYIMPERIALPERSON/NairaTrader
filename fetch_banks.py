#!/usr/bin/env python3
"""
Script to fetch the exact PalmPay bank list from their API and save to file for database seeding.
"""
import json
import sys
import os
import time
import secrets
import base64
import hashlib
from urllib.parse import unquote_plus
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

def _normalize_sign_value(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (dict, list)):
        return json.dumps(value, separators=(",", ":"), ensure_ascii=False)
    return str(value).strip()

def _build_sign_source(payload: dict[str, object]) -> str:
    pairs: list[tuple[str, str]] = []
    for key, value in payload.items():
        normalized = _normalize_sign_value(value)
        if normalized == "":
            continue
        pairs.append((key, normalized))
    pairs.sort(key=lambda x: x[0])
    return "&".join(f"{k}={v}" for k, v in pairs)

def _generate_signature(payload: dict[str, object]) -> str:
    private_key_b64 = os.getenv('PALMPAY_MERCHANT_PRIVATE_KEY', '').strip()
    if not private_key_b64:
        raise Exception("PALMPAY_MERCHANT_PRIVATE_KEY not found in environment")

    sign_source = _build_sign_source(payload)
    md5_upper = hashlib.md5(sign_source.encode("utf-8")).hexdigest().upper()

    key_der = base64.b64decode(private_key_b64)
    private_key = serialization.load_der_private_key(key_der, password=None)
    signature = private_key.sign(
        md5_upper.encode("utf-8"),
        padding.PKCS1v15(),
        hashes.SHA1(),
    )
    return base64.b64encode(signature).decode("utf-8")

def query_bank_list() -> list[dict[str, str | None]]:
    payload = {
        "requestTime": int(time.time() * 1000),
        "version": "V1.1",
        "nonceStr": secrets.token_urlsafe(24),
        "businessType": 0,
    }

    authorization_token = os.getenv('PALMPAY_APP_ID', '').strip()
    if not authorization_token:
        raise Exception("PALMPAY_APP_ID not found in environment")

    signature = _generate_signature(payload)

    base_url = os.getenv('PALMPAY_BASE_URL', 'https://open-gw-daily.palmpay-inc.com').strip()
    url = f"{base_url.rstrip('/')}/api/v2/general/merchant/queryBankList"

    req = Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Accept": "application/json",
            "CountryCode": os.getenv('PALMPAY_COUNTRY_CODE', 'NG'),
            "Signature": signature,
            "Authorization": f"Bearer {authorization_token}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urlopen(req, timeout=20) as response:
            raw = response.read().decode("utf-8")
    except HTTPError as exc:
        raise Exception(f"PalmPay HTTP error: {exc.code}") from exc
    except URLError as exc:
        raise Exception("PalmPay service unreachable") from exc

    try:
        body = json.loads(raw)
    except ValueError as exc:
        raise Exception("PalmPay returned invalid JSON") from exc

    resp_code = str(body.get("respCode") or "")
    if resp_code != "00000000":
        resp_msg = str(body.get("respMsg") or "PalmPay request failed")
        raise Exception(f"PalmPay API error: {resp_code} - {resp_msg}")

    data = body.get("data")
    if isinstance(data, dict):
        data_list = [data]
    elif isinstance(data, list):
        data_list = data
    else:
        raise Exception("PalmPay bank list response is invalid")

    normalized: list[dict[str, str | None]] = []
    for item in data_list:
        if not isinstance(item, dict):
            continue
        bank_code = str(item.get("bankCode") or "").strip()
        bank_name = str(item.get("bankName") or "").strip()
        if not bank_code or not bank_name:
            continue
        normalized.append(
            {
                "bank_code": bank_code,
                "bank_name": bank_name,
                "bank_url": str(item.get("bankUrl") or "").strip() or None,
                "bg_url": str(item.get("bgUrl") or "").strip() or None,
                "bg2_url": str(item.get("bg2Url") or "").strip() or None,
            }
        )

    if not normalized:
        raise Exception("PalmPay bank list returned empty data")

    return normalized

def main():
    try:
        print("Fetching exact PalmPay bank list from API...")
        banks = query_bank_list()
        print(f"Successfully fetched {len(banks)} banks from PalmPay")

        # Save to JSON file
        with open('banks_data.json', 'w', encoding='utf-8') as f:
            json.dump(banks, f, indent=2, ensure_ascii=False)

        print("Bank data saved to banks_data.json")

        # Generate SQL insert statements
        sql_statements = []
        sql_statements.append("-- Bank Directory Data")
        sql_statements.append("-- Generated from PalmPay API")
        sql_statements.append("")

        for bank in banks:
            bank_code = bank['bank_code'].replace("'", "''")
            bank_name = bank['bank_name'].replace("'", "''")
            bank_url = bank.get('bank_url') or 'NULL'
            bg_url = bank.get('bg_url') or 'NULL'

            if bank_url != 'NULL':
                bank_url = f"'{bank_url.replace(chr(39), chr(39)+chr(39))}'"
            if bg_url != 'NULL':
                bg_url = f"'{bg_url.replace(chr(39), chr(39)+chr(39))}'"

            sql = f"INSERT INTO bank_directory (bank_code, bank_name, bank_url, bg_url, is_active) VALUES ('{bank_code}', '{bank_name}', {bank_url}, {bg_url}, true) ON CONFLICT (bank_code) DO UPDATE SET bank_name = EXCLUDED.bank_name, bank_url = EXCLUDED.bank_url, bg_url = EXCLUDED.bg_url, is_active = true;"
            sql_statements.append(sql)

        # Save SQL to file
        with open('banks_insert.sql', 'w', encoding='utf-8') as f:
            f.write('\n'.join(sql_statements))

        print("SQL insert statements saved to banks_insert.sql")
        print("\nTo populate the database, run:")
        print("psql -d nairatrader -f banks_insert.sql")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
