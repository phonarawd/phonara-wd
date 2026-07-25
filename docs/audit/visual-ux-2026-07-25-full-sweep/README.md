# Visual UX Full Sweep — 2026-07-25

> Plan `완전무결_실증_마감_플랜_6d8c9e4b` · todo `operator-gate-full-capture-sweep`  
> **PNG 루트:** `/screenshots` (mobile · tablet · desktop · hover)  
> **매니페스트:** 이 폴더의 `capture-manifest.json` (역사 폴더 `visual-ux-2026-07-11/` 덮어쓰기 금지)

## 실행 (operator 「gate 실행」 / 본 플랜 마감 세션)

```powershell
bun run stack:ensure:full
bun run seed:local-trade
bun run seed:local-admin
$env:PHONARA_AUDIT_LOGIN='1'; $env:PHONARA_AUDIT_INTERACT='1'
bun run tsx scripts/visual-audit-capture-cdp.ts
bun run stack:stop
```

## 산출

| 파일                                                          | 역할                                                        |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| `capture-manifest.json`                                       | axe · bottomNav · console · interactions · hiQaInteractions |
| `../visual-ux-2026-07-25-phase6-closeout/SCREENSHOT_INDEX.md` | PNG 카운트 1:1 정합 (캡처 후 갱신)                          |

## RAM 노트 (8GB)

Admin Vite는 web/INTERACT 패스 **이후** lazy-spawn — Docker+web+Chrome 피크와 admin을 겹치지 않음.
