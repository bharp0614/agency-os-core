# Vector — Repo Architecture Review

**Repo:** https://github.com/vectordotdev/vector  
**Date:** 2026-06-20

---

## Overview

Vector is a high-performance observability data pipeline written in **Rust**, maintained by Datadog's Community Open Source Engineering team. It collects, transforms, and routes logs, metrics, and traces in both agent (edge) and aggregator (centralized) deployment modes.

---

## Core Architectural Pattern: Source → Transform → Sink DAG

The fundamental abstraction is a **directed acyclic graph (DAG)** of three component types:

| Layer | Role | Trait |
|---|---|---|
| **Sources** | Ingest events from external systems | `SourceConfig` |
| **Transforms** | Process/filter/enrich events in-flight | `TransformConfig` |
| **Sinks** | Emit events to external destinations | `SinkConfig` |

Components are wired together via config, and the **topology** module constructs and manages the live DAG at runtime. This enables hot-reload without dropping events.

---

## Repo Structure

```
vector/
├── src/           # Core application (~63% Rust)
│   ├── app.rs     # Top-level application lifecycle
│   ├── topology/  # DAG construction & hot-reload logic
│   ├── sources/   # 50+ source implementations
│   ├── transforms/# Transform implementations incl. VRL remap
│   ├── sinks/     # 50+ sink implementations
│   ├── codecs/    # Encode/decode (JSON, Avro, Protobuf, etc.)
│   ├── config/    # Config loading, validation, schema
│   ├── api/       # GraphQL introspection API
│   └── kubernetes/# Custom k8s client machinery
├── lib/           # Internal shared crates (Rust workspace)
│   └── vector-lib/# Core traits: SourceConfig, SinkConfig, etc.
├── proto/         # Protobuf definitions (Vector protocol)
├── config/        # CUE-based config schema definitions (34%)
├── benches/       # Criterion benchmarks
└── distribution/  # Packaging (deb, rpm, Helm, Docker)
```

---

## Strengths

**1. Rust workspace monorepo**  
93+ crates in a single workspace. Internal crates (e.g., `vector-lib`, `vector-core`) enforce clean dependency boundaries and compile-time isolation.

**2. Feature-flag-gated components**  
Every source/transform/sink lives behind a Cargo feature flag. This enables minimal, custom binaries with zero dead code — critical for edge/agent deployments where memory footprint matters.

**3. VRL (Vector Remap Language)**  
The `Remap` transform embeds VRL, a purpose-built, safe, sandboxed scripting language for event mutation. Avoids Lua/JS FFI complexity and keeps transforms auditable and fast.

**4. Topology hot-reload**  
The topology engine can diff config changes and reload only affected subgraphs without pipeline downtime.

**5. Buffer abstraction**  
Vector abstracts delivery guarantees behind a buffer layer (in-memory, disk-backed, or channel). Decouples backpressure from sink implementations and enables at-least-once delivery.

**6. Internal telemetry**  
Vector emits internal metrics (`component_latency_seconds`, throughput, error rates) through the same pipeline — self-instrumenting with no external dependency.

---

## Concerns / Areas to Watch

**1. Crate proliferation**  
93+ crates increases incremental compile time and cognitive surface area. The boundary between `vector-core`, `vector-lib`, and `vector-common` may drift without strict ownership rules.

**2. CUE for config schema (34% of codebase)**  
CUE is powerful but niche. If config schema and Rust structs diverge, validation gaps silently emerge. Integration tests are the only safety net here.

**3. Custom Kubernetes API client**  
Rolling a custom k8s client (`src/kubernetes`) instead of using `kube-rs` introduces maintenance burden. Likely justified by specific watch-stream behavior requirements, but needs active ownership.

**4. Sink-level retry/buffer coupling**  
Individual sinks implement their own retry logic, leading to inconsistency — some have exponential backoff with jitter, others use simpler strategies. A centralized retry middleware would reduce variance.

**5. Integration test surface**  
Integration tests require Docker-containerized services (Kafka, Elasticsearch, Splunk, etc.). Adding a new sink means maintaining another docker-compose fixture — contributor friction worth tracking.

---

## Design Philosophy Assessment

Vector makes consistently good architectural bets: Rust for safety + throughput, DAG topology for flexibility, VRL for safe scripting, feature flags for footprint control. The main architectural debt is **consistency at the edges** — retry policies, error handling, and observability vary across 50+ sink implementations.

---

## Summary Scorecard

| Dimension | Rating | Notes |
|---|---|---|
| Core abstraction (DAG) | Excellent | Clean, well-bounded |
| Language/runtime choice | Excellent | Rust is the right tool |
| Modularity | Good | Feature flags are great; crate count needs auditing |
| Observability | Excellent | Self-instrumenting pipeline |
| Config system | Good | CUE drift is a risk |
| Sink consistency | Fair | Retry/buffer logic varies per sink |
| Testing strategy | Good | Multi-layer; heavy CI matrix |
| Contributor DX | Good | Complex setup, but well-documented |

---

## Sources

- [vectordotdev/vector on GitHub](https://github.com/vectordotdev/vector)
- [Vector DEVELOPING.md](https://github.com/vectordotdev/vector/blob/master/docs/DEVELOPING.md)
- [DeepWiki — vectordotdev/vector](https://deepwiki.com/vectordotdev/vector)
- [DeepWiki — Sink Architecture](https://deepwiki.com/vectordotdev/vector/6.1-sink-architecture)
- [DeepWiki — Sources](https://deepwiki.com/vectordotdev/vector/4-sources)
