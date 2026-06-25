from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import json, os, uvicorn, time, threading, requests, base64, glob, re
from datetime import datetime

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DS_KEY = "sk-bc8397971f984727be004076d29a2327"
AI_NAME = "稳稳"
SUBS_FILE = "/opt/push_subs.json"
VAPID_PRIVATE = "/opt/vapid_private.pem"
BUCKETS_DIR = "/opt/ombre-brain/buckets"

def load_subs():
    if not os.path.exists(SUBS_FILE): return []
    with open(SUBS_FILE) as f: return json.load(f)

def save_subs(subs):
    with open(SUBS_FILE, "w") as f: json.dump(subs, f)

def send_push(title, body):
    from pywebpush import webpush
    subs = load_subs()
    for sub in subs:
        try:
            webpush(subscription_info=sub, data=json.dumps({"title": title, "body": body}),
                    vapid_private_key=VAPID_PRIVATE,
                    vapid_claims={"sub": "mailto:admin@zhongduan.app"})
        except Exception as e: print(f"Push error: {e}")

def ai_message(prompt):
    try:
        r = requests.post("https://api.deepseek.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {DS_KEY}"},
            json={"model": "deepseek-chat", "messages": [{"role": "user", "content": prompt}], "max_tokens": 80},
            timeout=15)
        return r.json()["choices"][0]["message"]["content"]
    except: return ""

def scheduled_jobs():
    while True:
        now = datetime.now()
        if now.hour == 8 and now.minute < 2:
            msg = ai_message(f"你叫{AI_NAME}，现在早上8点，给用户发温柔早安，40字以内。")
            if msg: send_push(f"早安 🌸 来自{AI_NAME}", msg)
        if now.hour == 21 and now.minute < 2:
            msg = ai_message(f"你叫{AI_NAME}，晚上9点，关心用户今天过得怎样，30字以内。")
            if msg: send_push(f"💌 {AI_NAME} 想你了", msg)
        time.sleep(60)

threading.Thread(target=scheduled_jobs, daemon=True).start()

@app.get("/vapid-key")
def vapid_key():
    from py_vapid import Vapid
    if not os.path.exists(VAPID_PRIVATE):
        v = Vapid(); v.generate_keys(); v.save_key(VAPID_PRIVATE)
    v = Vapid.from_file(VAPID_PRIVATE)
    pub = v.public_key.public_bytes(
        encoding=__import__("cryptography.hazmat.primitives.serialization", fromlist=["Encoding"]).Encoding.X962,
        format=__import__("cryptography.hazmat.primitives.serialization", fromlist=["PublicFormat"]).PublicFormat.UncompressedPoint
    )
    return {"publicKey": base64.urlsafe_b64encode(pub).rstrip(b"=").decode()}

@app.post("/subscribe")
async def subscribe(request: Request):
    body = await request.json()
    subs = load_subs()
    if body not in subs: subs.append(body); save_subs(subs)
    return {"ok": True}

@app.post("/send")
async def send(request: Request):
    body = await request.json()
    send_push(body.get("title", AI_NAME), body.get("body", ""))
    return {"ok": True}

@app.get("/search-memory")
async def search_memory(q: str = ""):
    results = []
    words = [w for w in q.lower().split() if len(w) > 1]
    for f in glob.glob(f"{BUCKETS_DIR}/**/*.md", recursive=True):
        try:
            content = open(f, encoding="utf-8", errors="ignore").read()
            if not words or any(w in content.lower() for w in words):
                body = re.sub(r'^---.*?---\s*', '', content, flags=re.DOTALL).strip()
                if body: results.append(body[:300])
            if len(results) >= 10: break
        except: pass
    return {"results": results}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
