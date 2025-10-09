#!/usr/bin/env python3
"""Setup script to create Appwrite collections and attributes."""
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.exception import AppwriteException
from appwrite.permission import Permission
from appwrite.role import Role
import sys
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
APPWRITE_ENDPOINT = os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1")
APPWRITE_PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID")
APPWRITE_API_KEY = os.getenv("APPWRITE_API_KEY")
APPWRITE_DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID")

def init_client():
    """Initialize Appwrite client."""
    if not all([APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID]):
        print("❌ Error: Missing Appwrite configuration in .env file")
        print("Required: APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID")
        sys.exit(1)
    
    client = Client()
    client.set_endpoint(APPWRITE_ENDPOINT)
    client.set_project(APPWRITE_PROJECT_ID)
    client.set_key(APPWRITE_API_KEY)
    
    return Databases(client)

def create_collection(databases, collection_id, collection_name):
    """Create a collection if it doesn't exist."""
    try:
        # Try to get the collection
        databases.get_collection(
            database_id=APPWRITE_DATABASE_ID,
            collection_id=collection_id
        )
        print(f"✓ Collection '{collection_name}' already exists")
        return True
    except AppwriteException as e:
        if e.code == 404:
            # Collection doesn't exist, create it
            try:
                databases.create_collection(
                    database_id=APPWRITE_DATABASE_ID,
                    collection_id=collection_id,
                    name=collection_name,
                    permissions=[
                        Permission.read(Role.any()),
                        Permission.create(Role.any()),
                        Permission.update(Role.any()),
                        Permission.delete(Role.any()),
                    ],
                    document_security=False
                )
                print(f"✓ Created collection '{collection_name}'")
                return True
            except AppwriteException as ce:
                print(f"❌ Error creating collection '{collection_name}': {ce.message}")
                return False
        else:
            print(f"❌ Error checking collection '{collection_name}': {e.message}")
            return False

def create_attribute(databases, collection_id, attr_name, attr_type, required=False, default=None, size=None, array=False):
    """Create an attribute if it doesn't exist."""
    try:
        # Try to get the attribute
        databases.get_attribute(
            database_id=APPWRITE_DATABASE_ID,
            collection_id=collection_id,
            key=attr_name
        )
        print(f"  ✓ Attribute '{attr_name}' already exists")
        return True
    except AppwriteException as e:
        if e.code == 404:
            # Attribute doesn't exist, create it
            try:
                if attr_type == "string":
                    databases.create_string_attribute(
                        database_id=APPWRITE_DATABASE_ID,
                        collection_id=collection_id,
                        key=attr_name,
                        size=size or 255,
                        required=required,
                        default=default,
                        array=array
                    )
                elif attr_type == "boolean":
                    databases.create_boolean_attribute(
                        database_id=APPWRITE_DATABASE_ID,
                        collection_id=collection_id,
                        key=attr_name,
                        required=required,
                        default=default,
                        array=array
                    )
                elif attr_type == "datetime":
                    databases.create_datetime_attribute(
                        database_id=APPWRITE_DATABASE_ID,
                        collection_id=collection_id,
                        key=attr_name,
                        required=required,
                        default=default,
                        array=array
                    )
                
                print(f"  ✓ Created attribute '{attr_name}' ({attr_type})")
                return True
            except AppwriteException as ce:
                print(f"  ❌ Error creating attribute '{attr_name}': {ce.message}")
                return False
        else:
            print(f"  ❌ Error checking attribute '{attr_name}': {e.message}")
            return False

def setup_todos_collection(databases):
    """Setup the todos collection."""
    print("\n📋 Setting up 'todos' collection...")
    
    if not create_collection(databases, "todos", "Todos"):
        return False
    
    # Create attributes
    attributes = [
        ("title", "string", True, None, 500),
        ("description", "string", False, None, 2000),
        ("completed", "boolean", True, False, None),
        ("priority", "string", True, "medium", 20),
        ("due_date", "string", False, None, 50),
        ("created_at", "string", True, None, 50),
        ("updated_at", "string", True, None, 50),
    ]
    
    for attr_name, attr_type, required, default, size in attributes:
        create_attribute(databases, "todos", attr_name, attr_type, required, default, size)
    
    print("✓ Todos collection setup complete")
    return True

def setup_reminders_collection(databases):
    """Setup the reminders collection."""
    print("\n🔔 Setting up 'reminders' collection...")
    
    if not create_collection(databases, "reminders", "Reminders"):
        return False
    
    # Create attributes
    attributes = [
        ("reminder_text", "string", True, None, 1000),
        ("importance", "string", True, "medium", 20),
        ("reminder_date", "string", False, None, 50),
        ("created_at", "string", True, None, 50),
        ("updated_at", "string", True, None, 50),
    ]
    
    for attr_name, attr_type, required, default, size in attributes:
        create_attribute(databases, "reminders", attr_name, attr_type, required, default, size)
    
    print("✓ Reminders collection setup complete")
    return True

def main():
    """Main setup function."""
    print("🚀 Starting Appwrite setup...")
    print(f"   Endpoint: {APPWRITE_ENDPOINT}")
    print(f"   Project ID: {APPWRITE_PROJECT_ID}")
    print(f"   Database ID: {APPWRITE_DATABASE_ID}")
    
    databases = init_client()
    
    # Setup collections
    success = True
    success = setup_todos_collection(databases) and success
    success = setup_reminders_collection(databases) and success
    
    if success:
        print("\n✅ Appwrite setup completed successfully!")
        print("\n⏳ Note: It may take a few seconds for the attributes to become available.")
        print("   If you see errors, wait 10-20 seconds and try again.")
    else:
        print("\n⚠️  Setup completed with some errors. Please check the messages above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
