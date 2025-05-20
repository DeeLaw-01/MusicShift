import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# MongoDB connection URL (use environment variable or default to local MongoDB)
MONGODB_URL = os.getenv('MONGODB_URL', 'mongodb://localhost:27017')
DATABASE_NAME = 'genreshift'

# Create MongoDB client
client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]

# Collections
audio_files = db.audio_files
transformations = db.transformations

# Create indexes
audio_files.create_index('filename')
transformations.create_index('audio_file_id')
transformations.create_index('status')

class AudioFile:
    @staticmethod
    def create(filename, filepath, filesize, mimetype):
        return audio_files.insert_one({
            'filename': filename,
            'filepath': filepath,
            'filesize': filesize,
            'mimetype': mimetype,
            'created_at': datetime.utcnow()
        })

    @staticmethod
    def get_by_id(file_id):
        return audio_files.find_one({'_id': file_id})

    @staticmethod
    def get_all():
        return audio_files.find()

class Transformation:
    @staticmethod
    def create(audio_file_id, target_genre):
        return transformations.insert_one({
            'audio_file_id': audio_file_id,
            'target_genre': target_genre,
            'status': 'pending',
            'transformed_path': None,
            'created_at': datetime.utcnow()
        })

    @staticmethod
    def get_by_id(transform_id):
        return transformations.find_one({'_id': transform_id})

    @staticmethod
    def get_by_audio_file(audio_file_id):
        return transformations.find({'audio_file_id': audio_file_id})

    @staticmethod
    def update_status(transform_id, status, transformed_path=None):
        update_data = {'status': status}
        if transformed_path:
            update_data['transformed_path'] = transformed_path
        return transformations.update_one(
            {'_id': transform_id},
            {'$set': update_data}
        )

# Initialize database
def init_db():
    # Create indexes if they don't exist
    audio_files.create_index('filename')
    transformations.create_index('audio_file_id')
    transformations.create_index('status')