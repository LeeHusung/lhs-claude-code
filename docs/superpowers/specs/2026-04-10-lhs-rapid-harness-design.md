# LHS Rapid Development Harness — Design Spec

## Context

고객사의 정리된 요구사항을 입력하면 1~2일 내에 데모용 풀스택 웹 애플리케이션을 구축하는 Claude Code 하네스 시스템. 기술 스택은 프로젝트마다 다르며, Plan 승인 후 나머지는 최대한 자동으로 실행. UI/UX 완성도와 핵심 기능 동작 모두 중요.

Anthropic의 3-Agent Harness 패턴(Planner → Generator → Evaluator)을 기반으로 구성. 커스텀 스킬/훅 없이 CLAUDE.md + 에이전트별 프롬프트 + 템플릿으로 하네스를 제어.

## Architecture

```
요구사항 입력 (requirements.md)
         │
         ▼
┌──────────────────┐
│  PLANNER (Opus)  │  요구사항 → 스펙 + 기술 스택 + 태스크 분해
└────────┬─────────┘
         ▼
   [사용자 Plan 승인]
         ▼
┌──────────────────┐
│ GENERATOR(Sonnet)│  병렬 서브에이전트로 피처별 구현
│ ┌──┐ ┌──┐ ┌──┐  │  Git 커밋 체크포인트
│ │F1│ │F2│ │F3│  │  claude-progress.txt 업데이트
│ └──┘ └──┘ └──┘  │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ EVALUATOR (Opus) │  Playwright MCP로 UI/기능 자동 검증
│  점수 < 70 ──────│──→ Generator 재실행 (자동 루프)
│  점수 ≥ 70 ──────│──→ DELIVER
└────────┬─────────┘
         ▼
┌──────────────────┐
│     DELIVER      │  빌드 확인 + 실행 가이드 + 결과 보고
└──────────────────┘
```

### 핵심 원칙

- **관심사 분리**: 계획/실행/평가를 별도 에이전트로 분리 (자기 평가 편향 방지)
- **모델 분리**: Planner·Evaluator는 Opus (판단력), Generator는 Sonnet (속도/비용)
- **상태 전달**: claude-progress.txt + Git으로 컨텍스트 윈도우 간 연속성
- **자동 품질 수렴**: Evaluator 실패 → Generator 재실행 루프 (최대 3회, 사람 개입 불필요)
- **YAGNI**: 데모 범위 밖 기능은 절대 구현하지 않음

## Directory Structure

```
lhs-claude-code/
├── CLAUDE.md                          # 마스터 컨텍스트 (항상 로드)
├── prompts/
│   ├── planner.md                     # Planner Agent 프롬프트
│   ├── generator.md                   # Generator Agent 프롬프트
│   └── evaluator.md                   # Evaluator Agent 프롬프트
├── templates/
│   ├── requirements-template.md       # 요구사항 입력 표준 포맷
│   ├── spec-template.md               # 스펙 문서 템플릿
│   └── evaluation-criteria.md         # 평가 기준 + few-shot 예시
└── projects/                          # 생성 프로젝트 (gitignore)
    └── {project-name}/
        ├── requirements.md            # 입력된 요구사항
        ├── claude-progress.txt        # 세션 간 상태 추적
        ├── spec.md                    # Planner 생성 스펙
        ├── implementation-plan.md     # 태스크 분해 계획
        ├── evaluation-report.md       # Evaluator 결과
        └── src/                       # 소스코드
```

## Agent Prompts

### Planner Agent (`prompts/planner.md`)

**입력**: `projects/{name}/requirements.md`
**출력**: `spec.md`, `implementation-plan.md`

역할:
1. 요구사항 문서를 읽고 분석
2. 프로젝트 특성에 맞는 기술 스택 자율 결정 (제약사항이 없는 경우)
3. 각 기능의 상세 스펙 확장 (UI 와이어프레임 텍스트 설명 포함)
4. 구현 태스크를 병렬 실행 가능한 단위로 분해
5. 태스크 간 의존성 명시 (순서가 필요한 경우)
6. 데모 일정 기반 우선순위 조정 (필수 → 권장 → 선택)

`implementation-plan.md` 구조:
```markdown
## 기술 스택
- Frontend: {선택 이유}
- Backend: {선택 이유}
- DB: {선택 이유}

## 태스크 목록
### Phase A: 프로젝트 스캐폴딩 (순차)
- Task 0: 프로젝트 초기화 + 기본 설정

### Phase B: 병렬 구현
- Task 1: {기능명} — 예상 복잡도: 낮음/중간/높음
- Task 2: {기능명} — 의존: Task 1
- Task 3: {기능명} — 병렬 가능

### Phase C: 통합 + 마무리 (순차)
- Task N: 통합 테스트 + 빌드 확인
```

