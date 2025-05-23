from django.db import models

# Create your models here.
class TodoList(models.Model):
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)


class Task(models.Model):
    todo_list_id = models.ForeignKey(TodoList, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    due_date = models.DateField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
