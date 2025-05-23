from django.urls import path
from .views import TodoListView, TaskView

urlpatterns = [
    path('todo-lists', TodoListView.as_view()),
    path('tasks', TaskView.as_view()),
]
