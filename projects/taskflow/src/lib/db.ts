import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "taskflow.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
    seedIfEmpty(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      avatar_color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      due_date TEXT,
      assignee_id INTEGER REFERENCES users(id),
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      task_id INTEGER REFERENCES tasks(id),
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function seedIfEmpty(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM users").get() as {
    c: number;
  };
  if (count.c > 0) return;

  const insertUser = db.prepare(
    "INSERT INTO users (name, email, role, avatar_color) VALUES (?, ?, ?, ?)"
  );
  const users = [
    ["김민수", "minsu@abccorp.com", "프론트엔드 개발자", "#E3B341"],
    ["이지은", "jieun@abccorp.com", "백엔드 개발자", "#58A6FF"],
    ["박준호", "junho@abccorp.com", "디자이너", "#3FB950"],
    ["최서연", "seoyeon@abccorp.com", "PM", "#F85149"],
    ["정태웅", "taewoong@abccorp.com", "QA 엔지니어", "#A371F7"],
  ];
  for (const u of users) {
    insertUser.run(...u);
  }

  const insertTask = db.prepare(
    "INSERT INTO tasks (title, description, status, priority, due_date, assignee_id, position) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  const tasks = [
    // To Do (5)
    ["모바일 반응형 레이아웃 구현", "각 주요 화면의 모바일 뷰포트 대응 작업", "todo", "medium", "2026-04-16", 1, 0],
    ["결제 API 에러 핸들링", "결제 실패 시 사용자에게 적절한 에러 메시지를 표시하고 재시도 로직 구현", "todo", "high", "2026-04-12", 2, 1],
    ["사용자 프로필 페이지 디자인", "프로필 편집, 아바타 변경, 알림 설정 UI 디자인", "todo", "low", "2026-04-18", 3, 2],
    ["로딩 스피너 컴포넌트 추가", "API 호출 시 표시할 공통 로딩 인디케이터 컴포넌트 제작", "todo", "low", "2026-04-17", 1, 3],
    ["데이터 백업 스크립트 작성", "주기적 DB 백업을 위한 자동화 스크립트 구현", "todo", "medium", "2026-04-15", 5, 4],

    // In Progress (3)
    ["실시간 알림 시스템 구현", "WebSocket 기반 실시간 알림 전달 시스템 개발", "in_progress", "high", "2026-04-11", 2, 0],
    ["대시보드 차트 인터랙션 추가", "차트 호버 시 툴팁, 클릭 시 상세 데이터 표시 기능", "in_progress", "medium", "2026-04-14", 1, 1],
    ["API 응답 캐싱 레이어 설계", "Redis 기반 API 응답 캐싱 전략 설계 및 구현", "in_progress", "high", "2026-04-13", 2, 2],

    // In Review (2)
    ["검색 자동완성 UI 구현", "검색어 입력 시 실시간 자동완성 드롭다운 표시", "in_review", "medium", "2026-04-12", 3, 0],
    ["테스트 커버리지 리포트 생성", "Jest 커버리지 리포트 자동 생성 및 CI 연동", "in_review", "low", "2026-04-15", 5, 1],

    // Done (7)
    ["로그인 페이지 UI 구현", "이메일/비밀번호 입력 폼 및 소셜 로그인 버튼 구현", "done", "high", "2026-04-05", 1, 0],
    ["사용자 인증 API 개발", "JWT 기반 인증/인가 API 엔드포인트 구현", "done", "high", "2026-04-06", 2, 1],
    ["메인 레이아웃 시스템 설계", "사이드바, 헤더, 메인 콘텐츠 영역의 반응형 레이아웃 설계", "done", "medium", "2026-04-04", 3, 2],
    ["프로젝트 요구사항 분석", "클라이언트 미팅 후 요구사항 문서 정리 및 우선순위 결정", "done", "high", "2026-04-03", 4, 3],
    ["코드 리뷰 가이드라인 작성", "팀 코드 리뷰 프로세스 및 체크리스트 문서화", "done", "medium", "2026-04-07", 4, 4],
    ["스테이징 환경 배포 설정", "Docker 기반 스테이징 환경 구성 및 CI/CD 파이프라인 설정", "done", "medium", "2026-04-08", 5, 5],
    ["UI 컴포넌트 스타일 가이드", "디자인 시스템 기반 UI 컴포넌트 라이브러리 문서화", "done", "low", "2026-04-09", 3, 6],
  ];

  for (const t of tasks) {
    insertTask.run(...t);
  }

  // Seed notifications for demo
  const insertNotification = db.prepare(
    "INSERT INTO notifications (user_id, task_id, type, message, read, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  );

  // Notifications for 김민수 (id: 1)
  insertNotification.run(1, 6, "due_soon", '"실시간 알림 시스템 구현" 마감이 1일 남았습니다', 0, "2026-04-10T09:00:00");
  insertNotification.run(1, 7, "due_soon", '"대시보드 차트 인터랙션 추가" 마감이 4일 남았습니다', 0, "2026-04-10T09:00:00");
  insertNotification.run(1, 1, "assigned", '"모바일 반응형 레이아웃 구현" 업무가 할당되었습니다', 1, "2026-04-09T14:30:00");

  // Notifications for 이지은 (id: 2)
  insertNotification.run(2, 6, "due_soon", '"실시간 알림 시스템 구현" 마감이 1일 남았습니다', 0, "2026-04-10T09:00:00");
  insertNotification.run(2, 2, "assigned", '"결제 API 에러 핸들링" 업무가 할당되었습니다', 0, "2026-04-10T10:00:00");

  // Notifications for 박준호 (id: 3)
  insertNotification.run(3, 9, "due_soon", '"검색 자동완성 UI 구현" 마감이 2일 남았습니다', 0, "2026-04-10T09:00:00");
}

export default getDb;
