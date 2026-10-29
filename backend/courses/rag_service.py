
import json
import os
import time
import uuid
from pathlib import Path

import chromadb
import requests

from django.conf import settings
from .models import Course


# ---------------- CONFIGURATION ----------------

OLLAMA_URL = "http://127.0.0.1:11434"
EMBEDDING_MODEL = "nomic-embed-text"

CHROMA_PATH = Path(settings.BASE_DIR) / "chroma_db"
ACTIVE_INDEX_FILE = CHROMA_PATH / "active_index.json"

EMBED_BATCH_SIZE = 4
CHROMA_BATCH_SIZE = 20
REQUEST_TIMEOUT = 180


# ---------------- CHROMA CLIENT ----------------

def get_chroma_client():
    CHROMA_PATH.mkdir(parents=True, exist_ok=True)

    return chromadb.PersistentClient(
        path=str(CHROMA_PATH)
    )


def get_chroma_collection():
    """
    Return the active collection.
    If no index has been activated yet, return the default collection.
    """
    client = get_chroma_client()

    if ACTIVE_INDEX_FILE.exists():
        with open(
            ACTIVE_INDEX_FILE,
            "r",
            encoding="utf-8",
        ) as file:
            active_data = json.load(file)

        return client.get_collection(
            name=active_data["collection_name"]
        )

    return client.get_or_create_collection(
        name="course_knowledge",
        metadata={"hnsw:space": "cosine"},
    )


# ---------------- EMBEDDINGS ----------------

def create_embeddings(texts):
    """Generate embeddings using the local Ollama server."""

    if not texts:
        return []

    print(
        f"[RAG] Requesting {len(texts)} embeddings...",
        flush=True,
    )

    response = requests.post(
        f"{OLLAMA_URL}/api/embed",
        json={
            "model": EMBEDDING_MODEL,
            "input": texts,
        },
        timeout=REQUEST_TIMEOUT,
    )

    response.raise_for_status()

    data = response.json()
    embeddings = data.get("embeddings")

    if not embeddings or len(embeddings) != len(texts):
        raise ValueError(
            "Ollama returned an unexpected embedding response."
        )

    print(
        f"[RAG] Received {len(embeddings)} embeddings. "
        f"Dimensions: {len(embeddings[0])}",
        flush=True,
    )

    return embeddings


# ---------------- DOCUMENT PREPARATION ----------------

def build_course_documents():
    """
    Create one searchable document per module.
    Courses without modules get one course-level document.
    """

    courses = list(
        Course.objects
        .prefetch_related("modules")
        .all()
        .order_by("id")
    )

    documents = []
    metadatas = []
    ids = []

    total_courses = len(courses)

    print(
        f"[RAG] Reading {total_courses} courses from MySQL...",
        flush=True,
    )

    for course_number, course in enumerate(courses, start=1):
        modules = list(course.modules.all())

        common_text = (
            f"Course: {course.name}\n"
            f"Category: {course.get_category_display()}\n"
            f"Duration: {course.duration}\n"
            f"Description: {course.description or 'Not provided'}\n"
            f"Eligibility: {course.eligibility or 'Not specified'}\n"
            f"Prerequisites: {course.prerequisites or []}\n"
            f"Skills: {course.skills or []}\n"
            f"Career paths: {course.career_paths or []}\n"
        )

        if modules:
            for module in modules:
                document = (
                    common_text
                    + f"\nModule: {module.title}\n"
                    + "Module description: "
                    + f"{module.description or 'Not provided'}"
                )

                documents.append(document)

                metadatas.append({
                    "course_id": int(course.pk),
                    "course_name": str(course.name),
                    "module_id": int(module.pk),
                    "document_type": "course_module",
                })

                ids.append(
                    f"course-{course.pk}-module-{module.pk}"
                )

        else:
            documents.append(common_text)

            metadatas.append({
                "course_id": int(course.pk),
                "course_name": str(course.name),
                "document_type": "course",
            })

            ids.append(f"course-{course.pk}")

        if course_number % 25 == 0:
            print(
                f"[RAG] Prepared courses: "
                f"{course_number}/{total_courses}",
                flush=True,
            )

    if len(ids) != len(set(ids)):
        raise ValueError(
            "Duplicate document IDs found. Indexing cancelled."
        )

    print(
        f"[RAG] Total documents prepared: {len(documents)}",
        flush=True,
    )

    return documents, metadatas, ids


