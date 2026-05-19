# `/platform/INTERFACES.md`

This file documents the **public API surface** of the platform region — the functions, types, and conventions that code in `/website/` and `/product/` is allowed to call.

> 📦 **Placeholder — filled in during Tranche 11b-2.**
>
> Tranche 11b-1 creates this region's skeleton. The actual interface inventory
> (auth helpers, billing predicates, the email sender, journey queries, etc.)
> gets documented here once existing code moves into `/platform/` in 11b-2.

If you're working in `/product/` or `/website/` today, the source of truth is still the current code under `/lib/`. After 11b-2, this file becomes the contract — anything not listed here is internal to the platform and shouldn't be imported directly.
