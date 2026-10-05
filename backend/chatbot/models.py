from django.db import models
from django.contrib.auth.models import User


class ChatMessage(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    question = models.TextField()

    answer = models.TextField()

    language = models.CharField(
        max_length=50,
        default="English"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.language} - {self.question[:50]}"
class EvidenceSource(models.Model):
    title = models.CharField(max_length=500)

    source_name = models.CharField(max_length=200)

    url = models.URLField()

    evidence_text = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.source_name} - {self.title}"