# ---------------- BUILD INDEX ----------------

def rebuild_course_index():
    """
    Build a new collection without modifying the current active index.
    Activate the new collection only after successful verification.
    """

    client = get_chroma_client()

    documents, metadatas, ids = build_course_documents()

    if not documents:
        raise ValueError(
            "No course documents found in the database."
        )

    new_collection_name = (
        "course_knowledge_" + uuid.uuid4().hex[:12]
    )

    collection = None
    started_at = time.time()

    try:
        print(
            f"[RAG] Creating temporary collection: "
            f"{new_collection_name}",
            flush=True,
        )

        collection = client.create_collection(
            name=new_collection_name,
            metadata={"hnsw:space": "cosine"},
        )

        total = len(documents)

        for start in range(0, total, EMBED_BATCH_SIZE):
            end = min(start + EMBED_BATCH_SIZE, total)

            batch_number = (
                start // EMBED_BATCH_SIZE
            ) + 1

            print(
                f"[RAG] Batch {batch_number}: "
                f"documents {start + 1}-{end}/{total}",
                flush=True,
            )

            batch_embeddings = create_embeddings(
                documents[start:end]
            )

            # Insert this embedding batch in small Chroma batches.
            for offset in range(
                0,
                len(batch_embeddings),
                CHROMA_BATCH_SIZE,
            ):
                local_end = min(
                    offset + CHROMA_BATCH_SIZE,
                    len(batch_embeddings),
                )

                batch_start = start + offset
                batch_end = start + local_end

                print(
                    f"[RAG] Saving documents "
                    f"{batch_start + 1}-{batch_end}...",
                    flush=True,
                )

                collection.add(
                    ids=ids[batch_start:batch_end],
                    documents=documents[batch_start:batch_end],
                    metadatas=metadatas[batch_start:batch_end],
                    embeddings=batch_embeddings[offset:local_end],
                )

            print(
                f"[RAG] Completed {end}/{total} documents "
                f"({end * 100 // total}%).",
                flush=True,
            )

        # Verify the new collection.
        indexed_count = collection.count()

        if indexed_count != total:
            raise RuntimeError(
                f"Index verification failed: expected {total}, "
                f"found {indexed_count}."
            )

        print(
            f"[RAG] Verification passed: "
            f"{indexed_count} documents indexed.",
            flush=True,
        )

        # Prepare a pointer to the new active collection.
        CHROMA_PATH.mkdir(parents=True, exist_ok=True)

        temp_pointer = CHROMA_PATH / (
            f"active_index_{uuid.uuid4().hex[:8]}.tmp"
        )

        with open(
            temp_pointer,
            "w",
            encoding="utf-8",
        ) as file:
            json.dump(
                {"collection_name": new_collection_name},
                file,
            )

        # Replace the pointer only after the index is complete.
        os.replace(temp_pointer, ACTIVE_INDEX_FILE)

        elapsed = round(time.time() - started_at, 2)

        result = {
            "indexed_documents": indexed_count,
            "indexed_courses": len({
                item["course_id"] for item in metadatas
            }),
            "collection": new_collection_name,
            "elapsed_seconds": elapsed,
        }

        print(
            f"[RAG] Index activated successfully: {result}",
            flush=True,
        )

        return result

    except Exception as exc:
        print(
            f"[RAG] INDEXING FAILED: {type(exc).__name__}: {exc}",
            flush=True,
        )

        # Remove only the incomplete new collection.
        # Do not delete the currently active index.
        if collection is not None:
            try:
                client.delete_collection(
                    new_collection_name
                )
                print(
                    "[RAG] Incomplete collection removed.",
                    flush=True,
                )
            except Exception as cleanup_error:
                print(
                    f"[RAG] Cleanup warning: {cleanup_error}",
                    flush=True,
                )

        raise
