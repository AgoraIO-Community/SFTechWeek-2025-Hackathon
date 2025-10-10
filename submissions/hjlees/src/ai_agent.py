"""AI Agent powered by Groq for todo management."""
from groq import Groq
from typing import List, Dict, Any, Optional
from datetime import datetime
import json

from config import Config
from database import db_client
from models import TodoPriority, ReminderImportance


class TodoAgent:
    """AI agent for managing todos and reminders using Groq."""
    
    def __init__(self):
        """Initialize the AI agent."""
        self.client = Groq(api_key=Config.GROQ_API_KEY)
        self.model = Config.GROQ_MODEL
        self.conversation_history: List[Dict[str, str]] = []
        
        self.system_prompt = """You are Luna, a friendly and efficient personal productivity assistant. 
You help users manage their todo lists and reminders through natural conversation.

Your capabilities include:
- Creating todos with title, description, priority (low/medium/high/urgent), and due dates
- Listing and searching todos
- Completing and updating todos
- Deleting todos
- Creating reminders with text, importance (low/medium/high/urgent), and dates
- Listing reminders
- Deleting reminders

When users ask you to create todos or reminders:
- Always ask for clarification if important details are missing
- Make reasonable assumptions for priority/importance if not specified (default to medium)
- For due dates, if not specified, default to today
- Be conversational and natural in your responses
- Keep responses brief since they will be read aloud

Guidelines:
- Shopping tasks: typically medium priority
- Work/urgent tasks: typically high priority
- Personal/hobby tasks: typically low priority
- If user says "today" or "now", use current date/time
- Always confirm actions after completing them

When listing todos or reminders, present them in a clear, easy-to-understand format."""

        self.available_functions = {
            "create_todo": self.create_todo,
            "get_todos": self.get_todos,
            "complete_todo": self.complete_todo,
            "update_todo": self.update_todo,
            "delete_todo": self.delete_todo,
            "create_reminder": self.create_reminder,
            "get_reminders": self.get_reminders,
            "delete_reminder": self.delete_reminder,
        }
        
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "create_todo",
                    "description": "Create a new todo item",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "type": "string",
                                "description": "The title of the todo"
                            },
                            "description": {
                                "type": "string",
                                "description": "Optional detailed description"
                            },
                            "priority": {
                                "type": "string",
                                "enum": ["low", "medium", "high", "urgent"],
                                "description": "Priority level"
                            },
                            "due_date": {
                                "type": "string",
                                "description": "Due date in ISO format (YYYY-MM-DD)"
                            }
                        },
                        "required": ["title"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_todos",
                    "description": "Get all todos, or filter by completion status. Omit 'completed' parameter to get all todos.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "completed": {
                                "type": "boolean",
                                "description": "Optional: true for completed todos only, false for active todos only. Do not include this parameter to get all todos."
                            }
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "complete_todo",
                    "description": "Mark a todo as completed. Can search by title if ID is not known.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "todo_id": {
                                "type": "string",
                                "description": "The ID of the todo to complete (optional if title is provided)"
                            },
                            "title": {
                                "type": "string",
                                "description": "Search for todo by title to complete it (optional if todo_id is provided)"
                            }
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_todo",
                    "description": "Update a todo item",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "todo_id": {
                                "type": "string",
                                "description": "The ID of the todo to update"
                            },
                            "title": {"type": "string"},
                            "description": {"type": "string"},
                            "priority": {
                                "type": "string",
                                "enum": ["low", "medium", "high", "urgent"]
                            },
                            "due_date": {"type": "string"}
                        },
                        "required": ["todo_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_todo",
                    "description": "Delete a todo item. Can search by title if ID is not known.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "todo_id": {
                                "type": "string",
                                "description": "The ID of the todo to delete (optional if title is provided)"
                            },
                            "title": {
                                "type": "string",
                                "description": "Search for todo by title to delete it (optional if todo_id is provided)"
                            }
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_reminder",
                    "description": "Create a new reminder",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "reminder_text": {
                                "type": "string",
                                "description": "The reminder text"
                            },
                            "importance": {
                                "type": "string",
                                "enum": ["low", "medium", "high", "urgent"],
                                "description": "Importance level"
                            },
                            "reminder_date": {
                                "type": "string",
                                "description": "Reminder date in ISO format"
                            }
                        },
                        "required": ["reminder_text"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_reminders",
                    "description": "Get all reminders",
                    "parameters": {"type": "object", "properties": {}}
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_reminder",
                    "description": "Delete a reminder. Can search by text if ID is not known.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "reminder_id": {
                                "type": "string",
                                "description": "The ID of the reminder to delete (optional if reminder_text is provided)"
                            },
                            "reminder_text": {
                                "type": "string",
                                "description": "Search for reminder by text to delete it (optional if reminder_id is provided)"
                            }
                        }
                    }
                }
            }
        ]
    
    def create_todo(
        self,
        title: str,
        description: Optional[str] = None,
        priority: str = "medium",
        due_date: Optional[str] = None
    ) -> str:
        """Create a new todo."""
        try:
            priority_enum = TodoPriority(priority.lower())
            due_date_obj = datetime.fromisoformat(due_date) if due_date else datetime.now()
            
            todo = db_client.create_todo(
                title=title,
                description=description,
                priority=priority_enum,
                due_date=due_date_obj
            )
            
            return f"Created todo: {todo.title} (Priority: {todo.priority.value})"
        except Exception as e:
            return f"Error creating todo: {str(e)}"
    
    def get_todos(self, completed: Optional[bool] = None) -> str:
        """Get todos."""
        try:
            todos = db_client.get_todos(completed=completed)
            
            if not todos:
                return "You have no todos."
            
            result = []
            for todo in todos:
                status = "✓" if todo.completed else "○"
                due = f" (Due: {todo.due_date.strftime('%Y-%m-%d')})" if todo.due_date else ""
                result.append(f"{status} {todo.title} - {todo.priority.value} priority{due}")
            
            return "\n".join(result)
        except Exception as e:
            return f"Error getting todos: {str(e)}"
    
    def complete_todo(self, todo_id: Optional[str] = None, title: Optional[str] = None) -> str:
        """Complete a todo by ID or by searching for a title."""
        try:
            # If no ID provided, try to find by title
            if not todo_id and title:
                todos = db_client.get_todos(completed=False)
                # Find todo by title (case-insensitive partial match)
                matching_todos = [t for t in todos if title.lower() in t.title.lower()]
                
                if not matching_todos:
                    return f"No active todo found matching '{title}'"
                elif len(matching_todos) > 1:
                    # Multiple matches - complete the first one
                    todo_id = matching_todos[0].id
                    return self.complete_todo(todo_id=todo_id)
                else:
                    todo_id = matching_todos[0].id
            
            if not todo_id:
                return "Please specify either a todo ID or title"
            
            todo = db_client.complete_todo(todo_id)
            if todo:
                return f"Completed todo: {todo.title}"
            return "Todo not found"
        except Exception as e:
            return f"Error completing todo: {str(e)}"
    
    def update_todo(
        self,
        todo_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        priority: Optional[str] = None,
        due_date: Optional[str] = None
    ) -> str:
        """Update a todo."""
        try:
            priority_enum = TodoPriority(priority.lower()) if priority else None
            due_date_obj = datetime.fromisoformat(due_date) if due_date else None
            
            todo = db_client.update_todo(
                todo_id=todo_id,
                title=title,
                description=description,
                priority=priority_enum,
                due_date=due_date_obj
            )
            
            if todo:
                return f"Updated todo: {todo.title}"
            return "Todo not found"
        except Exception as e:
            return f"Error updating todo: {str(e)}"
    
    def delete_todo(self, todo_id: Optional[str] = None, title: Optional[str] = None) -> str:
        """Delete a todo by ID or by searching for a title."""
        try:
            # If no ID provided, try to find by title
            if not todo_id and title:
                todos = db_client.get_todos()
                matching_todos = [t for t in todos if title.lower() in t.title.lower()]
                
                if not matching_todos:
                    return f"No todo found matching '{title}'"
                elif len(matching_todos) > 1:
                    # Multiple matches - delete the first one
                    todo_id = matching_todos[0].id
                else:
                    todo_id = matching_todos[0].id
            
            if not todo_id:
                return "Please specify either a todo ID or title"
            
            success = db_client.delete_todo(todo_id)
            if success:
                return "Todo deleted successfully"
            return "Todo not found"
        except Exception as e:
            return f"Error deleting todo: {str(e)}"
    
    def create_reminder(
        self,
        reminder_text: str,
        importance: str = "medium",
        reminder_date: Optional[str] = None
    ) -> str:
        """Create a new reminder."""
        try:
            importance_enum = ReminderImportance(importance.lower())
            reminder_date_obj = datetime.fromisoformat(reminder_date) if reminder_date else None
            
            reminder = db_client.create_reminder(
                reminder_text=reminder_text,
                importance=importance_enum,
                reminder_date=reminder_date_obj
            )
            
            return f"Created reminder: {reminder.reminder_text}"
        except Exception as e:
            return f"Error creating reminder: {str(e)}"
    
    def get_reminders(self) -> str:
        """Get all reminders."""
        try:
            reminders = db_client.get_reminders()
            
            if not reminders:
                return "You have no reminders."
            
            result = []
            for reminder in reminders:
                date_str = f" (Date: {reminder.reminder_date.strftime('%Y-%m-%d')})" if reminder.reminder_date else ""
                result.append(f"• {reminder.reminder_text} - {reminder.importance.value} importance{date_str}")
            
            return "\n".join(result)
        except Exception as e:
            return f"Error getting reminders: {str(e)}"
    
    def delete_reminder(self, reminder_id: Optional[str] = None, reminder_text: Optional[str] = None) -> str:
        """Delete a reminder by ID or by searching for text."""
        try:
            # If no ID provided, try to find by text
            if not reminder_id and reminder_text:
                reminders = db_client.get_reminders()
                matching_reminders = [r for r in reminders if reminder_text.lower() in r.reminder_text.lower()]
                
                if not matching_reminders:
                    return f"No reminder found matching '{reminder_text}'"
                elif len(matching_reminders) > 1:
                    # Multiple matches - delete the first one
                    reminder_id = matching_reminders[0].id
                else:
                    reminder_id = matching_reminders[0].id
            
            if not reminder_id:
                return "Please specify either a reminder ID or reminder text"
            
            success = db_client.delete_reminder(reminder_id)
            if success:
                return "Reminder deleted successfully"
            return "Reminder not found"
        except Exception as e:
            return f"Error deleting reminder: {str(e)}"
    
    def process_message(self, user_message: str) -> str:
        """Process a user message and return a response."""
        # Add user message to history
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })
        
        # Create messages for API call
        messages = [
            {"role": "system", "content": self.system_prompt},
            *self.conversation_history
        ]
        
        # Get response from Groq
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=self.tools,
            tool_choice="auto",
            max_tokens=1000,
            temperature=0.7
        )
        
        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls
        
        # Process tool calls if any
        if tool_calls:
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                
                # Execute function
                if function_name in self.available_functions:
                    function_response = self.available_functions[function_name](**function_args)
                    
                    # Add function response to history
                    self.conversation_history.append({
                        "role": "assistant",
                        "content": None,
                        "tool_calls": [tool_call.model_dump()]
                    })
                    
                    self.conversation_history.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": function_name,
                        "content": function_response
                    })
            
            # Get final response after tool execution
            messages = [
                {"role": "system", "content": self.system_prompt},
                *self.conversation_history
            ]
            
            final_response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )
            
            assistant_message = final_response.choices[0].message.content
        else:
            assistant_message = response_message.content
        
        # Add assistant response to history
        self.conversation_history.append({
            "role": "assistant",
            "content": assistant_message
        })
        
        return assistant_message
    
    def reset_conversation(self):
        """Reset the conversation history."""
        self.conversation_history = []


# Global agent instance
agent = TodoAgent()

