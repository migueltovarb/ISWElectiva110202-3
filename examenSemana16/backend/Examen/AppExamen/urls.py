from django.urls import path
from .views import TodoListView, TaskView

urlpatterns = [
    path('todo-lists/', TodoListView.as_view()),
    path('todo-lists/<int:pk>/', TodoListView.as_view()),
    path('todo-lists/<int:todo_list_id>/tasks/', TaskView.as_view()),
    path('todo-lists/<int:todo_list_id>/tasks/<int:task_id>/', TaskView.as_view()),
]
