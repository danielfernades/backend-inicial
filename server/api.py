from fastapi import FastAPI, WebSocket, BackgroundTasks
from pydantic import BaseModel
import asyncio
import uuid
# from processor import VideoProcessor, SmoothnessConfig

app = FastAPI()

class JobRequest(BaseModel):
    video_url: str
    config: dict = {}

# Simulação de Redis Pub/Sub
active_jobs = {}

@app.post("/jobs")
async def create_job(req: JobRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    active_jobs[job_id] = 0.0
    
    # Dispara task no Celery (simulado aqui com background_tasks)
    # celery_app.send_task("process_video", args=[job_id, req.video_url])
    
    return {"job_id": job_id, "status": "queued"}

@app.websocket("/jobs/{job_id}/progress")
async def job_progress(websocket: WebSocket, job_id: str):
    await websocket.accept()
    try:
        # Em produção, isso assinaria um canal Redis: pubsub.subscribe(f"job_{job_id}")
        while True:
            progress = active_jobs.get(job_id, 0.0)
            await websocket.send_json({"progress": progress, "stage": "exporting"})
            if progress >= 1.0:
                break
            await asyncio.sleep(1)
    except Exception as e:
        print(f"WS Error: {e}")
    finally:
        await websocket.close()
