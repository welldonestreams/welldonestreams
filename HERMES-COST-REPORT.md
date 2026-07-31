---
title: Hermes Cost & Optimization Report
date: 2026-07-31
tags: [cost, tokens, routing, reference]
status: final
---

# Hermes Cost & Optimization Report

Reference material for the DeepSeek-primary + ChatGPT-frontier cost model.

## DeepSeek pricing (Flash $0.14/$0.28 per MTok in/out)
Peak hours are **2× price**:
| UTC | PDT | Effect |
|---|---|---|
| 01:00–04:00 | 18:00–21:00 | 2x |
| 06:00–10:00 | 23:00–03:00 | 2x |
| All other | All other | normal |

Schedule heavy cron outside peaks (Dreaming cron runs 11:00 UTC / 4 AM PDT — in the valley).

## Cache economics (why per-turn cost is a fraction of a cent)
- Typical turn: ~281K input tokens, **96–100% cache hit** (verified in gateway logs: `cache=280064/281293 (100%)`).
- Cached input bills at ~1/10 the input rate. Only the newest message is uncached.
- The ~281K stable prefix = system prompt + tool schemas + memory + conversation history. It's nearly free while caching holds; if a future provider stops caching well, the 36 MCP tool schemas are the largest trimmable mass (agent rarely needs all 36 per task class — not worth trimming now).

## Routing cost model
| Tier | Model | Route | Cost |
|---|---|---|---|
| Primary | deepseek-v4-flash | API key | near-free (cached) |
| Auto fallback | deepseek-v4-pro | API key | cheap |
| Auto fallback | gpt-5.4-nano | openai API key | trivially cheap |
| Frontier (manual) | gpt-5.6-sol | openai-codex OAuth | **flat-rate** (ChatGPT subscription) |
| Aux tasks | deepseek-v4-flash | API key | cheap |
| Vision | gpt-5.4-nano | openai API key | cheap |

Key property: **no autonomous loop can burn subscription capacity or API dollars on the frontier tier** — `/model cloud` is a deliberate manual switch.

## Why not local-first
- NAS Ollama (port 30068) runs but has **no vision models**; N100 also lacks RAM headroom.
- PC Ollama (100.127.203.86:11434, gpt-oss-hermes etc.) is offline whenever the PC is off, and the PC is frequently off.
- Local inference is a fallback, not the primary path. If the PC were always-on, `hermes` alias `local` is configured and works.

## Why not fine-tune
The baseline conversation's conclusion (from all three model rundowns): retrieval (KB + memory) beats fine-tuning for facts that change (IPs, ports, versions). Fine-tuning only makes sense for stable behavior (when to ask approval, how to format reports) — and not before an evaluation set exists.

## Token levers (all already engaged)
1. Prompt caching — working (96-100%).
2. Compression — ON (0.5/0.2, protect last 20).
3. Aux routing on cheap path — configured.
4. Tool output caps — in place.
5. Single config file — no duplicate configs paying double system-prompt cost.

## Related
- [[HERMES-CONFIG-DECISIONS]] · [[HOMELAB-KB]]
