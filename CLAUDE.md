# LHS Rapid Development Harness

고객 데모용 풀스택 웹앱을 1~2일 내 구축하는 3-Agent 시스템 (Planner → Generator → Evaluator).
GAN에서 영감받은 구조: Generator가 만들고, Evaluator가 적대적으로 평가하여 품질을 수렴시킨다.

## 워크플로우

Opus 4.6의 자동 컨텍스트 compaction에 의존하여, 불필요한 세션 분리를 하지 않는다.
Planner만 사용자 승인이 필요하므로 별도 세션이고, 이후 Generator→Evaluator→Fix 루프는 **한 세션**에서 실행한다.

```bash
# Phase 1: Planner (별도 세션 — 사용자 승인 필요)
claude "prompts/planner.md를 읽고, projects/{name}/requirements.md를 분석하여 스펙과 계획을 생성해줘"
# → 사용자가 spec.md, implementation-plan.md 검토 후 승인

# Phase 2+3: Generator → Evaluator (한 세션에서 연속 실행)
claude "prompts/generator.md를 읽고 projects/{name}의 구현 계획을 실행한 뒤, prompts/evaluator.md를 읽고 앱을 검증해줘. FAIL 시 수정 후 재검증 (최대 3회)."
```

**컨텍스트 소진 시 안전망**: 세션이 너무 길어져 compaction 한계에 도달하면, `claude-progress.txt`를 읽고 새 세션에서 이어갈 수 있다. 이는 기본 동작이 아닌 **폴백**이다.

## 핵심 규칙

- 새 세션이나 컨텍스트 재개 시 `projects/{name}/claude-progress.txt`를 먼저 읽어 현재 상태를 파악한다
- Generator의 서브에이전트는 `model: "sonnet"`으로 디스패치한다
- 모든 의미 있는 코드 변경은 Git 커밋한다
- 데모 범위를 벗어나는 기능은 **절대 구현하지 않는다** (YAGNI)
- Evaluator 실패 시 수정 지시를 claude-progress.txt에 기록 후 같은 세션에서 수정→재검증 (세션 분리는 폴백)

## 품질 기준

- 채점 기준: `templates/evaluation-criteria.md` 참조
- 합격선: 100점 만점 중 **80점 이상**
- 4차원 평가: 기능성, 디자인 품질, 독창성, 기술적 완성도

## 비용/시간 참고

- Planner: ~5분, ~$0.50 | Generator: 1~3시간, $70~110 | Evaluator: ~10분/회, ~$3~4/회
- 전체 1회 사이클: 약 $125~200, 3~6시간 (Anthropic 실측 기준)

## 참조 파일

| 파일 | 용도 |
|------|------|
| `prompts/planner.md` | Planner 에이전트 프롬프트 |
| `prompts/generator.md` | Generator 에이전트 프롬프트 |
| `prompts/evaluator.md` | Evaluator 에이전트 프롬프트 |
| `templates/requirements-template.md` | 요구사항 입력 표준 포맷 |
| `templates/spec-template.md` | 스펙 문서 템플릿 |
| `templates/evaluation-criteria.md` | 평가 기준 (4차원 + few-shot) |
| `templates/calibration-guide.md` | Evaluator 캘리브레이션 가이드 |
| `projects/{name}/claude-progress.txt` | 진행 상태 추적 (컨텍스트 소진 시 재개용 안전망) |
