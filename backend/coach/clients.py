from google import genai
from google.genai import types


class GeminiClient:
    """
    Thin wrapper around the real Gemini SDK. This is the ONLY place in the
    app that imports google.genai directly - everything else talks to
    AIService, which talks to this (or any future provider's equivalent).
    """

    MODEL = "gemini-3.5-flash-lite"

    def __init__(self, api_key: str):
        self._client = genai.Client(api_key=api_key)

    def generate(self, prompt: str) -> str:
        response = self._client.models.generate_content(
            model=self.MODEL,
            contents=prompt,
        )
        return response.text

    def generate_with_tools(self, prompt: str, tools: list[dict], execute_fn, max_rounds: int = 5) -> str:
        """
        Runs a manual function-calling loop: ask Gemini a question with a
        set of available tools, and if it requests one, execute it via
        execute_fn (which enforces the real allowlist - see
        coach/tool_calling.py) and feed the result back, repeating until
        Gemini gives a final text answer or max_rounds is hit.

        Automatic function calling is deliberately NOT used here - we want
        full control over dispatch so our own allowlist/ownership checks
        are always the ones deciding what actually runs, never the SDK.
        """
        tool_config = types.Tool(function_declarations=tools) if tools else None
        config = types.GenerateContentConfig(
            tools=[tool_config] if tool_config else None,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        )

        contents = [prompt]

        for _ in range(max_rounds):
            response = self._client.models.generate_content(
                model=self.MODEL,
                contents=contents,
                config=config,
            )

            if not response.function_calls:
                return response.text

            # Gemini requested one or more tool calls - execute each via
            # the caller-provided (allowlist-enforcing) executor, and feed
            # every result back as part of the conversation so far.
            contents.append(response.candidates[0].content)

            function_response_parts = []
            for call in response.function_calls:
                result = execute_fn(call.name, dict(call.args))
                function_response_parts.append(
                    types.Part.from_function_response(name=call.name, response={"result": result})
                )
            contents.append(types.Content(role="user", parts=function_response_parts))

        # Hit max_rounds without a final answer - return whatever text is available.
        return response.text if response.text else "I wasn't able to complete that request."