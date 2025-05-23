from rest_framework import serializers
from .models import TodoList, Task

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'completed', 'due_date', 'created_at']

class TodoListSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True, source='tasks.all')
    
    class Meta:
        model = TodoList
        fields = ['id', 'name', 'created_at', 'tasks'] 