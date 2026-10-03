# Smart Screen AI — Technical Interview Preparation Guide

This guide provides clear, professional, and beginner-to-senior level interview answers covering the core machine learning, vector database, and RAG concepts implemented in **Smart Screen AI**.

---

## 1. What is RAG (Retrieval-Augmented Generation) and why did you use it?

**Answer:**
> "RAG combines information retrieval with language generation. Standard LLMs have a fixed knowledge cutoff and are prone to hallucinations when answering domain-specific or confidential questions.
>
> In Smart Screen AI, rather than fine-tuning a model or asking an LLM to guess candidate qualifications, we:
> 1. Split candidate resumes into semantic chunks and index them in a vector database (FAISS).
> 2. When a recruiter asks a question (e.g., *'Does this candidate have experience with Docker?'*), we search FAISS for the most relevant resume chunks.
> 3. We inject those exact chunks into the LLM prompt as ground truth context.
>
> This guarantees that the assistant's answers are 100% grounded in the candidate's actual resume, with zero hallucinations and full citation transparency."

---

## 2. What are Text Embeddings and what model did you choose?

**Answer:**
> "Text embeddings are dense mathematical vectors (numerical arrays) that capture the semantic meaning and context of a text snippet. Similar concepts are positioned close together in vector space, even if they use completely different vocabulary (e.g., *'Kubernetes orchestration'* and *'container deployment'*).
>
> In this project, we used `sentence-transformers/all-MiniLM-L6-v2`. It outputs 384-dimensional vectors. We selected it because:
> - It is lightweight (~80MB), fast, and can run on standard CPU instances with sub-15ms inference latency.
> - It delivers competitive semantic search benchmarks comparable to larger models while maintaining zero API costs.
> - All embeddings are L2-normalized so that inner product equals cosine similarity."

---

## 3. What is FAISS and why did you use it instead of Pinecone or ChromaDB?

**Answer:**
> "FAISS (Facebook AI Similarity Search) is an open-source, highly optimized C++/Python library specifically built for billion-scale similarity search and clustering of dense vectors.
>
> Why FAISS in this architecture:
> 1. **Ultra-fast CPU performance**: It uses SIMD vectorization and AVX2 instruction sets, providing microsecond search latency.
> 2. **Zero infrastructure cost**: Managed vector stores like Pinecone introduce ongoing subscription costs and external API network latency. FAISS runs locally inside our backend process.
> 3. **Offline privacy**: Candidate resumes contain sensitive Personally Identifiable Information (PII) such as phone numbers and addresses. Using a local FAISS index ensures resumes never leave the recruiter's secure environment.
> 4. **Persistence & Pruning**: We wrap `faiss.IndexFlatIP` with JSON metadata serialization, supporting candidate filtering and automatic index rebuilds on candidate deletion."

---

## 4. How does Cosine Similarity work and why use Inner Product?

**Answer:**
> "Cosine similarity measures the cosine of the angle between two multi-dimensional vectors in space:
>
> $$\text{Cosine Similarity}(\mathbf{A}, \mathbf{B}) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\|_2 \|\mathbf{B}\|_2}$$
>
> When vectors are L2-normalized (meaning their Euclidean length $\|\mathbf{A}\|_2 = 1$), the denominator simplifies to $1 \times 1 = 1$. Consequently, cosine similarity becomes identical to the simple inner product $\mathbf{A} \cdot \mathbf{B}$.
>
> This allows us to use `faiss.IndexFlatIP` (Inner Product index), which computes dot products using fast BLAS matrix multiplication without computing square roots during query time."

---

## 5. How did you prevent Hallucinations in the AI Assistant?

**Answer:**
> "Hallucination prevention in Smart Screen AI is enforced at three architectural layers:
> 1. **Prompt Engineering Guardrails**: The system prompt strictly constrains the assistant to answer *only* using facts present in the retrieved chunks. If the information is missing, it is required to state: *'Information not mentioned in the provided resume/job records.'*
> 2. **Negative Keyword Guardrails**: Queries asking for unstated personal traits (e.g., favorite movies, marital status, future salary demands) are intercepted and rejected.
> 3. **Source Citation Transparency**: Every response from the assistant includes exact chunk IDs, relevance similarity scores, and document excerpts, allowing recruiters to independently verify the claim."

---

## 6. Why did you use a 4-Factor Weighted Algorithm instead of pure Semantic Matching?

**Answer:**
> "Pure semantic similarity alone has known limitations in recruitment:
> - A candidate might write a well-formatted essay using eloquent technical terminology, achieving high semantic similarity, but lack the specific required tool (e.g., missing *Docker* or *AWS*).
> - Semantic similarity does not naturally enforce hard constraints like years of experience or degree requirements.
>
> To resolve this, our system uses a transparent 4-factor hybrid rubric:
> - **40% Semantic Similarity**: Captures domain alignment and contextual depth.
> - **35% Skill Match**: Verifies presence of required technical keywords and common synonyms (e.g., *Postgres* $\leftrightarrow$ *PostgreSQL*).
> - **15% Experience Match**: Evaluates candidate career tenure against job minimums.
> - **10% Education Match**: Matches degrees against academic tier requirements.
>
> This provides recruiters with an auditable, fair, and objective candidate ranking."

---

## 7. How would you scale this system to 1,000,000+ Resumes in Production?

**Answer:**
> "To scale from thousands to millions of resumes:
> 1. **Index Optimization**: Switch from `IndexFlatIP` (brute-force search) to `IndexIVFFlat` (Inverted File Index) or `IndexHNSW` (Hierarchical Navigable Small World graphs) with vector quantization (PQ) to achieve sub-linear $O(\log N)$ search complexity.
> 2. **Asynchronous Ingestion**: Offload document extraction and embedding generation to background task workers using Celery or RabbitMQ/Redis.
> 3. **Distributed Storage**: Store raw documents in Amazon S3 or MinIO object storage, metadata in MySQL or PostgreSQL read-replicas, and vector search on specialized vector nodes or a clustered vector service.
> 4. **GPU Acceleration**: Deploy FAISS on GPU instances (`faiss.GpuIndex`) for high-throughput batch vectorization."
