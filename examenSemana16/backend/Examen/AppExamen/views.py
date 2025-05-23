from django.shortcuts import render, get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import TodoList, Task
from .serializers import TodoListSerializer, TaskSerializer

# TodoList API
class TodoListView(APIView):
    def get(self, request):
        todo_lists = TodoList.objects.all()
        serializer = TodoListSerializer(todo_lists, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        # Si viene con tasks, las procesamos
        tasks_data = request.data.pop('tasks', [])
        
        # Creamos la TodoList
        serializer = TodoListSerializer(data=request.data)
        if serializer.is_valid():
            todo_list = serializer.save()
            
            # Creamos las tareas asociadas
            for task_data in tasks_data:
                task_data['todo_list'] = todo_list.id
                task_serializer = TaskSerializer(data=task_data)
                if task_serializer.is_valid():
                    task_serializer.save()
            
            # Retornamos la TodoList con sus tareas
            return Response(TodoListSerializer(todo_list).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        todo_list = get_object_or_404(TodoList, id=pk)
        serializer = TodoListSerializer(todo_list, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        todo_list = get_object_or_404(TodoList, id=pk)
        todo_list.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class TaskView(APIView):
    def get(self, request, todo_list_id, task_id=None):
        if task_id:
            # Obtener una tarea específica
            task = get_object_or_404(Task, id=task_id, todo_list_id=todo_list_id)
            serializer = TaskSerializer(task)
        else:
            # Obtener todas las tareas de una lista
            tasks = Task.objects.filter(todo_list_id=todo_list_id)
            serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)
    
    def post(self, request, todo_list_id):
        todo_list = get_object_or_404(TodoList, id=todo_list_id)
        request.data['todo_list'] = todo_list.id
        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, todo_list_id, task_id):
        task = get_object_or_404(Task, id=task_id, todo_list_id=todo_list_id)
        serializer = TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, todo_list_id, task_id):
        task = get_object_or_404(Task, id=task_id, todo_list_id=todo_list_id)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    
    