class AIService:
    """
    Thin abstraction over an AI provider. The rest of the app depends on
    this interface, not on any specific provider's SDK - so swapping
    Gemini for another provider later only means writing a new client,
    not touching views/serializers/tests.
    """

    def __init__(self, client):
        self.client = client

    def generate_response(self, prompt: str) -> str:
        return self.client.generate(prompt)