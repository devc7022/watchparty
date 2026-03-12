from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import uuid
import asyncio
from typing import Optional
from rooms import RoomManager

app = FastAPI(title="WatchParty API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

room_manager = RoomManager()


class CreateRoomRequest(BaseModel):
    username: str
    videoId: Optional[str] = "dQw4w9WgXcQ"


class JoinRoomRequest(BaseModel):
    username: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/rooms")
async def create_room(req: CreateRoomRequest):
    room_id = str(uuid.uuid4())[:8].upper()
    user_id = str(uuid.uuid4())
    room = room_manager.create_room(room_id, req.videoId or "dQw4w9WgXcQ")
    participant = room.add_participant(user_id, req.username, role="host")
    return {
        "roomId": room_id,
        "userId": user_id,
        "username": req.username,
        "role": "host",
        "videoId": room.video_id,
    }


@app.get("/api/rooms/{room_id}")
async def get_room(room_id: str):
    room = room_manager.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return {
        "roomId": room_id,
        "videoId": room.video_id,
        "participantCount": len(room.participants),
        "playState": room.play_state,
        "currentTime": room.current_time,
    }


@app.post("/api/rooms/{room_id}/join")
async def join_room(room_id: str, req: JoinRoomRequest):
    room = room_manager.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    user_id = str(uuid.uuid4())
    participant = room.add_participant(user_id, req.username, role="participant")
    return {
        "roomId": room_id,
        "userId": user_id,
        "username": req.username,
        "role": "participant",
        "videoId": room.video_id,
        "playState": room.play_state,
        "currentTime": room.current_time,
    }


@app.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str):
    room = room_manager.get_room(room_id)
    if not room:
        await websocket.close(code=4004)
        return

    participant = room.get_participant(user_id)
    if not participant:
        await websocket.close(code=4003)
        return

    await websocket.accept()
    participant.websocket = websocket

    # Notify others
    await room.broadcast(
        {
            "type": "user_joined",
            "userId": user_id,
            "username": participant.username,
            "role": participant.role,
            "participants": room.get_participants_list(),
        },
        exclude=user_id,
    )

    # Send current state to new joiner
    await websocket.send_json(
        {
            "type": "sync_state",
            "playState": room.play_state,
            "currentTime": room.current_time,
            "videoId": room.video_id,
            "participants": room.get_participants_list(),
        }
    )

    try:
        while True:
            data = await websocket.receive_json()
            await handle_event(room, participant, data)
    except WebSocketDisconnect:
        participant.websocket = None
        room.remove_participant(user_id)
        await room.broadcast(
            {
                "type": "user_left",
                "userId": user_id,
                "username": participant.username,
                "participants": room.get_participants_list(),
            }
        )
        if len(room.participants) == 0:
            room_manager.delete_room(room_id)


async def handle_event(room, participant, data: dict):
    event_type = data.get("type")
    user_id = participant.user_id
    role = participant.role

    can_control = role in ("host", "moderator")

    if event_type == "play":
        if not can_control:
            await participant.send({"type": "error", "message": "Permission denied"})
            return
        room.play_state = "playing"
        await room.broadcast({"type": "play", "userId": user_id, "currentTime": data.get("currentTime", room.current_time)})

    elif event_type == "pause":
        if not can_control:
            await participant.send({"type": "error", "message": "Permission denied"})
            return
        room.play_state = "paused"
        room.current_time = data.get("currentTime", room.current_time)
        await room.broadcast({"type": "pause", "userId": user_id, "currentTime": room.current_time})

    elif event_type == "seek":
        if not can_control:
            await participant.send({"type": "error", "message": "Permission denied"})
            return
        room.current_time = data.get("time", 0)
        await room.broadcast({"type": "seek", "userId": user_id, "time": room.current_time})

    elif event_type == "change_video":
        if not can_control:
            await participant.send({"type": "error", "message": "Permission denied"})
            return
        room.video_id = data.get("videoId", room.video_id)
        room.current_time = 0
        room.play_state = "paused"
        await room.broadcast({"type": "change_video", "videoId": room.video_id})

    elif event_type == "assign_role":
        if role != "host":
            await participant.send({"type": "error", "message": "Only host can assign roles"})
            return
        target_id = data.get("userId")
        new_role = data.get("role")
        if new_role not in ("participant", "moderator", "host"):
            return
        target = room.get_participant(target_id)
        if target:
            target.role = new_role
            await room.broadcast({
                "type": "role_assigned",
                "userId": target_id,
                "username": target.username,
                "role": new_role,
                "participants": room.get_participants_list(),
            })

    elif event_type == "remove_participant":
        if role != "host":
            await participant.send({"type": "error", "message": "Only host can remove participants"})
            return
        target_id = data.get("userId")
        target = room.get_participant(target_id)
        if target:
            await target.send({"type": "removed", "message": "You were removed by the host"})
            if target.websocket:
                await target.websocket.close()
            room.remove_participant(target_id)
            await room.broadcast({
                "type": "participant_removed",
                "userId": target_id,
                "participants": room.get_participants_list(),
            })

    elif event_type == "chat":
        msg = data.get("message", "").strip()
        if msg:
            await room.broadcast({
                "type": "chat",
                "userId": user_id,
                "username": participant.username,
                "message": msg,
            })

    elif event_type == "transfer_host":
        if role != "host":
            await participant.send({"type": "error", "message": "Only host can transfer host"})
            return
        target_id = data.get("userId")
        target = room.get_participant(target_id)
        if target:
            participant.role = "moderator"
            target.role = "host"
            await room.broadcast({
                "type": "role_assigned",
                "userId": target_id,
                "username": target.username,
                "role": "host",
                "participants": room.get_participants_list(),
            })
