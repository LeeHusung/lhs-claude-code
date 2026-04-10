package com.taskflow.config;

import com.taskflow.entity.Member;
import com.taskflow.entity.Notification;
import com.taskflow.entity.Task;
import com.taskflow.repository.MemberRepository;
import com.taskflow.repository.NotificationRepository;
import com.taskflow.repository.TaskRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final MemberRepository memberRepository;
    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;

    public DataInitializer(MemberRepository memberRepository, TaskRepository taskRepository, NotificationRepository notificationRepository) {
        this.memberRepository = memberRepository;
        this.taskRepository = taskRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    public void run(String... args) {
        if (memberRepository.count() > 0) return;

        Member m1 = memberRepository.save(new Member("김민수", "minsu@abc.com", "PM", null));
        Member m2 = memberRepository.save(new Member("이지은", "jieun@abc.com", "백엔드 개발", null));
        Member m3 = memberRepository.save(new Member("박서준", "seojun@abc.com", "UI 디자이너", null));
        Member m4 = memberRepository.save(new Member("최예린", "yerin@abc.com", "프론트엔드 개발", null));
        Member m5 = memberRepository.save(new Member("정하은", "haeun@abc.com", "QA", null));

        LocalDate today = LocalDate.now();

        // To Do (5)
        createTask("API 문서 작성", "REST API 엔드포인트 문서를 Swagger로 작성", "TODO", "HIGH", m1, today.plusDays(1), 0);
        createTask("에러 로깅 시스템 설계", "중앙 집중식 로깅 아키텍처 문서화", "TODO", "MEDIUM", m2, today.plusDays(5), 1);
        createTask("모바일 와이어프레임", "모바일 앱 주요 화면 와이어프레임 작성", "TODO", "MEDIUM", m3, today.plusDays(7), 2);
        createTask("테스트 케이스 작성", "핵심 기능 테스트 시나리오 정리", "TODO", "LOW", m5, today.plusDays(10), 3);
        createTask("배포 스크립트 준비", "CI/CD 파이프라인 설정 문서화", "TODO", "LOW", m2, today.plusDays(14), 4);

        // In Progress (4)
        createTask("사용자 인증 모듈 개발", "JWT 기반 인증 시스템 구현 중", "IN_PROGRESS", "HIGH", m2, today.plusDays(2), 0);
        createTask("디자인 리뷰", "v2.0 디자인 시안 팀 리뷰 진행", "IN_PROGRESS", "MEDIUM", m3, today.plusDays(3), 1);
        createTask("대시보드 컴포넌트 구현", "차트 및 통계 위젯 개발 중", "IN_PROGRESS", "HIGH", m4, today.plusDays(4), 2);
        createTask("성능 테스트", "API 응답 속도 및 부하 테스트", "IN_PROGRESS", "MEDIUM", m5, today.plusDays(6), 3);

        // Review (3)
        createTask("회원가입 플로우", "이메일 인증 포함 회원가입 기능", "REVIEW", "HIGH", m4, today.plusDays(1), 0);
        createTask("결제 모듈 연동", "PG사 API 연동 및 테스트", "REVIEW", "MEDIUM", m2, today.plusDays(3), 1);
        createTask("접근성 감사", "WCAG 2.1 AA 기준 접근성 점검", "REVIEW", "LOW", m3, today.plusDays(8), 2);

        // Done (6)
        createTask("프로젝트 초기 설정", "Spring Boot + React 프로젝트 구조 수립", "DONE", "HIGH", m1, today.minusDays(5), 0);
        createTask("DB 스키마 설계", "ERD 작성 및 테이블 생성", "DONE", "HIGH", m2, today.minusDays(3), 1);
        createTask("로그인 페이지 UI", "로그인/회원가입 페이지 디자인 완료", "DONE", "MEDIUM", m3, today.minusDays(2), 2);
        createTask("공통 컴포넌트 개발", "버튼, 인풋, 모달 등 공통 UI 라이브러리", "DONE", "MEDIUM", m4, today.minusDays(4), 3);
        createTask("개발환경 세팅 가이드", "팀원 온보딩용 개발환경 문서 작성", "DONE", "LOW", m1, today.minusDays(7), 4);
        createTask("QA 체크리스트 작성", "1차 릴리즈용 QA 항목 정리 완료", "DONE", "LOW", m5, today.minusDays(1), 5);

        // Notifications
        createNotification(m1, "마감 임박: 'API 문서 작성' (D-1)", "DEADLINE", taskRepository.findByStatusOrderByPositionAsc("TODO").get(0));
        createNotification(m4, "마감 임박: '회원가입 플로우' (D-1)", "DEADLINE", taskRepository.findByStatusOrderByPositionAsc("REVIEW").get(0));
        createNotification(m2, "마감 임박: '사용자 인증 모듈 개발' (D-2)", "DEADLINE", taskRepository.findByStatusOrderByPositionAsc("IN_PROGRESS").get(0));
        createNotification(m3, "새 업무 할당: '디자인 리뷰'", "ASSIGNMENT", taskRepository.findByStatusOrderByPositionAsc("IN_PROGRESS").get(1));
        createNotification(m5, "새 업무 할당: '성능 테스트'", "ASSIGNMENT", taskRepository.findByStatusOrderByPositionAsc("IN_PROGRESS").get(3));
    }

    private void createTask(String title, String desc, String status, String priority, Member assignee, LocalDate dueDate, int position) {
        Task t = new Task();
        t.setTitle(title);
        t.setDescription(desc);
        t.setStatus(status);
        t.setPriority(priority);
        t.setAssignee(assignee);
        t.setDueDate(dueDate);
        t.setPosition(position);
        taskRepository.save(t);
    }

    private void createNotification(Member recipient, String message, String type, Task relatedTask) {
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setMessage(message);
        n.setType(type);
        n.setRelatedTask(relatedTask);
        n.setIsRead(false);
        n.setCreatedAt(LocalDateTime.now().minusMinutes((long) (Math.random() * 60)));
        notificationRepository.save(n);
    }
}
