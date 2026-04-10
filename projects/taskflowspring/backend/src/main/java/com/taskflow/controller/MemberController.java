package com.taskflow.controller;

import com.taskflow.entity.Member;
import com.taskflow.repository.MemberRepository;
import com.taskflow.repository.TaskRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberRepository memberRepository;
    private final TaskRepository taskRepository;

    public MemberController(MemberRepository memberRepository, TaskRepository taskRepository) {
        this.memberRepository = memberRepository;
        this.taskRepository = taskRepository;
    }

    @GetMapping
    public List<Member> getAll() {
        return memberRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Member> getById(@PathVariable Long id) {
        return memberRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/tasks")
    public ResponseEntity<?> getMemberTasks(@PathVariable Long id) {
        if (!memberRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(taskRepository.findByAssigneeIdOrderByPositionAsc(id));
    }

    @GetMapping("/with-task-count")
    public List<Map<String, Object>> getAllWithTaskCount() {
        return memberRepository.findAll().stream().map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("name", m.getName());
            map.put("email", m.getEmail());
            map.put("role", m.getRole());
            map.put("avatarUrl", m.getAvatarUrl());
            map.put("taskCount", taskRepository.countByAssigneeId(m.getId()));
            return map;
        }).toList();
    }
}
