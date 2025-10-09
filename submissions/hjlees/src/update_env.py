#!/usr/bin/env python3
"""Helper script to update Appwrite credentials in .env file."""
import sys

def update_env():
    """Update .env file with new Appwrite credentials."""
    print("🔧 Appwrite Configuration Update")
    print("=" * 50)
    print("\nPlease provide your Appwrite credentials:")
    print("(Press Ctrl+C to cancel)\n")
    
    project_id = input("Project ID: ").strip()
    api_key = input("API Key: ").strip()
    database_id = input("Database ID: ").strip()
    
    if not project_id or not api_key or not database_id:
        print("\n❌ Error: All fields are required!")
        sys.exit(1)
    
    # Read current .env file
    try:
        with open('.env', 'r') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print("❌ Error: .env file not found!")
        sys.exit(1)
    
    # Update lines
    updated_lines = []
    for line in lines:
        if line.startswith('APPWRITE_PROJECT_ID='):
            updated_lines.append(f'APPWRITE_PROJECT_ID={project_id}\n')
        elif line.startswith('APPWRITE_API_KEY='):
            updated_lines.append(f'APPWRITE_API_KEY={api_key}\n')
        elif line.startswith('APPWRITE_DATABASE_ID='):
            updated_lines.append(f'APPWRITE_DATABASE_ID="{database_id}"\n')
        else:
            updated_lines.append(line)
    
    # Write back
    with open('.env', 'w') as f:
        f.writelines(updated_lines)
    
    print("\n✅ .env file updated successfully!")
    print("\n📋 Updated values:")
    print(f"   Project ID: {project_id}")
    print(f"   Database ID: {database_id}")
    print(f"   API Key: {api_key[:20]}...{api_key[-10:]}")
    print("\n🚀 Next step: Run 'python setup_appwrite.py' to create collections")

if __name__ == "__main__":
    try:
        update_env()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