### Generator Agent (`prompts/generator.md`)

**입력**: `implementation-plan.md`, `spec.md`
**출력**: 소스코드 (Git 커밋), `claude-progress.txt` 업데이트

역할:
1. `claude-progress.txt`를 먼저 읽어 현재 상태 파악
2. `implementation-plan.md`의 태스크를 순서대로 실행
3. 병렬 가능한 태스크는 서브에이전트(Agent tool)로 동시 실행
4. 각 태스크 완료 시:
   - 의미 있는 Git 커밋
   - `claude-progress.txt` 업데이트 (완료 항목 체크)
5. 모든 태스크 완료 후:
   - 빌드 성공 확인
   - 개발 서버 실행 가능 상태 확인

Generator 프롬프트 핵심 지시:
- Sonnet 모델 사용 (서브에이전트에 `model: "sonnet"` 지정)
- 서브에이전트에게 spec.md의 해당 기능 부분만 발췌하여 컨텍스트 전달
- 코드 품질보다 동작하는 데모를 우선
- 데모 범위 밖 에러 핸들링/최적화는 스킵

### Evaluator Agent (`prompts/evaluator.md`)

**입력**: 실행 중인 앱, `spec.md`, `evaluation-criteria.md`
**출력**: `evaluation-report.md`, (실패 시) claude-progress.txt에 피드백 기록

역할:
1. 앱 빌드 및 개발 서버 실행
2. Playwright MCP(또는 Claude Preview MCP)로 앱에 접속
3. `evaluation-criteria.md`의 채점 기준에 따라 검증:
   - 각 핵심 기능을 실제로 클릭/입력하며 동작 확인
   - 스크린샷 캡처로 UI/UX 시각적 검증
   - 브라우저 콘솔 에러 확인
   - 반응형 동작 확인 (요구 시)
4. 항목별 점수 산출 → 종합 점수
5. 70점 이상: PASS → 최종 결과 보고
6. 70점 미만: FAIL → 구체적 수정 사항을 `claude-progress.txt`에 기록 → Generator 재실행 지시

## Templates

### requirements-template.md

```markdown
# 프로젝트 요구사항

## 1. 프로젝트 개요
- **프로젝트명**: 
- **고객사**: 
- **목적**: (이 소프트웨어가 해결하려는 문제)
- **데모 일정**: (날짜)

## 2. 핵심 기능 (우선순위순)
1. [기능명]: [설명] — 우선순위: 필수/권장/선택
2. ...

## 3. UI/UX 요구사항
- **디자인 톤**: (모던/미니멀/비즈니스/기타)
- **레퍼런스**: (참고 사이트나 스크린샷 경로)
- **반응형**: 필요/불필요
- **핵심 화면**: (필수 화면 목록)

## 4. 기술 제약사항 (있는 경우)
- **지정 스택**: (고객이 특정 기술을 요구하는 경우)
- **기존 시스템 연동**: (API, DB 등)
- **배포 환경**: (AWS/Vercel/Docker/기타)

## 5. 데모 범위
- **포함**: (데모에서 보여줄 범위)
- **제외**: (이번 데모에서 제외할 것)
- **더미 데이터**: (필요한 샘플 데이터 설명)
```

### evaluation-criteria.md

```markdown
# 평가 기준

## 기능 검증 (50점)
각 핵심 기능에 대해:
- 정상 동작 여부: 10점
- 콘솔 에러 없음: 5점
- 기본 엣지 케이스 처리: 5점

## UI/UX 검증 (50점)
- 레이아웃 깨짐 없음: 10점
- 반응형 동작 (지정 시): 10점
- 시각적 일관성 (폰트, 색상, 간격): 10점
- 로딩/전환 자연스러움: 10점
- 빈 상태/에러 상태 처리: 10점

## 합격 기준
- 70점 이상: PASS → Deliver 단계로 진행
- 70점 미만: FAIL → 구체적 피드백과 함께 Generator 재실행

## Few-shot 평가 예시

### 예시 1: PASS (85점)
기능 (43/50): 로그인 정상(10), 대시보드 로드(10), 검색(10), 콘솔 에러 없음(5), 필터 엣지케이스 미처리(-2)
UI/UX (42/50): 깔끔한 레이아웃(10), 반응형 OK(10), 색상 일관(10), 전환 자연스러움(8), 빈 상태 미처리(4)

### 예시 2: FAIL (55점)
기능 (30/50): 로그인 OK(10), 결제 에러(-10), 검색 미구현(0), 콘솔 에러 다수(-5)
UI/UX (25/50): 메인 깨짐(-10), 반응형 미동작(-10), 색상 불일관(5), 전환 버벅임(5)
```

