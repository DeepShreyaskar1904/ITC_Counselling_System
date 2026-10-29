import chromadb
import uuid

print("TEST STARTED", flush=True)

client = chromadb.PersistentClient(path="./chroma_db")
name = "test_python311_" + uuid.uuid4().hex[:8]

print("CLIENT CREATED", flush=True)

collection = client.create_collection(
    name=name,
    metadata={"hnsw:space": "cosine"}
)
print("COLLECTION CREATED", flush=True)

collection.add(
    ids=["test-1"],
    documents=["Python 311 ChromaDB test"],
    embeddings=[[0.1] * 768]
)
print("DOCUMENT SAVED", flush=True)
print("COUNT:", collection.count(), flush=True)

client.delete_collection(name)
print("TEST PASSED", flush=True)
