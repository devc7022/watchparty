import asyncio
from typing import Optional, Dict, List
from fastapi import WebSocket


class Participant:
    def __init__(self, user_id: str, username: str, role: str):
        self.user_id = user_id
        self.username = username
        self.role = role
        self.websocket: Optional[WebSocket] = None

    async def send(self, data: dict):
        if self.websocket:
            try:
                await self.websocket.send_json(data)
            except Exception:
                pass

    def to_dict(self):
        return {
            "userId": self.user_id,
            "username": self.username,
            "role": self.role,
        }


class Room:
    def __init__(self, room_id: str, video_id: str):
        self.room_id = room_id
        self.video_id = video_id
        self.play_state = "paused"
        self.current_time = 0.0
        self.participants: Dict[str, Participant] = {}

    def add_participant(self, user_id: str, username: str, role: str) -> Participant:
        p = Participant(user_id, username, role)
        self.participants[user_id] = p
        return p

    def get_participant(self, user_id: str) -> Optional[Participant]:
        return self.participants.get(user_id)

    def remove_participant(self, user_id: str):
        self.participants.pop(user_id, None)

    def get_participants_list(self) -> List[dict]:
        return [p.to_dict() for p in self.participants.values()]

    async def broadcast(self, data: dict, exclude: Optional[str] = None):
        tasks = []
        for uid, participant in list(self.participants.items()):
            if uid != exclude:
                tasks.append(participant.send(data))
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)


class RoomManager:
    def __init__(self):
        self._rooms: Dict[str, Room] = {}

    def create_room(self, room_id: str, video_id: str) -> Room:
        room = Room(room_id, video_id)
        self._rooms[room_id] = room
        return room

    def get_room(self, room_id: str) -> Optional[Room]:
        return self._rooms.get(room_id)

    def delete_room(self, room_id: str):
        self._rooms.pop(room_id, None)

    def list_rooms(self) -> List[str]:
        return list(self._rooms.keys())