## CLAUDE.md

```markdown
# LHS Rapid Development Harness

## 목적
고객 데모용 풀스택 웹앱을 1~2일 내 구축하는 3-Agent 시스템.

## 워크플로우
1. Planner: `prompts/planner.md` 참조 → 요구사항 분석, 스펙·계획 생성
2. 사용자 Plan 승인 후 진행
3. Generator: `prompts/generator.md` 참조 → 병렬 서브에이전트로 구현
4. Evaluator: `prompts/evaluator.md` 참조 → Playwright MCP로 자동 검증
5. 실패 시 Generator 재실행, 성공 시 Deliver

## 핵심 규칙
- 항상 `projects/{name}/claude-progress.txt`를 먼저 읽어 현재 상태 파악
- Generator는 피처별 서브에이전트를 병렬 실행 (model: sonnet)
- 모든 의미 있는 변경은 Git 커밋
- Evaluator 실패 시 피드백을 claude-progress.txt에 기록 후 Generator 재실행
- 데모 범위를 벗어나는 기능은 절대 구현하지 않음

## 품질 기준
- `templates/evaluation-criteria.md` 참조
- 합격: 70점 이상
- UI/UX 완성도와 기능 동작 모두 중요

## 참조
- 요구사항: `projects/{name}/requirements.md`
- 스펙: `projects/{name}/spec.md`
- 계획: `projects/{name}/implementation-plan.md`
- 진행: `projects/{name}/claude-progress.txt`
- 평가: `projects/{name}/evaluation-report.md`
```

## Operation Guide

### 실행 모델: 단일 세션 오케스트레이션

사용자의 "Plan 승인 후 나머지 자동" 요구를 충족하기 위해, **하나의 Claude 세션**이 전체 워크플로우를 오케스트레이션한다. CLAUDE.md가 세션 시작 시 로드되어 에이전트에게 3-Phase 워크플로우를 지시한다.

```bash
# 1. 프로젝트 디렉토리 생성 + 요구사항 작성
mkdir -p projects/{project-name}
# projects/{project-name}/requirements.md를 templates/requirements-template.md 참고하여 작성

# 2. 단일 세션으로 전체 하네스 실행
claude "projects/{project-name} 프로젝트를 시작해줘"
```

### 세션 내 흐름

1. **Phase 1 (Planner)**: CLAUDE.md 지시에 따라 `prompts/planner.md`를 읽고 요구사항 분석 → spec.md + implementation-plan.md 생성 → 사용자에게 Plan 제시
2. **사용자 승인**: 사용자가 Plan을 검토하고 승인 (이 단계만 사람 개입)
3. **Phase 2 (Generator)**: 승인 즉시 `prompts/generator.md`를 읽고 구현 시작 → 서브에이전트로 병렬 구현 → claude-progress.txt 업데이트
4. **Phase 3 (Evaluator)**: 구현 완료 후 `prompts/evaluator.md`를 읽고 자동 검증
5. **자동 루프**: Evaluator 점수 < 70 → claude-progress.txt에 피드백 기록 → Generator 프롬프트를 다시 읽고 수정 구현 → 재평가 (최대 3회)
6. **Deliver**: 합격 시 최종 빌드 확인 + 실행 가이드 생성

### 컨텍스트 윈도우 전략

단일 세션이 길어져 컨텍스트가 부족해질 경우:
- claude-progress.txt가 현재 상태를 보존
- 새 세션을 시작해도 claude-progress.txt를 읽으면 이어서 작업 가능
- Git 히스토리로 코드 변경 이력 추적

## Verification

구현 완료 후 검증 방법:
1. **구조 확인**: 모든 파일이 올바른 위치에 생성되었는지 확인
2. **Planner 테스트**: 샘플 요구사항으로 Planner 실행 → spec.md, implementation-plan.md 생성 확인
3. **Generator 테스트**: Planner 출력으로 Generator 실행 → 코드 생성 + Git 커밋 확인
4. **Evaluator 테스트**: 생성된 앱으로 Evaluator 실행 → evaluation-report.md 생성 + 점수 산출 확인
5. **End-to-End**: 전체 3-Phase를 연속 실행하여 요구사항 → 동작하는 앱 → 평가 보고서 완성

## Sources

이 설계는 다음 자료를 기반으로 함:
- Anthropic, "Harness design for long-running application development" (2026.04)
- Anthropic, "Effective harnesses for long-running agents" (2026.04)
- Anthropic, "Scaling Managed Agents" (2026.04)
- Anthropic, "Building Effective AI Agents" (research)
