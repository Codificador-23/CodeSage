import sys
import types

def _install_vertexai_stub():
    """Compatibility shim: langchain-community removed
    chat_models.vertexai during its sunset, but ragas 0.4.3
    still imports it unconditionally. This stub lets the
    import succeed; it's never touched unless you actually
    configure ChatVertexAI as your LLM."""
    full_name = "langchain_community.chat_models.vertexai"
    if full_name in sys.modules:
        return
    try:
        import langchain_community.chat_models as parent
    except ImportError:
        return

    stub = types.ModuleType(full_name)

    class ChatVertexAI:
        def __init__(self, *args, **kwargs):
            raise ImportError(
                "This is a compatibility stub for the removed "
                "langchain_community.chat_models.vertexai module. "
                "Install langchain-google-vertexai and use that "
                "integration if you actually need Vertex AI."
            )

    stub.ChatVertexAI = ChatVertexAI
    sys.modules[full_name] = stub
    setattr(parent, "vertexai", stub)

_install_vertexai_stub()
