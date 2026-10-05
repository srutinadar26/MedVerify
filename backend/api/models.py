from django.db import models


class Claim(models.Model):
    claim_text = models.TextField()

    verdict = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    confidence = models.FloatField(
        blank=True,
        null=True
    )

    explanation = models.TextField(
        blank=True,
        null=True
    )

    source_url = models.URLField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.claim_text[:50]